import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TradingSignal {
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

const TradingSignals = () => {
  const { data: signal, isLoading, error } = useQuery({
    queryKey: ['tradingSignals', 'bitcoin'],
    queryFn: async () => {
      // First get current market data
      const { data: marketData, error: marketError } = await supabase.functions.invoke('get-crypto-data');
      if (marketError) throw marketError;

      // Then get trading signals based on market data
      const { data: signalData, error: signalError } = await supabase.functions.invoke<TradingSignal>('get-trading-signals', {
        body: { 
          cryptocurrency: 'bitcoin',
          marketData 
        }
      });
      
      if (signalError) throw signalError;
      return signalData;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5" />
          <h2 className="text-xl font-semibold">AI Trading Signals</h2>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <p>Failed to load trading signals</p>
        </div>
      </Card>
    );
  }

  const getSignalIcon = () => {
    switch (signal?.signal) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRiskColor = () => {
    switch (signal?.riskLevel) {
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
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5" />
        <h2 className="text-xl font-semibold">AI Trading Signals</h2>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSignalIcon()}
            <span className="font-semibold capitalize">{signal?.signal} Signal</span>
          </div>
          <span className="text-sm">
            {(signal?.confidence * 100).toFixed(1)}% confidence
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Timeframe</span>
            <span className="capitalize">{signal?.timeframe.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Level</span>
            <span className={`capitalize ${getRiskColor()}`}>{signal?.riskLevel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Support</span>
            <span>${signal?.keyLevels.support.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Resistance</span>
            <span>${signal?.keyLevels.resistance.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Analysis</h3>
          <p className="text-sm text-muted-foreground">{signal?.reasoning}</p>
        </div>
      </div>
    </Card>
  );
};

export default TradingSignals;