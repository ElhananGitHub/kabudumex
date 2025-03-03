//const functions = require("firebase-functions");
//const admin = require("firebase-admin");

const axios = require('axios');
var PdfPrinter = require('pdfmake');
const fs = require("fs");

//Firebase storage
const { Storage } = require('@google-cloud/storage');
const { get } = require('request');
const storage = new Storage();

/*
admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "umaguendavid",
        "storageBucket": "umaguendavid.appspot.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC04kaWULqNoF6e\ng6ka+d7BnyxuyJtrBudl2VqncKSiPFDVXuIKKsfWU3n+7IowPegXXtpHvPZTB4bt\n8O+Sh56GggtuE4is9D1VakbqgeS7Pi7eUThcoTt+Sndl+di5K/0iAFq0X86mGgDw\n4tWV25hlgFguKN2c8lfAXG5Vu6jV95M0X1U8MasX/iUeZt+sLzXiyTDeMMj091EP\nbF927jZEEC/Wn/GBB8yHOfVjM09FtJ5PzmDXhXev4lCftvRN5yB4e6P9HsfES7Ft\nSLEaioPVAp9uWu+TVwdVIcE3XPr4540RBv74Iyny1RFDqH+vgfknQatYqYImNimd\n+K3NIOZbAgMBAAECggEALXf7umlMm7FGV55M8eUBo7Y5Wxe+SacQn7+FVDWyjL2Q\nrDIPq/KZDT0qm3QmQH4vS0CiqgnL+Y8Y0dMQxcqlhLZH3UG3x5IVoNT4QpaoQpEd\nAvFzs4UsCVD6tn2ZhuKR3Owt4M18irBasDK08dijdFBQ2jmXi443lLknWxGzHSWT\nrZLI+yoDAZJxf4cKzka++aRmyz8xUu7+HMsJtjgUNkG+ytmzKOQeqfZ0Q5tkWzmO\nfF7iWhIM7P9Tz0A5uZfPut07jJyjYN9OWcFCr7jenAAhIN6bUCislK4i72u4/5uq\n3MIll/TIEOwqg0G+31Xw7oEkKZHcrzPwBdiCY843EQKBgQDzhvhC713ywbkBUjkA\nDI3q/mhjXc6t8eeONj9CbCbq+h8d52vc9VsOFBkHkSgkC+pYLaUdfCmk090j5FZl\n4pS4/ddMXWhkI/sJ3rMWaFVY5KQaaAnjh0G8lhqNrxW416lR5+IXuWdfr9PY8Lv/\nIgaEhMdyZi1fE9GgjSOB+xbt9wKBgQC+JfOyU/2sqFvngRVQ0yqcx6uqewmtFSUQ\ntIwFjsaCqrkkYt9zg8LBRtLC1j6i/uVxFgzQeRhlsVgsyP1GIbPJPnUgXgn+GQwj\nBLkHHc+gZ7PApnjjSlXNElcsm8kxuvtfTJ76K7ULqDnyzv0A1MP1m1P8DUZdq7pr\nY27it5TBvQKBgEPuDUhWjuVNZnbY4a+C0P+Q8btuCl35EXdY6HJ1yrFXDeEAkdTz\n1+9oacbzlbfgXwEz0lAUN2WT96awZe1Ls+KaZDkYASuV4cvSBDCm78+5D5GSHdgK\n/apGUKffA/coqUGApk+p1w0Y9cYY+MflTN4gT6Y4nEVeOOZJGHOEf9PnAoGAP6Ib\nx9Xr0tgUyYidRYsle4omnMrIFjA5UznYkhORwzC2/MJJ3TJ+/odhCOsB0zJSPmIO\nr8WWsJGE3Jf2in3E2NgaAlb2KR7gvOdbtFH5pciOky4izo2V4Sb+HWOVFRtp/B58\nJWRzFg+aNPOoH5sUaSEuHe+jWL2biUyhUyX0llECgYEAoJ9B5BnDbiXqxVbF7bZ9\nl2Fgv3LkichA4pFqaKsskYHEEmCYWhv/0WZrdelM/EhbY7TFioki8NIHtFwxlETc\nCj/U7fBYmIjAckH2ULT4JD/y0JG2MtW8W8ehY/l0WQe7QOUB3t83wybLs4Rm6vsz\njTtPoT+l3HMwyhNe2xWRgJU=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-kziw4@kabudumex.iam.gserviceaccount.com",
        "firebaseApiKey": "AIzaSyDmWoPDy76ODJCu47mtB4lnPPLxy8QMjNo"
    }
    ),
    //databaseURL: "https://friendlychat-b87dc-default-rtdb.firebaseio.com"
});
*/
/*
admin.initializeApp({
    apiKey: "AIzaSyDmWoPDy76ODJCu47mtB4lnPPLxy8QMjNo",
    authDomain: "kabudumex.firebaseapp.com",
    projectId: "kabudumex",
    storageBucket: "kabudumex.appspot.com",
    messagingSenderId: "945690027765",
    appId: "1:945690027765:web:201e36ea874b619d16c7bc",
    measurementId: "G-QZ9TBM32PN",
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true })
*/


