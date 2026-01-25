import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker
// Using the exact version from the package to ensure API and Worker match
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export async function pdfPageToImage(
  file: File, 
  pageNumber: number, 
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use a fallback-friendly loading method
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    disableFontFace: true,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  });
  
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error('Could not create canvas context');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (format === 'jpeg') {
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
    // @ts-ignore
    canvas: canvas
  }).promise;
  
  return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
}

export async function applyVisualFilter(file: File, filter: 'grayscale' | 'night' | 'no-shadow' | 'lighten'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // In pdf-lib, drawing a rectangle with opacity < 1 or specific blend modes
    // can be subtle. We increase opacity and stack effects for visibility.
    
    if (filter === 'night') {
      // High-impact Night Mode: Pure white rectangle with Difference blend mode
      // This effectively inverts every pixel on the page
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
        opacity: 1,
        blendMode: 'Difference' as any,
      });
    } else if (filter === 'grayscale') {
      // High-impact Grayscale: Luminosity blend mode with higher opacity
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.4,
        blendMode: 'Luminosity' as any,
      });
    } else if (filter === 'no-shadow') {
      // High-impact No Shadow: Screen blend mode at higher opacity
      // This aggressively brightens dark/grey areas (shadows)
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
        opacity: 0.5,
        blendMode: 'Screen' as any,
      });
    } else if (filter === 'lighten') {
      // High-impact Lighten: Overlay blend mode at higher opacity
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
        opacity: 0.5,
        blendMode: 'Overlay' as any,
      });
    }
  }

  return pdfDoc.save();
}

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function splitPDF(file: File, range: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();
  
  // Parse range "1-3, 5, 8-10"
  const pagesToKeep = new Set<number>();
  const parts = range.split(',');
  
  for (const part of parts) {
    const [start, end] = part.split('-').map(n => parseInt(n.trim()));
    
    if (!isNaN(start)) {
      if (!isNaN(end)) {
        // Range: 1-5
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pagesToKeep.add(i - 1); // 0-indexed
          }
        }
      } else {
        // Single page: 5
        if (start >= 1 && start <= totalPages) {
          pagesToKeep.add(start - 1); // 0-indexed
        }
      }
    }
  }

  const newPdf = await PDFDocument.create();
  const indices = Array.from(pagesToKeep).sort((a, b) => a - b);
  
  if (indices.length === 0) throw new Error("No valid pages selected");

  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function compressPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Basic optimization: using object streams and stripping metadata
  // can help reduce file size in many cases.
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");

  return pdfDoc.save({ 
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });
}

export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}
