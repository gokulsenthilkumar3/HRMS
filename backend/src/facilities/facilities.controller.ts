import { Controller, Get } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get('meeting-rooms')
  getMeetingRooms() {
    return { meetingRooms: [] };
  }

  @Get('desks')
  getDesks() {
    return { desks: [] };
  }
}
