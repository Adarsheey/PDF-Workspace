import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { SortableFile } from "@/components/SortableFile";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { mergePDFs } from "@/lib/pdf-utils";
import download from "downloadjs";
import { ArrowRight, Download, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FileWithId {
  id: string;
  file: File;
}

export default function Merge() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleFilesSelected = (newFiles: File[]) => {
    const mappedFiles = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f
    }));
    setFiles(prev => [...prev, ...mappedFiles]);
  };

  const handleRemove = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please upload at least 2 PDF files to merge.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const mergedBytes = await mergePDFs(files.map(f => f.file));
      download(mergedBytes, "merged-document.pdf", "application/pdf");
      
      toast({
        title: "Success!",
        description: "Your PDF has been merged and downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Merge failed",
        description: "An error occurred while processing your files.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Merge PDF Files</h1>
        <p className="text-muted-foreground text-lg">Combine multiple PDF files into one single document. Drag and drop to reorder.</p>
      </div>

      {files.length === 0 ? (
        <UploadZone 
          onFilesSelected={handleFilesSelected} 
          maxFiles={20}
          description="Select multiple PDF files to combine them into one document"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{files.length} files selected</span>
              <button 
                onClick={() => setFiles([])}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {files.map((item) => (
                    <SortableFile key={item.id} id={item.id} file={item.file} onRemove={handleRemove} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="pt-4">
              <UploadZone 
                onFilesSelected={handleFilesSelected} 
                compact 
                description="Add more files"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Summary</h3>
                <p className="text-sm text-muted-foreground mt-1">Ready to combine {files.length} documents.</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleMerge}
                  disabled={isProcessing}
                  className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      Merge PDFs <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Files are processed securely in your browser. No data is uploaded to our servers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
