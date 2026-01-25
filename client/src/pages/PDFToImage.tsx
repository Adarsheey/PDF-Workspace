import { useState, useEffect } from "react";
import { UploadZone } from "@/components/UploadZone";
import { getPageCount, pdfPageToImage } from "@/lib/pdf-utils";
import download from "downloadjs";
import { FileType, Image as ImageIcon, Loader2, RotateCcw, Download, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PDFToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      getPageCount(file).then(setPageCount);
      setPreviews({});
    }
  }, [file]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleExportPage = async (pageNumber: number) => {
    if (!file) return;

    try {
      setIsProcessing(pageNumber);
      const dataUrl = await pdfPageToImage(file, pageNumber, format, 2);
      
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      download(dataUrl, `${fileName}-page-${pageNumber}.${format === 'jpeg' ? 'jpg' : 'png'}`, `image/${format}`);
      
      toast({
        title: "Export Success",
        description: `Page ${pageNumber} exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Rendering error. Please ensure the PDF is not password protected and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleGeneratePreview = async (pageNumber: number) => {
    if (!file || previews[pageNumber] || isProcessing === pageNumber) return;
    try {
      setIsProcessing(pageNumber);
      // Ensure we clear previous tasks and give UI time to show loading
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await pdfPageToImage(file, pageNumber, 'png', 0.6);
      setPreviews(prev => ({ ...prev, [pageNumber]: dataUrl }));
    } catch (e) {
      console.error('Preview Generation Error:', e);
      toast({
        title: "Preview failed",
        description: "Could not load preview. Click again to retry.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">PDF to Image</h1>
        <p className="text-muted-foreground text-lg">Convert individual PDF pages into high-resolution images.</p>
      </div>

      {!file ? (
        <UploadZone 
          onFilesSelected={handleFileSelected} 
          maxFiles={1}
          description="Upload a PDF to export pages as images"
        />
      ) : (
        <div className="space-y-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <FileType className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="font-bold break-all">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">{pageCount} pages detected</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                    <SelectTrigger className="w-[100px] bg-transparent border-0 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Change File
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <Card key={page} className="bg-card/50 border-border overflow-hidden group hover:border-primary/50 transition-colors">
                <div 
                  className="aspect-[3/4] bg-secondary/30 flex items-center justify-center relative overflow-hidden cursor-pointer"
                  onClick={() => handleGeneratePreview(page)}
                >
                  {previews[page] ? (
                    <img src={previews[page]} alt={`Page ${page}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                      {isProcessing === page ? (
                        <Loader2 className="w-12 h-12 mb-2 animate-spin" />
                      ) : (
                        <ImageIcon className="w-12 h-12 mb-2" />
                      )}
                      <span className="text-sm">{isProcessing === page ? "Loading..." : "Click for preview"}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white z-10">
                    PAGE {page}
                  </div>
                </div>
                <CardContent className="p-4">
                  <Button 
                    onClick={() => handleExportPage(page)}
                    disabled={isProcessing !== null}
                    className="w-full"
                    variant="secondary"
                    size="sm"
                  >
                    {isProcessing === page && !previews[page] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export as {format === 'jpeg' ? 'JPG' : 'PNG'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
