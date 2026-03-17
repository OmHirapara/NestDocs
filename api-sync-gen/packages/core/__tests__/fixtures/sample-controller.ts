import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from './mock-decorators.js';
import { CreateTourDto } from './sample-dto.js';

@Controller('tours')
export class ToursController {
  @Get()
  findAll(@Query('page') _page?: string, @Query('limit') _limit?: string): unknown[] {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') _id: string): Record<string, unknown> {
    return {};
  }

  @Post()
  @HttpCode(201)
  @UseGuards()
  create(@Body() _createTourDto: CreateTourDto): Record<string, unknown> {
    return {};
  }

  @Put(':id')
  update(@Param('id') _id: string, @Body() _dto: CreateTourDto): Record<string, unknown> {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') _id: string): void {
    return;
  }
}
