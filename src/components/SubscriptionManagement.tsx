import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSubscription, cancelSubscription } from "@/utils/subscription";
import { SubscriptionDetails } from "./subscription/SubscriptionDetails";
import { CancellationDialog } from "./subscription/CancellationDialog";

const SubscriptionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Subscription canceled",
        description: "Your subscription has been successfully canceled.",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      console.error('Subscription cancellation error:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleCancellation = async () => {
    setIsLoading(true);
    return cancelSubscriptionMutation.mutateAsync();
  };

  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don't have an active subscription at the moment.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your current subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SubscriptionDetails subscription={subscription} />
        <CancellationDialog
          onCancel={handleCancellation}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;