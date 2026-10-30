import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MovementsService } from './movements.service.js';
import { Movement } from './entities/movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';

describe('MovementsService', () => {
  let service: MovementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        {
          provide: getRepositoryToken(Movement),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            save: vi.fn(),
            createQueryBuilder: vi.fn(() => ({
              leftJoinAndSelect: vi.fn().mockReturnThis(),
              andWhere: vi.fn().mockReturnThis(),
              orderBy: vi.fn().mockReturnThis(),
              getMany: vi.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MovementsService>(MovementsService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve consolidar corretamente o relatório calculando valor gasto total, valor de entradas e saldo', async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          type: 'ENTRY',
          quantity: 10,
          unitPrice: 50.0,
          totalPrice: 500.0,
          product: { name: 'Resma de Papel A4', price: 50.0 },
        },
        {
          id: 2,
          type: 'EXIT',
          quantity: 2,
          unitPrice: 50.0,
          totalPrice: 100.0,
          product: { name: 'Resma de Papel A4', price: 50.0 },
        },
        {
          id: 3,
          type: 'EXIT',
          quantity: 1,
          unitPrice: 150.0,
          totalPrice: 150.0,
          product: { name: 'Toner Preto', price: 150.0 },
        },
      ]),
    };

    const movRepo = (service as any).movementRepository;
    movRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);

    const report = await service.getReport({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });

    // Verificações dos indicadores contábeis:
    // Entradas: 10 * 50 = R$ 500.00
    // Saídas (Valor Gasto Total): 100 + 150 = R$ 250.00
    // Saldo: 500 - 250 = R$ 250.00
    expect(report.summary.totalEntriesValue).toBe(500.0);
    expect(report.summary.totalSpent).toBe(250.0);
    expect(report.summary.totalExitsValue).toBe(250.0);
    expect(report.summary.balanceValue).toBe(250.0);
    expect(report.summary.totalItemsQuantity).toBe(13); // 10 + 2 + 1
    expect(report.summary.totalEntriesQuantity).toBe(10);
    expect(report.summary.totalExitsQuantity).toBe(3);
    expect(report.summary.movementsCount).toBe(3);

    // Verificação de que as movimentações preservam os valores unitários e totais
    expect(report.movements[0].unitPrice).toBe(50.0);
    expect(report.movements[0].totalPrice).toBe(500.0);
    expect(report.movements[1].unitPrice).toBe(50.0);
    expect(report.movements[1].totalPrice).toBe(100.0);
  });
});


