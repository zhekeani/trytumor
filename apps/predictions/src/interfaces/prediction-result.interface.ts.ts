export interface Percentage {
  type: string;
  percentage: number;
}

export interface PredictionResult {
  imageUrl: string;
  percentages: Percentage[];
}
