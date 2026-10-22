import numpy as np

from .common import r, classification_metrics

SPEC = dict(
    id="logistic", name="Logistic Regression", category="supervised", tasks=["classification"], needs_2d=True,
    params=[
        dict(key="lr", label="Learning rate", min=0.01, max=2.0, step=0.01, default=0.3,
             help="Step size for gradient descent on the (standardised) features."),
        dict(key="steps", label="Gradient steps", min=5, max=600, step=5, default=250,
             help="How many times the boundary is nudged. Drag the Watch slider to see early vs late boundaries."),
        dict(key="l2", label="L2 regularisation", min=0, max=1, step=0.01, default=0,
             help="Penalty on large weights. Higher values keep the boundary smoother and less confident."),
    ],
)


def _sigmoid(z):
    return 1 / (1 + np.exp(-np.clip(z, -30, 30)))


def run(X, y, tr, te, params):
    mu, sd = X[tr].mean(0), X[tr].std(0) + 1e-9
    Z = (X - mu) / sd
    Ztr, ytr = Z[tr], y[tr].astype(float)
    lr, steps, l2 = float(params["lr"]), int(params["steps"]), float(params["l2"])
    every = max(1, steps // 60)

    w = np.zeros(2)
    b = 0.0
    path = []

    def to_original(w, b):
        wo = w / sd
        return wo, b - np.sum(wo * mu)

    for i in range(steps + 1):
        p = _sigmoid(Ztr @ w + b)
        loss = -np.mean(ytr * np.log(p + 1e-12) + (1 - ytr) * np.log(1 - p + 1e-12)) + 0.5 * l2 * np.sum(w ** 2)
        if i % every == 0 or i == steps:
            wo, bo = to_original(w, b)
            path.append(dict(step=i, w1=r(wo[0], 5), w2=r(wo[1], 5), b=r(bo, 5), loss=r(loss, 5),
                             acc=r(np.mean((p > 0.5) == ytr))))
        grad_w = Ztr.T @ (p - ytr) / len(ytr) + l2 * w
        grad_b = np.mean(p - ytr)
        w -= lr * grad_w
        b -= lr * grad_b

    wo, bo = to_original(w, b)
    proba = lambda idx: _sigmoid(X[idx] @ wo + bo)
    p_te, p_tr = proba(te), proba(tr)
    return dict(
        model=dict(w1=r(wo[0], 5), w2=r(wo[1], 5), b=r(bo, 5)),
        gd=dict(path=path, lr=lr, steps=steps),
        train_metrics=classification_metrics(y[tr], (p_tr > 0.5).astype(int), p_tr),
        test_metrics=classification_metrics(y[te], (p_te > 0.5).astype(int), p_te),
        predictions=dict(test_proba=r(p_te), train_proba=r(p_tr)),
    )
