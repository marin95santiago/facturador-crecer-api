import { Third } from "./Third.entity"

export interface TaxPlemsi {
  tax_id: number
  percent: number
  tax_amount: number
  taxable_amount: number
}

export interface Tax {
  code: string
  description: string
  percent: number
  taxAmount: number
  taxableAmount: number
}

export interface ItemPlemsi {
  unit_measure_id: number
  line_extension_amount: number
  free_of_charge_indicator: boolean
  description: string
  code: string
  type_item_identification_id: number
  price_amount: number
  base_quantity: number
  invoiced_quantity: number
  tax_totals: TaxPlemsi[]
  notes?: string
  brandname?: string
  modelname?: string
  start_date?: string
  type_generation_transmition_id?: number
}

export interface Item {
  unitMeasure?: { code: number, description: string }
  description?: string
  detailedDescription?: string
  code?: string
  itemType: {
    code: string
    description: string
  }
  price: number
  quantity: number
  total: number
  taxes: Tax[]
}

export interface ElectronicBillPlemsi {
  date: string
  time: string
  prefix: string
  number: number
  orderReference: {
    id_order: string
  }
  send_email: boolean
  customer: {
    identification_number: string
    dv?: string
    name: string
    phone: string
    address: string
    email: string
    type_document_identification_id: number
    type_organization_id: number
    type_liability_id: number
    municipality_id: number
    type_regime_id: number
  }
  payment: {
    payment_form_id: number
    payment_method_id: number
    payment_due_date: string
    duration_measure?: string
  }
  items: ItemPlemsi[]
  resolution: string
  resolutionText: string
  notes: string
  invoiceBaseTotal: number
  invoiceTaxExclusiveTotal: number
  invoiceTaxInclusiveTotal: number
  allTaxTotals: TaxPlemsi[]
  totalToPay: number
  finalTotalToPay: number
}

export interface ElectronicBill {
  entityId?: string
  userId?: string
  number?: number
  preview?: string
  date: string
  orderReference: string
  third: Third
  wayToPay: { code: string, description: string}
  paymentMethod: { code: string, description: string}
  paymentDueDate: string
  municipality: { code: string, description: string }
  note: string
  items: Item[]
  taxes: Tax[]
  total: number
  totalTaxes: number
  totalToPay: number
}