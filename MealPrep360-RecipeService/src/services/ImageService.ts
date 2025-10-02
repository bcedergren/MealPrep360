import { IImageService, ImageGenerationParams, GeneratedImage } from './interfaces/IImageService';
import { ILogger } from './interfaces/ILogger';
import { config } from '../config';
import { ServiceContainer } from '../container/ServiceContainer';
import sharp from 'sharp';

export class ImageService implements IImageService {
  private logger: ILogger;
  private apiKey: string;
  private imageCache: Map<string, { image: GeneratedImage; timestamp: number }>;
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(logger: ILogger) {
    this.logger = logger;
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    this.apiKey = config.openai.apiKey;
    this.imageCache = new Map();
  }

  public static getInstance(): ImageService {
    const container = ServiceContainer.getInstance();
    const logger = container.get<ILogger>('ILogger');
    return new ImageService(logger);
  }

  public async generateImages(params: ImageGenerationParams): Promise<GeneratedImage> {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: params.prompt,
          n: params.n || 1,
          size: params.size || '1024x1024',
          quality: params.quality || 'standard',
          style: params.style || 'vivid',
          response_format: 'b64_json',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Generate main image and thumbnail
      const mainImage = data.data[0].b64_json;
      const thumbnail = await this.generateThumbnail(mainImage);

      // Generate additional images if requested
      const additional = data.data.slice(1).map((img: any) => img.b64_json);

      const generatedImage: GeneratedImage = {
        main: mainImage,
        thumbnail,
        additional,
      };

      return generatedImage;
    } catch (error) {
      this.logger.error('Error generating images:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async optimizeImage(imageData: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Optimize the image
      const optimizedBuffer = await sharp(buffer)
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      // Convert back to base64
      return `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error('Error optimizing image:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async generateThumbnail(imageData: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate thumbnail
      const thumbnailBuffer = await sharp(buffer)
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Convert back to base64
      return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error('Error generating thumbnail:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public cacheImage(key: string, image: GeneratedImage): void {
    this.imageCache.set(key, {
      image,
      timestamp: Date.now(),
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  public getCachedImage(key: string): GeneratedImage | null {
    const cached = this.imageCache.get(key);
    if (!cached) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.imageCache.delete(key);
      return null;
    }

    return cached.image;
  }

  public clearImageCache(): void {
    this.imageCache.clear();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.imageCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.imageCache.delete(key);
      }
    }
  }
}