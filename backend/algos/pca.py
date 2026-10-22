import numpy as np

from .common import r

SPEC = dict(
    id="pca", name="PCA (dimensionality reduction)", category="unsupervised", tasks=["unsupervised"], needs_2d=False,
    params=[
        dict(key="standardize", label="Rescale features first", type="select", default="yes",
             options=[dict(value="yes", label="Yes (z-score)"), dict(value="no", label="No (raw units)")],
             help="PCA chases variance, so a feature measured in big units dominates. Rescaling puts all features on equal footing."),
        dict(key="n_components", label="Components to keep", min=1, max=4, step=1, default=1,
             help="How many principal directions to keep. In 2D, 1 component means squashing all points onto a single line."),
    ],
)


def run(X, y, tr, te, params):
    n, d = X.shape
    Xc = X - X.mean(0)
    scale = X.std(0) if params["standardize"] == "yes" else np.ones(d)
    Z = Xc / scale
    cov = np.cov(Z.T).reshape(d, d)
    vals, vecs = np.linalg.eigh(cov)
    order = np.argsort(vals)[::-1]
    vals, vecs = vals[order], vecs[:, order]
    for j in range(d):  # sign convention so results are stable between runs
        if vecs[np.argmax(np.abs(vecs[:, j])), j] < 0:
            vecs[:, j] *= -1
    scores = Z @ vecs
    ratio = vals / vals.sum()

    k = max(1, min(int(params["n_components"]), d))
    recon_err = []
    for kk in range(1, d + 1):
        rec = scores[:, :kk] @ vecs[:, :kk].T
        recon_err.append(float(np.mean(((Z - rec) ** 2).sum(1))))

    out = dict(
        dims=d, k=k, standardized=params["standardize"] == "yes",
        mean=r(X.mean(0)), scale=r(scale), centered=r(Z),
        eigenvalues=r(vals), ratio=r(ratio), cumulative=r(np.cumsum(ratio)),
        components=r(vecs.T),  # row j = j-th principal direction
        scores=r(scores[:, :min(d, 4)]),
        reconstruction_error=r(np.array(recon_err)),
        metrics=dict(explained=r(ratio[:k].sum()), kept=k, total_variance=r(vals.sum())),
    )
    if d == 2:
        angles = np.deg2rad(np.arange(0, 181, 3))
        dirs = np.c_[np.cos(angles), np.sin(angles)]
        proj_var = ((Z @ dirs.T) ** 2).mean(0) * n / (n - 1)
        out["rotation"] = dict(angles_deg=np.arange(0, 181, 3).tolist(), variance=r(proj_var),
                               total=r(vals.sum()), best_deg=r(np.rad2deg(np.arctan2(vecs[1, 0], vecs[0, 0])) % 180, 2))
        rec = scores[:, :k] @ vecs[:, :k].T
        out["reconstructed"] = r(rec)
    return out
