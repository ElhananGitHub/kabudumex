/*
  Instrucciones:
  Los parametros aceptados en las columnas del sheets son:
  -filter: filterSelect, filterText
  -formType: input, select -- default es input
  -required: true, false -- default es false, se utiliza para que sea obligatorio un campo del formulairo
  -inputType: text, number, date  (todos los que existen) -- default es text
  -dataType: date, currency, imageURL, URL (es para mostrarse en la tabla)
  -allowNew: true, default es false. Es para que en los selectores de la opcion de ingresar una opcion que no esta enlistada
  -formtaType: array - (para que desglose la informacion como lista, se tienen que separar los elementos con °)
  -button: "Campos de formulario para aparcer" Para que aparezca un boton que abra el formulario solo con los campos que se establecen en el boton.
  -buttonCondition: "Condicion para success" - En caso que el campo del boton tenga el valor de la conficion aparece en success
  -show: hidden -- default es show
  -send: noSend -- default es send
  -formSource: nombre del source para selector
  -readOnly: true, noForm -- para que el campo no se pueda editar, por default esta en false, en caso se ser noForm entonces no aparece en el formulario
  -edit: para que no se pueda editar y solo se puede agregar uno nuevo, por default es true (si un campo ya es readonly no necesita esto)
  -cellFormula: ture -- default false. Se utiliza para indicar que es una formula en la columna y el sistema copia el R1C1 de la primera fila
  -arrayFormula: true -- default false. Se utiliza para indicar que existe una formla array al principio de la columna y no inserte datos en esa celda

  Query:
  En el query existe un filter que donde se pone el sintaxis como SQL, los nombres de las columnas son su letra en Sheets
*/

var db = firebase.firestore();
var storage = firebase.storage();

const uid = JSON.parse(sessionStorage.user).uid;

