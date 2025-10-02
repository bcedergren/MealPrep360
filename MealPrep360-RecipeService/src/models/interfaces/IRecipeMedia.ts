export interface IRecipeMedia {
  images?: {
    main: string;
    thumbnail: string;
    additional: string[];
  };
  imageGenerationJobId?: string;
  hasImage?: boolean;
  embedding?: number[];
}