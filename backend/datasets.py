"""Synthetic + classic datasets. Every dataset explains *how each point is generated*."""
from __future__ import annotations

import numpy as np
from sklearn import datasets as skd
from sklearn.preprocessing import StandardScaler


def _z(X: np.ndarray) -> np.ndarray:
    return StandardScaler().fit_transform(X)


def _study(n, noise, rng):
    hours = rng.uniform(0, 10, n)
    score = 35 + 6 * hours + rng.normal(0, noise, n)
    return np.c_[hours], score, ["hours_studied"], "exam_score", None


def _curve(n, noise, rng):
    x = rng.uniform(0, 10, n)
    y = 0.8 * (x - 5) ** 2 + 5 + rng.normal(0, noise, n)
    return np.c_[x], y, ["x"], "y", None


def _wave(n, noise, rng):
    x = rng.uniform(0, 10, n)
    y = 20 + 10 * np.sin(0.9 * x) + rng.normal(0, noise, n)
    return np.c_[x], y, ["x"], "y", None


def _blobs2(n, noise, rng):
    X, y = skd.make_blobs(n, centers=[(-1.4, -1.0), (1.4, 1.0)], cluster_std=noise, random_state=int(rng.integers(1e9)))
    return X, y, ["x1", "x2"], "class", ["A", "B"]


def _moons(n, noise, rng):
    X, y = skd.make_moons(n, noise=noise, random_state=int(rng.integers(1e9)))
    return _z(X), y, ["x1", "x2"], "class", ["A", "B"]


def _circles(n, noise, rng):
    X, y = skd.make_circles(n, noise=noise, factor=0.45, random_state=int(rng.integers(1e9)))
    return _z(X), y, ["x1", "x2"], "class", ["A", "B"]


def _xor(n, noise, rng):
    X = rng.uniform(-1, 1, (n, 2))
    y = (X[:, 0] * X[:, 1] > 0).astype(int)
    X = X + rng.normal(0, noise, X.shape)
    return X, y, ["x1", "x2"], "class", ["A", "B"]


def _iris2(n, noise, rng):
    iris = skd.load_iris()
    mask = iris.target > 0
    X = iris.data[mask][:, 2:4]
    y = iris.target[mask] - 1
    return X, y, ["petal_length_cm", "petal_width_cm"], "species", ["versicolor", "virginica"]


def _blobs3(n, noise, rng):
    X, y = skd.make_blobs(n, centers=3, cluster_std=noise, random_state=int(rng.integers(1e9)), center_box=(-6, 6))
    return _z(X), y, ["x1", "x2"], "true_cluster", ["1", "2", "3"]


def _aniso(n, noise, rng):
    X, y = skd.make_blobs(n, centers=3, cluster_std=noise, random_state=int(rng.integers(1e9)))
    X = X @ np.array([[0.6, -0.65], [-0.4, 0.85]])
    return _z(X), y, ["x1", "x2"], "true_cluster", ["1", "2", "3"]


def _correlated(n, noise, rng):
    h = rng.normal(170, 9, n)
    w = 70 + 0.9 * (h - 170) + rng.normal(0, noise, n)
    return np.c_[h, w], np.zeros(n, dtype=int), ["height_cm", "weight_kg"], "none", None


def _iris4(n, noise, rng):
    iris = skd.load_iris()
    names = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
    return iris.data, iris.target, names, "species", list(iris.target_names)


def _spec(key, name, tasks, dims, fn, origin, noise=None, fixed_n=False, blurb=""):
    return dict(key=key, name=name, tasks=tasks, dims=dims, fn=fn, origin=origin, noise=noise, fixed_n=fixed_n, blurb=blurb)


