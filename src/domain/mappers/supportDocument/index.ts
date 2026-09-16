import path from 'path'
import * as dotenv from 'dotenv'
import { Item, ItemPlemsi, Tax, TaxPlemsi } from "../../entities/ElectronicBill.entity";
import { SupportDocumentPlemsi } from 'domain/entities/SupportDocument.entity';
import { toPlemsiAmount } from '../../services/utils/money.helper';

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

const prefixPlemsi = process.env.PREFIX_SUPPORT_DOCUMENT_PLEMSI ?? 'SETT'

interface EntityDataForPlemsi {
  resolution: string
  resolutionText: string
}

function calcularDigitoVerificacion(cedula: string): number {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  
  // Asegurarnos que sea solo números
  if (!/^\d+$/.test(cedula)) {
    throw new Error('La cédula debe contener solo números.');
  }

  let suma = 0;
  const cedulaReversa = cedula.split('').reverse();

  for (let i = 0; i < cedulaReversa.length; i++) {
    const digito = parseInt(cedulaReversa[i], 10);
    suma += digito * pesos[i];
  }

  const resto = suma % 11;
  let digitoVerificacion = 0;

  if (resto === 0 || resto === 1) {
    digitoVerificacion = resto;
  } else {
    digitoVerificacion = 11 - resto;
  }

  return digitoVerificacion;
}

export function supportDocumentPlemsiMapper(bill: any, entityData: EntityDataForPlemsi): SupportDocumentPlemsi {
  return {
    date: bill.date ?? '',
    time: "12:21:00",
    prefix: prefixPlemsi,
    number: bill.number ?? 0,
    seller: {
      identification_number: bill.third.document ?? '',
      dv: calcularDigitoVerificacion(bill.third.document).toString(), // TODO: HARDCODEO DV PORQUE ACTUALMENTE PERSONAS NATURALES NO GUARDAMOS DV, DEFINIR ESTRATEGIA
      name: (bill.third.name !== undefined ? `${bill.third.name} ${bill.third.lastname}` : bill.third.businessName) ?? '',
      phone: bill.third.phone ?? '',
      address: bill.third.address ?? '',
      email: bill.third.email ?? '',
      merchant_registration: bill.merchantRegistration ?? "00000000",
      type_document_identification_id: 6, // PARA DOCUMENTO SOPORTE DEBE SER 6 NIT
      type_organization_id: Number(bill.third.organizationType.code) ?? 0,
      type_liability_id: Number(bill.third.liabilityType.code) ?? 0,
      municipality_id: Number(bill.third.city?.code) ?? 0,
      type_regime_id: Number(bill.third.regimeType.code),
      postal_zone_code: bill.postalZoneCode ?? ''
    },
    payment: {
      payment_form_id: Number(bill.wayToPay.code) ?? 0,
      payment_method_id: Number(bill.paymentMethod.code) ?? 0,
      payment_due_date: bill.paymentDueDate ?? '',
      duration_measure: bill.durationMeasure ?? '30'
    },
    items: itemsPlemsiMapper(bill.items, bill.date),
    resolution: entityData.resolution,
    resolutionText: entityData.resolutionText,
    head_note: bill.note ?? '',
    allowanceTotal: 0,
    invoiceBaseTotal: toPlemsiAmount(bill.total),
    invoiceTaxExclusiveTotal: toPlemsiAmount(bill.total),
    invoiceTaxInclusiveTotal: toPlemsiAmount(bill.totalToPay),
    totalToPay: toPlemsiAmount(bill.totalToPay),
    allHoldingsTaxTotals: taxesPlemsiMapper(bill.holdingTaxes ?? []),
    allTaxTotals: taxesPlemsiMapper(bill.taxes ?? [])
  }
}

export function itemsPlemsiMapper(items: Item[], date: string) : ItemPlemsi[] {
  let response : ItemPlemsi[] = []

  items.forEach(item => {
    response.push({
      unit_measure_id: Number(item.unitMeasure?.code) ?? 0,
      line_extension_amount: toPlemsiAmount(item.total),
      free_of_charge_indicator: false,
      description: item.description ?? '',
      code: item.code ?? '',
      type_item_identification_id: Number(item.itemType.code) ?? 0,
      price_amount: toPlemsiAmount(item.price),
      base_quantity: Number(item.quantity) ?? 0,
      invoiced_quantity: Number(item.quantity) ?? 0,
      tax_totals: taxesPlemsiMapper(item.taxes),
      brandname: 'NA',
      modelname: 'NA',
      start_date: date,
      type_generation_transmition_id: 1
    })
  })

  return response
}

export function taxesPlemsiMapper(taxes: Tax[]): TaxPlemsi[] {
  let response : TaxPlemsi[] = []
  taxes.forEach(tax => {
    response.push({
      tax_id: Number(tax.code) ?? 0,
      percent: Number(tax.percent) ?? 0,
      tax_amount: toPlemsiAmount(tax.taxAmount),
      taxable_amount: toPlemsiAmount(tax.taxableAmount)
    })
  })

  return response
}