db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("MercadoLibre Inventario", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "MercadoLibre Inventario"
    );
    if (tienePermiso) {
      db.collection("MLDesglosePublicaciones")
      .where("estatusPublicacion", "in", ["active", "under_review"])
      .onSnapshot((response) => {
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
  
db.collection("ConfiguracionesGenerales")
  .doc("MLActualizaciones")
  .onSnapshot((response) => {
    let dato = response.data();

    let fechaActualizacionML = dato.publicaciones.actualizacion;

    $("#ultimaActualizacion").html('Última actualización: ' + formatoFechaHorario(fechaActualizacionML));
  });

db.collection("ConfiguracionesGenerales")
.doc("MLpublicacionesSinSku")
.onSnapshot((response) => {
  let dato = response.data();
  //console.log(dato);

  localStorage.setItem("MLpublicacionesSinSku", JSON.stringify(dato.publicacionesSinSku));

});
/*
db.collection("MLDesglosePublicaciones").onSnapshot((response) => {
  listarRegistro(response);
});
*/

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase

const listarRegistro = (response, cantidad = 10) => {
  console.log("listarRegistro");
  //console.log(response)

  let divTable = document.getElementById("divTabla");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaPublicacionesML";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead" id="row_pub" style="width:100px;">ID Publicación</th>
            <th class="filterhead" id="row_tit" style="width:100px">Item</th>
            <th class="filterhead">SKU</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">Variaciones</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">Estatus</th>
            <th class="filterhead">Full ID</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle">#</th>
            <th class="align-middle">Imagen</th>
            <th class="align-middle">ID Publicación</th>
            <th class="align-middle">Item</th>
            <th class="align-middle">SKU</th>
            <th class="align-middle">Fecha</th>
            <th class="align-middle">Actualización</th>
            <th class="align-middle">Variaciones</th>
            <th class="align-middle">Precio</th>
            <th class="align-middle">Cantidad Inicial</th>
            <th class="align-middle">Venta</th>
            <th class="align-middle">Disponible</th>
            <th class="align-middle">Salud</th>
            <th class="align-middle">Estatus</th>
            <th class="align-middle">Full ID</th>
            <th class="align-middle">Total Full</th>
            <th class="align-middle">Disponible</th>
            <th class="align-middle">No Disponible</th>
            <th class="align-middle">Motivo</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  var arrSinSKU = JSON.parse(localStorage.getItem("MLpublicacionesSinSku")) || [];

  var contadorSinSKU = 0;
  i = 1;
  response.forEach((response_data) => {
    //console.log(response_data.data());

    let datos = response_data.data();

    // Imagen
    let imagen = '';
    let publicacionID = datos.idPublicacion.slice(3);
    if (datos.imagenPublicacion != undefined) {
      imagen = `<a href="https://articulo.mercadolibre.com.mx/MLM-${publicacionID}" target="_blank"><img src="${datos.imagenPublicacion}" class="img_fluid border-1" width="100"></a>`;
    } else {
      imagen = `<a href="https://articulo.mercadolibre.com.mx/MLM-${publicacionID}" target="_blank"><img src="${datos.imagenVariacion}" class="img_fluid border-1" width="100"></a>`;
    }

    // ID publicación
    let id_publicacion = '';
    if (datos.idPublicacion) {
      id_publicacion = `${datos.idPublicacion}`;
    }

    // Titulo publicación
    let titulo_publicacion = '';
    if (datos.tituloPublicacion) { // solo para validar, ya que existe el titulo tanto en la publicación general, como en la variación
      titulo_publicacion = datos.tituloPublicacion;
    } else {
      titulo_publicacion = datos.tituloPublicacion;
    }

    // Fecha publicación
    let sku = '';
    if (datos.skuPublicacion != undefined || datos.skuPublicacion != null) {
      sku = datos.skuPublicacion;
    } else {
      sku = datos.skuVariacion;
    }

    // Fecha publicación
    let fecha_publicacion = ''
    if (datos.fechaPublicacion) {
      fecha_publicacion = datos.fechaPublicacion;
    } else {
      fecha_publicacion = datos.fechaPublicacion;
    }
    // Fecha actualización
    let fecha_actualizacion = '';
    if (datos.fechaActualizacion) {
      fecha_actualizacion = datos.fechaActualizacion;
    } else {
      fecha_actualizacion = datos.fechaActualizacion;
    }

    // Variación publicación
    let variacion_publicacion = '';
    if (datos.variacionesPublicacion) {
      variacion_publicacion = datos.variacionesPublicacion;
    } else {
      variacion_publicacion = datos.variacionesPublicacionString;
    }

    // Precio publicacion
    let precio_publicacion = '';
    if (datos.precioPublicacion) {
      precio_publicacion = datos.precioPublicacion;
    } else {
      precio_publicacion = datos.precioVariacion;
    }

    // Cantidad Inicial
    let cantidad_inicial = '';
    if (datos.cantidadInicial) {
      cantidad_inicial = datos.cantidadInicial;
    }

    // Cantidad vendida
    let cantidad_vendida = '';
    if (datos.precioPublicacion) {
      cantidad_vendida = datos.cantidadVendida;
    } else {
      cantidad_vendida = datos.vendidosVariacion;
    }

    // Cantidad disponible
    let cantidad_disponible = '';
    if (datos.precioPublicacion) {
      cantidad_disponible = datos.cantidadDisponible;
    } else {
      cantidad_disponible = datos.disponiblesVariacion;
    }

    // Salud publicación
    let salud_publicacion = '';
    if (datos.saludPublicacion) {
      salud_publicacion = datos.saludPublicacion;
    } else {
      salud_publicacion = datos.saludPublicacion;
    }

    // Estatus publicación
    let estatus_publicacion = '';
    if (datos.saludPublicacion) {
      estatus_publicacion = datos.estatusPublicacion;
    } else {
      estatus_publicacion = datos.estatusPublicacion;
    }

    // Full ID
    let full_id = '';
    if (datos.fullInventoryId) {
      if (datos.fullInventoryId != undefined || datos.fullInventoryId != null) {
        full_id = datos.fullInventoryId;
      } else {
        full_id = '';
      }
    } else {
      if (datos.fullInventoryIdVariacion != undefined || datos.fullInventoryIdVariacion != null) {
        full_id = datos.idVariacion + '-' + datos.fullInventoryIdVariacion;
      } else {
        full_id = '';
      }
    }

    // Full total
    let existe_full_total = 0;
    let full_total = '';
    if (datos.fullTotal != undefined) {
      full_total = datos.fullTotal;
      existe_full_total = 1
    }
    if (existe_full_total == 0) {
      if (datos.fullTotalVariacion) {
        full_total = datos.fullTotalVariacion;
      }
    }

    // Full disponible
    let existe_full_disponible = 0;
    let full_disponible = '';
    if (datos.fullDisponible != undefined) {
      full_disponible = datos.fullDisponible;
      existe_full_disponible = 1
    }
    if (existe_full_disponible == 0) {
      if (datos.fullDisponibleVariacion != undefined || datos.fullDisponibleVariacion != "") {
        full_disponible = datos.fullDisponibleVariacion;
      }
    }

    // Full no disponible
    let existe_full_no_disponible = 0;
    let full_no_disponible = '';
    if (datos.fullNoDisponible != undefined) {
      full_no_disponible = datos.fullNoDisponible;
      existe_full_no_disponible = 1;
    }
    if (existe_full_no_disponible == 0) {
      if (datos.fullNoDisponibleVariacion != undefined || datos.fullNoDisponibleVariacion != "") {
        full_no_disponible = datos.fullNoDisponibleVariacion;
      }
    }

    // Motivo
    let existe_motivo = 0;
    let motivo = '';
    if (datos.fullResumenNoDisponible != undefined) {
      motivo = datos.fullResumenNoDisponible;
      existe_motivo = 1;
    }
    if (existe_motivo == 0) {
      if (datos.fullResumenNoDisponibleVariacion != undefined || datos.fullResumenNoDisponibleVariacion != "") {
        motivo = datos.fullResumenNoDisponibleVariacion;
      }
    }

    let class_filter = "";
    
    var existingSinSku = arrSinSKU.find(item => item.idPublicacion === id_publicacion && item.variacionesPublicacionString === variacion_publicacion);

    if (existingSinSku) {
      class_filter = "sin_sku";

      existingSinSku.fechaActualizacion = fecha_actualizacion;
      contadorSinSKU++;
    }

    localStorage.setItem("MLpublicacionesSinSku", JSON.stringify(arrSinSKU));


    // Generamos el contenido de la tabla
    contenido += `
        <tr id="${response_data.id}" class="${class_filter}">
            <td>${i}</td>
            <td>${imagen}</td>
            <td>${id_publicacion}</td>
            <td class="text-overflow: ellipsis;">${titulo_publicacion}</td>
            <td>${sku}</td>
            <td>${fecha_publicacion}</td>
            <td>${fecha_actualizacion}</td>
            <td>${variacion_publicacion}</td>
            <td>${toCurrencyMXN(precio_publicacion)}</td>
            <td>${cantidad_inicial}</td>
            <td>${cantidad_vendida}</td>
            <td>${cantidad_disponible}</td>
            <td>${salud_publicacion}</td>
            <td>${estatus_publicacion}</td>
            <td>${full_id}</td>
            <td>${full_total}</td>
            <td>${full_disponible}</td>
            <td>${full_no_disponible}</td>
            <td>${motivo}</td>
        </tr>
        `;
    i++;

  });

  contenido += "</tbody></table>";

  $("#tablaPublicacionesML").html(contenido);
  $("#btn-filter-sin-sku").html('Publicaciones sin SKU ('+contadorSinSKU+')');


  var tablaRegistros = $("#tablaPublicacionesML")
    .DataTable({
      dom: "Bfrtip",
      responsive: true,
      lengthChange: false,
      autoWidth: false,
      scrollX: false,
      stateSave: false,
      pageLength: cantidad,
      buttons: [
        "pageLength",
        {
          extend: "excel",
          text: "Excel",
          title: "Excel Publicaciones",
          className: "btn-dark",
          /*exportOptions: {
            columns: [2, 3, 4, 5],
          },*/
        },
        {
          extend: "pdf",
          text: "PDF",
          title: "PDF Publicaciones",
          className: "btn-dark",
          /*exportOptions: {
            columns: [2, 3, 4, 5],
          },*/
        },
        {
          extend: "print",
          text: "Imprimir",
          title: "Imprimir",
          className: "btn-dark",
          pageSize: "A4",
          orientation: "landscape", // landscape | portrait
          /*exportOptions: {
            columns: [2, 3, 4, 5],
          },*/
        },
        {
          extend: "colvis",
          text: "Columnas",
          className: "btn-dark",
        },
      ],
      // ajustar tamaño de la columna
      columnDefs: [
        {
          width: "5%",
          targets: [2, 3]
        },
        {
          id: "row_pub",
          targets: [2]
        },
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 2 || i == 3 || i == 4 || i == 7 || i == 13 || i == 14) {
            var column = api.column(i);
            var select = $('<select class="select2"><option value=""></option></select>')
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
        }); // filter
        
        $('.select2').select2();

        /*
        // Funcion para filtrar por el class_name
        $('#btn-filter').on('click', function () {
          console.log('btn-filter');
          $.fn.dataTable.ext.search.push(
            function (settings, data, dataIndex) {
              return $(api.row(dataIndex).node()).hasClass('sin_sku');
            }
          );
          api.draw();
        });

        // Funcion para filtrar limpiar los filtros
        $('#btn-clear').on('click', function () {
          console.log('btn-clear');
          $.fn.dataTable.ext.search.pop();
          api.draw();
        });

        */

      }, // init
    })
    .buttons()
    .container()
    .appendTo("#tablaPublicacionesML_wrapper .col-md-6:eq(0)");



}

$(document).ready(function () {
  $("#tablaPublicacionesML tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
    $('.select2').select2();
  });
});

const publicacionesSinSKU = () => {
  //console.log('publicacionesSinSKUsu');

  let divTable = document.getElementById("resultSinSkus");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaPublicacionesSinSkus";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Titulo Publicación</th>
            <th class="align-middle">Variacion</th>
            <th class="align-middle">ID Publicación</th>
            <th class="align-middle">ID Variación</th>
            <th class="align-middle">Fecha Actualización</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  var arrSinSKU = JSON.parse(localStorage.getItem("MLpublicacionesSinSku")) || [];

  arrSinSKU.forEach((response_data) => {

    // Generamos el contenido de la tabla
    contenido += `
        <tr>
            <td><a href="${response_data.linkPublicacion}" target="_blank">${response_data.tituloPublicacion}</a></td>
            <td>${response_data.variacionesPublicacionString}</td>
            <td>${response_data.idPublicacion}</td>
            <td>${response_data.idVariacion}</td>
            <td>${response_data.fechaActualizacion}</td>
        </tr>
        `;

  });

  contenido += "</tbody></table>";

  $("#tablaPublicacionesSinSkus").html(contenido);

  $("#modal-sin-sku").modal('show');

}