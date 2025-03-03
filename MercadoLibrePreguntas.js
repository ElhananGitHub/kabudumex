var db = firebase.firestore();
var storage = firebase.storage();
let permisosUsuario;
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    //logger("Venta", "Ingreso");
    let response = responseConfig.data();
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "MercadoLibre Preguntas"
    );
    permisosUsuario = tienePermiso;
    if (tienePermiso) {
        //console.log(tienePermiso)

      // Obtenemos las Ventasde 10 dias
      var dateQuery = new Date();
      dateQuery.setDate(dateQuery.getDate() - 10)
      // Obtenemos las Ventas de firebase
      db.collection("MLPreguntas")
        .onSnapshot((response) => {
          //console.log(response);
          listarRegistro(response, 10);
        });
    } else {
      if (window.confirm("No tienes permisos para acceder.")) {
        document.location.href = "./";
      } else {
        document.location.href = "./";
      }
    }
  });

// Buscamos las respuestas para las preguntas de MercadoLibre y generamos los options que mandaremos después al select
var optionsRespuestasML = "";

db.collection("ConfiguracionesGenerales")
  .doc("catalogoSelectores")
  .onSnapshot((response) => {

    datos = response.data();

    var respuestasML = `<option value="">seleccionar</option>`;

    for (var i in datos.RespuestasML) {

      // Son las variaciones de la publicacion padre y es lo que mostraremos en el selector
      respuestasML += `<option value="${datos.RespuestasML[i]}" >${i}</option>`;

    }

    // Almacenamos los options para replicarlos cada que se cree un nuevo select de Publicaiones de MercadoLibre
    optionsRespuestasML = respuestasML;
    console.log('cargado');

  });
  

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10) => {
  // console.log('listarRegistro');

  let divTable = document.getElementById("divTabla");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaPreguntas";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
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
            <th class="align-middle">ID</th>
            <th class="align-middle">Fecha</th>
            <th class="align-middle">Imagen</th>

            <th class="align-middle">Publicacion</th>
            <th class="align-middle">Nickname</th>
            <th class="align-middle">Pregunta</th>

            <th class="align-middle">#</th>
            <th class="align-middle">Respuesta</th>
            <th class="align-middle">Fecha Respuesta</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
  
    let datos = response_data.data();
    let {
      preguntaID,
      fechaPregunta,
      pregunta,
      status,

      respuesta,
      statusRespuesta,
      fechaRespuesta,

      tituloPublicacion,
      precio,
      urlPublicacion,
      urlImagen,
      urlSecureImagen,
      skuPublicacion,
      nickname,

    } = datos;

    if(fechaRespuesta != undefined){
      fechaRespuesta = formatoFechaHora(fechaRespuesta);
      class_respuesta = 'text-success';
    }else{
      fechaRespuesta = '';
      class_respuesta = 'text-dark';
    }



    // Generamos el contenido de la tabla
    contenido += `
      <tr id="${response_data.id}">

          <td>${preguntaID}</td>
          <td>${formatoFechaHora(fechaPregunta)}</td>
          <td><img src="${urlSecureImagen}"></td>

          <td><a href="${urlPublicacion}" target="_blank">${tituloPublicacion} - Precio:${toCurrencyMXN(precio)}</a></td>
          <td>${nickname}</td>
          <td>${pregunta}</td>

          <td><i class="fas fa-question-circle fa-2x cur-pointer ${class_respuesta}" title="Responder" onclick="responderPregunta()"></i></td>
          <td>${respuesta}</td>
          <td>${fechaRespuesta}</td>
                    
      </tr>
      `;

  });

  //<i class="fas fa-search"></i>


  contenido += "</tbody></table>";

  $("#tablaPreguntas").html(contenido);

  var tablaRegistros = $("#tablaPreguntas")
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
        /*
        {
          targets: [4],
          visible: false,
        },
        */


      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 0 || i == 1 || i == 3) {
            var column = api.column(i);
            var select = $(
              '<select style="width:120px"><option value="">Selecciona</option></select>'
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
    .appendTo("#tablaPreguntas_wrapper .col-md-6:eq(0)");
};


const responderPregunta = () => {

  // Limpiamos los valores del modal
  $('#respuestaList option[value=""]').attr("selected",true);
  $("#respuestaText").val('');

  // Agregamos los valores al select
  $("#respuestaList").html(optionsRespuestasML);

  // Abrimos el modal
  $("#modal-respuesta").modal("show");

  
  
}

const respuestaSelected = () => {

  // Obtenemos el valor del select si se seleccionó
  let respuesta = $("#respuestaList").val();

  // Mostramos la respuesta en el parrafo
  $("#respuestaView").html(respuesta);

}