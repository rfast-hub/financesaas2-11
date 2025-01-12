import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SentimentData {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  socialMediaMentions: number;
  trendStrength: number;
}

const fetchSentimentData = async (): Promise<SentimentData> => {
  const { data, error } = await supabase.functions.invoke('get-market-sentiment')
  if (error) {
    console.error('Error fetching sentiment data:', error)
    throw new Error('Failed to fetch market sentiment')
  }
  if (!data) {
    throw new Error('No data received from sentiment analysis')
  }
  return data
}

const SentimentAnalysis = () => {
  const { data: sentimentData, isLoading, error } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchSentimentData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: "Failed to load market sentiment data. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-6 h-6 text-success" />;
      case 'bearish':
        return <TrendingDown className="w-6 h-6 text-warning" />;
      default:
        return <MinusCircle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score <= 30) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Loading sentiment data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
        <div className="flex items-center gap-2 text-warning">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Error loading sentiment data</h2>
        </div>
      </div>
    );
  }

  if (!sentimentData) return null;

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Market Sentiment</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Overall Sentiment</span>
            {getSentimentIcon(sentimentData.overallSentiment)}
          </div>
          <div className="text-2xl font-bold capitalize">
            {sentimentData.overallSentiment}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Sentiment Score</span>
          </div>
          <div className={`text-2xl font-bold ${getSentimentColor(sentimentData.sentimentScore)}`}>
            {sentimentData.sentimentScore}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Social Media Activity</span>
          </div>
          <div className="text-2xl font-bold">
            {sentimentData.socialMediaMentions.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">mentions in 24h</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Trend Strength</span>
          </div>
          <div className={`text-2xl font-bold ${getSentimentColor(sentimentData.trendStrength)}`}>
            {sentimentData.trendStrength}%
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SentimentAnalysis;