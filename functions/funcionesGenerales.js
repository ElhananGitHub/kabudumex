var firestore = require("@google-cloud/firestore");


//Function to get db
async function getDB() {
    const functions = require("firebase-functions");
    const admin = require("firebase-admin");
    admin.initializeApp(functions.config().firebase);
    const db = admin.firestore();
    return db;
}


//Funcion para asignar gastos a ordenesDeCompra
async function asignarGastosOrdenesDeCompra(db, idEgreso) {
    if (!db) {
        var functions = require("firebase-functions");
        var admin = require("firebase-admin");
        admin.initializeApp(functions.config().firebase);
        var db = admin.firestore();
    }

    console.log({ idEgreso })

    var queryEgreso = await db.collection('Egresos').where('idEgreso', '==', idEgreso).get();
    var dataEgreso = queryEgreso.docs[0].data();

    var monto = dataEgreso.monto;
    var receptor = dataEgreso.receptor;
    var concepto = dataEgreso.concepto;
    var descripcion = dataEgreso.descripcion;
    var ordenCompraDesglose = dataEgreso.ordenCompraDesglose;
    var fechaEgreso = dataEgreso.fechaInicio;

    console.log({ dataEgreso, monto, ordenCompraDesglose })

    for (var i = 0; i < ordenCompraDesglose.length; i++) {
        var idOrdenCompra = ordenCompraDesglose[i].ordenCompra;
        var porcentaje = ordenCompraDesglose[i].porcentaje;
        var montoAsignado = monto * porcentaje;

        var mercanciaDeOrdenQuery = await db.collection('Mercancia').where('numero_orden_compra', '==', idOrdenCompra).get();
        var mercanciaDeOrden = {};
        var totalCantidadDisponible = 0;
        var totalCantidadComprada = 0;
        mercanciaDeOrdenQuery.forEach(doc => {
            mercanciaDeOrden[doc.id] = doc.data();
            totalCantidadDisponible += doc.data().cantidad_disponible;
            totalCantidadComprada += doc.data().cantidad_comprada;
        });

        for (x in mercanciaDeOrden) {

            //if(mercanciaDeOrden[x].cantidad_disponible == 0) continue;

            var costo_logistica = Number((montoAsignado * (mercanciaDeOrden[x].cantidad_comprada / totalCantidadComprada)).toFixed(2));
            var costo_logistica_unitario = Number((costo_logistica / mercanciaDeOrden[x].cantidad_comprada).toFixed(2));

            // console.log({x, idOrdenCompra, montoAsignado, totalCantidadDisponible, cantidad_disponible: mercanciaDeOrden[x].cantidad_disponible, costo_logistica})

            await db.collection('Mercancia').doc(x).update({
                costo_logistica_total: firestore.FieldValue.increment(costo_logistica),
                costo_logistica_unitario: firestore.FieldValue.increment(costo_logistica_unitario),
                costo_logistica_asignaciones: firestore.FieldValue.increment(1),
                costo_logistica_desglose: firestore.FieldValue.arrayUnion({
                    idEgreso,
                    monto: costo_logistica,
                    montoUnitario: costo_logistica_unitario,
                    receptor,
                    concepto,
                    descripcion,
                    fecha: fechaEgreso,
                    cantidad_disponible: mercanciaDeOrden[x].cantidad_disponible,
                    cantidad_comprada: mercanciaDeOrden[x].cantidad_comprada,
                    montoEgreso: monto,
                    porcentaje,
                    montoAsignado,
                }),
                costo_logistica_desglose_text: mercanciaDeOrden[x].costo_logistica_desglose_text ? mercanciaDeOrden[x].costo_logistica_desglose_text + '\n' + `${idEgreso} - ${receptor} - ${concepto}: ${costo_logistica}` : `${idEgreso} - ${receptor} - ${concepto}: ${costo_logistica}`
            })

            await recalcularCostoUnitarioBySku(db, mercanciaDeOrden[x].sku);

        }
    }

    return true;

}

//asignarGastosOrdenesDeCompra(null, 52);

