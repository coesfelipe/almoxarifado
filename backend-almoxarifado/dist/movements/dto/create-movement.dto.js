var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/movement.entity.js';
export class CreateMovementDto {
    type;
    quantity;
    unitPrice;
    requester;
    description;
    userId;
    productId;
}
__decorate([
    IsEnum(MovementType, { message: 'O tipo da movimentação deve ser ENTRY ou EXIT' }),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "type", void 0);
__decorate([
    IsInt({ message: 'A quantidade deve ser um número inteiro' }),
    IsPositive({ message: 'A quantidade movimentada deve ser maior que zero' }),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "quantity", void 0);
__decorate([
    IsNumber({}, { message: 'O valor unitário deve ser um número válido' }),
    IsPositive({ message: 'O valor unitário deve ser maior que zero' }),
    IsOptional(),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "unitPrice", void 0);
__decorate([
    IsString({ message: 'O campo solicitante deve ser uma string' }),
    IsOptional(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "requester", void 0);
__decorate([
    IsString({ message: 'O campo descrição deve ser uma string' }),
    IsOptional(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "description", void 0);
__decorate([
    IsInt({ message: 'O ID do usuário deve ser um número inteiro' }),
    IsOptional(),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "userId", void 0);
__decorate([
    IsInt({ message: 'O ID do produto deve ser um número inteiro' }),
    IsNotEmpty({ message: 'O ID do produto é obrigatório' }),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "productId", void 0);
//# sourceMappingURL=create-movement.dto.js.map