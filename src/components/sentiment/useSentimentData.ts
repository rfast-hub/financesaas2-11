import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SentimentData {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  socialMediaMentions: number;
  trendStrength: number;
}

const fetchSentimentData = async (): Promise<SentimentData> => {
  const { data, error } = await supabase.functions.invoke('get-market-sentiment');
  
  if (error) {
    console.error('Error fetching sentiment data:', error);
    throw new Error(error.message || 'Failed to fetch market sentiment');
  }
  
  if (!data) {
    throw new Error('No data received from sentiment analysis. Please ensure your Alpha Vantage API key is set.');
  }
  
  return data;
};

export const useSentimentData = () => {
  return useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchSentimentData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast.error("Failed to load market sentiment data", {
          description: error.message || "Please ensure your Alpha Vantage API key is set.",
        });
      }
    }
  });
};