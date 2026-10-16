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
import { Product } from './entities/product.entity.js';

/**
 * Controller responsável pelos endpoints de gerenciamento de produtos no almoxarifado.
 * Todas as rotas são protegidas via JWT, exigindo que o usuário esteja autenticado.
 */
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly xmlParserService: XmlParserService,
  ) {}

  /**
   * Realiza busca textual rápida de produtos por nome.
   * Rota: GET /products/search?q=nome
   *
   * @param query Termo de busca digitado pelo usuário
   * @returns Lista de produtos encontrados
   */
  @Get('search')
  async search(@Query('q') query?: string): Promise<Product[]> {
    return this.productsService.searchProducts(query || '');
  }

  /**
   * Cadastra um novo produto no catálogo do almoxarifado.
   * Rota: POST /products
   * O ID do usuário operador é extraído de forma segura do payload do token JWT.
   *
   * @param req Objeto de requisição do Express contendo o usuário autenticado
   * @param createProductDto Dados validados do novo produto
   * @returns Produto criado e persistido
   */
  @Post()
  async create(@Request() req: any, @Body() createProductDto: CreateProductDto): Promise<Product> {
    const userId = req.user?.userId || 1;
    return this.productsService.create(createProductDto, userId);
  }

  /**
   * Atualiza as informações de um produto existente.
   * Rota: PUT /products/:id
   *
   * @param id Identificador do produto a ser alterado
   * @param updateProductDto Campos cadastrais atualizados
   * @returns Produto atualizado
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Retorna a lista completa de produtos cadastrados no sistema.
   * Rota: GET /products
   *
   * @returns Lista de todos os produtos do estoque
   */
  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  /**
   * Retorna os detalhes de um único produto, incluindo seu histórico de movimentações.
   * Rota: GET /products/:id
   *
   * @param id Identificador numérico do produto
   * @returns Dados do produto
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  /**
   * Remove permanentemente um produto do catálogo do almoxarifado.
   * Rota: DELETE /products/:id
   *
   * @param id Identificador numérico do produto a excluir
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.remove(id);
  }

  /**
   * Realiza a importação automática de itens e estoque a partir do arquivo XML de NF-e.
   * Rota: POST /products/import-xml
   *
   * @param file Arquivo XML da NF-e enviado via formulário multipart
   * @param userId Identificador do operador que submeteu o arquivo
   * @returns Resumo detalhado com total de itens importados e saldos atualizados
   */
  @Post('import-xml')
  @UseInterceptors(FileInterceptor('file'))
  async importXml(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') bodyUserId?: any,
  ) {
    if (!file) {
      throw new BadRequestException('O arquivo XML da Nota Fiscal é obrigatório.');
    }

    const userId = req.user?.userId || (bodyUserId ? Number(bodyUserId) : 1);

    // 1. Converte o XML recebido em dados estruturados
    const extractedItems = this.xmlParserService.extractProductsFromXml(file.buffer);

    // 2. Reutiliza o mesmo serviço de transação para atualizar o estoque e registrar as movimentações
    return await this.productsService.importFromPdf(extractedItems, userId);
  }
}