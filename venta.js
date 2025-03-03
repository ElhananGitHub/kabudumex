var db = firebase.firestore();
var storage = firebase.storage();
let info = [];
let datosOrdenEditar;
let numero_orden_ventaImagenId;
let numero_orden_ventaImagen;
let ordenActual = {};
let dataAplicarDescuento = {};
let permisosUsuario;
if (!sessionStorage.user) {
  document.location.href = "./";
}
let rowEliminadas = [];
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    logger("Venta", "Ingreso");
    let response = responseConfig.data();
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Venta"
    );
    permisosUsuario = tienePermiso;
    if (tienePermiso) {
      var dateQuery = new Date();
      dateQuery.setDate(dateQuery.getDate() - 30)
      // Obtenemos las Ventas de firebase
      db.collection("Ventas")
        .where("delete", "==", false)
        .orderBy("fechaVenta", "desc")
        .endAt(dateQuery)
        .onSnapshot((response) => {
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

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10, permisos) => {
  let divTable = document.getElementById("tblVenta");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaVenta";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">Número Órden Venta</th>
            <th class="filterhead">Cliente</th>
            <th class="filterhead">Estatus de Pedido</th>
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
            <th class="align-middle">Número Órden Venta</th>
            <th class="align-middle">Cliente</th>
            <th class="align-middle">Fecha de venta</th>
            <th class="align-middle">Estatus de Pedido</th>
            <th class="align-middle">Lista Productos</th>
            <th class="align-middle">Precio Total</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Link Orden Firmada</th>
            <th class="align-middle">Opciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      numero_orden_venta,
      cliente,
      EstatusPedido,
      elementos,
      EstatusPago,
      TipoVenta,
      venta_mas_iva,
      urlNota,
      fotoOrdenFirmada,
      fechaVenta,
      comentarios,
    } = datos;

    const { opciones } = permisos;
    const puedeRegresarVenta = opciones.find(
      (permiso) => permiso === "RegresarVenta"
    );

    const puedeCerrarVenta = opciones.find(
      (permiso) => permiso === "PuedeCerrarVenta"
    );

    let listaProductos = "";
    elementos?.forEach((item) => {
      if (item) {
        listaProductos += `<li> ${item.categoria} -> ${item.producto} -> ${item.variacion}: <b>${item.cantidad} </b></li>`;
      }
    });

    // Modal Detalle
    let modalDetalle = "modal-detalle";
    let detalle_venta = '';
    if(TipoVenta == "MercadoLibre") {
      modalDetalle = "modal-detalle-ML";
      detalle_venta = 'ML';
    }

    // Generamos el contenido de la tabla
    contenido += `
                <tr id="${response_data.id}">
                    <td>${numero_orden_venta}</td>
                    <td>${cliente}</td>
                    <td>${formatoFecha(fechaVenta)}</td>
                    <td>${EstatusPedido}</td>
                    <td><ul>${listaProductos}</ul></td>
                    <td>${toCurrencyMXN(venta_mas_iva)}</td>
                    <td>${comentarios ?? ""}</td>
                    <td>${
                      fotoOrdenFirmada
                        ? `<a href='${fotoOrdenFirmada}'  target=”_blank”>Ver</a>`
                        : ""
                    }</td>
                    <td>
                    ${
                      TipoVenta != "MercadoLibre" ?
                      `<button class="btn btn-warning" onclick="
                        
                        ${
                          EstatusPedido != "Pedido cerrado"
                            ? `selectCatalogos()`
                            : ""
                        }
                        ${
                          EstatusPedido != "Pedido cerrado" && EstatusPedido != "Cerrando pedido"
                            ? `editOrden('${response_data.id}')`
                            : `editOrdenPedidoCerrado('${response_data.id}')`
                        }" 
                        data-toggle="modal" data-target="#${
                          EstatusPedido != "Pedido cerrado" ? "modal-editar" : "modal-editarCerrado"
                        }" title="Editar Orden"><i class="fas fa-pencil-alt"></i></button>` 
                        : ""

                      }
                      
                      ${
                        EstatusPedido == "Pedido cerrado" || cliente == "ML-MultiOrdenes"
                          ? ""
                          : `<button class="btn btn-danger" onclick="borrarRegistro('${response_data.id}')" title="Borrar Orden"><i class="far fa-trash-alt"></i></button>`
                      }

                      ${
                        EstatusPedido == "Pedido cerrado" || cliente != "ML-MultiOrdenes"
                          ? ""
                          : `<button class="btn btn-danger" onclick="cancelarSurtidoVentaML('${response_data.id}')" title="Cancelar Entrega"><i class="far fa-window-close"></i></button>`
                      }
                      

                      ${
                        urlNota
                          ? `<button class="btn btn-primary" onclick="verDocumentoFirestore('${response_data.id}', '${urlNota}')" title="Descargar Nota"><i class="fas fa-file-download"></i></button>`
                          : ""
                      }

                      ${
                        EstatusPedido == "Pedido surtido" || EstatusPedido == "Pedido cerrado" && puedeCerrarVenta
                          ? `<button class="btn btn-success" id="cerrarOrden${numero_orden_venta}" onclick="cerrarOrden('${numero_orden_venta}')" title="Cerrar Orden"><i class="fas fa-cubes"></i></button>`
                          : ""
                      }

                      <button class="btn btn-info" onclick="detalleVenta('${numero_orden_venta}','${detalle_venta}')" title="Detalle de venta" data-toggle="modal" 
                      data-target="#${modalDetalle}"><i class="fas fa-eye"></i></button>

                      ${
                        EstatusPedido == "Pedido cerrado"
                          ? `
                          ${
                            puedeRegresarVenta
                              ? `<button class="btn btn-danger" onclick="regresarVenta('${numero_orden_venta}')" title="Regresar venta" ><i class="fas fa-long-arrow-alt-left"></i></button>`
                              : ""
                          }
                          <button class="btn btn-primary" onclick="showAplicarDescuento('${numero_orden_venta}')" title="Aplicar Descuento" data-toggle="modal" data-target="#modal-AplicarDescuento" ><i class="fas fa-donate"></i></button>
                          `
                          : ""
                      }

                      <button class="btn btn-primary" onclick="cargarImagen('${
                        response_data.id
                      }', '${numero_orden_venta}')" title="Cargar Imagen" data-toggle="modal" data-target="#modal-subirImagen"><i class="fas fa-cloud-upload-alt"></i></button>
                    </td>
                </tr>
                `;
  });

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
          action : function (e) { 
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
        {
          targets: [4],
          visible: false,
        },
        
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 0 || i == 1 || i == 2) {
            var column = api.column(i);
            var select = $(
              '<select><option value="">Selecciona</option></select>'
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
$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaVenta tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

// Add event listener for opening and closing details
$("#tablaVenta").on("click", "td.dt-control", function () {
  var tr = $(this).closest("tr");
  var row = table.row(tr);

  if (row.child.isShown()) {
    // This row is already open - close it
    row.child.hide();
    tr.removeClass("shown");
  } else {
    // Open this row
    row.child(format(row.data())).show();
    tr.addClass("shown");
  }
});

const cargarImagen = (id, numero_orden_venta) => {
  numero_orden_ventaImagenId = id;
  numero_orden_ventaImagen = numero_orden_venta;
  $("#imgFotoVenta").prop("src", "");
};

const descargarNota = (urlNota, id) => {
  logger("Venta", "Descargar Nota", id, urlNota);
  window.open(urlNota, "_blank");
};

const detalleVenta = (numero_orden_venta,op='') => {
  db.collection("Ventas")
    .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
    .where("delete", "==", false)
    .get()
    .then((response) => {
      let ventaList = [];
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });

      console.log(ventaList);


      let divtblResumen = document.getElementById("divtblResumen"+op);
      divtblResumen.innerHTML = "";
      let tableResumen = document.createElement("table");
      tableResumen.id = "tableResumen";
      tableResumen.setAttribute("class", "table table-bordered table-striped");
      divtblResumen.append(tableResumen);

      let divtblDetalle = document.getElementById("divtblDetalle"+op);
      divtblDetalle.innerHTML = "";
      let tableDetalle = document.createElement("table");
      tableDetalle.id = "tableDetalle";
      tableDetalle.setAttribute("class", "table table-bordered table-striped");
      divtblDetalle.append(tableDetalle);


      let campo_precio_o_publicacionML = "Precio Unitario";
      if(op == 'ML'){
        campo_precio_o_publicacionML = "Publicación MercadoLibre";
      }

      const { elementos, cliente } = ventaList[0];
      let newRow = `<table><thead>
      <tr>
        <th>Categoria</th>
        <th>Producto</th>
        <th>Variacion</th>
        <th>SKU</th> 
        <th>OC</th>
        <th>Cantidad (bultos)</th>
        <th>Kg/Mts/Pza</th>
        <th>Precio total</th>
      </tr>
    </thead><tbody>`;

      let newRowR = `<table><thead>
      <tr>
        <th>Categoria</th>
        <th>Producto</th>
        <th>Variacion</th>
        <th>Cantidad (Bultos)</th>
        <th>${campo_precio_o_publicacionML}</th>
      </tr>
    </thead><tbody>`;
      elementos.forEach((element) => {

        let result_precio_o_publicacionML = toCurrencyMXN(element.precioUnitario);
        if(op == 'ML'){
          result_precio_o_publicacionML = element.publicacionML;
        }

        newRowR += `<tr>
        <td>${element.categoria}</td>
        <td>${element.producto}</td>
        <td>${element.variacion}</td>
        <td>${element.cantidad}</td>
        <td>${result_precio_o_publicacionML}</td>
       </tr>`;

        if (element?.skus) {
          element.skus.forEach((sku) => {
            console.log(sku)
            const totalPrecio =
              parseFloat(sku.cantidad) *
              parseFloat(sku.dimesiones) *
              parseFloat(element.precioUnitario);

            newRow += `<tr>
            <td>${element.categoria}</td>
            <td>${element.producto}</td>
            <td>${element.variacion} </td>
            <td>${sku.sku} </td>
            <td>${sku.numero_orden_compra} </td>
            <td>${sku.cantidad} </td>
            <td>${sku.dimesiones} </td>
            <td>${toCurrencyMXN(totalPrecio)} </td>
           </tr>`;
          });
        }
      });
      newRow += "</tbody></table>";
      newRowR += "</tbody></table>";

      $("#tableDetalle").html(newRow);
      $("#tableResumen").html(newRowR);

      $("#tableDetalle")
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
          pageLength: 3,
          order: [[0, "desc"]],
          buttons: [
            "pageLength",
            {
              extend: "excel",
              text: "Excel",
              className: "btn-dark",
              exportOptions: {
                columns: [0, 1, 2, 3, 4, 5, 6],
              },
            },
            {
              extend: "pdfHtml5",
              text: "PDF",
              header: true,
              title: `Cliente: ${cliente} | Orden de Venta: ${numero_orden_venta}`,
              duplicate: true,
              className: "btn-dark",
              pageOrientation: "landscape",
              pageSize: "A4",
              pageMargins: [3, 3, 3, 3],
              exportOptions: {
                columns: [0, 1, 2, 3, 4, 5, 6],
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
                columns: [0, 1, 2, 3, 4, 5, 6],
              },
            },
            {
              extend: "colvis",
              text: "Columnas",
              className: "btn-dark",
            },
          ],
          columnDefs: [
            {
              targets: [1],
              orderable: false,
              searchable: false,
            },
          ],
          select: true,
          searching: true,
          paging: true,
          info: false,
        })
        .buttons()
        .container()
        .appendTo("#tableDetalle_wrapper .col-md-6:eq(1)");

      $("#tableResumen")
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
          pageLength: 5,
          order: [[0, "desc"]],
          buttons: [
            "pageLength",
            {
              extend: "excel",
              text: "Excel",
              className: "btn-dark",
              exportOptions: {
                columns: [0, 1, 2, 3],
              },
            },
            {
              extend: "pdfHtml5",
              text: "PDF",
              header: true,
              title: `Cliente: ${cliente} | Orden de Venta: ${numero_orden_venta}`,
              duplicate: true,
              className: "btn-dark",
              pageOrientation: "landscape",
              pageSize: "A4",
              pageMargins: [3, 3, 3, 3],
              exportOptions: {
                columns: [0, 1, 2, 3],
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
                columns: [0, 1, 2, 3],
              },
            },
            {
              extend: "colvis",
              text: "Columnas",
              className: "btn-dark",
            },
          ],
          select: true,
          searching: true,
          paging: true,
          info: false,
        })
        .buttons()
        .container()
        .appendTo("#tableResumen_wrapper .col-md-6:eq(1)");
    });
};

var nextinputEdit = 1;
var idVentaSelected = "";
const editOrden = (id) => {
  idVentaSelected = id;
  selectCliente(true);
  db.collection("Ventas")
    .doc(id)
    .get()
    .then((response) => {
      let datos = response.data();
      const {
        cliente,
        TipoVenta,
        condicionesPago,
        empresa,
        elementos,
        EstatusPedido,
        comentarios,
      } = datos;
      datosOrdenEditar = datos;
      if (!listCatalogos.length) {
        db.collection("ConfiguracionesGenerales")
          .doc("catalogoSelectores")
          .get()
          .then((response) => {
            listCatalogos = response.data();
            selectsData(true);
            llenaDatosEditar();
          });
      } else {
        selectsData(true);
        llenaDatosEditar();
      }

      const llenaDatosEditar = () => {
        let clienteList_editar = document.getElementById("clienteList_editar");
        clienteList_editar.value = cliente;

        let tipoVenta_editar = document.getElementById("tipoVenta_editar");
        tipoVenta_editar.value = TipoVenta;

        let condicionesPago_editar = document.getElementById(
          "condicionesPago_editar"
        );
        condicionesPago_editar.value = condicionesPago;

        let empresaList_editar = document.getElementById("empresaList_editar");
        empresaList_editar.value = empresa;

        let estatus_editar = document.getElementById("estatus_editar");
        estatus_editar.value = EstatusPedido;

        let comentarios_editar = document.getElementById("txtComentarios_editar");
        comentarios_editar.value = comentarios;

        $("#catalogosTable_editar>tbody").empty();
        elementos.forEach((item) => {
          const { precioUnitario, cantidad, categoria, producto, variacion } =
            item;
          const campo = `
          <tr id="td_edit${nextinputEdit}">
              <td><select class="form-control categoriaSelect" id="categoriaList_editar_${nextinputEdit}" onchange="selectProducto(this.value, ${nextinputEdit},true)"></select></td>
              <td><select class="form-control productoSelect" id="productoList_editar_${nextinputEdit}"   onchange="selectVariacion(this.value, ${nextinputEdit},true)" ></select></td>
              <td><select class="form-control variacionSelect" id="variacionList_editar_${nextinputEdit}"  onchange="selectShowCantidad(this.value, ${nextinputEdit},true)"></select></td>
              <td><input type="number" class="form-control cantidadInput" id="cantidad_editar_${nextinputEdit}"  value=${cantidad} ></td>
              <td><input type="number" class="form-control precioInput" id="precio_editar_${nextinputEdit}" value=${precioUnitario} ></td>
              <td><button type='button' class="btn btn-danger" onclick="borrarProductoAgregado_editar(${nextinputEdit})"><i class="far fa-trash-alt"></i></button></td>
          </tr>
          `;
          $("#catalogosTable_editar>tbody").append(campo);

          let cat = `<option value="">seleccionar</option>`;
          info.forEach((inventario) => {
            cat += `<option value="${inventario.nombreCategoria}">${inventario.nombreCategoria}</option>`;
            document.getElementById(
              `categoriaList_editar_${nextinputEdit}`
            ).innerHTML = cat;
          });
          document.getElementById(
            `categoriaList_editar_${nextinputEdit}`
          ).value = categoria;

          selectProducto(categoria, nextinputEdit, true);
          document.getElementById(
            `productoList_editar_${nextinputEdit}`
          ).value = producto;

          selectVariacion(producto, nextinputEdit, true);
          document.getElementById(
            `variacionList_editar_${nextinputEdit}`
          ).value = variacion;
          nextinputEdit++;
        });
      };
    })
    .catch((error) => {
      console.error("Error removing document: ", error);
    });
};
const editOrdenPedidoCerrado = (id) => {
  idVentaSelected = id;
  db.collection("Ventas")
    .doc(id)
    .get()
    .then((response) => {
      let datos = response.data();
      const { condicionesPago, empresa, comentarios } = datos;
      datosOrdenEditar = datos;
      if (!listCatalogos.length) {
        db.collection("ConfiguracionesGenerales")
          .doc("catalogoSelectores")
          .get()
          .then((response) => {
            listCatalogos = response.data();
            llenaDatosEditar();
          });
      } else {
        llenaDatosEditar();
      }

      const llenaDatosEditar = () => {
        let condicionesPagoStr = `<option value="">seleccionar</option>`;
        listCatalogos.condicionesPago.forEach((condicion) => {
          condicionesPagoStr += `<option value="${condicion}">${condicion}</option>`;
          document.getElementById("condicionesPago_editarC").innerHTML =
            condicionesPagoStr;
        });

        let empresaList = `<option value="">seleccionar</option>`;
        listCatalogos.Empresa.forEach((empresa) => {
          empresaList += `<option value="${empresa}">${empresa}</option>`;
          document.getElementById("empresaList_editarC").innerHTML =
            empresaList;
        });
        let condicionesPago_editar = document.getElementById(
          "condicionesPago_editarC"
        );
        condicionesPago_editar.value = condicionesPago;

        let empresaList_editar = document.getElementById("empresaList_editarC");
        empresaList_editar.value = empresa;

        document.getElementById("comentariosCerrado").value = comentarios;
      };
    })
    .catch((error) => {
      console.error("Error removing document: ", error);
    });
};

// const cerrarOrden = (numero_orden_venta) => {
//   //Se oculta el boton para que no se vuelva a clickear
//   const cerrarButon = document.getElementById(
//     `cerrarOrden${numero_orden_venta}`
//   );
//   cerrarButon.style = "display:none";
//   createSw({
//     title: "Cerrando Orden",
//     text: `La orden ${numero_orden_venta} se esta procesando... 
//     No cierre ni actualice la pagina`,
//   });

