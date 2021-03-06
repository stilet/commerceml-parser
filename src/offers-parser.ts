import {CommerceMlAbstractParser} from './abstract-parser';
import {
  Classifier,
  CommercialInformation,
  Counterparty,
  Offer,
  OffersPackage,
  PriceType,
  Warehouse
} from './types';

export class CommerceMlOffersParser extends CommerceMlAbstractParser {
  /**
   * Parser Rules.
   */
  protected rules = {
    commercialInformation: {
      start: ['КоммерческаяИнформация']
    },
    classifier: {
      start: ['КоммерческаяИнформация', 'Классификатор'],
      include: [
        ['КоммерческаяИнформация', 'Классификатор', 'Ид'],
        ['КоммерческаяИнформация', 'Классификатор', 'Наименование'],
        ['КоммерческаяИнформация', 'Классификатор', 'Владелец']
      ]
    },
    classifierProperty: {
      start: ['КоммерческаяИнформация', 'Классификатор', 'Свойства', 'Свойство'],
      include: [
        ['КоммерческаяИнформация', 'Классификатор', 'Свойства', 'Свойство']
      ]
    },
    offersPackage: {
      start: ['КоммерческаяИнформация', 'ПакетПредложений'],
      include: [
        ['КоммерческаяИнформация', 'ПакетПредложений', 'Ид'],
        ['КоммерческаяИнформация', 'ПакетПредложений', 'Наименование'],
        ['КоммерческаяИнформация', 'ПакетПредложений', 'ИдКаталога'],
        ['КоммерческаяИнформация', 'ПакетПредложений', 'ИдКлассификатора'],
        ['КоммерческаяИнформация', 'ПакетПредложений', 'Владелец'],
        ['КоммерческаяИнформация', 'ПакетПредложений', 'ТипыЦен']
      ]
    },
    warehouse: {
      start: ['КоммерческаяИнформация', 'ПакетПредложений', 'Склады', 'Склад'],
      include: [
        ['КоммерческаяИнформация', 'ПакетПредложений', 'Склады', 'Склад']
      ]
    },
    offer: {
      start: ['КоммерческаяИнформация', 'ПакетПредложений', 'Предложения', 'Предложение'],
      include: [
        ['КоммерческаяИнформация', 'ПакетПредложений', 'Предложения', 'Предложение']
      ]
    }
  };

  /**
   * Parses commercial information schemaVersion and creationTimestamp attributes.
   * @param callback
   */
  public onCommercialInformation(callback: (commercialInformation: CommercialInformation) => void): void {
    this.stream.on('commercialInformation', (data: any) => {
      const commercialInformation: CommercialInformation = {
        schemaVersion: data.КоммерческаяИнформация._ВерсияСхемы,
        creationTimestamp: new Date(data.КоммерческаяИнформация._ДатаФормирования)
      };

      callback(commercialInformation);
    });
  }

  /**
   * Parses classifier block header without details.
   * @param callback
   */
  public onClassifier(callback: (classifier: Classifier) => void): void {
    this.stream.on('classifier', (data: any) => {
      const classifierXml = data.Классификатор;
      const classifier: Classifier = {
        id: classifierXml.Ид,
        name: classifierXml.Наименование,
        owner: this.parseCounterpartyXmlData(classifierXml.Владелец)
      };

      callback(classifier);
    });
  }

  public onOffersPackage(callback: (offersPackage: OffersPackage) => void): void {
    this.stream.on('offersPackage', (data: any) => {
      const offersPackageXml = data.ПакетПредложений;
      const offersPackage: OffersPackage = {
        changesOnly: offersPackageXml._СодержитТолькоИзменения,
        id: offersPackageXml.Ид,
        name: offersPackageXml.Наименование,
        catalogId: offersPackageXml.ИдКаталога,
        classifierId: offersPackageXml.ИдКлассификатора,
        owner: this.parseCounterpartyXmlData(offersPackageXml.Владелец),
        offers: [],
        priceTypes: []
      };

      for (const priceTypeXml of offersPackageXml.ТипыЦен.ТипЦены ?? []) {
        const priceType: PriceType = {
          id: priceTypeXml.Ид,
          name: priceTypeXml.Наименование,
          currency: priceTypeXml.Валюта
        };

        if (priceTypeXml.Налог) {
          priceType.tax = {
            name: priceTypeXml.Налог.Наименование,
            includedInSum: priceTypeXml.Налог.УчтеноВСумме,
            excise: priceTypeXml.Налог.Акциз
          };
        }

        offersPackage.priceTypes.push(priceType);
      }

      callback(offersPackage);
    });
  }

  public onWarehouse(callback: (warehouse: Warehouse) => void): void {
    this.stream.on('warehouse', (data: any) => {
      const warehouseXml = data.Склад;
      const warehouse: Warehouse = {
        id: warehouseXml.Ид,
        name: warehouseXml.Наименование
      };

      callback(warehouse);
    });
  }

  public onOffer(callback: (offer: Offer) => void): void {
    this.stream.on('offer', (data: any) => {
      const offerXml = data.Предложение;
      const offer: Offer = {
        id: offerXml.Ид,
        article: offerXml.Артикул,
        name: offerXml.Наименование,
        baseMeasurementUnit: {
          code: offerXml.БазоваяЕдиница._Код,
          fullName: offerXml.БазоваяЕдиница._НаименованиеПолное,
          acronym: offerXml.БазоваяЕдиница._МеждународноеСокращение
        },
        quantity: offerXml.Количество
      };

      if (offerXml.Цены?.Цена?.length > 0) {
        offer.prices = [];
        for (const priceXml of offerXml.Цены.Цена) {
          offer.prices.push({
            representation: priceXml.Представление,
            priceTypeId: priceXml.ИдТипаЦены,
            pricePerUnit: priceXml.ЦенаЗаЕдиницу,
            currency: priceXml.Валюта,
            unitAcronym: priceXml.Единица,
            coefficient: priceXml.Коэффициент
          });
        }
      }

      if (offerXml.Склад?.length > 0) {
        offer.stocks = [];
        for (const stockXml of offerXml.Склад) {
          offer.stocks.push({
            warehouseId: stockXml._ИдСклада,
            quantity: Number.parseInt(stockXml._КоличествоНаСкладе, 10)
          });
        }
      }

      callback(offer);
    });
  }

  /**
   * Helper method to parse counterparty XML data.
   * @param xmlData
   */
  protected parseCounterpartyXmlData(xmlData: any): Counterparty {
    const counterparty: Counterparty = {
      id: xmlData.Ид,
      name: xmlData.Наименование
    };

    // Detect company info or person info
    if (xmlData.ОфициальноеНаименование) {
      counterparty.companyInfo = {
        officialName: xmlData.ОфициальноеНаименование,
        inn: xmlData.ИНН,
        kpp: xmlData.КПП,
        okpo: xmlData.ОКПО
      };
    } else {
      counterparty.personInfo = {
        fullName: xmlData.ПолноеНаименование
      };
    }

    return counterparty;
  }
}
