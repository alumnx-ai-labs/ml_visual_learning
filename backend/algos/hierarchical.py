import numpy as np
from scipy.cluster.hierarchy import dendrogram, fcluster, linkage
from sklearn.metrics import adjusted_rand_score, silhouette_score

from .common import r

SPEC = dict(
    id="hierarchical", name="Hierarchical Clustering", category="unsupervised", tasks=["unsupervised"], needs_2d=True,
    params=[
        dict(key="n_clusters", label="Clusters to cut into", min=2, max=8, step=1, default=3,
             help="Where to cut the family tree. Cutting higher gives fewer, bigger groups."),
        dict(key="linkage", label="Linkage", type="select", default="average",
             options=[dict(value="average", label="Average"), dict(value="ward", label="Ward"),
                      dict(value="complete", label="Complete"), dict(value="single", label="Single")],
             help="How the distance between two groups is measured when deciding who merges next."),
    ],
)


def run(X, y, tr, te, params):
    k, method = int(params["n_clusters"]), params["linkage"]
    n = len(X)
    Z = linkage(X, method=method)
    order = dendrogram(Z, no_plot=True)["leaves"]  # left-to-right leaf order that avoids crossing lines
    pos = {leaf: i for i, leaf in enumerate(order)}

    # per-merge geometry so the UI can draw the tree one merge at a time
    node_x = {i: float(pos[i]) for i in range(n)}
    node_h = {i: 0.0 for i in range(n)}
    merges = []
    for m, (a, b, d, size) in enumerate(Z):
        a, b = int(a), int(b)
        x = (node_x[a] + node_x[b]) / 2
        merges.append(dict(a=a, b=b, dist=r(d, 4), size=int(size), xa=node_x[a], xb=node_x[b],
                           ha=r(node_h[a], 4), hb=r(node_h[b], 4), x=x, new=n + m))
        node_x[n + m], node_h[n + m] = x, float(d)

    def labels_at(kk):
        return (fcluster(Z, t=kk, criterion="maxclust") - 1).tolist()

    labels = labels_at(k)
    # a cut line sits between the (k-1)-th and k-th largest merge distances
    dists = np.sort(Z[:, 2])
    cut = float((dists[n - k - 1] + dists[n - k]) / 2) if 1 < k < n else float(dists[-1] * 1.05)

    return dict(
        order=order, merges=merges, labels=labels, cut_height=r(cut, 4), max_height=r(Z[:, 2].max(), 4),
        labels_by_k={str(kk): labels_at(kk) for kk in range(2, 9)},
        metrics=dict(clusters=k, silhouette=r(silhouette_score(X, labels)) if len(set(labels)) > 1 else None,
                     adjusted_rand=r(adjusted_rand_score(y, labels))),
    )
