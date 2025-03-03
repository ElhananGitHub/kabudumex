var db = firebase.firestore();
var storage = firebase.storage();
var listCatalogosCobranza = [];
let numero_orden_ventaActual = 0;
// Obtenemos las Ventas de firebase
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    logger("Cobranza", "Ingreso");
    let response = responseConfig.data();
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Cobranza"
    );
    if (tienePermiso) {
      db.collection("Ventas")
        .where("delete", "==", false)
        .where("EstatusPedido", "in", ["Pedido cerrado", "Pendiente"])
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

const formatoFechaNow = () => {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};
/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10) => {
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
            <th class="filterhead">Cliente</th>
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
            <th class="align-middle">Cliente</th>
            <th class="align-middle">Número Órden Venta</th>
            <th class="align-middle">Estatus</th>
            <th class="align-middle">Fecha</th>
            <th class="align-middle">Venta</th>
            <th class="align-middle">IVA</th>
            <th class="align-middle">Venta Total + IVA</th>
            <th class="align-middle">Pago</th>
            <th class="align-middle">Saldo</th>
            <th class="align-middle">ID Recibos</th>
            <th class="align-middle">Opciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      cliente,
      numero_orden_venta,
      venta_mas_iva,
      saldo,
      pago,
      EstatusPago,
      fechaVenta,
      listIdRecibos,
      iva,
      TotalVenta,
    } = datos;

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
    // Generamos el contenido de la tabla
    contenido += `
                <tr id="${response_data.id}">
                    <td>${cliente}</td>
                    <td>${numero_orden_venta}</td>
                    <td>${EstatusPago}</td>
                    <td>${formatoFecha(fechaVenta)}</td>
                    <td>${toCurrencyMXN(TotalVenta)}</td>
                    <td>${toCurrencyMXN(iva)}</td>
                    <td>${toCurrencyMXN(venta_mas_iva)}</td>
                    <td>${toCurrencyMXN(pago)}</td>
                    <td>${toCurrencyMXN(saldo)}</td>
                    <td><ul>${listadoRecibos(listIdRecibos)}</ul></td>
                    <td>
                   ${
                     EstatusPago == "Pagada"
                       ? ""
                       : `<button class="btn btn-success" title="Registrar Pago" onclick="showModalEdit('${response_data.id}','${numero_orden_venta}')" data-toggle="modal" data-target="#modal-add"><i class="fas fa-donate"></i></button>`
                   }
                   <button class="btn btn-success" title="Descargar Estado de Cuenta" onclick="downloadEstadoCuenta('${cliente}')" data-toggle="modal" ><i class="fas fa-file-download"></i></button>
                    </td>
                </tr>
                `;
  });

  contenido += `</tbody>
                </table>`;

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
      order: [[1, "desc"]],
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
        }); // filter
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

        const pagePagoTotal = calcTotal(4);
        const idTotalPago = document.getElementById("idTotalPago");
        idTotalPago.textContent = `${toCurrencyMXN(pagePagoTotal)}`;

        const pageIVA = calcTotal(5);
        const idIvaPago = document.getElementById("idIvaPago");
        idIvaPago.textContent = `${toCurrencyMXN(pageIVA)}`;

        const pageTotalIVA = calcTotal(6);
        const elementoTotalPSaldo = document.getElementById("idTotalPagoIva");
        elementoTotalPSaldo.textContent = `${toCurrencyMXN(pageTotalIVA)}`;

        const pageTotaPago = calcTotal(7);
        const elementoTotaPago = document.getElementById("idPagoTotal");
        elementoTotaPago.textContent = `${toCurrencyMXN(pageTotaPago)}`;

        const pageTotaSaldo = calcTotal(8);
        const elementoTotaSaldo = document.getElementById("idTotaSaldo");
        elementoTotaSaldo.textContent = `${toCurrencyMXN(pageTotaSaldo)}`;
      },
    })
    .buttons()
    .container()
    .appendTo("#tablaVenta_wrapper .col-md-6:eq(0)");

  let cardTotales = document.getElementById("cardTotales");
  cardTotales.style = "";
};

