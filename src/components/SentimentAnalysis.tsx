import { Brain } from "lucide-react";
import { SentimentCard } from "./sentiment/SentimentCard";
import { useSentimentData } from "./sentiment/useSentimentData";
import { Skeleton } from "@/components/ui/skeleton";

const SentimentAnalysis = () => {
  const { data, isLoading, isError } = useSentimentData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
          <Brain className="w-6 h-6" />
          Market Sentiment
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center p-4 text-warning">
        Unable to load market sentiment data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
        <Brain className="w-6 h-6" />
        Market Sentiment
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SentimentCard
          title="Overall Sentiment"
          value={data.overallSentiment.charAt(0).toUpperCase() + data.overallSentiment.slice(1)}
          sentiment={data.overallSentiment}
        />
        <SentimentCard
          title="Sentiment Score"
          value={data.sentimentScore}
          icon={<Brain className="w-5 h-5 text-primary" />}
        />
        <SentimentCard
          title="Social Media Mentions"
          value={data.socialMediaMentions}
          icon={<Brain className="w-5 h-5 text-primary" />}
        />
        <SentimentCard
          title="Trend Strength"
          value={data.trendStrength}
          icon={<Brain className="w-5 h-5 text-primary" />}
        />
      </div>
    </div>
  );
};

export default SentimentAnalysis;