//   //Se obtinee el documento de la venta de Firebase
//   db.collection("Ventas")
//     .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
//     .where("delete", "==", false)
//     .get()
//     .then((response) => {
//       let ventaList = [];
//       response.forEach((doc) => {
//         ventaList.push({ id: doc.id, ...doc.data() });
//       });
//       const {
//         id,
//         elementos,
//         TipoVenta,
//         empresa,
//         numero_orden_venta,
//         fechaVenta,
//         cliente,
//         EstatusPedido,
//         comentarios,
//         fechaVencimiento,
//         condicionesPago,
//         TotalVentaOriginal,
//         ComentariosDescuento,
//         saldo,
//       } = ventaList[0];

//       //Primero se pone es este estado, por si se actualiza la pagina a la mitad no se pueda cerrar dos veces el mismo pedido
//       db.collection("Ventas")
//       .doc(id)
//       .update({EstatusPedido: "Preparando para cerrar pedido"})

//       logger(
//         "Venta",
//         "Inicia cierre de pedido",
//         numero_orden_venta,
//         null
//       );

//       db.collection("Clientes")
//         .where("nombre_cliente", "==", cliente)
//         .get()
//         .then((response) => {
//           let ClientesList = [];
//           response.forEach((doc) => {
//             ClientesList.push({ id: doc.id, ...doc.data() });
//           });

