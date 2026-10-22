/** Every technical term used in the lessons: a plain meaning and a technical meaning. Keys are lowercase. */
export interface Term { name: string; plain: string; tech: string }

const T: Term[] = [
  // basics
  { name: 'Model', plain: 'The rule the computer learned, e.g. "score = 5 × hours + 39".', tech: 'A function ŷ = f(x; θ) whose parameters θ are fitted to data.' },
  { name: 'Machine learning', plain: 'Letting the computer find the rule from examples instead of a person writing it.', tech: 'Fitting a model\'s parameters to data by minimising a loss.' },
  { name: 'Supervised learning', plain: 'Learning from examples that come with the right answer, like studying with an answer key.', tech: 'Learning a mapping x → y from labelled pairs (xᵢ, yᵢ).' },
  { name: 'Feature', plain: 'An input the model looks at, e.g. hours studied.', tech: 'One column of the input matrix X; written x or xⱼ.' },
  { name: 'Target', plain: 'The answer we want to predict, e.g. the exam score.', tech: 'The output variable y the model is trained to predict. Also called label.' },
  { name: 'Label', plain: 'The correct answer attached to an example (pass/fail, 0/1).', tech: 'The known y value of a training example; in classification, the class.' },
  { name: 'Parameter', plain: 'A knob inside the model that training adjusts.', tech: 'A learned value such as w or b, set by minimising the loss.' },
  { name: 'Training', plain: 'Adjusting the model\'s knobs until its answers match the known answers.', tech: 'Optimising the parameters to minimise the loss on the training set.' },
  { name: 'Loss', plain: 'One number that says how wrong the model currently is. Lower is better.', tech: 'Objective function L(θ) averaged over training data; training minimises it.' },
  { name: 'Regression', plain: 'Predicting a number on a scale (price, score).', tech: 'Supervised learning with a continuous target y ∈ ℝ.' },
  { name: 'Classification', plain: 'Predicting a category (pass/fail, spam/not spam).', tech: 'Supervised learning with a discrete target y ∈ {classes}.' },
  { name: 'Prediction', plain: 'The model\'s guess for a data point.', tech: 'ŷ = f(x), the model output for input x.' },
  { name: 'Training set', plain: 'The examples the model is allowed to learn from.', tech: 'The subset of data used to fit the parameters.' },
  { name: 'Test set', plain: 'Examples hidden during learning, used to give an honest grade.', tech: 'Held-out data used only to estimate generalisation error.' },
  { name: 'Overfitting', plain: 'Memorising the training examples (even their noise) and failing on new ones.', tech: 'Low training error but high test error; high-variance model.' },
  { name: 'Underfitting', plain: 'The model is too simple to capture the pattern, so it is bad everywhere.', tech: 'High training and test error; high-bias model.' },
  { name: 'Outlier', plain: 'A weird point far from the rest, e.g. a student who studied a lot but was sick on exam day.', tech: 'Observation with an extreme residual; dominates squared-error losses.' },
  { name: 'Baseline', plain: 'A lazy reference guess (e.g. always the average) that any real model must beat.', tech: 'Trivial predictor used as a lower bar, e.g. ŷ = ȳ.' },

  // linear
  { name: 'Slope', plain: 'How much the prediction goes up for each +1 of the input.', tech: 'The coefficient w in ŷ = wx + b; ∂ŷ/∂x.' },
  { name: 'Intercept', plain: 'The prediction when the input is zero — where the line starts.', tech: 'The constant b in ŷ = wx + b. Also called bias.' },
  { name: 'Weight', plain: 'How strongly a feature pushes the prediction.', tech: 'Coefficient wⱼ multiplying feature xⱼ.' },
  { name: 'Residual', plain: 'How far off the model is for one point: actual minus predicted.', tech: 'rᵢ = yᵢ − ŷᵢ.' },
  { name: 'Mean Squared Error (MSE)', plain: 'Square every mistake, then average them. Big mistakes count extra.', tech: 'MSE = (1/n) Σ (yᵢ − ŷᵢ)².' },
  { name: 'Gradient', plain: 'The direction in which the loss goes up fastest — so we go the opposite way.', tech: 'Vector of partial derivatives ∇L = (∂L/∂w, ∂L/∂b).' },
  { name: 'Gradient descent', plain: 'Improve the model in many small steps, each step going "downhill" on the loss.', tech: 'Iterative update θ ← θ − η∇L(θ).' },
  { name: 'Learning rate', plain: 'How big each improvement step is. Too big overshoots, too small is slow.', tech: 'Step size η in gradient descent; in boosting, the shrinkage applied to each tree.' },
  { name: 'Ordinary Least Squares (OLS)', plain: 'An exact formula that finds the best straight line in one go.', tech: 'Closed-form minimiser of MSE: w* = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)².' },
  { name: 'R²', plain: 'How much better than guessing the average. 1 = perfect, 0 = no better.', tech: 'R² = 1 − SSE / SST, share of target variance explained.' },
  { name: 'RMSE', plain: 'The typical size of a mistake, in the same units as the target.', tech: 'Root mean squared error: √MSE.' },

  // logistic
  { name: 'Sigmoid', plain: 'An S-shaped curve that turns any number into a value between 0 and 1.', tech: 'σ(z) = 1 / (1 + e^(−z)).' },
  { name: 'Probability', plain: 'How likely something is, from 0 (never) to 1 (certain).', tech: 'Here p = P(y = 1 | x), the model\'s estimated chance of class 1.' },
  { name: 'Log-odds', plain: 'The raw score before squashing; positive leans "yes", negative leans "no".', tech: 'z = ln(p / (1 − p)); logistic regression models z as linear in x.' },
  { name: 'Decision boundary', plain: 'The line where the model switches its answer — where it is exactly 50/50.', tech: 'Set of x where p = 0.5, i.e. w·x + b = 0.' },
  { name: 'Log loss', plain: 'A score for probability predictions that punishes confident mistakes very hard.', tech: 'Cross-entropy: −(1/n) Σ [y ln p + (1−y) ln(1−p)].' },
  { name: 'Threshold', plain: 'The cut-off probability for saying "yes" (usually 50%).', tech: 'Predict class 1 if p > t; t = 0.5 by default.' },
  { name: 'Accuracy', plain: 'Share of predictions that were right.', tech: '(TP + TN) / total.' },
  { name: 'Precision', plain: 'When the model says "yes", how often is it right?', tech: 'TP / (TP + FP).' },
  { name: 'Recall', plain: 'Of all the real "yes" cases, how many did the model catch?', tech: 'TP / (TP + FN). Also called sensitivity.' },
  { name: 'Confusion matrix', plain: 'A 2×2 table of what really happened vs what the model said.', tech: 'Counts of TP, FP, FN, TN.' },
  { name: 'Regularisation', plain: 'A penalty that stops the model from becoming too extreme or too complex.', tech: 'Extra loss term, e.g. (λ/2)‖w‖², that shrinks parameters.' },

  // trees / forest
  { name: 'Decision tree', plain: 'A flowchart of yes/no questions that ends in an answer.', tech: 'Recursive axis-aligned partition of feature space; leaves hold predictions.' },
  { name: 'Node', plain: 'One question in the tree, like "temperature ≤ 30?".', tech: 'Internal vertex holding a split (feature j, threshold t).' },
  { name: 'Leaf', plain: 'An end box of the tree that holds the final answer.', tech: 'Terminal node; predicts the majority class or mean target of its samples.' },
  { name: 'Split', plain: 'Dividing a group of points into two using one question.', tech: 'Partition of a node by xⱼ ≤ t into left/right children.' },
  { name: 'Gini', plain: 'How mixed a group is: 0 = all the same class, 0.5 = a 50/50 mix.', tech: 'G = 1 − Σ pₖ², where pₖ is the share of class k.' },
  { name: 'Impurity', plain: 'How mixed (messy) a group of points is. Trees try to reduce it.', tech: 'Node heterogeneity measure: Gini or entropy (classification), variance (regression).' },
  { name: 'Bootstrap', plain: 'A random sample drawn with replacement, so some rows repeat and some are missing.', tech: 'n draws with replacement from n rows; ≈63% unique rows per sample.' },
  { name: 'Out-of-bag', plain: 'The rows a tree never saw; used as a free mini test set.', tech: 'Rows not in a tree\'s bootstrap sample (≈37%); used for the OOB score.' },
  { name: 'Random feature subset', plain: 'At each question, a tree may only look at a few randomly chosen inputs, so the trees end up different.', tech: 'At each split, consider only m of the d features (commonly m = √d); decorrelates trees.' },
  { name: 'Bagging', plain: 'Train many models on different random samples and average them.', tech: 'Bootstrap aggregating; reduces variance.' },
  { name: 'Majority vote', plain: 'Each tree picks an answer and the most popular answer wins.', tech: 'ŷ = mode of the trees\' predicted classes (or averaged class probabilities).' },
  { name: 'Feature importance', plain: 'How much each input helped the model make good decisions.', tech: 'Total impurity decrease from splits on that feature, averaged over trees.' },
  { name: 'Ensemble', plain: 'A team of models whose answers are combined.', tech: 'A predictor built from many base learners, e.g. via bagging or boosting.' },
  { name: 'Variance', plain: 'How much a model\'s answers change if you give it slightly different data.', tech: 'Var of the prediction over training sets; high in deep single trees.' },

  // boosting
  { name: 'Boosting', plain: 'Build models one after another, each one fixing the previous mistakes.', tech: 'Sequential additive ensemble: F_m = F_{m−1} + η h_m.' },
  { name: 'Weak learner', plain: 'A deliberately simple model, only a bit better than guessing.', tech: 'Low-capacity base model, typically a shallow tree.' },
  { name: 'Residuals', plain: 'What is still wrong after the current prediction: actual minus predicted.', tech: 'rᵢ = yᵢ − F_{m−1}(xᵢ) = negative gradient of squared loss.' },
  { name: 'Early stopping', plain: 'Stop adding trees once the test error stops improving.', tech: 'Halt training when validation loss has not improved for k rounds.' },
  { name: 'λ', plain: 'A knob that shrinks each tree\'s answers to keep the model cautious.', tech: 'L2 penalty on leaf weights in w* = −Σg / (Σh + λ).' },
]

