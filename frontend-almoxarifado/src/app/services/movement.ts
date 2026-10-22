import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './stock';
import { environment } from '../../environments/environment';
/**
 * Tipos de movimentação de estoque:
 * - 'ENTRY': Entrada de mercadorias no almoxarifado.
 * - 'EXIT': Saída de mercadorias do almoxarifado.
 */
export type MovementType = 'ENTRY' | 'EXIT';

/**
 * Interface com os dados do usuário/operador que realizou a movimentação.
 */
export interface MovementUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

/**
 * Interface que representa uma movimentação de estoque no sistema.
 */
export interface Movement {
  /** Identificador único da movimentação */
  id: number;
  /** Tipo da operação (Entrada ou Saída) */
  type: MovementType;
  /** Quantidade física de itens movimentados */
  quantity: number;
  /** Valor unitário do item no momento da movimentação em R$ */
  unitPrice?: number;
  /** Valor financeiro total da transação (quantity * unitPrice) em R$ */
  totalPrice?: number;
  /** Setor institucional de destino */
  sector?: string;
  /** Pessoa, setor ou departamento solicitante */
  requester?: string;
  /** Observações, justificativas ou referência de documento fiscal */
  description?: string;
  /** ID do usuário responsável pelo registro */
  userId: number;
  /** Usuário/Operador responsável que registrou a movimentação */
  user?: MovementUser;
  /** ID do produto movimentado */
  productId: number;
  /** Objeto com os dados cadastrais do produto associado */
  product?: Product;
  /** Data e hora do registro da movimentação (ISO string) */
  createdAt: string;
}

/**
 * Payload para criação de nova movimentação no estoque.
 */
export interface CreateMovementPayload {
  type: MovementType;
  quantity: number;
  unitPrice?: number;
  sector?: string;
  requester?: string;
  description?: string;
  userId: number;
  productId: number;
}

/**
 * Parâmetros de filtro para busca simples de movimentações.
 */
export interface MovementSearchFilter {
  productName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  sector?: string;
  requester?: string;
}

/**
 * Indicadores consolidados (KPIs) retornados pelo relatório de movimentações.
 */
export interface MovementReportSummary {
  /** Valor total gasto em saídas (consumo do almoxarifado) no período selecionado em R$ */
  totalSpent: number;
  /** Valor total registrado em entradas (compras/abastecimento) no período selecionado em R$ */
  totalEntriesValue: number;
  /** Valor total registrado em saídas no período selecionado em R$ */
  totalExitsValue: number;
  /** Saldo financeiro líquido do período (Entradas - Saídas) em R$ */
  balanceValue: number;
  /** Quantidade total física de itens movimentados no período */
  totalItemsQuantity: number;
  /** Quantidade total de itens de entrada */
  totalEntriesQuantity: number;
  /** Quantidade total de itens de saída */
  totalExitsQuantity: number;
  /** Número total de movimentações registradas no período */
  movementsCount: number;
}

/**
 * Resposta completa do endpoint de relatório de movimentações.
 */
export interface MovementReportResponse {
  summary: MovementReportSummary;
  movements: Movement[];
}

/**
 * Serviço Angular responsável pelas requisições HTTP relacionadas às movimentações de estoque.
 */
@Injectable({ providedIn: 'root' })
export class MovementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/movements`;

  /**
   * Obtém a lista completa de todas as movimentações cadastradas.
   */
  getMovements(): Observable<Movement[]> {
    return this.http.get<Movement[]>(this.apiUrl);
  }

  /**
   * Realiza busca filtrada de movimentações.
   *
   * @param filters Critérios de filtro (datas, tipo, nome do produto)
   */
  searchMovements(filters: MovementSearchFilter): Observable<Movement[]> {
    let params = new HttpParams();

    if (filters.productName) params = params.set('productName', filters.productName.trim());
    if (filters.type) params = params.set('type', filters.type);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.sector) params = params.set('sector', filters.sector.trim());
    if (filters.requester) params = params.set('requester', filters.requester.trim());

    return this.http.get<Movement[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtém o relatório consolidado de movimentações com indicadores (valor gasto total,
   * valor unitário dos itens, total de entradas/saídas e saldo) com base no período de datas.
   *
   * @param filters Filtros de busca (data inicial, data final, tipo, produto)
   * @returns Observable com o resumo executivo e a lista completa de movimentações
   */
  getReport(filters: MovementSearchFilter): Observable<MovementReportResponse> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.productName) params = params.set('productName', filters.productName.trim());
    if (filters.sector) params = params.set('sector', filters.sector.trim());
    if (filters.requester) params = params.set('requester', filters.requester.trim());

    return this.http.get<MovementReportResponse>(`${this.apiUrl}/report`, { params });
  }

  /**
   * Registra uma nova movimentação física e financeira no estoque.
   *
   * @param payload Dados da movimentação
   */
  createMovement(payload: CreateMovementPayload): Observable<Movement> {
    return this.http.post<Movement>(this.apiUrl, payload);
  }
}