//           const clienteSelected = ClientesList[0];
//           const listForReport = [];
//           const listForReportByElement = [];
//           let TotalVenta = 0;

//           elementos.forEach((itemElementos) => {
//             const categoriaItem = itemElementos.categoria;
//             const productoItem = itemElementos.producto;
//             const variacionItem = itemElementos.variacion;
//             let cantidadItem = 0;
//             const precioUnitarioItem = parseFloat(itemElementos.precioUnitario);
//             let dimencionesSkusItem = 0;
//             let totalSkusItem = 0;

//             const precioUnitario = itemElementos.precioUnitario;
//             if (itemElementos?.skus?.length) {
//               itemElementos.skus.forEach((element) => {
//                 const SKU = element.sku;
//                 const Cantidad = parseFloat(element.cantidad);
//                 const Dimesiones = parseFloat(element.dimesiones);
//                 const totalSku = Cantidad * Dimesiones * precioUnitario;
//                 TotalVenta += totalSku;
//                 totalSkusItem += totalSku;
//                 dimencionesSkusItem += Dimesiones * Cantidad;
//                 cantidadItem += Cantidad;
//                 const objforReport = {
//                   SKU,
//                   Cantidad,
//                   "Kg/Mts/Pz": Dimesiones.toFixed(2),
//                   Producto: itemElementos.producto,
//                   Variacion: itemElementos.variacion,
//                   Total: toCurrencyMXN(totalSku),
//                 };
//                 listForReport.push(objforReport);
//               });
//             }

//             listForReportByElement.push({
//               Categoria: categoriaItem,
//               Producto: productoItem,
//               Variacion: variacionItem,
//               "Cantidad (Bultos)": cantidadItem.toFixed(2),
//               "P. Unitario": toCurrencyMXN(precioUnitarioItem),
//               "Total Kg/Mts/Pz": dimencionesSkusItem.toFixed(2),
//               Total: toCurrencyMXN(totalSkusItem),
//             });
//           });
//           const iva = TipoVenta == "Factura" ? TotalVenta * 0.16 : 0;
//           const venta_mas_iva = iva + TotalVenta;
//           let objElements = Object.assign({}, listForReportByElement);
//           let objMultiples = Object.assign({}, listForReport);
//           let granCantidadBulto = listForReportByElement.reduce((nex, prev) => {
//             return parseFloat(nex) + parseFloat(prev["Cantidad (Bultos)"]);
//           }, 0);
//           let granTotalKg = listForReportByElement.reduce((nex, prev) => {
//             return parseFloat(nex) + parseFloat(prev["Total Kg/Mts/Pz"]);
//           }, 0);

//           db.collection("ConfiguracionesGenerales")
//             .doc("ConfiguracionesApiGoogle")
//             .onSnapshot((response) => {
//               let { NotaDeVenta } = response.data();
//               let configEndPoint = NotaDeVenta;
//               configEndPoint.documentName =
//                 `Nota de Venta ` + numero_orden_venta + " - " + cliente + ".pdf";

//               const apiBody = {
//                 multiples: { Resumen: objElements, Desglose: objMultiples },
//                 config: configEndPoint,
//                 "No. de Nota": numero_orden_venta,
//                 "Fecha de Venta": formatoFecha(fechaVenta),
//                 "Fecha de Hoy": formatoFechaNow(),
//                 Empresa: empresa,
//                 "Tipo de Venta": TipoVenta,
//                 Comentarios: comentarios,
//                 "Condiciones de pago": condicionesPago,
//                 "Fecha de Vencimiento": fechaVencimiento,
//                 "Estatus de la Venta": "Deuda",
//                 "Gran Total Cantidad (Bultos)": granCantidadBulto.toFixed(2),
//                 "Gran Total Kg/Mts/Pza": granTotalKg.toFixed(2),
//                 "Total Venta": toCurrencyMXN(TotalVenta),
//                 IVA: toCurrencyMXN(iva),
//                 TotalMasIVA: toCurrencyMXN(venta_mas_iva),
//                 Pago: toCurrencyMXN(0),
//                 Saldo: toCurrencyMXN(venta_mas_iva),
//                 Cliente: cliente,
//                 "Total Venta sin Descuento": TotalVentaOriginal
//                   ? toCurrencyMXN(TotalVentaOriginal)
//                   : toCurrencyMXN(TotalVenta),
//                 "Comentarios Descuento": ComentariosDescuento ?? "",
//                 Email: clienteSelected?.email_contacto,
//               };

