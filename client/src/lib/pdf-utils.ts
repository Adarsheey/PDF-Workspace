import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker
// Use the EXACT version matching our package.json (5.4.530)
// For version 5+, we must use the .mjs worker for ESM compatibility
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

export async function pdfPageToImage(
  file: File, 
  pageNumber: number, 
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      disableFontFace: true,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/standard_fonts/`
    });
    
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);
    
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
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
    
    const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
    
    // Cleanup
    canvas.width = 0;
    canvas.height = 0;
    
    // Explicitly destroy objects to free memory
    await pdf.destroy();
    await loadingTask.destroy();
    
    return dataUrl;
  } catch (error: any) {
    console.error('PDF Rendering Error:', error);
    throw error;
  }
}

export async function applyVisualFilter(file: File, filter: 'grayscale' | 'night' | 'no-shadow' | 'lighten'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    if (filter === 'night') {
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
  
  const pagesToKeep = new Set<number>();
  const parts = range.split(',');
  
  for (const part of parts) {
    const [start, end] = part.split('-').map(n => parseInt(n.trim()));
    
    if (!isNaN(start)) {
      if (!isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pagesToKeep.add(i - 1);
          }
        }
      } else {
        if (start >= 1 && start <= totalPages) {
          pagesToKeep.add(start - 1);
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

/**
 * Advanced Compression Strategy: "Proxy" Image Swap
 * To achieve significant 50-80% reduction, we:
 * 1. Render each page to a canvas using PDF.js.
 * 2. Convert canvas to a highly compressed JPEG.
 * 3. Reconstruct a new PDF where each page is that one image.
 * Note: This makes text non-selectable.
 */
export async function compressPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    disableFontFace: true,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/cmaps/`,
    cMapPacked: true,
  });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const compressedPdfDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    // Use a moderate scale to maintain readability while maximizing compression
    const scale = 1.25; 
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // JPEG needs white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert to highly compressed JPEG (0.4-0.5 quality for maximum reduction)
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.4);
    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
    
    const image = await compressedPdfDoc.embedJpg(jpegBytes);
    const pdfPage = compressedPdfDoc.addPage([viewport.width, viewport.height]);
    
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
    
    // Cleanup canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  await pdf.destroy();
  await loadingTask.destroy();

  return compressedPdfDoc.save({ 
    useObjectStreams: true,
  });
}

export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}
