import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SectorsService } from './sectors.service.js';
import { Sector } from './entities/sector.entity.js';

describe('SectorsService', () => {
  let service: SectorsService;
  const mockSectorRepo = {
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
        SectorsService,
        {
          provide: getRepositoryToken(Sector),
          useValue: mockSectorRepo,
        },
      ],
    }).compile();

    service = module.get<SectorsService>(SectorsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve retornar todos os setores cadastrados', async () => {
    mockSectorRepo.find.mockResolvedValueOnce([{ id: 1, name: 'Audiovisual' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Audiovisual');
  });
});
