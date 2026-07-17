import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, TicketPriority } from './dto/create-ticket.dto';
import { TriageTicketDto } from './dto/triage-ticket.dto';

export interface TriageResult {
  suggestedPriority: TicketPriority;
  suggestedCategory: string;
  confidence: number;
  aiSummary: string;
}

@Injectable()
export class HelpdeskService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.helpdeskTicket.findMany({
      include: { user: true, asset: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTicket(dto: CreateTicketDto, userId: string) {
    return this.prisma.helpdeskTicket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? TicketPriority.MEDIUM,
        assetId: dto.assetId,
        userId,
      },
      include: { user: true, asset: true },
    });
  }

  /**
   * Heuristic triage engine.
   * TODO: Replace with LangChain.js + provider-agnostic LLM call when
   * OPENAI_API_KEY or GROQ_API_KEY is present in the environment.
   */
  triageTicket(dto: TriageTicketDto): TriageResult {
    const desc = dto.description.toLowerCase();

    // Keyword → priority scoring
    const criticalKeywords = ['critical', 'not booting', 'data loss', 'fire', 'smoke', 'dead', 'stolen'];
    const highKeywords = ['crash', 'bsod', 'overheating', 'broken screen', 'no power', 'virus', 'malware'];
    const hardwareKeywords = ['screen', 'keyboard', 'battery', 'fan', 'thermal', 'port', 'display', 'ram', 'ssd', 'hdd'];
    const softwareKeywords = ['software', 'driver', 'update', 'install', 'windows', 'linux', 'app', 'crash', 'freeze'];
    const networkKeywords = ['wifi', 'network', 'ethernet', 'vpn', 'dns', 'internet', 'connection'];

    const isCritical = criticalKeywords.some((kw) => desc.includes(kw));
    const isHigh = highKeywords.some((kw) => desc.includes(kw));
    const isHardware = hardwareKeywords.some((kw) => desc.includes(kw));
    const isSoftware = softwareKeywords.some((kw) => desc.includes(kw));
    const isNetwork = networkKeywords.some((kw) => desc.includes(kw));

    const suggestedPriority: TicketPriority = isCritical
      ? TicketPriority.CRITICAL
      : isHigh
      ? TicketPriority.HIGH
      : TicketPriority.MEDIUM;

    const suggestedCategory = isNetwork
      ? 'Network / Connectivity'
      : isHardware
      ? 'Hardware'
      : isSoftware
      ? 'Software'
      : 'General IT';

    const matchedCount = [isCritical, isHigh, isHardware, isSoftware, isNetwork].filter(Boolean).length;
    const confidence = Math.min(0.5 + matchedCount * 0.1, 0.95);

    return {
      suggestedPriority,
      suggestedCategory,
      confidence: Math.round(confidence * 100) / 100,
      aiSummary: `Based on keyword analysis, this appears to be a ${suggestedCategory} issue with ${suggestedPriority.toLowerCase()} priority. Manual review recommended for final classification.`,
    };
  }
}
