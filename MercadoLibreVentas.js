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
    logger("MercadoLibre Ventas", "Ingreso");
    let response = responseConfig.data();
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "MercadoLibre Ventas"
    );
    permisosUsuario = tienePermiso;
    if (tienePermiso) {

      db.collection("ConfiguracionesGenerales")
        .doc("MLActualizaciones")
        .onSnapshot((response) => {
          let dato = response.data();
          //console.log(dato);

          let fechaActualizacionML = dato.ventas.actualizacion;

          $("#ultimaActualizacion").html('Última actualización: ' + formatoFechaHorario(fechaActualizacionML));
        });

      // Obtenemos las Ventasde 10 dias
      var dateQuery = new Date();
      dateQuery.setDate(dateQuery.getDate() - 30)
      // Obtenemos las Ventas de firebase
      db.collection("MLVentas")
        .where("tipoEnvio", "==", "bodega")
        .where("status", "==", "paid")
        .where("shipping_status", "in", ["ready_to_ship", "pending"])
        .orderBy("fechaRegistro", "desc")
        .endAt(dateQuery)
        .onSnapshot((response) => {
          console.log(response);
          listarRegistro(response, 10, tienePermiso);
        });
    } else {
      if (window.confirm("No tienes permisos para acceder.")) {
        document.location.href = "./";
      } else {
        document.location.href = "./";
      }
    }
  });

localStorage.removeItem("ventaMultiple");


