import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  description?: string;
  compact?: boolean;
}

export function UploadZone({ 
  onFilesSelected, 
  accept = { "application/pdf": [".pdf"] },
  maxFiles,
  description = "Drag & drop PDF files here, or click to select",
  compact = false
}: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 ease-out overflow-hidden",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.01]" 
          : "border-white/10 hover:border-white/20 hover:bg-white/5",
        compact ? "p-4 md:p-8" : "p-8 md:p-16"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex flex-col items-center justify-center text-center relative z-10">
        <div className={cn(
          "rounded-full bg-white/5 p-4 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20",
          isDragActive && "bg-primary/20 scale-110"
        )}>
          {isDragActive ? (
            <FileType className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isDragActive ? "Drop files now" : "Upload Documents"}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
