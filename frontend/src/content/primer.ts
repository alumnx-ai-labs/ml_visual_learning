import type { Chapter } from './types'

/** Shared "chapter 0" shown before every algorithm: the absolute basics for a complete beginner. */
export const PRIMER: Chapter = {
  title: 'Start here: what is machine learning?',
  story: [
    'Normal programming: a person writes the rules. **Machine learning**: we give the computer solved examples and it **finds the rule itself**. The rule it finds is called a **model**.',
    'If every example has the right answer attached, it is **supervised learning**. Predicting a number (price, score) is **regression**. Predicting a category (pass/fail, spam/not spam) is **classification**.',
  ],
  figure: 'mlLoop',
  plain: 'Show the computer lots of solved examples, it learns the pattern, then it answers new cases.',
  example: {
    title: 'The vocabulary on one tiny table',
    table: {
      head: ['row', 'hours studied (feature)', 'exam score (target)', 'used for'],
      rows: [
        ['student 1', 2, 47, 'training'],
        ['student 2', 5, 66, 'training'],
        ['student 3', 8, 83, 'training'],
        ['student 4', 4, 58, 'test (hidden)'],
      ],
    },
    after: ['The model learns from students 1–3, then guesses student 4 without seeing the answer. Comparing its guess to the real 58 is an honest grade.'],
  },
  tech: [
    'A model is a function with adjustable knobs (parameters): $\\hat y = f(x;\\theta)$. **Training** turns the knobs to make a **loss** (a single "how wrong" number) as small as possible.',
    'Good on training data but bad on test data = **overfitting**. Bad on both = **underfitting**.',
  ],
  quiz: {
    q: 'Predicting whether a patient will be readmitted (yes / no) is…',
    options: ['Regression', 'Classification'],
    answer: 1,
    why: 'The answer is a category, not a number.',
  },
}
