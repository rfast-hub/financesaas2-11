import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface TradingInsight {
  recommendation: string;
  confidence: number;
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

export const AITradingInsights = () => {
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['tradingInsights'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TradingInsight>('get-trading-insights');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5" />
          <h2 className="text-xl font-semibold">AI Trading Insights</h2>
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
          <p>Failed to load trading insights</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5" />
        <h2 className="text-xl font-semibold">AI Trading Insights</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" />
            <h3 className="font-semibold">Recommendation</h3>
          </div>
          <p className="text-muted-foreground">{insights?.recommendation}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Opportunities</h3>
            <ul className="list-disc list-inside space-y-1">
              {insights?.opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-muted-foreground">{opportunity}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Risks</h3>
            <ul className="list-disc list-inside space-y-1">
              {insights?.risks.map((risk, index) => (
                <li key={index} className="text-sm text-muted-foreground">{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};