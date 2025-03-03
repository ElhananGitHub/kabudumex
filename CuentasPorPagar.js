var db = firebase.firestore();
var storage = firebase.storage();
var listCatalogos = [];
let cuentaDataActual = {};
let originalNumeroRecibo = 0;
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Cuentas Por Pagar", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Cuentas Por Pagar"
    );
    if (tienePermiso) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);

      db.collection("CuentasPagar")
        .where("fecha", "<", endDate)
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

const toCurrencyMXN = (monto) =>
  Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    monto
  );

const formatoFecha = (fechaVenta) => {
  const dt = new Date(fechaVenta.seconds * 1000);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFecha2 = (fechaVenta) => {
  const dt = new Date(fechaVenta.seconds * 1000);
  return `${dt.getFullYear().toString().padStart(4, "0")}-${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFechaNow = () => {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const convertDate = (date) => {
  let yyyy = date.getFullYear().toString();
  let mm = (date.getMonth() + 1).toString();
  let dd = date.getDate().toString();
  let mmChars = mm.split("");
  let ddChars = dd.split("");
  return (
    yyyy +
    "-" +
    (mmChars[1] ? mm : "0" + mmChars[0]) +
    "-" +
    (ddChars[1] ? dd : "0" + ddChars[0])
  );
};
/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, saldoFiltro = 0, cantidad = 10) => {
  let divTable = document.getElementById("tblCuentasPagar");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaCuentasPagar";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">ID Promesa</th>
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
            <th class="filterhead">&nbsp;</th>
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle">ID Promesa</th>
            <th class="align-middle">ID Egreso</th>
            <th class="align-middle">Receptor</th>
            <th class="align-middle">Fecha de pago</th>
            <th class="align-middle">Empresa</th>
            <th class="align-middle">Estatus</th>
            <th class="align-middle">Divisa</th>
            <th class="align-middle">Monto</th>
            <th class="align-middle">Pago</th>
            <th class="align-middle">Saldo</th>
            <th class="align-middle">Asignado</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Concepto</th>
            <th class="align-middle">Descripcion</th>
            <th class="align-middle">Modalidad</th>
            <th class="align-middle">Numero de Factura</th>
            <th class="align-middle">ID Recibos</th>
            <th class="align-middle">Alerta</th>
            <th class="align-middle">Acciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      idPromesa,
      idEgreso,
      receptor,
      fecha,
      empresa,
      iva,
      estatus,
      monto,
      divisa,
      pago,
      saldo,
      asignado,
      comentarios,
      concepto,
      descripcion,
      modalidad,
      numeroFactura,
      listIdRecibos,
    } = datos;

    let alerta = "";
    let classAlert = "";
    const hoyDate = new Date();
    if (saldo > 0) {
      if (hoyDate.getTime() > Date.parse(formatoFecha(fecha))) {
        alerta = "Vencido";
        classAlert = "btn btn-danger";
      } else {
        alerta = "En Tiempo";
        classAlert = "btn btn-success";
      }
    }
    const listadoRecibos = (listIdRecibos) => {
      if (listIdRecibos?.length) {
        return listIdRecibos
          .map((rec) =>
            rec.idNumeroRecibo
              ? `<li>${rec.idNumeroRecibo}: <b>${toCurrencyMXN(
                  rec.monto
                )}</b></li>`
              : `<li>${rec}`
          )
          .join("");
      } else {
        return "&nbsp;";
      }
    };
    if (saldo > saldoFiltro) {
      // Generamos el contenido de la tabla
      contenido += `
                <tr id="${response_data.id}">
                    <td>${idPromesa}</td>
                    <td>${idEgreso}</td>
                    <td>${receptor}</td>
                    <td>${formatoFecha(fecha)}</td>
                    <td>${empresa}</td>
                    <td>${estatus}</td>
                    <td>${divisa}</td>
                    <td>${toCurrencyMXN(monto)}</td>
                    <td>${toCurrencyMXN(pago)}</td>
                    <td>${toCurrencyMXN(saldo)}</td>
                    <td>${asignado}</td>
                    <td>${comentarios ?? ""}</td>
                    <td>${concepto}</td>
                    <td>${descripcion}</td>
                    <td>${modalidad}</td>
                    <td>${numeroFactura ?? ""}</td>
                    <td>${listadoRecibos(listIdRecibos) ?? ""}</td>
                    <td><div class="${classAlert}">${alerta ?? ""}</div></td>
                    
                    <td>
                   <button class="btn btn-info" title="Realizar Acciones" onclick="realizarAcciones('${idPromesa}','${
        response_data.id
      }')" data-toggle="modal"  data-target="#modal-acciones">Accion</button>
                    </td>
                </tr>
                `;
    }
  });

  contenido += `</tbody>
                </table>`;

  $("#tablaCuentasPagar").html(contenido);

  var tablaRegistros = $("#tablaCuentasPagar")
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
            columns: [0, 1, 2, 3, 4, 5, 6, 7],
          },
        },
        {
          extend: "pdfHtml5",
          text: "PDF",
          header: true,
          title: "PDF",
          duplicate: true,
          className: "btn-dark",
          pageOrientation: "landscape",
          pageSize: "A4",
          pageMargins: [5, 5, 5, 5],
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
            columns: [2, 3, 4, 5, 6, 7, 8],
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
          visble: true,
        },
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        $(".filterhead", api.table().footer()).each(function (i) {
          if ((i !== 18) & (i !== 16)) {
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
                if (d) {
                  select.append('<option value="' + d + '">' + d + "</option>");
                }
              });
          }
        });
      },
      footerCallback: function () {
        let api = this.api();
        const calcTotal = (columNumber) =>
          api
            .column(columNumber, { page: "current" })
            .data()
            .reduce(function (a, b) {
              return intVal(a) + intVal(b);
            }, 0);

        // Remove the formatting to get integer data for summation
        const intVal = function (i) {
          return typeof i === "string"
            ? i.replace(/[\$,]/g, "") * 1
            : typeof i === "number"
            ? i
            : 0;
        };

        const pageMontoTotal = calcTotal(7);
        const idMontoTotal = document.getElementById("idMontoTotal");
        idMontoTotal.textContent = `${toCurrencyMXN(pageMontoTotal)}`;

        const pageTotalPago = calcTotal(8);
        const idTotalPago = document.getElementById("idTotalPago");
        idTotalPago.textContent = `${toCurrencyMXN(pageTotalPago)}`;

        const pageSaldoTotal = calcTotal(9);
        const idSaldoTotal = document.getElementById("idSaldoTotal");
        idSaldoTotal.textContent = `${toCurrencyMXN(pageSaldoTotal)}`;
      },
    })
    .buttons()
    .container()
    .appendTo("#tablaCuentasPagar_wrapper .col-md-6:eq(0)");
  let cardTotales = document.getElementById("cardTotales");
  cardTotales.style = "";
};

$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaCuentasPagar tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

const addSelectors = () => {
  if (!listCatalogos.length) {
    db.collection("ConfiguracionesGenerales")
      .doc("catalogoSelectores")
      .get()
      .then((response) => {
        listCatalogos = response.data();
        db.collection("ConfiguracionesGenerales")
          .doc("catalogoSelectoresLectura")
          .get()
          .then((response2) => {
            const objtLectura = response2.data();
            listCatalogos = { ...listCatalogos, objtLectura };
            selectsData();
          });
      });
  } else {
    selectsData();
  }
};

const selectsData = () => {
  let tipoaccionesSelect = `<option value="">seleccionar</option>`;
  listCatalogos?.objtLectura?.AccionesCuentasPagar?.forEach((tipoaccion) => {
    tipoaccionesSelect += `<option value="${tipoaccion}">${tipoaccion}</option>`;
    document.getElementById("accionesSelect").innerHTML = tipoaccionesSelect;
  });

  let tipoModalidadSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Modalidad.forEach((tipoModalidad) => {
    tipoModalidadSelect += `<option value="${tipoModalidad}">${tipoModalidad}</option>`;
    document.getElementById("modalidadTipo").innerHTML = tipoModalidadSelect;
  });

  let empresaSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Empresa.forEach((Empresa) => {
    empresaSelect += `<option value="${Empresa}">${Empresa}</option>`;
    document.getElementById("empresaSelectAction").innerHTML = empresaSelect;
  });

  let cajasListSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Cajas.forEach((caja) => {
    cajasListSelect += `<option value="${caja}">${caja}</option>`;
    document.getElementById("cajasList").innerHTML = cajasListSelect;
  });
};

const realizarAcciones = (idPromesa, id) => {
  defaultActions();
  db.collection("CuentasPagar")
    .doc(id)
    .get()
    .then((response) => {
      const idPromesaAccion = document.getElementById("idPromesaAccion");
      const txtSaldoPendiente = document.getElementById("txtSaldoPendiente");
      const txtDivisa = document.getElementById("txtDivisa");
      idPromesaAccion.value = idPromesa;
      let datos = response.data();
      cuentaDataActual = datos;
      cuentaDataActual.id = id;
      txtSaldoPendiente.value = toCurrencyMXN(cuentaDataActual.saldo);
      txtDivisa.value = cuentaDataActual.divisa;
      addSelectors();
    });
};

const onchangeAccionTipo = () => {
  defaultActions();
  const accionesSelect = document.getElementById("accionesSelect");
  const divMontoAccion = document.getElementById("divMontoAccion");
  const txtMontoPagar = document.getElementById("txtMontoPagar");
  const divFecha = document.getElementById("divFecha");
  const divFechaPago = document.getElementById("divFechaPago");
  const divModalidad = document.getElementById("divModalidad");
  const divEmpresa = document.getElementById("divEmpresa");
  const fechaInicioAction = document.getElementById("fechaInicioAction");
  const fechaInicio = formatoFecha2(cuentaDataActual.fecha);
  const divNumeroFactura = document.getElementById("divNumeroFactura");
  const divReciboAccion = document.getElementById("divReciboAccion");

  switch (accionesSelect.value) {
    case "Realizar Pago":
      divMontoAccion.style = "";
      txtMontoPagar.disabled = false;
      txtMontoPagar.placeholder = 0;
      txtMontoPagar.setAttribute("type", "number");
      divFecha.style = "display: none";
      fechaInicioAction.value = fechaInicio;
      divFechaPago.style = "";
      break;
    case "Liquidacion con descuento":
      divMontoAccion.style = "";
      txtMontoPagar.disabled = false;
      txtMontoPagar.placeholder = 0;
      txtMontoPagar.setAttribute("type", "number");
      divFechaPago.style = "";
      break;
    case "Posponer":
      divFecha.style = "";
      divNumeroFactura.style = "display: none";
      divModalidad.style = "display: none";
      divEmpresa.style = "display: none";
      divReciboAccion.style = "display: none";
      fechaInicioAction.value = fechaInicio;
      break;
    case "Cancelada":
      divNumeroFactura.style = "display: none";
      divModalidad.style = "display: none";
      divEmpresa.style = "display: none";
      divReciboAccion.style = "display: none";
      break;
    default:
      break;
  }
};
const defaultActions = () => {
  const txtMontoPagar = document.getElementById("txtMontoPagar");
  const txtComentarios = document.getElementById("txtComentarios");
  txtComentarios.value = cuentaDataActual.comentarios ?? "";
  const divMontoAccion = document.getElementById("divMontoAccion");
  const divFecha = document.getElementById("divFecha");
  const divFechaPago = document.getElementById("divFechaPago");
  const divReciboAccion = document.getElementById("divReciboAccion");
  const divModalidad = document.getElementById("divModalidad");
  const divEmpresa = document.getElementById("divEmpresa");
  const divNumeroFactura = document.getElementById("divNumeroFactura");
  const idReciboAccion = document.getElementById("idReciboAccion");

  divReciboAccion.style = "";
  divModalidad.style = "";
  divEmpresa.style = "";
  divNumeroFactura.style = "";
  divFecha.style = "display: none";
  divFechaPago.style = "display: none";
  divMontoAccion.style = "display: none";
  txtMontoPagar.disabled = true;
  txtMontoPagar.setAttribute("type", "text");

  db.collection("ConfiguracionesGenerales")
    .doc("9vECPN3cIoVqVarSOlNZ")
    .get()
    .then((responseConfig) => {
      let datosConfig = responseConfig.data();
      let consecutivo = parseInt(datosConfig.ultimoNumeroRecibo);
      originalNumeroRecibo = consecutivo + 1;
      idReciboAccion.value = originalNumeroRecibo;
      idReciboAccion.setAttribute(
        "oninput",
        `this.value = this.value > ${originalNumeroRecibo} ? ${originalNumeroRecibo} : Math.abs(this.value)`
      );
    });
};

const guardarAccion = () => {
  const accionesSelect = document.getElementById("accionesSelect");
  switch (accionesSelect.value) {
    case "Realizar Pago":
      liquidacionParcial();
      break;
    case "Liquidacion con descuento":
      liquidacionDescuento();
      break;
    case "Posponer":
      posponerPagoPromesa();
      break;
    case "Cancelada":
      cancelarPagoPromesa();
      break;
    default:
      break;
  }
};

const liquidacionTotal = () => {
  const comentarios = document.getElementById("txtComentarios").value;
  const empresa = document.getElementById("empresaSelectAction").value;
  const numeroFactura = document.getElementById("txtNumeroFactura").value;
  const pago = cuentaDataActual.pago + cuentaDataActual.saldo;
  const idReciboAccion = document.getElementById("idReciboAccion").value;
  const listIdRecibos = obtieneListaRecibos(
    idReciboAccion,
    cuentaDataActual.saldo
  );

  db.collection("CuentasPagar")
    .doc(cuentaDataActual.id)
    .update({
      comentarios,
      saldo: 0,
      pago,
      estatus: "Liquidacion Total",
      empresa,
      numeroFactura,
      listIdRecibos,
    })
    .then(() => {
      generaEgresoContabilidad(cuentaDataActual.saldo);
      swal({
        title: "Guardado!",
        text: "La promesa de pago fue actualizada",
        icon: "success",
      });
      $("#modal-acciones").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: CuentasPagar.js ~ line 354 ~ liquidacionTotal ~ error",
        error
      );
    });
};

const liquidacionParcial = () => {
  const txtMontoPagar = document.getElementById("txtMontoPagar");
  const comentarios = document.getElementById("txtComentarios").value;
  const empresa = document.getElementById("empresaSelectAction").value;
  const numeroFactura = document.getElementById("txtNumeroFactura").value;
  const divisa = document.getElementById("txtDivisa").value;
  if (txtMontoPagar) {
    const montoPagar = parseFloat(txtMontoPagar.value);
    const pago = cuentaDataActual.pago + montoPagar;
    const saldo = cuentaDataActual.monto - pago;
    const estatus = saldo === 0 ? "PAGADO" : "Liquidacion Parcial";
    const idReciboAccion = document.getElementById("idReciboAccion").value;
    const listIdRecibos = obtieneListaRecibos(idReciboAccion, montoPagar);
    const objPago = {
      pago,
      saldo,
      estatus,
      comentarios,
      empresa,
      numeroFactura,
      listIdRecibos,
      divisa
    };
    logger("Cuentas Por Pagar", "Pago", cuentaDataActual.id, objPago);
    db.collection("CuentasPagar")
      .doc(cuentaDataActual.id)
      .update(objPago)
      .then(() => {
        generaEgresoContabilidad(montoPagar);
        swal({
          title: "Guardado!",
          text: "La promesa de pago fue actualizada",
          icon: "success",
        });
        $("#modal-acciones").modal("hide");
      })
      .catch((error) => {
        console.log(
          "🚀 ~ file: CuentasPorPagar.js ~ line 594 ~ liquidacionParcial ~ error",
          error
        );
      });
  }
};

const liquidacionDescuento = () => {
  const txtMontoPagar = document.getElementById("txtMontoPagar");
  const comentarios = document.getElementById("txtComentarios").value;
  const empresa = document.getElementById("empresaSelectAction").value;
  const numeroFactura = document.getElementById("txtNumeroFactura").value;
  const divisa = document.getElementById("txtDivisa").value;
  if (txtMontoPagar) {
    const montoPagar = parseFloat(txtMontoPagar.value);
    const pago = cuentaDataActual.pago + montoPagar;
    const idReciboAccion = document.getElementById("idReciboAccion").value;
    const listIdRecibos = obtieneListaRecibos(idReciboAccion, montoPagar);
    const objPago = {
      saldo: 0,
      pago,
      estatus: "Liquidacion con descuento",
      comentarios,
      empresa,
      numeroFactura,
      listIdRecibos,
      divisa
    };
    logger("Cuentas Por Pagar", "Pago", cuentaDataActual.id, objPago);
    db.collection("CuentasPagar")
      .doc(cuentaDataActual.id)
      .update(objPago)
      .then(() => {
        generaEgresoContabilidad(montoPagar);
        swal({
          title: "Guardado!",
          text: "La promesa de pago fue actualizada",
          icon: "success",
        });
        $("#modal-acciones").modal("hide");
      })
      .catch((error) => {
        console.log(
          "🚀 ~ file: CuentasPorPagar.js ~ line 631 ~ liquidacionDescuento ~ error",
          error
        );
      });
  }
};

const posponerPagoPromesa = () => {
  const fechaInicioAction = document.getElementById("fechaInicioAction").value;
  const comentarios = document.getElementById("txtComentarios").value;
  const nuevaFecha = new Date(fechaInicioAction);
  nuevaFecha.setDate(nuevaFecha.getDate() + 1);
  db.collection("CuentasPagar")
    .doc(cuentaDataActual.id)
    .update({
      comentarios,
      fecha: nuevaFecha,
    })
    .then(() => {
      swal({
        title: "Guardado!",
        text: "La promesa de pago fue actualizada",
        icon: "success",
      });
      $("#modal-acciones").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: CuentasPorPagar.js ~ line 414 ~ posponerPagoPromesa ~ error",
        error
      );
    });
};

const cancelarPagoPromesa = () => {
  const comentarios = document.getElementById("txtComentarios").value;
  db.collection("CuentasPagar")
    .doc(cuentaDataActual.id)
    .update({
      estatus: "CANCELADO",
      saldo: 0,
      comentarios,
    })
    .then(() => {
      swal({
        title: "Guardado!",
        text: "La promesa de pago fue Cancelada",
        icon: "success",
      });
      $("#modal-acciones").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: CuentasPorPagar.js ~ line 442 ~ cancelarPagoPromesa ~ error",
        error
      );
    });
};

const generaEgresoContabilidad = (pago) => {
  const modalidadTipo = document.getElementById("modalidadTipo");
  const empresa = document.getElementById("empresaSelectAction").value;
  const numeroFactura = document.getElementById("txtNumeroFactura").value;
  const idReciboAccion = document.getElementById("idReciboAccion").value;
  const idReciboEscrito = parseInt(idReciboAccion);
  const isNewRecibo = idReciboEscrito >= originalNumeroRecibo;
  const comentarios = document.getElementById("txtComentarios").value;
  const fechaPagoAction = document.getElementById("fechaPagoAction").value;
  const fechaPago = new Date(fechaPagoAction);
  const caja = document.getElementById("cajasList").value;

  if (isNewRecibo) {
    db.collection("ConfiguracionesGenerales")
      .doc("9vECPN3cIoVqVarSOlNZ")
      .get()
      .then((responseConfig) => {
        let datosConfig = responseConfig.data();
        let consecutivo = parseInt(datosConfig.ultimoNumeroRecibo);
        const nuevoNumeroRecibo = consecutivo + 1;

        db.collection("Contabilidad")
          .doc()
          .set({
            caja,
            numeroFactura,
            comentarios,
            tipoMovimiento: "EGRESO",
            emisor: empresa,
            fecha: new Date(),
            modalidad: modalidadTipo.value,
            receptor: cuentaDataActual.receptor,
            numeroRecibo: nuevoNumeroRecibo,
            monto: pago,
            historial: [
              {
                monto: pago,
                idPromesa: parseInt(cuentaDataActual.idPromesa),
                comentarios,
                emisor: empresa,
                modalidad: modalidadTipo.value,
                fechaPago,
              },
            ],
          })
          .then(() => {
            db.collection("ConfiguracionesGenerales")
              .doc("9vECPN3cIoVqVarSOlNZ")
              .update({ ultimoNumeroRecibo: nuevoNumeroRecibo })
              .then(() => {
                const idReciboAccion =
                  document.getElementById("idReciboAccion");
                idReciboAccion.value = nuevoNumeroRecibo;
              });
          })
          .catch((error) => {
            console.log(
              "🚀 ~ file: CuentasPorPagar.js ~ line 516 ~ .then ~ error",
              error
            );
          });
      });
  } else {
    let ingresosLista = [];
    db.collection("Contabilidad")
      .where("numeroRecibo", "==", idReciboEscrito)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          ingresosLista.push({ id: doc.id, ...doc.data() });
        });
        let { historial, monto, id } = ingresosLista[0];
        if (historial?.length) {
          historial.push({
            monto: pago,
            idPromesa: parseInt(cuentaDataActual.idPromesa),
            comentarios,
            emisor: empresa,
            modalidad: modalidadTipo.value,
            fechaPago,
          });
        }
        monto += pago;
        db.collection("Contabilidad")
          .doc(id)
          .update({
            monto,
            historial,
            comentarios,
            emisor: empresa,
            modalidad: modalidadTipo.value,
            caja,
          })
          //Esto esta comentado porque cuando no es un recibo nuevo no se necesita actualizar el ultimo numero de recibo
          // .then(() => {
          //   db.collection("ConfiguracionesGenerales")
          //     .doc("9vECPN3cIoVqVarSOlNZ")
          //     .update({ ultimoNumeroRecibo: idReciboEscrito })
          //     .then(() => {
          //       const idReciboAccion =
          //         document.getElementById("idReciboAccion");
          //       idReciboAccion.value = idReciboEscrito;
          //     });
          // });
      });
  }
};

const obtieneListaRecibos = (idReciboAccion, montoPagar) => {
  let listIdRecibos = [];
  if (cuentaDataActual?.listIdRecibos?.length) {
    const idReciboExist = cuentaDataActual?.listIdRecibos.some(
      (recibo) => recibo.idNumeroRecibo === parseInt(idReciboAccion)
    );
    if (!idReciboExist) {
      cuentaDataActual?.listIdRecibos.push({
        idNumeroRecibo: parseInt(idReciboAccion),
        monto: parseFloat(montoPagar),
      });
    } else {
      const arrRecibos = cuentaDataActual.listIdRecibos.filter(
        (recibo) => recibo.idNumeroRecibo === parseInt(idReciboAccion)
      );

      const montoTotalPagado = arrRecibos.reduce((nex, prev) => {
        return parseFloat(nex) + parseFloat(prev.monto);
      }, 0);

      cuentaDataActual.listIdRecibos = cuentaDataActual.listIdRecibos.filter(
        (recibos) => recibos.idNumeroRecibo !== parseInt(idReciboAccion)
      );

      cuentaDataActual.listIdRecibos.push({
        idNumeroRecibo: parseInt(idReciboAccion),
        monto: montoTotalPagado + montoPagar,
      });
    }
    listIdRecibos = cuentaDataActual.listIdRecibos;
  } else {
    listIdRecibos.push({
      idNumeroRecibo: parseInt(idReciboAccion),
      monto: parseFloat(montoPagar),
    });
  }
  return listIdRecibos;
};

const mostrarTodas = () => {
  db.collection("CuentasPagar").onSnapshot((response) => {
    listarRegistro(response, -1);
  });
};
