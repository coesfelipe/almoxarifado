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

  /**
   * Retorna o mês e ano por extenso em que a movimentação foi realizada (ex: "Outubro/2026").
   */
  obterMesAno(dataString: string | undefined): string {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      const mes = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return mes.charAt(0).toUpperCase() + mes.slice(1);
    } catch {
      return '-';
    }
  }

  /**
   * Identifica o setor de destino da movimentação (prioriza sector, fallback para requester em saídas).
   */
  obterSetorDestinado(mov: Movement): string {
    if (mov.type === 'ENTRY') {
      return 'Almoxarifado (Entrada)';
    }
    return mov.sector || mov.requester || 'Não informado';
  }

  /**
   * Retorna o texto formatado do mês/período de referência para o cabeçalho do relatório e impressão.
   */
  mesReferenciaTexto = computed(() => {
    const inicioStr = this.dataInicio();
    const fimStr = this.dataFim();

    if (inicioStr && fimStr) {
      const inicio = new Date(inicioStr + 'T00:00:00');
      const fim = new Date(fimStr + 'T23:59:59');
      if (inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear()) {
        const mesExtenso = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1);
      }
      return `${inicio.toLocaleDateString('pt-BR')} até ${fim.toLocaleDateString('pt-BR')}`;
    }

    const agora = new Date();
    const mesAtual = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);
  });

  /**
   * Data e hora atual formatada para exibição na emissão da impressão.
   */
  get dataHojeFormatada(): string {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // --- Recursos de Exportação e Auditoria ---

  imprimindo = signal<boolean>(false);

  movimentacoesExibidas = computed(() => {
    // Se estiver imprimindo, devolve TODAS as movimentações de uma só vez para sair no PDF/impressão
    return this.imprimindo() ? this.movimentacoes() : this.movimentacoesPaginadas();
  });

  /**
   * Prepara o DOM com a lista completa, aciona a impressão e restaura a paginação.
   */
  imprimirRelatorio(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.imprimindo.set(true);

      setTimeout(() => {
        window.print();
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
      'Mês de Realização',
      'Data/Hora',
      'Tipo de Operação',
      'Setor Destinado',
      'Item (Produto)',
      'Categoria',
      'Tipo de Medida',
      'Quantidade',
      'Valor Unitário (R$)',
      'Valor Total (R$)',
      'Operador',
      'Solicitante',
      'Observação/Descrição',
    ];

    const linhas = lista.map((m) => {
      const mesStr = `"${this.obterMesAno(m.createdAt)}"`;
      const unit = this.obterValorUnitario(m).toFixed(2).replace('.', ',');
      const total = this.obterValorTotal(m).toFixed(2).replace('.', ',');
      const tipoStr = m.type === 'ENTRY' ? 'Entrada' : 'Saída';
      const dataStr = this.formatarDataHora(m.createdAt);
      const setorDest = `"${this.obterSetorDestinado(m).replace(/"/g, '""')}"`;
      const prodNome = `"${(m.product?.name || '').replace(/"/g, '""')}"`;
      const prodCat = `"${(m.product?.category || 'Geral').replace(/"/g, '""')}"`;
      const prodUn = m.product?.measurement || 'UN';
      const operador = `"${(m.user?.name || 'Sistema').replace(/"/g, '""')}"`;
      const solicitante = `"${(m.requester || '').replace(/"/g, '""')}"`;
      const desc = `"${(m.description || '').replace(/"/g, '""')}"`;

      return [
        mesStr,
        `"${dataStr}"`,
        tipoStr,
        setorDest,
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
