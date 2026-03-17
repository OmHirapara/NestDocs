import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  @Get()
  @UseGuards()
  findAll(): unknown[] {
    return [];
  }

  @Get(':id')
  @UseGuards()
  findOne(@Param('id') _id: string): Record<string, unknown> {
    return {};
  }

  @Post()
  @HttpCode(201)
  @UseGuards()
  create(@Body() _createBookingDto: CreateBookingDto): Record<string, unknown> {
    return {};
  }

  @Patch(':id/cancel')
  @UseGuards()
  cancel(@Param('id') _id: string): Record<string, unknown> {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards()
  remove(@Param('id') _id: string): void {
    return;
  }
}