/**********************************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10, permisos) => {
  console.log('listarRegistro');

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
            <th class="filterhead">&nbsp;</th>

            <th class="filterhead">&nbsp;</th>
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle">OrderID</th>
            <th class="align-middle">PackId</th>
            <th class="align-middle">Titulo</th>
            <th class="align-middle">Atributos</th>

            <th class="align-middle">Fecha y Hora Venta</th>
            <th class="align-middle">Cantidad</th>
            <th class="align-middle">Estatus</th>

            <th class="align-middle">SKU</th>
            <th class="align-middle">Tipo de Envío</th>
            <th class="align-middle">Estatus Envío</th>

            <th class="align-middle">Tipo de Envío</th>
            <th class="align-middle">Estado de Envío</th>
            <th class="align-middle">Subestado de Envío</th>
            <th class="align-middle">Tipo de Logística de Envío</th>
            <th class="align-middle">Etiquetas</th>
            <th class="align-middle">ShipmentID</th>

            <th class="align-middle">Opciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  // Eliminamos todos los registros
  localStorage.removeItem("arr_xd_drop_off_all");
  localStorage.removeItem("arr_default_all");

  // Eliminamos todos los registros
  localStorage.removeItem("arr_xd_drop_off");
  localStorage.removeItem("arr_default");

  var arr_xd_drop_off = [];
  var arr_default = [];
  var arr_xd_drop_off_all = [];
  var arr_default_all = [];

  response.forEach((response_data) => {

    //console.log(response_data.data());

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
      shipping_type,
      shipping_substatus,
      shipping_status,
      shipping_logistic_type,
      tags,
      shipmentId,
      packId

    } = datos;


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

      // Generamos el Arreglo xd_drop_off
      if (shipping_logistic_type == 'cross_docking') {

        // Guardamos todas las ordenes en el array
        arr_xd_drop_off_all.push(
          {
            orderID: orderId,
            tituloPublicacion: tituloPublicacion,
            atributos: atributos,
            fechaVenta: fechaVenta,
            cantidad: cantidad,
            skuML: sku,
            statusEnvio: shipping_status,
            subStatusEnvio: shipping_substatus,
            tags: tags,
            idPublicacion: idPublicacion,
            idVariation: idVariation,
            shipmentId: shipmentId,
            packId
          }
        );

        // Validamos que existe el SKU
        if (sku != null && sku != '') {
          // Actualizamos solo la cantidad donde coicide en SKU
          var existingProductDropOff = arr_xd_drop_off.find(item => item.skuML === sku);

          if (existingProductDropOff) {
            existingProductDropOff.cantidad += cantidad;
            existingProductDropOff.orderID += ',' + orderId;
          } else {
            arr_xd_drop_off.push(
              {
                orderID: orderId,
                tituloPublicacion: tituloPublicacion,
                atributos: atributos,
                fechaVenta: fechaVenta,
                cantidad: cantidad,
                skuML: sku,
                statusEnvio: shipping_status,
                subStatusEnvio: shipping_substatus,
                tags: tags,
                shipmentId: shipmentId,
                idPublicacion: idPublicacion,
                idVariation: idVariation,
                packId
              }
            );
          } // else

        } // if


      } // if

      // Generamos el Arreglo default
      if (shipping_logistic_type == 'default') {

        // Guardamos todas las ordenes en el array
        arr_default_all.push(
          {
            orderID: orderId,
            tituloPublicacion: tituloPublicacion,
            atributos: atributos,
            fechaVenta: fechaVenta,
            cantidad: cantidad,
            skuML: sku,
            statusEnvio: shipping_status,
            subStatusEnvio: shipping_substatus,
            tags: tags,
            shipmentId: shipmentId,
            idPublicacion: idPublicacion,
            idVariation: idVariation,
            packId
          }
        );


        // Validamos que existe el SKU
        if (sku != null && sku != '') {

          // Actualizamos solo la cantidad donde coicide en SKU
          var existingProductDefault = arr_default.find(item => item.skuML === sku);

          if (existingProductDefault) {
            existingProductDefault.cantidad += cantidad;
            existingProductDefault.orderID += ',' + orderId;
          } else {
            arr_default.push(
              {
                orderID: orderId,
                tituloPublicacion: tituloPublicacion,
                atributos: atributos,
                fechaVenta: fechaVenta,
                cantidad: cantidad,
                skuML: sku,
                statusEnvio: shipping_status,
                subStatusEnvio: shipping_substatus,
                tags: tags,
                shipmentId: shipmentId,
                idPublicacion: idPublicacion,
                idVariation: idVariation,
                packId
              }
            );
          } // else

        } // if


      } // if



      // Generamos el contenido de la tabla
      contenido += `
        <tr id="${response_data.id}">

            <td><a href="${tituloURL}" target="_blank">${orderId}</a></td>
            <td>${packId ?? ""}</td>
            <td><a href="${urlPublicacion}" target="_blank">${tituloPublicacion}</a></td>
            <td>${atributos}</td>

            <td>${dateVenta} ${horaVenta}</td>
            <td>${cantidad}</td>
            <td>${status}</td>
            
            
            <td>${sku}</td>
            <td>${tipoEnvio}</td>
            <td>${status_envio}</td>

            <td>${shipping_type}</td>
            <td>${shipping_status}</td>
            <td>${shipping_substatus}</td>
            <td>${shipping_logistic_type}</td>
            <td>${tags}</td>
            <td>${shipmentId}</td>

            <td>
            `;
      if (status_envio == 'Pendiente') {
        contenido += `<button class="btn btn-info" onclick="generarOrden('${sku}',${cantidad},'${idPublicacion}','${tituloPublicacion}','${atributos}',${idVariation},'${orderId}','${fechaVenta}','${nicknameComprador}')" title="Generar Orden de Venta"><i class="fas fa-boxes"></i></button>`;
      }

      contenido += `
          </td>
        </tr>
        `;
    }

  });


  // Console de todas las ordenes
  // console.log('arr_xd_drop_off_all: ', arr_xd_drop_off_all.length);
  // console.log(arr_xd_drop_off_all);
  // console.log('arr_default_all: ', arr_default_all.length);
  // console.log(arr_default_all);

  // Guardamos todos los productos
  localStorage.setItem("arr_xd_drop_off_all", JSON.stringify(arr_xd_drop_off_all));
  localStorage.setItem("arr_default_all", JSON.stringify(arr_default_all));

  // Guardamos los productos donde el SKU coincide y solo sumammos la cantidad
  localStorage.setItem("arr_xd_drop_off", JSON.stringify(arr_xd_drop_off));
  localStorage.setItem("arr_default", JSON.stringify(arr_default));



  // Button xd_drop_off
  const total_xd_drop_off_all = arr_xd_drop_off_all.length;
  const buttonXdDropOff = `<button id="btnXdDropOff" class="btn btn-outline-info btn-lg" onclick="openModal('modal-multiples-ordenes','xd_drop_off');">Colecta (${total_xd_drop_off_all})</button>`;

  // Button default
  const total_default_all = arr_default_all.length;
  const buttonDefault = `<button id="btnXdDropOff" class="btn btn-outline-info btn-lg" onclick="openModal('modal-multiples-ordenes','default');">Envio Pack (${total_default_all})</button>`;

  $("#buttonsCustom").html(buttonXdDropOff + ' ' + buttonDefault);


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
            db.collection("MLVentas")
              .where("tipoEnvio", "==", "bodega")
              .where("status", "==", "paid")
              .where("shipping_status", "in", ["ready_to_ship", "pending"])
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
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          },
          customizeData: function(data) {
            for(var i = 0; i < data.body.length; i++) {
              for(var j = 0; j < data.body[i].length; j++) {
                data.body[i][j] = '\u200C' + data.body[i][j];  
              }
            }
          }
        },
        {
          extend: "pdfHtml5",
          text: "PDF",
          header: false,
          title: "PDF",
          duplicate: true,
          className: "btn-dark",
          orientation: "landscape",
          pageSize: "A4",
          pageMargins: [5, 5, 5, 5],
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            alignment: "center",
            stripHtml: false,
          },
          pageBreak: "after",
        },
        {
          extend: "print",
          text: "Imprimir",
          className: "btn-dark",
          orientation: "landscape",
          pageSize: "A4",
          pageMargins: [5, 5, 5, 5],
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
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
/* GENERAR ORDEN DE VENTA */
// Agregamos la Órden a Firebase
const generarOrden = (sku, cantidad, idPublicacion, tituloPub, variacionPublicacion, idVariacion, orderID, fechaVentaML, nicknameComprador) => {
  console.log('generarOrden');

  // Buscamos el skuML en la Mercancia
  db.collection("Mercancia")
    .where('skuML', "array-contains", sku)
    .get()
    .then((response) => {
      //console.log(response);
      //console.log(response.size);

      existeSKU = response.size;

      if (existeSKU == 0) {
        Swal.fire({
          icon: 'error',
          title: 'SKU no encontrado',
          text: 'Este SKU no se encuentra en las Mercancias',
        });
      } else {

        response.forEach(response_data => {
          console.log(response_data.data());

          datos = response_data.data();

          let isValidData = false;
          let arrConvinacionAgregada = [];
          const productosSelectedList = [];

          var categoria = datos.categoria;
          var producto = datos.producto;
          var variacion = datos.variacion;
          var publicacionML = tituloPub + '-' + variacionPublicacion + '|' + sku + '|' + idPublicacion + '|' + idVariacion;
          var skuPublicacion = sku;
          var tituloPublicacion = tituloPub + '-' + variacionPublicacion;
          var cliente = nicknameComprador;

          var arrfechaVenta = fechaVentaML.split('T');
          var fechaVentaMercadiLibre = arrfechaVenta[0];
          var horaVentaMercadiLibre = arrfechaVenta[1].slice(0, 8);

          var fechaVentaChg = fechaVentaMercadiLibre.replace('-', '/');
          var fechaCompleta = fechaVentaChg + ' ' + horaVentaMercadiLibre;

          var fechaVenta = new Date(fechaCompleta);

          var newValorCantidad = datos.cantidad_disponible;
          arrConvinacionAgregada.push(`${categoria}${producto}${variacion}`);

          var precioUnitario = 0;

          isValidData = validaCampos([
            categoria,
            producto,
            variacion,
            cantidad,
            publicacionML,
            idPublicacion,
            tituloPublicacion,
            variacionPublicacion,
            skuPublicacion,
            idVariacion,
            orderID,
            fechaVenta,
            cliente,
            precioUnitario,
          ]);

          if (!isValidData) {
            return false;
          }

          if (parseFloat(cantidad) > parseFloat(newValorCantidad)) {
            createSw({
              title: "Error",
              text: "La cantidad no puede ser mayor al disponible",
              icon: "error",
            });
            isValidData = false;
            return false;
          }

          productosSelectedList.push({
            cantidad,
            categoria,
            producto,
            variacion,
            publicacionML,
            idPublicacion,
            tituloPublicacion,
            skuPublicacion,
            idVariacion,
            orderID,
            precioUnitario,
          });

          let resultSkusAdd = arrConvinacionAgregada.filter((item, index) => {
            return arrConvinacionAgregada.indexOf(item) === index;
          });

          if (resultSkusAdd.length !== arrConvinacionAgregada.length) {
            isValidData = false;
            createSw({
              title: "Error",
              text: "No se puede agregar productos similares",
              icon: "error",
            });
          }


          if (isValidData) {
            db.collection("ConfiguracionesGenerales")
              .doc("9vECPN3cIoVqVarSOlNZ")
              .get()
              .then((responseConfig) => {
                let datosConfig = responseConfig.data();
                let ultimoIDventa = parseInt(datosConfig.ultimoIDventa);
                const nuevoIdVenta = ultimoIDventa + 1;
                console.log({ nuevoIdVenta });

                const nuevoPedido = {
                  EstatusPedido: "Almacen",
                  elementos: productosSelectedList,
                  fechaVenta: fechaVenta,
                  numero_orden_venta: nuevoIdVenta,
                  TipoVenta: "MercadoLibre",
                  delete: false,
                  comentarios: "",
                  OrderIDMercadoLibre: orderID,
                  cliente: "ML-" + orderID,
                  venta_mas_iva: 0,
                  EstatusPago: 'Pagado',
                };

                db.collection("Ventas")
                  .add(nuevoPedido)
                  .then(() => {
                    logger(
                      "Venta",
                      "Creacion de pedido",
                      nuevoIdVenta,
                      nuevoPedido
                    );
                    db.collection("ConfiguracionesGenerales")
                      .doc("9vECPN3cIoVqVarSOlNZ")
                      .update({ ultimoIDventa: nuevoIdVenta });

                    db.collection('MLVentas')
                      .doc(orderID)
                      .update({ statusEnvio: 'Procesando' });

                    createSw({
                      title: "Guardado",
                      text: "El pedido fue agregado",
                      icon: "success",
                    });
                    // setTimeout(() => {
                    //   window.location.reload();
                    // }, 2000);
                  });
              });

          } // if


        });

      }


    });


};

