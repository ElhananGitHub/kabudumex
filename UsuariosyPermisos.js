var db = firebase.firestore();
var storage = firebase.storage();
let datosUsuario = {};
let listaPermisosPosibles = [];
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Usuarios y Permisos","Ingreso")
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Usuarios y Permisos"
    );
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    if (tienePermiso) {
      db.collection("Usuarios").onSnapshot((response) => {
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
  let divTable = document.getElementById("tblContabilidad");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaUsuariosPermisos";
  table.setAttribute("class", "table table-bordered table-striped");
  divTable.append(table);

  var contenido = `
    <table>
    <thead>
        <tr>
            <th class="align-middle">Email</th>
            <th class="align-middle">UID</th>
            <th class="align-middle">Modulos</th>
            <th class="align-middle">Opciones</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let { email, modulos } = datos;

    const listadoModulos = () => {
      if (modulos?.length) {
        return modulos.map((modulo) => `<li>${modulo.modulo}</li>`).join("");
      } else {
        return "&nbsp;";
      }
    };
    contenido += `
    <tr id="${response_data.id}">
      <td>${email}</td>
      <td>${response_data.id}</td>
      <td>${listadoModulos()}</td>
      <td> 
          <button class="btn btn-info" onclick="editarPermisos('${
            response_data.id
          }')" title="Editar" data-toggle="modal" data-target="#modal-editar"><i class="fas fa-pencil-alt"></i></button>
      </td>
    </tr>
                `;
  });

  contenido += `</tbody></table>`;

  $("#tablaUsuariosPermisos").html(contenido);

  var tablaRegistros = $("#tablaUsuariosPermisos")
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
          targets: [1],
          visible: true
        },
      ],
      select: true,
    })
    .buttons()
    .container()
    .appendTo("#tablaUsuariosPermisos_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  // Seleccionar un registro de la tabla (solo es visual)
  $("#tablaUsuariosPermisos tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

const editarPermisos = (uuidUser) => {
  db.collection("ConfiguracionesGenerales")
    .doc("catalogoPermisos")
    .get()
    .then((responseConfig) => {
      llenaTablaPermisosPosibles(responseConfig, "tblPermisosEditar");

      db.collection("Usuarios")
        .doc(uuidUser)
        .get()
        .then((responseConfig) => {
          let datosConfig = responseConfig.data();
          datosUsuario = datosConfig;
          datosUsuario.id = responseConfig.id;
          datosConfig.modulos.forEach((modulo) => {
            const checkbox = document.getElementById(`id_${modulo.modulo}`);
            checkbox.checked = true;
            if (modulo?.opciones?.length) {
              modulo.opciones.forEach((opcion) => {
                const checkboxOpcion = document.getElementById(
                  `id_opcion_${opcion}`
                );
                checkboxOpcion.checked = true;
              });
            }
          });
          const emailEdit = document.getElementById("emailEdit");
          emailEdit.value = datosConfig.email;
        });
    });
};

const llenaTablaPermisosPosibles = (responseConfig, tablaNombre) => {
  const tblPermisos = document.getElementById(tablaNombre);
  tblPermisos.innerHTML = "";
  let datosConfig = responseConfig.data();
  listaPermisosPosibles = datosConfig.modulos;
  let tblConetent = "";
  tblConetent = ` <table class="table table-bordered" >
  <thead>
    <tr>
      <th>Permisos</th>
    </tr>
  </thead>
  <tbody>`;
  datosConfig.modulos.forEach((modulo) => {

    tblConetent += `<tr><td>
    <div class="form-check">
    <input
      class="form-check-input"
      type="checkbox"
      value="${modulo.modulo}"
      id="id_${modulo.modulo}"
    />
    <label
      class="form-check-label"
      for="flexCheckDefault"
    >
    ${modulo.modulo}
    </label>

    ${
      modulo.opciones
        ? modulo.opciones.map(
            (opcion) =>
              `<div class="form-check">
    <input
      class="form-check-input"
      type="checkbox"
      value="${modulo.modulo}"
      id="id_opcion_${opcion}"
    />
    <label
      class="form-check-label"
      for="flexCheckDefault"
    >
    ${opcion}
    </label>
  </div>`
          ).join("")
        : ""
    }

  </div>
  
  </td></tr>`;
  });
  tblConetent += ` </tbody></table>`;
  tblPermisos.innerHTML = tblConetent;
};

const guardarPermisosEditados = () => {
  const emailEdit = document.getElementById("emailEdit").value;
  let nuevosPermisos = [];
  listaPermisosPosibles.forEach((modulo) => {
    const checkbox = document.getElementById(`id_${modulo.modulo}`);

    if (checkbox.checked) {
      let listOpciones = [];
      if (modulo?.opciones) {
        modulo?.opciones.forEach((opcion) => {
          const checkboxOpcion = document.getElementById(`id_opcion_${opcion}`);
          if (checkboxOpcion.checked) {
            listOpciones.push(opcion);
          }
        });
      }
      nuevosPermisos.push({ modulo: modulo.modulo, opciones: listOpciones });
    }
  });

  db.collection("Usuarios")
    .doc(datosUsuario.id)
    .update({
      email: emailEdit,
      modulos: nuevosPermisos,
    })
    .then(() => {
      swal("Success!", "Usuario Actualizado!", "success");
      $("#modal-editar").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: UsuariosyPermisos.js ~ line 240 ~ guardarPermisosEditados ~ error",
        error
      );
    });
};

const agregarNuevoUsuario = () => {
  db.collection("ConfiguracionesGenerales")
    .doc("catalogoPermisos")
    .get()
    .then((responseConfig) => {
      llenaTablaPermisosPosibles(responseConfig, "tblPermisosAdd");
    });
};

const guardarNuevoUsuario = () => {
  const email = document.getElementById("emailFirebase").value;
  const idFirebase = document.getElementById("idFirebase").value;
  let nuevosPermisos = [];
  listaPermisosPosibles.forEach((modulo) => {
    const checkbox = document.getElementById(`id_${modulo.modulo}`);
    if (checkbox.checked) {
      let listOpciones = [];
      if (modulo?.opciones) {
        modulo?.opciones.forEach((opcion) => {
          const checkboxOpcion = document.getElementById(`id_opcion_${opcion}`);
          if (checkboxOpcion.checked) {
            listOpciones.push(opcion);
          }
        });
      }
      nuevosPermisos.push({ modulo: modulo.modulo, opciones: listOpciones });
    }
  });

  db.collection("Usuarios")
    .doc(idFirebase)
    .set({
      email,
      modulos: nuevosPermisos,
    })
    .then(() => {
      swal("Success!", "Usuario Configurado!", "success");
      $("#modal-addUser").modal("hide");
    })
    .catch((error) => {
      console.log(
        "🚀 ~ file: UsuariosyPermisos.js ~ line 287 ~ guardarNuevoUsuario ~ error",
        error
      );
    });
};
