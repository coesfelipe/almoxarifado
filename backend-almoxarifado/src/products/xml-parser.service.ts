import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

/**
 * Interface que representa um item de mercadoria extraído das tags do XML de NF-e.
 */
export interface ExtractedNfeItem {
  /** Nome ou descrição comercial do item constante na tag <xProd> */
  productName: string;
  /** Quantidade faturada constante na tag <qCom> */
  quantity: number;
  /** Categoria deduzida com base no código NCM */
  category: string;
  /** Nomenclatura Comum do Mercosul (NCM) do item */
  ncm: string;
  /** Preço unitário de comercialização constante na tag <vUnCom> */
  unitPrice: number;
  /** Unidade de medida padronizada (UN, KG, L, CX, etc.) */
  measurement: string;
}

/**
 * Serviço especializado na extração e normalização de dados a partir de arquivos XML
 * de Nota Fiscal Eletrônica (NF-e padrão SEFAZ Brasil).
 */
@Injectable()
export class XmlParserService {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Remove os prefixos/namespaces das tags no parse (ex: <nfe:prod> vira <prod>)
    transformTagName: (tagName) => {
      const parts = tagName.split(':');
      return parts.length > 1 ? parts[1] : tagName;
    },
  });

  /**
   * Converte o buffer de bytes de um arquivo XML de NF-e em uma lista de produtos tipados.
   *
   * @param xmlBuffer Buffer de dados do arquivo XML enviado
   * @returns Array de itens extraídos com valores unitários, quantidades e categorias normalizadas
   * @throws BadRequestException Caso o XML seja inválido ou não contenha a estrutura esperada de NF-e
   */
  extractProductsFromXml(xmlBuffer: Buffer): ExtractedNfeItem[] {
    try {
      const xmlString = xmlBuffer.toString('utf-8');
      const jsonObj = this.parser.parse(xmlString);

      // Busca a tag infNFe independentemente do wrapper inicial (nfeProc, NFe ou direto)
      const infNFe =
        jsonObj.nfeProc?.NFe?.infNFe ||
        jsonObj.NFe?.infNFe ||
        jsonObj.infNFe ||
        jsonObj.nfeProc?.infNFe;

      // Valida estrutura mínima de itens
      if (!infNFe || !infNFe.det) {
        throw new BadRequestException('Estrutura de XML de NF-e inválida ou sem itens.');
      }

      // Suporta notas com 1 item (Objeto) ou múltiplos itens (Array)
      const detArray = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

      return detArray.map((item: any, index: number) => {
        const prod = item.prod;

        if (!prod) {
          throw new BadRequestException(`Item na posição #${index + 1} não possui a tag <prod>.`);
        }

        const rawNcm = String(prod.NCM || '').trim();
        const rawUnit = String(prod.uCom || '').trim();

        return {
          productName: String(prod.xProd || '').trim(),
          quantity: Number(prod.qCom || 0),
          unitPrice: Number(prod.vUnCom || 0),
          ncm: rawNcm,
          category: this.mapNcmToCategory(rawNcm),
          measurement: this.normalizeUnit(rawUnit),
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Erro de parse no XML da NF-e:', error);
      throw new BadRequestException('Erro ao processar o arquivo XML da Nota Fiscal.');
    }
  }

  /**
   * Classifica a categoria do produto a partir dos dois primeiros dígitos do código NCM (Capítulo).
   *
   * @param ncm Código NCM de 8 dígitos
   * @returns Nome amigável da categoria
   */
  private mapNcmToCategory(ncm: string): string {
    if (!ncm || ncm.length < 2) return 'Geral';

    const chapter = ncm.substring(0, 2);

    switch (chapter) {
      case '84':
      case '85':
        return 'Informática e Eletrônicos';
      case '94':
        return 'Mobiliário e Escritório';
      case '39':
      case '48':
        return 'Material de Escritório';
      case '34':
        return 'Material de Limpeza';
      default:
        return 'Outros';
    }
  }

  /**
   * Padroniza as siglas de unidades de medida comerciais da NF-e para o padrão do sistema.
   *
   * @param uCom Unidade de comercialização bruta vinda do XML (ex: 'UNID', 'PC', 'PÇ')
   * @returns Sigla normalizada ('UN', 'KG', 'L', 'CX', 'PCT')
   */
  private normalizeUnit(uCom: string): string {
    if (!uCom) return 'UN';

    const unit = uCom.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Siglas oficiais aceitas direto
    if (['UN', 'CX', 'PCT', 'FD', 'KIT', 'PAR', 'PC', 'RO', 'FL', 'KG', 'G', 'SAC', 'L', 'GAL', 'BOM', 'FR', 'LAT', 'M', 'BAR'].includes(unit)) {
      return unit;
    }

    // 2. Mapeamento de variações e sinonímias
    if (['UND', 'UNID', 'UNIDADE', 'CJ', 'CJO', 'JGO', 'JG'].includes(unit)) return 'UN';
    if (['CXA', 'CAIXA', 'CX2', 'CX5', 'CX10', 'CX20', 'CX50'].includes(unit)) return 'CX';
    if (['PAC', 'PACOTE'].includes(unit)) return 'PCT';
    if (['FDO', 'FARDO'].includes(unit)) return 'FD';
    if (['KT'].includes(unit)) return 'KIT';
    if (['PR'].includes(unit)) return 'PAR';
    if (['PCA', 'PÇA', 'PECA'].includes(unit)) return 'PC';
    if (['RL', 'ROLO'].includes(unit)) return 'RO';
    if (['FLH', 'FOLHA'].includes(unit)) return 'FL';
    if (['KGR', 'KILO', 'QUILO', 'TON', 'TONELADA'].includes(unit)) return 'KG';
    if (['GR', 'GRM', 'GRAMA'].includes(unit)) return 'G';
    if (['SACO', 'SC'].includes(unit)) return 'SAC';
    if (['LTR', 'LT', 'LITRO', 'ML'].includes(unit)) return 'L';
    if (['GL', 'GALAO'].includes(unit)) return 'GAL';
    if (['BOMBONA', 'BALDE'].includes(unit)) return 'BOM';
    if (['FRS', 'FRASCO'].includes(unit)) return 'FR';
    if (['LATA'].includes(unit)) return 'LAT';
    if (['MT', 'MTR', 'METRO', 'M2', 'M3'].includes(unit)) return 'M';
    if (['BARRA', 'BR'].includes(unit)) return 'BAR';

    return 'UN';
  }
}