$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaVenta tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**************************************************/
/* SHOW MODAL EDIT
  Muestra los campos que vienen de base de datos para editarlos
*/
const showModalEdit = (id, numero_orden_venta) => {
  numero_orden_ventaActual = numero_orden_venta;
  db.collection("Ventas")
    .doc(id)
    .get()
    .then((response) => {
      db.collection("ConfiguracionesGenerales")
        .doc("9vECPN3cIoVqVarSOlNZ")
        .get()
        .then((responseConfig) => {
          let datosConfig = responseConfig.data();
          let consecutivo = parseInt(datosConfig.ultimoNumeroRecibo);
          const nuevoNumeroRecibo = consecutivo + 1;
          const idNumeroRecibo = document.getElementById("idNumeroRecibo");
          idNumeroRecibo.value = nuevoNumeroRecibo;

          const idOriginalNumeroRecibo = document.getElementById(
            "idOriginalNumeroRecibo"
          );
          idOriginalNumeroRecibo.value = nuevoNumeroRecibo;

          let datos = response.data();
          const idNumeroVenta = document.getElementById("idNumeroVenta");
          idNumeroVenta.value = id;

          const clienteList = document.getElementById("clienteList");
          clienteList.innerHTML = `<option value="${datos.cliente}">${datos.cliente}</option>`;
          clienteList.disabled = true;

          const txtSaldoPendiente =
            document.getElementById("txtSaldoPendiente");
          const divSaldoPendiente =
            document.getElementById("divSaldoPendiente");
          divSaldoPendiente.style = `display: inherit`;
          txtSaldoPendiente.disabled = true;
          txtSaldoPendiente.value = toCurrencyMXN(datos.saldo);

          const txtOrdenVenta = document.getElementById("txtOrdenVenta");
          txtOrdenVenta.disabled = true;
          txtOrdenVenta.value = datos.numero_orden_venta;
          const divOrdenVenta = document.getElementById("divOrdenVenta");
          divOrdenVenta.style = `display: inherit`;

          const txtMontoPagar = document.getElementById("txtMontoPagar");
          txtMontoPagar.value = "";

          const txtComentarios = document.getElementById("txtComentarios");
          txtComentarios.value = "";

          const ReceptorDiv = document.getElementById("ReceptorDiv");
          ReceptorDiv.innerHTML = `<label>Receptor</label>
          <select
            class="form-control"
            id="ReceptorTipo"
            onchange="onchangeReceptorTipo()"
            required
          >
          </select>`;
          addSelectors();
        });
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: cobranza.js ~ line 355 ~ showModalEdit ~ error",
        error
      );
    });
};

/**
 * Calcula los movimientos de saldo de la orden y
 * los envia a una api para generar y descargar un estado de cuenta
 */
