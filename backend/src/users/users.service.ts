import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, EmploymentType, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface CreateEmployeeDto {
  email: string;
  fullName: string;
  department: string;
  designation?: string;
  phone?: string;
  gender?: Gender;
  employmentType?: EmploymentType;
  hireDate?: string;
  managerId?: string;
  role?: UserRole;
  city?: string;
  state?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  isActive?: boolean;
  performanceRating?: number;
}

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  // ---- Unique ID generators ----

  async generateUniqueEmployeeId(): Promise<string> {
    const last = await this.prisma.user.findFirst({
      where: { employeeId: { not: null } },
      orderBy: { employeeId: 'desc' },
      select: { employeeId: true },
    });
    let next = 1;
    if (last?.employeeId) {
      const num = parseInt(last.employeeId.replace('EMP-', ''), 10);
      if (!isNaN(num)) next = num + 1;
    }
    return `EMP-${String(next).padStart(3, '0')}`;
  }

  async generateUniqueCode(): Promise<string> {
    const last = await this.prisma.user.findFirst({
      where: { employeeCode: { not: null } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
    let next = 1;
    if (last?.employeeCode) {
      const num = parseInt(last.employeeCode.replace('HRMS-', ''), 10);
      if (!isNaN(num)) next = num + 1;
    }
    return `HRMS-${String(next).padStart(4, '0')}`;
  }

  // ---- CRUD ----

  async create(dto: CreateEmployeeDto) {
    // Validate email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }

    // Validate phone uniqueness if provided
    if (dto.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException(`Phone number ${dto.phone} is already in use`);
      }
    }

    const employeeId   = await this.generateUniqueEmployeeId();
    const employeeCode = await this.generateUniqueCode();

    // Auto-generate password: Emp@{CODE_SUFFIX}
    // e.g. HRMS-0012 → Emp@0012
    const codeSuffix = employeeCode.split('-')[1];
    const rawPassword = `Emp@${codeSuffix}`;
    const passwordHash = await bcrypt.hash(rawPassword, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email:          dto.email.toLowerCase().trim(),
        passwordHash,
        fullName:       dto.fullName.trim(),
        role:           dto.role ?? UserRole.USER,
        department:     dto.department,
        designation:    dto.designation,
        employeeId,
        employeeCode,
        phone:          dto.phone,
        gender:         dto.gender ?? Gender.PREFER_NOT_TO_SAY,
        employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
        hireDate:       dto.hireDate ? new Date(dto.hireDate) : new Date(),
        managerId:      dto.managerId,
        city:           dto.city,
        state:          dto.state,
        country:        'India',
        isActive:       true,
      },
      select: {
        id: true, email: true, fullName: true, role: true,
        department: true, designation: true, employeeId: true,
        employeeCode: true, phone: true, hireDate: true, isActive: true,
        createdAt: true,
      },
    });

    return { ...user, temporaryPassword: rawPassword };
  }

  async findAll(options?: { department?: string; search?: string; isActive?: boolean }) {
    const where: any = {};
    if (options?.department) where.department = options.department;
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.search) {
      where.OR = [
        { fullName:   { contains: options.search, mode: 'insensitive' } },
        { email:      { contains: options.search, mode: 'insensitive' } },
        { employeeId: { contains: options.search, mode: 'insensitive' } },
        { department: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true, role: true,
        department: true, designation: true, employeeId: true,
        phone: true, hireDate: true, isActive: true, avatarUrl: true,
        gender: true, employmentType: true, performanceRating: true,
        city: true, managerId: true, createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        manager:   { select: { id: true, fullName: true, employeeId: true } },
        reportees: { select: { id: true, fullName: true, designation: true, employeeId: true } },
        payslips:  { orderBy: { date: 'desc' }, take: 6 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        attendanceLogs: { orderBy: { date: 'desc' }, take: 30 },
      },
    });
    if (!user) throw new NotFoundException(`Employee ${id} not found`);
    // Never return passwordHash
    const { passwordHash, azureId, ...safe } = user as any;
    return safe;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Employee ${id} not found`);

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (conflict) throw new ConflictException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName       && { fullName: dto.fullName.trim() }),
        ...(dto.email          && { email: dto.email.toLowerCase() }),
        ...(dto.department     && { department: dto.department }),
        ...(dto.designation    && { designation: dto.designation }),
        ...(dto.phone          && { phone: dto.phone }),
        ...(dto.gender         && { gender: dto.gender }),
        ...(dto.employmentType && { employmentType: dto.employmentType }),
        ...(dto.hireDate       && { hireDate: new Date(dto.hireDate) }),
        ...(dto.managerId      !== undefined && { managerId: dto.managerId }),
        ...(dto.city           && { city: dto.city }),
        ...(dto.state          && { state: dto.state }),
        ...(dto.isActive       !== undefined && { isActive: dto.isActive }),
        ...(dto.performanceRating !== undefined && { performanceRating: dto.performanceRating }),
      },
      select: {
        id: true, email: true, fullName: true, role: true,
        department: true, designation: true, employeeId: true,
        phone: true, isActive: true, updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }

  async getDepartments(): Promise<string[]> {
    const result = await this.prisma.user.findMany({
      where: { department: { not: null } },
      distinct: ['department'],
      select: { department: true },
    });
    return result.map((r) => r.department!).filter(Boolean).sort();
  }
}
