var db = firebase.firestore();
var storage = firebase.storage();
let opciones = {};
let opcionesbyConfiguracion = [];
let indexConfiguracionTabla = 0;
let tablaActual = "";
let nombreOpcionActual = "";
let tablaOpcionTextArea = "";
let tablaOpcionTextAreaValues = "";
const uid = JSON.parse(sessionStorage.user).uid;
let tablaConfig = {};
let configApi = {};
const listElements = [
  "readOnly",
  "required",
  "show",
  "send",
  "edit",
  "dataType",
  "formType",
  "inputType",
  "formSource",
  "arrayFormula",
  "cellFormula",
  "multipleData",
  "filter",
  "allowNew",
  "formatType",
  "button",
  "buttonCondition",
];

db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Configuraciones", "Ingreso");
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Configuraciones"
    );
    if (tienePermiso) {
      db.collection("ConfiguracionesGenerales")
        .doc("catalogoSelectores")
        .onSnapshot((response) => {
          listarRegistro(response);
        });
      db.collection("ConfiguracionesGenerales")
        .doc("ListaTablasConfiguracion")
        .onSnapshot((response) => {
          listarTablasConfiguracion(response);
        });
      db.collection("ConfiguracionesGenerales")
        .doc("ConfiguracionesApiGoogle")
        .onSnapshot((response) => {
          listarConfiguracionApi(response);
        });
    } else {
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
const listarRegistro = (response) => {
  let divEsquemas = document.getElementById("divEsquemas");
  divEsquemas.style = "display:none";
  opciones = response.data();
  let divTable = document.getElementById("tblConfiguraciones");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaOpcionesSelectores";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);

  var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Lista de Selectores</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";
  const listaNombreOpciones = Object.keys(opciones);
  listaNombreOpciones.forEach((nombreOpcion) => {
    contenido += `
    <tr id="${nombreOpcion}"  onclick="editarOpcion('${nombreOpcion}')" style="cursor: pointer;">
      <td>${nombreOpcion}</td>
    </tr>
                `;
  });

  contenido += `</tbody></table>`;

  $("#tablaOpcionesSelectores").html(contenido);
  var tablaRegistros = $("#tablaOpcionesSelectores")
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
      select: true,
    })
    .buttons()
    .container()
    .appendTo("#tablaOpcionesSelectores_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaOpcionesSelectores tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**
 * Muestra listado de selectores
 */
const showDivs = (divSelected) => {
  const listDivs = ["divEsquemas", "divSelectores", "divConfiguracionApi"];

  listDivs.forEach((div) => {
    if (divSelected === div) {
      let divSelect = document.getElementById(divSelected);
      divSelect.style = "";
    } else {
      let divSelect = document.getElementById(div);
      divSelect.style = "display:none";
    }
  });
};

/**
 * Modificar opciones de selectores
 */
const editarOpcion = (nombreOpcion) => {
  opcionesbyConfiguracion = opciones[nombreOpcion];
  nombreOpcionActual = nombreOpcion;
  renderizarOpciones();
};

const renderizarOpciones = () => {
  if (opcionesbyConfiguracion?.length) {
    let divTable = document.getElementById("tblConfiguracionesOpciones");
    divTable.innerHTML = "";
    let table = document.createElement("table");
    table.id = "tablaConfiguracionesOpciones";
    table.setAttribute("class", "table table-bordered table-striped");
    divTable.append(table);
    var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Lista de Selectores</th>
            <th class="align-middle">Accion</th>
        </tr>
    </thead>
    `;
    contenido += "<tbody>";
    opcionesbyConfiguracion.forEach((opcion, index) => {
      contenido += `
    <tr id="td_${index}">
      <td> <input
      type="text"
      value="${opcion}"
      id="id_opcion${index}"
      oninput="changeValueOpction(this.value, ${index})"
    /></td>
      <td><button class="btn btn-danger" onclick="borrarOpcion('${index}','${opcion}')" title="Borrar Orden"><i class="far fa-trash-alt"></i></button></td>
    </tr>
                `;
    });
    contenido += `</tbody></table>`;
    $("#tablaConfiguracionesOpciones").html(contenido);
    let divSave = document.getElementById("divSave");
    divSave.innerHTML = `<button type="button" class="form-control btn btn-primary" onclick="agregarMasOpciones()" >
    <i class="fas fa-plus"></i>
  </button>
   <button
    style="margin-top: 20px;"
    type="button"
    class="btn btn-primary"
    onclick="guardarOpciones()"
  >
    Guardar
  </button>`;
  }
};

const agregarMasOpciones = () => {
  opcionesbyConfiguracion.push("");
  renderizarOpciones();
};

const borrarOpcion = (index, opcion) => {
  $(`#td_${index}`).remove();
  if (opcion) {
    opcionesbyConfiguracion = opcionesbyConfiguracion.filter(
      (confi) => confi !== opcion
    );
  } else {
    opcionesbyConfiguracion.pop();
  }
};

const guardarOpciones = () => {
  const existenVacios = opcionesbyConfiguracion.some((option) => option == "");
  if (existenVacios) {
    swal("ERROR!", "Algun campo esta vacio", "warning");
  } else {
    const nuevasOpciones = { [nombreOpcionActual]: opcionesbyConfiguracion };
    db.collection("ConfiguracionesGenerales")
      .doc("catalogoSelectores")
      .update(nuevasOpciones)
      .then(() => {
        swal("Success!", "Configuraciones Actualizadas!", "success");
      })
      .catch((error) => {
        console.log(
          "🚀 ~ file: Configuraciones.js ~ line 179 ~ guardarOpciones ~ error",
          error
        );
      });
  }
};

const changeValueOpction = (value, index) => {
  opcionesbyConfiguracion[index] = value;
};

/**
 * Agregar configuraciones Tablas
 */
const agregarMasOpcionesTablas = () => {
  const campoNuevo = `
  <tr id="td_configTabla${indexConfiguracionTabla}">
      <td> <input
      type="text"
      value=""
      id="id_opcionHeader${indexConfiguracionTabla}"
    /></td>
      <td> <textarea
      type="text"
      id="id_opcion_config${indexConfiguracionTabla}"
    /></textarea></td>
      <td>
      <button class="btn btn-info" onclick="showModalConfigTabla('${indexConfiguracionTabla}')" title="Editar" data-toggle="modal" data-target="#modal-ConfigTabla"><i class="fas fa-pencil-alt"></i></button>
      <button class="btn btn-danger" onclick="borrarOpcionConfigTabla('${indexConfiguracionTabla}')" title="Borrar Orden"><i class="far fa-trash-alt"></i></button>
      </td>
  </tr>
          `;
  $("#tablaConfiguracionesTabla>tbody").append(campoNuevo);
  indexConfiguracionTabla += 1;
};

const borrarOpcionConfigTabla = (indexConfiguracionTabla) => {
  $(`#td_configTabla${indexConfiguracionTabla}`).remove();
};

const listarTablasConfiguracion = (response) => {
  const tablas = response.data();
  let divTable = document.getElementById("tblTablasOpciones");
  divTable.innerHTML = "";
  let table = document.createElement("table");
  table.id = "tablaListaTablas";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);
  let contenido = `
  <table>
  <thead>
      <tr>
          <th class="align-middle">Lista de Tablas</th>
      </tr>
  </thead>
  `;
  tablas.Tablas.forEach((tabla) => {
    contenido += `
    <tr id="${tabla.Nombre}"  onclick="editarOpcionTabla('${tabla.Nombre}')" style="cursor: pointer;">
      <td>${tabla.Nombre}</td>
    </tr>
                `;
  });

  contenido += `</tbody></table>`;

  $("#tablaListaTablas").html(contenido);
  var tablaListaTablas = $("#tablaListaTablas")
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
      select: true,
    })
    .buttons()
    .container()
    .appendTo("#tablaListaTablas_wrapper .col-md-6:eq(0)");
};

