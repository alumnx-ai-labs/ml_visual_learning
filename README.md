# ML Visual Learning Lab

An interactive web app for learning supervised machine-learning algorithms from scratch. Pick a model from the dropdown, read a short guided lesson, then watch the model train on real data step by step.

**Models:** Linear Regression · Logistic Regression · Random Forest · XGBoost

Each lesson starts with a problem statement and a goal:

| Model | Problem statement | Goal |
|---|---|---|
| Linear Regression | Predict a student's exam score from hours studied. | Find the straight line with the smallest average squared error that also predicts unseen students well. |
| Logistic Regression | Predict whether a student will pass or fail, and how likely. | Learn a dividing line plus probabilities with low log loss and good accuracy, precision and recall. |
| Random Forest | Predict whether a plant thrives or wilts when no straight line separates the groups. | Combine many different trees into a vote that follows any boundary shape without overfitting. |
| XGBoost | Predict house prices as accurately as possible. | Add small trees in sequence, each fixing the remaining errors, and stop before test error rises. |

### Guided lesson (default)

Each model opens as a short slide deck built on a simple story. Click **Next** or use the arrow keys. Every slide has one picture (animated where useful) and 2–3 sentences. Every technical word has a hover explanation, and each slide lists its terms with a plain meaning and an example. No settings to touch.

| Model | Story |
|---|---|
| Linear Regression | Study hours → exam score |
| Logistic Regression | Hours studied + slept → pass or fail |
| Random Forest | Temperature + humidity → plant thrives or wilts |
| XGBoost | House size → price |

### Playground (advanced)

Switch to **Playground (advanced)** in the header to pick datasets, change noise and model settings, and explore four tabs:

| Tab | What you get |
|---|---|
| **Learn** | A short, chapter-by-chapter lesson: the problem, the idea, worked examples with real numbers, quick quizzes, and the math (collapsed, for whoever wants it). |
| **Data** | Where every data point comes from, shown as a chart and a linked table, with train/test split marked. |
| **Watch it learn** | Step-by-step animation of training (gradient descent, moving decision boundary, tree votes, boosting rounds). |
| **Results** | Test-set metrics explained in plain words, predicted vs actual / confusion matrix, and an over/underfitting verdict. |

Change the dataset, noise or any model setting in the left panel and the model retrains instantly.

---

## Tech stack

- **Backend:** Python, FastAPI, scikit-learn, XGBoost, NumPy
- **Frontend:** React + TypeScript (Vite), hand-written SVG charts, KaTeX for formulas

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** (with npm)
- Git

## Run it locally

### 1. Clone

```bash
git clone https://github.com/alumnx-ai-labs/ml_visual_learning.git
cd ml_visual_learning
```

### 2. Start the backend (terminal 1)

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Check it works: open http://127.0.0.1:8000/api/meta. You should see JSON listing the algorithms.

### 3. Start the frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Go to **http://localhost:5173**

The frontend forwards all `/api` requests to the backend on port 8000 (see `frontend/vite.config.ts`), so keep both terminals running.

---

## Project structure

```
backend/
  main.py            FastAPI app: /api/meta and /api/run
  datasets.py        Dataset generators, each with a plain-English "where the data comes from"
  algos/
    linear.py        Gradient descent trace + exact OLS solution + loss surface
    logistic.py      Gradient descent trace of the decision boundary
    forest.py        Per-tree bootstrap samples, tree structures, votes on a grid
    xgb.py           Prediction and loss after every boosting round
    kmeans.py, dbscan.py, pca.py   Unsupervised models (implemented, currently hidden)
  smoke_test.py      Runs every model on every compatible dataset
frontend/src/
  App.tsx            Layout, dropdown, controls, tabs
  content/           Lesson text for each model (edit these to change the lessons)
  components/        Learn, Data and Results tabs, chart primitives
  slides/            Guided lesson slide decks, one per model
  viz/               The "Watch it learn" animation for each model (Playground)
```

## Useful commands

| Command | Where | What it does |
|---|---|---|
| `python smoke_test.py` | `backend/` (venv active) | Trains every model on every dataset and reports failures |
| `npm run build` | `frontend/` | Type-checks and builds a production bundle into `frontend/dist` |

## Troubleshooting

- **"Could not reach the backend"** in the app: the backend isn't running, or isn't on port 8000. Start it as in step 2.
- **`pip install` fails on xgboost/scikit-learn:** upgrade pip first (`python -m pip install --upgrade pip`) and make sure you are on Python 3.10 or newer.
- **Port 5173 already in use:** Vite will pick the next free port and print it in the terminal. Use that URL.

## Re-enabling the unsupervised models

K-Means, DBSCAN and PCA are implemented in `backend/algos/` but hidden. To expose them, add them to `ALGOS` in `backend/main.py`. They would also need lesson content and "Watch it learn" views in the frontend.