//Funcion para eliminar gastos de ordenes de compra
async function eliminarGastosOrdenesDeCompra(db, idEgreso) {
    if (!db) {
        var functions = require("firebase-functions");
        var admin = require("firebase-admin");
        admin.initializeApp(functions.config().firebase);
        var db = admin.firestore();
    }

    var queryEgreso = await db.collection('Egresos').where('idEgreso', '==', idEgreso).get();
    var dataEgreso = queryEgreso.docs[0].data();

    var monto = dataEgreso.monto;
    var receptor = dataEgreso.receptor;
    var concepto = dataEgreso.concepto;
    var descripcion = dataEgreso.descripcion;
    var ordenCompraDesglose = dataEgreso.ordenCompraDesglose;
    var fechaEgreso = dataEgreso.fechaInicio;

    console.log({ dataEgreso, monto, ordenCompraDesglose })

    for (var i = 0; i < ordenCompraDesglose.length; i++) {
        var idOrdenCompra = ordenCompraDesglose[i].ordenCompra;
        var porcentaje = ordenCompraDesglose[i].porcentaje;
        var montoAsignado = monto * porcentaje;

        var mercanciaDeOrdenQuery = await db.collection('Mercancia').where('numero_orden_compra', '==', idOrdenCompra).get();
        var mercanciaDeOrden = {};
        var totalCantidadDisponible = 0;
        var totalCantidadComprada = 0;
        mercanciaDeOrdenQuery.forEach(doc => {
            mercanciaDeOrden[doc.id] = doc.data();
            totalCantidadDisponible += doc.data().cantidad_disponible;
            totalCantidadComprada += doc.data().cantidad_comprada;
        });

        for (x in mercanciaDeOrden) {

            if (mercanciaDeOrden[x].cantidad_disponible == 0) continue;

            var costo_logistica = Number((montoAsignado * (mercanciaDeOrden[x].cantidad_comprada / totalCantidadComprada)).toFixed(2));

            //console.log({x, idOrdenCompra, montoAsignado, totalCantidadDisponible, cantidad_disponible: mercanciaDeOrden[x].cantidad_disponible, costo_logistica})

            await db.collection('Mercancia').doc(x).update({
                costo_logistica_total: firestore.FieldValue.increment(-montoAsignado),
                costo_logistica_unitario: firestore.FieldValue.increment(-costo_logistica),
                costo_logistica_desglose: firestore.FieldValue.arrayRemove({
                    idEgreso,
                    monto: costo_logistica,
                    receptor,
                    concepto,
                    descripcion,
                    fecha: fechaEgreso,
                    cantidad_disponible: mercanciaDeOrden[x].cantidad_disponible,
                    montoEgreso: monto,
                    porcentaje,
                    montoAsignado
                }),
                costo_logistica_desglose_text: mercanciaDeOrden[x].costo_logistica_desglose_text.replace(`${idEgreso} - ${receptor} - ${concepto}: ${costo_logistica}`, '')
            })

            await recalcularCostoUnitarioBySku(db, mercanciaDeOrden[x].sku);
        }
    }

    return true;
}

//eliminarGastosOrdenesDeCompra(null, 52);


//Funcion para recalcular costo unitario segun sku
async function recalcularCostoUnitarioBySku(db, sku) {

    if (!db) {
        var functions = require("firebase-functions");
        var admin = require("firebase-admin");
        admin.initializeApp(functions.config().firebase);
        var db = admin.firestore();
    }

    var queryDataSku = await db.collection("Mercancia").where("sku", "==", sku).get();
    var dataSku = queryDataSku.docs.map(doc => doc.data())[0];

    var costo_logistica_unitario = dataSku.costo_logistica_unitario ? Number(dataSku.costo_logistica_unitario) : 0;
    var costo_unitario = dataSku.costo_unitario ? Number(dataSku.costo_unitario) : 0;
    var costo_unitario_neto = costo_unitario + costo_logistica_unitario;

    var startFrom = "0";
    var limit = 500;
    var updates = 0;
    var iterations = 0;

    while (true) {

        var queryVentas = await db.collection("MLVentas").where("mercanciaSku", "==", sku).where("orderId", ">", startFrom).limit(limit).get();
        var ventas = queryVentas.docs.map(doc => doc.data());

        if (ventas.length == 0) {
            break;
        }

        //Batch update ventas con el costo unitario
        var batch = db.batch();
        for (let venta of ventas) {
            var costoTotal = venta.cantidad * costo_unitario;
            var costoTotalLogistica = venta.cantidad * costo_logistica_unitario;
            var costoTotalNeto = venta.cantidad * costo_unitario_neto;

            var docRef = db.collection("MLVentas").doc(venta.orderId);
            batch.update(docRef, { mercanciaCostoUnitario: costo_unitario, mercanciaCostoTotal: costoTotal, mercanciaCostoLogistica: costo_logistica_unitario, mercanciaCostoLogisticaTotal: costoTotalLogistica, mercanciaCostoNetoUnitario: costo_unitario_neto, mercanciaCostoNetoTotal: costoTotalNeto, mercanciaCostoActualizado: true, mercanciaCostoCorrecto: true, mercanciaComentarioCosto: "Costo Actualizado x SKU", mercanciaFechaActualizacion: new Date() });
        }
        await batch.commit();

        startFrom = ventas[ventas.length - 1].orderId;
        updates += ventas.length;
        iterations++;

        console.log({ updates, iterations, startFrom })

    }

    return { updates, iterations };
}

