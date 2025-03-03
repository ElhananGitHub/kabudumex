var db = firebase.firestore();
var storage = firebase.storage();

const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Clientes", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Clientes"
    );
    if (tienePermiso) {
      db.collection("Clientes").onSnapshot((response) => {
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
/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10) => {
  console.log("listarRegistro");
  //console.log(response)

  let divTable = document.getElementById("tblCliente");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaCliente";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">Cliente</th>
            <th class="filterhead">Contacto</th>
            <th class="filterhead">Telefono</th>
            <th class="filterhead">Email</th>
            <th class="filterhead">Domicilio de Entrega</th>
            <th class="filterhead">&nbsp;</th>
        </tr>
    </tfoot>
    <thead>
        <tr>
            <th class="align-middle">#</th>
            <th class="align-middle text-center">
                <div class="col-12">
                    <button class="btn btn-warning m-bottom-10 d-inline-block" onclick="edicionMultiple()">Editar</button>
                    <button class="btn btn-danger m-bottom-10 d-inline-block" onclick="borrarMultiple()">Borrar</button>
                </div>
                <div class="col-12">
                    <label for="selectAll" class="cursor-pointer">Seleccionar</label> <input type="checkbox" class="cursor-pointer" id="selectAll" onchange="selectAll()">
                </div>
            </th>
            <th class="align-middle">Cliente</th>
            <th class="align-middle">Contacto</th>
            <th class="align-middle">Teléfono</th>
            <th class="filterhead">Email</th>
            <th class="align-middle">Domicilio de Entrega</th>
            <th class="align-middle">Opciones</th>
        </tr>

    </thead>
    `;

  contenido += "<tbody>";

  i = 1;
  response.forEach((response_data) => {
    //console.log(response_data.data())
    let datos = response_data.data();

    // Generamos el contenido de la tabla
    contenido += `
        <tr id="${response_data.id}">
            <td>${i}</td>
            <td class="text-center"><input type="checkbox" name="cliente" value="${
              response_data.id
            }" class="checkCliente"></td>
            <td>${datos.nombre_cliente}</td>
            <td>${datos.nombre_contacto}</td>
            <td>${datos.telefono_contacto}</td>
            <td>${datos.email_contacto ?? ""}</td>
            <td>${datos.direccion_entrega}</td>
            <td>
            <button class="btn btn-warning" onclick="showModalEdit('${
              response_data.id
            }')" data-toggle="modal" data-target="#modal-edit"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn btn-danger" onclick="borrarRegistro('${
              response_data.id
            }')"><i class="far fa-trash-alt"></i></button>
            </td>
        </tr>
        `;
    i++;
  });

  contenido += "</tbody></table>";

  $("#tablaCliente").html(contenido);

  var tablaRegistros = $("#tablaCliente")
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
          title: "Excel Clientes",
          className: "btn-dark",
          exportOptions: {
            columns: [2, 3, 4, 5],
          },
        },
        {
          extend: "pdf",
          text: "PDF",
          title: "PDF Clientes",
          className: "btn-dark",
          exportOptions: {
            columns: [2, 3, 4, 5],
          },
        },
        {
          extend: "print",
          text: "Imprimir",
          title: "Imprimir",
          className: "btn-dark",
          pageSize: "A4",
          orientation: "landscape",
          exportOptions: {
            columns: [2, 3, 4, 5],
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
          visible: false,
        },
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i != 0 && i != 1 && i != 6) {
            var column = api.column(i);
            var select = $('<select><option value=""></option></select>')
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
      }, // init
    })
    .buttons()
    .container()
    .appendTo("#tablaCliente_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  $("#tablaCliente tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
  /*
    $('#button').click( function () {
        alert( tablaRegistros.rows('.selected').data().length +' row(s) selected' );
    } );
    */
});

/**************************************************/
/* AGREGAR REGISTRO */
// Agrega el registro a firebase
const agregarRegistro = () => {
  console.log("agregarRegistro");

  // Obtenemos los valores capturados en la ventana modal
  let nombre_cliente = $("#nombre_cliente").val();
  let nombre_contacto = $("#nombre_contacto").val();
  let telefono_contacto = $("#telefono_contacto").val();
  let email_contacto = $("#email_contacto").val();
  let direccion_entrega = $("#direccion_entrega").val();

  // Agregamos a la colección
  db.collection("Clientes")
    .add({
      nombre_cliente: nombre_cliente,
      nombre_contacto: nombre_contacto,
      telefono_contacto: telefono_contacto,
      email_contacto,
      direccion_entrega: direccion_entrega,
    })
    .then((response) => {
      console.log("add cliente success");
      //console.log(response)

      let id = response.id;

      limpiarModal();
      $("#modal-add").modal("hide");
    })
    .catch((error) => {
      //console.log("add cliente failed")
      console.log(error);
    });
};

/**************************************************/
/* LIMPIAR MODAL */
// Se limpian los campos del modal cuando se agrega un registro
const limpiarModal = () => {
  $("#nombre_cliente").val("");
  $("#nombre_contacto").val("");
  $("#telefono_contacto").val("");
  $("#email_contacto").val("");
  $("#direccion_entrega").val("");
};

/**************************************************/
/* SHOW MODAL EDIT */
// Abre la ventana modal para edición y muestra la información de los campos
const showModalEdit = (id) => {
  //console.log('showModalEdit')
  //console.log('id: '+id)

  // Recuperamos la información en firebase con el ID
  db.collection("Clientes")
    .doc(id)
    .get()
    .then((response) => {
      //console.log("consulta cliente success")
      //console.log(response.data())

      let datos = response.data();

      // Mostramos la consulta en los campos
      $("#nombre_cliente_edit").val(datos.nombre_cliente);
      $("#nombre_contacto_edit").val(datos.nombre_contacto);
      $("#telefono_contacto_edit").val(datos.telefono_contacto);
      $("#email_contacto_edit").val(datos.email_contacto);
      $("#direccion_entrega_edit").val(datos.direccion_entrega);

      $("#id_edit").val(id);
    })
    .catch((error) => {
      //console.log("consulta cliente failed")
      console.log(error);
    });
};

/**************************************************/
/* EDITAR REGISTRO */
// Edita el registro seleccionado en firebase
const editarRegistro = () => {
  let nombre_cliente = $("#nombre_cliente_edit").val();
  let nombre_contacto = $("#nombre_contacto_edit").val();
  let telefono_contacto = $("#telefono_contacto_edit").val();
  let email_contacto = $("#email_contacto_edit").val();
  let direccion_entrega = $("#direccion_entrega_edit").val();
  let id = $("#id_edit").val();

  //console.log(`id: ${id}, nombre_cliente: ${nombre_cliente}, nombre_contacto: ${nombre_contacto}, telefono_contacto: ${telefono_contacto}, direccion_entrega: ${direccion_entrega}`)

  db.collection("Clientes")
    .doc(id)
    .update({
      nombre_cliente: nombre_cliente,
      nombre_contacto: nombre_contacto,
      telefono_contacto: telefono_contacto,
      direccion_entrega: direccion_entrega,
      email_contacto
    })
    .then((response) => {
      //console.log("upd cliente success")
      //console.log(response)

      $("#modal-edit").modal("hide");
    })
    .catch((error) => {
      //console.log("upd cliente failed")
      console.log(error);
    });
};

/**************************************************/
/* BORRAR REGISTRO */
// Elimina el registro seleccionado en firebase
const borrarRegistro = (id) => {
  console.log("borrarRegistro");

  if (confirm("¿Deseas eliminar el registro?") == 1) {
    db.collection("Clientes")
      .doc(id)
      .delete()
      .then(() => {
        console.log("Document successfully deleted!");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
  }
};

/**************************************************/
/* EDICIÓN MULTIPLE */
// Se abre una ventana modal y se muestran todos los registros que se seleccionaron para Editar
const edicionMultiple = () => {
  //console.log('edicionMultiple')

  var contenido = "";
  var tbody = "";

  var checkedBox = $.map(
    $('input:checkbox[name="cliente"]:checked'),
    function (val, i) {
      // value, index
      //console.log("indx: "+i)
      // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
      let id = val.value;
      //console.log("id: "+id)
      // Recuperamos la información en firebase con el ID
      db.collection("Clientes")
        .doc(id)
        .get()
        .then((response) => {
          //console.log("consulta cliente success")
          //console.log(response.data())

          let datos = response.data();

          // Generamos el contenido de la tabla
          contenido += `
            <tr>
                <td><input type="text" class="form-control" id="nombre_cliente_edit_${response.id}" value="${datos.nombre_cliente}"></td>
                <td><input type="text" class="form-control" id="nombre_contacto_edit_${response.id}" value="${datos.nombre_contacto}"></td>
                <td><input type="text" class="form-control" id="telefono_contacto_edit_${response.id}" value="${datos.telefono_contacto}"></td>
                <td><input type="text" class="form-control" id="email_contacto_edit_${response.id}" value="${datos.email_contacto}"></td>
                <td><input type="text" class="form-control" id="direccion_entrega_edit_${response.id}" value="${datos.direccion_entrega}"></td>
            </tr>
            `;
          $("#edicionMultiple tbody").html(contenido);
        })
        .catch((error) => {
          //console.log("consulta mercancia failed")
          console.log(error);
        });

      return val.value;
    }
  );

  $("#modal-edit-multiple").modal("show");

  $("#id_edit_multiple").val(checkedBox);
};

/**************************************************/
/* ACTUALZIAR MULTIPLE */
// Edita los registros seleccionados en firebase
const actualizarMultiple = () => {
  //console.log("actualizarMultiple")

  var id_edit_multiple = $("#id_edit_multiple").val();
  var arrayID = id_edit_multiple.split(",");
  let total_registros = arrayID.length;

  if (total_registros > 0) {
    for (x = 0; x < total_registros; x++) {
      var id = arrayID[x];
      let nombre_cliente = $("#nombre_cliente_edit_" + id).val();
      let nombre_contacto = $("#nombre_contacto_edit_" + id).val();
      let telefono_contacto = $("#telefono_contacto_edit_" + id).val();
      let email_contacto = $("#email_contacto_edit_" + id).val();
      let direccion_entrega = $("#direccion_entrega_edit_" + id).val();

      db.collection("Clientes")
        .doc(id)
        .update({
          nombre_cliente: nombre_cliente,
          nombre_contacto: nombre_contacto,
          telefono_contacto: telefono_contacto,
          direccion_entrega: direccion_entrega,
          email_contacto
        })
        .then((response) => {
          //console.log("upd mercancia nultiple success")
          //console.log(response)
        })
        .catch((error) => {
          //console.log("upd mercancia multiple failed")
          console.log(error);
        });
    }
  }

  $("#modal-edit-multiple").modal("hide");
};

/**************************************************/
/* BORRAR MULTIPLE */
// Elimina los registros seleccionados en firebase
const borrarMultiple = () => {
  //console.log("borrarMultiple")

  if (confirm("¿Deseas eliminar los registros seleccionados?") == 1) {
    var checkedBox = $.map(
      $('input:checkbox[name="cliente"]:checked'),
      function (val, i) {
        // value, index
        // Se procesan los ID's de los Clientes que se eliminaran
        let id = val.value;
        //console.log("id: "+id)

        db.collection("Clientes")
          .doc(id)
          .delete()
          .then(() => {
            console.log("Document successfully deleted!");
          })
          .catch((error) => {
            console.error("Error removing document: ", error);
          });

        return val.value;
      }
    );
  }
  //console.clear();
  console.log(checkedBox);
};

/**************************************************/
/* SELECT ALL */
// Sleccionar todos los registros
const selectAll = () => {
  console.log("selectAll");

  // Seleccionar los checkbox
  if ($(".checkCliente").length != $(".checkCliente:checked").length) {
    $(".checkCliente").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkCliente").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }

  // Deseleccionar los checkbox
  if ($(".checkCliente").length == $(".checkCliente:checked").length) {
    $(".checkCliente").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkCliente").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }
};
