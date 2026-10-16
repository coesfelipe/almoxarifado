import { Test, TestingModule } from '@nestjs/testing';
import { MovementsController } from './movements.controller.js';
import { MovementsService } from './movements.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('MovementsController', () => {
  let controller: MovementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovementsController],
      providers: [
        {
          provide: MovementsService,
          useValue: {
            findAll: vi.fn(),
            search: vi.fn(),
            getReport: vi.fn(),
            create: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MovementsController>(MovementsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});


