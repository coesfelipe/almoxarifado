var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsNotEmpty, IsNumber, IsString, IsPositive, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateProductDto {
    name;
    price;
    category;
    measurement;
    currentStock;
}
__decorate([
    IsString({ message: 'O nome do produto deve ser texto' }),
    IsNotEmpty({ message: 'O nome do produto é obrigatório' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    Type(() => Number),
    IsNumber({}, { message: 'O preço deve ser um valor numérico válido' }),
    IsPositive({ message: 'O preço unitário deve ser maior que zero' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    IsString({ message: 'A categoria deve ser texto' }),
    IsNotEmpty({ message: 'A categoria do produto é obrigatória' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    IsString({ message: 'A unidade de medida deve ser texto' }),
    IsNotEmpty({ message: 'A unidade de medida é obrigatória' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "measurement", void 0);
__decorate([
    Type(() => Number),
    IsInt({ message: 'O estoque inicial deve ser um número inteiro' }),
    Min(0, { message: 'O estoque inicial não pode ser negativo' }),
    IsOptional(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "currentStock", void 0);
//# sourceMappingURL=create-product.dto.js.map