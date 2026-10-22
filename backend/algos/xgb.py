import numpy as np
from sklearn.metrics import log_loss, mean_squared_error
from xgboost import XGBClassifier, XGBRegressor

from .common import r, regression_metrics, classification_metrics, grid_1d, grid_2d

SPEC = dict(
    id="xgboost", name="XGBoost (gradient boosting)", category="supervised", tasks=["regression", "classification"], needs_2d=False,
    params=[
        dict(key="n_estimators", label="Boosting rounds", min=1, max=60, step=1, default=20,
             help="How many small trees are added one after another. Each one fixes the previous mistakes."),
        dict(key="learning_rate", label="Learning rate", min=0.02, max=1, step=0.02, default=0.3,
             help="How much of each new tree's correction is applied. Small = cautious & needs more rounds."),
        dict(key="max_depth", label="Tree depth", min=1, max=6, step=1, default=2,
             help="Boosting works best with small 'weak' trees. Deeper trees fit faster but overfit sooner."),
        dict(key="reg_lambda", label="L2 regularisation (λ)", min=0, max=20, step=0.5, default=1,
             help="Shrinks each leaf's output. Larger λ = more cautious trees."),
    ],
)


def run(X, y, tr, te, params, task):
    clf = task == "classification"
    n = int(params["n_estimators"])
    kw = dict(n_estimators=n, learning_rate=float(params["learning_rate"]), max_depth=int(params["max_depth"]),
              reg_lambda=float(params["reg_lambda"]), random_state=0, n_jobs=1, tree_method="hist", base_score=0.5 if clf else float(y[tr].mean()))
    model = (XGBClassifier if clf else XGBRegressor)(**kw)
    model.fit(X[tr], y[tr])

    if X.shape[1] == 1:
        xs = grid_1d(X[:, 0])
        G, grid = xs[:, None], dict(xs=r(xs))
    else:
        xs, ys, G = grid_2d(X, res=30)
        grid = dict(xs=r(xs, 3), ys=r(ys, 3))

    def predict(P, k):
        """Prediction after the first k trees (k = 0: just the starting guess)."""
        if clf:
            if k == 0:
                return np.full(len(P), 0.5)
            return model.predict_proba(P, iteration_range=(0, k))[:, 1]
        if k == 0:
            return np.full(len(P), kw["base_score"])
        return model.predict(P, iteration_range=(0, k))

    rounds = []
    for k in range(n + 1):
        ptr, pte = predict(X[tr], k), predict(X[te], k)
        if clf:
            tl = log_loss(y[tr], np.clip(ptr, 1e-7, 1 - 1e-7), labels=[0, 1])
            el = log_loss(y[te], np.clip(pte, 1e-7, 1 - 1e-7), labels=[0, 1])
        else:
            tl = mean_squared_error(y[tr], ptr) ** .5
            el = mean_squared_error(y[te], pte) ** .5
        rounds.append(dict(k=k, train_pred=r(ptr, 3), grid=r(predict(G, k), 3), train_loss=r(tl), test_loss=r(el)))

    final_tr, final_te = predict(X[tr], n), predict(X[te], n)
    if clf:
        train_m = classification_metrics(y[tr], (final_tr > .5).astype(int), final_tr)
        test_m = classification_metrics(y[te], (final_te > .5).astype(int), final_te)
        preds = dict(test_proba=r(final_te), train_proba=r(final_tr))
    else:
        train_m, test_m = regression_metrics(y[tr], final_tr), regression_metrics(y[te], final_te)
        preds = dict(test=r(final_te), train=r(final_tr))

    return dict(
        task=task, grid=grid, rounds=rounds, base=r(0.5 if clf else kw["base_score"]), lr=kw["learning_rate"],
        importance=r(model.feature_importances_), train_metrics=train_m, test_metrics=test_m, predictions=preds,
        loss_name="log loss" if clf else "RMSE",
    )
