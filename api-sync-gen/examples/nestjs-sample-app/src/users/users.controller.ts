import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Get()
  @UseGuards()
  findAll() {
    return [];
  }

  @Get(':id')
  @UseGuards()
  findOne(@Param('id') _id: string) {
    return {};
  }

  @Post()
  @HttpCode(201)
  register(@Body() _createUserDto: CreateUserDto) {
    return {};
  }

  @Patch(':id')
  @UseGuards()
  update(@Param('id') _id: string, @Body() _dto: Partial<CreateUserDto>) {
    return {};
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards()
  remove(@Param('id') _id: string) {
    return;
  }
}
