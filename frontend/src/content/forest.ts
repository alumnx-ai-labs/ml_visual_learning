import type { Lesson } from './types'

export const forest: Lesson = {
  tagline: 'Ask many simple yes/no question flowcharts for their answer, and go with what most of them say.',
  problem: 'A plant nursery wants to predict whether a plant will thrive or wilt from temperature and humidity. Plants only thrive in a middle zone, so no straight line can separate the two groups.',
  goal: 'Build many small question flowcharts, each from a slightly different random sample of the plants, and let them vote, so the answer can follow any shape without memorising flukes.',
  chapters: [
    {
      title: 'The whole algorithm in one flow',
      story: ['Everything a random forest does, start to finish. Example: thrive or wilt from temperature and humidity. Hover any underlined word for its meaning.'],
      flow: [
        { step: 'Collect examples', what: 'Plants with **features** (temperature, humidity) and a **label** (thrive / wilt). Hide 25% as the **test set**.', see: 'The problem, and the decision tree' },
        { step: 'Choose settings', what: 'How many trees (e.g. 100), how deep each tree may grow.', example: '100 trees, max depth 4' },
        { step: 'Draw a random sample', what: 'For this tree, pick rows at random with replacement: a **bootstrap** sample. Unpicked rows are **out-of-bag**.', example: 'rows 2, 5, 5, 1, 7, 2, 8, 3 (rows 4, 6 left out)', loopStart: true, see: 'Making the trees different' },
        { step: 'Ask the best question', what: 'At a **node**, look at a random subset of features, try every threshold, and keep the **split** that lowers **Gini** the most.', example: '"temp ≤ 15?" → Gini 0.50 → 0.17', see: 'How a tree picks its questions' },
        { step: 'Keep splitting', what: 'Repeat inside each group until max depth or the group is pure. Each end box is a **leaf** holding the majority answer.', example: 'leaf: 4 wilt, 0 thrive → WILTS' },
        { step: 'One tree done', what: 'This **decision tree** is now a full flowchart.', loopEnd: 'Repeat steps 3–6 for every tree (each with its own random sample).' },
        { step: 'Predict', what: 'Send a new plant down every tree; each tree answers.', example: 'thrive, wilt, thrive, thrive, wilt', see: 'The vote' },
        { step: 'Vote', what: '**Majority vote** for classes, average for numbers.', example: '3 of 5 say thrive → THRIVE (60%)', see: 'The vote' },
        { step: 'Grade it honestly', what: 'Test-set accuracy, the free **out-of-bag** score, and **feature importance**.', see: 'Bonus and limits' },
      ],
    },
    {
      title: 'The problem, and the decision tree',
      story: [
        'A nursery wants to predict if a plant will **thrive or wilt** from temperature and humidity. Plants thrive only in a middle zone, so no straight line separates them.',
        'A gardener would use a flowchart of questions: "Above 30°C? Humidity under 40%?" That flowchart is a **decision tree**. Each question cuts the chart, and enough cuts can box in any shape.',
      ],
      example: {
        title: 'A tiny tree',
        code: `temperature <= 30?
├─ yes → temperature <= 15?
│        ├─ yes → WILTS
│        └─ no  → humidity <= 40?
│                 ├─ yes → WILTS
│                 └─ no  → THRIVES
└─ no  → WILTS`,
      },
    },
    {
      title: 'How a tree picks its questions',
      story: ['It tries every feature and threshold, and keeps the question that splits the data into the **purest** groups (mostly one class each). Purity is measured by **Gini**: 0 = pure, 0.5 = a 50/50 mess.'],
      example: {
        title: '10 plants (5 thrive, 5 wilt): which question is better?',
        table: {
          head: ['question', 'left group', 'right group', 'Gini after'],
          rows: [
            ['temp ≤ 15?', '4 wilt, 0 thrive', '1 wilt, 5 thrive', '0.17'],
            ['humidity ≤ 50?', '3 wilt, 2 thrive', '2 wilt, 3 thrive', '0.48'],
          ],
        },
        after: ['Lower is purer, so the tree asks "temp ≤ 15?" first, then repeats inside each group.'],
      },
      tech: ['$$G = 1 - \\sum_k p_k^2', 'For regression trees the leaf predicts the average value, and splits minimise variance.'],
    },
    {
      title: 'One tree overfits; a crowd does not',
      story: [
        'Left alone, a tree keeps splitting until it memorises every odd plant — perfect on training data, worse on new data (**overfitting**). Change the data a little and you get a very different tree.',
        'Fix: ask a **crowd**. Many trees\' random errors cancel out when averaged — but only if the trees are **different** from each other.',
      ],
      quiz: {
        q: '100% on training data, 78% on test data. This is…',
        options: ['Underfitting', 'Overfitting'],
        answer: 1,
        why: 'It memorised the training data instead of learning the general pattern.',
      },
    },
    {
      title: 'Making the trees different',
      story: [
        '**Trick 1, bootstrap:** each tree gets its own random sample of rows, drawn with replacement. Some rows repeat; about 37% are left out ("out-of-bag") and can be used for a free accuracy check.',
        '**Trick 2, random features:** at each split a tree may only look at a random subset of features, so trees don\'t all ask the same first question.',
      ],
      figure: 'bootstrap',
      tryIt: { text: 'In Watch it learn, click Tree 1, 2, 3: big dots were drawn more than once, hollow dots were left out.', tab: 'watch' },
    },
    {
      title: 'The vote',
      story: ['A new plant goes down every tree. For classification the **majority vote** wins; for numbers the trees are **averaged**. Jagged single-tree boundaries smooth out into a good one.'],
      example: {
        title: 'Five trees, one plant',
        table: { head: ['tree 1', 'tree 2', 'tree 3', 'tree 4', 'tree 5', 'forest'], rows: [['thrive', 'wilt', 'thrive', 'thrive', 'wilt', 'thrive (3/5)']] },
      },
      tech: ['$$\\hat y(x) = \\frac1T\\sum_{t=1}^{T} f_t(x)'],
      tryIt: { text: 'Drag "Number of trees combined" from 1 up, and click the chart to see the vote at that spot.', tab: 'watch' },
    },
    {
      title: 'Bonus and limits',
      story: [
        '**Bonus:** it reports **feature importance** — how much each feature helped the splits.',
        '**Limits:** it can\'t predict beyond the range it has seen, and hundreds of trees are hard to explain in one sentence.',
      ],
      tryIt: { text: 'See out-of-bag score and feature importance in Results.', tab: 'results' },
    },
  ],
  cheat: {
    formulas: [
      { name: 'Gini', tex: 'G = 1-\\sum_k p_k^2' },
      { name: 'Forest prediction', tex: '\\hat y = \\tfrac1T\\sum_t f_t(x)' },
      { name: 'Out-of-bag share', tex: '(1-\\tfrac1n)^n\\approx 37\\%' },
    ],
    symbols: [
      { sym: 'T', meaning: 'number of trees' },
      { sym: 'f_t(x)', meaning: 'prediction of tree t' },
      { sym: 'p_k', meaning: 'share of class k in a node' },
    ],
    use: ['Non-linear tabular data', 'Strong results with little tuning', 'You want feature importance'],
    avoid: ['Extrapolation', 'Need for a tiny explainable model'],
    pitfalls: ['Too few trees', 'Very deep trees still overfit'],
    glossary: [
      { term: 'Decision tree', def: 'Flowchart of yes/no questions.' },
      { term: 'Bootstrap', def: 'Random sample of rows with replacement.' },
      { term: 'Out-of-bag', def: 'Rows a tree never saw.' },
      { term: 'Overfitting', def: 'Memorising training data, failing on new data.' },
    ],
  },
}
