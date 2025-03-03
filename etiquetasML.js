/*
Para utilizar la funcion se tiene que incluir en el body del HTML el script de jsbarcode y el de pdfmake:
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.0/JsBarcode.all.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/pdfmake.min.js"></script>

Tambien se tiene que crear un elemento canvas con el id "barcode" dentro del html:
<canvas id="barcode"></canvas>




//El objeto multiples es un array de objetos con la siguiente estructura:
 var multiples = [
    {
        "sku": "CAMAMAS1",
        "producto": "Cama de Masaje",
        "variacion": "Gris",
        "ordenDeCompra": "MSKI21263",
        "cantidad" : 10, 
        "piezas": 12
    },
    
]

*/




//Function to generate PDF of labels
function generarPdfEtiquetas(multiples) {

var dd = []

  for(x in multiples){
    for(y = 0; y < multiples[x].cantidad; y++){

    var barcode = JsBarcode("#barcode", `${multiples[x].sku}`)
    var imgdata = document.getElementById("barcode").toDataURL('image/png');


  var page = [
    {
      text: [
      ],
    },
    {
          image: imgdata,
          width: 130,
          alignment: 'center',
    },
    {
          text: [
            { text: `${multiples[x].producto}\n`, alignment: 'center',  fontSize: 8},
            { text: `${multiples[x].variacion}\n`, alignment: 'center',  fontSize: 9, bold: true},
            { text: `O.C.: ${multiples[x].ordenDeCompra}\n`, alignment: 'center',  fontSize: 8},
            { text: `Piezas: ${multiples[x].piezas}\n`, alignment: 'center',  fontSize: 8},
          ],
          pageBreak: 'after'
    },
  ]
  dd.push(...page);
}
  }
  var docDefinition = {
    content: dd,
    pageSize: 'A8',
    pageOrientation: 'landscape',
    pageMargins: [3, 3, 3, 3]
    }

  pdfMake.createPdf(docDefinition).download(`PDF QR`);

}

