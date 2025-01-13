import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TradingSignal } from "./types";

interface TradingSignalContentProps {
  signal: TradingSignal;
}

export const TradingSignalContent = ({ signal }: TradingSignalContentProps) => {
  const getSignalIcon = () => {
    switch (signal.signal) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRiskColor = () => {
    switch (signal.riskLevel) {
      case 'low':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSignalIcon()}
          <span className="font-semibold capitalize">{signal.signal} Signal</span>
        </div>
        <span className="text-sm">
          {(signal.confidence * 100).toFixed(1)}% confidence
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Timeframe</span>
          <span className="capitalize">{signal.timeframe.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Risk Level</span>
          <span className={`capitalize ${getRiskColor()}`}>{signal.riskLevel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Support</span>
          <span>${signal.keyLevels.support.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Resistance</span>
          <span>${signal.keyLevels.resistance.toLocaleString()}</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Analysis</h3>
        <p className="text-sm text-muted-foreground">{signal.reasoning}</p>
      </div>
    </div>
  );
};