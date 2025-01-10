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
      toast({
        title: "AI Alert Created",
        description: data.message || "AI-powered alert created successfully!",
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
        >
          {createAIAlert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span className="ml-2">AI Alert</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Create an AI-powered alert based on market analysis
      </TooltipContent>
    </Tooltip>
  );
};