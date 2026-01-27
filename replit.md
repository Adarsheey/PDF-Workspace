# PDF Workbench

## Overview

PDF Workbench is a client-side PDF processing web application that provides tools for merging, splitting, compressing, and applying visual filters to PDF documents. All PDF operations are performed entirely in the browser using the pdf-lib library and Ghostscript WASM, ensuring user privacy and eliminating server-side file processing.

## Recent Changes

### 2026-01-27
- **Rebranding**: Renamed application from "PDF Master" to "PDF Workbench" with updated header, title, and favicon.
- **Ghostscript WASM Integration**: Replaced basic PDF compression with Ghostscript WASM engine using the `/ebook` preset.
- **Web Worker Support**: Moved compression to a Web Worker to prevent UI freezing during processing.
- **PDF rendering fix**: Updated PDF rendering engine to version 5.4.530 for consistent page previews.
- **Improved Filter BLending**: Adjusted visual filter opacity and blend modes for better visibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite
- **Compression**: Ghostscript WASM via Web Worker (`client/src/lib/gs-worker.ts`)
- **PDF manipulation**: pdf-lib
- **PDF rendering**: pdfjs-dist 5.4.530

### Key Frontend Features
- **Merge PDF**: Upload multiple PDFs, reorder via drag-and-drop, combine into single file
- **Split PDF**: Extract specific page ranges from a PDF
- **Compress PDF**: Professional Ghostscript optimization client-side
- **Visual Filters**: Apply grayscale, night mode, and other visual effects to PDFs
- **PDF to Image**: Export high-resolution PNG/JPG pages

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities including pdf-utils.ts and gs-worker.ts
server/           # Express backend
  routes.ts       # API route handlers
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```