const downloadEstadoCuenta = (cliente) => {
  swal({
    title: "Descargando...",
    text: "La descarga comenzará en breve...",
  });
  try {
    let ventasList = [];
    let allRecibosCliente = [];
    db.collection("Ventas")
      .where("cliente", "==", cliente)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          var elementosVenta = doc.data().elementos;
          var elementosConcatenados = "";
          elementosVenta.forEach(e => elementosConcatenados.indexOf(e.producto) < 0 ? elementosConcatenados += "•" + e.producto + " " : null);
          ventasList.push({ id: doc.id, ...doc.data(), elementosConcatenados });
        });

        console.log({ventasList})

        let idRecibosCliente = [];
        ventasList.forEach((data) => {
          if (data?.listIdRecibos?.length) {
            data?.listIdRecibos.forEach((rec) => {
              if (
                !idRecibosCliente.some((recCli) => recCli == rec.idNumeroRecibo)
              ) {
                idRecibosCliente.push(rec);
              }
            });
          }
        });
        db.collection("Clientes")
          .where("nombre_cliente", "==", cliente)
          .get()
          .then((response) => {
            let ClientesList = [];
            response.forEach((doc) => {
              ClientesList.push({ id: doc.id, ...doc.data() });
            });

            const clienteSelected = ClientesList[0];
            /** Calculo de saldos */
            Promise.all(
              idRecibosCliente.map((recibo) => {
                return db
                  .collection("Contabilidad")
                  .where("numeroRecibo", "==", recibo.idNumeroRecibo)
                  .get()
                  .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                      allRecibosCliente.push({ id: doc.id, ...doc.data() });
                    });
                  });
              })
            ).then(() => {
              const listaMovimientos = allRecibosCliente.concat(ventasList);
              let newlistaMovimientos = Array.from(listaMovimientos, (mov) => {
                const Operacion = mov?.numero_orden_venta ? "Venta" : "Pago";
                const operacionValue = mov?.numero_orden_venta
                  ? mov.numero_orden_venta
                  : mov.numeroRecibo.toString();
                const Fecha = mov?.numero_orden_venta
                  ? mov.fechaVenta
                  : mov.fecha;
                const Cargo = mov?.numero_orden_venta ? -mov.venta_mas_iva : 0;
                const Abono = mov?.numero_orden_venta ? 0 : mov.monto;
                const elementosVenta = mov?.numero_orden_venta ? mov.elementosConcatenados : "";

                const formatoFecha = (fechaVenta) => {
                  const dt = new Date(fechaVenta.seconds * 1000);
                  return `${dt.getFullYear().toString().padStart(4, "0")}/${(
                    dt.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}/${dt
                    .getDate()
                    .toString()
                    .padStart(2, "0")}`;
                };
                return {
                  Operacion,
                  "Numero de Nota / Recibo": operacionValue,
                  Fecha: formatoFecha(Fecha),
                  "Productos": elementosVenta,
                  Cargo,
                  Abono,
                };
              });

              newlistaMovimientos = newlistaMovimientos.sort((a, b) => {
                return (
                  new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
                );
              });

              let sumaSaldo = 0;
              newlistaMovimientos = newlistaMovimientos.map((mov) => {
                let saldoAcum =
                  parseFloat(mov.Cargo) + parseFloat(mov.Abono) + sumaSaldo;
                sumaSaldo = +saldoAcum;
                return {
                  ...mov,
                  "Saldo Acomulado": saldoAcum,
                };
              });

              newlistaMovimientos = Array.from(newlistaMovimientos, (item) => {
                return {
                  ...item,
                  Abono: toCurrencyMXN(item.Abono),
                  "Saldo Acomulado": toCurrencyMXN(item["Saldo Acomulado"]),
                  Cargo: toCurrencyMXN(item.Cargo),
                };
              });

              db.collection("ConfiguracionesGenerales")
                .doc("ConfiguracionesApiGoogle")
                .onSnapshot((response) => {
                  let { DescargaEstadoCuenta } = response.data();
                  let configEndPoint = DescargaEstadoCuenta;
                  configEndPoint.documentName = `Nube - Estado De Cuenta- ${formatoFechaNow()} - ${cliente}.pdf`;

                  const apiBody = {
                    multiples: {
                      registros: newlistaMovimientos,
                    },
                    config: configEndPoint,
                    Fecha: formatoFechaNow(),
                    Cliente: cliente,
                    Email: clienteSelected?.email_contacto,
                  };

                  const config = {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify(apiBody),
                  };
                  fetch(
                    "https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?user=USUARIO&accion=generarDocumento",
                    config
                  )
                    .then((response) => response.text())
                    .then((result) => {
                      const res = JSON.parse(result);
                      window.open(res.urlDocumentoDownload, "_blank");
                    })
                    .catch(function (error) {
                      swal({
                        title: "Error!",
                        text: "No se pudo realizar la descarga",
                        icon: "error",
                      });
                    });
                });
            });
          });
      });
  } catch (error) {
    swal({
      title: "Error!",
      text: "No se pudo realizar la descarga",
      icon: "error",
    });
  }
};

/*
 Renderiza las opciones de los selectores
*/
const addSelectors = () => {
  if (!listCatalogosCobranza.length) {
    db.collection("ConfiguracionesGenerales")
      .doc("catalogoSelectores")
      .get()
      .then((response) => {
        listCatalogosCobranza = response.data();
        db.collection("ConfiguracionesGenerales")
          .doc("catalogoSelectoresLectura")
          .get()
          .then((response2) => {
            const objtLectura = response2.data();
            listCatalogosCobranza = { ...listCatalogosCobranza, objtLectura };
            selectsData();
          });
      });
  } else {
    selectsData();
  }
};

/**Cuando el selector se seleccione "Otro" se debe mostrar un campo abierto*/
const onchangeReceptorTipo = () => {
  const valueReceptorTipo = document.getElementById("ReceptorTipo");
  const ReceptorDiv = document.getElementById("ReceptorDiv");
  if (valueReceptorTipo.value == "Otro") {
    valueReceptorTipo.remove();
    const newElement = `<label>Receptor</label>
    <input
    type="text"
    class="form-control"
    id="ReceptorTipo"
  />`;
    ReceptorDiv.innerHTML = newElement;
  }
};

