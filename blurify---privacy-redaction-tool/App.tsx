import React, { useState, useCallback } from 'react';
import { UploadedFile } from './types';
import { DropZone } from './components/DropZone';
import { ImageRedactor } from './components/ImageRedactor';
import { TextRedactor } from './components/TextRedactor';
import { readFile } from './utils/fileHelpers';
import { Shield, Lock, Download } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (rawFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const processedFile = await readFile(rawFile);
      setFile(processedFile);
    } catch (err: any) {
      setError(err.message || 'Something went wrong processing the file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setFile(null);
    setError(null);
  };

  if (file) {
    if (file.type === 'image') {
      return <ImageRedactor file={file} onReset={handleReset} />;
    } else {
      return <TextRedactor file={file} onReset={handleReset} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="p-6 border-b border-white/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Shield size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Blurify</span>
          </div>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
             Secure & Client-Side
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-4xl mx-auto text-center mb-10 mt-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Redact sensitive data <br />
            <span className="text-blue-600">in seconds.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload an image or text file to securely blur out private information. 
            All processing happens locally in your browser—your data never leaves your device.
          </p>
        </div>

        {error && (
          <div className="w-full max-w-xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-center">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
             <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 font-medium">Processing file...</p>
          </div>
        ) : (
          <DropZone onFileSelect={handleFileSelect} />
        )}

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-slate-600">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
               <Lock size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">100% Private</h3>
            <p className="text-sm">No servers. No AI analysis. Your files are processed entirely within your browser's memory.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
               <Shield size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Dual Support</h3>
            <p className="text-sm">Works seamlessly with both images (PNG, JPG) and plain text documents (TXT, MD, JSON).</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4">
               <Download size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Instant Export</h3>
            <p className="text-sm">Download your redacted files immediately with high-quality output.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Blurify. Local Privacy Tool.</p>
      </footer>
    </div>
  );
}