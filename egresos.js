var db = firebase.firestore();
var storage = firebase.storage();
var listCatalogos = [];
let dataToCancel = {};
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Egresos", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Egresos"
    );
    if (tienePermiso) {
      db.collection("Egresos")
        .where("eliminado", "==", false)
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
const listarRegistro = (response, cantidad = 10) => {
  let divTable = document.getElementById("tblEgresos");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaEgresos";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);

  var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">ID Egreso</th>
            <th class="align-middle">Receptor</th>
            <th class="align-middle">Modalidad</th>
            <th class="align-middle">Concepto</th>
            <th class="align-middle">Descripcion</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Divisa</th>
            <th class="align-middle">Monto</th>
            <th class="align-middle">Parcialidad</th>
            <th class="align-middle">Cantidad Parcialidad</th>
            <th class="align-middle">Fecha Inicio</th>
            <th class="align-middle">Metodo de pago</th>
            <th class="align-middle">Empresa</th>
            <th class="align-middle">Asignado</th>
            <th class="align-middle">Orden de compra</th>
            <th class="align-middle">Iva</th>
            <th class="align-middle">Estatus</th>
            <th class="align-middle">Acciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let {
      idEgreso,
      receptor,
      modalidad,
      concepto,
      descripcion,
      comentarios,
      monto,
      divisa,
      parcialidad,
      cantidadParcialidad,
      fechaInicio,
      metodoPago,
      empresa,
      asignado,
      ordenCompra,
      iva,
      estatus,
    } = datos;

    // Generamos el contenido de la tabla
    contenido += `
                <tr id="${response_data.id}">
                    <td>${idEgreso}</td>
                    <td>${receptor}</td>
                    <td>${modalidad}</td>
                    <td>${concepto}</td>
                    <td>${descripcion}</td>
                    <td>${comentarios}</td>
                    <td>${divisa}</td>
                    <td>${toCurrencyMXN(monto)}</td>
                    <td>${parcialidad}</td>
                    <td>${cantidadParcialidad}</td>
                    <td>${fechaInicio}</td>
                    <td>${metodoPago}</td>
                    <td>${empresa}</td>
                    <td>${asignado}</td>
                    <td>${ordenCompra}</td>
                    <td>${iva}</td>
                    <td>${estatus}</td>
                    <td> 
                    <button class="btn btn-danger" onclick="borrarEgreso('${idEgreso}','${
      response_data.id
    }')" title="Borrar Egresos"><i class="far fa-trash-alt"></i></button>

    <button class="btn btn-warning" onclick="onPopUpCancel('${idEgreso}','${response_data.id}')" data-toggle="modal"  data-target="#modal-cancelar" title="Cancelar Egreso"><i class="fas fa-ban"></i></button>
    <button class="btn btn-info" onclick="detalleCuentas('${idEgreso}')" title="Cerrar la órden" data-toggle="modal" data-target="#modal-detalle"><i class="fas fa-eye"></i></button>
    </td>
                </tr>
                `;
  });

  contenido += `</tbody>
                </table>`;

  $("#tablaEgresos").html(contenido);

  var tablaRegistros = $("#tablaEgresos")
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
      columnDefs: [
        {
          targets: [1],
          visible: true,
        },
      ],
      select: true,
    })
    .buttons()
    .container()
    .appendTo("#tablaEgresos_wrapper .col-md-6:eq(0)");
};

$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaEgresos tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

const empezarNuevoEgreso = () => {
  addSelectors();
  document.getElementById("divOrdenCompraDesglose").innerHTML = "";
  // const fechaInicio = document.getElementById("fechaInicioAdd");
  // let yourDate = convertDate(new Date());
  // fechaInicio.min = yourDate;

    //Se formatean los selectores con select2
    $('.select2').select2({
      placeholder: 'Seleccionar'
    });
};

const addSelectors = async () => {
  if (!listCatalogos.length) {
    var queryConfiguracion = await db.collection("ConfiguracionesGenerales").get()
    var configuraciones = {};
    queryConfiguracion.docs.forEach((doc) => {configuraciones[doc.id] = doc.data()});
    console.log({configuraciones})
    listCatalogos = {...configuraciones.catalogoSelectores, ...configuraciones.catalogoSelectoresLectura, ...configuraciones.ordenesCompra}
            selectsData();
            onchangeModalidadTipo();
  } else {
    selectsData();
    onchangeModalidadTipo();
  }
};

