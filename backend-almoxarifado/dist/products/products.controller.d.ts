import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { XmlParserService } from './xml-parser.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';
export declare class ProductsController {
    private readonly productsService;
    private readonly xmlParserService;
    constructor(productsService: ProductsService, xmlParserService: XmlParserService);
    search(query?: string): Promise<Product[]>;
    create(req: any, createProductDto: CreateProductDto): Promise<Product>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<Product>;
    findAll(): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    remove(id: number): Promise<void>;
    importXml(req: any, file: Express.Multer.File, bodyUserId?: any): Promise<{
        message: string;
        totalProductsProcessed: number;
        details: {
            productName: string;
            addedQuantity: number;
            newStockTotal: number;
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
}