const ALIASES: Record<string, string> = {
  features: 'feature', targets: 'target', labels: 'label', parameters: 'parameter', models: 'model',
  mse: 'mean squared error (mse)', 'mean squared error': 'mean squared error (mse)',
  residual: 'residual', ols: 'ordinary least squares (ols)', 'ordinary least squares': 'ordinary least squares (ols)',
  'test data': 'test set', 'training data': 'training set', trains: 'training',
  'decision trees': 'decision tree', leaves: 'leaf', nodes: 'node', splits: 'split', 'gini impurity': 'gini',
  'out-of-bag (oob)': 'out-of-bag', oob: 'out-of-bag', 'bootstrap sample': 'bootstrap',
  'weak learners': 'weak learner', 'gradient boosting': 'boosting', regularization: 'regularisation',
  'loss function': 'loss', slope: 'slope', intercept: 'intercept', weights: 'weight', bias: 'intercept',
  'log-odds score': 'log-odds', 'learning rate (shrinkage)': 'learning rate', probabilities: 'probability',
  'random forest': 'ensemble', crowd: 'ensemble', 'smallest mse': 'mean squared error (mse)',
  'trick 1, bootstrap:': 'bootstrap', 'trick 2, random features:': 'random feature subset', outliers: 'outlier', vote: 'majority vote', 'majority vote wins': 'majority vote',
}

export const TERMS: Record<string, Term> = Object.fromEntries(T.map((t) => [t.name.toLowerCase(), t]))

export function findTerm(text: string): Term | undefined {
  const k = text.toLowerCase().trim()
  return TERMS[k] ?? TERMS[ALIASES[k]] ?? (k.endsWith('s') ? TERMS[k.slice(0, -1)] : undefined)
}
