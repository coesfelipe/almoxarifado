import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { XmlParserService } from './xml-parser.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Controller('products')
@UseGuards(JwtAuthGuard) // Protege todas as rotas deste controller com JWT
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly xmlParserService: XmlParserService,
  ) {}

  @Get('search')
  async search(@Query('q') query: string) {
    return this.productsService.searchProducts(query || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
    // Pega o ID do usuário do token JWT (req.user.userId)
    return this.productsService.create(createProductDto, req.user.userId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Post('import-xml')
  @UseInterceptors(FileInterceptor('file'))
  async importXml(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    if (!file) {
      throw new BadRequestException('O arquivo XML da Nota Fiscal é obrigatório.');
    }

    // 1. Converte o XML recebido em dados estruturados
    const extractedItems = this.xmlParserService.extractProductsFromXml(file.buffer);

    // 2. Reutiliza o mesmo serviço de transação para atualizar o estoque
    return await this.productsService.importFromPdf(extractedItems, userId);
  }
}