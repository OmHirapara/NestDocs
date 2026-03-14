import { IsString, IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  tourId!: string;

  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsDateString()
  startDate!: string;

  @IsNumber()
  @Min(1)
  numberOfPeople!: number;
}