const validaCampos = (listaCampos) => {
  const tieneDatosVacios = listaCampos.some(
    (a) => a === null || a === undefined || a === ""
  );
  if (tieneDatosVacios) {
    createSw({
      title: "Error",
      text: "Ningun campo de la orden debe ir vacio",
      icon: "error",
    });
    return false;
  }
  return true;
};

/**
 * The selectedSku function adds or removes a product from the cart based on whether it is checked or
 * unchecked, and updates the quantity and order ID accordingly.
 * @param orderID - The order ID of the selected SKU.
 * @param skuML - The SKU (stock keeping unit) of the product. It is a unique identifier for a specific
 * product.
 * @param cantidad - The quantity of the selected SKU.
 * @param tituloPublicacion - The title of the publication or product.
 * @param atributos - An object that contains the attributes of the selected SKU.
 * @param fechaVenta - The parameter "fechaVenta" represents the date of the sale.
 */
/**********************************************************************/
const selectedSku = (orderID, skuML, cantidad, tituloPublicacion, atributos, fechaVenta, statusEnvio, subStatusEnvio, tags, shipmentId, idPublicacion, idVariation, packId) => {
  console.log('selectedSku', {orderID, cantidad});

  if ($('#orden_' + orderID).is(':checked') || $('#orden_' + packId).is(':checked')) {
    //console.log('seleccionado');
    console.log({ orderID });
    console.log({ skuML });

    // get the existing cart data from local storage or initialize an empty array
    var cart = JSON.parse(localStorage.getItem("ventaMultiple")) || [];

    // check if this product is already in the cart
    var existingProduct = cart.find(item => item.skuML === skuML);

    if (existingProduct) {
       console.log('existingProduct true')

      //let product_value = existingProduct.cantidad;

      // if the product is already in the cart, update its quantity
      existingProduct.cantidad += cantidad;

      // creamos el nuevo string de ordenes
      existingProduct.orderID += ',' + orderID;
      existingProduct.shipmentId += ',' + shipmentId;

    } else {
      console.log('existingProduct false')
      cart.push(
        {
          orderID: orderID,
          tituloPublicacion: tituloPublicacion,
          atributos: atributos,
          fechaVenta: fechaVenta,
          cantidad: cantidad,
          skuML: skuML,
          statusEnvio: statusEnvio,
          subStatusEnvio: subStatusEnvio,
          tags: tags,
          shipmentId: shipmentId,
          idPublicacion: idPublicacion,
          idVariation: idVariation,
        }
      );
    }

    // save the updated cart data back to local storage
    localStorage.setItem("ventaMultiple", JSON.stringify(cart));

  } else {
    // console.log('deseleccionado');
    // console.log({ orderID });
    // console.log({ skuML });

    // get the existing cart data from local storage or initialize an empty array
    var cart = JSON.parse(localStorage.getItem("ventaMultiple")) || [];

    // check if this product is already in the cart
    var existingProduct = cart.find(item => item.skuML === skuML);

    if (existingProduct) {

      // if the product is already in the cart, update its quantity
      existingProduct.cantidad -= cantidad;

      // convertimos el string de ordenes en un arreglo
      let arrOrders = existingProduct.orderID.split(',');
      // quitamos la orden que se deselecciono del arreglo
      const filteredOrders = arrOrders.filter((item) => item !== orderID)
      // cambiamos el arreglo en string con las ordenes restantes
      existingProduct.orderID = filteredOrders.toString();

      // Si la cantidad es igual a zero, quitamos el producto
      if (existingProduct.cantidad == 0) {
        $.each(cart, function (index, value) {
          // console.log("index: ",index);
          // console.log("cart[index].product_id: "+cart[index].product_id);
          // console.log("product_id: ",product_id);

          if (cart[index].skuML == skuML) {
            elementToDelete = index;
            // console.log("elementToDelete: ",elementToDelete);
          }

        });

        cart.splice(elementToDelete, 1);
      } // if

    }

    // save the updated cart data back to local storage
    localStorage.setItem("ventaMultiple", JSON.stringify(cart));
  }

  console.log({cart})

  //Update the value of the button
  $("#botonGenerarOrdenMultiple").html("Generar Orden (Productos: " + cart.length + ", Ventas: " + cart.reduce((a, b) => a + b.orderID.split(",").length, 0) + ")");

}