const onchangeModalidadTipo = () => {
  const modalidadTipo = document.getElementById("modalidadTipo");
  const parcialidadDiv = document.getElementById("parcialidadDiv");
  const cantidadParcialidadDiv = document.getElementById(
    "cantidadParcialidadDiv"
  );
  const diaCobroDiv = document.getElementById("diaCobroDiv");

  if (modalidadTipo.value == "Un Solo Pago") {
    parcialidadDiv.style = "display: none";
    cantidadParcialidadDiv.style = "display: none";
    diaCobroDiv.style = "display: none";
  } else if (modalidadTipo.value == "Recurrente") {
    parcialidadDiv.style = "";
    cantidadParcialidadDiv.style = "";
    diaCobroDiv.style = "";
  }
};

const onChangeParcialidad = () => {
  const parcialidadSelect = document.getElementById("parcialidadSelect");
  const diaCobroDiv = document.getElementById("diaCobroDiv");
  if (
    parcialidadSelect.value == "Quincenal" ||
    parcialidadSelect.value == "Semanal"
  ) {
    diaCobroDiv.style = "display: none";
  } else {
    diaCobroDiv.style = "";
  }
};

const selectsData = () => {
  let tipoReceptorSelect = `<option value="">seleccionar</option>`;
  listCatalogos.ReceptorTipo.forEach((tipoReceptor) => {
    tipoReceptorSelect += `<option value="${tipoReceptor}">${tipoReceptor}</option>`;
    document.getElementById("selectReceptor").innerHTML = tipoReceptorSelect;
  });

  let tipoModalidadSelect = "";
  listCatalogos.ModalidadEgresos.forEach((Modalidad) => {
    tipoModalidadSelect += `<option value="${Modalidad}">${Modalidad}</option>`;
    document.getElementById("modalidadTipo").innerHTML = tipoModalidadSelect;
  });

  let tipoConceptoSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Conceptos.forEach((Concepto) => {
    tipoConceptoSelect += `<option value="${Concepto}">${Concepto}</option>`;
    document.getElementById("conceptosSelect").innerHTML = tipoConceptoSelect;
  });

  let parcialidadSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Parcialidad.forEach((Parcialidad) => {
    parcialidadSelect += `<option value="${Parcialidad}">${Parcialidad}</option>`;
    document.getElementById("parcialidadSelect").innerHTML = parcialidadSelect;
  });

  let cantidadParcialidadSelect = `<option value="">seleccionar</option>`;
  listCatalogos.CantidadParcialidad.forEach((CantidadParcialidad) => {
    cantidadParcialidadSelect += `<option value="${CantidadParcialidad}">${CantidadParcialidad}</option>`;
    document.getElementById("cantidadParcialidadSelect").innerHTML =
      cantidadParcialidadSelect;
  });

  let metodoPagoSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Modalidad.forEach((Modalidad) => {
    metodoPagoSelect += `<option value="${Modalidad}">${Modalidad}</option>`;
    document.getElementById("metodoPagoSelect").innerHTML = metodoPagoSelect;
  });

  let empresaSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Empresa.forEach((Empresa) => {
    empresaSelect += `<option value="${Empresa}">${Empresa}</option>`;
    document.getElementById("empresaSelect").innerHTML = empresaSelect;
  });

  let asignadoSelect = `<option value="">seleccionar</option>`;
  listCatalogos.Asignado.forEach((Asignado) => {
    asignadoSelect += `<option value="${Asignado}">${Asignado}</option>`;
    document.getElementById("asignadoSelect").innerHTML = asignadoSelect;
  });

  let estatusSelect = `<option value="">seleccionar</option>`;
  listCatalogos.EstatusEgreso.forEach((EstatusEgreso) => {
    estatusSelect += `<option value="${EstatusEgreso}">${EstatusEgreso}</option>`;
    document.getElementById("estatusSelect").innerHTML = estatusSelect;
  });

  let ordenCompraSelect = `<option value="">Selecciona Opcion</option>`;
  listCatalogos.OpcionesOrdenCompra.forEach((OrdenCompra) => {
    ordenCompraSelect += `<option value="${OrdenCompra}">${OrdenCompra}</option>`;
    document.getElementById("ordenCompra").innerHTML = ordenCompraSelect;
  });
};

