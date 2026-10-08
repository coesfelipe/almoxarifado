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
        const unit = uCom.toUpperCase().replace(/[^A-Z]/g, '');
        if (['UN', 'UND', 'UNID', 'PC', 'PCA', 'PÇ', 'CJ'].includes(unit))
            return 'UN';
        if (['KG', 'KGR', 'KILO', 'G', 'GRM'].includes(unit))
            return 'KG';
        if (['L', 'LTR', 'LT', 'LITRO', 'ML'].includes(unit))
            return 'L';
        if (['CX', 'CXA', 'CAIXA'].includes(unit))
            return 'CX';
        if (['PCT', 'PAC', 'PACOTE', 'FD', 'FARDO'].includes(unit))
            return 'PCT';
        return 'UN';
    }
};
XmlParserService = __decorate([
    Injectable()
], XmlParserService);
export { XmlParserService };
//# sourceMappingURL=xml-parser.service.js.map