/**********************************************************************/
/**
 * The function `revisarSkus` takes an array of sale items and checks if the corresponding SKUs exist
 * in the inventory, returning a list of selected products.
 * @param arrVenta - An array of objects representing sales orders. Each object contains the following
 * properties:
 * @returns the array `productosSelectedList` which contains the selected products from the `arrVenta`
 * array.
 */
async function revisarSkus(arrVenta) {
  console.log('revisarSkus');
  //console.log({arrVenta});


  var productosSelectedList = [];
  var isValidData = false;
  //localStorage.setItem("validData",0);

  let x = 0;
  for (var i = 0; i < arrVenta.length; i++) {
    //console.log({x});

    let orderID = arrVenta[i].orderID;
    let sku = arrVenta[i].skuML;
    let cantidad = arrVenta[i].cantidad;
    let tituloPublicacion = arrVenta[i].tituloPublicacion;
    let variacionPublicacion = arrVenta[i].atributos;
    let idPublicacion = arrVenta[i].idPublicacion;
    let idVariacion = arrVenta[i].idVariation;

    // Buscamos el skuML en la Mercancia
    var responseValidSku = await db.collection("Mercancia").where('skuML', "array-contains", sku).where('cantidad_disponible', '>', 0).get();
    //console.log(response);
    //console.log(responseValidSku.size);

    existeSKU = responseValidSku.size;

    if (existeSKU == 0) {
      Swal.fire({
        icon: 'error',
        title: 'SKU no encontrado o no tiene cantidad disponible',
        text: `El sku ${sku}  de la orden ${orderID} no se encuentra en Mercancia o no tiene cantidad disponible`,
      });
      return false;

    } else {



      datos = responseValidSku.docs[0].data();
      //console.log({ datos });

      var categoria = datos.categoria;
      var producto = datos.producto;
      var variacion = datos.variacion;
      var publicacionML = tituloPublicacion + '-' + variacionPublicacion + '|' + sku + '|' + idPublicacion + '|' + idVariacion;
      var skuPublicacion = sku;
      //var tituloPublicacion = tituloPublicacion +'-'+ variacionPublicacion;
      //var cliente = nicknameComprador;

      /*
      var arrfechaVenta = fechaVentaML.split('T');
      var fechaVentaMercadiLibre = arrfechaVenta[0];
      var horaVentaMercadiLibre = arrfechaVenta[1].slice(0,8);
 
      var fechaVentaChg = fechaVentaMercadiLibre.replace('-', '/');
      var fechaCompleta = fechaVentaChg + ' ' + horaVentaMercadiLibre;
 
      var fechaVenta = new Date(fechaCompleta);
      */

      //Se calcula el total de la cantidad disponible entre todos los documentos de la mercancia
      //var newValorCantidad = datos.cantidad_disponible;
      var newValorCantidad = 0;
      responseValidSku.forEach((doc) => {
        newValorCantidad += doc.data().cantidad_disponible;
      });

      let numero_orden_compra = datos.numero_orden_compra;
      let sku_mercancia = datos.sku;
      // console.log({numero_orden_compra});
      // console.log({newValorCantidad});
      // console.log({cantidad});
      // console.log({sku_mercancia});          

      var precioUnitario = 0;

      isValidData = validaCampos([
        categoria,
        producto,
        variacion,
        cantidad,
        skuPublicacion,
        orderID,
        precioUnitario
      ]);

      if (!isValidData) {
        return false;
      }

      if (parseFloat(cantidad) > parseFloat(newValorCantidad)) {
        // createSw({
        //   title: "Error",
        //   text: "La cantidad de " + skuPublicacion + " no puede ser mayor al disponible",
        //   icon: "error",
        // });
        alert(`La cantidad de ${skuPublicacion} no puede ser mayor al disponible
              Cantidad solicitada: ${cantidad}
              Disponible: ${newValorCantidad}`)
        isValidData = false;
        return false;

      }
      //var existingProduct = productosSelectedList.find(item => item.skuPublicacion === skuPublicacion);
      var existingProduct = productosSelectedList.find(item => item.categoria === categoria && item.producto === producto && item.variacion === variacion);
      // console.log(existingProduct);

      if (existingProduct) {

        // if the product is already in the cart, update its quantity
        existingProduct.cantidad += cantidad;

        // creamos el nuevo string de ordenes
        existingProduct.orderID += ',' + orderID;
        existingProduct.skuPublicacion += ',' + skuPublicacion;


      } else {


        productosSelectedList.push({
          cantidad,
          categoria,
          producto,
          variacion,
          skuPublicacion,
          orderID,
          publicacionML,
          precioUnitario
        });

        x++;
      }

    } // for i  

  }


  return productosSelectedList;

}

