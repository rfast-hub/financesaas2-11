import { Subscription } from "@/utils/subscription";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionDetailsProps {
  subscription: Subscription;
}

export const SubscriptionDetails = ({ subscription }: SubscriptionDetailsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Status: <span className="capitalize">{subscription.status}</span>
      </p>
      {subscription.current_period_end && (
        <p className="text-sm text-muted-foreground">
          Current period ends: {new Date(subscription.current_period_end).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};