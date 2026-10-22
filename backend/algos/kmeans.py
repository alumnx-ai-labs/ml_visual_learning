import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score

from .common import r

SPEC = dict(
    id="kmeans", name="K-Means Clustering", category="unsupervised", tasks=["unsupervised"], needs_2d=True,
    params=[
        dict(key="k", label="Number of clusters (k)", min=2, max=8, step=1, default=3,
             help="How many groups to look for. You choose this — the algorithm cannot know it."),
        dict(key="init", label="Starting centroids", type="select", default="random",
             options=[dict(value="random", label="Random data points"), dict(value="plusplus", label="K-Means++ (spread out)")],
             help="Where the first centroids are dropped. Bad starts can give bad clusters; K-Means++ spreads them out."),
        dict(key="seed", label="Init seed", min=0, max=30, step=1, default=1,
             help="Different seed = different random starting centroids. Try several and compare!"),
        dict(key="max_iter", label="Max iterations", min=1, max=30, step=1, default=15,
             help="Safety cap on assign/update rounds."),
    ],
)


def _init(X, k, kind, rng):
    if kind == "plusplus":
        c = [X[rng.integers(len(X))]]
        for _ in range(k - 1):
            d2 = np.min(((X[:, None] - np.array(c)[None]) ** 2).sum(-1), axis=1)
            c.append(X[rng.choice(len(X), p=d2 / d2.sum())])
        return np.array(c)
    return X[rng.choice(len(X), k, replace=False)]


def run(X, y, tr, te, params):
    k, kind, max_iter = int(params["k"]), params["init"], int(params["max_iter"])
    rng = np.random.default_rng(int(params["seed"]))
    cent = _init(X, k, kind, rng)
    init_centroids = cent.copy()

    iters = []
    for it in range(max_iter):
        d = ((X[:, None] - cent[None]) ** 2).sum(-1)
        labels = d.argmin(1)
        inertia = float(d[np.arange(len(X)), labels].sum())
        new = np.array([X[labels == j].mean(0) if np.any(labels == j) else cent[j] for j in range(k)])
        shift = float(np.abs(new - cent).max())
        iters.append(dict(labels=labels.tolist(), centroids_before=r(cent), centroids_after=r(new),
                          inertia=r(inertia), shift=r(shift, 5), sizes=np.bincount(labels, minlength=k).tolist()))
        cent = new
        if shift < 1e-6:
            break

    labels = iters[-1]["labels"]
    sil = float(silhouette_score(X, labels)) if len(set(labels)) > 1 else None

    ks = list(range(1, 9))
    inertias = [float(KMeans(n_clusters=kk, n_init=5, random_state=0).fit(X).inertia_) for kk in ks]
    sils = [None] + [float(silhouette_score(X, KMeans(n_clusters=kk, n_init=5, random_state=0).fit_predict(X))) for kk in ks[1:]]

    return dict(
        init_centroids=r(init_centroids),
        iterations=iters,
        converged=bool(iters[-1]["shift"] < 1e-5),
        metrics=dict(inertia=iters[-1]["inertia"], silhouette=r(sil) if sil is not None else None,
                     iterations=len(iters), adjusted_rand=r(adjusted_rand_score(y, labels))),
        elbow=dict(k=ks, inertia=r(np.array(inertias), 3), silhouette=[r(s) if s is not None else None for s in sils]),
    )
