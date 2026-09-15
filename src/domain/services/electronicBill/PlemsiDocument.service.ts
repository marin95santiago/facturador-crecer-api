import axios from 'axios';
import { Entity } from '../../entities/Entity.entity';

const URL_PLEMSI = process.env.URL_PLEMSI || '';
const PREFIX_SUPPORT_DOCUMENT_PLEMSI = process.env.PREFIX_SUPPORT_DOCUMENT_PLEMSI || 'DS';
const MEASURE_UNIT_UNIDAD = 70;

interface PlemsiTaxTotal {
  tax_id: number
  percent: number
  tax_amount: number
  taxable_amount: number
}

interface PlemsiCreditNoteSupportDocumentItem {
  unit_measure_id: number
  line_extension_amount: number
  free_of_charge_indicator: boolean
  allowance_charges: unknown[]
  tax_totals: PlemsiTaxTotal[]
  description: string
  notes: string
  code: string
  type_item_identification_id: number
  price_amount: number
  base_quantity: number
  invoiced_quantity: number
  brandname: string
  modelname: string
}

interface PlemsiCreditNoteSupportDocumentPayload {
  discrepancy: { code: number; description: string }
  resolution: string
  prefix: string
  number: number
  items: PlemsiCreditNoteSupportDocumentItem[]
  seller: Record<string, unknown>
  foot_note: string
  head_note: string
  invoiceReference: { issue_date: string; uuid: string; number: string }
  generalAllowances: unknown[]
  allowanceTotal: number
  invoiceBaseTotal: number
  invoiceTaxExclusiveTotal: number
  invoiceTaxInclusiveTotal: number
  totalToPay: number
  allTaxTotals: PlemsiTaxTotal[]
  allHoldingsTaxTotals: PlemsiTaxTotal[]
}

