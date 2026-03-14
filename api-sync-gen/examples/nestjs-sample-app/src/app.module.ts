import { Module } from '@nestjs/common';
import { ToursController } from './tours/tours.controller';
import { BookingsController } from './bookings/bookings.controller';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';

@Module({
  controllers: [
    ToursController,
    BookingsController,
    AuthController,
    UsersController,
  ],
})
export class AppModule {}
