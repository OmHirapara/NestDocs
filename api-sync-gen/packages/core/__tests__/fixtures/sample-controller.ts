import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from './mock-decorators.js';
import { CreateTourDto } from './sample-dto';

@Controller('tours')
export class ToursController {
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @HttpCode(201)
  @UseGuards()
  create(@Body() createTourDto: CreateTourDto) {
    return {};
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateTourDto) {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return;
  }
}