const validateInput = () => {
  const selectReceptor = document.getElementById("selectReceptor").value;
  if (!selectReceptor) {
    swal({
      title: "Error!",
      text: "Ingrese un Receptor",
      icon: "error",
    });
    return false;
  }

  const modalidadTipo = document.getElementById("modalidadTipo").value;
  if (!modalidadTipo) {
    swal({
      title: "Error!",
      text: "Ingrese una modalidad",
      icon: "error",
    });
    return false;
  }

  const conceptosSelect = document.getElementById("conceptosSelect").value;
  if (!conceptosSelect) {
    swal({
      title: "Error!",
      text: "Ingrese Conceptos",
      icon: "error",
    });
    return false;
  }

  const descripcionAdd = document.getElementById("descripcionAdd").value;
  if (!descripcionAdd) {
    swal({
      title: "Error!",
      text: "Ingrese una descripcion",
      icon: "error",
    });
    return false;
  }

  const comentariosAdd = document.getElementById("comentariosAdd").value;
  if (!comentariosAdd) {
    swal({
      title: "Error!",
      text: "Ingrese comentarios",
      icon: "error",
    });
    return false;
  }

  const montoAdd = document.getElementById("montoAdd").value;
  if (!montoAdd) {
    swal({
      title: "Error!",
      text: "Ingrese monto",
      icon: "error",
    });
    return false;
  }

  const fechaInicioAdd = document.getElementById("fechaInicioAdd").value;
  if (!fechaInicioAdd) {
    swal({
      title: "Error!",
      text: "Ingrese fecha de inicio",
      icon: "error",
    });
    return false;
  }

  const metodoPagoSelect = document.getElementById("metodoPagoSelect").value;
  if (!metodoPagoSelect) {
    swal({
      title: "Error!",
      text: "Ingrese metodo de pago",
      icon: "error",
    });
    return false;
  }

  const empresaSelect = document.getElementById("empresaSelect").value;
  if (!empresaSelect) {
    swal({
      title: "Error!",
      text: "Ingrese empresa",
      icon: "error",
    });
    return false;
  }

  const asignadoSelect = document.getElementById("asignadoSelect").value;
  if (!asignadoSelect) {
    swal({
      title: "Error!",
      text: "Ingrese asignado",
      icon: "error",
    });
    return false;
  }

  const ordenCompra = document.getElementById("ordenCompra").value;
  if (!ordenCompra) {
    swal({
      title: "Error!",
      text: "Ingrese orden de compra",
      icon: "error",
    });
    return false;
  }

  const ivaAdd = document.getElementById("ivaAdd").value;
  if (!ivaAdd) {
    swal({
      title: "Error!",
      text: "Ingrese IVA",
      icon: "error",
    });
    return false;
  }

  const estatusSelect = document.getElementById("estatusSelect").value;
  if (!estatusSelect) {
    swal({
      title: "Error!",
      text: "Ingrese estatus",
      icon: "error",
    });
    return false;
  }
  return true;
};

