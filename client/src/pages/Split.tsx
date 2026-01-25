import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { splitPDF, getPageCount } from "@/lib/pdf-utils";
import download from "downloadjs";
import { FileType, Scissors, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Split() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [range, setRange] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      try {
        const count = await getPageCount(selected);
        setPageCount(count);
        setRange(`1-${Math.min(count, 1)}`); // Default range
      } catch (e) {
        toast({
          title: "Error loading PDF",
          description: "Could not read page count. File might be corrupted.",
          variant: "destructive"
        });
        setFile(null);
      }
    }
  };

  const handleSplit = async () => {
    if (!file || !range) return;

    try {
      setIsProcessing(true);
      const splitBytes = await splitPDF(file, range);
      download(splitBytes, `split-${file.name}`, "application/pdf");
      
      toast({
        title: "Success!",
        description: "Pages extracted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Split failed",
        description: error.message || "Invalid page range specified.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Split PDF</h1>
        <p className="text-muted-foreground text-lg">Extract pages from your PDF document by range or specific page numbers.</p>
      </div>

      {!file ? (
        <UploadZone 
          onFilesSelected={handleFileSelected} 
          maxFiles={1}
          description="Select a PDF to extract pages from"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
             <div className="absolute inset-0 bg-secondary/30" />
             <FileType className="w-24 h-24 text-primary mb-6 relative z-10 drop-shadow-2xl" />
             <h3 className="text-xl font-bold relative z-10 text-center px-4 break-all">{file.name}</h3>
             <div className="mt-2 text-sm font-medium px-3 py-1 bg-white/10 rounded-full text-white/80 relative z-10">
               {pageCount} Pages
             </div>
             
             <button 
                onClick={() => { setFile(null); setPageCount(0); setRange(""); }}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20"
             >
                <RotateCcw className="w-4 h-4 text-white" />
             </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Page Range</Label>
                <Input 
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="e.g. 1-5, 8, 11-13"
                  className="bg-secondary/50 border-border h-12 text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Format: <code className="bg-secondary px-1 py-0.5 rounded text-primary">1-5</code> for a range, or <code className="bg-secondary px-1 py-0.5 rounded text-primary">1,5,8</code> for specific pages.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                onClick={handleSplit}
                disabled={isProcessing || !range}
                className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5 mr-2" />
                    Extract Pages
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
