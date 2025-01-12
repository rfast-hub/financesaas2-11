import { Card } from "@/components/ui/card";
import { SentimentIcon } from "./SentimentIcon";

interface SentimentCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  sentiment?: string;
}

export const SentimentCard = ({ title, value, icon, sentiment }: SentimentCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon || (sentiment && <SentimentIcon sentiment={sentiment} />)}
      </div>
      <p className="text-2xl font-semibold">
        {typeof value === 'number' ? `${value}${title.includes('Strength') ? '%' : ''}` : value}
      </p>
    </Card>
  );
};