//recalcularCostoUnitarioBySku(null, "MESA-MESA-BLAN-09Z6");

//Funcion para recalcular costo unitario segun sku en MLVentas
async function recalcularCostoLogisticaByIdMercancia(db, idMercancia) {

    if (!db) {
        var functions = require("firebase-functions");
        var admin = require("firebase-admin");
        admin.initializeApp(functions.config().firebase);
        var db = admin.firestore();
    }

    var queryDataSku = await db.collection("Mercancia").doc(idMercancia).get();
    var dataSku = queryDataSku.data();

    var costo_logistica_desglose = dataSku.costo_logistica_desglose;
    var cantidad_comprada = dataSku.cantidad_comprada;
    var numero_orden_compra = dataSku.numero_orden_compra;
    var sku = dataSku.sku;


    var costo_logistica_total = 0;
    var costo_logistica_desglose_text = '';


    for (var i = 0; i < costo_logistica_desglose.length; i++) {

        var idEgreso = costo_logistica_desglose[i].idEgreso;
        var concepto = costo_logistica_desglose[i].concepto;
        var receptor = costo_logistica_desglose[i].receptor;
        var descripcion = costo_logistica_desglose[i].descripcion;
        var fecha = costo_logistica_desglose[i].fecha;
        var porcentaje = costo_logistica_desglose[i].porcentaje;
        var montoEgreso = costo_logistica_desglose[i].montoEgreso;
        var montoAsignado = costo_logistica_desglose[i].montoAsignado;
        var monto = costo_logistica_desglose[i].monto;



        if (costo_logistica_desglose[i].cantidad_comprada) {
            costo_logistica_total += monto;
            costo_logistica_desglose_text += `${idEgreso} - ${receptor} - ${concepto}: ${monto}\n`;
        } else {
            //Get all the mercancia with the same numero_orden_compra
            var queryMercancia = await db.collection("Mercancia").where("numero_orden_compra", "==", numero_orden_compra).get();
            var mercancia = queryMercancia.docs.map(doc => doc.data());

            var totalCantidadComprada = 0;
            mercancia.forEach(mercancia => {
                totalCantidadComprada += mercancia.cantidad_comprada;
            });

            var monto = montoAsignado / totalCantidadComprada * cantidad_comprada;
            costo_logistica_total += monto;
            costo_logistica_desglose_text += `${idEgreso} - ${receptor} - ${concepto}: ${Number(monto).toFixed(2)}\n`;

            console.log({
                idEgreso,
                receptor,
                concepto,
                descripcion,
                fecha,
                porcentaje,
                montoAsignado,
                montoEgreso,
                cantidad_comprada: cantidad_comprada,
                totalCantidadComprada,
                monto: Number(monto.toFixed(2)),
                montoUnitario: Number((monto / cantidad_comprada).toFixed(2))
            })


            await db.collection("Mercancia").doc(idMercancia).update({
                costo_logistica_desglose: firestore.FieldValue.arrayRemove(costo_logistica_desglose[i]),
            });

            await db.collection("Mercancia").doc(idMercancia).update({
                costo_logistica_desglose: firestore.FieldValue.arrayUnion({
                    idEgreso,
                    receptor,
                    concepto,
                    descripcion,
                    fecha,
                    porcentaje,
                    montoAsignado,
                    montoEgreso,
                    cantidad_comprada: cantidad_comprada,
                    totalCantidadComprada,
                    monto: Number(monto.toFixed(2)),
                    montoUnitario: Number((monto / cantidad_comprada).toFixed(2))


                })
            });


        }

    }

    var costo_logistica_unitario = costo_logistica_total / cantidad_comprada;

    //console.log({costo_logistica_total, costo_logistica_unitario, costo_logistica_desglose_text, costo_logistica_asignaciones: costo_logistica_desglose.length})

    await db.collection("Mercancia").doc(idMercancia).update({
        costo_logistica_total: Number(costo_logistica_total.toFixed(2)),
        costo_logistica_unitario: Number(costo_logistica_unitario.toFixed(2)),
        costo_logistica_desglose_text,
        costo_logistica_asignaciones: costo_logistica_desglose.length
    });

    await recalcularCostoUnitarioBySku(db, sku);

}

//recalcularCostoLogisticaByIdMercancia(null, 'GN0ncq3bH8X1C0hLRsgh');

//Export functions
module.exports = {
    asignarGastosOrdenesDeCompra,
    eliminarGastosOrdenesDeCompra,
    recalcularCostoLogisticaByIdMercancia,
    recalcularCostoUnitarioBySku
};