const guardarNuevoEgreso = async () => {
  if (validateInput()) {
    const receptor = document.getElementById("selectReceptor").value;
    const modalidad = document.getElementById("modalidadTipo").value;
    const concepto = document.getElementById("conceptosSelect").value;
    const descripcion = document.getElementById("descripcionAdd").value;
    const divisa = document.getElementById("divisaSelect").value;
    const comentarios = document.getElementById("comentariosAdd").value;
    const montoUsdInformativo = document.getElementById("montoUsdInformativo").value;
    const monto = document.getElementById("montoAdd").value;
    const parcialidad = document.getElementById("parcialidadSelect").value;
    const fechaInicio = document.getElementById("fechaInicioAdd").value;
    const cantidadParcialidad = document.getElementById(
      "cantidadParcialidadSelect"
    ).value;
    const metodoPago = document.getElementById("metodoPagoSelect").value;
    const empresa = document.getElementById("empresaSelect").value;
    const asignado = document.getElementById("asignadoSelect").value;
    const ordenCompra = document.getElementById("ordenCompra").value;
    const iva = document.getElementById("ivaAdd").value;
    const estatus = document.getElementById("estatusSelect").value;
    const diaCobro = document.getElementById("diaCobro").value;
    const ordenCompraDesglose = [];

    if(ordenCompra == "Multiples Ordenes"){
      var selectOrdenesCompraDesglose = document.getElementsByClassName("ordenCompraSelectDesglose");
      var totalPorcentaje = 0;

     Array.from(selectOrdenesCompraDesglose).forEach((ordenCompra, i) => {
        if(ordenCompra.value != ""){
          ordenCompraDesglose.push({ordenCompra: ordenCompra.value, porcentaje: document.getElementsByClassName("porcentajeDesglose")[i].value / 100})
          totalPorcentaje += document.getElementsByClassName("porcentajeDesglose")[i].value / 100;
          console.log({totalPorcentaje})
        }
      })
      console.log({ordenCompraDesglose})
      console.log({totalPorcentaje})

      if(totalPorcentaje < .99 || totalPorcentaje > 1.01){
        swal({
          title: "Error!",
          text: "La suma de los porcentajes debe ser 100%",
          icon: "error",
        });
        return false;
      }
    } else {
      ordenCompraDesglose.push({ordenCompra: ordenCompra, porcentaje: 1})
    }

    db.collection("ConfiguracionesGenerales")
      .doc("9vECPN3cIoVqVarSOlNZ")
      .get()
      .then((responseConfig) => {
        let datosConfig = responseConfig.data();
        let consecutivo = parseInt(datosConfig.ultimoNumeroEgreso);
        const nuevoNumeroEgreso = consecutivo + 1;
        const nuevoEgreso = {
          idEgreso: nuevoNumeroEgreso,
          receptor,
          modalidad,
          concepto,
          descripcion,
          montoUsdInformativo,
          divisa,
          comentarios,
          monto: parseFloat(monto),
          parcialidad,
          fechaInicio,
          cantidadParcialidad,
          metodoPago,
          empresa,
          ordenCompra,
          ordenCompraDesglose,
          asignado,
          iva: parseFloat(iva),
          estatus,
          diaCobro,
          eliminado: false,
        };
        db.collection("Egresos")
          .add(nuevoEgreso)
          .then(() => {

            if(ordenCompra != "Global"){
              asignarGastosOrdenCompra(nuevoNumeroEgreso)
            }

            db.collection("ConfiguracionesGenerales")
              .doc("9vECPN3cIoVqVarSOlNZ")
              .update({ ultimoNumeroEgreso: nuevoNumeroEgreso })
              .then(() => {
                if (modalidad == "Un Solo Pago") {
                  const fechaInicio = new Date(nuevoEgreso.fechaInicio);
                  fechaInicio.setDate(fechaInicio.getDate() + 1);
                  nuevoEgreso.fechaInicio = fechaInicio;
                  return db
                    .collection("ConfiguracionesGenerales")
                    .doc("9vECPN3cIoVqVarSOlNZ")
                    .get()
                    .then((responseConfig) => {
                      let datosConfig = responseConfig.data();
                      let consecutivo = parseInt(
                        datosConfig.ultimoNumeroPromesa
                      );
                      let nuevoNumeroPromesa = consecutivo + 1;
                      creaPromesaPago(nuevoEgreso, nuevoNumeroPromesa).then(
                        () => {
                          db.collection("ConfiguracionesGenerales")
                            .doc("9vECPN3cIoVqVarSOlNZ")
                            .update({ ultimoNumeroPromesa: nuevoNumeroPromesa })
                            .then(() => {});
                          $("#modal-add").modal("hide");
                          swal({
                            title: "Guardado!",
                            text: "El Egreso fue almacenado",
                            icon: "success",
                          });
                        }
                      );
                    });
                } else if (modalidad == "Recurrente") {
                  creaPagoRecurrente(nuevoEgreso).then(() => {
                    $("#modal-add").modal("hide");
                    swal({
                      title: "Guardado!",
                      text: "El Egreso fue almacenado",
                      icon: "success",
                    });
                  });
                }
              });
          })
          .catch((error) => {
            console.log(
              "🚀 ~ file: egresos.js ~ line 360 ~ guardarNuevoEgreso ~ error",
              error
            );
          });
      });
  }
};

