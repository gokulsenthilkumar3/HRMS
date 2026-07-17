import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLoggerService } from '../common/logger/winston.logger';

const PIPELINE_STAGES = ['APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED'] as const;
type Stage = typeof PIPELINE_STAGES[number];

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService, private logger: WinstonLoggerService) {}

  // ── Job Postings ─────────────────────────────────────────────────────

  async createJob(dto: any) {
    return this.prisma.jobPosting.create({ data: { ...dto, isActive: true } });
  }

  async listJobs(activeOnly = false) {
    return this.prisma.jobPosting.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id }, include: { applications: { include: { candidate: true } } } });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  // ── Applications / Kanban ───────────────────────────────────────────

  async applyToJob(jobId: string, dto: { name: string; email: string; phone?: string; resumeUrl?: string; source?: string }) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job || !job.isActive) throw new BadRequestException('This position is no longer accepting applications');
    let candidate = await this.prisma.candidate.findUnique({ where: { email: dto.email } });
    if (!candidate) candidate = await this.prisma.candidate.create({ data: { name: dto.name, email: dto.email, phone: dto.phone, resumeUrl: dto.resumeUrl } });
    return this.prisma.application.create({ data: { jobId, candidateId: candidate.id, status: 'APPLIED', source: dto.source ?? 'DIRECT', appliedAt: new Date() } });
  }

  async getKanban(jobId?: string) {
    const apps = await this.prisma.application.findMany({
      where: jobId ? { jobId } : {},
      include: { candidate: true, job: { select: { title: true, department: true } } },
      orderBy: { appliedAt: 'asc' },
    });
    const board: Record<Stage, any[]> = { APPLIED:[], SCREENING:[], INTERVIEW:[], OFFER:[], HIRED:[], REJECTED:[] };
    for (const a of apps) board[a.status as Stage]?.push(a);
    return board;
  }

  async moveStage(applicationId: string, newStage: Stage) {
    if (!PIPELINE_STAGES.includes(newStage)) throw new BadRequestException(`Invalid stage: ${newStage}`);
    const app = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: newStage, ...(newStage === 'HIRED' ? { hiredAt: new Date() } : {}) },
      include: { candidate: true, job: true },
    });
    if (newStage === 'HIRED') await this.sendOnboardingEmail(app);
    if (newStage === 'OFFER') this.logger.log(`Offer extended to ${app.candidate.email} for ${app.job.title}`, 'Recruitment');
    return app;
  }

  // ── Offer Letter ────────────────────────────────────────────────────────

  generateOfferLetter(data: { candidateName: string; role: string; department: string; salary: number; joiningDate: string; companyName?: string }) {
    const company = data.companyName ?? 'HRMS Corp Pvt. Ltd.';
    const salaryStr = data.salary.toLocaleString('en-IN');
    return {
      subject: `Offer of Employment — ${data.role} at ${company}`,
      body: `Dear ${data.candidateName},

We are delighted to extend an offer of employment for the position of **${data.role}** in the **${data.department}** department at ${company}.

**Compensation:**
- Annual CTC: ₹${salaryStr}
- Monthly Gross: ₹${Math.round(data.salary/12).toLocaleString('en-IN')}

**Joining Date:** ${new Date(data.joiningDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}

Please confirm your acceptance by replying to this letter within 5 working days.

We look forward to welcoming you to the team!

Warm regards,
Human Resources Team
${company}`,
      generatedAt: new Date().toISOString(),
    };
  }

  private async sendOnboardingEmail(app: any) {
    // In production: integrate with SendGrid / AWS SES
    this.logger.log(`[ONBOARDING EMAIL] Sent to ${app.candidate.email} — ${app.job.title}`, 'Recruitment');
    await this.prisma.emailLog.create({
      data: {
        to: app.candidate.email,
        subject: `Welcome aboard — ${app.job.title}`,
        body: `Congratulations ${app.candidate.name}! Your onboarding details will follow shortly.`,
        type: 'ONBOARDING',
        sentAt: new Date(),
      },
    }).catch(() => {});
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics() {
    const [allApps, hired, offered] = await Promise.all([
      this.prisma.application.findMany({ select: { status:true, appliedAt:true, hiredAt:true, source:true } }),
      this.prisma.application.findMany({ where:{ status:'HIRED' },   select:{ appliedAt:true, hiredAt:true } }),
      this.prisma.application.count({ where:{ status:{ in:['OFFER','HIRED'] } } }),
    ]);
    const avgTimeToHire = hired.length
      ? Math.round(hired.reduce((s,a)=>s+(a.hiredAt?+a.hiredAt-+a.appliedAt:0),0)/hired.length/86400000)
      : 0;
    const sourceCount: Record<string,number> = {};
    for (const a of allApps) sourceCount[a.source??'DIRECT']=(sourceCount[a.source??'DIRECT']??0)+1;
    const offerAcceptanceRate = allApps.length ? +((offered/allApps.length)*100).toFixed(1) : 0;
    return { total:allApps.length, hired:hired.length, avgTimeToHireDays:avgTimeToHire, sourceBreakdown:sourceCount, offerAcceptanceRate };
  }
}
