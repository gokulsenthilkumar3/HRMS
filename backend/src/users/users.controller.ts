import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, Request, ForbiddenException,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequestWithUser } from '../auth/request-with-user.interface';
import { UserRole } from '@prisma/client';

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

  /** GET /users/directory-options — live form suggestions from existing records */
  @Get('directory-options')
  getDirectoryOptions() {
    return this.usersService.getDirectoryOptions();
  }

  /** GET /users/me  — current user profile */
  @Get('me')
  getMe(@Request() req: RequestWithUser) {
    return this.usersService.findOne(req.user.userId);
  }

  /** GET /users/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    // Users can only view their own profile; admins/managers can view all
    if (req.user.role === UserRole.USER && req.user.userId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  /** POST /users  — create new employee (ADMIN / MANAGER only) */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto, @Request() req: RequestWithUser) {
    if (req.user.role !== UserRole.ADMIN && dto.role && dto.role !== UserRole.USER) {
      throw new ForbiddenException('Only administrators can assign elevated roles');
    }
    return this.usersService.create({
      ...dto,
      role: req.user.role === UserRole.ADMIN ? dto.role : UserRole.USER,
    });
  }

  /** PATCH /users/:id  — update employee */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== UserRole.ADMIN && (dto.role !== undefined || dto.isActive !== undefined)) {
      throw new ForbiddenException('Only administrators can change roles or account status');
    }
    return this.usersService.update(id, dto);
  }

  /** PATCH /users/:id/deactivate  — soft-delete */
  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    if (id === req.user.userId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.usersService.deactivate(id);
  }
}
