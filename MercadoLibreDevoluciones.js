var db = firebase.firestore();
var storage = firebase.storage();
let permisosUsuario;
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    logger("MercadoLibre Devoluciones", "Ingreso");
    let response = responseConfig.data();
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "MercadoLibre Devoluciones"
    );
    //console.log(tienePermiso);
    permisosUsuario = tienePermiso;
    if (tienePermiso) {

      db.collection("ConfiguracionesGenerales")
      .doc("MLActualizaciones")
      .onSnapshot((response) => {
        let dato = response.data();
      
        let fechaActualizacionML = dato.ventas.actualizacion;

        $("#ultimaActualizacion").html('Última actualización: ' + formatoFechaHorario(fechaActualizacionML));
      });
      
      // Obtenemos las Ventasde 10 dias
      var dateQuery = new Date();
      dateQuery.setDate(dateQuery.getDate() - 10)
      // Obtenemos las Ventas de firebase
      db.collection("MLVentas")
        .where("tipoEnvio", "==", "bodega")
        .where("status", "==", "cancelled")
        .onSnapshot((response) => {
          //console.log(response);
          listarRegistro(response, 10, tienePermiso);
        });
    } else {
      //console.log(("No tienes permisos para acceder."));
      //console.log(tienePermiso);

      
      if (window.confirm("No tienes permisos para acceder.")) {
        document.location.href = "./";
      } else {
        document.location.href = "./";
      }
      
    }
  });

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10, permisos) => {
  // console.log('listarRegistro');

  let divTable = document.getElementById("divTabla");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaVenta";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>

            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle">OrderID</th>
            <th class="align-middle">Titulo</th>
            <th class="align-middle">Atributos</th>

            <th class="align-middle">Fecha y Hora Venta</th>
            <th class="align-middle">Cantidad</th>
            <th class="align-middle">Estatus</th>

            <th class="align-middle">SKU</th>
            <th class="align-middle">Código de Cancelación</th>
            <th class="align-middle">Fecha de Cancelación</th>
            <th class="align-middle">Descripción</th>
            <th class="align-middle">Grupo</th>
            <th class="align-middle">Solicitado por</th>
            <th class="align-middle">Razón de Cancelación</th>
            <th class="align-middle">Resolución de Cancelación</th>
            <th class="align-middle">Opciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {

    //console.log(response_data.data());

    /*

      idComprador,
      firstnameComprador,
      lastnameComprador,

      shipmentId,
      

      total,
      totalComision,
      totalPagado,
      total_pagado,
      vendidoPor,
      p_unitario,
      comision,
      costo_envio,


    */

    let datos = response_data.data();
    let {
      atributos,
      cantidad,
      fechaVenta,
      orderId,
      sku,
      status,
      tipoEnvio,
      tituloPublicacion,
      urlPublicacion,
      idPublicacion,
      idVariation,
      nicknameComprador,
      statusEnvio,
      tituloURL,

      cancelCode,
      cancelDate,
      cancelDescription,
      cancelGroup,
      cancelRequestedBy,
      mediationId,
      reasonId,
      reasonOfCancellation,
      resolutionReason,

    } = datos;

    /*
    const { opciones } = permisos;

    const puedeRegresarVenta = opciones.find(
      (permiso) => permiso === "RegresarVenta"
    );
    
    const puedeCerrarVenta = opciones.find(
      (permiso) => permiso === "PuedeCerrarVenta"
    );
    */


    // Fecha y Hora de Venta
    let arrFechaHoraVenta = fechaVenta.split("T");
    let dateVenta = arrFechaHoraVenta[0];
    let horaVenta = arrFechaHoraVenta[1].slice(0, 8);

    // Estatus del Envío
    let status_envio = 'Pendiente';
    if (statusEnvio != undefined) {
      status_envio = statusEnvio;
    }


    if (status_envio == 'Pendiente') {
      // Generamos el contenido de la tabla
      contenido += `
                  <tr id="${response_data.id}">

                      <td><a href="${tituloURL}" target="_blank">${orderId}</a></td>
                      <td><a href="${urlPublicacion}" target="_blank">${tituloPublicacion}</a></td>
                      <td>${atributos}</td>

                      <td>${dateVenta} ${horaVenta}</td>
                      <td>${cantidad}</td>
                      <td>${status}</td>
                      
                      
                      <td>${sku}</td>
                      <td>${cancelCode}</td>
                      <td>${cancelDate}</td>
                      <td>${cancelDescription}</td>
                      <td>${cancelGroup}</td>
                      <td>${cancelRequestedBy}</td>
                      <td>${reasonOfCancellation}</td>
                      <td>${resolutionReason}</td>
                      <td>
                        <button class="btn btn-danger" onclick="buscarSKU('${sku}',${cantidad},'${orderId}')" title="Devolución de Producto" ><i class="fas fa-long-arrow-alt-left"></i></button>
                        <button class="btn btn-info" onclick="openModal('modal-rechazar-devolucion','${orderId}')" title="Rechazar Devolución"><i class="fas fa-ban"></i></button
                      </td>
                  </tr>
                  `;
    }

  });

  //<i class="fas fa-search"></i>


  contenido += "</tbody></table>";

  $("#tablaVenta").html(contenido);

  var tablaRegistros = $("#tablaVenta")
    .DataTable({
      dom: "Bfrtip",
      responsive: true,
      lengthMenu: [
        [10, 25, 50, 100, -1],
        [10, 25, 50, 100, "Todos"],
      ],
      lengthChange: false,
      autoWidth: false,
      scrollX: false,
      stateSave: false,
      pageLength: cantidad,
      order: [[0, "desc"]],
      buttons: [
        "pageLength",
        {
          text: "Descargar todas las ventas",
          className: "btn-dark",
          action: function (e) {
            db.collection("Ventas")
              .where("delete", "==", false)
              .orderBy("fechaVenta", "desc")
              .get()
              .then((response) => {
                listarRegistro(response, 10, permisosUsuario);
              });
          }
        },
        {
          extend: "excel",
          text: "Excel",
          className: "btn-dark",
          exportOptions: {
            columns: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          extend: "pdfHtml5",
          text: "PDF",
          header: false,
          title: "PDF",
          duplicate: true,
          className: "btn-dark",
          pageOrientation: "landscape",
          pageSize: "A4",
          pageMargins: [5, 5, 5, 5],
          exportOptions: {
            columns: [1, 2, 3, 4, 5, 6],
            alignment: "center",
            stripHtml: false,
          },
          pageBreak: "after",
        },
        {
          extend: "print",
          text: "Imprimir",
          className: "btn-dark",
          pageSize: "A4",
          orientation: "landscape",
          exportOptions: {
            columns: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          extend: "colvis",
          text: "Columnas",
          className: "btn-dark",
        },
      ],
      // ocultar columnas

      columnDefs: [
        /*
        {
          targets: [4],
          visible: false,
        },
        */


      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 0 || i == 1 || i == 3) {
            var column = api.column(i);
            var select = $(
              '<select style="width:120px"><option value="">Selecciona</option></select>'
            )
              .appendTo($(this).empty())
              .on("change", function () {
                var val = $.fn.dataTable.util.escapeRegex($(this).val());

                column.search(val ? "^" + val + "$" : "", true, false).draw();
              });

            column
              .data()
              .unique()
              .sort()
              .each(function (d, j) {
                select.append('<option value="' + d + '">' + d + "</option>");
              });
          }
        });
      },
    })
    .buttons()
    .container()
    .appendTo("#tablaVenta_wrapper .col-md-6:eq(0)");
};

