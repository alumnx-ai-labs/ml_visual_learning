import numpy as np

from .common import r, regression_metrics

SPEC = dict(
    id="linear", name="Linear Regression", category="supervised", tasks=["regression"], needs_2d=False,
    params=[
        dict(key="lr", label="Learning rate", min=0.001, max=0.03, step=0.001, default=0.02,
             help="Size of each gradient-descent step. Too small = slow. Too large (try 0.03) = the line overshoots and the loss blows up."),
        dict(key="steps", label="Gradient steps", min=10, max=800, step=10, default=400,
             help="How many times the line is nudged downhill before we stop."),
    ],
)


def run(X, y, tr, te, params):
    x = X[:, 0]
    xtr, ytr, xte, yte = x[tr], y[tr], x[te], y[te]

    # --- closed-form (Ordinary Least Squares) answer: the exact bottom of the bowl -------------
    mx, my = xtr.mean(), ytr.mean()
    sxy = ((xtr - mx) * (ytr - my)).sum()
    sxx = ((xtr - mx) ** 2).sum()
    w_star = sxy / sxx
    b_star = my - w_star * mx

    # --- gradient descent: walk downhill on the loss, recording every few steps ------------------
    lr, steps = float(params["lr"]), int(params["steps"])
    every = max(1, steps // 100)
    w = b = 0.0
    path = []
    for i in range(steps + 1):
        err = w * xtr + b - ytr
        loss = float(np.mean(err ** 2))
        if i % every == 0 or i == steps:
            path.append(dict(step=i, w=r(w, 5), b=r(b, 5), loss=r(loss, 5)))
        if not np.isfinite(loss) or loss > 1e12:
            break
        w -= lr * 2 * np.mean(err * xtr)
        b -= lr * 2 * np.mean(err)
    diverged = not (np.isfinite(path[-1]["loss"] or np.nan)) or path[-1]["loss"] is None or path[-1]["loss"] > 1e9
    path = [p for p in path if p["loss"] is not None and p["loss"] < 1e9]

    # --- loss surface (for the 'ball rolling downhill' picture) ----------------------------------
    ws_lo, ws_hi = min(0, w_star) - 2.5, max(0, w_star) + 2.5
    bs_lo, bs_hi = min(0, b_star) - 15, max(0, b_star) + 15
    ws = np.linspace(ws_lo, ws_hi, 45)
    bs = np.linspace(bs_lo, bs_hi, 45)
    W, B = np.meshgrid(ws, bs)
    Z = ((W[..., None] * xtr + B[..., None] - ytr) ** 2).mean(-1)

    gd_final = path[-1]
    pred_te = w_star * xte + b_star
    pred_tr = w_star * xtr + b_star

    return dict(
        model=dict(w=r(w_star, 5), b=r(b_star, 5), mean_x=r(mx), mean_y=r(my), sxy=r(sxy), sxx=r(sxx)),
        gd=dict(path=path, diverged=bool(diverged), lr=lr, steps=steps, final_w=gd_final["w"], final_b=gd_final["b"]),
        surface=dict(ws=r(ws), bs=r(bs), z=r(np.minimum(Z, np.percentile(Z, 98) * 3), 2)),
        train_metrics=regression_metrics(ytr, pred_tr),
        test_metrics=regression_metrics(yte, pred_te),
        predictions=dict(test=r(pred_te), train=r(pred_tr)),
    )
