import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { compressPDF } from "@/lib/pdf-utils";
import download from "downloadjs";
import { FileType, Minimize2, Loader2, RotateCcw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  
  const { toast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setOriginalSize(selected.size);
      setResultBytes(null);
      setCompressedSize(0);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const bytes = await compressPDF(file);
      
      setResultBytes(bytes);
      setCompressedSize(bytes.byteLength);
      
      toast({
        title: "Optimization Complete",
        description: "Your PDF is ready to download.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Compression failed",
        description: "An error occurred while processing your file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes && file) {
      download(resultBytes, `optimized-${file.name}`, "application/pdf");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateReduction = () => {
    if (originalSize === 0) return 0;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;
    return Math.max(0, reduction).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Compress PDF</h1>
        <p className="text-muted-foreground text-lg">Reduce file size while maintaining document quality.</p>
      </div>

      {!file ? (
        <UploadZone 
          onFilesSelected={handleFileSelected} 
          maxFiles={1}
          description="Upload a PDF to reduce its file size"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
             <div className="absolute inset-0 bg-secondary/30" />
             <FileType className="w-24 h-24 text-primary mb-6 relative z-10 drop-shadow-2xl" />
             <h3 className="text-xl font-bold relative z-10 text-center px-4 break-all">{file.name}</h3>
             <div className="mt-2 text-sm font-medium px-3 py-1 bg-white/10 rounded-full text-white/80 relative z-10">
               {formatSize(originalSize)}
             </div>

             <button 
                onClick={() => { setFile(null); setResultBytes(null); }}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20"
             >
                <RotateCcw className="w-4 h-4 text-white" />
             </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6 flex flex-col justify-center min-h-[300px]">
            {!resultBytes ? (
              <div className="text-center space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Compress</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll remove unnecessary metadata and optimize the internal structure of your document.
                    </p>
                 </div>
                 
                 <Button 
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-5 h-5 mr-2" />
                      Compress PDF
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-green-500 mb-1">Success!</h3>
                  <p className="text-muted-foreground">Your file is ready.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                   <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">New Size</p>
                      <p className="font-bold text-white">{formatSize(compressedSize)}</p>
                   </div>
                   <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reduction</p>
                      <p className="font-bold text-green-400">{calculateReduction()}%</p>
                   </div>
                </div>
                
                <Button 
                  onClick={handleDownload}
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
                >
                  Download Optimized PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
