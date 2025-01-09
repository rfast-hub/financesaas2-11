import { Card } from "@/components/ui/card";
import { KeyIndicators } from './types';

interface AnalysisSummaryProps {
  analysis: string;
  keyIndicators: KeyIndicators;
}

export const AnalysisSummary = ({ analysis, keyIndicators }: AnalysisSummaryProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
      <p className="text-muted-foreground">{analysis}</p>
      {keyIndicators && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Trend</p>
            <p className={`font-semibold ${
              keyIndicators.trend === 'bullish' ? 'text-success' :
              keyIndicators.trend === 'bearish' ? 'text-warning' :
              'text-muted-foreground'
            }`}>
              {keyIndicators.trend.toUpperCase()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Strength Index</p>
            <p className="font-semibold">{keyIndicators.strengthIndex}/100</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Volatility</p>
            <p className="font-semibold">{keyIndicators.volatilityScore}/100</p>
          </div>
        </div>
      )}
    </Card>
  );
};