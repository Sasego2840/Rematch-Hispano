import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DiscordLogin } from "@/components/auth/DiscordLogin";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { MyClub } from "@/pages/MyClub";
import { Notifications } from "@/pages/Notifications";
import { Calendar } from "@/pages/Calendar";
import { Tournaments } from "@/pages/Tournaments";
import { Leagues } from "@/pages/Leagues";
import { Admin } from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <DiscordLogin />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-primary-900">
      <Sidebar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/mi-club" component={MyClub} />
        <Route path="/notificaciones" component={Notifications} />
        <Route path="/calendario" component={Calendar} />
        <Route path="/torneos" component={Tournaments} />
        <Route path="/ligas" component={Leagues} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
