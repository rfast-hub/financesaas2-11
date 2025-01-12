import { Brain, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";

interface SentimentIconProps {
  sentiment: string;
}

export const SentimentIcon = ({ sentiment }: SentimentIconProps) => {
  switch (sentiment.toLowerCase()) {
    case 'bullish':
      return <TrendingUp className="w-5 h-5 text-success" />;
    case 'bearish':
      return <TrendingDown className="w-5 h-5 text-warning" />;
    case 'neutral':
      return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
    default:
      return <Brain className="w-5 h-5 text-primary" />;
  }
};