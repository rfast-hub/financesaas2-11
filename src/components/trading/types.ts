export interface TradingSignal {
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  reasoning: string;
  keyLevels: {
    support: number;
    resistance: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
}