/**********************************************************************/
/**
 * The function `generarOrdenMultiple` generates a sales order based on a list of products, retrieves
 * the order IDs from the products, creates a new sales order with the retrieved order IDs, updates the
 * status of the orders in the MLVentas collection, and displays a success message.
 * @param searchVenta - The parameter `searchVenta` is a string that represents the key used to
 * retrieve data from the local storage. It is used to fetch an array of products that have been
 * selected for a sale.
 * @returns a boolean value. If the `arrVenta` array is empty, it returns `false`. Otherwise, it
 * proceeds with generating the order and returns nothing (`undefined`).
 */
async function generarOrdenMultiple(searchVenta) {
  //console.log('generarOrdenMultiple');

  var arrVenta = JSON.parse(localStorage.getItem(searchVenta)) || [];
  //console.log(arrVenta);

  if (arrVenta.length == 0) {
    Swal.fire({
      icon: 'error',
      title: 'Sin selección de productos',
      text: `Debes seleccionar los productos que deseas agregar a la Venta para que sean procesados...`,
    });
    return false;
  }

  var productList = await revisarSkus(arrVenta);
  // console.log('productList');
  // console.log({ productList });
  // console.log(productList.length);

  var ordersList = '';

  for (var i = 0; i < productList.length; i++) {
    if (i == 0) {
      ordersList += productList[i].orderID;
    } else {
      ordersList += ',' + productList[i].orderID;
    }
  }

  //console.log(ordersList);
  console.log("Start creating order");

  console.log({productList})

  // Cuando ya se tiene todo el arreglo de la orden de venta, se genera la orden de venta
  if (productList.length > 0) {
    var ultimoNumeroVentaQuery = await db.collection("ConfiguracionesGenerales").doc("9vECPN3cIoVqVarSOlNZ").get()
    let datosConfig = ultimoNumeroVentaQuery.data();
    let ultimoIDventa = parseInt(datosConfig.ultimoIDventa);
    const nuevoIdVenta = ultimoIDventa + 1;
    //console.log({ nuevoIdVenta });

    const nuevoPedido = {
      EstatusPago: 'Pagado',
      EstatusPedido: "Almacen",
      TipoVenta: "MercadoLibre",
      OrderIDMercadoLibre: ordersList,
      cliente: "ML-MultiOrdenes",
      comentarios: ordersList,
      delete: false,
      numero_orden_venta: nuevoIdVenta,
      venta_mas_iva: 0,
      fechaVenta: new Date(),

      elementos: productList,
    };

    //console.log(nuevoPedido);

    await db.collection("Ventas").add(nuevoPedido)
    await db.collection("ConfiguracionesGenerales").doc("9vECPN3cIoVqVarSOlNZ").update({ ultimoIDventa: nuevoIdVenta });


    logger("Venta", "Creacion de pedido", nuevoIdVenta, nuevoPedido);

    listadoOrdenes = ordersList.split(",");

    // for (var x = 0; x < listadoOrdenes.length; x++) {
    //   let orderId = listadoOrdenes[x];
    //   //console.log({orderId});

    //   await db.collection('MLVentas')
    //     .doc(orderId)
    //     .update({ statusEnvio: 'Procesando' });

    // }

    // Actualizamos el status de las ordenes a Procesando con un batch
    var batch = db.batch();

    for (var x = 0; x < listadoOrdenes.length; x++) {
      let orderId = listadoOrdenes[x];
      //console.log({orderId});

      var docRef = db.collection('MLVentas').doc(orderId);
      batch.update(docRef, { statusEnvio: 'Procesando' });

    }

    await batch.commit();

    createSw({
      title: "Guardado",
      text: "El pedido fue agregado",
      icon: "success",
    });

    localStorage.removeItem("ventaMultiple");

    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } // if

}

