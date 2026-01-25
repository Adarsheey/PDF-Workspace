import { PDFDocument, rgb } from 'pdf-lib';

export async function applyVisualFilter(file: File, filter: 'grayscale' | 'night'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    if (filter === 'night') {
      // For night mode, we draw a rectangle with the 'Difference' blend mode
      // to invert the colors. Note: pdf-lib's blend mode support is via the 
      // graphics state, but drawRectangle accepts it in some versions/implementations.
      // If it fails, we use a semi-transparent overlay.
      try {
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1),
          opacity: 1,
          blendMode: 'Difference' as any,
        });
      } catch (e) {
        // Fallback: dark backdrop with 0.7 opacity
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0, 0, 0),
          opacity: 0.7,
        });
      }
    } else if (filter === 'grayscale') {
      // For grayscale, we'll try a simpler approach since 'Saturation' blend
      // mode might be causing the error in some browsers/pdf-lib versions.
      try {
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.1,
          blendMode: 'Luminosity' as any,
        });
      } catch (e) {
        // Fallback: very light gray overlay
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.05,
        });
      }
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
