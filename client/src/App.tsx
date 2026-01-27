import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Merge from "@/pages/Merge";
import Organize from "@/pages/Organize";
import Split from "@/pages/Split";
import Compress from "@/pages/Compress";
import Filters from "@/pages/Filters";
import PDFToImage from "@/pages/PDFToImage";
import Feedback from "@/pages/Feedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Merge} />
      <Route path="/organize" component={Organize} />
      <Route path="/split" component={Split} />
      <Route path="/compress" component={Compress} />
      <Route path="/filters" component={Filters} />
      <Route path="/pdf-to-image" component={PDFToImage} />
      <Route path="/feedback" component={Feedback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [open, setOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans selection:bg-primary/20">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 font-display">
              PDF Workbench
            </h1>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] bg-background border-r border-border">
                <div className="flex flex-col h-full overflow-y-auto" onClick={() => setOpen(false)}>
                  <Sidebar className="!flex lg:!flex w-full h-full static border-r-0" />
                </div>
              </SheetContent>
            </Sheet>
          </header>
          
          <main className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto lg:h-screen relative">
            {/* Background ambient glow */}
            <div className="fixed top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-0 lg:left-64 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

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
