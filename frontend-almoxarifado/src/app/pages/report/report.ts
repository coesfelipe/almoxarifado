import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import {
  MovementService,
  Movement,
  MovementReportSummary,
  MovementType,
} from '../../services/movement';

import { Footer } from '../../components/footer/footer';

/**
 * Componente da Página de Relatório de Movimentações de Estoque.
 * Permite aos gestores filtrar movimentações por período (data início e data fim),
 * tipo de operação e produto, exibindo o valor gasto total, valor unitário dos itens,
 * total de entradas e saídas, indicadores consolidados e exportação em CSV e impressão/PDF.
 */
@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, Footer, Navbar],
  templateUrl: './report.html',
  styleUrls: ['./report.css'],
})
export class Report implements OnInit {
  private movementService = inject(MovementService);
  private platformId = inject(PLATFORM_ID);

  // --- Estado Reativo dos Filtros de Pesquisa ---
  dataInicio = signal<string>('');
  dataFim = signal<string>('');
  filtroTipo = signal<string>('');
  buscaProduto = signal<string>('');

  // --- Estado Reativo dos Dados e Carregamento ---
  carregando = signal<boolean>(true);
  erro = signal<string | null>(null);
  movimentacoes = signal<Movement[]>([]);
  resumo = signal<MovementReportSummary | null>(null);

