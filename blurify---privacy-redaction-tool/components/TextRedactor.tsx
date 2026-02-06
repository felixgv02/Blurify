import React, { useState, useRef, useEffect } from 'react';
import { Download, RotateCcw, Eraser } from 'lucide-react';
import { UploadedFile, TextRange } from '../types';
import { Button } from './Button';
import { downloadText } from '../utils/fileHelpers';

interface TextRedactorProps {
  file: UploadedFile;
  onReset: () => void;
}

export const TextRedactor: React.FC<TextRedactorProps> = ({ file, onReset }) => {
  const [ranges, setRanges] = useState<TextRange[]>([]);
  // Use selection range for the UI feedback
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle native selection in the textarea
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (target.selectionStart !== target.selectionEnd) {
      setSelection({
        start: Math.min(target.selectionStart, target.selectionEnd),
        end: Math.max(target.selectionStart, target.selectionEnd)
      });
    } else {
      setSelection(null);
    }
  };

  const addRedaction = () => {
    if (!selection) return;

    // Check for overlap or merge logic? 
    // For simplicity, we just push new ranges. The renderer handles overlap visually if we're careful.
    // Better: merge overlapping ranges.
    
    const newRange: TextRange = {
      id: crypto.randomUUID(),
      start: selection.start,
      end: selection.end
    };

    setRanges(prev => {
      // Simple merge logic could go here, but purely additive is fine for MVP
      return [...prev, newRange];
    });

    setSelection(null);
    
    // Clear selection in textarea
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd;
    }
  };

  const handleExport = () => {
    let result = file.content;
    // Sort ranges descending by start to avoid index shifting when replacing
    const sortedRanges = [...ranges].sort((a, b) => b.start - a.start);
    
    // We need to handle overlaps if we do replacement.
    // A simpler way for export: convert string to char array, mark redacted chars, rejoin.
    const chars = result.split('');
    
    ranges.forEach(range => {
      for (let i = range.start; i < range.end; i++) {
        if (i < chars.length) chars[i] = '█'; // Replacement character
      }
    });

    // Or use a fixed string like [REDACTED]
    // But '█' preserves layout better.
    
    downloadText(chars.join(''), file.name);
  };

  // Render Logic: We need to render the text with highlights behind the transparent textarea
  // We'll build a list of segments
  const renderBackdrop = () => {
    const text = file.content;
    const segments = [];
    let lastIndex = 0;

    // We need to flatten and sort ranges to render them linearly without overlap issues
    // Create a mask array for the whole text
    const mask = new Array(text.length).fill(false);
    ranges.forEach(r => {
      for (let i = r.start; i < r.end; i++) {
        if (i < mask.length) mask[i] = true;
      }
    });

    let currentSegmentStart = 0;
    let isCurrentRedacted = mask[0];

    for (let i = 1; i <= text.length; i++) {
      // If status changes or end of string
      if (i === text.length || mask[i] !== isCurrentRedacted) {
        const content = text.slice(currentSegmentStart, i);
        segments.push(
          <span 
            key={currentSegmentStart} 
            className={`${isCurrentRedacted ? 'bg-black text-transparent rounded-sm select-none' : 'text-slate-800'}`}
          >
            {content}
          </span>
        );
        currentSegmentStart = i;
        isCurrentRedacted = mask[i];
      }
    }

    return segments;
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onReset} icon={RotateCcw}>
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h2 className="font-semibold text-slate-800">{file.name}</h2>
            <p className="text-xs text-slate-500">Select text to redact • {ranges.length} redactions</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selection && (
             <Button 
               size="sm" 
               variant="danger" 
               className="animate-in fade-in zoom-in duration-200"
               onClick={addRedaction}
               icon={Eraser}
             >
               Redact Selection
             </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setRanges([])} disabled={ranges.length === 0}>
            Clear All
          </Button>
          <Button onClick={handleExport} icon={Download}>
            Save Text
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50 flex justify-center p-8">
        <div className="relative w-full max-w-4xl h-full bg-white shadow-lg rounded-lg border border-slate-200 overflow-hidden flex flex-col">
          <div className="relative flex-1 overflow-auto p-8 custom-scrollbar">
             {/* The container for the stacked layers */}
             <div className="relative min-h-full font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                
                {/* Layer 1: The Rendering (Backdrop) */}
                <div aria-hidden="true" className="absolute top-0 left-0 w-full h-full pointer-events-none break-all">
                  {renderBackdrop()}
                </div>

                {/* Layer 2: The Interaction (Textarea) */}
                {/* 
                  The textarea is transparent but contains the text to allow selection.
                  The text color is transparent so we see Layer 1.
                  The caret color is set to black so you can see where you type/select.
                  ::selection background is set to visible so user knows what they selected.
                */}
                <textarea
                  ref={textareaRef}
                  value={file.content}
                  readOnly
                  onSelect={handleSelect}
                  className="absolute top-0 left-0 w-full h-full bg-transparent text-transparent resize-none border-0 outline-none p-0 m-0 break-all selection:bg-blue-300/40"
                  style={{ caretColor: 'black' }}
                  spellCheck={false}
                />
             </div>
          </div>
          <div className="p-2 bg-slate-50 border-t text-xs text-center text-slate-400">
             Highlight text to reveal the Redact button.
          </div>
        </div>
      </div>
    </div>
  );
};