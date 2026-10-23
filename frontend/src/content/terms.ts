/**
 * Every technical term used in the lessons. Keys are lowercase.
 * plain = everyday words, example = a tiny concrete case, tech = the formula with every symbol spelled out.
 */
import { UNSUP_ALIASES, UNSUP_TERMS } from './termsUnsup'

export interface Term { name: string; plain: string; example: string; tech: string }

const T: Term[] = [
  // ---------------- basics ----------------
  {
    name: 'Model',
    plain: 'The rule the computer learned from the examples. You give it an input, it gives back an answer.',
    example: 'Rule learned: score = 5 × hours + 39. Input 7 hours → answer 74.',
    tech: 'A formula with adjustable numbers inside it. Training picks those numbers.',
  },
  {
    name: 'Machine learning',
    plain: 'Instead of a person writing the rule, the computer works out the rule by looking at many solved examples.',
    example: 'Show it 500 past students (hours + score) and it works out "about 5 extra points per hour".',
    tech: 'Choosing a model\'s numbers so its answers match the known answers in the data as closely as possible.',
  },
  {
    name: 'Supervised learning',
    plain: 'Learning from examples that come with the correct answer — like practising with an answer key.',
    example: 'Each past student comes with their real score, so the computer can check its guesses.',
    tech: 'Every training example is a pair: inputs and the correct output.',
  },
  {
    name: 'Feature',
    plain: 'A piece of information the model is given to make its guess. A column of the table.',
    example: '"Hours studied" is a feature. "Hours slept" could be another.',
    tech: 'An input column, written x (or x₁, x₂… when there are several).',
  },
  {
    name: 'Target',
    plain: 'The thing we want the model to predict. The "answer" column.',
    example: 'Exam score is the target when we predict scores from hours.',
    tech: 'The output column, written y.',
  },
  {
    name: 'Label',
    plain: 'The correct answer attached to an example. Used mostly when the answer is a category.',
    example: 'A past student labelled "pass" (stored as 1) or "fail" (stored as 0).',
    tech: 'The known y value of a training example.',
  },
  {
    name: 'Parameter',
    plain: 'A number inside the model that gets tuned during training — like a knob.',
    example: 'In "score = 5 × hours + 39", the 5 and the 39 are the parameters.',
    tech: 'Values such as w (slope) and b (intercept) that training adjusts.',
  },
  {
    name: 'Training',
    plain: 'The process of adjusting the model\'s knobs until its guesses match the known answers well.',
    example: 'Start with "score = 0 × hours + 0", end with "score = 5 × hours + 39".',
    tech: 'Repeatedly changing the parameters to make the loss (the error score) smaller.',
  },
  {
    name: 'Loss',
    plain: 'One number that says how wrong the model is right now. Training tries to make it as small as possible.',
    example: 'Loss 3707 at the start, loss 4.6 after training — the model got much less wrong.',
    tech: 'A formula that combines all the individual mistakes into one score. MSE and log loss are two examples.',
  },
  {
    name: 'Regression',
    plain: 'Predicting a number that can be anything on a scale.',
    example: 'Exam score (0–100), house price, tomorrow\'s temperature.',
    tech: 'The target y is a continuous number.',
  },
  {
    name: 'Classification',
    plain: 'Predicting which group or category something belongs to.',
    example: 'Pass or fail. Spam or not spam. Thrive or wilt.',
    tech: 'The target y is one of a fixed set of classes (here 0 or 1).',
  },
  {
    name: 'Prediction',
    plain: 'The model\'s guess for one example.',
    example: 'For a student who studied 7 hours, the model predicts 74.',
    tech: 'Written ŷ ("y-hat") — the hat means "estimated", to tell it apart from the real y.',
  },
  {
    name: 'Training set',
    plain: 'The examples the model is allowed to learn from.',
    example: '150 of our 200 students are used for training.',
    tech: 'The part of the data used to choose the parameters.',
  },
  {
    name: 'Test set',
    plain: 'Examples we hide from the model while it learns, then use to give it an honest grade — like a surprise exam.',
    example: '50 of 200 students are hidden. After training, we see how close it gets on those 50.',
    tech: 'Held-out data never used for training; it estimates performance on new, unseen data.',
  },
  {
    name: 'Overfitting',
    plain: 'The model memorised the training examples (including their random quirks) instead of the general pattern, so it does badly on new data.',
    example: '100% right on training students, only 70% right on test students.',
    tech: 'Training error is low but test error is much higher.',
  },
  {
    name: 'Underfitting',
    plain: 'The model is too simple to capture the pattern, so it is wrong a lot everywhere.',
    example: 'A straight line through points that form a U-shape.',
    tech: 'Both training error and test error are high.',
  },
  {
    name: 'Baseline',
    plain: 'The laziest possible guess, used as a reference. A real model has to beat it to be worth anything.',
    example: 'Always predicting the class average (60) for every student.',
    tech: 'Usually ŷ = ȳ (predict the average target for everyone).',
  },
  {
    name: 'Outlier',
    plain: 'A strange point that sits far away from all the others.',
    example: 'A student who studied 10 hours but scored 20 because they were ill on exam day.',
    tech: 'A point with a very large error; squared-error methods give it a lot of influence.',
  },

  // ---------------- linear regression ----------------
  {
    name: 'Slope',
    plain: 'How much the prediction goes up when the input goes up by 1. How steep the line is.',
    example: 'Slope 5 → every extra hour of study adds 5 points.',
    tech: 'w in ŷ = w·x + b.',
  },
  {
    name: 'Intercept',
    plain: 'The prediction when the input is zero — the point where the line starts on the left edge.',
    example: 'Intercept 39 → a student who studies 0 hours is predicted to score 39.',
    tech: 'b in ŷ = w·x + b. Also called the bias.',
  },
  {
    name: 'Weight',
    plain: 'How strongly one feature pushes the prediction up or down. A big weight = that feature matters a lot.',
    example: 'Weight +1.2 on "hours" means more hours push towards "pass".',
    tech: 'wⱼ, the number multiplied by feature xⱼ.',
  },
  {
    name: 'Residual',
    plain: 'How far off the model was for one point: the real value minus the predicted value.',
    example: 'Real score 68, predicted 65 → residual = +3 (the model guessed 3 too low).',
    tech: 'residual = y − ŷ.',
  },
  {
    name: 'Mean Squared Error (MSE)',
    plain: 'Take every mistake, square it (so negatives don\'t cancel and big misses count extra), then average.',
    example: 'Mistakes 0, −3, +3, −1 → squared 0, 9, 9, 1 → average = 19 ÷ 4 = 4.75.',
    tech: 'MSE = (sum of (y − ŷ)² over all points) ÷ (number of points).',
  },
  {
    name: 'Gradient',
    plain: 'An arrow that says "if you change the knobs this way, the error goes up fastest". We go the opposite way to reduce the error.',
    example: 'Gradient says "raising the slope lowers the error a lot" → so we raise the slope.',
    tech: 'The set of derivatives of the loss: how much the loss changes for a tiny change in each parameter.',
  },
  {
    name: 'Gradient descent',
    plain: 'Improve the model in many small steps. Each step, check which direction reduces the error and move the knobs a little that way.',
    example: 'Like walking down a foggy hill: feel the slope under your feet, step downhill, repeat.',
    tech: 'Repeat: parameter = parameter − learning rate × gradient.',
  },
  {
    name: 'Learning rate',
    plain: 'How big each improvement step is.',
    example: 'Too small (0.001): takes forever. Too big (0.03 here): overshoots and the error explodes.',
    tech: 'η (eta), the number the gradient is multiplied by in each step. In boosting: the fraction of each new tree\'s correction that is applied.',
  },
  {
    name: 'Ordinary Least Squares (OLS)',
    plain: 'A ready-made formula that calculates the best straight line directly, without stepping.',
    example: 'For our 4 students it gives slope 5.15 and intercept 39.15 in one calculation.',
    tech: 'slope = Σ(x − x̄)(y − ȳ) ÷ Σ(x − x̄)², where x̄ and ȳ are the averages.',
  },
  {
    name: 'R²',
    plain: 'A grade from 0 to 1 for a number-predicting model. It answers: "compared with just guessing the average every time, what share of the error did my model get rid of?"',
    example: 'Guessing the class average for everyone gives a total error of 100. Our model\'s total error is 20. It removed 80 of the 100 → R² = 0.8. Score 1 = perfect, 0 = no better than guessing the average, negative = worse than guessing the average.',
    tech: 'R² = 1 − (model\'s total squared error) ÷ (total squared error of always guessing the average).',
  },
  {
    name: 'RMSE',
    plain: 'The typical size of a mistake, in the same units as what you predict.',
    example: 'RMSE 4 on exam scores → predictions are usually about 4 points off.',
    tech: 'Square root of the MSE (the square root undoes the squaring so the units are back to points).',
  },

  // ---------------- logistic regression ----------------
  {
    name: 'Sigmoid',
    plain: 'An S-shaped curve that turns any number into a value between 0 and 1, so it can be read as a chance.',
    example: 'Score −4 → 2%. Score 0 → 50%. Score +4 → 98%.',
    tech: 'σ(z) = 1 ÷ (1 + e^(−z)), where e ≈ 2.718.',
  },
  {
    name: 'Probability',
    plain: 'How likely something is, from 0 (never) to 1 (certain). 0.85 = 85%.',
    example: 'The model says 0.92 → it thinks there is a 92% chance this student passes.',
    tech: 'p = the model\'s estimated chance that the label is 1.',
  },
  {
    name: 'Log-odds',
    plain: 'The raw score the model computes before turning it into a chance. Positive leans "yes", negative leans "no", 0 is undecided.',
    example: 'Score +2.4 → leans pass (92%). Score −2.4 → leans fail (8%).',
    tech: 'z = w₁x₁ + w₂x₂ + b. It equals ln(p ÷ (1 − p)).',
  },
  {
    name: 'Decision boundary',
    plain: 'The dividing line where the model switches its answer from one class to the other — where it is exactly 50/50.',
    example: 'With score = 1.2 × hours − 6, the switch is at 5 hours: below → fail, above → pass.',
    tech: 'All points where z = 0 (so the probability is exactly 0.5).',
  },
  {
    name: 'Log loss',
    plain: 'An error score for chance-predictions. Being unsure and wrong costs a bit; being confident and wrong costs a lot.',
    example: 'A student who passed: model said 90% → cost 0.1. Said 10% → cost 2.3. Said 1% → cost 4.6.',
    tech: 'For each point: −ln(p) if the label is 1, −ln(1 − p) if it is 0. Then average.',
  },
  {
    name: 'Threshold',
    plain: 'The cut-off chance above which the model says "yes".',
    example: 'Threshold 50%: a student at 62% → predicted pass; at 41% → predicted fail.',
    tech: 'Predict class 1 when p > threshold (0.5 by default).',
  },
  {
    name: 'Accuracy',
    plain: 'Out of all predictions, the share that were right.',
    example: '94 right out of 100 → 94% accuracy.',
    tech: '(correct predictions) ÷ (all predictions).',
  },
  {
    name: 'Precision',
    plain: 'When the model says "yes", how often is it actually right?',
    example: 'Model flags 12 patients as sick; 8 really are → precision 8 ÷ 12 = 67%.',
    tech: 'true yes ÷ (true yes + false alarms).',
  },
  {
    name: 'Recall',
    plain: 'Of all the real "yes" cases, how many did the model find?',
    example: '10 patients are really sick; the model found 8 → recall 8 ÷ 10 = 80%.',
    tech: 'true yes ÷ (true yes + missed yes).',
  },
  {
    name: 'Confusion matrix',
    plain: 'A small 2×2 table comparing what really happened with what the model said, so you can see which kind of mistake it makes.',
    example: 'Rows = truth (sick / healthy), columns = prediction. Off-diagonal cells are the mistakes: missed cases and false alarms.',
    tech: 'Counts of true positives, false positives, false negatives and true negatives.',
  },
  {
    name: 'Regularisation',
    plain: 'A brake that stops the model from becoming too extreme or too complicated, so it doesn\'t memorise noise.',
    example: 'Instead of a weight of 50, regularisation keeps it near 5.',
    tech: 'An extra penalty added to the loss that grows when parameters get large.',
  },

  // ---------------- trees / forest ----------------
  {
    name: 'Decision tree',
    plain: 'A flowchart of yes/no questions. Follow the answers from the top and you end at a prediction.',
    example: '"Temperature ≤ 30?" yes → "Humidity ≤ 40?" no → THRIVES.',
    tech: 'The data is split again and again on one feature at a time; each end box stores an answer.',
  },
  {
    name: 'Node',
    plain: 'One question inside the tree.',
    example: '"Is temperature ≤ 30?" is a node.',
    tech: 'A split rule: feature + threshold.',
  },
  {
    name: 'Leaf',
    plain: 'An end box of the tree. It holds the final answer for every point that reaches it.',
    example: 'A leaf with 4 wilted plants and 0 thriving ones answers "wilts".',
    tech: 'Predicts the most common class (or the average number) of the training points inside it.',
  },
  {
    name: 'Split',
    plain: 'Dividing a group of points into two smaller groups using one question.',
    example: '10 plants split by "temp ≤ 15?" into a group of 4 and a group of 6.',
    tech: 'Points with feature ≤ threshold go left, the rest go right.',
  },
  {
    name: 'Gini',
    plain: 'A messiness score for a group: 0 means everyone is the same class, 0.5 means a perfect 50/50 mix (with two classes).',
    example: '5 thrive + 5 wilt → 0.5 (messy). 4 wilt + 0 thrive → 0 (clean).',
    tech: 'Gini = 1 − (share of class A)² − (share of class B)².',
  },
  {
    name: 'Impurity',
    plain: 'How mixed a group is. Trees choose questions that make groups less mixed.',
    example: 'A group of all-wilted plants has zero impurity.',
    tech: 'Measured with Gini for categories, or with variance (spread) for numbers.',
  },
  {
    name: 'Bootstrap',
    plain: 'A random sample made by picking rows one at a time and putting each back, so the same row can be picked twice and some rows are never picked.',
    example: 'From rows 1–8 you might draw 2, 5, 5, 1, 7, 2, 8, 3 — rows 4 and 6 were never picked.',
    tech: 'n random draws with replacement from n rows; about 63% of rows appear, 37% don\'t.',
  },
  {
    name: 'Out-of-bag',
    plain: 'The rows a particular tree never saw. They can be used as a free mini test for that tree.',
    example: 'Tree 1 never saw rows 4 and 6, so we check how well tree 1 does on them.',
    tech: 'Rows missing from a tree\'s bootstrap sample (about 37%); averaged over trees they give the OOB score.',
  },
  {
    name: 'Bagging',
    plain: 'Train many models, each on its own random sample, then combine their answers.',
    example: '100 trees, each trained on a different bootstrap sample, then averaged.',
    tech: 'Short for "bootstrap aggregating". Reduces how much predictions jump around.',
  },
  {
    name: 'Random feature subset',
    plain: 'At each question, a tree may only look at a few randomly chosen inputs. This forces the trees to be different from each other.',
    example: 'With 9 features, each question may only consider 3 random ones.',
    tech: 'At each split, only m of the d features are considered (often m = √d).',
  },
  {
    name: 'Majority vote',
    plain: 'Each tree gives its answer, and the answer given by the most trees wins.',
    example: '5 trees say thrive, wilt, thrive, thrive, wilt → 3 vs 2 → THRIVE.',
    tech: 'For numbers, the trees\' answers are averaged instead.',
  },
  {
    name: 'Feature importance',
    plain: 'How much each input helped the model make good decisions.',
    example: 'Temperature 70%, humidity 30% → temperature mattered more.',
    tech: 'How much messiness (impurity) each feature\'s questions removed, added up over all trees.',
  },
  {
    name: 'Ensemble',
    plain: 'A team of models whose answers are combined into one.',
    example: 'A random forest is a team of decision trees.',
    tech: 'A prediction built by combining many simpler models (bagging or boosting).',
  },
  {
    name: 'Variance',
    plain: 'How much a model\'s answers change if you train it on slightly different data. High variance = unstable.',
    example: 'Remove 3 plants and a single deep tree asks completely different questions.',
    tech: 'The spread of a model\'s predictions across different training samples.',
  },

  // ---------------- boosting ----------------
  {
    name: 'Boosting',
    plain: 'Build models one after another, where each new one focuses on fixing the mistakes the earlier ones still make.',
    example: 'Guess 300 → tree 1 fixes part of the error → tree 2 fixes part of what is left → …',
    tech: 'new prediction = old prediction + learning rate × (new tree\'s answer).',
  },
  {
    name: 'Weak learner',
    plain: 'A deliberately simple model that is only a bit better than guessing. Boosting stacks many of them.',
    example: 'A tree with just one or two questions.',
    tech: 'A low-capacity model, typically a shallow decision tree.',
  },
  {
    name: 'Residuals',
    plain: 'What is still wrong after the current prediction, for each point: real value minus current guess.',
    example: 'Real 450, current guess 300 → residual +150 (still 150 too low).',
    tech: 'y − current prediction. In boosting, the next tree is trained to predict these.',
  },
  {
    name: 'Early stopping',
    plain: 'Stop adding more trees once the test score stops getting better.',
    example: 'Test error improves until tree 40, then gets worse → keep 40 trees.',
    tech: 'Halt training when the error on held-out data hasn\'t improved for a few rounds.',
  },
  {
    name: 'λ',
    plain: 'A brake knob that shrinks each tree\'s corrections so no single tree overreacts.',
    example: 'A leaf wants to correct by 150. With λ = 1 it only corrects by 75.',
    tech: 'Leaf value = (sum of residuals in the leaf) ÷ (number of points in the leaf + λ).',
  },
]

