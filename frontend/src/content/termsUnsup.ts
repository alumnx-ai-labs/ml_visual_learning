import type { Term } from './terms'

/** Terms used by the four unsupervised lessons (K-Means, DBSCAN, PCA, Hierarchical). */
export const UNSUP_TERMS: Term[] = [
  // ---------------- shared ----------------
  {
    name: 'Unsupervised learning',
    plain: 'Learning without an answer key. Nobody tells the computer the right groups or labels; it has to find structure in the data on its own.',
    example: 'A shop has 120 customers with no labels and asks: "are there natural types of customer?"',
    tech: 'Only inputs x are given, no targets y. Typical jobs: finding clusters, or compressing many columns into fewer.',
  },
  {
    name: 'Cluster',
    plain: 'A group of points that are close to each other and far from the other groups.',
    example: 'Big spenders with high income are one cluster of customers.',
    tech: 'A subset of the data found by the algorithm; every point is assigned to one cluster (or to noise).',
  },
  {
    name: 'Distance',
    plain: 'How far apart two points are on the chart. Close points are similar, far points are different.',
    example: 'Two customers 5 apart on the chart are more alike than two customers 80 apart.',
    tech: 'Usually straight-line (Euclidean) distance: √((x₁ − x₂)² + (y₁ − y₂)²).',
  },
  {
    name: 'Dimension',
    plain: 'One measurement per person or thing. Two measurements = 2 dimensions, four measurements = 4 dimensions.',
    example: 'Height and weight = 2 dimensions. Four flower measurements = 4 dimensions.',
    tech: 'The number of feature columns (d).',
  },

  // ---------------- K-Means ----------------
  {
    name: 'Centroid',
    plain: 'The centre of a group: the average position of all the points in it.',
    example: 'A group of customers with incomes 20, 30 and 40 has its centre at income 30.',
    tech: 'The mean of the points in a cluster, computed separately for each feature.',
  },
  {
    name: 'k (number of clusters)',
    plain: 'How many groups you ask K-Means to find. You must choose this before it starts.',
    example: 'k = 4 means "split the customers into 4 groups".',
    tech: 'A setting (hyperparameter) of K-Means. Often chosen with the elbow method.',
  },
  {
    name: 'Convergence',
    plain: 'The point where another round changes nothing, so the algorithm can stop.',
    example: 'The centres stop moving: round 7 ends with the same groups as round 6.',
    tech: 'Assignments and centroids no longer change (or change less than a tiny threshold).',
  },
  {
    name: 'Inertia',
    plain: 'A score for how tight the groups are: the total (squared) distance from every point to its group centre. Smaller = tighter groups.',
    example: 'Inertia 13,262 means points sit close to their centres; 62,124 means many are far from theirs.',
    tech: 'Sum over all points of (distance to own centroid)².',
  },
  {
    name: 'Elbow method',
    plain: 'A way to choose how many groups to use: try 1, 2, 3 … groups and look for the bend where adding more groups stops helping much.',
    example: 'Inertia drops steeply from 1 to 4 groups, then barely drops: the bend (elbow) is at 4.',
    tech: 'Plot inertia against k and pick the k where the curve flattens.',
  },
  {
    name: 'Silhouette score',
    plain: 'A grade from −1 to 1 for how well separated the groups are. Close to 1 = points are clearly in their own group.',
    example: 'Score 0.74 = clean, well-separated groups. Score 0.2 = groups overlap.',
    tech: 'For each point: (distance to the nearest other group − distance to its own group) ÷ the larger of the two; then average.',
  },
  {
    name: 'K-Means++',
    plain: 'A smarter way to pick the first centres: choose them far apart from each other, so the start is rarely unlucky.',
    example: 'Instead of dropping two centres inside the same group, it spreads them across the chart.',
    tech: 'Each next centre is chosen at random with probability proportional to its squared distance from the nearest centre already chosen.',
  },

  // ---------------- DBSCAN ----------------
  {
    name: 'Density',
    plain: 'How crowded an area is: many points packed close together = dense, a few scattered points = sparse.',
    example: 'A busy street corner has many pickups; a quiet suburb has one or two.',
    tech: 'The number of points within a fixed radius.',
  },
  {
    name: 'Epsilon (ε)',
    plain: 'The distance that counts as "nearby". Draw a circle with this radius around a point; everything inside is its neighbour.',
    example: 'ε = 0.5 km: two pickups within half a kilometre are neighbours.',
    tech: 'DBSCAN\'s radius setting, written eps or ε.',
  },
  {
    name: 'Min points (minPts)',
    plain: 'How many neighbours a point needs inside its circle to count as being in a busy area.',
    example: 'minPts = 5: a point needs at least 5 pickups (itself included) within ε to be in a busy zone.',
    tech: 'DBSCAN\'s min_samples setting.',
  },
  {
    name: 'Core point',
    plain: 'A point in the thick of a busy area: it has enough neighbours (at least minPts) inside its circle.',
    example: 'A pickup with 12 other pickups within 0.5 km.',
    tech: 'A point whose ε-neighbourhood contains at least minPts points.',
  },
  {
    name: 'Border point',
    plain: 'A point on the edge of a busy area: it does not have enough neighbours itself, but it sits next to a core point.',
    example: 'A pickup at the edge of a busy street, with only 2 neighbours but within reach of a core point.',
    tech: 'Not a core point, but within ε of a core point; it joins that core point\'s cluster.',
  },
  {
    name: 'Noise point',
    plain: 'A lonely point that belongs to no group: not enough neighbours and not near any busy area.',
    example: 'A one-off pickup far from everything else.',
    tech: 'Neither core nor border; left out of every cluster.',
  },

  // ---------------- PCA ----------------
  {
    name: 'Correlation',
    plain: 'Two measurements that tend to move together. When one goes up, the other usually goes up too.',
    example: 'Taller people tend to weigh more: height and weight are correlated.',
    tech: 'A number from −1 to 1; the stronger the straight-line link between two columns, the closer to ±1.',
  },
  {
    name: 'Spread (variance)',
    plain: 'How widely the points are scattered along a direction. Wide spread = the points differ a lot there = lots of information.',
    example: 'People differ a lot in overall size, so there is a big spread along the "size" direction.',
    tech: 'The average squared distance of the values from their mean, measured along that direction.',
  },
  {
    name: 'Projection',
    plain: 'Dropping each point straight onto a line, like a shadow, so each point is described by one position along the line.',
    example: 'A person at (height +10 cm, weight +9 kg) lands at position 13 along the "size" line.',
    tech: 'The dot product of the point with the line\'s direction vector.',
  },
  {
    name: 'Principal component',
    plain: 'The direction along which the data is most spread out. It is the best single line to describe the data.',
    example: 'For height and weight, the first principal component points along "bigger person / smaller person".',
    tech: 'An eigenvector of the data\'s covariance matrix; the first one has the largest eigenvalue (spread).',
  },
  {
    name: 'Explained variance',
    plain: 'The share of the data\'s total spread that a component keeps. 90% means we lose only about 10% of the information.',
    example: 'The first component keeps 90% of the spread, so one number replaces two with little loss.',
    tech: 'The component\'s eigenvalue divided by the sum of all eigenvalues.',
  },
  {
    name: 'Dimensionality reduction',
    plain: 'Squeezing many measurements per item into fewer, keeping as much information as possible.',
    example: '4 flower measurements squeezed into 2 numbers you can plot.',
    tech: 'Mapping d-dimensional data to fewer dimensions. PCA does it with straight-line projections.',
  },

  // ---------------- Hierarchical ----------------
  {
    name: 'Hierarchical clustering',
    plain: 'Build groups like a family tree: start with every item alone and keep merging the two closest groups until one group remains.',
    example: 'Two neighbouring shops merge first, then they merge with a nearby pair, and so on.',
    tech: 'Agglomerative clustering: repeatedly merge the pair of clusters with the smallest linkage distance.',
  },
  {
    name: 'Linkage',
    plain: 'The rule for measuring how far apart two groups are, so we know which two are closest and should merge.',
    example: '"Average linkage": the average distance between every shop in one group and every shop in the other.',
    tech: 'Common choices: single (nearest pair), complete (farthest pair), average, and Ward (smallest increase in spread).',
  },
  {
    name: 'Dendrogram',
    plain: 'The family-tree picture of the merging. Higher up means those groups were further apart when they merged.',
    example: 'Two shops merging low on the tree are neighbours; groups merging near the top are far apart.',
    tech: 'A tree whose branch heights equal the linkage distance at which clusters merged.',
  },
]

export const UNSUP_ALIASES: Record<string, string> = {
  unsupervised: 'unsupervised learning', clusters: 'cluster', centroids: 'centroid',
  k: 'k (number of clusters)', 'number of clusters': 'k (number of clusters)',
  'k-means++': 'k-means++', 'smart start': 'k-means++', elbow: 'elbow method', silhouette: 'silhouette score',
  epsilon: 'epsilon (ε)', 'ε': 'epsilon (ε)', eps: 'epsilon (ε)', minpts: 'min points (minpts)', 'min points': 'min points (minpts)',
  'core points': 'core point', 'border points': 'border point', 'noise points': 'noise point', noise: 'noise point',
  spread: 'spread (variance)', 'principal components': 'principal component', 'first principal component': 'principal component',
  pc1: 'principal component', dimensions: 'dimension', agglomerative: 'hierarchical clustering',
  dendrograms: 'dendrogram', 'family tree': 'dendrogram',
}
