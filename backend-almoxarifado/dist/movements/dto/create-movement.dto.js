var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/movement.entity.js';
export class CreateMovementDto {
    type;
    quantity;
    requester;
    description;
    userId;
    productId;
}
__decorate([
    IsEnum(MovementType),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "type", void 0);
__decorate([
    IsInt(),
    IsPositive(),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "quantity", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "requester", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "description", void 0);
__decorate([
    IsInt(),
    IsNotEmpty(),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "userId", void 0);
__decorate([
    IsInt(),
    IsNotEmpty(),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "productId", void 0);
//# sourceMappingURL=create-movement.dto.js.map