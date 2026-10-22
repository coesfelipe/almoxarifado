import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { StockService, Product } from '../../services/stock';
import { CategoryService, Category } from '../../services/category';

/**
 * Componente unificado para Cadastro e Edição de Produtos do Almoxarifado.
 * Segue rigorosamente o padrão visual do sistema (layout, cards, botões e alertas).
 * Se a rota possuir o parâmetro :id, opera em modo de Edição; caso contrário, opera em Cadastro.
 */
@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar, Footer],
  templateUrl: './create-product.html',
  styleUrls: ['./create-product.css'],
})
export class CreateProduct implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productId = signal<number | null>(null);
  isEditMode = computed(() => this.productId() !== null);

  categorias = signal<Category[]>([]);
  carregando = signal<boolean>(false);
  salvando = signal<boolean>(false);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);

  // Lista padrão de unidades de medida organizadas
  unidadesMedida = [
    { grupo: 'Contáveis & Embalagens', options: [
      { valor: 'UN', rotulo: 'Unidade (UN)' },
      { valor: 'CX', rotulo: 'Caixa (CX)' },
      { valor: 'PCT', rotulo: 'Pacote (PCT)' },
      { valor: 'FD', rotulo: 'Fardo (FD)' },
      { valor: 'KIT', rotulo: 'Kit (KIT)' },
      { valor: 'PAR', rotulo: 'Par (PAR)' },
      { valor: 'PC', rotulo: 'Peça (PC)' },
      { valor: 'RO', rotulo: 'Rolo (RO)' },
      { valor: 'FL', rotulo: 'Folha (FL)' },
    ]},
    { grupo: 'Massa & Peso', options: [
      { valor: 'KG', rotulo: 'Quilograma (KG)' },
      { valor: 'G', rotulo: 'Grama (G)' },
      { valor: 'SAC', rotulo: 'Saco (SAC)' },
    ]},
    { grupo: 'Volume & Líquidos', options: [
      { valor: 'L', rotulo: 'Litro (L)' },
      { valor: 'GAL', rotulo: 'Galão (GAL)' },
      { valor: 'BOM', rotulo: 'Bombona (BOM)' },
      { valor: 'FR', rotulo: 'Frasco (FR)' },
      { valor: 'LAT', rotulo: 'Lata (LAT)' },
    ]},
    { grupo: 'Comprimento & Metragem', options: [
      { valor: 'M', rotulo: 'Metro (M)' },
      { valor: 'BAR', rotulo: 'Barra (BAR)' },
    ]}
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    measurement: ['UN', [Validators.required]],
    price: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.carregarCategorias();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id) && id > 0) {
        this.productId.set(id);
        this.carregarProduto(id);
      } else {
        this.erro.set('Identificador de produto inválido.');
      }
    }
  }

  private carregarCategorias(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        // Se estiver em modo de criação e tiver categorias mas nenhuma selecionada, deixa vazio para forçar escolha
      },
      error: (err) => console.error('Erro ao carregar categorias dinâmicas:', err),
    });
  }

  private carregarProduto(id: number): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.stockService.getProductById(id).subscribe({
      next: (produto: Product) => {
        this.form.patchValue({
          name: produto.name,
          category: produto.category,
          currentStock: produto.currentStock ?? 0,
          measurement: produto.measurement || 'UN',
          price: produto.price ? Number(produto.price) : 0,
        });
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do produto:', err);
        this.erro.set('Não foi possível carregar as informações deste produto. Verifique se ele ainda existe.');
        this.carregando.set(false);
      },
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Por favor, preencha corretamente todos os campos obrigatórios assinalados.');
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const dados = this.form.getRawValue();

    if (this.isEditMode() && this.productId()) {
      // Atualização de produto existente
      this.stockService.updateProduct(this.productId()!, dados).subscribe({
        next: () => {
          this.salvando.set(false);
          this.sucesso.set('Produto atualizado com sucesso! Redirecionando...');
          setTimeout(() => {
            this.router.navigate(['/stock']);
          }, 800);
        },
        error: (err) => {
          console.error('Erro ao atualizar produto:', err);
          this.erro.set('Não foi possível salvar as alterações. Verifique os dados informados e a conexão.');
          this.salvando.set(false);
        },
      });
    } else {
      // Criação de novo produto
      this.stockService.createProduct(dados).subscribe({
        next: () => {
          this.salvando.set(false);
          this.sucesso.set('Produto cadastrado com sucesso! Redirecionando...');
          setTimeout(() => {
            this.router.navigate(['/stock']);
          }, 800);
        },
        error: (err) => {
          console.error('Erro ao cadastrar produto:', err);
          this.erro.set('Não foi possível cadastrar o produto. Verifique se o nome já não está em uso.');
          this.salvando.set(false);
        },
      });
    }
  }

  campoInvalido(campo: 'name' | 'category' | 'currentStock' | 'measurement' | 'price'): boolean {
    const control = this.form.get(campo);
    return !!(control && control.touched && control.invalid);
  }
}