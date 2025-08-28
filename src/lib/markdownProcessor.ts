// This file intentionally provides a no-op export to avoid duplicate
// TSX parsing in a .ts file. The proper implementation lives in
// `markdownProcessor.tsx` and should be imported directly where needed.

// Re-export the TSX implementation so imports like `import { MarkdownText } from '@/lib/markdownProcessor'`
// continue to work without changing import paths elsewhere in the codebase.
export { processMarkdown, MarkdownText } from './markdownProcessorImpl';