//               const config = {
//                 method: "POST",
//                 headers: { "Content-Type": "text/plain" },
//                 body: JSON.stringify(apiBody),
//               };
//               console.log(apiBody)
//               fetch(
//                 "https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?user=USUARIO&accion=generarDocumento",
//                 config
//               )
//                 .then((response) => response.text())
//                 .then((result) => {
//                   const res = JSON.parse(result);

//                   if (EstatusPedido == "Pedido cerrado") {
//                     db.collection("Ventas")
//                       .doc(id)
//                       .update({
//                         urlNota: res.urlDocumentoDownload,
//                       })
//                       .then(() => {
//                         logger("Venta", "Cierre de pedido (Ya cerrado)", numero_orden_venta);
//                         createSw({
//                           title: "Guardado",
//                           text: "El pedido fue actualizado",
//                           icon: "success",
//                         });
//                       });
//                   } else {
//                     const objCerrarPedido = {
//                       EstatusPedido: "Cerrando pedido",
//                       TotalVenta,
//                       iva,
//                       saldo: saldo + venta_mas_iva,
//                       venta_mas_iva,
//                       urlNota: res.urlDocumentoDownload,
//                       fechaCierre: new Date(),
//                     };
//                     db.collection("Ventas")
//                       .doc(id)
//                       .update(objCerrarPedido)
//                       .then(() => {
//                         logger("Venta", "Cierre de pedido", numero_orden_venta,objCerrarPedido);
//                          //Se procede a descontar la mercancia del inventario 
//                         Promise.all(
//                           listForReport.map((element) => {
//                             const sku = element.SKU;
//                             return db
//                               .collection("Mercancia")
//                               .where("sku", "==", sku)
//                               .get()
//                               .then((response) => {
//                                 let MercanciaList = [];
//                                 response.forEach((doc) => {
//                                   MercanciaList.push({
//                                     id: doc.id,
//                                     ...doc.data(),
//                                   });
//                                 });
//                                 const skuItem = MercanciaList[0];

//                                 let cantidad_disponible =
//                                   skuItem.cantidad_disponible -
//                                   element.Cantidad;
//                                 let cantidad_vendida =
//                                   skuItem.cantidad_vendida + element.Cantidad;
//                                 let sub_ubicacion = skuItem.sub_ubicacion;
//                                 let ubicacion = skuItem.ubicacion;
//                                 if (skuItem.cantidad_comprada == 1) {
//                                   ubicacion = "Vendida";
//                                   sub_ubicacion = cliente;
//                                 }
//                                 let = historialMovimientos = skuItem.historialMovimientos == undefined ? `°${numero_orden_venta}:-${element.Cantidad}` : skuItem.historialMovimientos + ` °${numero_orden_venta}:-${element.Cantidad}`
//                                 return db
//                                   .collection("Mercancia")
//                                   .doc(skuItem.id)
//                                   .update({
//                                     cantidad_disponible,
//                                     cantidad_vendida,
//                                     sub_ubicacion,
//                                     ubicacion,
//                                     historialMovimientos
//                                   });
//                               });
//                           })
//                         ).then(() => {
//                           createSw({
//                             title: "Guardado",
//                             text: "El pedido fue actualizado",
//                             icon: "success",
//                           });

//                           //Se actualiza el pedido a Cerrado
//                           db.collection("Ventas")
//                           .doc(id)
//                           .update({EstatusPedido: "Pedido cerrado"})

//                           logger("Venta", "Cierre de pedido Exitoso", numero_orden_venta, null);

//                           var requestOptions = {
//                             method: "GET",
//                             redirect: "follow",
//                           };
//                           fetch(window.URLUpdateMercancia, requestOptions)
//                             .then((response) => response.text())
//                             .then((result) => 
//                             null
//                             )
//                             .catch((error) => console.log("error", error));
//                         });
//                       })
//                       .catch((error) => {
//                         createSw({
//                           title: "Error",
//                           text: "No se pudo realizar la actualizacion",
//                           icon: "error",
//                         });
//                         console.log("error en fase 2", error);
//                       });
//                   }
//                 })
//                 .catch(function (error) {
//                   createSw({
//                     title: "Error",
//                     text: "No se pudo realizar la actualizacion",
//                     icon: "error",
//                   });

//                   console.log("error en fase 1", error);
//                 });
//             });
//         });
//     });
// };

async function cerrarOrden(numero_orden_venta) {
  //Se oculta el boton para que no se vuelva a clickear
  const cerrarButon = document.getElementById(
    `cerrarOrden${numero_orden_venta}`
  );
  cerrarButon.style = "display:none";
  createSw({
    title: "Cerrando Orden",
    text: `La orden ${numero_orden_venta} se esta procesando...
    No cierre ni actualice la pagina`,
  });

  var user = firebase.auth().currentUser;

  //Se ejecuta api para cerrar la venta
  var url = window.URLCerrarVenta + "?numero_orden_venta=" + numero_orden_venta + "&user=" + user.email;

  console.log(url)

  var response = await fetch(url);
  var data = await response.json();

  if (data.result == "ok") {
    createSw({
      title: "Guardado",
      text: "El pedido fue actualizado",
      icon: "success",
    });
  } else {
    createSw({
      title: "Error",
      text: "No se pudo realizar la actualizacion",
      icon: "error",
    });
  }
  return
}

const selectCliente = (isEdit) => {
  var cliente = `<option value="">seleccionar</option>`;

  // Recuperamos la información de los clientes en firebase
  db.collection("Clientes")
    .orderBy("nombre_cliente", "asc")
    .onSnapshot((response) => {
      //console.log(response)
      response.forEach((response_data) => {
        //console.log(response_data.data())
        let datos = response_data.data();

        cliente += `<option value="${datos.nombre_cliente}">${datos.nombre_cliente}</option>`;

        document.getElementById(
          isEdit ? "clienteList_editar" : "clienteList"
        ).innerHTML = cliente;
      });
    });
};

/**************************************************/
/* SELECT CATALOGOS */
// Muestra los select de los catalogos en la ventana modal
var listCatalogos = [];
const selectCatalogos = () => {
  info = [];
  db.collection("INVENTARIO-TOTAL")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        info.push({ id: doc.id, ...doc.data() });
      });

      let cat = `<option value="">seleccionar</option>`;
      info.forEach((inventario) => {
        cat += `<option value="${inventario.nombreCategoria}">${inventario.nombreCategoria}</option>`;
        document.getElementById("categoriaList_1").innerHTML = cat;
      });

      if (!listCatalogos.length) {
        db.collection("ConfiguracionesGenerales")
          .doc("catalogoSelectores")
          .get()
          .then((response) => {
            listCatalogos = response.data();
            selectsData();
          });
      } else {
        selectsData();
      }

      document.getElementById("productoList_1").innerHTML = "";
      document.getElementById("variacionList_1").innerHTML = "";
      document.getElementById("cantidad_1").value = "";
      document.getElementById("precio_1").value = "";
    });
};

const selectsData = (isEdit) => {
  let tipoVentaSelect = `<option value="">seleccionar</option>`;
  listCatalogos.TipoVenta.forEach((tipoVenta) => {
    tipoVentaSelect += `<option value="${tipoVenta}">${tipoVenta}</option>`;
    document.getElementById(
      isEdit ? "tipoVenta_editar" : "tipoVenta"
    ).innerHTML = tipoVentaSelect;
  });

  let condicionesPago = `<option value="">seleccionar</option>`;
  listCatalogos.condicionesPago.forEach((condicion) => {
    condicionesPago += `<option value="${condicion}">${condicion}</option>`;
    document.getElementById(
      isEdit ? "condicionesPago_editar" : "condicionesPago"
    ).innerHTML = condicionesPago;
  });

  let empresaList = `<option value="">seleccionar</option>`;
  listCatalogos.Empresa.forEach((empresa) => {
    empresaList += `<option value="${empresa}">${empresa}</option>`;
    document.getElementById(
      isEdit ? "empresaList_editar" : "empresaList"
    ).innerHTML = empresaList;
  });

  let estatusList = `<option value="">seleccionar</option>`;
  listCatalogos.EstatusOrdenList.forEach((estatus) => {
    estatusList += `<option value="${estatus}">${estatus}</option>`;
    document.getElementById("estatus_editar").innerHTML = estatusList;
  });
};

