import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Clipboard } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check if files were pasted (e.g. copied from file explorer)
      if (clipboardData.files && clipboardData.files.length > 0) {
        e.preventDefault();
        onFileSelect(clipboardData.files[0]);
        return;
      }

      // 2. Check items for content (e.g. screenshots)
      // Prioritize images over text
      const items = clipboardData.items;
      if (items) {
        // First pass: look for images
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              onFileSelect(file);
              return;
            }
          }
        }
        
        // Second pass: look for text
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type === 'text/plain') {
            item.getAsString((text) => {
              if (text && text.trim().length > 0) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const file = new File([text], `pasted-text-${timestamp}.txt`, { type: 'text/plain' });
                onFileSelect(file);
              }
            });
            e.preventDefault();
            return;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onFileSelect]);

  return (
    <div 
      className={`w-full max-w-xl mx-auto mt-20 p-8 rounded-2xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer relative
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        type="file" 
        id="fileInput" 
        className="hidden" 
        accept="image/*,.txt,.md,.json" 
        onChange={handleInputChange} 
      />
      
      <div className="flex justify-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm transition-transform hover:scale-105">
          <ImageIcon size={32} />
        </div>
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-sm transition-transform hover:scale-105">
          <FileText size={32} />
        </div>
        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 shadow-sm transition-transform hover:scale-105">
          <Clipboard size={32} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload or Paste</h3>
      <p className="text-slate-500 mb-6">Drag & drop, click to browse, or <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Ctrl+V</span> to paste</p>
      
      <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-400">
        <span className="px-3 py-1 bg-slate-100 rounded-full">PNG</span>
        <span className="px-3 py-1 bg-slate-100 rounded-full">JPG</span>
        <span className="px-3 py-1 bg-slate-100 rounded-full">TXT</span>
        <span className="px-3 py-1 bg-slate-100 rounded-full">MD</span>
      </div>
    </div>
  );
};