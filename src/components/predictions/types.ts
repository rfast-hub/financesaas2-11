export interface Prediction {
  price: number;
  timestamp: string;
  confidence: number;
  support: number;
  resistance: number;
}

export interface KeyIndicators {
  trend: 'bullish' | 'bearish' | 'neutral';
  strengthIndex: number;
  volatilityScore: number;
}

export interface PredictionData {
  predictions: Prediction[];
  analysis: string;
  keyIndicators: KeyIndicators;
}