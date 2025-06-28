import type{ ModelOption } from "../types/ModelOption";

export const defaultModels: ModelOption[] = [
  {
    id: 'isolation-forest',
    name: 'Isolation Forest',
    description: 'Effective for detecting anomalies in high-dimensional datasets using isolation techniques',
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    description: 'Identifies anomalies by measuring the distance to k nearest neighbors in the feature space',
  },
  {
    id: 'pca',
    name: 'Principal Component Analysis',
    description: 'Detects anomalies by analyzing deviations in the principal components of the data',
  },
];
