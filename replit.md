# PDF Master

## Overview

PDF Master is a client-side PDF processing web application that provides tools for merging, splitting, compressing, and applying visual filters to PDF documents. All PDF operations are performed entirely in the browser using the pdf-lib library, ensuring user privacy and eliminating server-side file processing. The backend exists solely for collecting optional user feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (dark mode default)
- **Drag & Drop**: @dnd-kit for sortable file lists in the merge feature

### Key Frontend Features
- **Merge PDF**: Upload multiple PDFs, reorder via drag-and-drop, combine into single file
- **Split PDF**: Extract specific page ranges from a PDF
- **Compress PDF**: Optimize PDF file size client-side
- **Visual Filters**: Apply grayscale, night mode, and other visual effects to PDFs

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Purpose**: Minimal - only handles feedback submission API
- **Build**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Current Tables**: Single `feedback` table for user feedback
- **Migrations**: Managed via `drizzle-kit push`

### API Structure
- **Route Definitions**: Centralized in `shared/routes.ts` with Zod validation schemas
- **Single Endpoint**: `POST /api/feedback` for feedback submission
- **Validation**: Zod schemas shared between client and server

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities including pdf-utils.ts
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with Zod
```

## External Dependencies

### PDF Processing (Client-Side)
- **pdf-lib**: Core library for all PDF manipulation (merge, split, compress, filters)
- **downloadjs**: Handles file downloads after processing
- **react-dropzone**: File upload drag-and-drop interface

### Database
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store (available but feedback doesn't require sessions)

### UI Framework
- **Radix UI**: Headless component primitives (dialog, dropdown, toast, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across entire codebase