/*
 Renderiza las opciones de los selectores
*/
const selectsData = () => {
  let tipoaccionesSelect = `<option value="">seleccionar</option>`;
  listCatalogosCobranza?.objtLectura?.AccionesCobranza?.forEach(
    (tipoaccion) => {
      tipoaccionesSelect += `<option value="${tipoaccion}">${tipoaccion}</option>`;
      document.getElementById("accionesSelect").innerHTML = tipoaccionesSelect;
    }
  );

  let tipoModalidadSelect = `<option value="">seleccionar</option>`;
  listCatalogosCobranza.Modalidad.forEach((tipoModalidad) => {
    tipoModalidadSelect += `<option value="${tipoModalidad}">${tipoModalidad}</option>`;
    document.getElementById("modalidadTipo").innerHTML = tipoModalidadSelect;
  });

  let tipoReceptorSelect = `<option value="">seleccionar</option>`;
  listCatalogosCobranza.ReceptorTipo.forEach((tipoReceptor) => {
    tipoReceptorSelect += `<option value="${tipoReceptor}">${tipoReceptor}</option>`;
    document.getElementById("ReceptorTipo").innerHTML = tipoReceptorSelect;
  });

  let cajasListSelect = `<option value="">seleccionar</option>`;
  listCatalogosCobranza.Cajas.forEach((caja) => {
    cajasListSelect += `<option value="${caja}">${caja}</option>`;
    document.getElementById("cajasList").innerHTML = cajasListSelect;
  });
};

/** Valores por defector de los campos del modal de generar pago  */
const selectCliente = () => {
  addSelectors();
  let cliente = `<option value="">seleccionar</option>`;
  let clienteList = document.getElementById("clienteList");
  clienteList.disabled = false;

  let divSaldoPendiente = document.getElementById("divSaldoPendiente");
  divSaldoPendiente.style = `display: none`;

  const divOrdenVenta = document.getElementById("divOrdenVenta");
  divOrdenVenta.style = `display: none`;

  const txtMontoPagar = document.getElementById("txtMontoPagar");
  txtMontoPagar.value = "";

  const txtOrdenVenta = document.getElementById("txtOrdenVenta");
  txtOrdenVenta.value = "";

  const txtComentarios = document.getElementById("txtComentarios");
  txtComentarios.value = "";

  const idNumeroVenta = document.getElementById("idNumeroVenta");
  idNumeroVenta.value = "";
  db.collection("Clientes").onSnapshot((response) => {
    response.forEach((response_data) => {
      let datos = response_data.data();
      cliente += `<option value="${datos.nombre_cliente}">${datos.nombre_cliente}</option>`;
      document.getElementById("clienteList").innerHTML = cliente;
    });
  });
};

/**
 * Funcion de actualizar una venta con los nuevos montos y el historico de pagos
 * @param {*} idNumeroVenta
 * @param {*} txtMontoPagar
 * @param {*} idNumeroRecibo
 * @param {*} esLisquidacionDescuento
 */
const updateVenta = (
  idNumeroVenta,
  txtMontoPagar,
  idNumeroRecibo,
  esLisquidacionDescuento
) => {
  db.collection("Ventas")
    .doc(idNumeroVenta)
    .get()
    .then((response) => {
      let datos = response.data();
      txtMontoPagar = parseFloat(txtMontoPagar);
      datos.pago = datos.pago + txtMontoPagar;
      datos.saldo = datos.venta_mas_iva - datos.pago;
      if (datos.saldo == 0) {
        datos.EstatusPago = "Pagada";
      } else {
        datos.EstatusPago = "Liquidacion parcial";
      }

      if (esLisquidacionDescuento) {
        datos.EstatusPago = "Liquidacion con descuento";
        datos.saldo = 0;
      }

      if (datos.listIdRecibos?.length) {
        const existIdInList = datos.listIdRecibos?.find(
          (rec) => rec.idNumeroRecibo === parseInt(idNumeroRecibo)
        );

        /**Calculo de historico de pagos */
        if (!existIdInList) {
          datos.listIdRecibos.push({
            idNumeroRecibo: parseInt(idNumeroRecibo),
            monto: txtMontoPagar,
          });
        } else {
          const arrRecibos = datos.listIdRecibos.filter(
            (recibo) => recibo.idNumeroRecibo === parseInt(idNumeroRecibo)
          );

          const montoTotalPagado = arrRecibos.reduce((nex, prev) => {
            return parseFloat(nex) + parseFloat(prev.monto);
          }, 0);

          datos.listIdRecibos = datos.listIdRecibos.filter(
            (recibos) => recibos.idNumeroRecibo !== parseInt(idNumeroRecibo)
          );

          datos.listIdRecibos.push({
            idNumeroRecibo: parseInt(idNumeroRecibo),
            monto: montoTotalPagado + txtMontoPagar,
          });
        }
      } else {
        datos.listIdRecibos = [
          { idNumeroRecibo: parseInt(idNumeroRecibo), monto: txtMontoPagar },
        ];
      }
      logger("Cobranza", "Update pago", idNumeroVenta, datos);
      db.collection("Ventas").doc(idNumeroVenta).update(datos);
      const btnCerrarModal = document.getElementById("btnCerrarModal");
      btnCerrarModal.click();
    });
};

