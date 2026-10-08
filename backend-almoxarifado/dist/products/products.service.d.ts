import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ExtractedNfeItem } from './xml-parser.service.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
export declare class ProductsService {
    private readonly productRepository;
    private readonly userRepository;
    private readonly dataSource;
    constructor(productRepository: Repository<Product>, userRepository: Repository<User>, dataSource: DataSource);
    searchProducts(query: string): Promise<Product[]>;
    create(createProductDto: CreateProductDto, userId?: number): Promise<Product>;
    findAll(): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    remove(id: number): Promise<void>;
    importFromPdf(items: ExtractedNfeItem[], userId: number): Promise<{
        message: string;
        totalProductsProcessed: number;
        details: {
            productName: string;
            addedQuantity: number;
            newStockTotal: number;
            unitPrice: number;
        }[];
    }>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<Product>;
}