/**********************************************************************/
/**
 * The openModal function is used to show a modal by its ID.
 */
const openModal = (modal,id='') => {
  
  // Modal Rechazar Devolución
  if(modal == 'modal-rechazar-devolucion'){

    $("#order_id_rechazo").val(id);

    db.collection("ConfiguracionesGenerales")
    .doc("catalogoSelectores")
    .get()
    .then((response) => {

      datos = response.data();
      // console.log(datos);
      // console.log(datos.RechazarDevolucionML.length);

      let contenido = '<option value="">Seleccionar</option>';

      for(let i = 0; i < datos.RechazarDevolucionML.length; i++){

        contenido += `<option value="${datos.RechazarDevolucionML[i]}">${datos.RechazarDevolucionML[i]}</option>`;

      }

      $("#motivo_rechazo").html(contenido);

    });

    // Abrimos el modal
    $("#" + modal).modal("show");

  } // if

}

/**********************************************************************/
/**
 * The function `buscarSKU` is used to search for a SKU in a collection called "Mercancia" and display
 * the results in a modal.
 * @param skuML - The SKU (Stock Keeping Unit) of the product you want to search for.
 * @param cantidadML - The quantity of the product in ML (milliliters) that needs to be searched.
 * @param orderIDML - The orderIDML parameter is the ID of the order in ML (MercadoLibre) system.
 */
