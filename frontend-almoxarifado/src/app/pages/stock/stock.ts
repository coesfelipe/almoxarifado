// frontend/src/app/pages/stock/stock.ts
import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { StockService, Product } from '../../services/stock';
import { CategoryService, Category } from '../../services/category';
import { AuthService } from '../../services/auth';

type Campo = 'name' | 'category' | 'currentStock' | 'measurement' | 'price';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './stock.html',
  styleUrls: ['./stock.css'],
})
export class Stock implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private categoryService = inject(CategoryService);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  // Regra de Role (Administrador)
  isAdmin = computed(() => this.authService.isAdmin);

  // Listagem
  produtos = signal<Product[]>([]);
  categorias = signal<Category[]>([]);
  carregando = signal<boolean>(true);
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);

  // Filtros
  busca = signal<string>('');
  filtro = signal<string>('todos');

  // Paginação
  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);

  // Modal de cadastro / edição
  modalAberto = signal<boolean>(false);
  produtoEmEdicao = signal<Product | null>(null);
  salvando = signal<boolean>(false);
  erroForm = signal<string | null>(null);

  isEditMode = computed(() => this.produtoEmEdicao() !== null);
  titulo = computed(() =>
    this.isEditMode() ? `Editar Produto #${this.produtoEmEdicao()!.id}` : 'Cadastrar Novo Produto'
  );
  rotuloEstoque = computed(() => (this.isEditMode() ? 'Estoque Atual *' : 'Estoque Inicial *'));
  rotuloBotao = computed(() => (this.isEditMode() ? 'Salvar Alterações' : 'Salvar Produto'));

  filtros = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'ok', texto: 'Em Estoque' },
    { valor: 'baixo', texto: 'Estoque Baixo' },
    { valor: 'zerado', texto: 'Zerados' },
  ];

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
    ]},
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    measurement: ['UN', [Validators.required]],
    price: [0, [Validators.min(0)]],
  });

  // 1. Busca textual + filtro por situação
  filtrados = computed(() => {
    const termo = this.busca().toLowerCase().trim();
    const f = this.filtro();

    return this.produtos().filter((p) => {
      const bateBusca =
        !termo ||
        p.name.toLowerCase().includes(termo) ||
        p.category.toLowerCase().includes(termo);

      const bateFiltro = f === 'todos' || this.status(p) === f;
      return bateBusca && bateFiltro;
    });
  });

  // 2. Itens da página atual
  paginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.filtrados().slice(inicio, inicio + this.itensPorPagina());
  });

  // 3. Total de páginas
  totalPaginas = computed(() => {
    const total = Math.ceil(this.filtrados().length / this.itensPorPagina());
    return total > 0 ? total : 1;
  });

  // 4. Números das páginas
  paginasArray = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  // KPIs
  totalProdutos = computed(() => this.produtos().length);
  totalBaixos = computed(() => this.produtos().filter((p) => this.status(p) === 'baixo').length);
  totalZerados = computed(() => this.produtos().filter((p) => p.currentStock === 0).length);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.carregarCategorias();
      this.carregarProdutos();
    }
  }

  // --- Listagem ---

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.stockService.getProducts().subscribe({
      next: (dados) => {
        this.produtos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.erro.set('Não foi possível carregar os produtos do servidor.');
        this.carregando.set(false);
      },
    });
  }

  private carregarCategorias(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.categorias.set(cats),
      error: (err) => console.error('Erro ao carregar categorias:', err),
    });
  }

  status(p: Product): 'ok' | 'baixo' | 'zerado' {
    if (p.currentStock === 0) return 'zerado';
    if (p.currentStock <= 5) return 'baixo';
    return 'ok';
  }

  aoBuscar(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
    this.paginaAtual.set(1);
  }

  selecionarFiltro(valor: string): void {
    this.filtro.set(valor);
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
    }
  }

  alterarItensPorPagina(event: Event): void {
    this.itensPorPagina.set(Number((event.target as HTMLSelectElement).value));
    this.paginaAtual.set(1);
  }

  // --- Modal de cadastro / edição ---

  abrirModalCriar(): void {
    this.produtoEmEdicao.set(null);
    this.form.reset({
      name: '',
      category: '',
      currentStock: 0,
      measurement: 'UN',
      price: 0,
    });
    this.erroForm.set(null);
    this.modalAberto.set(true);
  }

  abrirModalEditar(p: Product): void {
    this.produtoEmEdicao.set(p);
    this.form.reset({
      name: p.name,
      category: p.category,
      currentStock: p.currentStock ?? 0,
      measurement: p.measurement || 'UN',
      price: p.price ? Number(p.price) : 0,
    });
    this.erroForm.set(null);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (this.salvando()) return;
    this.modalAberto.set(false);
    this.produtoEmEdicao.set(null);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erroForm.set('Por favor, preencha corretamente todos os campos obrigatórios assinalados.');
      return;
    }

    this.salvando.set(true);
    this.erroForm.set(null);
    this.sucesso.set(null);

    const dados = this.form.getRawValue();
    const produto = this.produtoEmEdicao();

    const requisicao = produto
      ? this.stockService.updateProduct(produto.id, dados)
      : this.stockService.createProduct(dados);

    requisicao.subscribe({
      next: () => {
        this.sucesso.set(
          produto
            ? 'Produto atualizado com sucesso!'
            : 'Produto cadastrado com sucesso!'
        );
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.produtoEmEdicao.set(null);
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('Erro ao salvar produto:', err);
        this.erroForm.set(
          err?.error?.message ||
            (produto
              ? 'Não foi possível salvar as alterações. Verifique os dados informados e a conexão.'
              : 'Não foi possível cadastrar o produto. Verifique se o nome já não está em uso.')
        );
        this.salvando.set(false);
      },
    });
  }

  campoInvalido(campo: Campo): boolean {
    const control = this.form.get(campo);
    return !!(control && control.touched && control.invalid);
  }

  // --- Exclusão ---

  excluirProduto(id: number, name: string): void {
    if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      this.stockService.deleteProduct(id).subscribe({
        next: () => {
          this.produtos.update((lista) => lista.filter((p) => p.id !== id));
          this.sucesso.set(`Produto "${name}" excluído com sucesso!`);
        },
        error: (err) => {
          console.error('Erro ao excluir produto:', err);
          this.erro.set('Erro ao excluir produto.');
        },
      });
    }
  }
}