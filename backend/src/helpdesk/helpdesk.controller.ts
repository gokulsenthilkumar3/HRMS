import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HelpdeskService } from './helpdesk.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TriageTicketDto } from './dto/triage-ticket.dto';
import { RequestWithUser } from '../auth/request-with-user.interface';

@ApiTags('Helpdesk')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class HelpdeskController {
  constructor(private helpdeskService: HelpdeskService) {}

  @Get()
  @ApiOperation({ summary: 'List all helpdesk tickets' })
  async getTickets() {
    return this.helpdeskService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new helpdesk ticket' })
  async createTicket(
    @Body() dto: CreateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    return this.helpdeskService.createTicket(dto, req.user.userId);
  }

  @Post('triage')
  @ApiOperation({ summary: 'AI triage: suggest priority and category for a ticket description' })
  async triageTicket(@Body() dto: TriageTicketDto) {
    return this.helpdeskService.triageTicket(dto);
  }
}
