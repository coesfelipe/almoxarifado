import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizável para exibição de indicadores-chave (KPIs),
 * métricas financeiras ou estatísticas com títulos, valores destacados,
 * badges contextuais e subtítulos.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.html',
  styleUrls: ['./kpi-card.css'],
})
export class KpiCard {
  /** Título ou rótulo do indicador (ex: 'Valor Gasto Total') */
  @Input({ required: true }) title!: string;

  /** Valor numérico ou monetário já formatado (ex: 'R$ 1.250,00' ou '32') */
  @Input({ required: true }) value!: string | number;

  /** Texto exibido dentro do badge superior direito (opcional) */
  @Input() badgeText?: string;

  /** Estilo visual do badge */
  @Input() badgeType: 'entry' | 'exit' | 'neutral' | 'primary' = 'neutral';

  /** Texto informativo de rodapé no card (opcional) */
  @Input() footerText?: string;

  /** Variante de cor de destaque na borda lateral esquerda */
  @Input() variant: 'danger' | 'success' | 'primary' | 'warning' | 'default' = 'default';
}

