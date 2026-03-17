import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
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
  register(@Body() _createUserDto: CreateUserDto): Record<string, unknown> {
    return {};
  }

  @Patch(':id')
  @UseGuards()
  update(@Param('id') _id: string, @Body() _dto: Partial<CreateUserDto>): Record<string, unknown> {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards()
  remove(@Param('id') _id: string): void {
    return;
  }
}
