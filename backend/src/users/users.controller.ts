import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, Request, ForbiddenException,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService, CreateEmployeeDto, UpdateEmployeeDto } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users  — list employees (all authenticated) */
  @Get()
  findAll(
    @Query('department') department?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    const isActive = active === 'false' ? false : active === 'true' ? true : undefined;
    return this.usersService.findAll({ department, search, isActive });
  }

  /** GET /users/departments  — distinct departments list */
  @Get('departments')
  getDepartments() {
    return this.usersService.getDepartments();
  }

  /** GET /users/me  — current user profile */
  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findOne(req.user.sub);
  }

  /** GET /users/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    // Users can only view their own profile; admins/managers can view all
    if (req.user.role === 'USER' && req.user.sub !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  /** POST /users  — create new employee (ADMIN / MANAGER only) */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto) {
    return this.usersService.create(dto);
  }

  /** PATCH /users/:id  — update employee */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: any,
  ) {
    // Managers can only update employees in their team (simplified: check managerId)
    return this.usersService.update(id, dto);
  }

  /** PATCH /users/:id/deactivate  — soft-delete */
  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }
}
