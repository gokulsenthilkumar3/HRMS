import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class CreateUserDto {
  email!: string;
  fullName!: string;
  role!: string;
  department?: string;
  employeeId?: string;
  hireDate?: string;
  performanceRating?: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