const creaPagoRecurrente = (nuevoEgreso) => {
  if (nuevoEgreso.parcialidad == "Quincenal") {
    let fecha = new Date(nuevoEgreso.fechaInicio);
    const listPromesasParciales = [];
    const diaDeMesSeleccionado = fecha.getDate() + 1;
    const primerQuincena = 15;
    if (diaDeMesSeleccionado > primerQuincena) {
      fecha.setDate(30);
    } else {
      fecha.setDate(15);
    }

    for (i = 0; i < parseInt(nuevoEgreso.cantidadParcialidad); i++) {
      fecha.setMonth(fecha.getMonth() + 0.5);

      if (fecha.getDay() == 0) {
        fecha.setDate(fecha.getDate() - 2);
      } else if (fecha.getDay() == 6) {
        fecha.setDate(fecha.getDate() - 1);
      }

      const newObjEgreso = { ...nuevoEgreso };
      newObjEgreso.fechaInicio = fecha.getTime();
      listPromesasParciales.push(newObjEgreso);
      fecha.setDate(fecha.getDate() + 15);
    }
    return db
      .collection("ConfiguracionesGenerales")
      .doc("9vECPN3cIoVqVarSOlNZ")
      .get()
      .then((responseConfig) => {
        let datosConfig = responseConfig.data();
        let consecutivo = parseInt(datosConfig.ultimoNumeroPromesa);
        let nuevoNumeroPromesa = consecutivo + 1;

        return Promise.resolve(
          listPromesasParciales.map((promesa) => {
            nuevoNumeroPromesa += 1;
            return creaPromesaPago(promesa, nuevoNumeroPromesa);
          })
        ).then(() => {
          db.collection("ConfiguracionesGenerales")
            .doc("9vECPN3cIoVqVarSOlNZ")
            .update({ ultimoNumeroPromesa: nuevoNumeroPromesa })
            .then(() => {});
        });
      });
  } else if (nuevoEgreso.parcialidad == "Semanal") {
    let fecha = new Date(nuevoEgreso.fechaInicio);
    fecha.setDate(fecha.getDate() + 1);
    const listPromesasParciales = [];

    if (fecha.getDay() == 0) {
      fecha.setDate(fecha.getDate() + 1);
    } else if (fecha.getDay() == 6) {
      fecha.setDate(fecha.getDate() + 2);
    }

    for (i = 0; i < parseInt(nuevoEgreso.cantidadParcialidad); i++) {
      fecha.setMonth(fecha.getMonth() + 0.25);
      const newObjEgreso = { ...nuevoEgreso };
      newObjEgreso.fechaInicio = fecha.getTime();
      listPromesasParciales.push(newObjEgreso);
      fecha.setDate(fecha.getDate() + 7);
    }

    return db
      .collection("ConfiguracionesGenerales")
      .doc("9vECPN3cIoVqVarSOlNZ")
      .get()
      .then((responseConfig) => {
        let datosConfig = responseConfig.data();
        let consecutivo = parseInt(datosConfig.ultimoNumeroPromesa);
        let nuevoNumeroPromesa = consecutivo + 1;

        return Promise.resolve(
          listPromesasParciales.map((promesa) => {
            nuevoNumeroPromesa += 1;
            return creaPromesaPago(promesa, nuevoNumeroPromesa);
          })
        ).then(() => {
          db.collection("ConfiguracionesGenerales")
            .doc("9vECPN3cIoVqVarSOlNZ")
            .update({ ultimoNumeroPromesa: nuevoNumeroPromesa })
            .then(() => {});
        });
      });
  } else {
    const listPromesasParciales = [];
    for (i = 0; i < parseInt(nuevoEgreso.cantidadParcialidad); i++) {
      let fecha = new Date(nuevoEgreso.fechaInicio);
      const diaDeMesSeleccionado = fecha.getDate() + 1;
      const diaCobro = parseInt(nuevoEgreso.diaCobro);
      if (diaDeMesSeleccionado > diaCobro) {
        fecha.setMonth(fecha.getMonth() + 1);
        fecha.setDate(diaCobro);
      } else {
        fecha.setDate(diaCobro);
      }
      fecha.setMonth(fecha.getMonth() + parseInt(nuevoEgreso.parcialidad) * i);
      if (fecha.getDay() == 0) {
        fecha.setDate(fecha.getDate() + 1);
      } else if (fecha.getDay() == 6) {
        fecha.setDate(fecha.getDate() + 2);
      }
      const newObjEgreso = { ...nuevoEgreso };
      newObjEgreso.fechaInicio = fecha.getTime();
      listPromesasParciales.push(newObjEgreso);
    }
    return db
      .collection("ConfiguracionesGenerales")
      .doc("9vECPN3cIoVqVarSOlNZ")
      .get()
      .then((responseConfig) => {
        let datosConfig = responseConfig.data();
        let consecutivo = parseInt(datosConfig.ultimoNumeroPromesa);
        let nuevoNumeroPromesa = consecutivo + 1;

        return Promise.resolve(
          listPromesasParciales.map((promesa) => {
            nuevoNumeroPromesa += 1;
            return creaPromesaPago(promesa, nuevoNumeroPromesa);
          })
        ).then(() => {
          db.collection("ConfiguracionesGenerales")
            .doc("9vECPN3cIoVqVarSOlNZ")
            .update({ ultimoNumeroPromesa: nuevoNumeroPromesa })
            .then(() => {});
        });
      });
  }
};

