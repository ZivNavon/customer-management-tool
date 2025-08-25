// Simple markdown processor for handling basic formatting
import React from 'react';

export function processMarkdown(text: string): string {
  if (!text) return text;
  
  // Replace **bold** with HTML <strong> tags
  let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace *italic* with HTML <em> tags
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return processed;
}

// Component for rendering markdown text safely
export function MarkdownText({ 
  children, 
  className = '', 
  dir = 'ltr' 
}: { 
  children: string; 
  className?: string; 
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const processedText = processMarkdown(children);
  
  return (
    <span 
      className={className}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