const convertUrlToBase64 = async (urlImage) => {
    const image = await axios.get(urlImage, {
        responseType: 'arraybuffer'
    });
    const returnedB64 = Buffer.from(image.data).toString('base64');
    //console.log(returnedB64);

    return returnedB64;
}

//convertUrlToBase64('https://cfcdn.apowersoft.info/astro/picwish/_astro/scene-logo-after@530w.df3314dd.png');


// Ejemplo de como se debe mandar el JSON a la funcion para generar el archivo PDF
var datosPDF = {
    "camposHeader": {
        "Cliente": "TIENDAS SORIANA SA DE CV",
        "Empresa": "Isalan",
        "No. de Nota": 104,
        "Fecha de Venta": "2023/09/15",
        "Total Venta": "$10",
        "Gran Total Cantidad (Bultos)": "1.00",
        "Gran Total Kg/Mts/Pza": "1.00",
        "Comentarios Descuento": ""
    },
    "multiples": {
        "Resumen": [
            {
                "Categoria": "MUEBLES",
                "Producto": "PACK DE 4 SILLAS PLEGABLES MULTIFUNCIONALES",
                "Variacion": "BLANCO",
                "Cantidad (Bultos)": "1.00",
                "P. Unitario": "$10",
                "Total Kg/Mts/Pz": "1.00",
                "Total": "$10",
                "imageUrl": "https://umaguendavid.web.app/public/images/logo.png"
            }
        ],
        "Desglose": [
            {
                "SKU": "MUEB-PACK-BLAN-07NI",
                "Cantidad": 1,
                "Kg/Mts/Pz": "1.00",
                "Producto": "PACK DE 4 SILLAS PLEGABLES MULTIFUNCIONALES",
                "Variacion": "BLANCO",
                "Total": "$10"
            }
        ]
    },
    "config": {
        "subject": "Nueva Nota de Venta",
        "emailTemplateId": "1eofbRHc790xmEvtf4cyrr0hSRqu803zd3mWqrg-nitw",
        "envioMail": true,
        "sender": "cobranzakabudumex22@gmail.com",
        "templateID": "1sxte6nBaaiqH0IKMsH3yXOffzFUr3sllHrX8V6gFjCY",
        "documentName": "Nota de Venta 104 - ML-2000006472773110.pdf"
    },
    "uploadToFirebaseStorage": {
        "folderName": "archivosPDF",
        "projectId": "kabudumex",
        "bucketName": "kabudumex.appspot.com",
        "fileName": "Nota de Venta - 96.pdf"
    },
    "updateFirebaseDocument": {
        "projectId": "kabudumex",
        "collection": "Ventas",
        "firestorageUrl": true,
        "field": "urlNota",
        "document": "VRWYb650F6vPn2cfNThX"
    },
    "camposHeader": {
        "Cliente": "TIENDAS SORIANA SA DE CV",
        "Empresa": "Isalan",
        "No. de Nota": 104,
        "Fecha de Venta": "2023/09/15",
        "Total Venta": "$10",
        "Gran Total Cantidad (Bultos)": "1.00",
        "Gran Total Kg/Mts/Pza": "1.00",
        "Comentarios Descuento": ""
    },
    "numero_orden_venta": 96,
    "urlImagen": "https://images.freeimages.com/vhq/images/previews/214/generic-logo-140952.png",
    "Fecha de Hoy": "2023/09/26",
    "Tipo de Venta": "MercadoLibre",
    "Comentarios": "",
    "Estatus de la Venta": "Deuda",
    "IVA": "$0.00",
    "TotalMasIVA": "$10",
    "Pago": "$10.00",
    "Saldo": "$0",
    "Total Venta sin Descuento": "$10",
}




