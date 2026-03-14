import { IsString, IsNumber, IsOptional, MinLength, MaxLength, Min, IsEnum } from 'class-validator';
import { TourCategory, DifficultyLevel } from './create-tour.dto';

export class UpdateTourDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(TourCategory)
  category?: TourCategory;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxGroupSize?: number;
}
