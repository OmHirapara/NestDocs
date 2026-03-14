import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode,
} from '@nestjs/common';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Controller('tours')
export class ToursController {
  @Get()
  findAll(
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('category') _category?: string,
    @Query('difficulty') _difficulty?: string,
    @Query('minPrice') _minPrice?: string,
    @Query('maxPrice') _maxPrice?: string,
  ) {
    return [];
  }

  @Get('featured')
  getFeatured() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return {};
  }

  @Post()
  @HttpCode(201)
  @UseGuards()
  create(@Body() _createTourDto: CreateTourDto) {
    return {};
  }

  @Patch(':id')
  @UseGuards()
  update(@Param('id') _id: string, @Body() _updateTourDto: UpdateTourDto) {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards()
  remove(@Param('id') _id: string) {
    return;
  }

  @Get(':id/bookings')
  getTourBookings(@Param('id') _id: string) {
    return [];
  }
}
