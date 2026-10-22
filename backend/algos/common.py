import numpy as np
from sklearn import metrics as M


def r(a, nd=4):
    """Round numpy -> plain JSON-friendly python (lists / floats)."""
    a = np.asarray(a)
    if a.ndim == 0:
        v = float(a)
        return round(v, nd) if np.isfinite(v) else None
    return np.round(a.astype(float), nd).tolist()


def regression_metrics(y, p):
    return dict(
        r2=r(M.r2_score(y, p)),
        rmse=r(np.sqrt(M.mean_squared_error(y, p))),
        mae=r(M.mean_absolute_error(y, p)),
    )


def classification_metrics(y, p, proba=None):
    out = dict(
        accuracy=r(M.accuracy_score(y, p)),
        precision=r(M.precision_score(y, p, zero_division=0)),
        recall=r(M.recall_score(y, p, zero_division=0)),
        f1=r(M.f1_score(y, p, zero_division=0)),
        confusion=M.confusion_matrix(y, p, labels=[0, 1]).tolist(),
    )
    if proba is not None:
        out["log_loss"] = r(M.log_loss(y, np.clip(proba, 1e-7, 1 - 1e-7), labels=[0, 1]))
    return out


def grid_2d(X, res=40, pad=0.08):
    """Regular grid covering the data; returns xs, ys and flattened points (row-major: y outer, x inner)."""
    lo, hi = X.min(0), X.max(0)
    span = hi - lo
    lo, hi = lo - pad * span, hi + pad * span
    xs = np.linspace(lo[0], hi[0], res)
    ys = np.linspace(lo[1], hi[1], res)
    gx, gy = np.meshgrid(xs, ys)
    return xs, ys, np.c_[gx.ravel(), gy.ravel()]


def grid_1d(x, res=120, pad=0.03):
    lo, hi = x.min(), x.max()
    span = hi - lo
    return np.linspace(lo - pad * span, hi + pad * span, res)
