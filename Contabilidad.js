var db = firebase.firestore();
var storage = firebase.storage();
var listCatalogos = [];

const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Contabilidad", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Contabilidad"
    );
    if (tienePermiso) {
      // Obtenemos las Ventas de firebase
      if (tienePermiso?.opciones?.length) {
        const existEgreso = tienePermiso.opciones.some(
          (opcion) => opcion === "EGRESOS"
        );
        const existIngreso = tienePermiso.opciones.some(
          (opcion) => opcion === "INGRESOS"
        );

        /** Se elegen los campos a rednerizar segun los permisos que tenga el usuario */
        if (existEgreso && existIngreso) {
          db.collection("Contabilidad").onSnapshot((response) => {
            listarRegistro(response);
          });
        } else if (existEgreso) {
          db.collection("Contabilidad")
            .where("tipoMovimiento", "==", "EGRESO")
            .onSnapshot((response) => {
              listarRegistro(response);
            });
        } else if (existIngreso) {
          db.collection("Contabilidad")
            .where("tipoMovimiento", "==", "INGRESO")
            .onSnapshot((response) => {
              listarRegistro(response);
            });
        }
      }
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
  let divTable = document.getElementById("tblContabilidad");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaContabilidad";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">Número de recibo</th>
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
            <th class="align-middle">Número de recibo</th>
            <th class="align-middle">Tipo Movimiento</th>
            <th class="align-middle">Emisor</th>
            <th class="align-middle">Receptor</th>
            <th class="align-middle">Monto</th>
            <th class="align-middle">Modalidad</th>
            <th class="align-middle">Fecha</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Caja</th>
            <th class="align-middle">Acciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      comentarios,
      emisor,
      modalidad,
      monto,
      receptor,
      numeroRecibo,
      fecha,
      tipoMovimiento,
      caja,
    } = datos;

    // Generamos el contenido de la tabla
    contenido += `
    <tr id="${response_data.id}">
                    <td>${numeroRecibo}</td>
                    <td>${tipoMovimiento}</td>
                    <td>${emisor}</td>
                    <td>${receptor}</td>
                    <td>${toCurrencyMXN(monto)}</td>
                    <td>${modalidad}</td>
                    <td>${formatoFecha(fecha)}</td>
                    <td>${comentarios}</td>
                    <td>${caja ? caja : ""}</td>
                    <td> 
                       <button class="btn btn-info" onclick="historialContabilidad('${numeroRecibo}')" title="Historial de Contabilidad" data-toggle="modal" data-target="#modal-Historial"><i class="fas fa-book"></i></button>
                    </td>
                    </tr>
                `;
  });

  contenido += `</tbody></table>`;

  $("#tablaContabilidad").html(contenido);

  var tablaRegistros = $("#tablaContabilidad")
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
          extend: "excel",
          text: "Excel",
          className: "btn-dark",
          exportOptions: {
            columns: [2, 3, 4, 5, 6, 7, 8],
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
            columns: [2, 3, 4, 5, 6, 7, 8],
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
            columns: [2, 3, 4, 5, 6, 7, 8],
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
          targets: [],
          orderable: false,
          searchable: false,
        },
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 0 || i == 1 || i == 2 || i == 3 || i == 4 || i == 5) {
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
        }); // filter
      },
      footerCallback: function () {
        /***
         * Calculo de totales
         */
        let api = this.api();
        let listTiposMovimiento = api.column(1, { page: "current" }).data();
        let listMonto = api.column(4, { page: "current" }).data();

        const listMov = listTiposMovimiento.map((mov, index) => {
          const montoByMov = listMonto[index];
          const objMov = {
            movimientoTipo: mov,
            monto: montoByMov,
          };
          return objMov;
        });

        const intVal = function (i) {
          return typeof i === "string"
            ? i.replace(/[\$,]/g, "") * 1
            : typeof i === "number"
            ? i
            : 0;
        };

        const listEgresosMontos = listMov.filter(
          (mov) => mov.movimientoTipo == "EGRESO"
        );
        const listIngresosMontos = listMov.filter(
          (mov) => mov.movimientoTipo == "INGRESO"
        );

        /**Sumatoria de montos */
        const montoTotalIngresos = listIngresosMontos.reduce(function (a, b) {
          return intVal(a) + intVal(b.monto);
        }, 0);
        const elementoidTotalIngreso =
          document.getElementById("idTotalIngreso");
        elementoidTotalIngreso.textContent = toCurrencyMXN(montoTotalIngresos);

        const montoTotalEgresos = listEgresosMontos.reduce(function (a, b) {
          return intVal(a) + intVal(b.monto);
        }, 0);
        const elementoidTotalEgreso = document.getElementById("idTotalEgreso");
        elementoidTotalEgreso.textContent = toCurrencyMXN(montoTotalEgresos);

        const idTotaBalance = document.getElementById("idTotaBalance");
        idTotaBalance.textContent = toCurrencyMXN(
          montoTotalIngresos - montoTotalEgresos
        );
      },
    })
    .buttons()
    .container()
    .appendTo("#tablaContabilidad_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaContabilidad tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**
 * Funcionalidad del boton de detalle de moviemientos
 * @param {} numeroRecibo
 */
const historialContabilidad = (numeroRecibo) => {
  tblContabilidadHistory.innerHTML = "";
  db.collection("Contabilidad")
    .where("numeroRecibo", "==", parseInt(numeroRecibo))
    .get()
    .then((response) => {
      let contabilidadList = [];
      response.forEach((doc) => {
        contabilidadList.push({ id: doc.id, ...doc.data() });
      });
      const { historial, tipoMovimiento } = contabilidadList[0];
      const tituloHistorial = document.getElementById("tituloHistorial");
      const tblContabilidadHistory = document.getElementById(
        "tblContabilidadHistory"
      );
      /**
       * Renderiza una tabla con el detalle de movimientos
       */
      let tblConetent = "";
      if (tipoMovimiento === "EGRESO") {
        tblConetent = ` <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID Promesa</th>
            <th>Fecha de Pago</th>
            <th>Monto</th>
            <th>Comentarios</th>
            <th>Emisor</th>
            <th>Modalidad</th>
          </tr>
        </thead>
        <tbody>`;
        tituloHistorial.innerText = "Historial de Egresos";
        historial.forEach((movimiento) => {
          tblConetent += `<tr><td>${movimiento.idPromesa}</td>`;
          tblConetent += `<td>${formatoFecha(movimiento.fechaPago)}</td>`;
          tblConetent += `<td>${toCurrencyMXN(movimiento.monto)}</td>`;
          tblConetent += `<td>${movimiento.comentarios}</td>`;
          tblConetent += `<td>${movimiento.emisor}</td>`;
          tblConetent += `<td>${movimiento.modalidad}</td></tr>`;
        });
        tblConetent += ` </tbody></table>`;
      } else {
        tituloHistorial.innerText = "Historial de Ingresos";
        tblConetent = ` <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Numero de Venta</th>
            <th>Fecha de Pago</th>
            <th>Monto</th>
            <th>Comentarios</th>
            <th>Modalidad</th>
            <th>Receptor</th>
          </tr>
        </thead>
        <tbody>`;
        historial.forEach((movimiento) => {
          tblConetent += `<tr><td>${movimiento.numeroVenta}</td>`;
          tblConetent += `<td>${formatoFecha(movimiento.fechaPago)}</td>`;
          tblConetent += `<td>${toCurrencyMXN(movimiento.monto)}</td>`;
          tblConetent += `<td>${movimiento.comentarios}</td>`;
          tblConetent += `<td>${movimiento.modalidad}</td>`;
          tblConetent += `<td>${movimiento.receptor}</td></tr>`;
        });
        tblConetent += ` </tbody></table>`;
      }
      tblContabilidadHistory.innerHTML = tblConetent;
    });
};

/*
 Renderiza las opciones de los selectores
*/
const selectsData = () => {
  let cajasListSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Cajas.forEach((caja) => {
    cajasListSelect += `<option value="${caja}">${caja}</option>`;
    document.getElementById("cajasListEmisora").innerHTML = cajasListSelect;
    document.getElementById("cajasListReceptora").innerHTML = cajasListSelect;
  });
  let tipoModalidadSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Modalidad.forEach((tipoModalidad) => {
    tipoModalidadSelect += `<option value="${tipoModalidad}">${tipoModalidad}</option>`;
    document.getElementById("modalidadTipo").innerHTML = tipoModalidadSelect;
  });
};

const addSelectors = () => {
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
};

const showMovimientoCajas = () => {
  addSelectors();
};

/**
 * Valida que los campos de generar movimiento entre cajas no este vacio
 */
const validateInput = () => {
  const modalidadTipo = document.getElementById("modalidadTipo").value;
  const txtComentarios = document.getElementById("txtComentarios").value;
  const txtMontoPagar = document.getElementById("txtMontoPagar").value;
  const txtFecha = document.getElementById("txtFecha").value;
  const cajasListEmisora = document.getElementById("cajasListEmisora").value;
  const txtEmisor = document.getElementById("txtEmisor").value;
  const cajasListReceptora =
    document.getElementById("cajasListReceptora").value;
  const txtReceptor = document.getElementById("txtReceptor").value;

  if (!txtReceptor) {
    swal({
      title: "Error!",
      text: "Ingrese un receptor",
      icon: "error",
    });
    return false;
  }

  if (!cajasListReceptora) {
    swal({
      title: "Error!",
      text: "Ingrese una caja receptora",
      icon: "error",
    });
    return false;
  }

  if (!cajasListEmisora) {
    swal({
      title: "Error!",
      text: "Ingrese una caja emisora",
      icon: "error",
    });
    return false;
  }

  if (!txtEmisor) {
    swal({
      title: "Error!",
      text: "Ingrese un Emisor",
      icon: "error",
    });
    return false;
  }

  if (!txtFecha) {
    swal({
      title: "Error!",
      text: "Ingrese una fecha",
      icon: "error",
    });
    return false;
  }

  if (!txtComentarios) {
    swal({
      title: "Error!",
      text: "Ingrese una comentario",
      icon: "error",
    });
    return false;
  }
  if (!modalidadTipo) {
    swal({
      title: "Error!",
      text: "Ingrese una modalidad",
      icon: "error",
    });
    return false;
  }

  if (!txtMontoPagar) {
    swal({
      title: "Error!",
      text: "Ingrese un monto a pagar",
      icon: "error",
    });
    return false;
  }
  return true;
};

/**
 * Funcion para registrar movimientos entre cajas generando un INGRESO y un EGRESO
 * @returns 
 */
const movimientoEntreCajas = () => {
  if (!validateInput()) {
    return;
  }
  const modalidad = document.getElementById("modalidadTipo").value;
  const comentarios = document.getElementById("txtComentarios").value;
  const monto = document.getElementById("txtMontoPagar").value;
  const txtFecha = document.getElementById("txtFecha").value;
  const cajasListEmisora = document.getElementById("cajasListEmisora").value;
  const txtEmisor = document.getElementById("txtEmisor").value;
  const cajasListReceptora =
    document.getElementById("cajasListReceptora").value;
  const txtReceptor = document.getElementById("txtReceptor").value;

  db.collection("ConfiguracionesGenerales")
    .doc("9vECPN3cIoVqVarSOlNZ")
    .get()
    .then((responseConfig) => {
      let datosConfig = responseConfig.data();
      let consecutivo = parseInt(datosConfig.ultimoNumeroRecibo);
      const nuevoNumeroRecibo = consecutivo + 1;
      const objContabilidadReceptor = {
        caja: cajasListReceptora,
        comentarios,
        emisor: txtReceptor,
        fecha: new Date(`${txtFecha}T00:00:00`),
        modalidad,
        monto,
        numeroFactura: "N/A",
        numeroRecibo: nuevoNumeroRecibo + 1,
        receptor: txtEmisor,
        tipoMovimiento: "INGRESO",
      };

      const objContabilidadEmisor = {
        caja: cajasListEmisora,
        comentarios,
        emisor: txtEmisor,
        fecha: new Date(`${txtFecha}T00:00:00`),
        modalidad,
        monto,
        numeroFactura: "N/A",
        numeroRecibo: nuevoNumeroRecibo,
        receptor: txtReceptor,
        tipoMovimiento: "EGRESO",
      };

      db.collection("Contabilidad")
        .doc()
        .set(objContabilidadEmisor)
        .then(() => {
          db.collection("Contabilidad")
            .doc()
            .set(objContabilidadReceptor)
            .then(() => {
              db.collection("ConfiguracionesGenerales")
                .doc("9vECPN3cIoVqVarSOlNZ")
                .update({ ultimoNumeroRecibo: nuevoNumeroRecibo + 1 })
                .then(() => {
                  swal({
                    title: "Movimiento Registrado!",
                    text: "Movimiento Registrado",
                    icon: "success",
                  });
                  $("#modal-EntreCajas").modal("hide");
                });
            });
        });
    });
};