const editarOpcionTabla = (Nombre) => {
  tablaActual = Nombre;
  db.collection("ConfiguracionesGenerales")
    .doc(Nombre)
    .onSnapshot((response) => {
      tablaConfig = response.data();
      listarTablaConfiguracion();
    });
};

const listarTablaConfiguracion = () => {
  let divTable = document.getElementById("tblConfiguracionesTabla");
  divTable.innerHTML = "";
  let table = document.createElement("table");
  table.id = "tablaConfiguracionesTabla";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);
  var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Lista de Headers</th>
            <th class="align-middle">Confuguracion</th>
            <th class="align-middle">Accion</th>
        </tr>
    </thead>
    `;
  contenido += "<tbody>";
  indexConfiguracionTabla = tablaConfig.headersSchema.length;
  tablaConfig.headersSchema.forEach((opcion, index) => {
    const valueTextArea = tablaConfig.configSchema[index];
    contenido += `
    <tr id="td_configTabla${index}">
      <td> <input
      type="text"
      value="${opcion}"
      id="id_opcionHeader${index}"
    /></td>
      <td> <textarea
      type="text"
      id="id_opcion_config${index}"
    />${valueTextArea}</textarea></td>
      <td>
      <button class="btn btn-info" onclick="showModalConfigTabla('${index}')" title="Editar" data-toggle="modal" data-target="#modal-ConfigTabla"><i class="fas fa-pencil-alt"></i></button>
      <button class="btn btn-danger" onclick="borrarOpcionConfigTabla('${index}')" title="Borrar Orden"><i class="far fa-trash-alt"></i></button>
      </td>
    </tr>
                `;
  });
  contenido += `</tbody></table>`;
  $("#tablaConfiguracionesTabla").html(contenido);
  let divSave = document.getElementById("divSaveTabla");
  divSave.innerHTML = `<button type="button" class="form-control btn btn-primary" onclick="agregarMasOpcionesTablas()" >
    <i class="fas fa-plus"></i>
  </button>
   <button
    style="margin-top: 20px;"
    type="button"
    class="btn btn-primary"
    onclick="guardarConfuguracionesTablas()"
  >
    Aplicar
  </button>`;
};

const guardarConfuguracionesTablas = () => {
  let opcionesbyConfiguracionTables = { configSchema: [], headersSchema: [] };

  for (let i = 0; i <= indexConfiguracionTabla; i++) {
    const tdExist = document.getElementById("td_configTabla" + i);
    if (tdExist) {
      const id_opcionHeader = $("#id_opcionHeader" + i).val();
      const id_opcion_config = $("#id_opcion_config" + i).val();
      opcionesbyConfiguracionTables.configSchema.push(id_opcion_config);
      opcionesbyConfiguracionTables.headersSchema.push(id_opcionHeader);
    }
  }

  db.collection("ConfiguracionesGenerales")
    .doc(tablaActual)
    .update(opcionesbyConfiguracionTables)
    .then(() => {
      swal("Success!", "Configuraciones Actualizadas!", "success");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: Configuraciones.js ~ line 179 ~ guardarOpciones ~ error",
        error
      );
    });
};

const showModalConfigTabla = (index) => {
  tablaOpcionTextArea = "id_opcion_config" + index;
  tablaOpcionTextAreaValues = tablaConfig.configSchema[index];
  const objOpciones = JSON.parse(tablaOpcionTextAreaValues);
  const listOptions = Object.keys(objOpciones);
  listOptions.forEach((key) => {
    const element = document.getElementById(`${key}_config`);
    element.value = objOpciones[key];
  });
};

const registrarConfiguraciones = () => {
  let objConfig = {};
  listElements.forEach((key) => {
    const elementValue = document.getElementById(`${key}_config`).value;
    objConfig[key] = elementValue;
  });

  Object.keys(objConfig).forEach((key) => {
    if (
      objConfig[key] === undefined ||
      objConfig[key] === null ||
      objConfig[key] === ""
    ) {
      delete objConfig[key];
    }
  });
  const tablaOpcion = document.getElementById(tablaOpcionTextArea);
  tablaOpcion.value = JSON.stringify(objConfig);
  $("#modal-ConfigTabla").modal("hide");
};

/***
 *Configuraciones de Api google
 */

const listarConfiguracionApi = (response) => {
  configApi = response.data();
  const keysConfig = Object.keys(configApi);
  let divTable = document.getElementById("tblConfiguracionApi");
  divTable.innerHTML = "";
  let table = document.createElement("table");
  table.id = "tablaConfiguracionApi";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);
  let contenido = `
  <table>
  <thead>
      <tr>
          <th class="align-middle">Lista de Configuraciones</th>
      </tr>
  </thead>
  `;
  keysConfig.forEach((key) => {
    contenido += `
    <tr id="${key}"  onclick="editarConfiguracionApi('${key}')" style="cursor: pointer;">
      <td>${key}</td>
    </tr>
                `;
  });

  contenido += `</tbody></table>`;

  $("#tablaConfiguracionApi").html(contenido);
  var tablaConfiguracionApi = $("#tablaConfiguracionApi")
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
      select: true,
    })
    .buttons()
    .container()
    .appendTo("#tablaConfiguracionApi_wrapper .col-md-6:eq(0)");
};

const editarConfiguracionApi = (key) => {
  let divConfiguracionEditApi = document.getElementById(
    "divConfiguracionEditApi"
  );
  divConfiguracionEditApi.innerHTML = `
      <textarea
      style=" min-width:500px; max-width:100%;min-height:200px;height:100%;width:100%;"
        type="text"
        id="id_configApiGoogle${key}"
      />${JSON.stringify(configApi[key])}</textarea>

      <button
    style="margin-top: 20px;"
    type="button"
    class="btn btn-primary"
    onclick="guardarConfiguracionApi('${key}')"
  >
    Aplicar
  </button>
    `;
};

const guardarConfiguracionApi = (key) => {
  let id_configApiGoogle = document.getElementById(`id_configApiGoogle${key}`);
  try {
    const jsonValue = JSON.parse(id_configApiGoogle.value);
    db.collection("ConfiguracionesGenerales")
      .doc("ConfiguracionesApiGoogle")
      .update({ [key]: jsonValue })
      .then(() => {
        swal("Success!", "Configuraciones Actualizadas!", "success");
      })
      .catch((error) => {
        console.log(
          "🚀 ~ file: Configuraciones.js ~ line 179 ~ guardarOpciones ~ error",
          error
        );
      });
  } catch (error) {
    swal("Error!", "Error en estructura de JSON!", "error");
  }
};