const selectProducto = (value, index, isEdit) => {
  const listProd = info.find((inv) => inv.nombreCategoria == value);
  if (listProd?.productos.length) {
    const listProds = listProd?.productos.map((prod) => prod.produc);
    let prodValues = `<option value="">seleccionar</option>`;
    listProds.sort().forEach((prod) => {
      prodValues += `<option value="${prod}">${prod}</option>`;
      document.getElementById(
        isEdit ? `productoList_editar_${index}` : `productoList_${index}`
      ).innerHTML = prodValues;
    });
  }
};

const selectVariacion = (value, index, isEdit) => {
  const valueCat = document.getElementById(
    isEdit ? `categoriaList_editar_${index}` : `categoriaList_${index}`
  );
  const listProd = info.find((inv) => inv.nombreCategoria == valueCat.value);

  const listVariacion = listProd.productos.find((prod) => prod.produc == value);

  if (listVariacion?.variaciones.length) {
    const listVariaciones = listVariacion?.variaciones.map(
      (prod) => prod.variacion
    );
    let prodValues = `<option value="">seleccionar</option>`;
    listVariaciones.sort().forEach((varia) => {
      prodValues += `<option value="${varia}">${varia}</option>`;
      document.getElementById(
        isEdit ? `variacionList_editar_${index}` : `variacionList_${index}`
      ).innerHTML = prodValues;
    });
  }
};

const selectShowCantidad = (value, index, isEdit) => {
  const valueCat = document.getElementById(
    isEdit ? `categoriaList_editar_${index}` : `categoriaList_${index}`
  );
  const listProd = info.find((inv) => inv.nombreCategoria == valueCat.value);
  const valueProd = document.getElementById(
    isEdit ? `productoList_editar_${index}` : `productoList_${index}`
  );
  console.log({valueCat: valueCat.value, listProd, valueProd: valueProd.value})
  const listVariacion = listProd.productos.find(
    (prod) => prod.produc == valueProd.value
  );
  console.log({listVariacion})
  const objVariacion = listVariacion.variaciones.find(
    (varia) => varia.variacion == value
  );
  console.log({objVariacion})
  const cantidad = document.getElementById(
    isEdit ? `cantidad_editar_${index}` : `cantidad_${index}`
  );
  cantidad.placeholder = `${objVariacion.totalSkuCantidades}`;
  cantidad.setAttribute("onchange", `validarCantidad(${index})`);
};

//Funcion para validar la cantidad de productos
const validarCantidad = (index) => {
  const cantidadField = document.getElementById(`cantidad_${index}`);
  const cantidad = cantidadField.value;
  const cantidadPlaceholder = Number(cantidadField.placeholder.replace("Dis ", ""));

  if (cantidad > cantidadPlaceholder) {
    cantidadField.style = "border: 1px solid red; background-color: #f8d7da;";
  } else {
    cantidadField.style = "border: 1px solid #ced4da; background-color: #fff;";
  }
};

//Funcion para cargar masivamente productos a la orden de venta
const cargarProductosMasivamente = (arrayProductos) => {
  const arrayErrores = [];
  arrayProductos.forEach((producto, i) => {
    const categoria = producto.Categoria;
    const productoName = producto.Producto;
    const variacion = producto.Variacion;
    const cantidad = producto.Cantidad;
    const precio = producto.Precio;

    try {
    document.getElementById(`categoriaList_${i + 1}`).value = categoria;
    selectProducto(categoria, i + 1);
    document.getElementById(`productoList_${i + 1}`).value = productoName;
    selectVariacion(productoName, i + 1);
    document.getElementById(`variacionList_${i + 1}`).value = variacion;
    selectShowCantidad(variacion, i + 1);
    document.getElementById(`cantidad_${i + 1}`).value = cantidad;
    document.getElementById(`precio_${i + 1}`).value = precio;
    validarCantidad(i + 1);
    } catch (error) {
      console.log(variacion)
      console.log(error);
      arrayErrores.push(`*${categoria} - ${productoName} - ${variacion}\n`);
    }

    if(i + 1 < arrayProductos.length){
      agregarCampos();
    }
  });

  if(arrayErrores.length){
    alert(`Los siguientes productos no se pudieron cargar porque no existen en el inventario:\n ${arrayErrores.join('')}`);
  }
};

//Function to upload excel and convert to json
const cargarExcelProductosMasivos = () => {
  var file = document.querySelector("#fileExcel").files[0];
  var type = file.name.split(".");
  if (type[type.length - 1] !== "xlsx" && type[type.length - 1] !== "xls") {
    alert("El archivo no es un excel");
    return false;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, {
      type: "binary"
    });
    workbook.SheetNames.forEach((sheet) => {
      var rowObject = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]);

      if (rowObject.length > 0) {
        var rowObject = rowObject.filter((obj) => obj.Categoria);
        cargarProductosMasivamente(rowObject);
      }
    });
  };
  reader.onerror = (ex) => {
    console.log(ex);
  };
  reader.readAsBinaryString(file);

  document.getElementById("fileExcel").value = "";
};


    
    






/**************************************************/
/* AGREGAR CAMPOS */
// Agregamos otro renglón para generar la venta (Categoria, Producto, Variación, Cantidad, Precio)
var nextinput = 1;
function agregarCampos() {
  nextinput++;
  campo = `
    <tr id="td_${nextinput}">
        <td><select class="form-control categoriaSelect" id="categoriaList_${nextinput}" data-id="${nextinput}" onchange="selectProducto(this.value, ${nextinput})"></select></td>
        <td><select class="form-control productoSelect" id="productoList_${nextinput}" data-id="${nextinput}"  onchange="selectVariacion(this.value, ${nextinput})" ></select></td>
        <td><select class="form-control variacionSelect" id="variacionList_${nextinput}" data-id="${nextinput}" onchange="selectShowCantidad(this.value, ${nextinput})"></select></td>
        <td><input type="number" class="form-control cantidadInput" id="cantidad_${nextinput}" data-id="${nextinput}"></td>
        <td><input type="number" class="form-control precioInput" id="precio_${nextinput}"  data-id="${nextinput}"></td>
        <td><button class="btn btn-danger" onclick="borrarProductoAgregado(${nextinput})"><i class="far fa-trash-alt"></i></button></td>
    </tr>
    `;
  $("#catalogosTable>tbody").append(campo);
  let cat = `<option value="">seleccionar</option>`;
  info.forEach((inventario) => {
    cat += `<option value="${inventario.nombreCategoria}">${inventario.nombreCategoria}</option>`;
    document.getElementById(`categoriaList_${nextinput}`).innerHTML = cat;
  });
}

