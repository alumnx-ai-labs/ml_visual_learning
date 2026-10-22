from collections import deque

import numpy as np
from sklearn.metrics import adjusted_rand_score, silhouette_score

from .common import r

SPEC = dict(
    id="dbscan", name="DBSCAN (density clustering)", category="unsupervised", tasks=["unsupervised"], needs_2d=True,
    params=[
        dict(key="eps", label="Neighbourhood radius (ε)", min=0.05, max=1.0, step=0.01, default=0.25,
             help="How close two points must be to count as neighbours. Too small → everything is noise; too big → clusters merge."),
        dict(key="min_samples", label="Min neighbours (minPts)", min=2, max=15, step=1, default=5,
             help="A point with at least this many neighbours (itself included) inside ε is a 'core' point."),
    ],
)


def run(X, y, tr, te, params):
    eps, min_pts = float(params["eps"]), int(params["min_samples"])
    n = len(X)
    D = np.sqrt(((X[:, None] - X[None]) ** 2).sum(-1))
    nbrs = [np.flatnonzero(D[i] <= eps) for i in range(n)]
    is_core = np.array([len(nb) >= min_pts for nb in nbrs])

    labels = np.full(n, -2)  # -2 unvisited, -1 noise
    events = []  # the story: (point, cluster label, role)
    c = -1
    for i in range(n):
        if labels[i] != -2:
            continue
        if not is_core[i]:
            labels[i] = -1
            events.append(dict(p=i, label=-1, role="noise", n=len(nbrs[i])))
            continue
        c += 1
        labels[i] = c
        events.append(dict(p=i, label=c, role="core", n=len(nbrs[i])))
        queue = deque(nbrs[i])
        while queue:
            j = queue.popleft()
            if labels[j] == -1:  # earlier called noise -> actually a border point
                labels[j] = c
                events.append(dict(p=int(j), label=c, role="border", n=len(nbrs[j])))
            if labels[j] != -2:
                continue
            labels[j] = c
            role = "core" if is_core[j] else "border"
            events.append(dict(p=int(j), label=c, role=role, n=len(nbrs[j])))
            if is_core[j]:
                queue.extend(nbrs[j])

    roles = np.where(is_core, "core", np.where(labels >= 0, "border", "noise"))
    mask = labels >= 0
    sil = float(silhouette_score(X[mask], labels[mask])) if len(set(labels[mask])) > 1 else None
    kd = np.sort(np.sort(D, axis=1)[:, min(min_pts - 1, n - 1)])

    return dict(
        events=events,
        labels=labels.tolist(),
        roles=roles.tolist(),
        neighbor_counts=[len(nb) for nb in nbrs],
        k_distance=r(kd, 3),
        metrics=dict(clusters=int(c + 1), noise=int((labels == -1).sum()), core=int(is_core.sum()),
                     silhouette=r(sil) if sil is not None else None, adjusted_rand=r(adjusted_rand_score(y, labels))),
    )
