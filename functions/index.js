const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const cors = require('cors')({ origin: true });
const mercadolibreFunctions = require("./mercadolibre");
const funcionesGenerales = require("./funcionesGenerales");
const crearPDFFunctions = require("./crearPDF");
const firestore = require("@google-cloud/firestore");
const fs = require("fs");


admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const { FieldValue } = require('@google-cloud/firestore');


//Firebase storage
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();


async function getProjectId() {
  const client = new firestore.v1.FirestoreAdminClient();
  const projectId = await client.getProjectId();

  console.log(projectId)

  return projectId;
}


//Http trigger function to summarize the inventory, use promise then
exports.summarizeInventory = functions.https.onRequest(async (req, res) => {
  //Get the inventory collection
  const inventory = admin.firestore().collection('Mercancia').where('cantidad_disponible', '>', 0);
  const ordenesCompraQuery = await admin.firestore().collection('ConfiguracionesGenerales').doc('ordenesCompra').get();
  const ordenesCompra = ordenesCompraQuery.data().ordenesCompra;


  //Get the inventory items
  inventory.get()
    .then(inventoryItems => {


      //Initialize the summary
      let summary = {};

      //Loop through the inventory items
      inventoryItems.forEach((item) => {

        //Get the item data
        const data = item.data();

        var categoria = data.categoria;
        var producto = data.producto;
        var variacion = data.variacion;
        var cantidad = data.cantidad_disponible;
        var costo_unitario = data.costo_unitario ?? 0;
        var ordenCompra = data.numero_orden_compra;

        //console.log({data, categoria, producto, variacion, cantidad})
        var indexProducto = summary[categoria]?.productos.findIndex(e => e.produc === producto);
        var indexVariacion = summary[categoria]?.productos[indexProducto]?.variaciones.findIndex(e => e.variacion === variacion);

        //console.log({indexProducto, indexVariacion})


        //If the category is not in the summary, add it
        if (!summary[categoria]) {
          summary[categoria] = {
            nombreCategoria: categoria,
            totalSkuCantidades: cantidad,
            productos: [{
              produc: producto,
              totalSkuCantidades: cantidad,
              variaciones: [{
                variacion: variacion,
                totalSkuCantidades: cantidad,
                promedioCosto: costo_unitario,
              }]
            }]
          };
        } else if (indexProducto == -1) {
          summary[categoria].productos.push({
            produc: producto,
            totalSkuCantidades: cantidad,
            variaciones: [{
              variacion: variacion,
              totalSkuCantidades: cantidad,
              promedioCosto: costo_unitario,
            }]
          });

          summary[categoria].totalSkuCantidades += cantidad;
        } else if (indexVariacion == -1) {
          summary[categoria].productos[indexProducto].variaciones.push({
            variacion: variacion,
            totalSkuCantidades: cantidad,
            promedioCosto: costo_unitario,
          });

          summary[categoria].totalSkuCantidades += cantidad;
          summary[categoria].productos[indexProducto].totalSkuCantidades += cantidad;

        } else if (indexProducto > -1 && indexVariacion > -1) {
          summary[categoria].totalSkuCantidades += cantidad;
          summary[categoria].productos[indexProducto].totalSkuCantidades += cantidad;
          summary[categoria].productos[indexProducto].variaciones[indexVariacion].promedioCosto = (summary[categoria].productos[indexProducto].variaciones[indexVariacion].promedioCosto * summary[categoria].productos[indexProducto].variaciones[indexVariacion].totalSkuCantidades + costo_unitario * cantidad) / (summary[categoria].productos[indexProducto].variaciones[indexVariacion].totalSkuCantidades + cantidad);
          summary[categoria].productos[indexProducto].variaciones[indexVariacion].totalSkuCantidades += cantidad;
        }

        if (ordenesCompra.indexOf(ordenCompra) == -1) {
          console.log("no encontrado", ordenCompra)
          ordenesCompra.push(ordenCompra);
        }

      });

      //Return the summary
      res.send(summary);

      //Add each category of the summary as new document in the summary collection
      for (const category in summary) {
        console.log(category)
        admin.firestore().collection('INVENTARIO-TOTAL').doc(category).set(summary[category]);
      }

      //Update the "ORDENES-DE-COMPRA" document
      admin.firestore().collection('ConfiguracionesGenerales').doc('ordenesCompra').set({ ordenesCompra });
    })
})




//Function to receive webhook from mercadolibre
exports.mercadolibrewebhook = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {

    //Allow CORS
    response.set('Access-Control-Allow-Origin', "*");
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');


    //Redirect the request to other url in case it have a specific user_id
    if (request.body.user_id == 2181741834) {
      console.log("Redirecting request to bazaru")
      var urlToRedirect = "https://us-central1-kabudumex.cloudfunctions.net/mercadolibrewebhook";
      var responseRedirect = await fetch(urlToRedirect, {
        method: 'POST',
        body: JSON.stringify(request.body),
        headers: { 'Content-Type': 'application/json' }
      });

      var resultRedirect = await responseRedirect.text();
      return response.json({ ok: 1, result: resultRedirect });

    }
/*
    if (request.body.user_id == 201985398) {
      console.log("Redirecting request to lailaconfort")
      var urlToRedirect = "https://us-central1-lailaconfort.cloudfunctions.net/mercadolibrewebhook";
      var responseRedirect = await fetch(urlToRedirect, {
        method: 'POST',
        body: JSON.stringify(request.body),
        headers: { 'Content-Type': 'application/json' }
      });

      var resultRedirect = await responseRedirect.text();
      return response.json({ ok: 1, result: resultRedirect });

    }

    if (request.body.user_id == 616648772) {
      console.log("Redirecting request to gravitamex")
      var urlToRedirect = "https://us-central1-gravitamex.cloudfunctions.net/mercadolibrewebhook";
      var responseRedirect = await fetch(urlToRedirect, {
        method: 'POST',
        body: JSON.stringify(request.body),
        headers: { 'Content-Type': 'application/json' }
      });

      var resultRedirect = await responseRedirect.text();
      return response.json({ ok: 1, result: resultRedirect });

    }

    if (request.body.user_id == 234394930) {
      console.log("Redirecting request to sulamex")
      var urlToRedirect = "https://us-central1-sulamex.cloudfunctions.net/mercadolibrewebhook";
      var responseRedirect = await fetch(urlToRedirect, {
        method: 'POST',
        body: JSON.stringify(request.body),
        headers: { 'Content-Type': 'application/json' }
      });

      var resultRedirect = await responseRedirect.text();
      return response.json({ ok: 1, result: resultRedirect });

    }
*/

    if (request.body.user_id !== 642273229) {
      return response.json({ ok: 1 });
    }

    console.log(request.body);


    const resource = request.body.resource;
    const topic = request.body.topic;


    let result;
    switch (topic) {
      case "items": {//producto actualizado


        return response.json(200);
      }

      case "questions": {

        db.collection("webhookMercadoLibre").doc(resource.replaceAll("/", "")).set({
          resource: resource,
          topic: topic,
          attempts: request.body.attempts ?? 0,
          sent: request.body.sent ?? 0,
          received: request.body.received ?? 0,
          _id: request.body._id,
          date: new Date(),
          status: "pending"
        })

        return response.json(200);
      }
      case "orders_v2": {

        db.collection("webhookMercadoLibre").doc(resource.replaceAll("/", "")).set({
          resource: resource,
          topic: topic,
          attempts: request.body.attempts ?? 0,
          sent: request.body.sent ?? 0,
          received: request.body.received ?? 0,
          _id: request.body._id,
          date: new Date(),
          status: "pending"
        })

        return response.json(200);
      }
    }
    return response.json({ ok: 1 })

  });
});


