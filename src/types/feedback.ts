export interface DimensionScore {
  name: string;
  score: number;
  weight: number;
}

export interface MetricIndicator {
  label: string;
  value: number;
  max: number;
  benchmark: number;
}
