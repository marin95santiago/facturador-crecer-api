import { Entity as Company } from '../../../domain/entities/Entity.entity';
import QRCode from 'qrcode';

const PREFIX_SUPPORT_DOCUMENT_PLEMSI = process.env.PREFIX_SUPPORT_DOCUMENT_PLEMSI || 'DS';

// Enums para formas y métodos de pago
export enum PaymentForm {
  CONTADO = 1,
  CREDITO = 2
}

export enum PaymentMethod {
  EFECTIVO = 10,
  CONSIGNACION_BANCARIA = 42,
}

// Función para convertir números a letras (versión simple)
const numberToWords = (num: number): string => {
  const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  
  if (num === 0) return 'cero';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' y ' + ones[one] : '');
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return (hundred === 1 ? 'ciento' : ones[hundred] + 'cientos') + 
           (remainder > 0 ? ' ' + numberToWords(remainder) : '');
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    return numberToWords(thousand) + ' mil' + 
           (remainder > 0 ? ' ' + numberToWords(remainder) : '');
  }
  return 'número muy grande';
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Función para formatear moneda
const formatCurrency = (amount: number | string): string => {
  const num = parseFloat(amount.toString());
  return `$ ${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Función para formatear hora
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

// Función para generar código QR como base64
const generateQRCodeBase64 = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generando QR Code:', error);
    return '';
  }
};

// Función para obtener el nombre de la forma de pago
const getPaymentFormName = (paymentFormId: number): string => {
  switch (paymentFormId) {
    case PaymentForm.CONTADO:
      return 'Contado';
    case PaymentForm.CREDITO:
      return 'Crédito';
    default:
      return 'No especificado';
  }
};

// Función para obtener el nombre del método de pago
const getPaymentMethodName = (paymentMethodId: number): string => {
  switch (paymentMethodId) {
    case PaymentMethod.EFECTIVO:
      return 'Efectivo';
    case PaymentMethod.CONSIGNACION_BANCARIA:
      return 'Consignación Bancaria';
    default:
      return 'No especificado';
  }
};

// Función para obtener el nombre del impuesto por ID
const getTaxNameById = (taxId: number): string => {
  switch (taxId) {
    case 1:
      return 'IVA';
    case 2:
      return 'IC';
    case 3:
      return 'ICA';
    case 4:
      return 'RETEIVA';
    case 5:
      return 'RETEIC';
    case 6:
      return 'RETEICA';
    case 7:
      return 'RETEIVA_SERVICIOS';
    case 8:
      return 'RETEIC_SERVICIOS';
    case 9:
      return 'RETEICA_SERVICIOS';
    case 10:
      return 'RETEIVA_COMISIONES';
    case 11:
      return 'RETEIC_COMISIONES';
    case 12:
      return 'RETEICA_COMISIONES';
    case 13:
      return 'RETEIVA_HONORARIOS';
    case 14:
      return 'RETEIC_HONORARIOS';
    case 15:
      return 'RETEICA_HONORARIOS';
    case 16:
      return 'RETEIVA_ARRIENDOS';
    case 17:
      return 'RETEIC_ARRIENDOS';
    case 18:
      return 'RETEICA_ARRIENDOS';
    case 19:
      return 'SIN_IMPUESTO';
    default:
      return 'IMPUESTO_DESCONOCIDO';
  }
};

/**
 * Genera el HTML para la factura electrónica
 * @param responseData - Datos de la factura electrónica desde Plemsi
 * @param company - Información de la empresa desde la base de datos
 * @returns HTML string de la factura
 */
export const generateElectronicInvoiceHTML = async (responseData: any, company: Company): Promise<string> => {
  // Extraer los datos de la factura desde la respuesta de Plemsi
  const invoice = responseData.data || responseData;
  
  // Datos del emisor (empresa) - usar información real de la empresa
  const companyName = company.name;
  const companyId = company.document;
  const companyAddress = company.address ? `${company.address.description}, ${company.address.city.description}` : 'N/A';
  const companyPhone = company.phone;
  const companyEmail = company.email;

  // Datos del cliente
  const customerName = invoice.customer?.name || 'Cliente no especificado';
  const customerId = invoice.customer?.identification_number || 'N/A';
  const customerAddress = invoice.customer?.address || 'N/A';
  const customerEmail = invoice.customer?.email || 'N/A';
  const customerPhone = invoice.customer?.phone || 'N/A';

  // Datos de la factura
  const invoiceNumber = `${invoice.prefix || ''} ${invoice.number || ''}`.trim();
  const resolution = invoice.resolutionText || company.resolutionText || 'N/A';
  const issueDate = formatDate(invoice.date || new Date().toISOString());
  const issueTime = formatTime(invoice.time || '00:00');
  const cude = invoice.cude || 'N/A';
  const consecutive = invoice.consecutive || 'N/A';

  // Totales
  const subtotal = formatCurrency(invoice.legal_monetary_totals?.line_extension_amount || 0);
  const taxBase = formatCurrency(invoice.legal_monetary_totals?.tax_exclusive_amount || 0);
  const iva = formatCurrency(
    (parseFloat(invoice.legal_monetary_totals?.tax_inclusive_amount || '0') - 
     parseFloat(invoice.legal_monetary_totals?.tax_exclusive_amount || '0'))
  );
  const total = formatCurrency(invoice.legal_monetary_totals?.payable_amount || 0);

  // Convertir total a letras
  const totalAmount = parseFloat(invoice.legal_monetary_totals?.payable_amount || '0');
  const totalInWords = numberToWords(Math.floor(totalAmount)) + ' pesos colombianos';

  // Información de pago
  const paymentForm = invoice.payment_form?.[0] || invoice.payment_form;
  const paymentFormName = paymentForm ? getPaymentFormName(paymentForm.payment_form_id) : 'No especificado';
  const paymentMethodName = paymentForm ? getPaymentMethodName(paymentForm.payment_method_id) : 'No especificado';

  // Estado de envío de email
  const emailStatus = invoice.emailDeliveryStatus;
  const emailNotification = invoice.sendEmailNotification;

  // Manejo de errores
  const hasError = invoice.response?.data?.ErrorMessage?.string;
  const errorMessage = hasError ? (Array.isArray(hasError) ? hasError.join(', ') : hasError) : null;

  // Estado de la factura
  const status = invoice.state;
  const isValid = invoice.response?.data?.IsValid === 'true';

  // Notas de la factura
  const notes = invoice.notes || '';

  // Código QR
  const qrString = invoice.QRStr || '';
  const qrCodeBase64 = qrString ? await generateQRCodeBase64(qrString) : '';

  // Generar filas de productos desde invoice_lines
  const invoiceLines = invoice.invoice_lines || [];
  const productRows = invoiceLines.map((line: any, index: number) => {
    const quantity = line.invoiced_quantity || '0';
    const unitPrice = formatCurrency(line.price_amount || 0);
    const lineTotal = formatCurrency(line.line_extension_amount || 0);
    
    // Usar el nombre del producto desde invoice_lines.description
    const productName = line.description || 'Producto/Servicio';
    const code = line.code || `ITEM-${String(index + 1).padStart(3, '0')}`;
    
    // Obtener información de impuestos
    const taxInfo = line.tax_totals?.[0];
    const taxAmount = formatCurrency(taxInfo?.tax_amount || 0);
    const taxId = taxInfo?.tax_id;
    const taxName = taxId ? getTaxNameById(taxId) : 'N/A';
    const taxPercent = taxInfo?.percent ? `${taxInfo.percent}%` : '';
    
    return `
      <tr>
        <td>${code}</td>
        <td><strong>${productName}</strong></td>
        <td>UN</td>
        <td>${quantity}</td>
        <td>${unitPrice}</td>
        <td>${taxName} ${taxPercent}<br/>${taxAmount}</td>
        <td>${lineTotal}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura Electrónica De Venta ${invoiceNumber}</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .company-info h1 {
          font-size: 16px;
          margin-bottom: 4px;
          color: #1e3a8a;
        }
        .company-details {
          font-size: 10px;
          color: #444;
          line-height: 1.2;
        }
        .company-details p {
          margin: 1px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 14px;
          font-weight: bold;
        }
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          margin-top: 2px;
          color: #111827;
        }
        .resolution {
          font-size: 10px;
          color: #666;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .party-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
        }
        .party-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .party-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .items-table th, .items-table td {
          border: 1px solid #444;
          padding: 4px;
        }
        .items-table th {
          background: #e5e7eb;
          font-weight: bold;
          text-align: center;
        }
        .items-table td {
          text-align: center;
        }
        .totals {
          width: 240px;
          margin-left: auto;
          font-size: 11px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #ccc;
          padding: 3px 0;
        }
        .total-row.final {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
          background: #f3f4f6;
        }
        .total-in-words {
          margin-top: 8px;
          font-style: italic;
          font-size: 10px;
          color: #444;
        }
        .cude-section {
          border: 1px solid #ccc;
          padding: 6px;
          margin-top: 12px;
          font-size: 9px;
          word-break: break-word;
        }
        .footer {
          margin-top: 12px;
          font-size: 9px;
          color: #555;
          border-top: 1px solid #ccc;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <div class="company-details">
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone} | Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">FACTURA ELECTRÓNICA DE VENTA</div>
            <div class="invoice-number">${invoiceNumber}</div>
            <div class="resolution">${resolution}</div>
            <div style="font-size: 11px; color: #555;">
              ${issueDate} ${issueTime}
            </div>
          </div>
        </div>

        <div class="parties">
          <div class="party-section">
            <h3>Emisor</h3>
            <div class="party-info">
              <p><strong>${companyName}</strong></p>
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone}</p>
              <p>Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="party-section">
            <h3>Adquiriente</h3>
            <div class="party-info">
              <p><strong>${customerName}</strong></p>
              <p>Identificación: ${customerId}</p>
              <p>Dirección: ${customerAddress}</p>
              <p>Teléfono: ${customerPhone}</p>
              <p>Email: ${customerEmail}</p>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>U/M</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Impuestos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>SUBTOTAL:</span><span>${subtotal}</span></div>
          <div class="total-row"><span>BASE IMPUESTOS:</span><span>${taxBase}</span></div>
          <div class="total-row"><span>IVA:</span><span>${iva}</span></div>
          <div class="total-row final"><span>TOTAL:</span><span>${total}</span></div>
        </div>

        <div class="total-in-words"><strong>Total en letras:</strong> ${totalInWords}</div>
        <div class="total-in-words"><strong>Forma y método de pago:</strong> ${paymentFormName} - ${paymentMethodName}</div>

        ${notes ? `
        <div class="cude-section">
          <div><strong>NOTAS:</strong></div>
          <div>${notes}</div>
        </div>
        ` : ''}

        <div class="cude-section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div><strong>CUDE/CUFE:</strong></div>
              <div>${cude}</div>
            </div>
            ${qrCodeBase64 ? `
            <div style="margin-left: 12px; background-color: #f9f9f9; padding: 4px; border: 1px dashed #999;">
              <img src="${qrCodeBase64}" alt="Código QR" style="width: 100px; height: 100px; border: 1px solid #333; display: block; background: white;" />
            </div>
            ` : ''}
          </div>
        </div>

        <div style="margin-top: 8px; padding: 4px; background-color: #f7fafc; border-radius: 4px;">
          <div style="font-size: 9px; color: #4a5568;">
            <strong>Estado:</strong> ${status} | 
            <strong>Válida:</strong> ${isValid ? 'Sí' : 'No'} | 
            <strong>Email:</strong> ${emailStatus || 'N/A'}
          </div>
        </div>

        <div class="footer">
          Este documento es una representación impresa de la factura electrónica de venta.  
          Consulte el CUDE/CUFE en la DIAN para verificar su validez.
        </div>
        
        <!-- Espaciador para evitar cortes -->
        <div style="height: 20px;"></div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Genera el HTML para el documento soporte electrónico
 * @param responseData - Datos del documento soporte desde Plemsi
 * @param company - Información de la empresa desde la base de datos
 * @returns HTML string del documento soporte
 */
