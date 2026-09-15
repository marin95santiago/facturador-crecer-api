const ExcelJS = require('exceljs');
const dataS = require('./data.json')

const contables = [
  {
    idItem: '01',
    cuenta_contable: '4160050100'
  },
  {
    idItem: '02',
    cuenta_contable: '4160050200'
  },
  {
    idItem: '03',
    cuenta_contable: '4160050200'
  },
  {
    idItem: '04',
    cuenta_contable: '4160050300'
  },
  {
    idItem: '05',
    cuenta_contable: '4160050400'
  },
  {
    idItem: '06',
    cuenta_contable: '4160050600'
  }
]

const contables_seminario = [
  {
    idItem: '01',
    cuenta_contable: '4160050100'
  },
  {
    idItem: '02',
    cuenta_contable: '4160050200'
  },
  {
    idItem: '03',
    cuenta_contable: '4160050300'
  },
  {
    idItem: '04',
    cuenta_contable: '4160050500'
  },
  {
    idItem: '05',
    cuenta_contable: '4160050200'
  },
  {
    idItem: '06',
    cuenta_contable: '4160050300'
  },
  {
    idItem: '07',
    cuenta_contable: '4160050300'
  },
  {
    idItem: '08',
    cuenta_contable: '4170140100'
  }
]

const cuenta_contable_col = '1615050100'

async function generateData(dataS) {
  const resData = []
  dataS.forEach((bill) => {
    if (bill === undefined || bill === {}) return;
    if (bill.third === undefined || bill === {}) return;
    // parsear fecha
    const dateString = bill.date;
    const dateParts = dateString.split("-");

    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]);
    const day = Number(dateParts[2]);

    bill.items.forEach(item => {
      if (item === undefined || item === {}) return;
      if (item.code === undefined || item === "") return;
      let registerC;
      let registerD;
      let cuentaContable;

      // Cuando quiera exportar seminarios, usar contables de seminario, caso de colegios usar contables.
      cuentaContable = contables.find(contable => contable.idItem === item.code)

      registerC = {
        numero_documento: bill.number,
        cuenta_contable: cuentaContable.cuenta_contable,
        debito_o_credito: 'C',
        valor_de_la_secuencia: item.taxes[0].taxableAmount,
        año: year,
        mes: month,
        dia: day,
        nit: bill.third.document,
        descripcion_secuencia: item.description
      }

      registerD = {
        numero_documento: bill.number,
        cuenta_contable: cuenta_contable_col,
        debito_o_credito: 'D',
        valor_de_la_secuencia: item.taxes[0].taxableAmount,
        año: year,
        mes: month,
        dia: day,
        nit: bill.third.document,
        descripcion_secuencia: item.description
      }

      resData.push(registerC)
      resData.push(registerD)
    })
  })

  return resData;
}

// Función para generar el archivo de Excel
async function generateExcel() {
  const data = await generateData(dataS);

  // Crear un nuevo libro de Excel
  const workbook = new ExcelJS.Workbook();

  // Crear una nueva hoja de cálculo
  const worksheet = workbook.addWorksheet('Datos');

  // Encabezados de las columnas
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Datos de los objetos
  data.forEach(obj => {
    const rowValues = Object.values(obj);
    worksheet.addRow(rowValues);
  });

  // Guardar el archivo de Excel
  await workbook.xlsx.writeFile('output.xlsx');

  console.log("Archivo de Excel generado correctamente.");
}

generateExcel().catch((error) => {
  console.error("Ocurrió un error al generar el archivo de Excel:", error);
});