import { IsString, IsNumber, IsOptional, IsNotEmpty, MinLength, MaxLength, Min, Max, IsEmail, IsEnum } from 'class-validator';

export enum TourCategory {
  ADVENTURE = 'adventure',
  CULTURAL = 'cultural',
  WILDLIFE = 'wildlife',
}

export class CreateTourDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(999999)
  price!: number;

  @IsNumber()
  @Min(1)
  duration!: number;

  @IsEnum(TourCategory)
  category!: TourCategory;

  @IsOptional()
  @IsString()
  description?: string;
}
