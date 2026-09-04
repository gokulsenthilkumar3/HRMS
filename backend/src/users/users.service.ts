import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, EmploymentType, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  private cleanOptional(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private async validateManager(managerId?: string | null, employeeId?: string) {
    if (!managerId) return;
    if (managerId === employeeId) throw new BadRequestException('An employee cannot be their own manager');
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true, isActive: true },
    });
    if (!manager || !manager.isActive || (manager.role !== UserRole.ADMIN && manager.role !== UserRole.MANAGER)) {
      throw new BadRequestException('Select an active administrator or manager');
    }
  }

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

  /** Completes older self-signup records created before IDs were generated. */
  async ensureEmployeeIdentity(id: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, employeeId: true, employeeCode: true, hireDate: true, createdAt: true },
    });
    if (!existing) throw new NotFoundException(`Employee ${id} not found`);
    if (existing.employeeId && existing.employeeCode && existing.hireDate) return existing;

    return this.prisma.user.update({
      where: { id },
      data: {
        employeeId: existing.employeeId ?? await this.generateUniqueEmployeeId(),
        employeeCode: existing.employeeCode ?? await this.generateUniqueCode(),
        hireDate: existing.hireDate ?? existing.createdAt,
      },
      select: { id: true, employeeId: true, employeeCode: true, hireDate: true, createdAt: true },
    });
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
    const normalizedPhone = this.cleanOptional(dto.phone);
    if (normalizedPhone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
      if (phoneExists) {
        throw new ConflictException(`Phone number ${normalizedPhone} is already in use`);
      }
    }

    await this.validateManager(dto.managerId);

    const employeeId   = await this.generateUniqueEmployeeId();
    const employeeCode = await this.generateUniqueCode();

    // Generate a one-time password that cannot be inferred from an employee ID.
    const rawPassword = `Hr!${randomBytes(9).toString('base64url')}`;
    const passwordHash = await bcrypt.hash(rawPassword, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email:          dto.email.toLowerCase().trim(),
        passwordHash,
        fullName:       dto.fullName.trim(),
        role:           dto.role ?? UserRole.USER,
        department:     dto.department.trim(),
        designation:    this.cleanOptional(dto.designation),
        employeeId,
        employeeCode,
        phone:          normalizedPhone,
        gender:         dto.gender ?? Gender.PREFER_NOT_TO_SAY,
        employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
        hireDate:       dto.hireDate ? new Date(dto.hireDate) : new Date(),
        managerId:      dto.managerId || null,
        city:           this.cleanOptional(dto.city),
        state:          this.cleanOptional(dto.state),
        country:        this.cleanOptional(dto.country),
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
        city: true, state: true, managerId: true, createdAt: true,
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

    const normalizedEmail = dto.email?.toLowerCase().trim();
    if (normalizedEmail && normalizedEmail !== user.email) {
      const conflict = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (conflict) throw new ConflictException('Email already in use');
    }


    const normalizedPhone = this.cleanOptional(dto.phone);
    if (normalizedPhone && normalizedPhone !== user.phone) {
      const conflict = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone, id: { not: id } },
      });
      if (conflict) throw new ConflictException('Phone number already in use');
    }

    if (dto.managerId !== undefined) await this.validateManager(dto.managerId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName       !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.email          !== undefined && { email: normalizedEmail }),
        ...(dto.department     !== undefined && { department: this.cleanOptional(dto.department) }),
        ...(dto.designation    !== undefined && { designation: this.cleanOptional(dto.designation) }),
        ...(dto.phone          !== undefined && { phone: normalizedPhone }),
        ...(dto.gender         !== undefined && { gender: dto.gender }),
        ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
        ...(dto.hireDate       !== undefined && { hireDate: dto.hireDate ? new Date(dto.hireDate) : null }),
        ...(dto.managerId      !== undefined && { managerId: dto.managerId || null }),
        ...(dto.city           !== undefined && { city: this.cleanOptional(dto.city) }),
        ...(dto.state          !== undefined && { state: this.cleanOptional(dto.state) }),
        ...(dto.country        !== undefined && { country: this.cleanOptional(dto.country) }),
        ...(dto.role           !== undefined && { role: dto.role }),
        ...(dto.isActive       !== undefined && { isActive: dto.isActive }),
        ...(dto.performanceRating !== undefined && { performanceRating: dto.performanceRating }),
      },
      select: {
        id: true, email: true, fullName: true, role: true,
        department: true, designation: true, employeeId: true,
        phone: true, hireDate: true, employmentType: true, gender: true,
        city: true, state: true, managerId: true, isActive: true, updatedAt: true,
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

  async getDirectoryOptions() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        role: true,
        department: true,
        designation: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const departments = new Map<string, { name: string; designations: Set<string> }>();
    for (const user of users) {
      const department = user.department?.trim();
      if (!department) continue;
      const key = department.toLocaleLowerCase();
      const existing = departments.get(key) ?? { name: department, designations: new Set<string>() };
      if (user.designation?.trim()) existing.designations.add(user.designation.trim());
      departments.set(key, existing);
    }

    return {
      departments: Array.from(departments.values())
        .map(({ name, designations }) => ({
          name,
          designations: Array.from(designations).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      managers: users
        .filter(({ role }) => role === UserRole.ADMIN || role === UserRole.MANAGER)
        .map(({ id, fullName, employeeId, department }) => ({ id, fullName, employeeId, department })),
    };
  }
}
