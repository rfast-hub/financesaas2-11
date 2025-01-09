import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";

interface SentimentData {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  socialMediaMentions: number;
  trendStrength: number;
}

const mockSentimentData: SentimentData = {
  overallSentiment: 'bullish',
  sentimentScore: 75,
  socialMediaMentions: 15420,
  trendStrength: 82,
};

const SentimentAnalysis = () => {
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
            {getSentimentIcon(mockSentimentData.overallSentiment)}
          </div>
          <div className="text-2xl font-bold capitalize">
            {mockSentimentData.overallSentiment}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Sentiment Score</span>
          </div>
          <div className={`text-2xl font-bold ${getSentimentColor(mockSentimentData.sentimentScore)}`}>
            {mockSentimentData.sentimentScore}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Social Media Activity</span>
          </div>
          <div className="text-2xl font-bold">
            {mockSentimentData.socialMediaMentions.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">mentions in 24h</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Trend Strength</span>
          </div>
          <div className={`text-2xl font-bold ${getSentimentColor(mockSentimentData.trendStrength)}`}>
            {mockSentimentData.trendStrength}%
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SentimentAnalysis;