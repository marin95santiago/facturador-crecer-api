import path from 'path'
import * as dotenv from 'dotenv'
import { ElectronicBill, ElectronicBillPlemsi, Item, ItemPlemsi, Tax, TaxPlemsi } from "../../entities/ElectronicBill.entity";
import { toPlemsiAmount } from '../../services/utils/money.helper';

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

const prefixPlemsi = process.env.PREFIX_PLEMSI ?? 'SETT'

interface EntityDataForPlemsi {
  resolution: string
  resolutionText: string
  prefix?: string
}

export function electronicBillPlemsiMapper(bill: ElectronicBill, entityData: EntityDataForPlemsi): ElectronicBillPlemsi {
  return {
    date: bill.date ?? '',
    time: "12:21:00",
    prefix: entityData.prefix ?? prefixPlemsi,
    number: bill.number ?? 0,
    orderReference: {
      id_order: bill.orderReference
    },
    send_email: true,
    customer: {
      identification_number: bill.third.document ?? '',
      dv: bill.third.dv ?? undefined,
      name: (bill.third.name !== undefined ? `${bill.third.name} ${bill.third.lastname}` : bill.third.businessName) ?? '',
      phone: bill.third.phone ?? '',
      address: bill.third.address ?? '',
      email: bill.third.email ?? '',
      type_document_identification_id: Number(bill.third.documentType.code) ?? 0,
      type_organization_id: Number(bill.third.organizationType.code) ?? 0,
      type_liability_id: Number(bill.third.liabilityType.code) ?? 0,
      municipality_id: Number(bill.third.city?.code) ?? 0,
      type_regime_id: Number(bill.third.regimeType.code)
    },
    payment: {
      payment_form_id: Number(bill.wayToPay.code) ?? 0,
      payment_method_id: Number(bill.paymentMethod.code) ?? 0,
      payment_due_date: bill.paymentDueDate ?? '',
      duration_measure: Number(bill.wayToPay.code) === 1 ? undefined : "30"
    },
    items: itemsPlemsiMapper(bill.items),
    resolution: entityData.resolution,
    resolutionText: entityData.resolutionText,
    notes: bill.note ?? '',
    invoiceBaseTotal: toPlemsiAmount(bill.total),
    invoiceTaxExclusiveTotal: toPlemsiAmount(bill.total),
    invoiceTaxInclusiveTotal: toPlemsiAmount(bill.totalToPay),
    allTaxTotals: taxesPlemsiMapper(bill.taxes),
    totalToPay: toPlemsiAmount(bill.totalToPay),
    finalTotalToPay: toPlemsiAmount(bill.totalToPay)
  }
}

export function itemsPlemsiMapper(items: Item[]) : ItemPlemsi[] {
  let response : ItemPlemsi[] = []

  items.forEach(item => {
    const plemsiItem: ItemPlemsi = {
      unit_measure_id: Number(item.unitMeasure?.code) ?? 0,
      line_extension_amount: toPlemsiAmount(item.total),
      free_of_charge_indicator: false,
      description: item.description ?? '',
      code: item.code ?? '',
      type_item_identification_id: Number(item.itemType.code) ?? 0,
      price_amount: toPlemsiAmount(item.price),
      base_quantity: Number(item.quantity) ?? 0,
      invoiced_quantity: Number(item.quantity) ?? 0,
      tax_totals: taxesPlemsiMapper(item.taxes)
    }

    const detailedDescription = item.detailedDescription?.trim()
    if (detailedDescription !== undefined && detailedDescription !== '') {
      plemsiItem.notes = detailedDescription
    }

    response.push(plemsiItem)
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

/*
export function electronicBillMapper(bill: any) : ElectronicBill {
  return {
    entityId: bill.entityId,
    userId: bill.userId,
    number: Number(bill.number),
    preview: bill.preview,
    date: bill.date,
    orderReference: bill.orderReference,
    third: {
      entityId: bill.third.entityId,
      document: bill.third.document,
      dv: bill.third.dv,
      documentType: {
        code: bill.third.documentType.code,
        description: bill.documentType.description
      },
      organizationType: {
        code: bill.third.organizationType.code,
        description: bill.third.organizationType.description
      },
      liabilityType: {
        code: bill.third.liabilityType.code,
        description: bill.third.liabilityType.description
      },
      regimeType: {
        code: bill.third.regimeType.code,
        description: bill.third.regimeType.description
      },
      name: bill.third.name ?? undefined,
      lastname: bill.third.lastname ?? undefined,
      businessName: bill.third.businessName ?? undefined,
      phone: bill.third.phone,
      address: bill.third.address,
      city: {
        code: bill.third.city.code,
        description: bill.third.city.description
      },
      email: bill.third.email
    },
    wayToPay: { code: Number(bill.wayToPay.code), description: bill.wayToPay.description},
    paymentMethod: { code: Number(bill.paymentMethod.code), description: bill.paymentMethod.description},
    paymentDueDate: bill.paymentDueDate,
    municipality: { code: string, description: string }
    note: string
    items: Item[]
    taxes: Tax[]
    total: number
    totalTaxes: number
    totalToPay: number
  }
}
*/