async function createPDF(db, dataJSON) {
    if (!db) {
        var functions = require("firebase-functions");
        var admin = require("firebase-admin");
        var firestore = require("@google-cloud/firestore");
        admin.initializeApp(functions.config().firebase);
        var db = admin.firestore();
        var { FieldValue } = require('@google-cloud/firestore');
    }

    console.log('createPDF');
    console.log('dataJSON');
    console.log(dataJSON.camposHeader);

    const { camposHeader, multiples, uploadToFirebaseStorage, updateFirebaseDocument } = dataJSON;

    const arrCamposHeader = Object.entries(camposHeader).map(([key, value]) => ({
        text: [{ text: `${key == "imagenUrl" ? "Imagen" : key}: `, fontSize: 14, bold: true }, value],
    }));

    const arrTables = [];

    for (const [title, items] of Object.entries(multiples)) {
        const tableHeader = Object.keys(items[0]);
        const tableBody = [];
    
        for (const item of items) {
            const row = [];
            for (const key of tableHeader) {
                let cell = item[key];
                // If cell value is an image URL, replace it with the image
                if (String(cell).includes("http")) {
                    cell = { image: "data:image/png;base64," + await convertUrlToBase64(cell), width: 40, height: 40, alignment: "center" };
                }
                row.push(cell);
            }
            tableBody.push(row);
        }
    
        arrTables.push({
            text: title,
            style: 'sectionStyling',
        }, {
            table: {
                headerRows: 1,
                body: [tableHeader, ...tableBody],
                widths: Array.from({ length: tableHeader.length }, () => 'auto'),
            },
            layout: {
                fillColor: (rowIndex) => rowIndex % 2 === 0 ? '#DDDDDD' : null,
            },
            fontSize: 10,
            alignment: 'center',
            margin: [0, 20, 0, 8],
        });
    }
    

    const logoImage = `data:image/png;base64,${await convertUrlToBase64(dataJSON.urlImagen)}`;

    console.log('Creating PDF');

    const fonts = {
        Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        pageMargins: [30, 80, 30, 30],
        header: {
            margin: 8,
            columns: [{
                table: {
                    widths: ['100%'],
                    body: [[{
                        image: logoImage,
                        width: 40,
                        height: 40,
                        alignment: 'center',
                    }]],
                },
                layout: 'noBorders',
            }],
        },
        content: [arrCamposHeader, ...arrTables],
        styles: {
            sectionStyling: {
                fontSize: 18,
                color: 'black',
                bold: true,
                alignment: 'center',
                margin: [0, 10, 0, 10],
            },
            subheader: {
                fontSize: 14,
            },
            superMargin: {
                margin: [20, 0, 40, 0],
                fontSize: 15,
            },
        },
        defaultStyle: {
            alignment: 'justify',
        },
    };

    const { fileName, bucketName, folderName } = uploadToFirebaseStorage;
    const { collection, document, field } = updateFirebaseDocument;

    const storage = new Storage();
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfFile = storage.bucket(bucketName).file(`${folderName}/${fileName}`);

    pdfDoc.pipe(pdfFile.createWriteStream());
    pdfDoc.end();

    await new Promise(resolve => pdfDoc.on('end', resolve));

    const urlStorage = `gs://${bucketName}/${folderName}/${fileName}`;

    const docRefURL = db.collection(collection).doc(document);
    await docRefURL.set({ [field]: urlStorage }, { merge: true });

    return urlStorage;
}


//Upload pdf to firebase storage
async function uploadPDFToStorage(folderName, fileName, bucketName, folderStorage) {

    //var folder = "pdfs";
    //var fileName = "basics.pdf";

    //Get pdf from folder
    var pdf = fs.readFileSync(`${folderName}/${fileName}`);

    //Upload pdf to firebase storage
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${folderStorage}/${fileName}`);
    await file.save(pdf, {
        metadata: {
            contentType: "application/pdf",
        },
        resumable: false,
    });

    //console.log(file);

    await file.makePublic();
    const url = file.publicUrl();

    console.log(url);
    return url;

    /*
    // Generate a signed URL for the file (valid for 1 hour)
    const options = {
      action: 'read',
      expires: Date.now() + 3600 * 1000, // 1 hour expiration time
    };
  
    const [signedUrl] = await file.getSignedUrl(options);
    */

    //console.log(`Signed URL for ${fileName}: ${signedUrl}`);
    //return signedUrl; // You can return the signed URL if needed



}

module.exports = {
    createPDF,
};


//createPDF(null, datosPDF);