/**
 * Valida que los campos de generar pago no esten vacios
 */
const validateInput = () => {
  const receptorTipo = document.getElementById("ReceptorTipo").value;
  const modalidadTipo = document.getElementById("modalidadTipo").value;
  const txtComentarios = document.getElementById("txtComentarios").value;
  const txtMontoPagar = document.getElementById("txtMontoPagar").value;
  const txtFecha = document.getElementById("txtFecha").value;

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
  if (!receptorTipo) {
    swal({
      title: "Error!",
      text: "Ingrese un receptor",
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
 *  Registra un movimiento en la tabla de contabilidad con todos los campos de generar un pago
 */
const registrarPago = () => {
  const accionesSelect = document.getElementById("accionesSelect");
  const idNumeroVenta = document.getElementById("idNumeroVenta").value;
  const txtComentarios = document.getElementById("txtComentarios");
  if (accionesSelect.value == "Pago Cancelado") {
    const objNuevoPago = {
      EstatusPago: "Pago Cancelado",
      comentarios: txtComentarios.value,
      saldo: 0,
    };
    logger("Cobranza", "Nuevo Pago", idNumeroVenta, objNuevoPago);
    db.collection("Ventas")
      .doc(idNumeroVenta)
      .update(objNuevoPago)
      .then(() => {
        $("#modal-add").modal("hide");
        txtComentarios.value = "";
        swal({
          title: "Pago cancelado!",
          text: "Pago cancelado",
          icon: "success",
        });
      });
  } else {
    const esLisquidacionDescuento =
      accionesSelect.value == "Liquidacion con descuento";
    const clienteSelected = document.getElementById("clienteList").value;
    const receptorTipo = document.getElementById("ReceptorTipo").value;
    const modalidadTipo = document.getElementById("modalidadTipo").value;
    const txtComentarios = document.getElementById("txtComentarios").value;
    const idNumeroRecibo = document.getElementById("idNumeroRecibo").value;
    const caja = document.getElementById("cajasList").value;
    const idOriginalNumeroRecibo = document.getElementById(
      "idOriginalNumeroRecibo"
    ).value;
    let txtMontoPagar = document.getElementById("txtMontoPagar").value;
    const txtFecha = document.getElementById("txtFecha").value;

    if (!validateInput()) {
      return;
    }
    let ingresosLista = [];
    db.collection("Contabilidad")
      .where("numeroRecibo", "==", parseInt(idNumeroRecibo))
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          ingresosLista.push({ id: doc.id, ...doc.data() });
        });
        let montoAcumulado = 0;
        let idReciboFirebase;
        let historialAcumulado = [];
        if (ingresosLista[0]?.monto) {
          historialAcumulado = ingresosLista[0].historial.concat([
            {
              fechaPago: new Date(`${txtFecha}T00:00:00`),
              monto: parseFloat(txtMontoPagar),
              numeroVenta: parseInt(numero_orden_ventaActual),
              comentarios: txtComentarios,
              modalidad: modalidadTipo,
              receptor: receptorTipo,
              caja,
            },
          ]);
          montoAcumulado =
            parseFloat(ingresosLista[0].monto) + parseFloat(txtMontoPagar);
          idReciboFirebase = ingresosLista[0].id;
        }

        /**Revisa si el recibo es antiguo o nuevo */
        const isNewRecibo = idOriginalNumeroRecibo <= idNumeroRecibo;

        if (isNewRecibo) {
          const objNuevoPago = {
            comentarios: txtComentarios,
            tipoMovimiento: "INGRESO",
            emisor: clienteSelected,
            fecha: new Date(`${txtFecha}T00:00:00`),
            modalidad: modalidadTipo,
            monto: parseFloat(txtMontoPagar),
            receptor: receptorTipo,
            caja,
            numeroRecibo: parseInt(idOriginalNumeroRecibo),
            historial: [
              {
                fechaPago: new Date(`${txtFecha}T00:00:00`),
                monto: parseFloat(txtMontoPagar),
                numeroVenta: parseInt(numero_orden_ventaActual),
                comentarios: txtComentarios,
                modalidad: modalidadTipo,
                receptor: receptorTipo,
                caja,
              },
            ],
          };
          logger("Cobranza", "Nuevo Pago", idNumeroVenta, objNuevoPago);
          db.collection("ConfiguracionesGenerales")
            .doc("9vECPN3cIoVqVarSOlNZ")
            .update({ ultimoNumeroRecibo: idOriginalNumeroRecibo });
          db.collection("Contabilidad").doc().set(objNuevoPago);
        } else {
          db.collection("Contabilidad")
            .doc(idReciboFirebase)
            .update({ monto: montoAcumulado, historial: historialAcumulado });
        }

        /** Actualiza la venta con los nuevos datops del pago */
        if (idNumeroVenta) {
          updateVenta(
            idNumeroVenta,
            parseFloat(txtMontoPagar),
            isNewRecibo ? idOriginalNumeroRecibo : idNumeroRecibo,
            esLisquidacionDescuento
          );
        } else {
          if (!clienteSelected) {
            swal({
              title: "Error!",
              text: "Seleccione un cliente",
              icon: "error",
            });
            return;
          }
          let ventasLista = [];
          db.collection("Ventas")
            .where("cliente", "==", clienteSelected)
            .orderBy("fechaVenta", "asc")
            .get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                ventasLista.push({ id: doc.id, ...doc.data() });
              });
              const ultimaVenta = ventasLista.filter(
                (venta) => venta.saldo > 0
              );

              let montoDisponible = txtMontoPagar;
              ultimaVenta.forEach((element) => {
                if (montoDisponible > 0) {
                  if (element.saldo <= montoDisponible) {
                    montoDisponible = montoDisponible - element.saldo;
                    updateVenta(
                      element.id,
                      element.saldo,
                      idNumeroRecibo,
                      esLisquidacionDescuento
                    );
                  } else if (element.saldo >= montoDisponible) {
                    updateVenta(
                      element.id,
                      montoDisponible,
                      idNumeroRecibo,
                      esLisquidacionDescuento
                    );
                    montoDisponible = 0;
                  }
                }
              });
            });
        }
      });
    swal({
      title: "Pago Registrado",
      icon: "success",
    }).then(() => {
      const btnCerrarModal = document.getElementById("btnCerrarModal");
      btnCerrarModal.click();
    });
  }
};

