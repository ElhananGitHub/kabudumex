const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });
const mercadolibreFunctions = require("./mercadolibre");
const firestore = require("@google-cloud/firestore");
const fs = require('fs');
const { promisify } = require('util');

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const { FieldValue } = require('@google-cloud/firestore');

const axios = require('axios');



const dataImpresion = '42658610684,42658503091,42658607334';


async function imprimirEtiquetas(dataImpresion) {
  //console.log(dataImpresion);

  let arrImpresion = '';
  if (dataImpresion.includes(",")) {
    arrImpresion = dataImpresion.split(",");
  } else {
    arrImpresion = [dataImpresion];
  }

  etiquetasImpresion = [];

  // Armamos los arreglos de 50 shippingIds
  while (arrImpresion.length > 0){
		etiquetasImpresion.push(arrImpresion.splice(0, 50));
	}

  var keys = await mercadolibreFunctions.getKeysML(db)

  const ACCESS_TOKEN = keys.access_token;


  // Generamos los PDF's con 50 etiquetas
  for (var i = 0; i < etiquetasImpresion.length; i++){
    let shippingIds =  etiquetasImpresion[i].toString();
  
    const writeFileAsync = promisify(fs.writeFile);

    //const SHIPPING_ID1 = 42648047478;
    //const SHIPPING_ID2 = '42648047478';

    // Define the API URL with properly encoded query parameters
    const apiUrl = `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shippingIds}&response_type=pdf`;

    // Set up the request headers
    const headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    };

    try {
      const response = await axios.get(apiUrl, { headers, responseType: 'stream' });

      if (response.status === 200) {
        console.log("200")
        // Save the PDF to a file
        const outputFile = `output${i}.pdf`
        const writer = fs.createWriteStream(outputFile);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', () => {
            console.log(`PDF saved to ${outputFile}`);
            resolve();
          });
          writer.on('error', (error) => {
            reject(error);
          });
        });

      } else {
        console.error(`Received status code ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }

  }
}


imprimirEtiquetas(dataImpresion);
