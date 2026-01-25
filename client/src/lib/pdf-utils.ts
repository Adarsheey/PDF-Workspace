import { PDFDocument } from 'pdf-lib';

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
  // Note: pdf-lib doesn't support advanced compression like ghostscript.
  // We simulate a basic optimization by reloading and saving without objects.
  // For true image downscaling, we would need to extract images, resize with canvas, and replace.
  // This is a simplified "optimize" pass that cleans up the structure.
  
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Basic optimization: this often reduces size for PDFs with incremental updates
  return pdfDoc.save({ useObjectStreams: false });
}

export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}