export const generateElectronicSupportDocumentHTML = async (responseData: any, company: Company): Promise<string> => {
  // Extraer los datos del documento soporte desde la respuesta de Plemsi
  const supportDocument = responseData.data || responseData;
  
  // Datos del emisor (empresa) - usar información real de la empresa
  const companyName = company.name;
  const companyId = company.document;
  const companyAddress = company.address ? `${company.address.description}, ${company.address.city.description}` : 'N/A';
  const companyPhone = company.phone;
  const companyEmail = company.email;

  // Datos del vendedor (seller) - información del tercero
  const sellerName = supportDocument.seller?.name || 'Vendedor no especificado';
  const sellerId = supportDocument.seller?.identification_number || 'N/A';
  const sellerAddress = supportDocument.seller?.address || 'N/A';
  const sellerEmail = supportDocument.seller?.email || 'N/A';
  const sellerPhone = supportDocument.seller?.phone || 'N/A';

  // Datos del documento soporte
  const documentNumber = `${supportDocument.prefix || PREFIX_SUPPORT_DOCUMENT_PLEMSI} ${supportDocument.number || ''}`.trim();
  const resolution = supportDocument.resolutionText || company.resolutionTextDS || 'N/A';
  const issueDate = formatDate(supportDocument.date || new Date().toISOString());
  const issueTime = formatTime(supportDocument.time || '00:00');
  const cude = supportDocument.cude || 'N/A';
  const consecutive = supportDocument.consecutive || 'N/A';

  // Totales
  const subtotal = formatCurrency(supportDocument.legal_monetary_totals?.line_extension_amount || 0);
  const taxBase = formatCurrency(supportDocument.legal_monetary_totals?.tax_exclusive_amount || 0);
  const iva = formatCurrency(
    (parseFloat(supportDocument.legal_monetary_totals?.tax_inclusive_amount || '0') - 
     parseFloat(supportDocument.legal_monetary_totals?.tax_exclusive_amount || '0'))
  );
  const total = formatCurrency(supportDocument.legal_monetary_totals?.payable_amount || 0);

  // Convertir total a letras
  const totalAmount = parseFloat(supportDocument.legal_monetary_totals?.payable_amount || '0');
  const totalInWords = numberToWords(Math.floor(totalAmount)) + ' pesos colombianos';

  // Información de pago
  const paymentForm = supportDocument.payment_form;
  const paymentFormName = paymentForm ? getPaymentFormName(paymentForm.payment_form_id) : 'No especificado';
  const paymentMethodName = paymentForm ? getPaymentMethodName(paymentForm.payment_method_id) : 'No especificado';

  // Estado del documento
  const status = supportDocument.state;

  // Notas del documento
  const notes = supportDocument.notes || '';
  const headNote = supportDocument.head_note || '';
  const footNote = supportDocument.foot_note || '';

  // Código QR
  const qrString = supportDocument.QRStr || '';
  const qrCodeBase64 = qrString ? await generateQRCodeBase64(qrString) : '';

  // Generar filas de productos desde invoice_lines
  const invoiceLines = supportDocument.invoice_lines || [];
  const productRows = invoiceLines.map((line: any, index: number) => {
    const quantity = line.invoiced_quantity || '0';
    const unitPrice = formatCurrency(line.price_amount || 0);
    const lineTotal = formatCurrency(line.line_extension_amount || 0);
    
    // Usar el nombre del producto desde invoice_lines.description
    const productName = line.description || 'Producto/Servicio';
    const code = line.code || `ITEM-${String(index + 1).padStart(3, '0')}`;
    
    // Obtener información de impuestos
    const taxInfo = line.tax_totals?.[0];
    const taxAmount = formatCurrency(taxInfo?.tax_amount || 0);
    const taxId = taxInfo?.tax_id;
    const taxName = taxId ? getTaxNameById(taxId) : 'N/A';
    const taxPercent = taxInfo?.percent ? `${taxInfo.percent}%` : '';
    
    return `
      <tr>
        <td>${code}</td>
        <td><strong>${productName}</strong></td>
        <td>UN</td>
        <td>${quantity}</td>
        <td>${unitPrice}</td>
        <td>${taxName} ${taxPercent}<br/>${taxAmount}</td>
        <td>${lineTotal}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Documento Soporte Electrónico ${documentNumber}</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .company-info h1 {
          font-size: 16px;
          margin-bottom: 4px;
          color: #1e3a8a;
        }
        .company-details {
          font-size: 10px;
          color: #444;
          line-height: 1.2;
        }
        .company-details p {
          margin: 1px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 14px;
          font-weight: bold;
        }
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          margin-top: 2px;
          color: #111827;
        }
        .resolution {
          font-size: 10px;
          color: #666;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .party-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
        }
        .party-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .party-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .items-table th, .items-table td {
          border: 1px solid #444;
          padding: 4px;
        }
        .items-table th {
          background: #e5e7eb;
          font-weight: bold;
          text-align: center;
        }
        .items-table td {
          text-align: center;
        }
        .totals {
          width: 240px;
          margin-left: auto;
          font-size: 11px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #ccc;
          padding: 3px 0;
        }
        .total-row.final {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
          background: #f3f4f6;
        }
        .total-in-words {
          margin-top: 8px;
          font-style: italic;
          font-size: 10px;
          color: #444;
        }
        .cude-section {
          border: 1px solid #ccc;
          padding: 6px;
          margin-top: 12px;
          font-size: 9px;
          word-break: break-word;
        }
        .footer {
          margin-top: 12px;
          font-size: 9px;
          color: #555;
          border-top: 1px solid #ccc;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <div class="company-details">
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone} | Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">DOCUMENTO SOPORTE ELECTRÓNICO</div>
            <div class="invoice-number">${documentNumber}</div>
            <div class="resolution">${resolution}</div>
            <div style="font-size: 11px; color: #555;">
              ${issueDate} ${issueTime}
            </div>
          </div>
        </div>

        <div class="parties">
          <div class="party-section">
            <h3>Adquiriente</h3>
            <div class="party-info">
              <p><strong>${companyName}</strong></p>
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone}</p>
              <p>Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="party-section">
            <h3>Vendedor</h3>
            <div class="party-info">
              <p><strong>${sellerName}</strong></p>
              <p>Identificación: ${sellerId}</p>
              <p>Dirección: ${sellerAddress}</p>
              <p>Teléfono: ${sellerPhone}</p>
              <p>Email: ${sellerEmail}</p>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>U/M</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Impuestos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>SUBTOTAL:</span><span>${subtotal}</span></div>
          <div class="total-row"><span>BASE IMPUESTOS:</span><span>${taxBase}</span></div>
          <div class="total-row"><span>IVA:</span><span>${iva}</span></div>
          <div class="total-row final"><span>TOTAL:</span><span>${total}</span></div>
        </div>

        <div class="total-in-words"><strong>Total en letras:</strong> ${totalInWords}</div>
        <div class="total-in-words"><strong>Forma y método de pago:</strong> ${paymentFormName} - ${paymentMethodName}</div>

        ${headNote ? `
        <div class="cude-section">
          <div><strong>NOTA DE ENCABEZADO:</strong></div>
          <div>${headNote}</div>
        </div>
        ` : ''}

        ${notes ? `
        <div class="cude-section">
          <div><strong>NOTAS:</strong></div>
          <div>${notes}</div>
        </div>
        ` : ''}

        ${footNote ? `
        <div class="cude-section">
          <div><strong>NOTA DE PIE:</strong></div>
          <div>${footNote}</div>
        </div>
        ` : ''}

        <div class="cude-section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div><strong>CUDE/CUFE:</strong></div>
              <div>${cude}</div>
            </div>
            ${qrCodeBase64 ? `
            <div style="margin-left: 12px; background-color: #f9f9f9; padding: 4px; border: 1px dashed #999;">
              <img src="${qrCodeBase64}" alt="Código QR" style="width: 100px; height: 100px; border: 1px solid #333; display: block; background: white;" />
            </div>
            ` : ''}
          </div>
        </div>

        <div style="margin-top: 8px; padding: 4px; background-color: #f7fafc; border-radius: 4px;">
          <div style="font-size: 9px; color: #4a5568;">
            <strong>Estado:</strong> ${status} | 
            <strong>Consecutivo:</strong> ${consecutive}
          </div>
        </div>

        <div class="footer">
          Representación gráfica de la factura electrónica de venta. Esta factura se asimila en todos sus efectos legales a un título valor según ley 1231 de julio 17 de 2008.
          Consulte el CUDE/CUFE en la DIAN para verificar su validez.
        </div>
        
        <!-- Espaciador para evitar cortes -->
        <div style="height: 20px;"></div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Genera el HTML para la nota crédito electrónica
 * @param responseData - Datos de la nota crédito desde Plemsi
 * @param company - Información de la entidad
 * @returns HTML string de la nota crédito
 */
export const generateElectronicCreditNoteHTML = async (responseData: any, company: Company): Promise<string> => {
  const creditNote = responseData.data || responseData;

  const companyName = company.name;
  const companyId = company.document;
  let companyAddress = 'N/A';
  if (company.address) {
    companyAddress = `${company.address.description}, ${company.address.city.description}`;
  }
  const companyPhone = company.phone;
  const companyEmail = company.email;

  const customerName = creditNote.customer?.name || 'Cliente no especificado';
  const customerId = creditNote.customer?.identification_number || 'N/A';
  const customerAddress = creditNote.customer?.address || 'N/A';
  const customerEmail = creditNote.customer?.email || 'N/A';
  const customerPhone = creditNote.customer?.phone || 'N/A';

  const documentNumber = `${creditNote.prefix || ''} ${creditNote.number || ''}`.trim();
  let resolution = 'N/A';
  if (creditNote.resolutionText) {
    resolution = creditNote.resolutionText;
  } else if (company.resolutionTextNC) {
    resolution = company.resolutionTextNC;
  }
  const issueDate = formatDate(creditNote.date || new Date().toISOString());
  const issueTime = formatTime(creditNote.time || '00:00');
  const cude = creditNote.cude || 'N/A';
  const consecutive = creditNote.consecutive || 'N/A';

  const billingReferenceNumber = creditNote.billing_reference?.number || 'N/A';
  const billingReferenceDate = creditNote.billing_reference?.issue_date || 'N/A';
  const discrepancyDescription = creditNote.discrepancyresponsedescription || 'N/A';

  const subtotal = formatCurrency(creditNote.legal_monetary_totals?.line_extension_amount || 0);
  const taxBase = formatCurrency(creditNote.legal_monetary_totals?.tax_exclusive_amount || 0);
  const iva = formatCurrency(
    (parseFloat(creditNote.legal_monetary_totals?.tax_inclusive_amount || '0') -
     parseFloat(creditNote.legal_monetary_totals?.tax_exclusive_amount || '0'))
  );
  const total = formatCurrency(creditNote.legal_monetary_totals?.payable_amount || 0);

  const totalAmount = parseFloat(creditNote.legal_monetary_totals?.payable_amount || '0');
  const totalInWords = numberToWords(Math.floor(totalAmount)) + ' pesos colombianos';

  const status = creditNote.state;
  const isValid = creditNote.response?.data?.IsValid === 'true';
  const emailStatus = creditNote.emailDeliveryStatus;

  const notes = creditNote.notes || '';
  const headNote = creditNote.head_note || '';
  const footNote = creditNote.foot_note || '';
  const techProviderFootNote = creditNote.techProviderDefaultFootNote || '';

  const qrString = creditNote.QRStr || '';
  let qrCodeBase64 = '';
  if (qrString) {
    qrCodeBase64 = await generateQRCodeBase64(qrString);
  }

  const creditNoteLines = creditNote.credit_note_lines || [];
  const productRows = creditNoteLines.map((line: any, index: number) => {
    const quantity = line.invoiced_quantity || '0';
    const unitPrice = formatCurrency(line.price_amount || 0);
    const lineTotal = formatCurrency(line.line_extension_amount || 0);
    const productName = line.description || 'Producto/Servicio';
    const code = line.code || `ITEM-${String(index + 1).padStart(3, '0')}`;
    const lineNotes = line.notes || '';

    const taxInfo = line.tax_totals?.[0];
    const taxAmount = formatCurrency(taxInfo?.tax_amount || 0);
    const taxId = taxInfo?.tax_id;
    let taxName = 'N/A';
    if (taxId) {
      taxName = getTaxNameById(taxId);
    }
    let taxPercent = '';
    if (taxInfo?.percent) {
      taxPercent = `${taxInfo.percent}%`;
    }

    let notesHtml = '';
    if (lineNotes) {
      notesHtml = `<br/><span style="font-size: 9px; color: #666;">${lineNotes}</span>`;
    }

    return `
      <tr>
        <td>${code}</td>
        <td><strong>${productName}</strong>${notesHtml}</td>
        <td>UN</td>
        <td>${quantity}</td>
        <td>${unitPrice}</td>
        <td>${taxName} ${taxPercent}<br/>${taxAmount}</td>
        <td>${lineTotal}</td>
      </tr>
    `;
  }).join('');

  let footerText = 'Esta es una representación impresa de la nota crédito electrónica. Consulte el CUDE en la DIAN para verificar su validez.';
  if (techProviderFootNote) {
    footerText = techProviderFootNote;
  }

  let headNoteSection = '';
  if (headNote) {
    headNoteSection = `
        <div class="cude-section">
          <div><strong>NOTA DE ENCABEZADO:</strong></div>
          <div>${headNote}</div>
        </div>
        `;
  }

  let notesSection = '';
  if (notes) {
    notesSection = `
        <div class="cude-section">
          <div><strong>NOTAS:</strong></div>
          <div>${notes}</div>
        </div>
        `;
  }

  let footNoteSection = '';
  if (footNote) {
    footNoteSection = `
        <div class="cude-section">
          <div><strong>NOTA DE PIE:</strong></div>
          <div>${footNote}</div>
        </div>
        `;
  }

  let qrSection = '';
  if (qrCodeBase64) {
    qrSection = `
            <div style="margin-left: 12px; background-color: #f9f9f9; padding: 4px; border: 1px dashed #999;">
              <img src="${qrCodeBase64}" alt="Código QR" style="width: 100px; height: 100px; border: 1px solid #333; display: block; background: white;" />
            </div>
            `;
  }

  let isValidLabel = 'No';
  if (isValid) {
    isValidLabel = 'Sí';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Nota Crédito Electrónica ${documentNumber}</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .company-info h1 {
          font-size: 16px;
          margin-bottom: 4px;
          color: #1e3a8a;
        }
        .company-details {
          font-size: 10px;
          color: #444;
          line-height: 1.2;
        }
        .company-details p {
          margin: 1px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 14px;
          font-weight: bold;
        }
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          margin-top: 2px;
          color: #111827;
        }
        .resolution {
          font-size: 10px;
          color: #666;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .party-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
        }
        .party-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .party-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .reference-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .reference-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .items-table th, .items-table td {
          border: 1px solid #444;
          padding: 4px;
        }
        .items-table th {
          background: #e5e7eb;
          font-weight: bold;
          text-align: center;
        }
        .items-table td {
          text-align: center;
        }
        .totals {
          width: 240px;
          margin-left: auto;
          font-size: 11px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #ccc;
          padding: 3px 0;
        }
        .total-row.final {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
          background: #f3f4f6;
        }
        .total-in-words {
          margin-top: 8px;
          font-style: italic;
          font-size: 10px;
          color: #444;
        }
        .cude-section {
          border: 1px solid #ccc;
          padding: 6px;
          margin-top: 12px;
          font-size: 9px;
          word-break: break-word;
        }
        .footer {
          margin-top: 12px;
          font-size: 9px;
          color: #555;
          border-top: 1px solid #ccc;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <div class="company-details">
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone} | Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">NOTA CRÉDITO ELECTRÓNICA</div>
            <div class="invoice-number">${documentNumber}</div>
            <div class="resolution">Resolución: ${resolution}</div>
            <div style="font-size: 11px; color: #555;">
              ${issueDate} ${issueTime}
            </div>
          </div>
        </div>

        <div class="parties">
          <div class="party-section">
            <h3>Emisor</h3>
            <div class="party-info">
              <p><strong>${companyName}</strong></p>
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone}</p>
              <p>Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="party-section">
            <h3>Adquiriente</h3>
            <div class="party-info">
              <p><strong>${customerName}</strong></p>
              <p>Identificación: ${customerId}</p>
              <p>Dirección: ${customerAddress}</p>
              <p>Teléfono: ${customerPhone}</p>
              <p>Email: ${customerEmail}</p>
            </div>
          </div>
        </div>

        <div class="reference-section">
          <h3>Documento de referencia</h3>
          <p><strong>Factura afectada:</strong> ${billingReferenceNumber}</p>
          <p><strong>Fecha factura:</strong> ${billingReferenceDate}</p>
          <p><strong>Motivo:</strong> ${discrepancyDescription}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>U/M</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Impuestos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>SUBTOTAL:</span><span>${subtotal}</span></div>
          <div class="total-row"><span>BASE IMPUESTOS:</span><span>${taxBase}</span></div>
          <div class="total-row"><span>IVA:</span><span>${iva}</span></div>
          <div class="total-row final"><span>TOTAL:</span><span>${total}</span></div>
        </div>

        <div class="total-in-words"><strong>Total en letras:</strong> ${totalInWords}</div>

        ${headNoteSection}

        ${notesSection}

        ${footNoteSection}

        <div class="cude-section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div><strong>CUDE:</strong></div>
              <div>${cude}</div>
            </div>
            ${qrSection}
          </div>
        </div>

        <div style="margin-top: 8px; padding: 4px; background-color: #f7fafc; border-radius: 4px;">
          <div style="font-size: 9px; color: #4a5568;">
            <strong>Estado:</strong> ${status} |
            <strong>Válida:</strong> ${isValidLabel} |
            <strong>Consecutivo:</strong> ${consecutive} |
            <strong>Email:</strong> ${emailStatus || 'N/A'}
          </div>
        </div>

        <div class="footer">
          ${footerText}
        </div>

        <div style="height: 20px;"></div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/** Generates printable HTML for a support-document credit note from Plemsi data. */
export const generateElectronicCreditNoteSupportDocumentHTML = async (responseData: Record<string, unknown>, company: Company): Promise<string> => {
  const creditNote = (responseData.data ?? responseData) as Record<string, unknown>
  const seller = creditNote.seller as Record<string, unknown> | undefined

  const companyName = company.name
  const companyId = company.document
  let companyAddress = 'N/A'
  if (company.address) {
    companyAddress = `${company.address.description}, ${company.address.city.description}`
  }
  const companyPhone = company.phone
  const companyEmail = company.email

  let sellerName = 'Vendedor no especificado'
  if (seller?.name) {
    sellerName = String(seller.name)
  }

  let sellerId = 'N/A'
  if (seller?.identification_number) {
    sellerId = String(seller.identification_number)
  }

  let sellerAddress = 'N/A'
  if (seller?.address) {
    sellerAddress = String(seller.address)
  }

  let sellerEmail = 'N/A'
  if (seller?.email) {
    sellerEmail = String(seller.email)
  }

  let sellerPhone = 'N/A'
  if (seller?.phone) {
    sellerPhone = String(seller.phone)
  }

  const documentNumber = `${creditNote.prefix ?? ''} ${creditNote.number ?? ''}`.trim()

  let resolution = 'N/A'
  if (creditNote.resolutionText) {
    resolution = String(creditNote.resolutionText)
  } else if (creditNote.resolution_number) {
    resolution = String(creditNote.resolution_number)
  } else if (company.resolutionTextNCDS) {
    resolution = company.resolutionTextNCDS
  }

  const issueDate = formatDate(String(creditNote.date ?? new Date().toISOString()))
  const issueTime = formatTime(String(creditNote.time ?? '00:00'))
  const cude = String(creditNote.cude ?? 'N/A')
  const consecutive = String(creditNote.consecutive ?? 'N/A')

  const billingReference = creditNote.billing_reference as Record<string, unknown> | undefined
  let billingReferenceNumber = 'N/A'
  if (billingReference?.number) {
    billingReferenceNumber = String(billingReference.number)
  }

  let billingReferenceDate = 'N/A'
  if (billingReference?.issue_date) {
    billingReferenceDate = String(billingReference.issue_date)
  }

  const discrepancyDescription = String(creditNote.discrepancyresponsedescription ?? 'N/A')

  const legalTotals = creditNote.legal_monetary_totals as Record<string, unknown> | undefined
  const subtotal = formatCurrency(Number(legalTotals?.line_extension_amount ?? 0))
  const taxBase = formatCurrency(Number(legalTotals?.tax_exclusive_amount ?? 0))
  const taxInclusiveAmount = parseFloat(String(legalTotals?.tax_inclusive_amount ?? '0'))
  const taxExclusiveAmount = parseFloat(String(legalTotals?.tax_exclusive_amount ?? '0'))
  const iva = formatCurrency(taxInclusiveAmount - taxExclusiveAmount)
  const total = formatCurrency(Number(legalTotals?.payable_amount ?? 0))

  const totalAmount = parseFloat(String(legalTotals?.payable_amount ?? '0'))
  const totalInWords = numberToWords(Math.floor(totalAmount)) + ' pesos colombianos'

  const status = creditNote.state
  const responseInfo = creditNote.response as Record<string, unknown> | undefined
  const responseDataInfo = responseInfo?.data as Record<string, unknown> | undefined
  const isValid = responseDataInfo?.IsValid === 'true'
  let validLabel = 'No'
  if (isValid) {
    validLabel = 'Sí'
  }

  const notes = String(creditNote.notes ?? '')
  const headNote = String(creditNote.head_note ?? '')
  const footNote = String(creditNote.foot_note ?? '')

  const qrString = String(creditNote.QRStr ?? '')
  let qrCodeBase64 = ''
  if (qrString) {
    qrCodeBase64 = await generateQRCodeBase64(qrString)
  }

  const creditNoteLines = (creditNote.credit_note_lines ?? []) as Record<string, unknown>[]
  const productRowParts: string[] = []

  for (let lineIndex = 0; lineIndex < creditNoteLines.length; lineIndex++) {
    const line = creditNoteLines[lineIndex]
    const quantity = String(line.invoiced_quantity ?? '0')
    const unitPrice = formatCurrency(Number(line.price_amount ?? 0))
    const lineTotal = formatCurrency(Number(line.line_extension_amount ?? 0))
    const productName = String(line.description ?? 'Producto/Servicio')
    const code = String(line.code ?? `ITEM-${String(lineIndex + 1).padStart(3, '0')}`)
    const lineNotes = String(line.notes ?? '')

    const taxTotals = line.tax_totals as Record<string, unknown>[] | undefined
    const taxInfo = taxTotals?.[0]
    const taxAmount = formatCurrency(Number(taxInfo?.tax_amount ?? 0))
    const taxId = taxInfo?.tax_id
    let taxName = 'N/A'
    if (taxId) {
      taxName = getTaxNameById(Number(taxId))
    }

    let taxPercent = ''
    if (taxInfo?.percent) {
      taxPercent = `${taxInfo.percent}%`
    }

    let notesHtml = ''
    if (lineNotes) {
      notesHtml = `<br/><span style="font-size: 9px; color: #666;">${lineNotes}</span>`
    }

    productRowParts.push(`
      <tr>
        <td>${code}</td>
        <td><strong>${productName}</strong>${notesHtml}</td>
        <td>UN</td>
        <td>${quantity}</td>
        <td>${unitPrice}</td>
        <td>${taxName} ${taxPercent}<br/>${taxAmount}</td>
        <td>${lineTotal}</td>
      </tr>
    `)
  }

  const productRows = productRowParts.join('')

  let headNoteSection = ''
  if (headNote) {
    headNoteSection = `
        <div class="cude-section">
          <div><strong>NOTA DE ENCABEZADO:</strong></div>
          <div>${headNote}</div>
        </div>
        `
  }

  let notesSection = ''
  if (notes) {
    notesSection = `
        <div class="cude-section">
          <div><strong>NOTAS:</strong></div>
          <div>${notes}</div>
        </div>
        `
  }

  let footNoteSection = ''
  if (footNote) {
    footNoteSection = `
        <div class="cude-section">
          <div><strong>NOTA DE PIE:</strong></div>
          <div>${footNote}</div>
        </div>
        `
  }

  let qrCodeSection = ''
  if (qrCodeBase64) {
    qrCodeSection = `
            <div style="margin-left: 12px; background-color: #f9f9f9; padding: 4px; border: 1px dashed #999;">
              <img src="${qrCodeBase64}" alt="Código QR" style="width: 100px; height: 100px; border: 1px solid #333; display: block; background: white;" />
            </div>
            `
  }

  const footerText = 'Esta es una representación impresa de la nota crédito de documento soporte electrónico. Consulte el CUDE en la DIAN para verificar su validez.'

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Nota Crédito de Documento Soporte ${documentNumber}</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .company-info h1 {
          font-size: 16px;
          margin-bottom: 4px;
          color: #1e3a8a;
        }
        .company-details {
          font-size: 10px;
          color: #444;
          line-height: 1.2;
        }
        .company-details p {
          margin: 1px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 14px;
          font-weight: bold;
        }
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          margin-top: 2px;
          color: #111827;
        }
        .resolution {
          font-size: 10px;
          color: #666;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .party-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
        }
        .party-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .party-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .reference-section {
          border: 1px solid #ccc;
          padding: 6px;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .reference-section h3 {
          background: #f3f4f6;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        .items-table th, .items-table td {
          border: 1px solid #444;
          padding: 4px;
        }
        .items-table th {
          background: #e5e7eb;
          font-weight: bold;
          text-align: center;
        }
        .items-table td {
          text-align: center;
        }
        .totals {
          width: 240px;
          margin-left: auto;
          font-size: 11px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #ccc;
          padding: 3px 0;
        }
        .total-row.final {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
          background: #f3f4f6;
        }
        .total-in-words {
          margin-top: 8px;
          font-style: italic;
          font-size: 10px;
          color: #444;
        }
        .cude-section {
          border: 1px solid #ccc;
          padding: 6px;
          margin-top: 12px;
          font-size: 9px;
          word-break: break-word;
        }
        .footer {
          margin-top: 12px;
          font-size: 9px;
          color: #555;
          border-top: 1px solid #ccc;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <div class="company-details">
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone} | Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">NOTA CRÉDITO DE DOCUMENTO SOPORTE</div>
            <div class="invoice-number">${documentNumber}</div>
            <div class="resolution">Resolución: ${resolution}</div>
            <div style="font-size: 11px; color: #555;">
              ${issueDate} ${issueTime}
            </div>
          </div>
        </div>

        <div class="parties">
          <div class="party-section">
            <h3>Adquiriente</h3>
            <div class="party-info">
              <p><strong>${companyName}</strong></p>
              <p>NIT: ${companyId}</p>
              <p>${companyAddress}</p>
              <p>Tel: ${companyPhone}</p>
              <p>Email: ${companyEmail}</p>
            </div>
          </div>
          <div class="party-section">
            <h3>Vendedor</h3>
            <div class="party-info">
              <p><strong>${sellerName}</strong></p>
              <p>Identificación: ${sellerId}</p>
              <p>Dirección: ${sellerAddress}</p>
              <p>Teléfono: ${sellerPhone}</p>
              <p>Email: ${sellerEmail}</p>
            </div>
          </div>
        </div>

        <div class="reference-section">
          <h3>Documento de referencia</h3>
          <p><strong>Documento soporte afectado:</strong> ${billingReferenceNumber}</p>
          <p><strong>Fecha documento soporte:</strong> ${billingReferenceDate}</p>
          <p><strong>Motivo:</strong> ${discrepancyDescription}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>U/M</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Impuestos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>SUBTOTAL:</span><span>${subtotal}</span></div>
          <div class="total-row"><span>BASE IMPUESTOS:</span><span>${taxBase}</span></div>
          <div class="total-row"><span>IVA:</span><span>${iva}</span></div>
          <div class="total-row final"><span>TOTAL:</span><span>${total}</span></div>
        </div>

        <div class="total-in-words"><strong>Total en letras:</strong> ${totalInWords}</div>

        ${headNoteSection}

        ${notesSection}

        ${footNoteSection}

        <div class="cude-section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div><strong>CUDE:</strong></div>
              <div>${cude}</div>
            </div>
            ${qrCodeSection}
          </div>
        </div>

        <div style="margin-top: 8px; padding: 4px; background-color: #f7fafc; border-radius: 4px;">
          <div style="font-size: 9px; color: #4a5568;">
            <strong>Estado:</strong> ${status} |
            <strong>Válida:</strong> ${validLabel} |
            <strong>Consecutivo:</strong> ${consecutive}
          </div>
        </div>

        <div class="footer">
          ${footerText}
        </div>

        <div style="height: 20px;"></div>
      </div>
    </body>
    </html>
  `

  return htmlContent
}