/**
 * Funcionalidad del selector de acciones en el modal de registrar pago
 */
const onchangeAccionTipo = () => {
  const divModalidad = document.getElementById("divModalidad");
  const divFecha = document.getElementById("divFecha");
  const divCliente = document.getElementById("divCliente");
  const accionesSelect = document.getElementById("accionesSelect");
  const divNumeroRecibo = document.getElementById("divNumeroRecibo");
  const divOrdenVenta = document.getElementById("divOrdenVenta");
  const divSaldoPendiente = document.getElementById("divSaldoPendiente");
  const divMonto = document.getElementById("divMonto");
  const divCajasList = document.getElementById("divCajasList");

  defaultActions();
  switch (accionesSelect.value) {
    case "Pago Cancelado":
      divModalidad.style = "display: none";
      divModalidad.style = "display: none";
      divFecha.style = "display: none";
      divCliente.style = "display: none";
      divNumeroRecibo.style = "display: none";
      divOrdenVenta.style = "display: none";
      divSaldoPendiente.style = "display: none";
      divMonto.style = "display: none";
      divCajasList.style = "display: none";
      break;
    default:
      break;
  }
};

/**
 * Valores por defecto en el modal de registrar pago
 */
const defaultActions = () => {
  const divModalidad = document.getElementById("divModalidad");
  const divFecha = document.getElementById("divFecha");
  const divCliente = document.getElementById("divCliente");
  const divComentarios = document.getElementById("divComentarios");
  const divNumeroRecibo = document.getElementById("divNumeroRecibo");
  const divOrdenVenta = document.getElementById("divOrdenVenta");
  const divSaldoPendiente = document.getElementById("divSaldoPendiente");
  const divMonto = document.getElementById("divMonto");
  const divCajasList = document.getElementById("divCajasList");

  divCajasList.style = "";
  divModalidad.style = "";
  divFecha.style = "";
  divCliente.style = "";
  divComentarios.style = "";
  divNumeroRecibo.style = "";
  divOrdenVenta.style = "";
  divSaldoPendiente.style = "";
  divMonto.style = "";
};
