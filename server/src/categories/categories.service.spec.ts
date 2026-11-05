import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const mockCategoryRepo = {
    count: vi.fn().mockResolvedValue(1),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    create: vi.fn((dto) => dto),
    save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    remove: vi.fn((entity) => Promise.resolve(entity)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve retornar todas as categorias ordenadas', async () => {
    mockCategoryRepo.find.mockResolvedValueOnce([{ id: 1, name: 'Elétrica' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Elétrica');
  });
});