  // --- Controles de Paginação ---
  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);

  // --- Propriedades Computadas (Computed Signals) ---

  /**
   * Lista de movimentações fatiada para a página atual.
   */
  movimentacoesPaginadas = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    const fim = inicio + this.itensPorPagina();
    return this.movimentacoes().slice(inicio, fim);
  });

  /**
   * Total de páginas calculado com base no número de registros retornados.
   */
  totalPaginas = computed(() => {
    const total = Math.ceil(this.movimentacoes().length / this.itensPorPagina());
    return total > 0 ? total : 1;
  });

  /**
   * Array numérico para renderização dos botões de paginação.
   */
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  /**
   * Inicializa o componente definindo o período padrão como os últimos 30 dias
   * e disparando a primeira consulta ao backend.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.definirEsteMes();
      this.carregarRelatorio();
    }
  }

  /**
   * Consulta o backend para obter o relatório consolidado com os filtros atualmente aplicados.
   */
  carregarRelatorio(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.paginaAtual.set(1);

    this.movementService
      .getReport({
        startDate: this.dataInicio() || undefined,
        endDate: this.dataFim() || undefined,
        type: this.filtroTipo() || undefined,
        productName: this.buscaProduto() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.movimentacoes.set(response.movements || []);
          this.resumo.set(response.summary || null);
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao gerar relatório de movimentações:', err);
          this.erro.set(
            err.error?.message ||
              'Não foi possível carregar os dados do relatório. Verifique a conexão com o servidor.',
          );
          this.carregando.set(false);
        },
      });
  }

  // --- Atalhos Rápidos de Seleção de Datas ---

  /**
   * Define o filtro de datas para o dia de hoje.
   */
  definirHoje(): void {
    const hoje = this.formatarDataIso(new Date());
    this.dataInicio.set(hoje);
    this.dataFim.set(hoje);
    this.carregarRelatorio();
  }

  /**
   * Define o filtro de datas para os últimos 7 dias.
   */
  definirUltimos7Dias(): void {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - 7);

    this.dataInicio.set(this.formatarDataIso(inicio));
    this.dataFim.set(this.formatarDataIso(fim));
    this.carregarRelatorio();
  }

  /**
   * Define o filtro de datas para os últimos 30 dias.
   */
  definirUltimos30Dias(): void {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - 30);

    this.dataInicio.set(this.formatarDataIso(inicio));
    this.dataFim.set(this.formatarDataIso(fim));
    this.carregarRelatorio();
  }

  /**
   * Define o filtro de datas para o mês atual (do primeiro dia até hoje).
   */
  definirEsteMes(): void {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    this.dataInicio.set(this.formatarDataIso(primeiroDia));
    this.dataFim.set(this.formatarDataIso(hoje));
  }

  /**
   * Limpa todos os filtros e restabelece a listagem padrão do mês atual.
   */
  limparFiltros(): void {
    this.filtroTipo.set('');
    this.buscaProduto.set('');
    this.definirEsteMes();
    this.carregarRelatorio();
  }

  // --- Controles de Navegação da Paginação ---

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
    }
  }

  alterarItensPorPagina(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itensPorPagina.set(Number(select.value));
    this.paginaAtual.set(1);
  }

  // --- Funções Auxiliares de Formatação ---

  /**
   * Converte um objeto Date para string no formato YYYY-MM-DD.
   */
  private formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Formata um valor numérico em moeda Real Brasileiro (R$ 0,00).
   */
  formatarMoeda(valor: number | undefined | null): string {
    const num = Number(valor || 0);
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }

  /**
   * Formata data e hora para exibição em formato brasileiro (DD/MM/AAAA às HH:mm).
   */
  formatarDataHora(dataString: string | undefined): string {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataString;
    }
  }

  /**
   * Retorna o valor unitário seguro de uma movimentação (ou do produto vinculado).
   */
  obterValorUnitario(mov: Movement): number {
    if (mov.unitPrice !== undefined && mov.unitPrice !== null) {
      return Number(mov.unitPrice);
    }
    return mov.product?.price ? Number(mov.product.price) : 0;
  }

  /**
   * Retorna o valor total seguro de uma movimentação.
   */
  obterValorTotal(mov: Movement): number {
    if (mov.totalPrice !== undefined && mov.totalPrice !== null) {
      return Number(mov.totalPrice);
    }
    return Number((mov.quantity * this.obterValorUnitario(mov)).toFixed(2));
  }

  // --- Recursos de Exportação e Auditoria ---

  // 1. Adicione a variável de estado reativa 'imprimindo'
  imprimindo = signal<boolean>(false);

  // 2. Crie uma propriedade computada para determinar quais movimentações exibir no HTML
  movimentacoesExibidas = computed(() => {
    // Se estiver a imprimir, devolve TODAS as movimentações de uma só vez.
    // Caso contrário, devolve apenas as movimentações da página atual.
    return this.imprimindo() ? this.movimentacoes() : this.movimentacoesPaginadas();
  });

  /**
   * Prepara o DOM com a lista completa, aciona a impressão e restaura a paginação.
   */
  imprimirRelatorio(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Ativa o modo de impressão para renderizar TODOS os registros
      this.imprimindo.set(true);

      // Aguarda o Angular atualizar o DOM com todas as linhas
      setTimeout(() => {
        window.print();
        // Restaura a visão paginada após a janela de impressão ser fechada
        this.imprimindo.set(false);
      }, 300);
    }
  }

  /**
   * Exporta os dados do relatório atual para uma planilha CSV (compatível com Excel / Sheets).
   * Inclui BOM UTF-8 (\uFEFF) para garantir que acentos e símbolos de R$ abram corretamente no Excel.
   */
  exportarCsv(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const lista = this.movimentacoes();
    if (lista.length === 0) {
      alert('Não há dados para exportar no período selecionado.');
      return;
    }

    const colunas = [
      'Data/Hora',
      'Tipo',
      'Produto',
      'Categoria',
      'Unidade',
      'Quantidade',
      'Valor Unitário (R$)',
      'Valor Total (R$)',
      'Operador',
      'Solicitante',
      'Observação/Descrição',
    ];

    const linhas = lista.map((m) => {
      const unit = this.obterValorUnitario(m).toFixed(2).replace('.', ',');
      const total = this.obterValorTotal(m).toFixed(2).replace('.', ',');
      const tipoStr = m.type === 'ENTRY' ? 'Entrada' : 'Saída';
      const dataStr = this.formatarDataHora(m.createdAt);
      const prodNome = `"${(m.product?.name || '').replace(/"/g, '""')}"`;
      const prodCat = `"${(m.product?.category || 'Geral').replace(/"/g, '""')}"`;
      const prodUn = m.product?.measurement || 'UN';
      const operador = `"${(m.user?.name || 'Sistema').replace(/"/g, '""')}"`;
      const solicitante = `"${(m.requester || '').replace(/"/g, '""')}"`;
      const desc = `"${(m.description || '').replace(/"/g, '""')}"`;

      return [
        `"${dataStr}"`,
        tipoStr,
        prodNome,
        prodCat,
        prodUn,
        m.quantity,
        `"${unit}"`,
        `"${total}"`,
        operador,
        solicitante,
        desc,
      ].join(';');
    });

    const csvConteudo = '\uFEFF' + [colunas.join(';'), ...linhas].join('\r\n');
    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const inicio = this.dataInicio() || 'inicio';
    const fim = this.dataFim() || 'fim';
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-movimentacoes_${inicio}_a_${fim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