export class PlemsiDocumentService {
  /**
   * Obtiene el listado de facturas electrónicas desde Plemsi
   * @param entity - Entidad con información de la empresa
   * @param page - Número de página
   * @param perPage - Elementos por página
   * @returns Datos de las facturas electrónicas
   */
  async getElectronicInvoices(entity: Entity, page: number = 1, perPage: number = 10) {
    try {
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      // Construir la URL con parámetros de paginación
      const url = `${URL_PLEMSI}/billing/invoice?page=${page}&perPage=${perPage}`;
      
      // Realizar la petición a Plemsi
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${entity.apiKeyPlemsi}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.log('Error obteniendo facturas electrónicas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una factura electrónica específica por número
   * @param entity - Entidad con información de la empresa
   * @param invoiceNumber - Número de la factura
   * @returns Datos de la factura electrónica
   */
  async getElectronicInvoice(entity: Entity, invoiceNumber: number) {
    try {
      console.log('🔍 PlemsiDocumentService - getElectronicInvoice called with:', { invoiceNumber, prefix: entity.prefix });
      
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      // Construir la URL con parámetros de paginación
      const url = `${URL_PLEMSI}/billing/invoice/one?by=number&value=${invoiceNumber}&prefix=${entity.prefix}`;
      console.log('🔍 PlemsiDocumentService - URL construida:', url);
      
      // Realizar la petición a Plemsi
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${entity.apiKeyPlemsi}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.log('❌ PlemsiDocumentService - Error obteniendo factura electrónica:', error);
      throw error;
    }
  }

  /**
   * Obtiene un documento soporte electrónico por CUDE
   * @param entity - Entidad con información de la empresa
   * @param cude - CUDE del documento soporte
   * @returns Datos del documento soporte electrónico
   */
  async getElectronicSupportDocument(entity: Entity, cude: string) {
    try {
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      // Construir la URL para obtener documento soporte por CUDE
      const url = `${URL_PLEMSI}/purchase/invoice/one?by=cude&value=${cude}`;
      
      // Realizar la petición a Plemsi
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${entity.apiKeyPlemsi}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.log('Error obteniendo documento soporte electrónico:', error);
      throw error;
    }
  }

  /**
   * Obtiene una nota crédito electrónica por CUDE
   * @param entity - Entidad con información de la empresa
   * @param cude - CUDE de la nota crédito
   * @returns Datos de la nota crédito electrónica
   */
  async getElectronicCreditNote(entity: Entity, cude: string) {
    try {
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      const url = `${URL_PLEMSI}/billing/credit/one?by=cude&value=${cude}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${entity.apiKeyPlemsi}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.log('Error obteniendo nota crédito electrónica:', error);
      throw error;
    }
  }

  /**
   * Obtiene el listado de documentos soporte electrónicos desde Plemsi
   * @param entity - Entidad con información de la empresa
   * @param page - Número de página
   * @param perPage - Elementos por página
   * @returns Datos de los documentos soporte electrónicos
   */
  async getElectronicSupportDocuments(entity: Entity, page: number = 1, perPage: number = 10) {
    try {
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      // Construir la URL con parámetros de paginación y estado
      const url = `${URL_PLEMSI}/purchase/invoice?page=${page}&perPage=${perPage}&state=Emitted`;
      
      // Realizar la petición a Plemsi
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${entity.apiKeyPlemsi}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.log('Error obteniendo documentos soporte electrónicos:', error);
      throw error;
    }
  }

  /**
   * Construye el payload de nota crédito de Plemsi a partir de una factura de Plemsi.
   *
   * @param invoice Factura retornada por Plemsi (estructura similar a @Untitled-2)
   * @param entity Entidad con información de la empresa
   * @returns Objeto de nota crédito con la estructura de @Untitled-1
   */
  async buildCreditNoteFromInvoice (invoice: any, entity: Entity): Promise<any> {

    if (!entity.lastCreditNumber || !entity.prefixNC || !entity.resolutionNC || !entity.resolutionTextNC) {
      throw new Error('No se ha configurado el número de nota crédito, prefijo o resolución para esta entidad');
    }

    const legalTotals = invoice.legal_monetary_totals

    const paymentForm = Array.isArray(invoice.payment_form) && invoice.payment_form.length > 0
      ? invoice.payment_form[0]
      : undefined

    const items = Array.isArray(invoice.invoice_lines)
      ? invoice.invoice_lines.map((line: any) => ({
          unit_measure_id: Number(line.unit_measure_id),
          line_extension_amount: Number(line.line_extension_amount),
          free_of_charge_indicator: !!line.free_of_charge_indicator,
          allowance_charges: [],
          tax_totals: Array.isArray(line.tax_totals)
            ? line.tax_totals.map((tax: any) => ({
                tax_id: Number(tax.tax_id),
                percent: Number(tax.percent),
                tax_amount: Number(tax.tax_amount),
                taxable_amount: Number(tax.taxable_amount)
              }))
            : [],
          description: line.description,
          notes: line.notes,
          code: line.code,
          type_item_identification_id: Number(line.type_item_identification_id),
          price_amount: Number(line.price_amount),
          base_quantity: Number(line.base_quantity),
          invoiced_quantity: Number(line.invoiced_quantity)
        }))
      : []

    const allTaxTotals = Array.isArray(invoice.tax_totals)
      ? invoice.tax_totals.map((tax: any) => ({
          tax_id: Number(tax.tax_id),
          tax_amount: Number(tax.tax_amount),
          percent: Number(tax.percent),
          taxable_amount: Number(tax.taxable_amount)
        }))
      : []

    const allHoldingsTaxTotals = Array.isArray(invoice.with_holding_tax_total)
      ? invoice.with_holding_tax_total.map((tax: any) => ({
          tax_id: Number(tax.tax_id),
          tax_amount: Number(tax.tax_amount),
          percent: Number(tax.percent),
          taxable_amount: Number(tax.taxable_amount)
        }))
      : []

    const allowanceTotal = 0

    const creditNote = {
      prefix: entity.prefixNC,
      // En este punto no tenemos el consecutivo de la nota crédito desde la factura,
      // por lo que se deja un valor por defecto. Este valor debería ser reemplazado
      // por el consecutivo real desde la entidad/sistema que lleve la numeración.
      number: entity.lastCreditNumber + 1,
      send_email: true,
      invoiceReference: {
        // Se usa el consecutivo completo de la factura referenciada (prefijo + número)
        number: invoice.consecutive,
        // CUFE/CUDE de la factura referenciada
        uuid: invoice.cude,
        issue_date: invoice.date
      },
      // Valores estáticos indicados en el requerimiento
      discrepancy: {
        code: 2,
        description: 'Anulación solicitada por el emisor'
      },
      customer: {
        identification_number: invoice.customer.identification_number,
        dv: invoice.customer.dv,
        name: invoice.customer.name,
        phone: invoice.customer.phone,
        address: invoice.customer.address,
        email: invoice.customer.email,
        merchant_registration: invoice.customer.merchant_registration,
        type_document_identification_id: invoice.customer.type_document_identification_id,
        type_organization_id: invoice.customer.type_organization_id,
        type_liability_id: invoice.customer.type_liability_id,
        municipality_id: invoice.customer.municipality_id,
        type_regime_id: invoice.customer.type_regime_id
      },
      payment: paymentForm
        ? {
            payment_form_id: paymentForm.payment_form_id,
            payment_method_id: paymentForm.payment_method_id,
            payment_due_date: paymentForm.payment_due_date,
            duration_measure: paymentForm.duration_measure
          }
        : undefined,
      // Por ahora no se están manejando descuentos generales a nivel de factura
      generalAllowances: [],
      items,
      resolution: entity.resolutionNC,
      resolutionText: entity.resolutionTextNC,
      head_note: invoice.head_note ?? '',
      foot_note: invoice.foot_note ?? '',
      notes: invoice.notes ?? '',
      allowanceTotal,
      invoiceBaseTotal: Number(legalTotals.line_extension_amount),
      invoiceTaxExclusiveTotal: Number(legalTotals.tax_exclusive_amount),
      invoiceTaxInclusiveTotal: Number(legalTotals.tax_inclusive_amount),
      totalToPay: Number(legalTotals.payable_amount),
      allTaxTotals,
      allHoldingsTaxTotals
    }

    const response = await axios.post(`${URL_PLEMSI}/billing/credit`, creditNote, {
      headers: {
        Authorization: `Bearer ${entity.apiKeyPlemsi}`
      }
    })
     
    return response.data;
  }

  /** Gets a support-document credit note from Plemsi by CUDE. */
  async getElectronicCreditNoteSupportDocument(entity: Entity, cude: string) {
    try {
      if (!entity.apiKeyPlemsi) {
        throw new Error('Clave de Plemsi no configurada para esta entidad');
      }

      const url = `${URL_PLEMSI}/purchase/credit/one?by=cude&value=${cude}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${entity.apiKeyPlemsi}`
        }
      });

      return response.data;
    } catch (error: unknown) {
      console.log('Error obteniendo nota crédito de documento soporte:', error);
      throw new Error('Nota crédito de documento soporte no encontrada');
    }
  }

  /** Builds and submits a support-document credit note payload to Plemsi. */
  async buildCreditNoteSupportDocumentFromSupportDocument(
    supportDocument: Record<string, unknown>,
    entity: Entity,
    creditNoteNumber: number
  ): Promise<unknown> {
    if (!entity.resolutionNCDS || !entity.resolutionTextNCDS || !entity.prefixNCDS) {
      throw new Error('No se ha configurado la resolución de nota crédito de documento soporte para esta entidad');
    }

    if (entity.lastCreditSupportDocumentNumber === undefined) {
      throw new Error('No se ha configurado la resolución de nota crédito de documento soporte para esta entidad');
    }

    if (!entity.apiKeyPlemsi) {
      throw new Error('Clave de Plemsi no configurada para esta entidad');
    }

    const legalTotals = supportDocument.legal_monetary_totals as Record<string, unknown>;
    const seller = supportDocument.seller as Record<string, unknown>;

    let postalZoneCode = '000000';
    if (seller.postal_zone_code) {
      postalZoneCode = String(seller.postal_zone_code);
    }

    const items: PlemsiCreditNoteSupportDocumentItem[] = [];
    const invoiceLines = supportDocument.invoice_lines;

    if (Array.isArray(invoiceLines)) {
      for (const line of invoiceLines) {
        const lineRecord = line as Record<string, unknown>;
        const taxTotals: PlemsiTaxTotal[] = [];

        if (Array.isArray(lineRecord.tax_totals)) {
          for (const tax of lineRecord.tax_totals) {
            const taxRecord = tax as Record<string, unknown>;
            taxTotals.push({
              tax_id: Number(taxRecord.tax_id),
              percent: Number(taxRecord.percent),
              tax_amount: Number(taxRecord.tax_amount),
              taxable_amount: Number(taxRecord.taxable_amount)
            });
          }
        }

        let allowanceCharges: unknown[] = [];
        if (Array.isArray(lineRecord.allowance_charges)) {
          allowanceCharges = lineRecord.allowance_charges;
        }

        let unitMeasureId = MEASURE_UNIT_UNIDAD;
        if (lineRecord.unit_measure_id !== undefined && lineRecord.unit_measure_id !== null) {
          const parsedUnitMeasureId = Number(lineRecord.unit_measure_id);
          if (!Number.isNaN(parsedUnitMeasureId)) {
            unitMeasureId = parsedUnitMeasureId;
          }
        }

        items.push({
          unit_measure_id: unitMeasureId,
          line_extension_amount: Number(lineRecord.line_extension_amount),
          free_of_charge_indicator: Boolean(lineRecord.free_of_charge_indicator),
          allowance_charges: allowanceCharges,
          tax_totals: taxTotals,
          description: String(lineRecord.description ?? ''),
          notes: String(lineRecord.notes ?? ''),
          code: String(lineRecord.code ?? ''),
          type_item_identification_id: Number(lineRecord.type_item_identification_id),
          price_amount: Number(lineRecord.price_amount),
          base_quantity: Number(lineRecord.base_quantity),
          invoiced_quantity: Number(lineRecord.invoiced_quantity),
          brandname: 'NA',
          modelname: 'NA'
        });
      }
    }

    const allTaxTotals: PlemsiTaxTotal[] = [];
    if (Array.isArray(supportDocument.tax_totals)) {
      for (const tax of supportDocument.tax_totals) {
        const taxRecord = tax as Record<string, unknown>;
        allTaxTotals.push({
          tax_id: Number(taxRecord.tax_id),
          tax_amount: Number(taxRecord.tax_amount),
          percent: Number(taxRecord.percent),
          taxable_amount: Number(taxRecord.taxable_amount)
        });
      }
    }

    const allHoldingsTaxTotals: PlemsiTaxTotal[] = [];
    if (Array.isArray(supportDocument.with_holding_tax_total)) {
      for (const tax of supportDocument.with_holding_tax_total) {
        const taxRecord = tax as Record<string, unknown>;
        allHoldingsTaxTotals.push({
          tax_id: Number(taxRecord.tax_id),
          tax_amount: Number(taxRecord.tax_amount),
          percent: Number(taxRecord.percent),
          taxable_amount: Number(taxRecord.taxable_amount)
        });
      }
    }

    let headNote = '';
    if (supportDocument.head_note) {
      headNote = String(supportDocument.head_note);
    }

    let footNote = '';
    if (supportDocument.foot_note) {
      footNote = String(supportDocument.foot_note);
    }

    let allowanceTotal = 0;
    if (supportDocument.allowance_total !== undefined) {
      allowanceTotal = Number(supportDocument.allowance_total);
    }

    let generalAllowances: unknown[] = [];
    if (Array.isArray(supportDocument.general_allowances)) {
      generalAllowances = supportDocument.general_allowances;
    }

    const creditNotePayload: PlemsiCreditNoteSupportDocumentPayload = {
      discrepancy: {
        code: 2,
        description: 'Anulación solicitada por el emisor'
      },
      resolution: entity.resolutionNCDS,
      prefix: entity.prefixNCDS,
      number: creditNoteNumber,
      items,
      seller: {
        identification_number: seller.identification_number,
        dv: seller.dv,
        name: seller.name,
        phone: seller.phone,
        address: seller.address,
        postal_zone_code: postalZoneCode,
        email: seller.email,
        merchant_registration: seller.merchant_registration,
        type_document_identification_id: seller.type_document_identification_id,
        type_organization_id: seller.type_organization_id,
        type_liability_id: seller.type_liability_id,
        municipality_id: seller.municipality_id,
        type_regime_id: seller.type_regime_id
      },
      foot_note: footNote,
      head_note: headNote,
      invoiceReference: {
        issue_date: String(supportDocument.date ?? ''),
        uuid: String(supportDocument.cude ?? ''),
        number: String(supportDocument.consecutive ?? '')
      },
      generalAllowances,
      allowanceTotal,
      invoiceBaseTotal: Number(legalTotals.line_extension_amount),
      invoiceTaxExclusiveTotal: Number(legalTotals.tax_exclusive_amount),
      invoiceTaxInclusiveTotal: Number(legalTotals.tax_inclusive_amount),
      totalToPay: Number(legalTotals.payable_amount),
      allTaxTotals,
      allHoldingsTaxTotals
    };

    const response = await axios.post(`${URL_PLEMSI}/purchase/credit`, creditNotePayload, {
      headers: {
        Authorization: `Bearer ${entity.apiKeyPlemsi}`
      }
    });

    return response.data;
  }
}
