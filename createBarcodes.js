var db = firebase.firestore();
var storage = firebase.storage();


function generarEtiquetas (barcode, docID) {
  db.collection("Ventas")
  .doc(docID)
  .onSnapshot((response) => {
    //console.log(response)
    //console.log(response.data());

    generarPdfEtiquetas(barcode, response.data());

  });
}

function generarPdfEtiquetas(barcode, response) {

  multiples = response.elementos;

  console.log({multiples});

  var dd = []

  for(let x in multiples){
    //console.log({x});
    for(let y = 0; y < multiples[x].cantidad; y++){
        //console.log({y});
        //console.log(multiples[x].idFull);

        //Gimnasio P|GIMNASIOTORTUGABB|NaN|N/A|MLM2455523072NYZA74906
        //Silla Playera Plegable Para Exteriores Portatil  Camping-Azul marino|SILLAPLAYAMARINO2PZ|MLM1758925618|176338029199|MLM1758925618|176338029199|EJXK78456

        // Generamos la imagen del QR en el Canvas
        var idFull = multiples[x].idFull;
        var idFull = idFull.indexOf("NaN") == 0 ? idFull.replace("NaN", "") : idFull;
        JsBarcode(barcode, idFull);
        //JsBarcode(barcode, `${multiples[x].publicacionML.split('|').at(-1)}`);
        
        // Recuperamos la imagen del canvas
        var canvas = document.getElementById("barcode");

        // Obtenemos la imagen en base64 del QR
        var imgdata = canvas.toDataURL('image/png');

        //console.log({imgdata})

        let publicacion = multiples[x].publicacionML.split('|')[0];
        let producto = publicacion.split('-')[0];
        let variacion = publicacion.split('-')[1];
        let sku = multiples[x].skuPublicacion;

        //console.log({producto});
        //console.log({variacion});

        var page = [
          {
            text: [
              { text: `KABUDUMEX SA DE CV\n`, alignment: 'left', fontSize: 9, bold: true },
              { text: `RFC MTE190409SC7\n`, alignment: 'left', fontSize: 5, bold: true },
              { text: `GENERAL PABLO GONZALEZ 46 COL. FRANCISCO VILLA ALCALDIA IZTAPALAPA CIUDAD DE MEXICO C.P. 09720 TEL. 5544150765`, alignment: 'left', fontSize: 6 },
            ],
          },
          {
                image: imgdata,
                width: 130,
                alignment: 'center',
          },
          {
                text: [
                  { text: `${producto}\n`, alignment: 'center',  fontSize: 8},
                  { text: `${variacion}\n`, alignment: 'center',  fontSize: 9, bold: true},
                  { text: `SKU: ${sku}\n`, alignment: 'center',  fontSize: 9},
                ],
                pageBreak: 'after'
          },
        ]
        //console.log({page})
        dd.push(...page);
    }
  }

	console.log({dd})
  var docDefinition = {
    content: dd,
    pageSize: 'A8',
    pageOrientation: 'landscape',
    pageMargins: [3, 3, 3, 3]
   }

  pdfMake.createPdf(docDefinition).download(`PDF QR`);

}