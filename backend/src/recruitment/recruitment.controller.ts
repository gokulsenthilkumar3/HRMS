import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private svc: RecruitmentService) {}

  // Public routes (no auth) — for /careers page
  @SkipThrottle() @Get('public/jobs') publicJobs() { return this.svc.listJobs(true); }
  @SkipThrottle() @Get('public/jobs/:id') publicJob(@Param('id') id:string) { return this.svc.getJob(id); }
  @SkipThrottle() @Post('public/apply/:jobId') apply(@Param('jobId') jobId:string, @Body() dto:any) { return this.svc.applyToJob(jobId, dto); }

  // Protected routes
  @UseGuards(JwtAuthGuard) @Get('jobs')        listJobs()    { return this.svc.listJobs(); }
  @UseGuards(JwtAuthGuard) @Post('jobs')       createJob(@Body() dto:any) { return this.svc.createJob(dto); }
  @UseGuards(JwtAuthGuard) @Get('kanban')      kanban(@Query('jobId') jobId?:string) { return this.svc.getKanban(jobId); }
  @UseGuards(JwtAuthGuard) @Patch('applications/:id/stage') moveStage(@Param('id') id:string, @Body() body:{stage:any}) { return this.svc.moveStage(id, body.stage); }
  @UseGuards(JwtAuthGuard) @Post('offer-letter') offerLetter(@Body() dto:any) { return this.svc.generateOfferLetter(dto); }
  @UseGuards(JwtAuthGuard) @Get('analytics')   analytics()   { return this.svc.getAnalytics(); }
}
