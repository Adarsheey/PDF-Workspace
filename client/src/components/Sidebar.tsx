import { FileStack, Scissors, Minimize2, Palette, Image as ImageIcon, MessageSquarePlus, Github, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Merge PDF", icon: FileStack, href: "/" },
  { label: "Organize", icon: LayoutGrid, href: "/organize" },
  { label: "Split PDF", icon: Scissors, href: "/split" },
  { label: "Compress PDF", icon: Minimize2, href: "/compress" },
  { label: "Visual Filters", icon: Palette, href: "/filters" },
  { label: "PDF to Image", icon: ImageIcon, href: "/pdf-to-image" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 h-screen border-r border-border bg-card/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 font-display">
          PDF Workbench
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide uppercase">
          Pro Tools Suite
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link href="/feedback">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-sm">
            <MessageSquarePlus className="w-4 h-4" />
            <span>Send Feedback</span>
          </div>
        </Link>
        
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-sm"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </aside>
  );
}
