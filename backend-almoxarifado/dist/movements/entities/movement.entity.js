var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
export var MovementType;
(function (MovementType) {
    MovementType["ENTRY"] = "ENTRY";
    MovementType["EXIT"] = "EXIT";
})(MovementType || (MovementType = {}));
let Movement = class Movement {
    id;
    type;
    quantity;
    requester;
    description;
    createdAt;
    user;
    product;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Movement.prototype, "id", void 0);
__decorate([
    Column({
        type: 'text',
        enum: MovementType,
        default: MovementType.ENTRY,
    }),
    __metadata("design:type", String)
], Movement.prototype, "type", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], Movement.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Movement.prototype, "requester", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Movement.prototype, "description", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Movement.prototype, "createdAt", void 0);
__decorate([
    ManyToOne('User', (user) => user.movements, { onDelete: 'CASCADE' }),
    __metadata("design:type", Function)
], Movement.prototype, "user", void 0);
__decorate([
    ManyToOne('Product', (product) => product.movements, { onDelete: 'CASCADE' }),
    __metadata("design:type", Function)
], Movement.prototype, "product", void 0);
Movement = __decorate([
    Entity('movements')
], Movement);
export { Movement };
//# sourceMappingURL=movement.entity.js.map