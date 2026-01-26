import initGhostscript from '@jspawn/ghostscript-wasm';

self.onmessage = async (e) => {
  const { fileData, fileName } = e.data;
  
  try {
    const gs = await initGhostscript({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/${file}`
    });

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

    self.postMessage({ 
      success: true, 
      data: compressedData.buffer 
    }, [compressedData.buffer]);
    
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message || 'Compression failed' 
    });
  }
};
