import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";

import Merge from "@/pages/Merge";
import Split from "@/pages/Split";
import Compress from "@/pages/Compress";
import Feedback from "@/pages/Feedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Merge} />
      <Route path="/split" component={Split} />
      <Route path="/compress" component={Compress} />
      <Route path="/feedback" component={Feedback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20">
          <Sidebar />
          
          <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto h-screen relative">
            {/* Background ambient glow */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <div className="max-w-5xl mx-auto">
              <Router />
            </div>
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