/**********************************************************************/
/**
 * The openModal function opens a modal and performs specific actions based on the modal type and
 * logistic type.
 * @param modal - The modal parameter is a string that represents the ID of the modal element that you
 * want to open.
 * @param [logistic_type] - The `logistic_type` parameter is a string that represents the type of
 * logistic operation. It is an optional parameter and its default value is an empty string.
 */
const openModal = (modal, logistic_type = '') => {
  //console.log({modal});
  //console.log({logistic_type});

  //Set to 0 the value of the button and remove values from inputMultiplesOrdenesSeleccionar
  $("#botonGenerarOrdenMultiple").html("Generar Orden (0)");
  $("#inputMultiplesOrdenesSeleccionar").val("");

  // Modal Multiples Ordenes
  if (modal == 'modal-multiples-ordenes') {

    // limpiamos el localstorage
    localStorage.removeItem("ventaMultiple");

    // mostramos el título
    const titulo = `Multiples Órdenes ${logistic_type}`;
    $("#titulo-multi-ordenes").html(titulo);

    $("#logistic_type").val(logistic_type);

    //listamos los productos para la selección de la orden multiple
    listarOrdenesMultiples(logistic_type);

  } // if

  // Abrimos el modal
  $("#" + modal).modal("show");


}

/**********************************************************************/
const listarOrdenesMultiples = (logistic_type, cantidad = 10) => {
  //console.log('listarOrdenesMultiples');
  //console.log({logistic_type});

  const listOrdenes = `arr_${logistic_type}_all`;
  //console.log({listOrdenes});

  var arrOrdenes = JSON.parse(localStorage.getItem(listOrdenes));
  //console.log(arrOrdenes);


  let divTable = document.getElementById("divTabla2");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaOrdenes";
  table.setAttribute("class", "table table-bordered table-striped table-responsive");

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
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle text-center">Seleccionar <input type="checkbox" class="cursor-pointer" id="selectAll" onchange="selectAll()"></th>

            <th class="align-middle">OrderID</th>
            <th class="align-middle">PackID</th>
            <th class="align-middle">Titulo</th>
            <th class="align-middle">Atributos</th>

            <th class="align-middle">Fecha y Hora Venta</th>
            <th class="align-middle">Cantidad</th>
            <th class="align-middle">SKU</th>

            <th class="align-middle">Estado del Envío</th>
            <th class="align-middle">Sub Estado del Envío</th>
            <th class="align-middle">Etiquetas</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";


  arrOrdenes.forEach((response_data) => {
    //console.log(response_data);

    // Fecha y Hora de Venta
    let arrFechaHoraVenta = response_data.fechaVenta.split("T");
    let dateVenta = arrFechaHoraVenta[0];
    let horaVenta = arrFechaHoraVenta[1].slice(0, 8);

    // Clase para mostrar los SKU nulos o blancos
    let class_null = "";
    let class_input_select = 'multiple_orders';
    if (response_data.skuML == null || response_data.skuML == '') {
      class_null = "bg-red";
      class_input_select = '';
    }

    // Variables
    let orderID = response_data.orderID;
    let skuML = response_data.skuML;
    let cantidad = response_data.cantidad;
    let tituloPublicacion = response_data.tituloPublicacion;
    let atributos = response_data.atributos;
    let fechaVenta = response_data.fechaVenta;

    let statusEnvio = response_data.statusEnvio;
    let subStatusEnvio = response_data.subStatusEnvio;
    let tags = response_data.tags;

    let shipmentId = response_data.shipmentId;
    let idPublicacion = response_data.idPublicacion;
    let idVariation = response_data.idVariation;


    // Generamos el contenido de la tabla
    contenido += `
      <tr id="${response_data.orderID}" class="${class_null}">

        <td class="text-center"><input type="checkbox" id="orden_${response_data.packId ?? response_data.orderID}" name="orden_${response_data.orderID}" value="${response_data.orderID}" data-shipmentid="${shipmentId}" onchange="selectedSku('${orderID}','${skuML}',${cantidad},'${tituloPublicacion}','${atributos}','${fechaVenta}','${statusEnvio}','${subStatusEnvio}','${tags}','${shipmentId}','${idPublicacion}','${idVariation}', '${response_data.packId ?? ""}');" class="${class_input_select}"></td>
        <td>${response_data.orderID}</td>
        <td>${response_data.packId ?? ""}</td>
        <td>${response_data.tituloPublicacion}</td>
        <td>${response_data.atributos}</td>

        <td>${dateVenta} ${horaVenta}</td>
        <td>${response_data.cantidad}</td>          
        <td>${response_data.skuML}</td>

        <td>${response_data.statusEnvio}</td>
        <td>${response_data.subStatusEnvio}</td>
        <td>${response_data.tags}</td>
      </tr>
      `;
  });

  contenido += "</tbody></table>";

  $("#tablaOrdenes").html(contenido);

  var tablaRegistros = $("#tablaOrdenes")
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
        /*
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
          orientation: "landscape",
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
          orientation: "landscape",
          pageSize: "A4",
          pageMargins: [5, 5, 5, 5],
          exportOptions: {
            columns: [1, 2, 3, 4, 5, 6],
          },
        },
        */
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
          if (i == 1 || i == 3 || i == 6 || i == 7 || i == 8 || i == 9) {
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
    .appendTo("#tablaOrdenes_wrapper .col-md-6:eq(0)");


  $("#tablaOrdenes").attr("style", "width: 100%");
}

/**********************************************************************/
const selectAll = () => {
  console.log('selectAll');

  // Asignamos la variable que va a traer los registros del datatables
  var tableOrdenes = $("#tablaOrdenes").DataTable();

  // Mostramos todos los registros del datatable
  tableOrdenes.page.len(-1).draw();


  if ($('#selectAll').is(':checked')) {

    // Cuando se pone la selección de todos los registros del datatables

    var logistic_type = "arr_" + $("#logistic_type").val();

    var cartLogisticType = JSON.parse(localStorage.getItem(logistic_type)) || [];

    // Borramos la variable del localStorage por si tenian seleccionados algunos productos con anterioridad 
    localStorage.removeItem("ventaMultiple");

    // get the existing cart data from local storage or initialize an empty array
    var cart = cartLogisticType;

    // save the updated cart data back to local storage
    localStorage.setItem("ventaMultiple", JSON.stringify(cart));


    // Seleccionamos todos los input checkbox del datatables
    $('input.multiple_orders').prop("checked", true);  //[type="checkbox"]


  } else {

    // Cuando se quita la selección de todos los registros del datatables

    // Borramos la variable del localStorage por si tenian seleccionados algunos productos con anterioridad 
    localStorage.removeItem("ventaMultiple");

    // Seleccionamos todos los input checkbox del datatables
    $('input.multiple_orders').prop("checked", false); //[type="checkbox"]

  }


  // Mostramos solo 10 registros del datatable
  tableOrdenes.page.len(10).draw();

  //Update the value of the button
  $("#botonGenerarOrdenMultiple").html("Generar Orden (Productos: " + cart.length + ", Ventas: " + cart.reduce((a, b) => a + b.orderID.split(",").length, 0) + ")");

}

/**********************************************************************/
const imprimirEtiquetas = async () => {
  console.log('imprimirEtiquetas');

  let arrShipmentIds = [];


  var listCheckOrders = document.getElementsByClassName("multiple_orders");

  Array.prototype.forEach.call(listCheckOrders, function (elemento) {
    //console.log("id: "+elemento.name)
    let input_name_order = elemento.name;

    if ($('input:checkbox[name="' + input_name_order + '"]').is(':checked')) {
      arrShipmentIds.push(parseInt($("#" + input_name_order).attr('data-shipmentid')));
    }
  });

  //console.log(arrShipmentIds);
  total_impresiones = arrShipmentIds.length;
  //console.log(total_impresiones);

  // Se valida que se hayan seleccionado productos para imprimir
  if (total_impresiones == 0) {
    Swal.fire({
      icon: 'error',
      title: 'Sin selección',
      text: 'Por favor, selecciona los productos que deseas generar las etiquetas. Máximo 50 productos por impresión.',
    });

  } else {

    // Se valida que la selección de productos sea máximo de 50, ya que es lo que permite ML para generar las etiquetas
    if (total_impresiones > 50) {

      Swal.fire({
        icon: 'error',
        title: 'Máximo 50 productos',
        text: 'Por favor, selecciona máximo 50 productos para generar las etiquetas de impresión.',
      });

    } else {

      let shipmentIds = arrShipmentIds.toString();
      const keysML = await db.collection("ConfiguracionesGenerales").doc("keysML").get();
      datosKeys = keysML.data();
      //console.log(datosKeys);

      //shipmentIds = '42658610684,42658503091,42658607334';

      // Si se quisiera abrir en un Modal con un iFrame
      //$("#frame").html(`<iframe src="https://arceoconde.com/proyectos/mercadolibre/imprimirEtiquetas.php?ids=${shipmentIds}&t=${datosKeys.access_token}" width="100%" height="650px"></iframe>`);
      //$("#modal-etiquetas").modal('show');

      // Abre una nueva ventana con la URL
      window.open(`https://arceoconde.com/proyectos/mercadolibre/imprimirEtiquetas.php?ids=${shipmentIds}&t=${datosKeys.access_token}`, '_blank');

    } // else

  } // else

}


/**********************************************************************/
//Function to select all values that are
async function selectMultipleOrders(){

  var ordenes = document.getElementById("inputMultiplesOrdenesSeleccionar").value;
  if(ordenes == ''){
    Swal.fire({
      icon: 'error',
      title: 'Sin selección',
      text: 'Por favor, ingresa las órdenes que deseas seleccionar.',
    });
    return false;
  }

   // Mostramos todos los registros del datatable
  var tableOrdenes = $("#tablaOrdenes").DataTable();
   tableOrdenes.page.len(-1).draw();

  var ordenesArray = ordenes.split(' ');

  var errors = []

  for(x in ordenesArray){
    //Remove all non numeric characters
    var currentOrder = ordenesArray[x].replace(/\D/g,'');
    //If dont find the id #orden_ then add to errors array
    if(!document.getElementById('orden_'+currentOrder)){
      errors.push(currentOrder);
    }
    console.log(currentOrder);
    $('#orden_'+currentOrder).prop('checked', true);

    //Execute the event onchange
    $('#orden_'+currentOrder).trigger('change');
  }

  if(errors.length > 0){
    Swal.fire({
      icon: 'error',
      title: `No se encontraron ${errors.length} órdenes de ${ordenesArray.length}`,
      text: 'Las siguientes órdenes no se encontraron: '+errors,
    });
  }

   // Mostramos solo 10 registros del datatable
   tableOrdenes.page.len(10).draw();




}