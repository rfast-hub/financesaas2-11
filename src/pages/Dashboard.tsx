import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold page-title">Dashboard</h1>
          <Button 
            variant="secondary"
            onClick={handleSignOut}
            className="ml-4"
          >
            Sign Out
          </Button>
        </div>
        <div className="grid gap-6">
          {/* Dashboard content will go here */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to your Dashboard</h2>
            <p className="text-muted-foreground">
              This is your personal dashboard. More features will be added soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;