const isValidForm = (isEdit) => {
  if ($(isEdit ? "#clienteList_editar" : "#clienteList").val() == "") {
    createSw({
      title: "Error",
      text: "Debes seleccionar un Cliente",
      icon: "error",
    });
    return false;
  }

  if ($(isEdit ? "#tipoVenta_editar" : "#tipoVenta").val() == "") {
    createSw({
      title: "Error",
      text: "Debes seleccionar un tipo de venta",
      icon: "error",
    });
    return false;
  }

  if ($(isEdit ? "#condicionesPago_editar" : "#condicionesPago").val() == "") {
    createSw({
      title: "Error",
      text: "Debes seleccionar condiciones pago",
      icon: "error",
    });
    return false;
  }

  if ($(isEdit ? "#empresaList_editar" : "#empresaList").val() == "") {
    createSw({
      title: "Error",
      text: "Debes seleccionar una empresa",
      icon: "error",
    });
    return false;
  }

  if (isEdit && $("#estatus_editar").val() == "") {
    createSw({
      title: "Error",
      text: "Debes seleccionar un estatus",
      icon: "error",
    });
    return false;
  }
  return true;
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

const borrarProductoAgregado = (valor) => {
  $(`#td_${valor}`).remove();
};

const borrarProductoAgregado_editar = (valor) => {
  $(`#td_edit${valor}`).remove();
  rowEliminadas.push(valor);
};

/**************************************************/
/* GURDAR ORDEN */
// Agregamos la Órden a Firebase
const guardarOrden = () => {
  var categoriaList = document.getElementsByClassName("categoriaSelect");
  const total_registros = categoriaList.length;
  const categoriaList_1 = document.getElementById("categoriaList_1");
  if (nextinput === 1 && categoriaList_1.value === "") {
    if (isValidForm()) {
      creaOrdenPendiente();
    }
  } else {
    if (isValidForm()) {
      var cliente = $("#clienteList").val();
      var TipoVenta = $("#tipoVenta").val();
      var condicionesPago = $("#condicionesPago").val();
      var empresaList = $("#empresaList").val();
      var comentarios = $("#txtComentarios").val();
      const productosSelectedList = [];

      if (total_registros > 0) {
        let isValidData = false;
        let arrConvinacionAgregada = [];
        for (let i = 1; i <= nextinput; i++) {
          const tdExist = document.getElementById("td_" + i);
          if (tdExist) {
            var categoria = $("#categoriaList_" + i).val();
            var producto = $("#productoList_" + i).val();
            var variacion = $("#variacionList_" + i).val();
            var cantidad = $("#cantidad_" + i).val();
            var precioUnitario = $("#precio_" + i).val();
            const cantidadInput = document.getElementById("cantidad_" + i);
            const newValorCantidad = cantidadInput.placeholder.substring(12);
            arrConvinacionAgregada.push(`${categoria}${producto}${variacion}`);

            isValidData = validaCampos([
              categoria,
              producto,
              variacion,
              cantidad,
              precioUnitario,
            ]);

            if (!isValidData) {
              break;
            }

            if (parseFloat(cantidad) > parseFloat(newValorCantidad)) {
              createSw({
                title: "Error",
                text: "La cantidad no puede ser mayor al disponible",
                icon: "error",
              });
              isValidData = false;
              break;
            }

            productosSelectedList.push({
              cantidad,
              categoria,
              precioUnitario,
              producto,
              variacion,
            });
          }
        }

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
              const fechaVenta = new Date();
              const fechaVencimiento = getFechaVencimiento(
                fechaVenta,
                condicionesPago
              );
              const nuevoPedido = {
                EstatusPago: "Deuda",
                EstatusPedido: "Almacen",
                TotalVenta: 0,
                cliente,
                elementos: productosSelectedList,
                fechaVenta: new Date(),
                iva: 0,
                numero_orden_venta: nuevoIdVenta,
                pago: 0,
                saldo: 0,
                venta_mas_iva: 0,
                TipoVenta,
                condicionesPago,
                empresa: empresaList,
                delete: false,
                comentarios,
                fechaVencimiento: new Date(fechaVencimiento),
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

                  createSw({
                    title: "Guardado",
                    text: "El pedido fue agregado",
                    icon: "success",
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                });
            });
          // limpiarModal(total_registros);
          // $("#modal-add").modal("hide");
        }
      }
    }
  }
};

/**************************************************/
/* LIMPIAR MODAL */
// Limpiamos el modal, para agregar más órdenes
const limpiarModal = () => {
  var categoriaList = document.getElementsByClassName("categoriaSelect");
  const total_registros = categoriaList.length;
  $("#numero_orden_venta").val("");
  $("#clienteList").val("");
  $("#tipoVenta").val("");
  $("#condicionesPago").val("");
  $("#empresaList").val("");

  // Eliminamos los renglones agregados y dejamos solo 1 renglón
  if (total_registros > 1) {
    nextinput = 1;
    for (var i = 2; i <= total_registros; i++) {
      $("#categoriaList_" + i).remove();
      $("#productoList_" + i).remove();
      $("#variacionList_" + i).remove();
      $("#cantidad_" + i).remove();
      $("#precio_" + i).remove();
      $("#td_" + i).remove();
    }
  }
  /*
  //Codigo para select2
  $('.select2').select2({
    placeholder: 'Seleccionar'
  });
  */
};

/**************************************************/
/* SHOW MODAL EDIT */
// Abre la ventana modal para edición y muestra la información de los campos
const showModalEdit = (id) => {
  // Recuperamos la información en firebase con el ID
  db.collection("Mercancia")
    .doc(id)
    .get()
    .then((response) => {
      let datos = response.data();
      // Mostramos la consulta en los campos
      $("#sku_edit").html(datos.sku);
      $("#categoria_edit").html(datos.categoria);
      $("#producto_edit").html(datos.producto);
      $("#variacion_edit").html(datos.variacion);
      $("#ubicacion_edit").val(datos.ubicacion);
      $("#sub_ubicacion_edit").val(datos.sub_ubicacion);

      $("#id_edit").val(id);
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: venta.js ~ line 874 ~ showModalEdit ~ error",
        error
      );
    });
};

/**************************************************/
/* EDITAR REGISTRO */
// Edita el registro seleccionado en firebase
const editarRegistro = () => {
  let ubicacion = $("#ubicacion_edit").val();
  let sub_ubicacion = $("#sub_ubicacion_edit").val();
  let foto = $("#foto_edit").val();
  let id = $("#id_edit").val();

  db.collection("Mercancia")
    .doc(id)
    .update({
      ubicacion: ubicacion,
      sub_ubicacion: sub_ubicacion,
      foto: foto,
    })
    .then(() => {
      $("#modal-edit").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: venta.js ~ line 904 ~ editarRegistro ~ error",
        error
      );
    });
};

/**************************************************/
/* BORRAR REGISTRO */
// Elimina el registro seleccionado en firebase
const borrarRegistro = (id) => {
  if (confirm("¿Deseas eliminar el registro?") == 1) {
    logger("Venta", "Eliminar pedido", id);
    db.collection("Ventas").doc(id).update({
      delete: true,
    });
    createSw({
      title: "Eliminado",
      text: "La orden fue eliminada",
      icon: "success",
    });
  }
};

/**************************************************/
/* EDICIÓN MULTIPLE */
// Se abre una ventana modal y se muestran todos los registros que se seleccionaron para Editar
const edicionMultiple = () => {
  var checkedBox = $.map(
    $('input:checkbox[name="mercancia"]:checked'),
    function (val, i) {
      // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
      let id = val.value;
      // Recuperamos la información en firebase con el ID
      db.collection("Mercancia")
        .doc(id)
        .get()
        .then((response) => {
          let datos = response.data();
          $("#modal-edit-multiple").modal("show");
        })
        .catch((error) => {
          console.log(
            "🚀 ~ file: venta.js ~ line 954 ~ edicionMultiple ~ error",
            error
          );
        });

      return val.value;
    }
  );
  $("#id_edit_multiple").val(checkedBox);
};

/**************************************************/
/* ACTUALZIAR MULTIPLE */
// Edita los registros seleccionados en firebase
const actualizarMultiple = () => {
  var id_edit_multiple = $("#id_edit_multiple").val();
  var arrayIDMercancia = id_edit_multiple.split(",");
  let total_registros = arrayIDMercancia.length;

  if (total_registros > 0) {
    for (x = 0; x < total_registros; x++) {
      var id = arrayIDMercancia[x];
      let ubicacion = $("#ubicacion_edit_multiple").val();
      let sub_ubicacion = $("#sub_ubicacion_edit_multiple").val();

      db.collection("Mercancia")
        .doc(id)
        .update({
          ubicacion: ubicacion,
          sub_ubicacion: sub_ubicacion,
        })
        .then((response) => {
          $("#modal-edit-multiple").modal("hide");
        })
        .catch((error) => {
          console.log(
            "🚀 ~ file: venta.js ~ line 1001 ~ actualizarMultiple ~ error",
            error
          );
        });
    }
  }
};