const buscarSKU = (skuML, cantidadML, orderIDML) => {
  // console.log('buscarSKU');

  $("#orden_compra").html('');
  $("#producto").html('');
  $("#comentarios").val('');
  $("#doc_id").val('');

  $("#cantidad_ml").val(cantidadML);
  $("#order_id_ml").val(orderIDML);

  // Buscamos la Mercancia por el skuML
  db.collection("Mercancia")
    .where("skuML", "array-contains", skuML)
    .get()
    .then((querySnapshot) => {
      //console.log(querySnapshot);

      let contenido = '<option value="">Seleccionar</option>';

      if (querySnapshot.size > 0) {
        querySnapshot.forEach((doc) => {
          // console.log(doc.id, " => ", doc.data());

          datos = doc.data();


          let numero_orden_compra = datos.numero_orden_compra;

          contenido += `<option 
          value="${doc.id}" 
          data-ordencompra="${numero_orden_compra}" 
          data-categoria="${datos.categoria}" 
          data-producto="${datos.producto}" 
          data-variacion="${datos.variacion}" 
          data-pedimento="${datos.numeroPedimento}"
          data-medidafisica="${datos.medida_fisica}"
          data-sku="${datos.sku}"
          >${datos.sku}</option>`;

          //regresarProducto('${doc.id}',${cantidadML},'${orderIDML}')

          $("#sku").html(contenido);

          $("#modal-sku").modal('show');

        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'SKU no encontrado',
          text: 'No se encontró el SKU para hacer la devolución del producto',
          confirmButtonText: 'Continuar',
        })
      }
    });

}

/**********************************************************************/
/**
 * The function `mostrarInfoMercancia` logs information about merchandise and updates HTML elements
 * with the corresponding data.
 * @param info - The parameter `info` is not used in the code snippet provided. It seems to be unused
 * and can be removed from the function signature.
 */
const mostrarInfoMercancia = (info) => {
  // console.log('mostrarInfoMercancia');

  //console.log(info);
  let docId = $("#sku").val();
  let ordenCompra = $("#sku option:selected").attr('data-ordencompra')
  let categoria = $("#sku option:selected").attr('data-categoria')
  let producto = $("#sku option:selected").attr('data-producto')
  let variacion = $("#sku option:selected").attr('data-variacion')

  let productoMercancia = `${categoria} -> ${producto} -> ${variacion}`;

  // console.log({ docId });
  // console.log({ ordenCompra });
  // console.log({ productoMercancia });

  $("#orden_compra").html(`Orden de Compra: <span class="c-gray">${ordenCompra}</span>`);
  $("#producto").html(`Producto: <span class="c-gray">${productoMercancia}</span>`);

  $("#doc_id").val(docId);

}

/**********************************************************************/
/**
 * The function `regresarProducto` is an asynchronous JavaScript function that handles the process of
 * returning a product by updating the inventory and order status.
 */
async function regresarProducto() {
  // console.log('regresarProducto');

  let sku = $("#sku").val();

  if (sku == '') {

    Swal.fire({
      icon: 'error',
      title: 'SKU Mercancia',
      text: 'Por favor, selecciona el SKU a donde quieres generar la devolución para pooder continuar...',
      confirmButtonText: 'Aceptar',
    })

  } else {

    let doc_id = $("#doc_id").val();
    let cantidadML = $("#cantidad_ml").val();
    let orderIDML = $("#order_id_ml").val();
    let comentarios = $("#comentarios").val();

    // console.log({ doc_id });
    // console.log({ cantidadML });
    // console.log({ orderIDML });
    // console.log({ comentarios });

    Swal.fire({
      icon: 'warning',
      title: 'Regresar Producto',
      text: 'Con esta accion se regresara la cantidad del producto al inventario, continuar? ',
      showConfirmButton: true,
      confirmButtonText: 'Continuar',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        //console.log('isConfirmed');

        $("#modal-sku").modal('hide');

        db.collection("Mercancia")
          .doc(doc_id)
          .get()
          .then((response) => {

            datos = response.data();

            const nuevaCantidad_vendida = parseInt(datos.cantidad_vendida) - parseInt(cantidadML);

            const newCantidad_disponible = parseInt(datos.cantidad_disponible) + parseInt(cantidadML);

            let historial_movimientos = '';
            if (datos.historialMovimientos == undefined) {
              historial_movimientos = `°ML-${orderIDML}||Regresa Orden:+${cantidadML}`;
            } else {
              historial_movimientos = datos.historialMovimientos + `°ML-${orderIDML}||Regresa Orden:+${cantidadML}`;
            }

            db.collection("Mercancia")
              .doc(doc_id)
              .update({
                cantidad_disponible: newCantidad_disponible,
                cantidad_vendida: nuevaCantidad_vendida,
                historialMovimientos: historial_movimientos,
              })
              .then(() => {

                db.collection("MLVentas").doc(orderIDML).update({
                  statusEnvio: "Cancelado",
                  comentariosCancelado: comentarios,
                });

                Swal.fire({
                  icon: 'success',
                  title: 'Mercancia',
                  text: 'La Mercancia fue modificada',
                  confirmButtonText: 'Continuar',
                })

              });

          });

      } // if
    }); // Swal

  } // else

}

