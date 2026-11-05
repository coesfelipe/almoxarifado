import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { XmlParserService } from './xml-parser.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            searchProducts: vi.fn(),
            importFromPdf: vi.fn(),
          },
        },
        {
          provide: XmlParserService,
          useValue: {
            extractProductsFromXml: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});


