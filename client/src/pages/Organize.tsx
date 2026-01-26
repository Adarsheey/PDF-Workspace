import { useState, useCallback } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import download from "downloadjs";
import { 
  FileStack, 
  RotateCw, 
  Trash2, 
  GripVertical, 
  Save, 
  Loader2, 
  Plus, 
  RotateCcw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Force specific version for worker compatibility
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

interface PDFPage {
  id: string;
  sourceFileId: string;
  pageIndex: number; // 0-indexed page number in the source PDF
  rotation: number;
  previewUrl: string;
}

function SortablePage({ 
  page, 
  onDelete, 
  onRotate 
}: { 
  page: PDFPage; 
  onDelete: (id: string) => void; 
  onRotate: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-[3/4]">
      <Card className="h-full w-full overflow-hidden bg-card/50 border-border group-hover:border-primary/50 transition-colors cursor-default">
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
           <div {...attributes} {...listeners} className="p-1 bg-black/60 rounded cursor-grab active:cursor-grabbing hover:bg-black/80">
             <GripVertical className="w-3 h-3 text-white" />
           </div>
           <div className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase">
             Page {page.pageIndex + 1}
           </div>
        </div>
        
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-7 w-7 bg-black/60 hover:bg-black/80 border-0" 
            onClick={() => onRotate(page.id)}
          >
            <RotateCw className="w-3 h-3 text-white" />
          </Button>
          <Button 
            size="icon" 
            variant="destructive" 
            className="h-7 w-7 bg-red-500/60 hover:bg-red-500/80 border-0" 
            onClick={() => onDelete(page.id)}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </Button>
        </div>

        <div className="w-full h-full flex items-center justify-center p-2 bg-secondary/20">
          <img 
            src={page.previewUrl} 
            alt={`Page ${page.pageIndex + 1}`} 
            className="max-w-full max-h-full object-contain shadow-sm"
            style={{ transform: `rotate(${page.rotation}deg)`, transition: 'transform 0.2s ease-in-out' }}
          />
        </div>
      </Card>
    </div>
  );
}

export default function Organize() {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [sourceFiles, setSourceFiles] = useState<Record<string, Uint8Array>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const newPages: PDFPage[] = [];
      const newSourceFiles: Record<string, Uint8Array> = { ...sourceFiles };
      
      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`;
        const arrayBuffer = await file.arrayBuffer();
        newSourceFiles[fileId] = new Uint8Array(arrayBuffer);
        
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            
            newPages.push({
              id: `${fileId}-p${i}`,
              sourceFileId: fileId,
              pageIndex: i - 1,
              rotation: 0,
              previewUrl: canvas.toDataURL(),
            });
          }
        }
      }
      
      setSourceFiles(newSourceFiles);
      setPages(prev => [...prev, ...newPages]);
      toast({
        title: "PDFs Imported",
        description: `Added ${newPages.length} pages to the organizer.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Import Failed",
        description: "Could not read the PDF file(s).",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleRotate = (id: string) => {
    setPages(prev => prev.map(p => 
      p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (pages.length === 0) return;
    
    setIsExporting(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      // Keep track of loaded source documents to avoid redundant loading
      const loadedDocs: Record<string, PDFDocument> = {};
      
      for (const page of pages) {
        if (!loadedDocs[page.sourceFileId]) {
          loadedDocs[page.sourceFileId] = await PDFDocument.load(sourceFiles[page.sourceFileId]);
        }
        
        const sourceDoc = loadedDocs[page.sourceFileId];
        const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [page.pageIndex]);
        
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        
        mergedPdf.addPage(copiedPage);
      }
      
      const pdfBytes = await mergedPdf.save();
      download(pdfBytes, "organized_document.pdf", "application/pdf");
      
      toast({
        title: "Success",
        description: "Organized PDF has been downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Could not generate the merged PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Organize PDF</h1>
          <p className="text-muted-foreground text-lg">Shuffle, rotate, and delete pages to create your perfect document.</p>
        </div>
        
        {pages.length > 0 && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setPages([]); setSourceFiles({}); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Clear All
            </Button>
            <Button onClick={handleSave} disabled={isExporting} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <UploadZone 
        onFilesSelected={handleFilesSelected} 
        maxFiles={10}
        description="Upload one or more PDFs to start organizing pages"
        className={pages.length > 0 ? "h-32" : ""}
      />

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Processing document pages...</p>
        </div>
      )}

      {pages.length > 0 && !isProcessing && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-4">
            <SortableContext 
              items={pages.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              {pages.map((page) => (
                <SortablePage 
                  key={page.id} 
                  page={page} 
                  onDelete={handleDelete}
                  onRotate={handleRotate}
                />
              ))}
            </SortableContext>
            
            <button 
              onClick={() => document.querySelector('input[type="file"]')?.click()}
              className="aspect-[3/4] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all bg-card/30"
            >
              <Plus className="w-8 h-8" />
              <span className="text-xs font-bold uppercase tracking-wider">Add More</span>
            </button>
          </div>
        </DndContext>
      )}
    </div>
  );
}
