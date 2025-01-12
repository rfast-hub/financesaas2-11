import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SentimentData {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  trendStrength: number;
  lastUpdated: string;
}

const fetchSentimentData = async (): Promise<SentimentData> => {
  const { data, error } = await supabase.functions.invoke('get-market-sentiment');
  
  if (error) {
    console.error('Error fetching sentiment data:', error);
    throw new Error(error.message || 'Failed to fetch market sentiment');
  }
  
  if (!data) {
    throw new Error('No data received from sentiment analysis');
  }
  
  return data;
};

export const useSentimentData = () => {
  return useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchSentimentData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};