import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { Download, RotateCcw, X, Move } from 'lucide-react';
import { Box, UploadedFile } from '../types';
import { Button } from './Button';
import { downloadImage } from '../utils/fileHelpers';

interface ImageRedactorProps {
  file: UploadedFile;
  onReset: () => void;
}

export const ImageRedactor: React.FC<ImageRedactorProps> = ({ file, onReset }) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [currentBox, setCurrentBox] = useState<Partial<Box> | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getRelativeCoords = (e: MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    // Prevent starting a new box if clicking on an existing box delete button
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault(); // Prevent text selection
    const { x, y } = getRelativeCoords(e);
    setIsDrawing(true);
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !currentBox || !containerRef.current) return;
    
    const { x, y } = getRelativeCoords(e);
    const startX = currentBox.x!;
    const startY = currentBox.y!;
    
    // Constrain to container bounds
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    const currentX = Math.max(0, Math.min(x, containerWidth));
    const currentY = Math.max(0, Math.min(y, containerHeight));

    const width = currentX - startX;
    const height = currentY - startY;

    setCurrentBox(prev => ({
      ...prev,
      w: width,
      h: height
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    setIsDrawing(false);

    // Normalize box (handle negative width/height from dragging backwards)
    let { x, y, w, h } = currentBox as Box;
    
    if (w < 0) { x += w; w = Math.abs(w); }
    if (h < 0) { y += h; h = Math.abs(h); }

    // Only add significant boxes
    if (w > 5 && h > 5) {
      setBoxes(prev => [...prev, { id: crypto.randomUUID(), x, y, w, h }]);
    }
    setCurrentBox(null);
  };

  const removeBox = (id: string) => {
    setBoxes(prev => prev.filter(b => b.id !== id));
  };

  const handleExport = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Set canvas to natural image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Calculate scale factor (Display Size vs Natural Size)
    const displayWidth = img.width;
    const displayHeight = img.height;
    const scaleX = img.naturalWidth / displayWidth;
    const scaleY = img.naturalHeight / displayHeight;

    // 1. Draw original image
    ctx.drawImage(img, 0, 0);

    // 2. Process blurs
    // Since context.filter isn't universally supported for regions in all browsers perfectly,
    // we will redraw the blurred regions.
    boxes.forEach(box => {
      const realX = box.x * scaleX;
      const realY = box.y * scaleY;
      const realW = box.w * scaleX;
      const realH = box.h * scaleY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(realX, realY, realW, realH);
      ctx.clip();
      
      // Apply blur
      ctx.filter = 'blur(15px)';
      // Draw the image again over the clip area with blur
      ctx.drawImage(img, 0, 0);
      
      // Optional: Add a pixelated or dark overlay if blur isn't enough or supported
      // ctx.fillStyle = 'rgba(0,0,0,0.5)';
      // ctx.fillRect(realX, realY, realW, realH);
      
      ctx.restore();
    });

    downloadImage(canvas, file.name);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onReset} icon={RotateCcw}>
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h2 className="font-semibold text-slate-800">{file.name}</h2>
            <p className="text-xs text-slate-500">Drag to blur areas • {boxes.length} redactions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBoxes([])} disabled={boxes.length === 0}>
            Clear All
          </Button>
          <Button onClick={handleExport} icon={Download}>
            Save Image
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center">
        <div 
          ref={containerRef}
          className="relative inline-block shadow-2xl bg-white select-none cursor-crosshair group"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            ref={imageRef}
            src={file.content} 
            alt="To redact" 
            className="max-w-full max-h-[80vh] block pointer-events-none"
            draggable={false}
          />
          
          {/* Render Boxes */}
          {boxes.map(box => (
            <div
              key={box.id}
              className="absolute border border-white/20 hover:border-blue-400 group/box transition-colors"
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                backdropFilter: 'blur(12px) contrast(0.8)',
                backgroundColor: 'rgba(0, 0, 0, 0.15)', // Fallback tint
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity shadow-sm hover:scale-110"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Render Current Drawing Box */}
          {currentBox && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10"
              style={{
                left: currentBox.w! < 0 ? currentBox.x! + currentBox.w! : currentBox.x,
                top: currentBox.h! < 0 ? currentBox.y! + currentBox.h! : currentBox.y,
                width: Math.abs(currentBox.w!),
                height: Math.abs(currentBox.h!),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};