//Funcion para cerrar ventas
exports.cerrarVentas = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {

    //Allow CORS
    response.set('Access-Control-Allow-Origin', "*");
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    var numero_orden_venta = request.query.numero_orden_venta;
    var user = request.query.user;

    if (numero_orden_venta == undefined || user == undefined) {
      return response.json({ ok: 0, error: "Faltan parametros" })
    }

    //Se obtinee el documento de la venta de Firebase
    var queryVenta = await db.collection("Ventas")
      .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
      .where("delete", "==", false)
      .get()

    let ventaList = [];
    queryVenta.forEach((doc) => {
      ventaList.push({ id: doc.id, ...doc.data() });
    });


    const {
      id,
      elementos,
      TipoVenta,
      empresa,
      fechaVenta,
      cliente,
      EstatusPedido,
      comentarios,
      fechaVencimiento,
      condicionesPago,
      TotalVentaOriginal,
      ComentariosDescuento,
      saldo,
    } = ventaList[0];

    let documentID = ventaList[0].id;
    //console.log(documentID);

    //Primero se pone es este estado, por si se actualiza la pagina a la mitad no se pueda cerrar dos veces el mismo pedido
    await db.collection("Ventas").doc(id).update({ EstatusPedido: "Preparando para cerrar pedido" })

    logger("Venta", "Inicia cierre de pedido", numero_orden_venta, null, user);

    var arrOrdenesML = [];

    const listForReport = [];
    const listForReportByElement = [];
    let TotalVenta = 0;

    elementos.forEach((itemElementos) => {

      const categoriaItem = itemElementos.categoria;
      const productoItem = itemElementos.producto;
      const variacionItem = itemElementos.variacion;
      let cantidadItem = 0;
      const precioUnitarioItem = parseFloat(itemElementos.precioUnitario);
      let dimencionesSkusItem = 0;
      let totalSkusItem = 0;
      let OrderIDMercadoLibre = itemElementos.orderID ? itemElementos.orderID.split(",") : null;

      const precioUnitario = itemElementos.precioUnitario;


      if (itemElementos?.skus?.length) {
        itemElementos.skus.forEach((element) => {
          const SKU = element.sku;
          const Cantidad = parseFloat(element.cantidad);
          const Dimesiones = parseFloat(element.dimesiones);
          const totalSku = Cantidad * Dimesiones * precioUnitario;
          TotalVenta += totalSku;
          totalSkusItem += totalSku;
          dimencionesSkusItem += Dimesiones * Cantidad;
          cantidadItem += Cantidad;
          const objforReport = {
            SKU,
            Cantidad,
            "Kg/Mts/Pz": Dimesiones.toFixed(2),
            Producto: itemElementos.producto,
            Variacion: itemElementos.variacion,
            Total: toCurrencyMXN(totalSku),
          };
          listForReport.push(objforReport);

          if (OrderIDMercadoLibre) {
            OrderIDMercadoLibre.forEach((orderID) => {
              element.orderID = orderID;
              arrOrdenesML.push(element);
            });
          }
        });
      }



      listForReportByElement.push({
        Categoria: categoriaItem,
        Producto: productoItem,
        Variacion: variacionItem,
        "Cantidad (Bultos)": cantidadItem.toFixed(2),
        "P. Unitario": toCurrencyMXN(precioUnitarioItem),
        "Total Kg/Mts/Pz": dimencionesSkusItem.toFixed(2),
        Total: toCurrencyMXN(totalSkusItem),
      });
    });


    const iva = TipoVenta == "Factura" ? TotalVenta * 0.16 : 0;
    const venta_mas_iva = iva + TotalVenta;
    let objElements = Object.assign({}, listForReportByElement);
    let objMultiples = Object.assign({}, listForReport);
    let granCantidadBulto = listForReportByElement.reduce((nex, prev) => {
      return parseFloat(nex) + parseFloat(prev["Cantidad (Bultos)"]);
    }, 0);
    let granTotalKg = listForReportByElement.reduce((nex, prev) => {
      return parseFloat(nex) + parseFloat(prev["Total Kg/Mts/Pz"]);
    }, 0);

    var queryConfig = await db.collection("ConfiguracionesGenerales").doc("ConfiguracionesApiGoogle").get()
    var configEndPoint = queryConfig.data()["NotaDeVenta"];
    configEndPoint.documentName =
      `Nota de Venta ` + numero_orden_venta + " - " + cliente + ".pdf";

    //console.log(objElements);
    //console.log(objMultiples);

    //console.log(listForReportByElement);
    //console.log(listForReport);

    // Campos Header
    camposHeader = {};
    camposHeader["Cliente"] = cliente;
    camposHeader["Empresa"] = empresa;
    camposHeader["No. de Nota"] = numero_orden_venta;
    camposHeader["Fecha de Venta"] = formatoFecha(fechaVenta);
    camposHeader["Total Venta"] = toCurrencyMXN(TotalVenta);
    camposHeader["Gran Total Cantidad (Bultos)"] = granCantidadBulto.toFixed(2);
    camposHeader["Gran Total Kg/Mts/Pza"] = granTotalKg.toFixed(2);
    camposHeader["Comentarios Descuento"] = ComentariosDescuento ?? "";

    // Firebase Storage
    uploadToFirebaseStorage = {};
    uploadToFirebaseStorage.folderName = "archivosPDF";
    uploadToFirebaseStorage.projectId = "kabudumex";
    uploadToFirebaseStorage.bucketName = "kabudumex.appspot.com";
    uploadToFirebaseStorage.fileName = `Nota de Venta ` + numero_orden_venta + " - " + cliente + ".pdf";

    // Firebase Document
    updateFirebaseDocument = {};
    updateFirebaseDocument.projectId = "kabudumex";
    updateFirebaseDocument.collection = "Ventas";
    updateFirebaseDocument.firestorageUrl = true;
    updateFirebaseDocument.field = "urlNota";
    updateFirebaseDocument.document = documentID;


    const apiBody = {
      multiples: { Resumen: listForReportByElement, Desglose: listForReport },
      config: configEndPoint,
      uploadToFirebaseStorage: uploadToFirebaseStorage,
      updateFirebaseDocument: updateFirebaseDocument,
      camposHeader: camposHeader,
      "numero_orden_venta": numero_orden_venta,
      "urlImagen": "https://kabudumex.web.app/public/images/logo.png",

      "No. de Nota": numero_orden_venta,
      "Fecha de Venta": formatoFecha(fechaVenta),
      "Fecha de Hoy": formatoFechaNow(),
      Empresa: empresa,
      "Tipo de Venta": TipoVenta,
      Comentarios: comentarios,
      "Condiciones de pago": condicionesPago,
      "Fecha de Vencimiento": fechaVencimiento,
      "Estatus de la Venta": "Deuda",
      "Gran Total Cantidad (Bultos)": granCantidadBulto.toFixed(2),
      "Gran Total Kg/Mts/Pza": granTotalKg.toFixed(2),
      "Total Venta": toCurrencyMXN(TotalVenta),
      IVA: toCurrencyMXN(iva),
      TotalMasIVA: toCurrencyMXN(venta_mas_iva),
      Pago: toCurrencyMXN(0),
      Saldo: toCurrencyMXN(venta_mas_iva),
      Cliente: cliente,
      "Total Venta sin Descuento": TotalVentaOriginal
        ? toCurrencyMXN(TotalVentaOriginal)
        : toCurrencyMXN(TotalVenta),
      "Comentarios Descuento": ComentariosDescuento ?? "",
    };

    const config = {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(apiBody),
    };
    //console.log(apiBody)

    var urlPDF = await crearPDFFunctions.createPDF(db, apiBody);
    console.log(urlPDF);


    /*
    var responseAPiGoogle = await fetch(
      "https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?user=USUARIO&accion=generarDocumento",
      config
    );
    var result = await responseAPiGoogle.text();
    const res = JSON.parse(result);
    */


    if (EstatusPedido == "Pedido cerrado") {
      await db.collection("Ventas")
        .doc(id)
        .update({
          urlNota: urlPDF,
          EstatusPedido: "Pedido cerrado",
        })

      logger("Venta", "Cierre de pedido (Ya cerrado)", numero_orden_venta, null, user);

    } else {

      if (TipoVenta == "Traspaso") {
        inventarioTraspaso(elementos);
      }
      const objCerrarPedido = {
        EstatusPedido: "Cerrando pedido",
        TotalVenta,
        iva,
        saldo: saldo + venta_mas_iva,
        venta_mas_iva,
        urlNota: urlPDF,
        fechaCierre: new Date(),
      };
      await db.collection("Ventas").doc(id).update(objCerrarPedido)

      logger("Venta", "Cierre de pedido", numero_orden_venta, objCerrarPedido);
      //Se procede a descontar la mercancia del inventario 
      await Promise.all(
        listForReport.map(async (element) => {
          const sku = element.SKU;
          return db
            .collection("Mercancia")
            .where("sku", "==", sku)
            .get()
            .then((response) => {
              let MercanciaList = [];
              response.forEach((doc) => {
                MercanciaList.push({
                  id: doc.id,
                  ...doc.data(),
                });
              });
              const skuItem = MercanciaList[0];

              let cantidad_disponible =
                skuItem.cantidad_disponible -
                element.Cantidad;
              let cantidad_vendida =
                skuItem.cantidad_vendida + element.Cantidad;
              let sub_ubicacion = skuItem.sub_ubicacion;
              let ubicacion = skuItem.ubicacion;
              if (skuItem.cantidad_comprada == 1) {
                ubicacion = "Vendida";
                sub_ubicacion = cliente;
              }
              let = historialMovimientos = skuItem.historialMovimientos == undefined ? `°${numero_orden_venta}:-${element.Cantidad}` : skuItem.historialMovimientos + ` °${numero_orden_venta}:-${element.Cantidad}`
              return db
                .collection("Mercancia").doc(skuItem.id)
                .update({
                  cantidad_disponible,
                  cantidad_vendida,
                  sub_ubicacion,
                  ubicacion,
                  historialMovimientos
                });
            });
        })
      )


      if (arrOrdenesML.length > 0) {
        //Create batchs of 500 documents
        var batchs = [];
        while (arrOrdenesML.length > 0) {
          batchs.push(arrOrdenesML.splice(0, 500));
        }

        //Upload the batchs to Firestore in collection "MLDesglosePublicaciones"
        for (let x in batchs) {

          // Obtenemos la referencia a la colección.
          const collectionRef = db.collection("MLVentas");

          // Creamos una operación de escritura por lotes
          const batch = db.batch();

          // Recorremos la matriz de datos y agregamos cada documento al lote
          for (let y in batchs[x]) {
            let id = batchs[x][y].orderID;

            if (!id || id == "") { console.log(batchs[x][y]); continue; }

            let docRefActualizaciones = collectionRef.doc(id);
            docRefActualizaciones.set({
              costoUnitario: batchs[x][y].costo_unitario ? batchs[x][y].costo_unitario : 0,
              costoTotal: batchs[x][y].costo_unitario * batchs[x][y].cantidad,
              numero_orden_compra: batchs[x][y].numero_orden_compra,
              statusEnvio: 'Procesada',
            }, {
              merge: true
            });

          } // for

          // Confirmamos la operación de escritura por lotes
          await batch.commit();

        } // for batch

      } // if



      //Se actualiza el pedido a Cerrado
      await db.collection("Ventas")
        .doc(id)
        .update({ EstatusPedido: "Pedido cerrado" })

      logger("Venta", "Cierre de pedido Exitoso", numero_orden_venta, null, user);


      fetch("https://us-central1-kabudumex.cloudfunctions.net/summarizeInventory")


      if (arrOrdenesML.length > 0) {
        //Create batchs of 500 documents
        var batchs = [];
        while (arrOrdenesML.length > 0) {
          batchs.push(arrOrdenesML.splice(0, 500));
        }
        //console.log(batchs);

        //Upload the batchs to Firestore in collection "MLDesglosePublicaciones"
        for (let x in batchs) {

          // Obtenemos la referencia a la colección.
          const collectionRef = db.collection("MLVentas");
          //console.log(docRef);

          // Creamos una operación de escritura por lotes
          const batch = db.batch();

          // Recorremos la matriz de datos y agregamos cada documento al lote
          for (let y in batchs[x]) {

            let id = batchs[x][y].orderID;
            //console.log('id:',id);

            if (!id || id == "") { console.log(batchs[x][y]); continue; }

            let docRefActualizaciones = db.collection("MLVentas").doc(batchs[x][y].orderID);
            docRefActualizaciones.set({
              precioUnitario: batchs[x][y].precioUnitario,
              costoTotal: batchs[x][y].costoTotal,
              numero_orden_compra: batchs[x][y].numero_orden_compra,
              estatusOrden: 'Procesada',
            }, {
              merge: true
            });

          } // for

          // Confirmamos la operación de escritura por lotes
          await batch.commit();

        } // for batch

      } // if


    }
    return response.json({ ok: 1, result: "ok" })
  });
});

