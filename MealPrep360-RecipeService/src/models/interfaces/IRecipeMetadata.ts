export interface IRecipeMetadata {
  tags: string[];
  season: string;
  allergenInfo?: string[];
  dietaryInfo?: string[];
  regions?: string[];
  cuisineTypes?: string[];
  climateZones?: string[];
  culturalTags?: string[];
  originalLanguage?: string;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}