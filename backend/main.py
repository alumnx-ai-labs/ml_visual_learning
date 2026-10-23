import warnings

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import datasets
from algos import dbscan, forest, hierarchical, kmeans, linear, logistic, pca, xgb
from algos.common import r

warnings.filterwarnings("ignore", message="Some inputs do not have OOB scores")

ALGOS = {m.SPEC["id"]: m for m in [linear, logistic, forest, xgb, kmeans, dbscan, pca, hierarchical]}

app = FastAPI(title="ML Learning Lab")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/meta")
def meta():
    # the playground only works with supervised data; unsupervised models are taught through guided lessons
    supervised = {"regression", "classification"}
    cat = [d for d in datasets.public_catalog() if supervised & set(d["tasks"])]
    return dict(algorithms=[m.SPEC for m in ALGOS.values()], datasets=cat)


class RunRequest(BaseModel):
    algo: str
    dataset: str
    n: int = Field(200, ge=10, le=500)
    noise: float | None = None
    seed: int = 42
    params: dict = {}


@app.post("/api/run")
def run(req: RunRequest):
    if req.algo not in ALGOS:
        raise HTTPException(404, "unknown algorithm")
    if req.dataset not in datasets.DATASETS:
        raise HTTPException(404, "unknown dataset")
    mod, spec, ds = ALGOS[req.algo], ALGOS[req.algo].SPEC, datasets.DATASETS[req.dataset]
    tasks = [t for t in spec["tasks"] if t in ds["tasks"]]
    if not tasks or (spec["needs_2d"] and ds["dims"] != 2):
        raise HTTPException(400, f"{spec['name']} can't use dataset '{ds['name']}'")
    task = tasks[0]

    X, y, feats, target, classes, noise = datasets.make(req.dataset, req.n, req.noise, req.seed)
    n = len(X)
    supervised = spec["category"] == "supervised"
    rng = np.random.default_rng(req.seed + 1)
    perm = rng.permutation(n)
    n_test = int(round(n * 0.25)) if supervised else 0
    te, tr = np.sort(perm[:n_test]), np.sort(perm[n_test:])
    is_test = np.zeros(n, bool)
    is_test[te] = True

    params = {p["key"]: p["default"] for p in spec["params"]}
    params.update(req.params)
    # numeric slider values can arrive as ints/floats; selects stay strings
    for p in spec["params"]:
        if p.get("type") != "select":
            params[p["key"]] = float(params[p["key"]])

    if req.algo in ("forest", "xgboost"):
        result = mod.run(X, y, tr, te, params, task)
    else:
        result = mod.run(X, y, tr, te, params)

    return dict(
        task=task, params=params,
        data=dict(X=r(X, 4), y=r(y, 4) if task == "regression" else y.astype(int).tolist(),
                  is_test=is_test.tolist(), feature_names=feats, target_name=target, classes=classes,
                  dataset=ds["name"], origin=ds["origin"], noise=noise,
                  n_train=int(len(tr)), n_test=int(len(te))),
        result=result,
    )