//Function to append the elementos in the traspaso to tne inventarioTrastraspaso
async function inventarioTraspaso(elementos) {
  var fecha = new Date();

  for (let el of elementos) {

    var idPublicacion = el.idPublicacion;
    var idVariacion = el.idVariacion;
    var skuPublicacion = el.skuPublicacion;
    console.log({ skuPublicacion })

    var traspasos = [];

    for (let sk of el.skus) {
      var cantidad = sk.cantidad;
      var sku = sk.sku;
      console.log({ sku })
      var numero_orden_compra = sk.numero_orden_compra;

      var queryCosto = await db.collection("Mercancia").where("sku", "==", sku).get();
      var costo = queryCosto.docs[0].data().costo_unitario ? Number(queryCosto.docs[0].data().costo_unitario) : 0;

      traspasos.push({ cantidadInicial: cantidad, cantidadVendida: 0, cantidadDisponible: cantidad, sku, costo, numero_orden_compra, fecha });
    }

    //Check if the document skuPublicacion already exists, if not create it
    var docRef = db.collection("InventarioTraspaso").doc(skuPublicacion)
    var doc = await docRef.get();
    if (!doc.exists) {
      await docRef.set({ traspasos: [] });
    }
    //Add to the array of traspasos using arrayUnion
    await docRef.update({
      traspasos: admin.firestore.FieldValue.arrayUnion(...traspasos)
    });
  }
}


