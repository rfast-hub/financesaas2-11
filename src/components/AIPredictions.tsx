import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PredictionChart } from "./predictions/PredictionChart";
import { AnalysisSummary } from "./predictions/AnalysisSummary";
import { PredictionCard } from "./predictions/PredictionCard";
import type { PredictionData } from "./predictions/types";

const fetchPrediction = async () => {
  try {
    const { data, error } = await supabase.functions.invoke<PredictionData>('get-bitcoin-prediction');
    
    if (error) throw error;
    if (!data) throw new Error('No data received');
    
    return data;
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

const AIPredictions = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bitcoinPrediction'],
    queryFn: fetchPrediction,
    enabled: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleGeneratePrediction = () => {
    refetch();
  };

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">AI Price Predictions</h2>
        </div>
        <Button onClick={handleGeneratePrediction} disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Generate Prediction"}
        </Button>
      </div>

      {data && (
        <>
          <PredictionChart predictions={data.predictions} />
          <div className="space-y-4">
            <AnalysisSummary 
              analysis={data.analysis} 
              keyIndicators={data.keyIndicators} 
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.predictions.map((pred) => (
                <PredictionCard 
                  key={pred.timestamp} 
                  prediction={pred} 
                  basePrice={data.predictions[0].price}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIPredictions;