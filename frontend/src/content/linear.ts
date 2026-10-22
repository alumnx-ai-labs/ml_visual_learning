import type { Lesson } from './types'

export const linear: Lesson = {
  tagline: 'Predict a number (like an exam score) from another number (like hours studied) by finding the simple rule that connects them.',
  problem: 'A teacher has past students\' hours studied and exam scores. Given a new student\'s study hours, predict the exam score they will get.',
  goal: 'Find the rule "score = (points per hour) × hours + (starting score)" that makes the smallest mistakes on past students, then check it also works on students it has never seen.',
  chapters: [
    {
      title: 'The whole algorithm in one flow',
      story: ['Here is everything linear regression does, start to finish, on 4 students: (1 h, 45), (3 h, 52), (5 h, 68), (7 h, 74). Hover any underlined word for its meaning. Each step links to the chapter that explains it.'],
      flow: [
        { step: 'Collect examples', what: 'Gather past students with their **feature** (hours) and **target** (score).', example: '(1, 45), (3, 52), (5, 68), (7, 74)', see: 'The problem' },
        { step: 'Hide some for testing', what: 'Keep 75% as the **training set**, hide 25% as the **test set**.', example: 'The app hides 1 in 4 points.', see: 'Checking it, and its limits' },
        { step: 'Start with a guess', what: 'Pick any line, e.g. **slope** 0 and **intercept** 0 (a flat line at zero).', example: 'score = 0 × hours + 0', see: 'The idea: a straight line' },
        { step: 'Predict every training point', what: 'Use the current line to make a **prediction** for each student.', example: 'All 4 predictions are 0', loopStart: true },
        { step: 'Measure the mistakes', what: 'Compute each **residual** and average their squares: the **MSE**.', example: 'MSE = (45² + 52² + 68² + 74²) / 4 = 3707', see: 'Measuring mistakes' },
        { step: 'Find the downhill direction', what: 'The **gradient** says how to change slope and intercept to reduce the MSE.', example: 'slope should go up a lot, intercept up a bit', see: 'Finding the best line: walk downhill' },
        { step: 'Take a small step', what: 'Move slope and intercept a little that way. Step size = **learning rate**.', example: 'learning rate 0.01 → slope 5.3, intercept 1.2', loopEnd: 'Repeat steps 4–7 a few hundred times until the MSE stops falling. This is gradient descent.' },
        { step: 'Final model', what: 'The line has settled at the bottom of the loss bowl. (Or jump straight here with the exact **OLS** formula.)', example: 'score = 5.15 × hours + 39.15', see: 'The shortcut formula' },
        { step: 'Grade it honestly', what: 'Predict the hidden test students and compute **R²** and **RMSE**.', example: 'R² ≈ 0.97 → explains 97% of the differences', see: 'Checking it, and its limits' },
        { step: 'Use it', what: 'Plug in a new student\'s hours.', example: '7 hours → 5.15 × 7 + 39.15 ≈ 75 points' },
      ],
    },
    {
      title: 'The problem',
      story: [
        'A teacher has last year\'s records: hours studied and exam score for each student. A parent asks: **"My son studies 7 hours. What will he score?"**',
        'On a chart the dots drift upward: more study, higher score. We want a rule that turns hours into a predicted score.',
      ],
      plain: 'Past examples in, a prediction rule out.',
      tryIt: { text: 'See the real data points in the Data tab.', tab: 'data' },
    },
    {
      title: 'The idea: a straight line',
      story: [
        'Draw a line through the cloud of dots. For any hours, go up to the line and read the score.',
        'A line needs only **two numbers**: the **slope** (points gained per extra hour) and the **intercept** (score at zero hours). Learning = finding those two numbers.',
      ],
      tech: ['$$\\hat y = w\\,x + b', '$w$ = slope (weight), $b$ = intercept (bias). With more features: $\\hat y = w_1x_1 + w_2x_2 + \\dots + b$.'],
      quiz: {
        q: 'Model: score = 6 × hours + 35. What does 6 mean?',
        options: ['Minimum score is 6', 'Each extra hour adds about 6 points'],
        answer: 1,
        why: '6 is the slope: the rise in prediction per extra hour.',
      },
    },
    {
      title: 'Measuring mistakes',
      story: [
        'For each student, the gap between the real score and the line is the **residual**. We square each gap (so + and − don\'t cancel, and big misses count more) and average them. That is the **Mean Squared Error (MSE)**.',
        'Best line = the line with the **smallest MSE**.',
      ],
      figure: 'toyLine',
      example: {
        title: 'Which line is better?',
        intro: 'Line A: ŷ = 5x + 40. Line B: ŷ = 3x + 50.',
        table: {
          head: ['hours', 'actual', 'A predicts', 'A error²', 'B predicts', 'B error²'],
          rows: [
            [1, 45, 45, 0, 53, 64],
            [3, 52, 55, 9, 59, 49],
            [5, 68, 65, 9, 65, 9],
            [7, 74, 75, 1, 71, 9],
            ['', '', 'MSE', '4.75', 'MSE', '32.75'],
          ],
        },
        after: ['Line A wins.'],
      },
      tech: ['$$\\text{MSE} = \\frac1n\\sum_i \\bigl(y_i - (w x_i + b)\\bigr)^2'],
    },
    {
      title: 'Finding the best line: walk downhill',
      story: [
        'Picture every possible line as a spot on a landscape, where height = MSE. The best line is at the bottom of the bowl.',
        '**Gradient descent**: start anywhere, feel which way is downhill, take a small step, repeat. The step size is the **learning rate** — too small is slow, too big overshoots and blows up.',
      ],
      tech: [
        '$$w \\leftarrow w - \\eta\\,\\frac{\\partial\\text{MSE}}{\\partial w},\\quad b \\leftarrow b - \\eta\\,\\frac{\\partial\\text{MSE}}{\\partial b}',
        '$$\\frac{\\partial\\text{MSE}}{\\partial w} = \\frac2n\\sum_i(\\hat y_i - y_i)\\,x_i,\\quad \\frac{\\partial\\text{MSE}}{\\partial b} = \\frac2n\\sum_i(\\hat y_i - y_i)',
      ],
      tryIt: { text: 'Press Play to watch the ball roll down. Then set learning rate to 0.03 and watch it explode.', tab: 'watch' },
    },
    {
      title: 'The shortcut formula',
      story: ['For a straight line there is also an exact formula (Ordinary Least Squares) that jumps straight to the bottom of the bowl — no walking needed.'],
      example: {
        title: 'Best line for the 4 students',
        table: {
          head: ['x', 'y', 'x − x̄', 'y − ȳ', 'product', '(x − x̄)²'],
          rows: [
            [1, 45, -3, -14.75, 44.25, 9],
            [3, 52, -1, -7.75, 7.75, 1],
            [5, 68, 1, 8.25, 8.25, 1],
            [7, 74, 3, 14.25, 42.75, 9],
            ['x̄ = 4', 'ȳ = 59.75', '', '', 'sum 103', 'sum 20'],
          ],
        },
        after: ['Slope = 103 / 20 = **5.15**, intercept = 59.75 − 5.15 × 4 = **39.15**.', 'Answer for the parent: 5.15 × 7 + 39.15 ≈ **75 points**.'],
      },
      tech: ['$$w^* = \\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2},\\qquad b^* = \\bar y - w^*\\bar x', 'Complex models have no such formula, which is why gradient descent matters.'],
    },
    {
      title: 'Checking it, and its limits',
      story: [
        'We hide 25% of the data (the **test set**) and grade on it. **R²** = how much better than just guessing the average (1 = perfect, 0 = useless). **RMSE** = typical error size.',
        'Limits: it can\'t bend for **curved** data, one **outlier** can drag it, and it predicts nonsense far outside the data (30 hours → score 194).',
      ],
      tech: ['$$R^2 = 1 - \\frac{\\sum (y_i-\\hat y_i)^2}{\\sum (y_i-\\bar y)^2}'],
      quiz: {
        q: 'Linear regression scores badly on the "Curved" dataset. Fix?',
        options: ['Train longer', 'Use a model that can bend, like Random Forest'],
        answer: 1,
        why: 'The best straight line is still a straight line. The shape is the problem.',
      },
      tryIt: { text: 'Switch to the "Curved (parabola)" dataset and read the Results verdict.', tab: 'results' },
    },
  ],
  cheat: {
    formulas: [
      { name: 'Model', tex: '\\hat y = w x + b' },
      { name: 'Loss', tex: '\\text{MSE} = \\frac1n\\sum (y-\\hat y)^2' },
      { name: 'Update', tex: 'w \\leftarrow w-\\eta\\,\\partial_w \\text{MSE}' },
      { name: 'R²', tex: '1-\\frac{\\sum (y-\\hat y)^2}{\\sum (y-\\bar y)^2}' },
    ],
    symbols: [
      { sym: 'x, y', meaning: 'input and answer' },
      { sym: 'ŷ', meaning: 'prediction' },
      { sym: 'w, b', meaning: 'slope and intercept' },
      { sym: 'η', meaning: 'learning rate' },
    ],
    use: ['Roughly straight relationships', 'You need a one-line explanation', 'A first baseline'],
    avoid: ['Curved data', 'Big outliers', 'Predicting categories'],
    pitfalls: ['Extrapolating outside the data', 'Learning rate too high'],
    glossary: [
      { term: 'Residual', def: 'Actual minus predicted.' },
      { term: 'Loss', def: 'One number for how wrong the model is.' },
      { term: 'Gradient descent', def: 'Small repeated steps that lower the loss.' },
      { term: 'Underfitting', def: 'Model too simple for the pattern.' },
    ],
  },
}
