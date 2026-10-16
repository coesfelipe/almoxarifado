var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
let XmlParserService = class XmlParserService {
    parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        transformTagName: (tagName) => {
            const parts = tagName.split(':');
            return parts.length > 1 ? parts[1] : tagName;
        },
    });
    extractProductsFromXml(xmlBuffer) {
        try {
            const xmlString = xmlBuffer.toString('utf-8');
            const jsonObj = this.parser.parse(xmlString);
            const infNFe = jsonObj.nfeProc?.NFe?.infNFe ||
                jsonObj.NFe?.infNFe ||
                jsonObj.infNFe ||
                jsonObj.nfeProc?.infNFe;
            if (!infNFe || !infNFe.det) {
                throw new BadRequestException('Estrutura de XML de NF-e inválida ou sem itens.');
            }
            const detArray = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
            return detArray.map((item, index) => {
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
        }
        catch (error) {
            if (error instanceof BadRequestException)
                throw error;
            console.error('Erro de parse no XML da NF-e:', error);
            throw new BadRequestException('Erro ao processar o arquivo XML da Nota Fiscal.');
        }
    }
    mapNcmToCategory(ncm) {
        if (!ncm || ncm.length < 2)
            return 'Geral';
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
    normalizeUnit(uCom) {
        if (!uCom)
            return 'UN';
        const unit = uCom.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (['UN', 'CX', 'PCT', 'FD', 'KIT', 'PAR', 'PC', 'RO', 'FL', 'KG', 'G', 'SAC', 'L', 'GAL', 'BOM', 'FR', 'LAT', 'M', 'BAR'].includes(unit)) {
            return unit;
        }
        if (['UND', 'UNID', 'UNIDADE', 'CJ', 'CJO', 'JGO', 'JG'].includes(unit))
            return 'UN';
        if (['CXA', 'CAIXA', 'CX2', 'CX5', 'CX10', 'CX20', 'CX50'].includes(unit))
            return 'CX';
        if (['PAC', 'PACOTE'].includes(unit))
            return 'PCT';
        if (['FDO', 'FARDO'].includes(unit))
            return 'FD';
        if (['KT'].includes(unit))
            return 'KIT';
        if (['PR'].includes(unit))
            return 'PAR';
        if (['PCA', 'PÇA', 'PECA'].includes(unit))
            return 'PC';
        if (['RL', 'ROLO'].includes(unit))
            return 'RO';
        if (['FLH', 'FOLHA'].includes(unit))
            return 'FL';
        if (['KGR', 'KILO', 'QUILO', 'TON', 'TONELADA'].includes(unit))
            return 'KG';
        if (['GR', 'GRM', 'GRAMA'].includes(unit))
            return 'G';
        if (['SACO', 'SC'].includes(unit))
            return 'SAC';
        if (['LTR', 'LT', 'LITRO', 'ML'].includes(unit))
            return 'L';
        if (['GL', 'GALAO'].includes(unit))
            return 'GAL';
        if (['BOMBONA', 'BALDE'].includes(unit))
            return 'BOM';
        if (['FRS', 'FRASCO'].includes(unit))
            return 'FR';
        if (['LATA'].includes(unit))
            return 'LAT';
        if (['MT', 'MTR', 'METRO', 'M2', 'M3'].includes(unit))
            return 'M';
        if (['BARRA', 'BR'].includes(unit))
            return 'BAR';
        return 'UN';
    }
};
XmlParserService = __decorate([
    Injectable()
], XmlParserService);
export { XmlParserService };
//# sourceMappingURL=xml-parser.service.js.map