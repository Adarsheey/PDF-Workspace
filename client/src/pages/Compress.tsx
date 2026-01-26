import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { Download, FileType, Loader2, RotateCcw, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import download from "downloadjs";

export default function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedFile, setCompressedFile] = useState<Uint8Array | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  
  const { toast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCompressedFile(null);
      setCompressionRatio(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    
    try {
      const fileBuffer = await file.arrayBuffer();
      
      // Use Web Worker for Ghostscript WASM
      const worker = new Worker(new URL('../lib/gs-worker.ts', import.meta.url), {
        type: 'module'
      });

      worker.postMessage({
        fileData: fileBuffer,
        fileName: file.name
      }, [fileBuffer]);

      worker.onmessage = (e) => {
        const { success, data, error } = e.data;
        
        if (success) {
          const result = new Uint8Array(data);
          setCompressedFile(result);
          setCompressionRatio(1 - (result.length / file.size));
          
          toast({
            title: "Compression complete",
            description: `Reduced file size by ${Math.round((1 - result.length / file.size) * 100)}%`,
          });
        } else {
          toast({
            title: "Compression failed",
            description: error || "Ghostscript WASM failed to process the file.",
            variant: "destructive"
          });
        }
        setIsCompressing(false);
        worker.terminate();
      };

      worker.onerror = (e) => {
        console.error('Worker Error:', e);
        toast({
          title: "Compression error",
          description: "A background process error occurred. Please try again.",
          variant: "destructive"
        });
        setIsCompressing(false);
        worker.terminate();
      };

    } catch (error) {
      console.error(error);
      toast({
        title: "Compression failed",
        description: "An error occurred during compression initialization.",
        variant: "destructive"
      });
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf";
    download(compressedFile, fileName, "application/pdf");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Compress PDF</h1>
        <p className="text-muted-foreground text-lg">Powerful Ghostscript-WASM compression with /ebook optimization.</p>
      </div>

      {!file ? (
        <UploadZone 
          onFilesSelected={handleFileSelected} 
          maxFiles={1}
          description="Upload a PDF to reduce its file size"
        />
      ) : (
        <div className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <FileType className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="font-bold break-all">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">Original size: {formatSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)}
                  disabled={isCompressing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Change File
                </Button>
                
                {!compressedFile && (
                  <Button 
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {isCompressing ? "Compressing..." : "Compress PDF"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isCompressing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing with Ghostscript WASM...</span>
                <span className="animate-pulse">Running in Web Worker</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {compressedFile && (
            <Card className="bg-primary/5 border-primary/20 animate-in zoom-in-95">
              <CardContent className="pt-6 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">PDF Compressed Successfully!</h3>
                  <p className="text-muted-foreground">
                    New size: {formatSize(compressedFile.length)} 
                    {compressionRatio && ` (${Math.round(compressionRatio * 100)}% reduction)`}
                  </p>
                </div>
                <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" /> Download Compressed PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