//inventarioTraspaso([{"variacion":"2 VISTAS 220 CM CHITA CAFÉ BEIGE","skuPublicacion":"CAMINADORAELECTRICA","skus":[{"dimesiones":12.4,"numero_orden_compra":"INVABRIL20","cantidad":1,"sku":"TELA-FLAN-2 VI-04RS"}],"tituloPublicacion":"Cortina Blackout En 2 Paneles 280x220cm Premium Quality!-Chocolate","publicacionML":"Cortina Blackout En 2 Paneles 280x220cm Premium Quality!-Chocolate|CORTBLACKOUTCHOCO|174502179863|ZVKS02384|MLM1321217720","idFull":"ZVKS02384","categoria":"TELA","cantidad":"1","producto":"FLANEL EST","idVariacion":"174502179863","idPublicacion":"MLM1321217720"},{"variacion":"ROJO","skuPublicacion":"SILLONBARBERO1NEGRO","skus":[{"dimesiones":30,"numero_orden_compra":"TEST03","cantidad":4,"sku":"HILO-TEJE-ROJO-05G1"}],"tituloPublicacion":"Cortina Blackout En 2 Paneles 280x220cm Premium Quality!-Chocolate","publicacionML":"Cortina Blackout En 2 Paneles 280x220cm Premium Quality!-Chocolate|CORTBLACKOUTCHOCO|174502179863|ZVKS02384|MLM1321217720","idFull":"ZVKS02384","categoria":"HILO","cantidad":"4","producto":"TEJER","idVariacion":"174502179863","idPublicacion":"MLM1321217720"}])


