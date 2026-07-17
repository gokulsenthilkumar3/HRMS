import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Req, HttpCode,
  HttpStatus, Query, ParseUUIDPipe, ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiQuery, ApiParam, ApiResponse,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CheckoutAssetDto } from './dto/checkout-asset.dto';
import { CheckinAssetDto } from './dto/checkin-asset.dto';
import { CreateAssetTypeDto } from './dto/create-type.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { RequestWithUser } from '../auth/request-with-user.interface';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: 'List all assets (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.assetService.findAll(page, Math.min(limit, 100), search);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  async getSummary() {
    return this.assetService.getSummary();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get global activity log (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivity(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.assetService.getGlobalActivityLog(page, Math.min(limit, 100));
  }

  @Get('types')
  @ApiOperation({ summary: 'List all asset types' })
  async getTypes() {
    return this.assetService.getTypes();
  }

  @Get('locations')
  @ApiOperation({ summary: 'List all locations' })
  async getLocations() {
    return this.assetService.getLocations();
  }

  @Post('types')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new asset type' })
  async createType(@Body() dto: CreateAssetTypeDto) {
    return this.assetService.createType(dto.name, dto.lifespanYears);
  }

  @Post('locations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new location' })
  async createLocation(@Body() dto: CreateLocationDto) {
    return this.assetService.createLocation(dto.name, dto.address ?? 'TBD');
  }

  @Get(':id/audit-hash')
  @ApiOperation({ summary: 'Get cryptographic audit hash for an asset' })
  @ApiParam({ name: 'id', description: 'Asset UUID or Tag ID' })
  async getAuditHash(@Param('id') id: string) {
    return this.assetService.getAuditHash(id);
  }

  @Get(':id/verify-audit')
  @ApiOperation({ summary: 'Verify the cryptographic integrity of the asset audit trail' })
  @ApiParam({ name: 'id', description: 'Asset UUID or Tag ID' })
  async verifyAudit(@Param('id') id: string) {
    return this.assetService.verifyAuditIntegrity(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single asset by UUID or Tag ID' })
  @ApiParam({ name: 'id', description: 'Asset UUID or Tag ID' })
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Register a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  async create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetService.createAsset(createAssetDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update an asset' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.assetService.updateAsset(id, updateAssetDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset (ADMIN only, must not be ASSIGNED)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetService.deleteAsset(id);
  }

  @Post(':id/checkout')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Check out an asset to a user' })
  async checkout(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() dto: CheckoutAssetDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = dto.userId ?? req.user.userId;
    return this.assetService.checkoutAsset(assetId, userId, dto.signature ?? '');
  }

  @Post(':id/checkin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Check in an asset from the current user' })
  async checkin(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() dto: CheckinAssetDto,
    @Req() req: RequestWithUser,
  ) {
    return this.assetService.checkinAsset(assetId, req.user.userId, dto.conditionNotes);
  }
}
