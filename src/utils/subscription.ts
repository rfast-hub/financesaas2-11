import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  status: string;
  current_period_end: string | null;
  is_active: boolean;
}

export const fetchSubscription = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }

  return data;
};

export const cancelSubscription = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  try {
    const response = await supabase.functions.invoke('cancel-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      // Handle specific error cases
      if (response.error.message.includes('No active subscription found')) {
        throw new Error('No active subscription found. Please refresh the page to see the latest subscription status.');
      }
      throw new Error(response.error.message || 'Failed to cancel subscription');
    }

    return response.data;
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    // If it's already a proper Error object, throw it directly
    if (error instanceof Error) throw error;
    // Otherwise, create a new Error with the message
    throw new Error(typeof error === 'string' ? error : 'Failed to cancel subscription');
  }
};
