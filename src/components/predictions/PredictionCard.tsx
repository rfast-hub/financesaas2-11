import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Prediction } from './types';

interface PredictionCardProps {
  prediction: Prediction;
  basePrice: number;
}

export const PredictionCard = ({ prediction, basePrice }: PredictionCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {new Date(prediction.timestamp).toLocaleDateString()}
        </span>
        <span className="text-sm">
          {prediction.confidence.toFixed(1)}% confidence
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {prediction.price > basePrice ? (
          <ArrowUpIcon className="w-4 h-4 text-success" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 text-warning" />
        )}
        <span className="text-lg font-semibold">
          ${prediction.price.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Support: ${prediction.support.toLocaleString()}</span>
          <span>Resistance: ${prediction.resistance.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
};