import { Controller, Post, Get, Body, UseGuards, Query, BadRequestException, UseInterceptors, ParseIntPipe, UploadedFile } from '@nestjs/common';
import { MovementsService } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MovementType } from './entities/movement.entity.js';

@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(
    private readonly movementsService: MovementsService,
  ) {}

  @Get('search')
  async searchMovements(
    @Query('type') type?: MovementType,
    @Query('productName') productName?: string,
    @Query('productId') productId?: number,
    @Query('userId') userId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.movementsService.search({
      type,
      productName,
      productId: productId ? Number(productId) : undefined,
      userId: userId ? Number(userId) : undefined,
      startDate,
      endDate,
    });
  }

  @Post()
  async create(@Body() createMovementDto: CreateMovementDto) {
    return this.movementsService.create(createMovementDto);
  }

  @Get()
  async findAll() {
    return this.movementsService.findAll();
  }

}