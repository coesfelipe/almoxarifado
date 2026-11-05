import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './entities/sector.entity.js';
import { CreateSectorDto } from './dto/create-sector.dto.js';
import { UpdateSectorDto } from './dto/update-sector.dto.js';

@Injectable()
export class SectorsService implements OnModuleInit {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultSectors();
  }

  /**
   * Inicializa o banco de dados com os setores solicitados caso a tabela esteja vazia.
   */
  private async seedDefaultSectors() {
    const count = await this.sectorRepository.count();
    if (count === 0) {
      const defaultSectors = [
        'Elétrica',
        'Manutenção',
        'Gerência de Pessoas',
        'Audiovisual',
        'SEADI',
        'CEP',
        'Comercial',
        'Direção',
        'Extensão',
        'Financeiro',
        'NPJ',
        'Marketing',
        'Recepção',
        'SGC',
        'Ouvidoria',
        'TI - Suporte',
        'TI - Sistema',
        'Matrícula',
        'Administrativo',
        'Setor Acadêmico',
        'Gerência Administrativa',
        'Núcleo de Odontologia',
        'Cozinha',
        'Laboratório de Engenharia',
        'Núcleo de Computação',
        'Pós-graduação',
        'Eventos',
        'Fisioterapia',
        'Estética',
        'Saúde',
        'Módulo 1',
        'Módulo 2',
      ];

      for (const name of defaultSectors) {
        await this.sectorRepository.save(
          this.sectorRepository.create({ name }),
        );
      }
    }
  }

  async findAll(): Promise<Sector[]> {
    return await this.sectorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new NotFoundException(`Setor com ID ${id} não encontrado.`);
    }
    return sector;
  }

  async create(dto: CreateSectorDto): Promise<Sector> {
    const name = dto.name.trim();
    const existing = await this.sectorRepository.findOne({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException(`Já existe um setor cadastrado com o nome "${name}".`);
    }

    const sector = this.sectorRepository.create({
      name,
      description: dto.description?.trim(),
    });
    return await this.sectorRepository.save(sector);
  }

  async update(id: number, dto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('O nome do setor não pode ser vazio.');
      }
      const existing = await this.sectorRepository.findOne({
        where: { name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Já existe outro setor com o nome "${name}".`);
      }
      sector.name = name;
    }

    if (dto.description !== undefined) {
      sector.description = dto.description?.trim();
    }

    return await this.sectorRepository.save(sector);
  }

  async remove(id: number): Promise<{ message: string }> {
    const sector = await this.findOne(id);
    await this.sectorRepository.remove(sector);
    return { message: `Setor "${sector.name}" excluído com sucesso.` };
  }
}
