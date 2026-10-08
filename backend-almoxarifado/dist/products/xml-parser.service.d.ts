export interface ExtractedNfeItem {
    productName: string;
    quantity: number;
    category: string;
    ncm: string;
    unitPrice: number;
    measurement: string;
}
export declare class XmlParserService {
    private parser;
    extractProductsFromXml(xmlBuffer: Buffer): ExtractedNfeItem[];
    private mapNcmToCategory;
    private normalizeUnit;
}