const creaPromesaPago = (nuevoEgreso, nuevoNumeroPromesa) => {
  const nuevaCuenta = {
    idPromesa: nuevoNumeroPromesa,
    idEgreso: nuevoEgreso.idEgreso,
    receptor: nuevoEgreso.receptor,
    divisa: nuevoEgreso.divisa,
    modalidad: nuevoEgreso.modalidad,
    concepto: nuevoEgreso.concepto,
    descripcion: nuevoEgreso.descripcion,
    monto: nuevoEgreso.monto,
    pago: 0,
    saldo: nuevoEgreso.monto,
    fecha: new Date(nuevoEgreso.fechaInicio),
    empresa: nuevoEgreso.empresa,
    asignado: nuevoEgreso.asignado,
    iva: nuevoEgreso.iva,
    estatus: "Promesa",
  };
  return db
    .collection("CuentasPagar")
    .add(nuevaCuenta)
    .then(() => {});
};

const onChangeMontos = () => {
  const montoAdd = document.getElementById("montoAdd").value;
  const cantidadParcialidadSelect = document.getElementById(
    "cantidadParcialidadSelect"
  ).value;
  if (cantidadParcialidadSelect && montoAdd) {
    const montoTotalAdd = document.getElementById("montoTotalAdd");
    const montoTotal = toCurrencyMXN(
      parseFloat(montoAdd) * parseFloat(cantidadParcialidadSelect)
    );
    montoTotalAdd.value = montoTotal;
  }
};

const borrarEgreso = (idEgreso, idEgresoFirebase) => {
  db.collection("CuentasPagar")
    .where("idEgreso", "==", parseInt(idEgreso))
    .get()
    .then((response) => {
      let cuentasList = [];
      response.forEach((doc) => {
        cuentasList.push({ id: doc.id, ...doc.data() });
      });

      if (cuentasList?.length) {
        const existenPagos = cuentasList.some((cuenta) => cuenta.pago > 0);
        if (!existenPagos) {
          Promise.all(
            cuentasList.map(({ id }) => {
              return db.collection("CuentasPagar").doc(id).delete();
            })
          ).then(() => {
            logger("Egresos", "Eliminar egreso", idEgreso);
            db.collection("Egresos")
              .doc(idEgresoFirebase)
              .delete()
              .then(() => {
                swal({
                  title: "Eliminado!",
                  text: "El egreso fue Eliminado",
                  icon: "success",
                });
              })
              .catch((error) => {
                console.log(
                  "🚀 ~ file: egresos.js ~ line 684 ~ ).then ~ error",
                  error
                );
              });
          });
        } else {
          swal({
            title: "No Eliminado!",
            text: "El egreso contiene pagos",
            icon: "warning",
          });
        }
      } else {
        db.collection("Egresos")
          .doc(idEgresoFirebase)
          .delete()
          .then(() => {
            swal({
              title: "Eliminado!",
              text: "El egreso fue Eliminado",
              icon: "success",
            });
          })
          .catch((error) => {
            console.log(
              "🚀 ~ file: egresos.js ~ line 684 ~ ).then ~ error",
              error
            );
          });
      }
    });
};