//Function para checar el costo de las ventas
async function checarCostoVentas(arraySkus) {

  //var arraySkus = [{ sku: "SILLONBARBERO1NkEGRO", cantidad: 1, orderId: "2000006246074558", tipoEnvio: "Bodega" }, { sku: "CAMINADORAELECTRICA", cantidad: 4, orderId: "2000006275797732", tipoEnvio: "fullML" }, { sku: "CAMINADORAELECTRICA", cantidad: 1, orderId: "2000006276193992", tipoEnvio: "fullML" }, { sku: "SILLONBARBERO1NEGRO", cantidad: 1, orderId: "2000006277846288", tipoEnvio: "Bodega" }];

  //Order arraySkus by sku and tipoEnvio
  arraySkus.sort((a, b) => (a.sku > b.sku) ? 1 : (a.sku === b.sku) ? ((a.tipoEnvio > b.tipoEnvio) ? 1 : -1) : -1)

  //Get the cost of each sku
  var skuToCheck;
  var tipoEnvioToCheck;
  var infoTraspasos;
  var indexTraspasoCantidadDisponible;
  var indexTraspasoDisponible;
  var indexTraspaso;
  var cantidadDisponible = 0;
  var costo;
  var totalCantidadVendida = 0;
  for (let v in arraySkus) {
    var venta = arraySkus[v];
    var sku = venta.sku;
    var cantidadVendida = venta.cantidad;
    var orderId = venta.orderId;
    var tipoEnvio = venta.tipoEnvio;

    if (tipoEnvio == "fullML") {
      if (skuToCheck != sku) {
        skuToCheck = sku;
        tipoEnvioToCheck = tipoEnvio;
        totalCantidadVendida = 0;

        var queryInventario = await db.collection("InventarioTraspaso").doc(sku).get();
        var queryData = queryInventario.data();
        if (!queryData) {
          console.log("No existe el sku en el inventario")
          db.collection("MLVentas").doc(orderId).update({ costoActualizado: false });
          continue;
        }
        var infoTraspasos = queryData.traspasos;
        var indexTraspasoDisponible = infoTraspasos.findIndex((traspaso) => traspaso.cantidadDisponible > 0);
        var indexTraspaso = indexTraspasoDisponible != -1 ? indexTraspasoDisponible : infoTraspasos.length - 1;
        console.log({ indexTraspaso, sku })
        var cantidadDisponible = infoTraspasos[indexTraspaso].cantidadDisponible;
        var costo = infoTraspasos[indexTraspaso].costo;
        var numero_orden_compra = infoTraspasos[indexTraspaso].numero_orden_compra;

        totalCantidadVendida += cantidadVendida;
        cantidadDisponible -= cantidadVendida;

        db.collection("MLVentas").doc(orderId).update({ costoUnitario: costo, costoTotal: costo * cantidadVendida, costoActualizado: true, costoCorrecto: indexTraspasoDisponible != -1 ? true : false, numero_orden_compra });
      } else {
        totalCantidadVendida += cantidadVendida;
        cantidadDisponible -= cantidadVendida;
        db.collection("MLVentas").doc(orderId).update({ costoUnitario: costo, costoTotal: costo * cantidadVendida, costoActualizado: true, costoCorrecto: indexTraspasoDisponible != -1 ? true : false, numero_orden_compra });
      }

      //Update the traspaso
      if (!arraySkus[v + 1] || arraySkus[v + 1].sku != sku) {
        infoTraspasos[indexTraspaso].cantidadVendida += totalCantidadVendida;
        infoTraspasos[indexTraspaso].cantidadDisponible -= totalCantidadVendida;
        db.collection("InventarioTraspaso").doc(sku).update({ traspasos: infoTraspasos });
      }
    }
  }
}



//checarCostoVentas();


async function logger(area, accion, id, mensaje, user) {
  const db = admin.firestore();
  const objLog = {
    timestamp: new Date(),
    usuario: user,
    area,
    accion,
    id,
    mensaje,
  };
  Object.keys(objLog).forEach((key) => {
    if (objLog[key] === undefined || objLog[key] === null) {
      delete objLog[key];
    }
  });
  return db.collection("CUSTOM-LOGS").doc().set(objLog);
};


const formatoFecha = (fechaVenta) => {
  const dt = new Date(fechaVenta.seconds * 1000);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const toCurrencyMXN = (monto) =>
  Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    monto
  );

