import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableFileProps {
  id: string;
  file: File;
  onRemove: (id: string) => void;
}

export function SortableFile({ id, file, onRemove }: SortableFileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 transition-all duration-200",
        isDragging ? "shadow-2xl scale-105 border-primary/50 z-50 bg-secondary" : "hover:border-border hover:bg-secondary/50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="p-2 bg-primary/10 rounded-lg">
        <FileText className="w-6 h-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <button
        onClick={() => onRemove(id)}
        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
