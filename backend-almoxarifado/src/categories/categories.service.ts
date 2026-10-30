import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories() {
    const count = await this.categoryRepository.count();
    if (count === 0) {
      const defaultCategories = [
        'Construção',
        'Descartável e Limpeza',
        'Elétrica',
        'Escritório',
        'Hidráulica',
        'Saúde',
        'Informática',
        'Outros',
      ];
      for (const name of defaultCategories) {
        await this.categoryRepository.save(
          this.categoryRepository.create({ name }),
        );
      }
    }
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada.`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const name = dto.name.trim();
    const existing = await this.categoryRepository.findOne({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException(`Já existe uma categoria cadastrada com o nome "${name}".`);
    }

    const category = this.categoryRepository.create({
      name,
      description: dto.description?.trim(),
    });
    return await this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('O nome da categoria não pode ser vazio.');
      }
      const existing = await this.categoryRepository.findOne({
        where: { name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Já existe outra categoria com o nome "${name}".`);
      }
      category.name = name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim();
    }

    return await this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    return { message: `Categoria "${category.name}" excluída com sucesso.` };
  }
}
