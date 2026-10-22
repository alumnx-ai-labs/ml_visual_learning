import type { Lesson } from './types'

export const logistic: Lesson = {
  tagline: 'Answer a yes/no question (will this student pass?) and say how sure you are (e.g. 85% sure).',
  problem: 'A school wants to know early which students will pass or fail, using measurements like hours studied and hours slept — and how sure it can be.',
  goal: 'Learn a line that separates students who passed from those who failed, turn each student’s distance from that line into a chance of passing, and check it is right on students it has never seen.',
  chapters: [
    {
      title: 'The whole algorithm in one flow',
      story: ['Everything logistic regression does, start to finish. Example: predicting pass (1) or fail (0) from hours studied. Hover any underlined word for its meaning.'],
      flow: [
        { step: 'Collect examples', what: 'Past students with **features** (hours, sleep) and a **label**: pass = 1, fail = 0.', see: 'The problem: yes or no' },
        { step: 'Prepare', what: 'Rescale features to similar sizes, and hide 25% as the **test set**.' },
        { step: 'Start with a guess', what: 'All **weights** = 0, so every student gets score 0 → 50% chance.', example: 'p = 0.5 for everyone' },
        { step: 'Score each student', what: 'Weighted sum of the features: z = w × hours + b. This is the **log-odds**.', example: 'Later in training: z = 1.2 × 7 − 6 = 2.4', loopStart: true, see: 'The decision boundary' },
        { step: 'Turn the score into a chance', what: 'Squash z with the **sigmoid** into a **probability** between 0 and 1.', example: 'σ(2.4) = 0.92 → 92% chance of passing', see: 'The trick: an S-shaped curve' },
        { step: 'Measure the mistakes', what: 'Compute the **log loss**: confident wrong answers cost a lot.', example: 'A passer given 10% costs 2.3; given 90% costs 0.1', see: 'How it learns' },
        { step: 'Nudge the line', what: 'Each student pulls by (probability − label). **Gradient descent** moves the weights a small step.', example: 'Passer at 23% → error −0.77 → strong pull', loopEnd: 'Repeat steps 4–7 a few hundred times until the loss stops falling.', see: 'How it learns' },
        { step: 'Final model', what: 'The **decision boundary** is where z = 0 (a 50/50 chance). One side → pass, other side → fail.', example: 'z = 1.2 × hours − 6 → boundary at 5 hours', see: 'The decision boundary' },
        { step: 'Grade it honestly', what: 'On hidden students: **accuracy**, **precision**, **recall** and the **confusion matrix**.', see: 'Grading: accuracy is not enough' },
        { step: 'Use it', what: 'New student → score → probability → pass if above 50% (the **threshold**).', example: '3 hours → z = −2.4 → 8% → at risk' },
      ],
    },
    {
      title: 'The problem: yes or no',
      story: [
        'The school wants to spot students **at risk of failing** early. The answer is a category — pass or fail — so this is **classification**.',
        'We also want confidence: "85% likely to pass" is more useful than just "pass". (Despite the name, logistic regression is a classifier.)',
      ],
      plain: 'Look at a student, answer pass/fail, and say how sure you are.',
    },
    {
      title: 'The trick: an S-shaped curve',
      story: [
        'A straight line would give "probabilities" like 160% or −30%. So we compute a score $z$ the same way as a line, then squash it with the **sigmoid**, which always lands between 0 and 1.',
        'Big positive score → near 100%. Big negative → near 0%. Zero → 50/50.',
      ],
      figure: 'sigmoid',
      example: {
        title: 'Score → probability',
        table: { head: ['score z', '−4', '−2', '0', '2', '4'], rows: [['probability', '2%', '12%', '50%', '88%', '98%']] },
      },
      tech: ['$$z = w_1x_1 + w_2x_2 + b,\\qquad p = \\sigma(z) = \\frac{1}{1+e^{-z}}'],
    },
    {
      title: 'The decision boundary',
      story: [
        'Say the model learns $z = 1.2 \\times \\text{hours} - 6$. A 7-hour student: $z = 2.4$ → **92%** pass. A 3-hour student: $z = -2.4$ → **8%**.',
        'The switch happens where $z = 0$ (here, 5 hours). With two features (study + sleep) that switch point becomes a **straight line** across the chart — the fence between the classes.',
      ],
      tryIt: { text: 'The black line in Watch it learn is this fence. Click any dot to see its score and probability.', tab: 'watch' },
    },
    {
      title: 'How it learns',
      story: [
        'It is graded with **log loss**: being confidently wrong is punished hard. A passing student given 90% costs 0.1; given 1% costs 4.6.',
        'Then gradient descent nudges the fence. Each point pulls by **(predicted − actual)**, so wrong or unsure points near the fence do most of the pulling.',
      ],
      tech: [
        '$$\\mathcal L = -\\frac1n\\sum_i \\bigl[y_i\\ln p_i + (1-y_i)\\ln(1-p_i)\\bigr]',
        '$$\\frac{\\partial\\mathcal L}{\\partial w_j} = \\frac1n\\sum_i (p_i - y_i)\\,x_{ij}',
      ],
      quiz: {
        q: 'Which points move the fence most?',
        options: ['Points far away on the correct side', 'Wrong or uncertain points near the fence'],
        answer: 1,
        why: 'Their (p − y) is large. Confident correct points have p ≈ y, so they barely pull.',
      },
    },
    {
      title: 'Grading: accuracy is not enough',
      story: ['If 10 in 100 patients are sick, a model that says "nobody is sick" is 90% accurate — and useless. So we also check **precision** (are its alarms right?) and **recall** (did it catch the real cases?).'],
      example: {
        title: '100 patients, 10 sick. Model flags 12, of which 8 are sick.',
        table: {
          head: ['', 'flagged sick', 'flagged healthy'],
          rows: [['truly sick', '8', '2 (missed)'], ['truly healthy', '4 (false alarm)', '86']],
        },
        after: ['Accuracy 94%, precision 8/12 = **67%**, recall 8/10 = **80%**.'],
      },
      tryIt: { text: 'See the confusion matrix in the Results tab.', tab: 'results' },
    },
    {
      title: 'Its limit',
      story: ['The fence is always **straight**. If one class surrounds the other (circles) or they interlock (moons), no straight line can separate them. That is where tree models come in.'],
      quiz: {
        q: 'Why does it fail on "Concentric circles"?',
        options: ['Not enough training steps', 'No straight line can separate a ring from its centre'],
        answer: 1,
        why: 'The model\'s shape is the problem, not the training.',
      },
      tryIt: { text: 'Pick "Two moons" and press Play to see the fence struggle.', tab: 'watch' },
    },
  ],
  cheat: {
    formulas: [
      { name: 'Score', tex: 'z = w_1x_1 + w_2x_2 + b' },
      { name: 'Probability', tex: 'p = \\frac{1}{1+e^{-z}}' },
      { name: 'Log loss', tex: '-\\frac1n\\sum [y\\ln p + (1-y)\\ln(1-p)]' },
      { name: 'Boundary', tex: 'z = 0 \\iff p = 0.5' },
    ],
    symbols: [
      { sym: 'p', meaning: 'probability of class 1' },
      { sym: 'y', meaning: 'true label (0 or 1)' },
      { sym: 'z', meaning: 'score (log-odds)' },
      { sym: 'σ', meaning: 'sigmoid' },
    ],
    use: ['Yes/no with a roughly straight divide', 'You need probabilities', 'You need to explain the weights'],
    avoid: ['Curved or wrapped class shapes'],
    pitfalls: ['Trusting accuracy on imbalanced data', 'Unscaled features'],
    glossary: [
      { term: 'Sigmoid', def: 'Squashes any number into 0–1.' },
      { term: 'Decision boundary', def: 'Where the model is 50/50.' },
      { term: 'Precision', def: 'How often an alarm is right.' },
      { term: 'Recall', def: 'How many real cases were caught.' },
    ],
  },
}