const formatoFechaNow = () => {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

/*
var request = require('request').defaults({
  timeout: 60000,
  gzip: true,
  forever: false,
  pool: {
    maxSockets: Infinity
  }
});
*/

//Funcion para determinar el costo unitario de las ventas de ML
async function asignarCostoUnitarioML() {

  var startTime = new Date().getTime();
  var date = new Date();

  var queryVentas = await db.collection("MLVentas").where("iterations", "<" , 1000).limit(500).get();
  var ventas = queryVentas.docs.map(doc => doc.data());

  //Sort ventas by only by sku
  ventas.sort((a, b) => (a.sku > b.sku) ? 1 : -1)

  var ventasToUpdate = [];
  var mercanciaToUpdate = {};

  var lastSku = "";
  var mercanciaToCheck;

  for (let venta of ventas) {
    var skuVenta = venta.sku;

    if(!skuVenta){
      ventasToUpdate.push({ docId: venta.orderId, mercanciaCostoUnitario: 0, mercanciaCostoTotal: 0, mercanciaCostoActualizado: true, mercanciaNumero_orden_compra: "", iterations: venta.iterations + 1000, mercanciaCostoCorrecto: false, mercanciaComentarioCosto: "No esta configurado el SKU en ML", mercanciaFechaActualizacion: date });
      continue;
    }

    if (skuVenta != lastSku) {
      lastSku = skuVenta;
      //Get all the mercancia that in its array of skuML has the skuVenta
      var mercanciaToCheckQuery = await db.collection("Mercancia").where("skuML", "array-contains", skuVenta).get();
      mercanciaToCheck = mercanciaToCheckQuery.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    }

      var cantidad = venta.cantidad;

      //If there is no mercancia with the skuVenta
      if (mercanciaToCheck.length == 0) {
        ventasToUpdate.push({ docId: venta.orderId, mercanciaCostoUnitario: 0, mercanciaCostoTotal: 0, mercanciaCostoLogistica: 0, mercanciaCostoLogisticaTotal: 0, mercanciaCostoNetoUnitario: 0, mercanciaCostoNetoTotal: 0, mercanciaCostoActualizado: true, mercanciaNumero_orden_compra: "", mercanciaSku: null, iterations: venta.iterations + 1000, mercanciaCostoCorrecto: false, mercanciaComentarioCosto: "No se encontro el SKUML en Mercancia", mercanciaFechaActualizacion: date  });
        continue;
      }

      //Sort mercanciaToCheck by fecha_registro
      mercanciaToCheck.sort((a, b) => (a.fecha_registro > b.fecha_registro) ? 1 : -1)

      //Check if mercanciaToCheck has quantity available
      for (let mercancia of mercanciaToCheck) {
        var costoUnitario = mercancia.costo_unitario ? Number(mercancia.costo_unitario) : 0;
        var costoTotal = costoUnitario * cantidad;
        var costoLogistica = mercancia.costo_logistica_unitario ? Number(mercancia.costo_logistica_unitario) : 0;
        var costoLogisticaTotal = costoLogistica * cantidad;
        var costoNetoUnitario = costoUnitario + costoLogistica;
        var costoNetoTotal = costoNetoUnitario * cantidad;

        if (!mercancia.ventasML || mercancia.ventasML < mercancia.cantidad_comprada) {
          ventasToUpdate.push({ 
            docId: venta.orderId, 
            mercanciaCostoUnitario: costoUnitario, 
            mercanciaCostoTotal: costoTotal, 
            mercanciaCostoLogistica: costoLogistica,
            mercanciaCostoLogisticaTotal: costoLogisticaTotal,
            mercanciaCostoNetoUnitario: costoNetoUnitario,
            mercanciaCostoNetoTotal: costoNetoTotal,
            mercanciaCostoActualizado: true, 
            mercanciaNumero_orden_compra: mercancia.numero_orden_compra, 
            mercanciaCategoria: mercancia.categoria, 
            mercanciaProducto: mercancia.producto, 
            mercanciaVariacion: mercancia.variacion, 
            mercanciaSku: mercancia.sku, 
            iterations: venta.iterations + 1000, 
            mercanciaCostoCorrecto: costoUnitario > 0 ? true : false, 
            mercanciaComentarioCosto: costoUnitario > 0 ? "Costo Correcto" : "Costo en Cero", 
            mercanciaFechaActualizacion: date  });

          //Para actualizar la mercancia
          var docId = mercancia.docId;
          mercanciaToUpdate[docId] ? mercanciaToUpdate[docId].ventasML += cantidad : mercanciaToUpdate[docId] = { ventasML: cantidad };
          break;
        }
        if (mercanciaToCheck.indexOf(mercancia) == mercanciaToCheck.length - 1) {
          ventasToUpdate.push({ 
            docId: venta.orderId, 
            mercanciaCostoUnitario: costoUnitario, 
            mercanciaCostoTotal: costoTotal, 
            mercanciaCostoLogistica: costoLogistica,
            mercanciaCostoLogisticaTotal: costoLogisticaTotal,
            mercanciaCostoNetoUnitario: costoNetoUnitario,
            mercanciaCostoNetoTotal: costoNetoTotal,
            mercanciaCostoActualizado: true, 
            mercanciaNumero_orden_compra: mercancia.numero_orden_compra, 
            mercanciaCategoria: mercancia.categoria, 
            mercanciaProducto: mercancia.producto, 
            mercanciaVariacion: mercancia.variacion, 
            mercanciaSku: mercancia.sku, 
            iterations: venta.iterations + 1000, mercanciaCostoCorrecto: false, mercanciaComentarioCosto: `No hay mercancia disponible${costoUnitario == 0 ? " - Costo en Cero" : ""}`, mercanciaFechaActualizacion: date  });

          //Para actualizar la mercancia
          var docId = mercancia.docId;
          mercanciaToUpdate[docId] ? mercanciaToUpdate[docId].ventasML += cantidad : mercanciaToUpdate[docId] = { ventasML: cantidad };
        }
      }
    }

    console.log("Finished checking ventas")

    //Update the ventas by batch of 500
    var batch = db.batch();
    for (let venta of ventasToUpdate) {
      //console.log(venta)
      var docRef = db.collection("MLVentas").doc(venta.docId);
      delete venta.docId;
      //Merge with the existing data
      batch.update(docRef, venta);
    }
    await batch.commit();

    console.log("Finished updating ventas")

    //Update the mercancia
    var batch = db.batch();
    for (let docId in mercanciaToUpdate) {
      //console.log(docId)
      //await db.collection("Mercancia").doc(docId).update({ ventasML: firestore.FieldValue.increment(mercanciaToUpdate[docId].ventasML) });
      var docRef = db.collection("Mercancia").doc(docId);
      batch.update(docRef, { ventasML: firestore.FieldValue.increment(mercanciaToUpdate[docId].ventasML) });
    }
    await batch.commit();

    var endTime = new Date().getTime();
    var timeDiff = (endTime - startTime) / 1000;

    return {timeDiff, totalUpdates: ventasToUpdate.length, mercanciaToUpdate: Object.keys(mercanciaToUpdate).length}
  }

  //asignarCostoUnitarioML();


//Funcion para arreglar el costo unitario de las ventas de ML que tuvieron error
async function arreglarCostoUnitarioML() {

  var startTime = new Date().getTime();
  var date = new Date();

  var queryVentas = await db.collection("MLVentas").where("mercanciaCostoCorrecto", "=" , false).where("mercanciaComentarioCosto", "not-in", ["No hay mercancia disponible", "No hay mercancia disponible "]).limit(500).get();
  var ventas = queryVentas.docs.map(doc => doc.data());

  //Sort ventas by only by sku
  ventas.sort((a, b) => (a.sku > b.sku) ? 1 : -1)

  var ventasToUpdate = [];
  var mercanciaToUpdate = {};

  var lastSku = "";
  var mercanciaToCheck;

  for (let venta of ventas) {
    var skuVenta = venta.sku;
    var comentarioErrorCosto = venta.mercanciaComentarioCosto;

    if(!skuVenta){
      ventasToUpdate.push({ docId: venta.orderId, mercanciaCostoUnitario: 0, mercanciaCostoTotal: 0, mercanciaCostoActualizado: true, mercanciaNumero_orden_compra: "", mercanciaCostoCorrecto: false, mercanciaComentarioCosto: "No esta configurado el SKU en ML", mercanciaFechaActualizacion: date, mercanciaCostoArreglado: true });
      continue;
    }

    if (skuVenta != lastSku) {
      lastSku = skuVenta;
      //Get all the mercancia that in its array of skuML has the skuVenta
      var mercanciaToCheckQuery = await db.collection("Mercancia").where("skuML", "array-contains", skuVenta).get();
      mercanciaToCheck = mercanciaToCheckQuery.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    }

      var cantidad = venta.cantidad;

      //If there is no mercancia with the skuVenta
      if (mercanciaToCheck.length == 0) {
        ventasToUpdate.push({ docId: venta.orderId, mercanciaCostoUnitario: 0, mercanciaCostoTotal: 0, mercanciaCostoActualizado: true, mercanciaNumero_orden_compra: "", mercanciaSku: null, mercanciaCostoCorrecto: false, mercanciaComentarioCosto: "No se encontro el SKUML en Mercancia", mercanciaFechaActualizacion: date, mercanciaCostoArreglado: true  });
        continue;
      }

      //Sort mercanciaToCheck by fecha_registro
      mercanciaToCheck.sort((a, b) => (a.fecha_registro > b.fecha_registro) ? 1 : -1)

      //Check if mercanciaToCheck has quantity available
      for (let mercancia of mercanciaToCheck) {
        var costoUnitario = mercancia.costo_unitario ? Number(mercancia.costo_unitario) : 0;
        var costoTotal = costoUnitario * cantidad;
        var costoLogistica = mercancia.costo_logistica ? Number(mercancia.costo_logistica) : 0;
        var costoLogisticaTotal = costoLogistica * cantidad;
        var costoNetoUnitario = costoUnitario + costoLogistica;
        var costoNetoTotal = costoNetoUnitario * cantidad;

        if (!mercancia.ventasML || mercancia.ventasML < mercancia.cantidad_comprada) {
          ventasToUpdate.push({ 
            docId: venta.orderId, 
            mercanciaCostoUnitario: costoUnitario, 
            mercanciaCostoTotal: costoTotal, 
            mercanciaCostoLogistica: costoLogistica,
            mercanciaCostoLogisticaTotal: costoLogisticaTotal,
            mercanciaCostoNetoUnitario: costoNetoUnitario,
            mercanciaCostoNetoTotal: costoNetoTotal,
            mercanciaCostoActualizado: true, 
            mercanciaNumero_orden_compra: mercancia.numero_orden_compra, 
            mercanciaCategoria: mercancia.categoria, 
            mercanciaProducto: mercancia.producto, 
            mercanciaVariacion: mercancia.variacion, 
            mercanciaSku: mercancia.sku, 
            mercanciaCostoCorrecto: costoUnitario > 0 ? true : false, 
            mercanciaComentarioCosto: costoUnitario > 0 ? "Costo Correcto" : "Costo en Cero", 
            mercanciaFechaActualizacion: date, 
            mercanciaCostoArreglado: true  });

          //Para actualizar la mercancia
          if(comentarioErrorCosto == "No se encontro el SKUML en Mercancia"){
          var docId = mercancia.docId;
          mercanciaToUpdate[docId] ? mercanciaToUpdate[docId].ventasML += cantidad : mercanciaToUpdate[docId] = { ventasML: cantidad };
          }
          break;
        }
        if (mercanciaToCheck.indexOf(mercancia) == mercanciaToCheck.length - 1) {
          ventasToUpdate.push({ 
            docId: venta.orderId, 
            mercanciaCostoUnitario: costoUnitario, 
            mercanciaCostoTotal: costoTotal, 
            mercanciaCostoLogistica: costoLogistica,
            mercanciaCostoLogisticaTotal: costoLogisticaTotal,
            mercanciaCostoNetoUnitario: costoNetoUnitario,
            mercanciaCostoNetoTotal: costoNetoTotal,
            mercanciaCostoActualizado: true, 
            mercanciaNumero_orden_compra: mercancia.numero_orden_compra, 
            mercanciaCategoria: mercancia.categoria, 
            mercanciaProducto: mercancia.producto, 
            mercanciaVariacion: mercancia.variacion, 
            mercanciaSku: mercancia.sku, 
            mercanciaCostoCorrecto: false, 
            mercanciaComentarioCosto: `No hay mercancia disponible${costoUnitario == 0 ? " - Costo en Cero" : ""}`, 
            mercanciaFechaActualizacion: date, 
            mercanciaCostoArreglado: true  });

          //Para actualizar la mercancia
          if(comentarioErrorCosto == "No se encontro el SKUML en Mercancia"){
          var docId = mercancia.docId;
          mercanciaToUpdate[docId] ? mercanciaToUpdate[docId].ventasML += cantidad : mercanciaToUpdate[docId] = { ventasML: cantidad };
          }
        }
      }
    }

    console.log("Finished checking ventas")

    //Update the ventas by batch of 500
    var batch = db.batch();
    for (let venta of ventasToUpdate) {
      //console.log(venta)
      var docRef = db.collection("MLVentas").doc(venta.docId);
      delete venta.docId;
      //Merge with the existing data
      batch.update(docRef, venta);
    }
    await batch.commit();

    console.log("Finished updating ventas")

    //Update the mercancia
    var batch = db.batch();
    for (let docId in mercanciaToUpdate) {
      //console.log(docId)
      //await db.collection("Mercancia").doc(docId).update({ ventasML: firestore.FieldValue.increment(mercanciaToUpdate[docId].ventasML) });
      var docRef = db.collection("Mercancia").doc(docId);
      batch.update(docRef, { ventasML: firestore.FieldValue.increment(mercanciaToUpdate[docId].ventasML) });
    }
    await batch.commit();

    var endTime = new Date().getTime();
    var timeDiff = (endTime - startTime) / 1000;

    return {timeDiff, totalUpdates: ventasToUpdate.length, mercanciaToUpdate: Object.keys(mercanciaToUpdate).length}
  }

  async function masiveAsignarCostoUnitarioML() {

    for(let i = 0; i < 200; i++){
      console.log({i})
      var status = await asignarCostoUnitarioML();
      //var status = await arreglarCostoUnitarioML();
      console.log(status)
      if(status.totalUpdates < 500){
        break;
      }
    }

    // for(let j = 0; j < 100; j++){
    //   console.log({j})
    //   var status = await recalcularVentasCanceladasML();
    //   console.log(status)
    //   if(status.totalUpdates < 500){
    //     break;
    //   }
    // }
  }

  //masiveAsignarCostoUnitarioML();

  //Funcion para recalcular en Mercancia las ventas canceladas de ML
  async function recalcularVentasCanceladasML() {

    var startTime = new Date().getTime();

    var queryVentas = await db.collection("MLVentas").where("iterations", ">" , 1000).where("iterations", "<" , 2000).where("status", "==", "cancelled").limit(500).get();
    var ventas = queryVentas.docs.map(doc => doc.data());

    //Sort by mercanciaSku
    ventas.sort((a, b) => (a.mercanciaSku > b.mercanciaSku) ? 1 : -1)

    var mercanciaToUpdate = {};
    var ventasToUpdate = [];
    var ventasSinSku = 0;

    var lastSku = "";

    for (let venta of ventas) {
      ventasToUpdate.push(venta.orderId);
      if(!venta.mercanciaSku){
        ventasSinSku++;
        continue;
      }
      if (venta.mercanciaSku != lastSku) {
        lastSku = venta.mercanciaSku;
        //Get all the mercancia that in its array of skuML has the skuVenta
        var mercanciaToCheckQuery = await db.collection("Mercancia").where("sku", "==", venta.mercanciaSku).get();
        var docId = mercanciaToCheckQuery.docs[0].id;
      }

      var cantidad = venta.cantidad;

      mercanciaToUpdate[docId] ? mercanciaToUpdate[docId].ventasML += cantidad : mercanciaToUpdate[docId] = { ventasML: cantidad };

    }

    //console.log({ventasToUpdate, mercanciaToUpdate})

    //Update the ventas
    var batch = db.batch();
    for (let docId in ventasToUpdate) {
      var docRef = db.collection("MLVentas").doc(ventasToUpdate[docId]);
      batch.update(docRef, { iterations: firestore.FieldValue.increment(1000) });
    }
    await batch.commit();

    //Update mercancia
    var batch = db.batch();
    for (let docId in mercanciaToUpdate) {
      var docRef = db.collection("Mercancia").doc(docId);
      batch.update(docRef, { ventasML: firestore.FieldValue.increment(-mercanciaToUpdate[docId].ventasML) });
    }
    await batch.commit();

    var endTime = new Date().getTime();
    var timeDiff = (endTime - startTime) / 1000;

    return {timeDiff, totalUpdates: ventasToUpdate.length, mercanciaToUpdate: Object.keys(mercanciaToUpdate).length, ventasSinSku}
  }

  //recalcularVentasCanceladasML();


  //Function to execute mercadolibreFunctions
  exports.executeMercadolibreFunctions = functions
  // exports.executeMercadolibreFunctions = functions.runWith({
  //   timeoutSeconds: 540,
  //   memory: "1GB",
  //})
    .https.onRequest(async (request, response) => {
    cors(request, response, async () => {

      //Allow CORS
      response.set('Access-Control-Allow-Origin', "*");
      response.set('Access-Control-Allow-Methods', 'GET, POST');
      response.set('Access-Control-Allow-Headers', 'Content-Type');

      var functionToExecute = request.query.functionToExecute;

      if (functionToExecute == undefined) {
        return response.json({ ok: 0, error: "Faltan parametros" })
      }

      switch (functionToExecute) {
        case "agregarVentasML":
          var result = await mercadolibreFunctions.agregarVentasML(db);
          await masiveAsignarCostoUnitarioML();
          await recalcularVentasCanceladasML();
          break;
        case "agregarMLInventario":
          var result = await mercadolibreFunctions.agregarMLInventario(db);
          break;
        case "popularPublicaciones":
          var result = await mercadolibreFunctions.popularPublicaciones(db);
          break;
        case "agregarPreguntasML":
          var result = await mercadolibreFunctions.agregarPreguntasML(db);
          break;
        case "actualizarMLVentas":
          var result = await mercadolibreFunctions.actualizarMLVentas(db);
          break;
        case "buscarMLVentas":
          var result = await mercadolibreFunctions.buscarMLVentas(db);
          break;
      }

      return response.json({ ok: 1, result: "ok", result })
    })
  });

  //Function to execute funcionesGenerales
  exports.executeFuncionesGenerales = functions
  // .runWith({
  //   timeoutSeconds: 540,
  //   memory: "512MB",
  // })
  .https.onRequest(async (request, response) => {
    cors(request, response, async () => {

      //Allow CORS
      response.set('Access-Control-Allow-Origin', "*");
      response.set('Access-Control-Allow-Methods', 'GET, POST');
      response.set('Access-Control-Allow-Headers', 'Content-Type');

      var functionToExecute = request.query.functionToExecute;

      console.log({ functionToExecute, request: request.query })

      if (functionToExecute == undefined) {
        return response.json({ ok: 0, error: "Faltan parametros" })
      }

      switch (functionToExecute) {
        case "asignarGastosOrdenesDeCompra":
          var idEgreso = Number(request.query.idEgreso);
          var result = await funcionesGenerales.asignarGastosOrdenesDeCompra(db, idEgreso);
          break;
        case "eliminarGastosOrdenesDeCompra":
          var idEgreso = request.query.idEgreso;
          var result = await funcionesGenerales.eliminarGastosOrdenesDeCompra(db, idEgreso);
          break;
        case "recalcularCostoLogisticaByIdMercancia":
          var idMercancia = request.query.idMercancia;
          var result = await funcionesGenerales.recalcularCostoLogisticaByIdMercancia(db, idMercancia);
          break;
      }

      return response.json({ ok: 1, status: "ok", result })
    })
  });



//Function to update the mercancia
//mercadolibreFunctions.agregarVentasML(db);
//mercadolibreFunctions.agregarMLInventario(db);
//mercadolibreFunctions.popularPublicaciones(db);
//mercadolibreFunctions.agregarPreguntasML(db);
//mercadolibreFunctions.actualizarMLVentas(db);
//mercadolibreFunctions.buscarMLVentas(db);

//mercadolibreFunctions.imprimirEtiquetas(db,'42658610684,42658503091,42658607334');
//console.log(db)