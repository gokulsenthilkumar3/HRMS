import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        employeeId: true,
        hireDate: true,
        performanceRating: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { 
    email: string; 
    fullName: string; 
    role: string;
    department?: string;
    employeeId?: string;
    hireDate?: string;
    performanceRating?: number;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role as UserRole,
        azureId: `local-auth-${Date.now()}`,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        employeeId: true,
        hireDate: true,
        performanceRating: true,
      },
    });
  }
}
