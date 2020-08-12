import {CommerceMlAbstractParser, CommerceMlCollectRule} from './abstract-parser';
import {CommercialInformation, Document} from './types';

export class OrdersParser extends CommerceMlAbstractParser {
  /**
   * Parses commercial information schemaVersion and creationTimestamp attributes.
   * @param callback
   */
  public onCommercialInformation(callback: (commercialInformation: CommercialInformation) => void): void {
    this.parser.on('commercialInformation', (data: any) => {
      const commercialInformation: CommercialInformation = {
        schemaVersion: data.КоммерческаяИнформация._ВерсияСхемы,
        creationTimestamp: data.КоммерческаяИнформация._ДатаФормирования
      };

      callback(commercialInformation);
    });
  }

  /**
   * Parses document block.
   * @param callback
   */
  public onDocument(callback: (document: Document) => void): void {
    this.parser.on('document', (data: any) => {
      const documentXml = data.Документ;
      const document: Document = {
        id: documentXml.Ид,
        number: documentXml.Номер,
        date: documentXml.Дата,
        operation: documentXml.ХозОперация,
        role: documentXml.Роль,
        currency: documentXml.Валюта,
        // eslint-disable-next-line no-warning-comments
        counterparties: [] // TODO: нужен пример выгрузки
      };

      callback(document);
    });
  }

  protected getCollectRules(): {[key: string]: CommerceMlCollectRule} {
    return {
      commercialInformation: {
        start: ['КоммерческаяИнформация']
      },
      document: {
        start: ['КоммерческаяИнформация', 'Документ'],
        include: [
          ['КоммерческаяИнформация', 'Документ']
        ]
      }
    };
  }
}