const ALIASES: Record<string, string> = {
  features: 'feature', targets: 'target', labels: 'label', parameters: 'parameter', models: 'model',
  mse: 'mean squared error (mse)', 'mean squared error': 'mean squared error (mse)', 'smallest mse': 'mean squared error (mse)',
  ols: 'ordinary least squares (ols)', 'ordinary least squares': 'ordinary least squares (ols)',
  'test data': 'test set', 'training data': 'training set',
  'decision trees': 'decision tree', leaves: 'leaf', nodes: 'node', splits: 'split', 'gini impurity': 'gini',
  'out-of-bag (oob)': 'out-of-bag', oob: 'out-of-bag', 'bootstrap sample': 'bootstrap',
  'weak learners': 'weak learner', 'gradient boosting': 'boosting', regularization: 'regularisation',
  'loss function': 'loss', weights: 'weight', bias: 'intercept', probabilities: 'probability',
  'random forest': 'ensemble', crowd: 'ensemble', vote: 'majority vote',
  'trick 1, bootstrap:': 'bootstrap', 'trick 2, random features:': 'random feature subset', outliers: 'outlier',
  ...UNSUP_ALIASES,
}

export const TERMS: Record<string, Term> = Object.fromEntries([...T, ...UNSUP_TERMS].map((t) => [t.name.toLowerCase(), t]))

export function findTerm(text: string): Term | undefined {
  const k = text.toLowerCase().trim()
  return TERMS[k] ?? TERMS[ALIASES[k]] ?? (k.endsWith('s') ? TERMS[k.slice(0, -1)] : undefined)
}