/**************************************************/
/* BORRAR MULTIPLE */
// Elimina los registros seleccionados en firebase
const borrarMultiple = () => {
  console.log("borrarMultiple");

  if (confirm("¿Deseas eliminar los registros seleccionados?") == 1) {
    var checkedBox = $.map(
      $('input:checkbox[name="mercancia"]:checked'),
      function (val, i) {
        // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
        let id = val.value;
        db.collection("Mercancia")
          .doc(id)
          .delete()
          .then(() => {
            console.log("Document successfully deleted");
          })
          .catch((error) => {
            console.error("Error removing document: ", error);
          });

        return val.value;
      }
    );
  }
};

/**************************************************/
/* SELECT ALL */
// Sleccionar todos los registros
const selectAll = () => {
  // Seleccionar los checkbox
  if ($(".checkVenta").length != $(".checkVenta:checked").length) {
    $(".checkVenta").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkVenta").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }

  // Deseleccionar los checkbox
  if ($(".checkVenta").length == $(".checkVenta:checked").length) {
    $(".checkVenta").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkVenta").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }
};

const agregarCamposEditar = () => {
  campo = `
    <tr id="td_edit${nextinputEdit}">
        <td><select class="form-control categoriaSelect" id="categoriaList_editar_${nextinputEdit}" data-id="${nextinputEdit}" onchange="selectProducto(this.value, ${nextinputEdit}, true)"></select></td>
        <td><select class="form-control productoSelect" id="productoList_editar_${nextinputEdit}" data-id="${nextinputEdit}"  onchange="selectVariacion(this.value, ${nextinputEdit}, true)" ></select></td>
        <td><select class="form-control variacionSelect" id="variacionList_editar_${nextinputEdit}" data-id="${nextinputEdit}" onchange="selectShowCantidad(this.value, ${nextinputEdit}, true)"></select></td>
        <td><input type="number" class="form-control cantidadInput" id="cantidad_editar_${nextinputEdit}" data-id="${nextinputEdit}"></td>
        <td><input type="number" class="form-control precioInput" id="precio_editar_${nextinputEdit}"  data-id="${nextinputEdit}"></td>
        <td><button type='button' class="btn btn-danger" onclick="borrarProductoAgregado_editar(${nextinputEdit})"><i class="far fa-trash-alt"></i></button></td>
    </tr>
    `;
  $("#catalogosTable_editar>tbody").append(campo);
  let cat = `<option value="">seleccionar</option>`;
  info.forEach((inventario) => {
    cat += `<option value="${inventario.nombreCategoria}">${inventario.nombreCategoria}</option>`;
    document.getElementById(`categoriaList_editar_${nextinputEdit}`).innerHTML =
      cat;
  });
  nextinputEdit++;
};

const guardarOrdenEditada = () => {
  if (isValidForm(true)) {
    var cliente = $("#clienteList_editar").val();
    var TipoVenta = $("#tipoVenta_editar").val();
    var condicionesPago = $("#condicionesPago_editar").val();
    var empresa = $("#empresaList_editar").val();
    var EstatusPedido = $("#estatus_editar").val();
    var comentarios = $("#txtComentarios_editar").val();
    console.log({comentarios})

    const productosSelectedList = [];

    let isValidData = false;
    for (var i = 1; i < nextinputEdit; i++) {
      var categoria = $("#categoriaList_editar_" + i).val();
      var producto = $("#productoList_editar_" + i).val();
      var variacion = $("#variacionList_editar_" + i).val();
      var cantidad = $("#cantidad_editar_" + i).val();
      var precioUnitario = $("#precio_editar_" + i).val();
      const isDeleted = rowEliminadas.find((row) => row == i);

      if (!isDeleted) {
        isValidData = validaCampos([
          categoria,
          producto,
          variacion,
          cantidad,
          precioUnitario,
        ]);

        if (!isValidData) {
          break;
        }
        productosSelectedList.push({
          cantidad,
          categoria,
          precioUnitario,
          producto,
          variacion,
        });
      }
    }

    //Si no se cambio en alguna conviancion  se dejan los skus
    datosOrdenEditar.elementos.forEach((element) => {
      for (let i = 0; i < productosSelectedList.length; i++) {
        if (
          productosSelectedList[i].categoria == element.categoria &&
          productosSelectedList[i].producto == element.producto &&
          productosSelectedList[i].variacion == element.variacion
        ) {
          if (element?.skus?.length) {
            productosSelectedList[i].skus = element.skus;
          }
        }
      }
    });

    if (isValidData) {
      db.collection("Ventas").doc(idVentaSelected).update({
        elementos: productosSelectedList,
        EstatusPedido,
        cliente,
        TipoVenta,
        condicionesPago,
        empresa,
        comentarios
      });

      createSw({
        title: "Actualizado",
        text: "La orden fue actualizada",
        icon: "success",
      });
      $("#modal-editar").modal("hide");
      nextinputEdit = 1;
      rowEliminadas = [];
    }
  }
};

/**************************************************/
/* MostrarImagen */
// Mostramos la imagen que se seleccionó
const mostrarImagen = (e) => {
  var file = e.files[0];
  var reader = new FileReader();

  reader.onloadend = function () {
    $("#imgFotoVenta").prop("src", reader.result);
  };
  reader.readAsDataURL(file);
};

const subirImagen = () => {
  let foto = $("#fotoVenta")[0].files[0];
  if (foto != undefined && foto != null && foto != "") {
    let pathImg = storage.ref("Ventas/" + numero_orden_ventaImagen);
    let uploadFoto = pathImg.put(foto);

    uploadFoto.on(
      "state_changed",
      (snapshot) => {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        console.log(
          "🚀 ~ file: venta.js ~ line 1282 ~ subirImagen ~ error",
          error
        );
      },
      () => {
        uploadFoto.snapshot.ref.getDownloadURL().then((downloadURL) => {
          db.collection("Ventas")
            .doc(numero_orden_ventaImagenId)
            .update({
              fotoOrdenFirmada: downloadURL,
            })
            .then((response) => {
              $("#imgFotoVenta").prop("src", "");
              $("#modal-subirImagen").modal("hide");
            })
            .catch((error) => {
              //console.log("upd mercancia failed")
              console.log(error);
            });
        });
      }
    );
  }
};

const guardarOrdenEditadaCerrado = () => {
  var condicionesPago = $("#condicionesPago_editarC").val();
  var empresa = $("#empresaList_editarC").val();
  var comentarios = $("#comentariosCerrado").val();

  db.collection("Ventas")
    .doc(idVentaSelected)
    .update({
      condicionesPago,
      empresa,
      comentarios,
    })
    .then(() => {
      createSw({
        title: "Actualizado",
        text: "La orden fue actualizada",
        icon: "success",
      });
      $("#modal-editarCerrado").modal("hide");
    });
};

const getFechaVencimiento = (fechaVenta, condicionesPago) => {
  if (condicionesPago.includes("dias")) {
    const dias = parseInt(condicionesPago.substring(-1, 2));
    return fechaVenta.setDate(fechaVenta.getDate() + dias);
  } else {
    return fechaVenta;
  }
};

const regresarVenta = (numero_orden_venta) => {
  const opcion = confirm(
    "Con esta accion se regresaran todos los elementos del pedido al inventario, continuar?"
  );
  if (opcion) {
    createSw({
      title: "Warning",
      text: `La venta se esta modificando
      No cierre o refresque el navegador hasta que finalice!`,
      icon: "warning",
    });
    logger("Venta", "Regresar Venta", numero_orden_venta, null);

    db.collection("Ventas")
      .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
      .where("delete", "==", false)
      .get()
      .then((response) => {
        let ventaList = [];
        response.forEach((doc) => {
          ventaList.push({ id: doc.id, ...doc.data() });
        });

        const { elementos, id } = ventaList[0];

        Promise.all(
          elementos.map((element) => {
            if (element?.skus?.length) {
              element.skus.forEach((sku) => {
                return db
                  .collection("Mercancia")
                  .where("sku", "==", sku.sku)
                  .get()
                  .then((response) => {
                    let skuList = [];
                    response.forEach((doc) => {
                      skuList.push({ id: doc.id, ...doc.data() });
                    });
                    let skuSelected = skuList[0];
                    const nuevaCantidad_vendida =
                      skuSelected.cantidad_vendida - sku.cantidad;
                    const newCantidad_disponible =
                      skuSelected.cantidad_disponible + sku.cantidad;

                    return db
                      .collection("Mercancia")
                      .doc(skuSelected.id)
                      .update({
                        cantidad_disponible: newCantidad_disponible,
                        cantidad_vendida: nuevaCantidad_vendida,
                        ubicacion:
                          skuSelected.cantidad_comprada == 1
                            ? "Almacen"
                            : skuSelected.ubicacion,
                        sub_ubicacion:
                          skuSelected.cantidad_comprada == 1
                            ? "N/A"
                            : skuSelected.sub_ubicacion,
                            historialMovimientos : skuSelected.historialMovimientos == undefined ? `°${numero_orden_venta}||Regresa Orden:+${sku.cantidad}` : skuSelected.historialMovimientos + ` °${numero_orden_venta}||Regresa Orden:+${sku.cantidad}`
                      })
                      .then(() => {
                        return db.collection("Ventas").doc(id).update({
                          EstatusPedido: "Almacen",
                        });
                      });
                  });
              });
            }
          })
        ).then(() => {
          setTimeout(() => {
            var requestOptions = {
              method: "GET",
              redirect: "follow",
            };
            fetch(window.URLUpdateMercancia, requestOptions)
              .then((response) => response.text())
              .then(() => {
                createSw({
                  title: "Success",
                  text: "La venta fue modificada",
                  icon: "success",
                });
                window.location.reload();
              })
              .catch((error) => console.log("error", error));
          }, 5000);
        });
      });
  }
};

const showAplicarDescuento = (numero_orden_venta) => {
  db.collection("Ventas")
    .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
    .where("delete", "==", false)
    .get()
    .then((response) => {
      let ventaList = [];
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });
      dataAplicarDescuento = ventaList[0];
      const {
        venta_mas_iva,
        TotalVenta,
        iva,
        ComentariosDescuento,
        TotalVentaOriginal,
      } = ventaList[0];

      const txtTotalVentaDescuento = document.getElementById(
        "txtTotalVentaDescuento"
      );
      txtTotalVentaDescuento.value = toCurrencyMXN(TotalVenta);

      const txtIVADescuento = document.getElementById("txtIVADescuento");
      txtIVADescuento.value = toCurrencyMXN(iva);

      const txtTotalVentaMasIva = document.getElementById(
        "txtTotalVentaMasIva"
      );
      txtTotalVentaMasIva.value = toCurrencyMXN(venta_mas_iva);

      const txtMontoPagarDescuento = document.getElementById(
        "txtMontoPagarDescuento"
      );
      const txtComentariosDescuento = document.getElementById(
        "txtComentariosDescuento"
      );
      const txtTotalVentaDescuentoOriginal = document.getElementById(
        "txtTotalVentaDescuentoOriginal"
      );
      txtTotalVentaDescuentoOriginal.value = TotalVentaOriginal
        ? toCurrencyMXN(TotalVentaOriginal)
        : "N/A";
      txtMontoPagarDescuento.value = "";
      txtComentariosDescuento.value = ComentariosDescuento
        ? ComentariosDescuento
        : "";
    });
};