DATASETS = {d["key"]: d for d in [
    _spec("study", "Study hours → exam score", ["regression"], 1, _study,
          "Each student's hours are drawn uniformly from 0–10. Their score is the true rule 35 + 6·hours, plus random "
          "'real-life' noise drawn from a bell curve (std = the noise slider).",
          dict(label="Noise (std of score)", min=0, max=15, step=0.5, default=5)),
    _spec("curve", "Curved (parabola) relationship", ["regression"], 1, _curve,
          "x is drawn uniformly from 0–10. y = 0.8·(x−5)² + 5 + noise. A straight line cannot capture this shape — "
          "great for seeing underfitting.",
          dict(label="Noise (std of y)", min=0, max=8, step=0.25, default=2)),
    _spec("wave", "Wavy (sine) relationship", ["regression"], 1, _wave,
          "x is drawn uniformly from 0–10. y = 20 + 10·sin(0.9·x) + noise. Only flexible models can follow the wiggles.",
          dict(label="Noise (std of y)", min=0, max=8, step=0.25, default=2)),
    _spec("blobs2", "Two blobs", ["classification", "unsupervised"], 2, _blobs2,
          "Two groups of points; each point is a random draw from a 2D bell curve centred on its group's centre. "
          "The 'noise' controls how wide (and so how overlapping) the groups are.",
          dict(label="Spread of each blob", min=0.3, max=2.2, step=0.1, default=0.9)),
    _spec("moons", "Two moons", ["classification", "unsupervised"], 2, _moons,
          "Points lie on two interleaving half-circles, then get jittered by Gaussian noise. Not separable by a straight line.",
          dict(label="Jitter", min=0, max=0.4, step=0.01, default=0.12)),
    _spec("circles", "Concentric circles", ["classification", "unsupervised"], 2, _circles,
          "Points lie on a small circle inside a big circle, then get jittered. One class literally surrounds the other.",
          dict(label="Jitter", min=0, max=0.25, step=0.01, default=0.07)),
    _spec("xor", "XOR (checkerboard)", ["classification"], 2, _xor,
          "Points are uniform in a square. Class = 1 when x1 and x2 have the same sign, else 0 — opposite corners share a class.",
          dict(label="Jitter", min=0, max=0.4, step=0.01, default=0.08)),
    _spec("iris2", "Iris flowers (real data)", ["classification"], 2, _iris2,
          "Real measurements by botanist R. A. Fisher (1936): the petals of 100 iris flowers (versicolor vs virginica). "
          "Each row is one measured flower.",
          None, fixed_n=True),
    _spec("blobs3", "Three clusters", ["unsupervised"], 2, _blobs3,
          "Three hidden groups; each point is a random draw from a bell curve around its group's centre. The algorithm "
          "never sees which group a point came from.",
          dict(label="Spread of each cluster", min=0.3, max=1.8, step=0.1, default=0.8)),
    _spec("aniso", "Stretched clusters", ["unsupervised"], 2, _aniso,
          "Like 'three clusters', but the whole picture is squeezed and rotated so clusters become elongated ellipses.",
          dict(label="Spread of each cluster", min=0.3, max=1.5, step=0.1, default=0.7)),
    _spec("correlated", "Height & weight", ["unsupervised"], 2, _correlated,
          "Height ~ bell curve (mean 170 cm, std 9). Weight = 70 + 0.9·(height−170) + noise. Taller people tend to be heavier, "
          "so the two columns carry overlapping information — ideal for PCA.",
          dict(label="Noise in weight (kg)", min=1, max=15, step=0.5, default=6)),
    _spec("iris4", "Iris flowers, all 4 measurements", ["unsupervised"], 4, _iris4,
          "Real measurements of 150 iris flowers: sepal length/width and petal length/width. 4 numbers per flower — too many to "
          "draw directly, so PCA squeezes them to 2.",
          None, fixed_n=True),
]}


def make(key: str, n: int, noise: float | None, seed: int):
    spec = DATASETS[key]
    rng = np.random.default_rng(seed)
    nz = noise if noise is not None else (spec["noise"]["default"] if spec["noise"] else 0)
    X, y, feats, target, classes = spec["fn"](n, nz, rng)
    return np.asarray(X, float), np.asarray(y), feats, target, classes, nz


def public_catalog():
    return [
        dict(key=d["key"], name=d["name"], tasks=d["tasks"], dims=d["dims"], origin=d["origin"], noise=d["noise"], fixed_n=d["fixed_n"])
        for d in DATASETS.values()
    ]
