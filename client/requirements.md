## Packages
pdf-lib | Core PDF processing library for client-side operations
react-dropzone | File upload drag-and-drop zones
downloadjs | File downloading utility
@dnd-kit/core | Drag and drop primitives for reordering
@dnd-kit/sortable | Sortable lists for PDF merging reordering
@dnd-kit/utilities | Utilities for dnd-kit
clsx | Utility for constructing className strings
tailwind-merge | Utility for merging tailwind classes

## Notes
All PDF operations (merge, split, compress) must be performed client-side using pdf-lib.
The backend API is only used for submitting optional feedback.
Reordering uses @dnd-kit/sortable for the merge list.
Dark mode is the default theme.
