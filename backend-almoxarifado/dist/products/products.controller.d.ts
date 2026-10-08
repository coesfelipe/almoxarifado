import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { XmlParserService } from './xml-parser.service.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
export declare class ProductsController {
    private readonly productsService;
    private readonly xmlParserService;
    constructor(productsService: ProductsService, xmlParserService: XmlParserService);
    search(query: string): Promise<import("./entities/product.entity.js").Product[]>;
    create(req: any, createProductDto: CreateProductDto): Promise<import("./entities/product.entity.js").Product>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<import("./entities/product.entity.js").Product>;
    findAll(): Promise<import("./entities/product.entity.js").Product[]>;
    findOne(id: number): Promise<import("./entities/product.entity.js").Product>;
    remove(id: number): Promise<void>;
    importXml(file: Express.Multer.File, userId: number): Promise<{
        message: string;
        totalProductsProcessed: number;
        details: {
            productName: string;
            addedQuantity: number;
            newStockTotal: number;
            unitPrice: number;
        }[];
    }>;
}
