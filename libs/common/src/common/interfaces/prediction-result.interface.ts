export interface PercentageResult {
  glioma: number;
  meningioma: number;
  noTumor: number;
  pituitary: number;
}

export interface PredictionResult {
  imagePublicUrl: string;
  filename: string;
  index: number;
  percentage?: PercentageResult;
}

export interface PredictionResultDto {
  index: number;
  percentage: PercentageResult;
}