const onPopUpCancel = (idEgreso, idEgresoFirebase) => {
  dataToCancel = { idEgreso, idEgresoFirebase };
};

const cancelarEgreso = () => {
  const { idEgreso, idEgresoFirebase } = dataToCancel;
  const txtComentariosCancel = document.getElementById(
    "txtComentariosCancel"
  ).value;
  db.collection("CuentasPagar")
    .where("idEgreso", "==", parseInt(idEgreso))
    .get()
    .then((response) => {
      let cuentasList = [];
      response.forEach((doc) => {
        cuentasList.push({ id: doc.id, ...doc.data() });
      });

      if (cuentasList?.length) {
        const cuentasConPagos = cuentasList.filter(
          (cuenta) => cuenta.saldo > 0
        );

        if (cuentasConPagos?.length) {
          Promise.all(
            cuentasConPagos.map(({ id, comentarios }) => {
              db.collection("CuentasPagar")
                .doc(id)
                .update({
                  estatus: "CANCELADO",
                  saldo: 0,
                  comentarios: ` ${
                    comentarios ? comentarios : ""
                  } | ${txtComentariosCancel}`,
                });
            })
          ).then(() => {
            db.collection("Egresos")
              .doc(idEgresoFirebase)
              .update({
                estatus: "Cancelado",
              })
              .then(() => {
                $("#modal-cancelar").modal("hide");
                swal({
                  title: "Cancelado!",
                  text: "El egreso fue Cancelado",
                  icon: "success",
                });
              })
              .catch((error) => {
                console.log(
                  "🚀 ~ file: egresos.js ~ line 730 ~ ).then ~ error",
                  error
                );
              });
          });
        }
      }
    });
};
const detalleCuentas = (idEgreso) => {
  document.getElementById("tablaDetalle").innerHTML = "";
    //Destruir la tabla si ya existe
    if ($.fn.DataTable.isDataTable("#tblDetalleCuentas")) {
      $("#tblDetalleCuentas").DataTable().destroy();
    }

    
  db.collection("CuentasPagar")
    .where("idEgreso", "==", parseInt(idEgreso))
    .get()
    .then((response) => {
      let cuentasList = [];
      response.forEach((doc) => {
        cuentasList.push({ id: doc.id, ...doc.data() });
      });
      let newRow = " <tbody>";
      cuentasList.forEach((element) => {
        newRow += `<tr>
            <td>${element.idPromesa}</td>
            <td>${element.estatus}</td>
            <td>${formatoFecha(element.fecha)}</td>
            <td>${toCurrencyMXN(element.monto)} </td>
            <td>${toCurrencyMXN(element.pago)} </td>
            <td>${toCurrencyMXN(element.saldo)} </td>
            <td>${element.comentarios ?? ""} </td>
           </tr>`;
      });
      newRow += "</tbody>";
      let tablaDetalle = document.getElementById("tablaDetalle");
      tablaDetalle.innerHTML = newRow;


      $("#tblDetalleCuentas")
        .DataTable({
          searching: true,
          paging: false,
          info: false,
          buttons: false,
          dom: "Bfrtip",
          responsive: true,
          lengthChange: false,
          autoWidth: false,
          scrollX: false,
          stateSave: false,
          pageLength: 10,
          order: [[0, "asc"]],
          buttons: [],
          // ocultar columnas
          columnDefs: [
            {
              targets: [0],
              orderable: true,
              searchable: true,
            },
          ],
          select: true,
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

            const pageMontoTotal = calcTotal(3);
            const idTotalMonto = document.getElementById("idTotalMonto");
            idTotalMonto.textContent = `${toCurrencyMXN(pageMontoTotal)}`;

            const pageTotaPago = calcTotal(4);
            const elementoTotaPago = document.getElementById("idTotalPago");
            elementoTotaPago.textContent = `${toCurrencyMXN(pageTotaPago)}`;

            const pageTotaSaldo = calcTotal(5);
            const elementoTotaSaldo = document.getElementById("idTotaSaldo");
            elementoTotaSaldo.textContent = `${toCurrencyMXN(pageTotaSaldo)}`;
          },
        })
        .buttons()
        .container()
        .appendTo("#tblDetalleCuentas_wrapper .col-md-6:eq(0)");
    });
};


