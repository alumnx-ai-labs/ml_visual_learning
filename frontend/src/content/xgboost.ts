import type { Lesson } from './types'

export const xgboost: Lesson = {
  tagline: 'Add small trees one at a time, each one fixing the mistakes the others still make.',
  problem: 'A real-estate company needs house-price predictions as accurate as possible. A random forest\'s trees work independently, so none of them learns from the others\' mistakes.',
  goal: 'Build small trees in sequence, each correcting the errors still left, and stop before test error starts rising, to reach the lowest possible test error.',
  chapters: [
    {
      title: 'The idea: learn from mistakes',
      story: [
        'In a random forest every tree works **alone** — none of them learns from the others\' mistakes. Boosting changes that.',
        'Think of a golfer: the first shot lands short, the next shot aims at the **remaining distance**, and so on. Each new tree aims only at what is still wrong.',
      ],
      figure: 'boosting',
      plain: 'Guess, check how far off you are, fix part of the gap, repeat.',
    },
    {
      title: 'Step 0: start with the average',
      story: ['Predict house prices. Before any tree, the model guesses the **average** (300) for every house. The **residual** (actual − guess) shows where it is too low or too high.'],
      example: {
        title: 'Starting guess = 300',
        table: {
          head: ['house', 'size', 'actual', 'guess', 'residual'],
          rows: [
            ['A', 1000, 200, 300, -100],
            ['B', 1200, 250, 300, -50],
            ['C', 1500, 300, 300, 0],
            ['D', 2200, 450, 300, 150],
          ],
        },
      },
    },
    {
      title: 'Each tree learns the residuals',
      story: [
        'Tree 1 is trained to predict the **residuals**, not the price. It learns "size ≤ 1800 → −50, else → +150".',
        'We add only part of its answer — the **learning rate** (here 0.5) — so no single tree overreacts. Then tree 2 learns the new, smaller residuals.',
      ],
      example: {
        title: 'Predictions improving (learning rate 0.5)',
        table: {
          head: ['house', 'actual', 'start', 'after tree 1', 'after tree 2'],
          rows: [
            ['A', 200, 300, 275, 250],
            ['B', 250, 300, 275, 250],
            ['C', 300, 300, 275, 300],
            ['D', 450, 300, 375, 400],
            ['', 'RMSE', '93.5', '55.9', '35.4'],
          ],
        },
      },
      tech: ['$$F_m(x) = F_{m-1}(x) + \\eta\\,h_m(x)', 'Residuals are the negative gradient of the loss, so this is gradient descent where each step is a tree — hence "gradient boosting".'],
      tryIt: { text: 'Step through trees in Watch it learn: red dots are residuals, green is what the next tree learns.', tab: 'watch' },
    },
    {
      title: 'Why "eXtreme"?',
      story: ['XGBoost adds **regularisation**: it shrinks leaf values and penalises big trees so they don\'t chase noise. It is also very fast and handles missing values.'],
      example: {
        title: 'λ shrinks a leaf holding one house (residual 150)',
        table: { head: ['λ', '0', '1', '5'], rows: [['leaf value = 150 / (1 + λ)', '150', '75', '25']] },
      },
      tech: ['$$w_j^* = -\\frac{\\sum_{i\\in j} g_i}{\\sum_{i\\in j} h_i + \\lambda}', '$g, h$ are the 1st and 2nd derivatives of the loss per point.'],
    },
    {
      title: 'When to stop',
      story: ['Training error always falls as trees are added. Test error falls, then flattens, then may **rise** — that is overfitting. Stop there, or use a smaller learning rate, shallower trees or a higher λ.'],
      quiz: {
        q: 'Test loss starts rising after tree 40. What do you do?',
        options: ['Add more trees', 'Stop near 40 or lower the learning rate'],
        answer: 1,
        why: 'Rising test loss means the extra trees are memorising noise.',
      },
      tryIt: { text: 'Set learning rate 1 and depth 6, then watch the test curve in chart 3.', tab: 'watch' },
    },
    {
      title: 'Forest vs boosting',
      story: ['Both use many trees. A forest builds deep trees **independently** and averages them. Boosting builds small trees **in sequence**, each fixing the last. Boosting is often more accurate; a forest needs less tuning.'],
      tryIt: { text: 'Run Random Forest and XGBoost on "Wavy (sine)" and compare their Results.', tab: 'results' },
    },
  ],
  cheat: {
    formulas: [
      { name: 'Additive model', tex: 'F_m = F_{m-1} + \\eta\\,h_m' },
      { name: 'Residual', tex: 'r_i = y_i - F_{m-1}(x_i)' },
      { name: 'Leaf value', tex: 'w^* = -\\frac{\\sum g}{\\sum h + \\lambda}' },
      { name: 'Classification', tex: 'p = \\sigma(F_M(x))' },
    ],
    symbols: [
      { sym: 'F_m', meaning: 'prediction after m trees' },
      { sym: 'h_m', meaning: 'the m-th tree' },
      { sym: 'η', meaning: 'learning rate' },
      { sym: 'λ', meaning: 'regularisation strength' },
    ],
    use: ['Tabular data where accuracy matters most', 'Complex patterns', 'Missing values'],
    avoid: ['Tiny datasets', 'Images or text'],
    pitfalls: ['Too many trees with a high learning rate', 'Deep trees'],
    glossary: [
      { term: 'Boosting', def: 'Models added in sequence, each fixing earlier errors.' },
      { term: 'Residual', def: 'What is still wrong.' },
      { term: 'Learning rate', def: 'How much of each tree\'s fix is applied.' },
      { term: 'Early stopping', def: 'Stop when test error stops improving.' },
    ],
  },
}
