import {
  IsString, IsNumber, IsOptional, IsNotEmpty,
  MinLength, MaxLength, Min, Max, IsEnum, IsArray, ArrayMinSize,
} from 'class-validator';

export enum TourCategory {
  ADVENTURE = 'adventure',
  CULTURAL = 'cultural',
  WILDLIFE = 'wildlife',
  BEACH = 'beach',
  MOUNTAIN = 'mountain',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard',
}

export class CreateTourDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description!: string;

  @IsNumber()
  @Min(0)
  @Max(999999)
  price!: number;

  @IsNumber()
  @Min(1)
  @Max(365)
  duration!: number;

  @IsEnum(TourCategory)
  category!: TourCategory;

  @IsEnum(DifficultyLevel)
  difficulty!: DifficultyLevel;

  @IsNumber()
  @Min(1)
  @Max(50)
  maxGroupSize!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  startLocation?: string;
}