/**********************************************************************/
/**
 * The function `rechazarDevolucion` is used to reject a return request for a product in a MercadoLibre
 * sales system.
 */
const rechazarDevolucion = () => {

  let orderIDML = $("#order_id_rechazo").val();
  let motivo_rechazo = $("#motivo_rechazo").val();
  let comentarios_rechazo = $("#comentarios_rechazo").val();

  if (motivo_rechazo == '') {

    Swal.fire({
      icon: 'error',
      title: 'Motivo Rechazo',
      text: 'Por favor, selecciona el Motivo del Rechazo para pooder continuar...',
      confirmButtonText: 'Aceptar',
    })

  } else {

    $("#modal-rechazar-devolucion").modal('hide');

    db.collection("MLVentas").doc(orderIDML).update({
      statusEnvio: "Rechazado",
      RechazarDevolucionML: motivo_rechazo,
      comentariosRechazado: comentarios_rechazo,
    });

    Swal.fire({
      icon: 'success',
      title: 'Ventas MercadoLibre',
      text: 'El producto fue modificado a rechazado',
      confirmButtonText: 'Continuar',
    })
  } // else

}

/**********************************************************************/
/**
 * This JavaScript function generates a PDF with QR codes based on user input.
 */
const imprimirEtiqueta = () => {

  let sku = $("#sku").val();
  let cantidad = $("#cantidad_ml").val();

  if (sku == '') {

    Swal.fire({
      icon: 'error',
      title: 'SKU Mercancia',
      text: 'Por favor, selecciona el SKU del que deseas generar la Impresión de la Etiqueta para pooder continuar...',
      confirmButtonText: 'Aceptar',
    })

  } else {

    let registros = [];

    if (cantidad > 0) {

      for (var i = 1; i <= cantidad; i++) {

        let element = {};

        let ordenCompra = $("#sku option:selected").attr('data-ordencompra');
        let categoria = $("#sku option:selected").attr('data-categoria');
        let producto = $("#sku option:selected").attr('data-producto');
        let variacion = $("#sku option:selected").attr('data-variacion');
        let pedimento = $("#sku option:selected").attr('data-pedimento');
        let medidaFisica = $("#sku option:selected").attr('data-medidafisica');
        let sku = $("#sku option:selected").attr('data-sku');


        element.dataQR = sku;
        element.registro = `O.C.: ${ordenCompra}\nCategoria: ${categoria}\nProducto: ${producto}\nVariacion: ${variacion}\nSKU: ${sku}\nPedimento: ${pedimento}`;
        element.dimensiones = medidaFisica;

        registros.push(element);

        //console.log(registros);
      } // for

    } // if

    //console.log({ "registros": registros });
    generarPdfQR({ "registros": registros });

  } // else

}

/**********************************************************************/
/**
 * The function `generarPdfQR` generates a PDF document with QR codes and corresponding text based on
 * the provided `apiBody` object.
 * @param apiBody - The `apiBody` parameter is an object that contains the data needed to generate the
 * PDF with QR codes. It has a property called `registros`, which is an array of objects. Each object
 * in the `registros` array represents a record and contains the following properties:
 */
function generarPdfQR(apiBody) {
  //console.log(apiBody);

  var multiples = apiBody.registros;

  var dd = []

  for (x in multiples) {

    var page = [
      {
        columns: [
          {
            qr: `${multiples[x].dataQR}`, alignment: 'center', fit: '90'
          },
          {
            text: [
              { text: `${multiples[x].registro}\n`, alignment: 'left', fontSize: 8 },
            ]
          }

        ]
      },
      {
        text: [
          { text: `Kg/Mts/Pza: ${multiples[x].dimensiones}`, alignment: 'center', fontSize: 14 }
        ],
        pageBreak: 'after'
      },
    ]

    dd.push(...page);
  } // for


  var docDefinition = {
    content: dd,
    pageSize: 'A8',
    pageOrientation: 'landscape',
    pageMargins: [0, 3, 0, 0]
  }


  pdfMake.createPdf(docDefinition).download(`PDF QR`);

}