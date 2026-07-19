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
      include: { _count: { select: { applicants: true } } },
      orderBy: { postedAt: 'desc' },
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id }, include: { applicants: true } });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  // ── Applications / Kanban ───────────────────────────────────────────

  async applyToJob(jobId: string, dto: { name: string; email: string; phone?: string; resumeUrl?: string; source?: string }) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job || !job.isActive) throw new BadRequestException('This position is no longer accepting applications');
    
    return this.prisma.applicant.create({
      data: {
        jobId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        resumeUrl: dto.resumeUrl,
        source: dto.source ?? 'DIRECT',
        stage: 'APPLIED',
      }
    });
  }

  async getKanban(jobId?: string) {
    const apps = await this.prisma.applicant.findMany({
      where: jobId ? { jobId } : {},
      include: { job: { select: { title: true, department: true } } },
      orderBy: { appliedAt: 'asc' },
    });
    const board: Record<Stage, any[]> = { APPLIED:[], SCREENING:[], INTERVIEW:[], OFFER:[], HIRED:[], REJECTED:[] };
    for (const a of apps) board[a.stage as Stage]?.push(a);
    return board;
  }

  async moveStage(applicationId: string, newStage: Stage) {
    if (!PIPELINE_STAGES.includes(newStage)) throw new BadRequestException(`Invalid stage: ${newStage}`);
    const app = await this.prisma.applicant.update({
      where: { id: applicationId },
      data: { stage: newStage },
      include: { job: true },
    });
    if (newStage === 'HIRED') await this.sendOnboardingEmail(app);
    if (newStage === 'OFFER') this.logger.log(`Offer extended to ${app.email} for ${app.job.title}`, 'Recruitment');
    return app;
  }

  // ── Offer Letter ────────────────────────────────────────────────────────

  generateOfferLetter(data: { candidateName: string; role: string; department: string; salary: number; joiningDate: string; companyName?: string }) {
    const company = data.companyName ?? 'HRMS Corp Pvt. Ltd.';
    const salaryStr = data.salary.toLocaleString('en-IN');
    return {
      subject: `Offer of Employment — ${data.role} at ${company}`,
      body: `Dear ${data.candidateName},\n\nWe are delighted to extend an offer of employment for the position of **${data.role}** in the **${data.department}** department at ${company}.\n\n**Compensation:**\n- Annual CTC: ₹${salaryStr}\n- Monthly Gross: ₹${Math.round(data.salary/12).toLocaleString('en-IN')}\n\n**Joining Date:** ${new Date(data.joiningDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}\n\nPlease confirm your acceptance by replying to this letter within 5 working days.\n\nWe look forward to welcoming you to the team!\n\nWarm regards,\nHuman Resources Team\n${company}`,
      generatedAt: new Date().toISOString(),
    };
  }

  private async sendOnboardingEmail(app: any) {
    // In production: integrate with SendGrid / AWS SES
    this.logger.log(`[ONBOARDING EMAIL] Sent to ${app.email} — ${app.job.title}`, 'Recruitment');
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics() {
    const [allApps, hired, offered] = await Promise.all([
      this.prisma.applicant.findMany({ select: { stage:true, appliedAt:true, source:true } }),
      this.prisma.applicant.findMany({ where:{ stage:'HIRED' },   select:{ appliedAt:true } }),
      this.prisma.applicant.count({ where:{ stage:{ in:['OFFER','HIRED'] } } }),
    ]);
    const avgTimeToHire = 0;
    const sourceCount: Record<string,number> = {};
    for (const a of allApps) sourceCount[a.source??'DIRECT']=(sourceCount[a.source??'DIRECT']??0)+1;
    const offerAcceptanceRate = allApps.length ? +((offered/allApps.length)*100).toFixed(1) : 0;
    return { total:allApps.length, hired:hired.length, avgTimeToHireDays:avgTimeToHire, sourceBreakdown:sourceCount, offerAcceptanceRate };
  }
}
