import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

from .common import r, regression_metrics, classification_metrics, grid_1d, grid_2d

SPEC = dict(
    id="forest", name="Random Forest", category="supervised", tasks=["regression", "classification"], needs_2d=False,
    params=[
        dict(key="n_estimators", label="Number of trees", min=1, max=60, step=1, default=15,
             help="How many trees vote. More trees = smoother, more stable predictions (with diminishing returns)."),
        dict(key="max_depth", label="Max tree depth", min=1, max=10, step=1, default=4,
             help="How many questions a tree may ask in a row. Deep trees memorise; shallow trees underfit."),
        dict(key="min_samples_leaf", label="Min samples per leaf", min=1, max=20, step=1, default=1,
             help="A leaf must hold at least this many training points. Larger = smoother, less overfit."),
    ],
)


def _tree_nodes(tree, classification, class_count=2):
    t = tree.tree_
    nodes = []
    for i in range(t.node_count):
        val = t.value[i][0]
        nodes.append(dict(
            f=int(t.feature[i]), t=r(t.threshold[i], 3), l=int(t.children_left[i]), r=int(t.children_right[i]),
            n=int(t.n_node_samples[i]), imp=r(t.impurity[i], 3),
            v=(r(val / max(val.sum(), 1e-12), 3) if classification else r(val[0], 2)),
        ))
    return nodes


def run(X, y, tr, te, params, task):
    clf = task == "classification"
    Model = RandomForestClassifier if clf else RandomForestRegressor
    model = Model(n_estimators=int(params["n_estimators"]), max_depth=int(params["max_depth"]),
                  min_samples_leaf=int(params["min_samples_leaf"]), oob_score=True, bootstrap=True,
                  random_state=0, max_features=("sqrt" if clf and X.shape[1] > 1 else None))
    model.fit(X[tr], y[tr])
    n_trees = len(model.estimators_)

    def one(est, P):
        return est.predict(P)

    # evaluation grid -----------------------------------------------------------------
    if X.shape[1] == 1:
        xs = grid_1d(X[:, 0])
        G = xs[:, None]
        grid = dict(xs=r(xs))
    else:
        xs, ys, G = grid_2d(X, res=36)
        grid = dict(xs=r(xs, 3), ys=r(ys, 3))
    # every tree's own prediction on the grid, so the UI can show individual tree votes
    tree_grid = np.array([one(e, G) for e in model.estimators_])
    forest_grid = tree_grid.mean(0)  # clf: fraction voting class 1 (trees output hard class in sklearn>=1.? we cast below)
    if clf:
        tree_grid = np.array([e.predict(G) for e in model.estimators_]).astype(int)
        forest_grid = np.array([e.predict_proba(G)[:, 1] for e in model.estimators_]).mean(0)

    # test score as trees are added --------------------------------------------------
    if clf:
        per_tree_te = np.array([e.predict_proba(X[te])[:, 1] for e in model.estimators_])
        curve = [float(np.mean((per_tree_te[:k].mean(0) > 0.5) == y[te])) for k in range(1, n_trees + 1)]
        single = [float(np.mean((per_tree_te[k] > 0.5) == y[te])) for k in range(n_trees)]
    else:
        per_tree_te = np.array([e.predict(X[te]) for e in model.estimators_])
        curve = [float(np.sqrt(np.mean((per_tree_te[:k].mean(0) - y[te]) ** 2))) for k in range(1, n_trees + 1)]
        single = [float(np.sqrt(np.mean((per_tree_te[k] - y[te]) ** 2))) for k in range(n_trees)]

    shown = min(n_trees, 8)
    trees = []
    for i in range(shown):
        boot = model.estimators_samples_[i]
        counts = np.bincount(boot, minlength=len(tr))
        trees.append(dict(
            in_bag=counts.tolist(),                       # how many times each training row was drawn (0 = out-of-bag)
            nodes=_tree_nodes(model.estimators_[i], clf),
        ))

    if clf:
        p_te = model.predict_proba(X[te])[:, 1]
        p_tr = model.predict_proba(X[tr])[:, 1]
        train_m = classification_metrics(y[tr], (p_tr > .5).astype(int), p_tr)
        test_m = classification_metrics(y[te], (p_te > .5).astype(int), p_te)
        preds = dict(test_proba=r(p_te), train_proba=r(p_tr))
    else:
        p_te, p_tr = model.predict(X[te]), model.predict(X[tr])
        train_m, test_m = regression_metrics(y[tr], p_tr), regression_metrics(y[te], p_te)
        preds = dict(test=r(p_te), train=r(p_tr))

    return dict(
        task=task, grid=grid, tree_grid=(tree_grid.astype(int).tolist() if clf else r(tree_grid, 2)),
        forest_grid=r(forest_grid, 3), trees=trees, shown_trees=shown, n_trees=n_trees,
        curve=r(np.array(curve), 4), single_tree_scores=r(np.array(single), 4),
        oob_score=r(model.oob_score_), importance=r(model.feature_importances_),
        train_metrics=train_m, test_metrics=test_m, predictions=preds,
    )
