import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { applyVisualFilter } from "@/lib/pdf-utils";
import download from "downloadjs";
import { FileType, Loader2, RotateCcw, CheckCircle2, Moon, Sun, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function VisualFilters() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  
  const { toast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultBytes(null);
    }
  };

  const handleApplyFilter = async (filter: 'grayscale' | 'night') => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const bytes = await applyVisualFilter(file, filter);
      setResultBytes(bytes);
      
      toast({
        title: "Filter Applied",
        description: `Successfully applied ${filter} mode to your PDF.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Filter failed",
        description: "An error occurred while applying the filter.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Visual Filters</h1>
        <p className="text-muted-foreground text-lg">Modify your PDF's appearance for accessibility or ink saving.</p>
      </div>

      {!file ? (
        <UploadZone 
          onFilesSelected={handleFileSelected} 
          maxFiles={1}
          description="Upload a PDF to apply visual filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-6 flex flex-col items-center">
              <FileType className="w-16 h-16 text-primary mb-4" />
              <h3 className="font-bold text-center break-all">{file.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFile(null); setResultBytes(null); }}
                className="mt-4"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Change File
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
              <CardDescription>Choose a filter to apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!resultBytes ? (
                <>
                  <Button 
                    onClick={() => handleApplyFilter('grayscale')}
                    disabled={isProcessing}
                    className="w-full justify-start h-12"
                    variant="outline"
                  >
                    <Sun className="w-5 h-5 mr-3 text-gray-400" />
                    Grayscale Mode (Ink Saver)
                  </Button>
                  <Button 
                    onClick={() => handleApplyFilter('night')}
                    disabled={isProcessing}
                    className="w-full justify-start h-12"
                    variant="outline"
                  >
                    <Moon className="w-5 h-5 mr-3 text-purple-400" />
                    Night Mode (High Contrast)
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <Button 
                    onClick={() => download(resultBytes, `filtered-${file.name}`, "application/pdf")}
                    className="w-full h-12"
                  >
                    Download Filtered PDF
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setResultBytes(null)}
                    className="w-full"
                  >
                    Try Another Filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
