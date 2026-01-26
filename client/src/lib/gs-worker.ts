// @ts-ignore
import initGhostscript from '@jspawn/ghostscript-wasm/gs.js';

self.onmessage = async (e: MessageEvent) => {
  const { fileData } = e.data;
  
  try {
    // The library usually expects an object that might include locateFile
    // and returns a Module-like object that has callMain and FS
    const gs = await initGhostscript({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/${file}`
    });

    if (!gs || !gs.FS || !gs.callMain) {
      throw new Error('Ghostscript initialization failed: missing FS or callMain');
    }

    // Write input PDF to virtual filesystem
    gs.FS.writeFile('input.pdf', new Uint8Array(fileData));

    // Ghostscript compression command
    // /ebook is ~150dpi, balanced quality/size
    await gs.callMain([
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-sOutputFile=output.pdf',
      'input.pdf'
    ]);

    // Read compressed output
    const compressedData = gs.FS.readFile('output.pdf');
    
    // Cleanup
    gs.FS.unlink('input.pdf');
    gs.FS.unlink('output.pdf');

    // Transferable buffer for efficiency
    const buffer = compressedData.buffer;
    self.postMessage({ 
      success: true, 
      data: buffer 
    }, { transfer: [buffer] } as any);
    
  } catch (error: any) {
    self.postMessage({ 
      success: false, 
      error: error.message || 'Compression failed' 
    });
  }
};