const onAplicarDescuento = () => {
  const txtMontoPagarDescuento = document.getElementById(
    "txtMontoPagarDescuento"
  );
  const txtComentariosDescuento = document.getElementById(
    "txtComentariosDescuento"
  );
  if (!txtMontoPagarDescuento.value) {
    createSw({
      title: "Error",
      text: "Debes ingresar un Monto",
      icon: "error",
    });
    return null;
  }
  if (!txtComentariosDescuento.value) {
    createSw({
      title: "Error",
      text: "Debes ingresar comentarios",
      icon: "error",
    });
    return null;
  }

  const { TipoVenta, id, TotalVenta, tieneDescuento, pago } =
    dataAplicarDescuento;
  const nuevoPrecio = parseFloat(txtMontoPagarDescuento.value);
  const iva = TipoVenta == "Factura" ? nuevoPrecio * 0.16 : 0;
  const venta_mas_iva = iva + nuevoPrecio;

  const objVentaDescuento = {
    iva,
    ComentariosDescuento: txtComentariosDescuento.value,
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
      logger("Venta", "Aplicar Descuento", id, objVentaDescuento);
      createSw({
        title: "Guardado",
        text: "El pedido fue actualizado",
        icon: "success",
      });
      $("#modal-AplicarDescuento").modal("hide");
    });
};

/**
 * Crea una orden con estatus pendiente
 */

const creaOrdenPendiente = () => {
  var cliente = $("#clienteList").val();
  var TipoVenta = $("#tipoVenta").val();
  var condicionesPago = $("#condicionesPago").val();
  var empresaList = $("#empresaList").val();
  var comentarios = $("#txtComentarios").val();

  db.collection("ConfiguracionesGenerales")
    .doc("9vECPN3cIoVqVarSOlNZ")
    .get()
    .then((responseConfig) => {
      let datosConfig = responseConfig.data();
      let ultimoIDventa = parseInt(datosConfig.ultimoIDventa);
      const nuevoIdVenta = ultimoIDventa + 1;
      const fechaVenta = new Date();
      const fechaVencimiento = getFechaVencimiento(fechaVenta, condicionesPago);
      const nuevoPedido = {
        EstatusPago: "Deuda",
        EstatusPedido: "Pendiente",
        TotalVenta: 0,
        cliente,
        elementos: [],
        fechaVenta: new Date(),
        iva: 0,
        numero_orden_venta: nuevoIdVenta,
        pago: 0,
        saldo: 0,
        venta_mas_iva: 0,
        TipoVenta,
        condicionesPago,
        empresa: empresaList,
        delete: false,
        comentarios,
        fechaVencimiento: new Date(fechaVencimiento),
      };
      db.collection("Ventas")
        .add(nuevoPedido)
        .then(() => {
          logger(
            "Venta",
            "Creacion de pedido Pendiente",
            nuevoIdVenta,
            nuevoPedido
          );
          db.collection("ConfiguracionesGenerales")
            .doc("9vECPN3cIoVqVarSOlNZ")
            .update({ ultimoIDventa: nuevoIdVenta });

          createSw({
            title: "Guardado",
            text: "El pedido fue agregado",
            icon: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        });
    });
};


async function verDocumentoFirestore(docId, url) {

  if (url.indexOf("https:") == 0) {
    window.open(url, "_blank")
  } else {
    //Convert storage url to download url
    var starsRef = storage.refFromURL(url);
    var downloadUrl = await starsRef.getDownloadURL();



    //Update url in firestore
    await db.collection("Ventas").doc(docId).update({
      urlNota: downloadUrl
    })

    window.open(downloadUrl, "_blank")

  }
}


//Funcion para cancelar un surtido de ventas de ML y regresar todas los numeros de orden a "Pendiente"
async function cancelarSurtidoVentaML(idVenta) {

  logger("Venta", "Eliminar pedido", idVenta);

  var queryVenta = await db.collection("Ventas").doc(idVenta).get();
  var venta = queryVenta.data();
  var numero_orden_venta = venta.numero_orden_venta;

  var ordenesML = venta.OrderIDMercadoLibre.split(",");

  if(confirm(`¿Deseas cancelar el surtido de la venta ${numero_orden_venta}? \n Se regresaran las ordenes a estatus Pendiente: \n ${ordenesML}`) != 1){
    return null;
  }

  createSw({
    title: "Cancelando Venta",
    text: `La orden ${numero_orden_venta} se esta procesando...
    No cierre ni actualice la pagina`,
  });

  // for(var x in ordenesML){
  //   await db.collection("MLVentas").doc(ordenesML[x]).update({statusEnvio: "Pendiente"})
  // }

  //Se actualiza el estatus de las ventas a "Pendiente" con batch
  var batch = db.batch();
  for(var x in ordenesML){
    batch.update(db.collection("MLVentas").doc(ordenesML[x]), {statusEnvio: "Pendiente"})
  }
  await batch.commit();

  await  db.collection("Ventas").doc(idVenta).update({delete: true,});
  closeAllModals();

}