//Funcion para agregar mas ordenes de compra y su respectivo porcentaje
async function onChangeOrdenCompra(){
  var ordenCompra = document.getElementById("ordenCompra").value;
  
  if(ordenCompra == "Una Orden"){
    let ordenCompraSelect = `<option value="">Selecciona Orden</option>`;
  listCatalogos.ordenesCompra.forEach((OrdenCompra) => {
    ordenCompraSelect += `<option value="${OrdenCompra}">${OrdenCompra}</option>`;
    document.getElementById("ordenCompra").innerHTML = ordenCompraSelect;
  });
  }

  //En caso que sean multiples ordenes, agregar en divOrdenCompraDesglose dos inputs en fila, uno para seleccionar la orden y el otro para agregar el porcentaje
  if(ordenCompra == "Multiples Ordenes"){
    //Checar si ya hay un select con clase ordenCompraSelectDesglose
    var selectoresExistentes = document.getElementsByClassName("ordenCompraSelectDesglose")
    var cantDesglose = selectoresExistentes.length;

    //Si exsiete algun selecor existente que su valor sea "", no agregar mas selectores
    if(selectoresExistentes.length > 0 && selectoresExistentes[selectoresExistentes.length - 1].value == ""){
      return false;

    }


    var divOrdenCompraDesglose = document.getElementById("divOrdenCompraDesglose");

    var selectOrdenCompra = document.createElement("select");
    selectOrdenCompra.setAttribute("class", "form-control select2 ordenCompraSelectDesglose");
    selectOrdenCompra.setAttribute("id", `ordenCompraSelectDesglose-${cantDesglose}`);
    selectOrdenCompra.setAttribute("onchange", "onChangeOrdenCompra()");

    let ordenCompraSelect = `<option value="">Selecciona Orden</option>`;
    listCatalogos.ordenesCompra.forEach((OrdenCompra) => {
      ordenCompraSelect += `<option value="${OrdenCompra}">${OrdenCompra}</option>`;
      selectOrdenCompra.innerHTML = ordenCompraSelect;
    });

    var inputPorcentaje = document.createElement("input");
    inputPorcentaje.setAttribute("class", "form-control porcentajeDesglose");
    inputPorcentaje.setAttribute("placeholder", "%");
    inputPorcentaje.setAttribute("id", `inputPorcentaje-${cantDesglose}`);
    inputPorcentaje.setAttribute("type", "number");
    inputPorcentaje.setAttribute("min", "0");
    inputPorcentaje.setAttribute("max", "100");


    var divRow = document.createElement("div");
    divRow.setAttribute("class", "row");
    divRow.setAttribute("id", `divRow-${cantDesglose}`);
    divRow.setAttribute("style", "margin-top: 10px;");
    divRow.innerHTML = `
    <div class="col-md-6">
      ${selectOrdenCompra.outerHTML}
    </div>
    <div class="col-md-6">
      ${inputPorcentaje.outerHTML}
    </div>
    `;

    divOrdenCompraDesglose.append(divRow);


  }

   //Se formatean los selectores con select2
   $('.select2').select2({
    placeholder: 'Seleccionar'
  });
}


//Funcion para asignar los gastos a la orden de compra
async function asignarGastosOrdenCompra(idEgreso){

  var url = `${window.URLFuncionesGenerales}?functionToExecute=asignarGastosOrdenesDeCompra&idEgreso=${idEgreso}`;
  var response = await fetch(url);
  var response_data = await response.json();
  console.log({response_data})

  return true

}


//Funcion para mostrar campo de USD Informativo en modal
async function onChangeDivisa(){
  var divisa = document.getElementById("divisaSelect").value;
  if(divisa == "USD"){
    document.getElementById("divMontoUsdInformativo").style.display = "block";
  } else {
    document.getElementById("divMontoUsdInformativo").style.display = "none";
  }
}