import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "./useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const CancellationReasons = [
  { id: "expensive", label: "Too expensive" },
  { id: "not-needed", label: "No longer needed" },
  { id: "dissatisfied", label: "Dissatisfied with service" },
  { id: "other", label: "Other" },
] as const;

export function SubscriptionManager() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const { toast } = useToast();
  const { subscription, isLoading, cancelSubscription } = useSubscription();

  const handleCancellation = async () => {
    try {
      await cancelSubscription();
      toast({
        title: "Subscription Cancelled",
        description: subscription?.current_period_end 
          ? `You will retain access until ${format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}`
          : "Your subscription has been cancelled successfully.",
      });
      setShowCancelDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading subscription details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Subscription Details</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Status:</span>{" "}
            <span className="capitalize">{subscription?.status || "No active subscription"}</span>
          </p>
          {subscription?.current_period_end && (
            <p>
              <span className="font-medium">Next billing date:</span>{" "}
              {format(new Date(subscription.current_period_end), "MMMM dd, yyyy")}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Button onClick={handleCustomerPortal}>
            Manage Billing
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel Subscription
          </Button>
        </div>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Please let us know why you're leaving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={cancellationReason}
              onValueChange={setCancellationReason}
            >
              {CancellationReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id}>{reason.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {cancellationReason === "other" && (
              <Textarea
                placeholder="Please tell us more..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancellation}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}