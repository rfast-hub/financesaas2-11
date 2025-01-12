import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface AIAlertButtonProps {
  cryptocurrency: string;
}

export const AIAlertButton = ({ cryptocurrency }: AIAlertButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAIAlert = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("create-ai-alert", {
        body: { cryptocurrency },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      
      // Show a toast with the detailed analysis
      toast({
        title: "AI Alerts Created",
        description: data.message,
      });

      // Show additional details in a separate toast
      toast({
        title: "AI Analysis Details",
        description: "Multiple alerts have been created based on AI analysis. Check your alerts list for details.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create AI alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating AI alert:", error);
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => createAIAlert.mutate()}
          disabled={createAIAlert.isPending}
          className="w-full sm:w-auto"
        >
          {createAIAlert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span className="ml-2">AI Analysis & Alerts</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Create AI-powered alerts based on comprehensive market analysis including:</p>
        <ul className="list-disc ml-4 mt-2">
          <li>Price targets</li>
          <li>Percentage thresholds</li>
          <li>Confidence scoring</li>
          <li>Risk assessment</li>
          <li>Timeframe predictions</li>
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};