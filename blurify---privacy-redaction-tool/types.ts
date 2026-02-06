export type FileType = 'image' | 'text';

export interface UploadedFile {
  name: string;
  type: FileType;
  content: string; // Base64 for image, raw string for text
  originalFile?: File;
}

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextRange {
  id: string;
  start: number;
  end: number;
}