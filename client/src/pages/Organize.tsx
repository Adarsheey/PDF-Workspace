import { useState, useCallback } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import download from "downloadjs";
import { 
  RotateCw, 
  Trash2, 
  GripVertical, 
  Save, 
  Loader2, 
  Plus, 
  RotateCcw,
  LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
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
  onRotate,
  isOverlay = false
}: { 
  page: PDFPage; 
  onDelete?: (id: string) => void; 
  onRotate?: (id: string) => void;
  isOverlay?: boolean;
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
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group aspect-[3/4] ${isOverlay ? 'cursor-grabbing' : ''}`}>
      <Card className={`h-full w-full overflow-hidden bg-card/50 border-border group-hover:border-primary/50 transition-colors ${isOverlay ? 'shadow-2xl ring-2 ring-primary' : ''}`}>
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
           <div {...attributes} {...listeners} className="p-1.5 bg-black/60 rounded cursor-grab active:cursor-grabbing hover:bg-black/80">
             <GripVertical className="w-3.5 h-3.5 text-white" />
           </div>
           <div className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase">
             Page {page.pageIndex + 1}
           </div>
        </div>
        
        {!isOverlay && onDelete && onRotate && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-7 w-7 bg-black/60 hover:bg-black/80 border-0" 
              onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
            >
              <RotateCw className="w-3 h-3 text-white" />
            </Button>
            <Button 
              size="icon" 
              variant="destructive" 
              className="h-7 w-7 bg-red-500/60 hover:bg-red-500/80 border-0" 
              onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
            >
              <Trash2 className="w-3 h-3 text-white" />
            </Button>
          </div>
        )}

        <div className="w-full h-full flex items-center justify-center p-2 bg-secondary/10">
          <img 
            src={page.previewUrl} 
            alt={`Page ${page.pageIndex + 1}`} 
            className="max-w-full max-h-full object-contain pointer-events-none"
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
        title: "Pages Added",
        description: `${newPages.length} pages are ready for reordering.`,
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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
    setActiveId(null);
  };

  const handleSave = async () => {
    if (pages.length === 0) return;
    
    setIsExporting(true);
    try {
      const mergedPdf = await PDFDocument.create();
      const loadedDocs: Record<string, PDFDocument> = {};
      
      for (const page of pages) {
        if (!loadedDocs[page.sourceFileId]) {
          // IMPORTANT: Create a fresh copy of the Uint8Array bytes
          // to prevent issues with detached ArrayBuffers
          const sourceBytes = sourceFiles[page.sourceFileId];
          const bytesToLoad = new Uint8Array(sourceBytes);
          loadedDocs[page.sourceFileId] = await PDFDocument.load(bytesToLoad);
        }
        
        const sourceDoc = loadedDocs[page.sourceFileId];
        const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [page.pageIndex]);
        
        if (page.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + page.rotation));
        }
        
        mergedPdf.addPage(copiedPage);
      }
      
      const pdfBytes = await mergedPdf.save();
      download(pdfBytes, "organized_document.pdf", "application/pdf");
      
      toast({
        title: "Success",
        description: "Your organized PDF has been saved.",
      });
    } catch (error: any) {
      console.error('Merge Error:', error);
      toast({
        title: "Export failed",
        description: `Error: ${error.message || "Could not generate PDF"}`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const activePage = activeId ? pages.find(p => p.id === activeId) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Organize PDF</h1>
          </div>
          <p className="text-muted-foreground text-lg italic">Select a page and drag it to any position to reorder your document.</p>
        </div>
        
        {pages.length > 0 && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setPages([]); setSourceFiles({}); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
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
        description="Add more PDFs to the organizer"
        className={pages.length > 0 ? "h-32 border-primary/20" : ""}
      />

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Reading pages...</p>
        </div>
      )}

      {pages.length > 0 && !isProcessing && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pt-4 pb-20">
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
              onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
              className="aspect-[3/4] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all bg-card/30 hover:bg-card/50"
            >
              <Plus className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Files</span>
            </button>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activePage ? (
              <SortablePage 
                page={activePage} 
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
