import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";

// Create a rate limiter object
const rateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 5,
  timeWindow: 60000, // 1 minute in milliseconds

  checkLimit: (key: string): boolean => {
    const now = Date.now();
    const attempt = rateLimiter.attempts.get(key);

    if (!attempt) {
      rateLimiter.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (now - attempt.timestamp > rateLimiter.timeWindow) {
      rateLimiter.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (attempt.count >= rateLimiter.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }
};

// Configure QueryClient with retry and rate limiting
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (!rateLimiter.checkLimit('query')) {
          console.warn('Rate limit exceeded for queries');
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (!rateLimiter.checkLimit('mutation')) {
          console.warn('Rate limit exceeded for mutations');
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;