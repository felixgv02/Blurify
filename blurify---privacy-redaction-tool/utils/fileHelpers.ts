import { UploadedFile } from '../types';

export const readFile = (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json');

    if (!isImage && !isText) {
      reject(new Error('Unsupported file type. Please upload an image or text file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve({
        name: file.name,
        type: isImage ? 'image' : 'text',
        content,
        originalFile: file,
      });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
};

export const downloadImage = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = `redacted-${filename}`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const downloadText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = `redacted-${filename}`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
};