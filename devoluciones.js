let db = firebase.firestore();
let storage = firebase.storage();
let skuAgregados = [];
let mercanciaDevolverList = [];
let elementosVentaDevuelta;
let idFirebaseVentaSelected = 0;
if (!sessionStorage.user) {
  document.location.href = "./";
}

$('.select2').select2({
  placeholder: 'Seleccionar'
});


const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Devoluciones", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Devoluciones"
    );
    if (tienePermiso) {
      db.collection("Devoluciones").onSnapshot((response) => {
        listarRegistro(response);
      });
    } else {
      if (window.confirm("No tienes permisos para acceder.")) {
        document.location.href = "./";
      } else {
        document.location.href = "./";
      }
    }
  });

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

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10) => {
  let divTable = document.getElementById("tblDevolucion");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaDevolucion";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  let contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Fecha de Registro</th>
            <th class="align-middle">Cliente</th>
            <th class="align-middle">Número Órden Venta</th>
            <th class="align-middle">Motivo</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Total Devolucion</th>
            <th class="align-middle">Detalles</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      fechaRegistro,
      cliente,
      numero_orden_venta,
      Motivo,
      comentarios,
      totalDevolucion,
    } = datos;
    contenido += `
                <tr >
                    <td>${formatoFecha(fechaRegistro)}</td>
                    <td>${cliente}</td>
                    <td>${numero_orden_venta}</td>
                    <td>${Motivo}</td>
                    <td>${comentarios}</td>
                    <td>${toCurrencyMXN(totalDevolucion)}</td>
                    <td> 
                    <button class="btn btn-info" onclick="detalleDevolucion('${
                      response_data.id
                    }')" title="Detalle Devolucion" data-toggle="modal" data-target="#modal-detalle"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-primary" onclick="aplicarDescuento('${numero_orden_venta}','${totalDevolucion}')" title="Aplicar Descuento" ><i class="fas fa-donate"></i></button>
                    </td>
                </tr>
                `;
  });

  contenido += "</tbody></table>";

  $("#tablaDevolucion").html(contenido);

  let tablaRegistros = $("#tablaDevolucion")
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
      order: [[0, "asc"]],
      buttons: [
        "pageLength",
        {
          extend: "excel",
          text: "Excel",
          className: "btn-dark",
          exportOptions: {
            columns: [0],
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
            columns: [0],
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
            columns: [0],
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
        {
          targets: [1],
          orderable: false,
          searchable: false,
        },
      ],
      select: true,
      initComplete: function () {
        let api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i != 1) {
            let column = api.column(i);
            let select = $('<select><option value=""></option></select>')
              .appendTo($(this).empty())
              .on("change", function () {
                let val = $.fn.dataTable.util.escapeRegex($(this).val());

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
        }); // filter
      }, // init
    })
    .buttons()
    .container()
    .appendTo("#tablaDevolucion_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  // Seleccionar un registro
  $("#tablaDevolucion tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**************************************************/
/* AGREGAR PRODUCTOS */
// Se muestra el detalle de la orden para agregar los productos correspondientes
const agregarProductos = () => {
  $("#addProductosHeader").show();
  $("#buttonsSave").show();
  $("#tblDevolucion").html("");
  $("#newDevolucion").html("");
  selectCliente();
};

/**
 * Valida que los campos esten con un valor
 * @param {*} listaCampos 
 * @returns 
 */
const validaCampos = (listaCampos) => {
  const tieneDatosVacios = listaCampos.some(
    (a) => a === null || a === undefined || a === ""
  );
  if (tieneDatosVacios) {
    createSw({
      title: "Error!",
      text: "Ningun campo de la Devolucion debe ir vacio",
      icon: "error",
    });
    return false;
  }
  return true;
};

const guardarDevolucion = () => {
  //Deactivate button
  $(".btn").attr("disabled", true);

  if (mercanciaDevolverList.length == 0) {
    createSw({
      title: "Error!",
      text: "No se encontraron productos a devolver",
      icon: "error",
    });
    return null;
  }

  //Se actualizan los elementos de la venta segun la devolucion
  for(x in mercanciaDevolverList){
    //console.log(mercanciaDevolverList[x].sku)
    let indexElemento = elementosVentaDevuelta.findIndex(e => e.skus.findIndex(el => el.sku == mercanciaDevolverList[x].sku) > -1);
    let indexSkuElemento = elementosVentaDevuelta[indexElemento].skus.findIndex(el => el.sku == mercanciaDevolverList[x].sku)
    //console.log(indexElemento)
    elementosVentaDevuelta[indexElemento].cantidad = Number(elementosVentaDevuelta[indexElemento].cantidad) - mercanciaDevolverList[x].cantidadesDevueltas;
    elementosVentaDevuelta[indexElemento].skus[indexSkuElemento].cantidad = Number(elementosVentaDevuelta[indexElemento].skus[indexSkuElemento].cantidad) - mercanciaDevolverList[x].cantidadesDevueltas;
    elementosVentaDevuelta[indexElemento].skus[indexSkuElemento].cantidadDevuelta = elementosVentaDevuelta[indexElemento].skus[indexSkuElemento].cantidadDevuelta ? elementosVentaDevuelta[indexElemento].skus[indexSkuElemento].cantidadDevuelta + mercanciaDevolverList[x].cantidadesDevueltas : mercanciaDevolverList[x].cantidadesDevueltas;
  }


  const fechaRegistro = $("#txtFecha").val();
  const cliente = $("#clienteList").val();
  const Motivo = $("#Motivo").val();
  const comentarios = $("#comentarios").val();
  const datosValidos = validaCampos([
    fechaRegistro,
    cliente,
    Motivo,
    comentarios,
  ]);
  if (datosValidos) {
    db.collection("Ventas")
      .doc(idFirebaseVentaSelected)
      .update({
        tieneDevolucion: true,
        elementos: elementosVentaDevuelta
      })
      .then(() => {
        let skusDevueltos = [];
        Promise.all(
          mercanciaDevolverList.map((skus) => {
            if (skus.cantidadesDevueltas) {
              return db
                .collection("Mercancia")
                .where("sku", "==", skus.sku)
                .get()
                .then((response) => {
                  let skuList = [];
                  response.forEach((doc) => {
                    skuList.push({ id: doc.id, ...doc.data() });
                  });
                  let skuSelected = skuList[0];
                  skusDevueltos.push(skuSelected);
                  const cantidad_disponible = skuSelected.cantidad_disponible;
                  const cantidad_vendida = skuSelected.cantidad_vendida;
                  const newCantidad_disponible =
                    cantidad_disponible + parseFloat(skus.cantidadesDevueltas);
                  const newCantidad_vendida =
                    cantidad_vendida - parseFloat(skus.cantidadesDevueltas);
                  const objNewDataSKU = {
                    cantidad_disponible: newCantidad_disponible,
                    cantidad_vendida: newCantidad_vendida,
                    ubicacion: "Almacen",
                    historialMovimientos : skuSelected.historialMovimientos == undefined ? `°${$( "#numero_orden_ventaList option:selected" ).text()}||Devolucion:+${skus.cantidadesDevueltas}` : skuSelected.historialMovimientos + ` °${$( "#numero_orden_ventaList option:selected" ).text()}||Devolucion:+${skus.cantidadesDevueltas}`
                  };
                  return db
                    .collection("Mercancia")
                    .doc(skuSelected.id)
                    .update(objNewDataSKU)
                    .then(() => {})
                    .catch((error) => {
                      console.log(
                        "🚀 ~ file: devoluciones.js ~ line 354 ~ .then ~ error",
                        error
                      );
                    });
                });
            }
          })
        ).then(() => {
          db.collection("Ventas")
            .doc(idFirebaseVentaSelected)
            .get()
            .then((response) => {
              const { numero_orden_venta } = response.data();
              mercanciaDevolverList = mercanciaDevolverList.filter(
                (merca) => merca.cantidadesDevueltas > 0
              );
              const montoTotalDevuelto = mercanciaDevolverList.reduce(
                (nex, prev) => {
                  return parseFloat(nex) + parseFloat(prev.totalDevolver);
                },
                0
              );

              //Agrega la categoria modelo y grupo al registro de la devolucion
              mercanciaDevolverList.forEach((element, index) => {
                const findConvinacion = skusDevueltos.find(
                  (sku) => sku.sku === element.sku
                );
                if (findConvinacion) {
                  mercanciaDevolverList[index].categoria =
                    findConvinacion.categoria;

                  mercanciaDevolverList[index].producto = findConvinacion.producto;

                  mercanciaDevolverList[index].variacion = findConvinacion.variacion;
                }
              });

              const newObjDevoluciones = {
                fechaRegistro: new Date(`${fechaRegistro}T00:00:00`),
                cliente,
                numero_orden_venta,
                Motivo,
                comentarios,
                Skus: mercanciaDevolverList,
                totalDevolucion: montoTotalDevuelto,
              };
            
              logger("Devoluciones", "Devolucion hecha", numero_orden_venta, null);
              db.collection("Devoluciones")
                .add(newObjDevoluciones)
                .then(() => {
                  createSw({
                    title: "Guardado",
                    text: "La devolucion fue agregada",
                    icon: "success",
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                });
            });
        });
      });
  }
};

const detalleDevolucion = (id) => {
  let divTable = document.getElementById("detalleDevolucion");
  divTable.innerHTML = "";
  db.collection("Devoluciones")
    .doc(id)
    .get()
    .then((response) => {
      let datos = response.data();
      datos.Skus.forEach((element) => {
        let newRow = `<tr id="tr_${element.sku}">
        <td>${element.sku}</td>
        <td>${element.categoria}</td>
        <td>${element.producto}</td>
        <td>${element.variacion}</td>
        <td>${element.cantidadesDevueltas}</td>
        <td>${toCurrencyMXN(element.totalDevolver)} </td>
       </tr>`;
        $("#tablaDetalle > tbody").append(newRow);
      });
    });
};

/**
 * Listado de Clientes
 */
const selectCliente = () => {
  var cliente = `<option value="">seleccionar</option>`;
  db.collection("Clientes").onSnapshot((response) => {
    response.forEach((response_data) => {
      let datos = response_data.data();
      cliente += `<option value="${datos.nombre_cliente}">${datos.nombre_cliente}</option>`;
      document.getElementById("clienteList").innerHTML = cliente;
    });
  });
};

/**
 * Lista las ventas por cliente
 */
const onChangeClient = (cliente) => {
  db.collection("Ventas")
    .where("cliente", "==", cliente)
    .get()
    .then((response) => {
      let ventasList = [];
      response.forEach((doc) => {
        ventasList.push({ id: doc.id, ...doc.data() });
      });
      var clienteVenta = `<option value="">seleccionar</option>`;
      ventasList.forEach((venta) => {
        clienteVenta += `<option value="${venta.id}">${venta.numero_orden_venta}</option>`;
        document.getElementById("numero_orden_ventaList").innerHTML =
          clienteVenta;
      });
    });
};

/**
 * Lista el detalle de mercancia de la venta
 */
const onChangeIdVenta = async (numero_orden_venta, numeroOrden) => {
  let divTable = document.getElementById("tablaSkusByVenta");
  divTable.innerHTML = "";
  idFirebaseVentaSelected = numero_orden_venta;
  //let mercanciaDevolverList = [];
  //let elementosVentaDevuelta;
  //Check if this venta already have a devolucion
  let devolucionExist = await db.collection("Devoluciones").where("numero_orden_venta", "==", Number(numeroOrden)).get();
  devolucionExist.forEach((doc) => {
    console.log(doc.data())
  })
  if(devolucionExist.docs.length > 0){
    console.log("Esta venta ya tiene una devolucion registrada")
    document.getElementById("alertaOrden").innerHTML = `<div class="alert alert-danger" role="alert">
    Esta venta ya tiene una devolucion registrada
  </div>`;
  }


  db.collection("Ventas")
    .doc(numero_orden_venta)
    .get()
    .then((responseConfig) => {
      let { elementos } = responseConfig.data();

      //console.log(elementos)
      elementosVentaDevuelta = elementos;

      elementos.forEach((element) => {
        if (element?.skus?.length) {
          element.skus.forEach((sku) => {
            campo = `
            <tr id="td_sku${sku.sku}">
            <td>${sku.sku}</td>
            <td>${sku.cantidad}</td>
            <td> <input
            type="number"
            value="0"
            id="cantidadADevolver${sku.sku}"
            max="${sku.cantidad}"
            oninput="changeMontoDevolucion(this.value, '${sku.sku}', '${sku.dimesiones}', '${element.precioUnitario}', '${sku.cantidad}')"
            /></td>
            <td>${sku.dimesiones}</td>
            <td>${element.precioUnitario}</td>
            <td><span id="id_montoDevolucion${sku.sku}"></span></td>
            <td><button class="btn btn-danger" onclick="quitarSku('${sku.sku}')" title="Quitar SKU"><i class="far fa-trash-alt"></i></button></td>
            </tr>
            `;
            $("#tablaSKU>tbody").append(campo);
          });
        }
      });
    });
};

const quitarSku = (sku) => {
  $(`#td_sku${sku}`).remove();
};
/**
 * Cambia el monto a devolver segun por sku
 * @param {*} value
 * @param {*} sku
 * @param {*} dimesiones
 * @param {*} precioUnitario
 */
const changeMontoDevolucion = (value, sku, dimesiones, precioUnitario, cantidadVenta) => {

  //Se valida que la cantidad a devolver ingresada sea menor o igual a la cantidad de venta
  if(Number(value) > Number(cantidadVenta)){
    value = 0;
    document.getElementById(`cantidadADevolver${sku}`).value = 0;
    document.getElementById(`id_montoDevolucion${sku}`).textContent = "";
    return null
  }
  const totalDevolver =
    parseFloat(value ?? 0) *
    parseFloat(dimesiones) *
    parseFloat(precioUnitario);
  const existInListMerca = mercanciaDevolverList.some(
    (mercancia) => mercancia?.sku === sku
  );
  if (!existInListMerca) {
    mercanciaDevolverList.push({
      sku,
      cantidadesDevueltas: parseFloat(value),
      precioUnitario,
      totalDevolver,
    });
  } else {
    mercanciaDevolverList.forEach((mercancia, index) => {
      if (mercancia?.sku === sku) {
        mercanciaDevolverList[index].cantidadesDevueltas = parseFloat(value);
        mercanciaDevolverList[index].totalDevolver = totalDevolver;
      }
    });
  }

  const id_montoDevolucion = document.getElementById(
    `id_montoDevolucion${sku}`
  );
  id_montoDevolucion.textContent = toCurrencyMXN(totalDevolver);
};

const aplicarDescuento = (numero_orden_venta, totalDevolucion) => {
  const question = confirm(
    "Es posible que el pedido no este surtido completamente,  porfavor revise el contenido del surtido antes de continuar. Desea cerrar la orden?"
  );
  if (!question) {
    return null;
  }

  db.collection("Ventas")
    .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
    .where("delete", "==", false)
    .get()
    .then((response) => {
      let ventaList = [];
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });
      const { TotalVenta, pago, TipoVenta, tieneDescuento, id } = ventaList[0];
      const nuevoPrecio = TotalVenta - parseFloat(totalDevolucion);
      const iva = TipoVenta == "Factura" ? nuevoPrecio * 0.16 : 0;
      const venta_mas_iva = iva + nuevoPrecio;

      const objVentaDescuento = {
        iva,
        ComentariosDescuento: `Descuento por devolucion ID: ${numero_orden_venta}`,
        TotalVentaOriginal: TotalVenta,
        TotalVenta: nuevoPrecio,
        venta_mas_iva,
        saldo: venta_mas_iva - pago,
      };
      if (!tieneDescuento) {
        objVentaDescuento.tieneDescuento = true;
      } else {
        delete objVentaDescuento.TotalVentaOriginal;
      }
      db.collection("Ventas")
        .doc(id)
        .update(objVentaDescuento)
        .then(() => {
          logger("Devoluciones", "Aplicar Descuento", id, objVentaDescuento);
          createSw({
            title: "Guardado!",
            text: "El pedido fue actualizado",
            icon: "success",
          });
        });
    });
};
