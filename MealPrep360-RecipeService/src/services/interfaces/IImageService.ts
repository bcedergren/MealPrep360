export interface ImageGenerationParams {
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
}

export interface GeneratedImage {
  main: string;
  thumbnail: string;
  additional: string[];
}

export interface IImageService {
  generateImages(params: ImageGenerationParams): Promise<GeneratedImage>;
  optimizeImage(imageData: string): Promise<string>;
  generateThumbnail(imageData: string): Promise<string>;
  cacheImage(key: string, image: GeneratedImage): void;
  getCachedImage(key: string): GeneratedImage | null;
  clearImageCache(): void;
}