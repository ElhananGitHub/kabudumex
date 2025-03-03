var db = firebase.firestore();
var storage = firebase.storage();
let infoInventario = [];
let datosMercanciaSeleccionada = {};
let permisosAdicionales = [];
const uid = JSON.parse(sessionStorage.user).uid;
const user = JSON.parse(sessionStorage.user);
let skuSumarMercancia = "";
let datosEnTabla = [];

const TABLE_NAME = "Mercancia";
var baseDeDatos = TABLE_NAME;

db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    let response = responseConfig.data();
    logger("Mercancia", "Ingreso");
    //Se revisa que el usuario tenga los permisos para acceder al modulo
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Mercancia"
    );
    permisosAdicionales = tienePermiso.opciones;
    //console.log(permisosAdicionales);
    if (tienePermiso) {
      selectsOptionsFilter();
    } else {
      if (window.confirm("No tienes permisos para acceder.")) {
        document.location.href = "./";
      } else {
        document.location.href = "./";
      }
    }

    if (permisosAdicionales.includes("EditarCostoUnitario")) {
      $("#divCostoUnitario").show();
    }
  });

const formatoFechaNow = () => {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, "0")}-${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
};

// Recuperamos la información en firebase con el ID del consecutivo
db.collection("ConfiguracionesGenerales")
  .doc("9vECPN3cIoVqVarSOlNZ")
  .onSnapshot((response) => {
    let datos = response.data();

    //Guardamos el consecutivo en una variable
    let consecutivo = parseInt(datos.ultimo);

    // Asignamos el consecutivo a un input
    $("#consecutivo").val(consecutivo);
  });

const formatoFecha = (fechaVenta) => {
  const dt = new Date(fechaVenta.seconds * 1000);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString().padStart(2, "0")}/${dt.getDate()
      .toString().padStart(2, "0")}  ${dt.getHours()
        .toString().padStart(2, "0")}:${dt.getMinutes()
          .toString().padStart(2, "0")}`;
};

const formatoFechaSegundos = (fechaSegundos) => {
  const dt = new Date(fechaSegundos);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString().padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFechaJSaRegular = (fecha) => {
  if (typeof fecha == "string") { return fecha }
  const dt = new Date(fecha);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};


// Buscamos las publicaciones de MercadoLibre y generamos los options que mandaremos después a los select
var skusPublicacionesML = "";

db.collection("ConfiguracionesGenerales")
  .doc("referenciasPublicaciones")
  .onSnapshot((response) => {
    //console.log(response)
    //console.log(response.data());

    datos = response.data();

    var publicacionML = `<option value="">seleccionar</option>`;

    datos.referenciasPublicaciones.forEach((response_data) => {
      //console.log(response_data);

      var responseDataSplited = response_data.split("|");
      var skuML = responseDataSplited[1]
      //console.log(responseDataSplited);


      // Son las variaciones de la publicacion padre y es lo que mostraremos en el selector
      publicacionML += `<option value="${skuML}" >${skuML}</option>`;


    });

    // Almacenamos los options para replicarlos cada que se cree un nuevo select de Publicaiones de MercadoLibre
    skusPublicacionesML = publicacionML;
    //console.log('cargado');

  });

const generarQR = (response) => {
  //console.log("generarQR")
  //console.log(response)

  // Obtenemos el div contenedor
  var divQR = document.getElementById("qrDiv");
  divQR.innerHTML = "";
  var imagenesQR = new Array();

  response.forEach((response_data) => {
    let datos = response_data.data();
    //console.log(datos)

    var id = response_data.id;
    var sku = datos.sku;

    let imgQR = document.createElement("img");
    imgQR.id = "imgQR_" + id;

    divQR.append(imgQR);

    new QRious({
      element: document.querySelector("#imgQR_" + id),
      value: sku, // La URL o el texto
      size: 120,
      backgroundAlpha: 0, // 0 para fondo transparente
      foreground: "#000000", // Color del QR
      level: "H", // Puede ser L,M,Q y H (L es el de menor nivel, H el mayor)
    });

    //console.log(imgQR)

    imagenesQR.push({
      id: id,
      src: imgQR.src,
    });
  });

  //console.log(imagenesQR)
  return imagenesQR;
};

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad = 10) => {

  // Generamos ql QR con el SKU
  var arrayQR = generarQR(response);

  let divTable = document.getElementById("tblMercancia");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaMercancia";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <tfoot>
        <tr>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">Número Órden Compra</th>
            <th class="filterhead">Categoría</th>
            <th class="filterhead">Producto</th>
            <th class="filterhead">Variación</th>
            <th class="filterhead">&nbsp;</th>
            <th class="filterhead">SKU ML</th>
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
            <th class="align-middle">QR</th>
            <th class="align-middle">Número Órden Compra</th>
            <th class="align-middle">Categoría</th>
            <th class="align-middle">Producto</th>
            <th class="align-middle">Variación</th>
            <th class="align-middle">SKU</th>
            <th class="align-middle">SKU ML</th>
            <th class="align-middle">Cantidad (Bultos) Comprados</th>
            <th class="align-middle">Cantidad (Bultos) Disponible</th>
            <th class="align-middle">Cantidad (Bultos) Vendidos</th>
            <th class="align-middle">Unidad de Medida</th>
            <th class="align-middle">Kg/Mts/Pz</th>
            <th class="align-middle">Ubicación</th>
            <th class="align-middle">Sub-Ubicación</th>
            <th class="align-middle">Proveedor</th>
            <th class="align-middle">Identificador de Pieza</th>
            <th class="align-middle">Numero de pedimento</th>
            <th class="align-middle">Codigo Proveedor</th>
            <th class="align-middle">Fecha de Compra</th>
            <th class="align-middle">Fecha de Registro</th>
            <th class="align-middle">Comentarios</th>
            <th class="align-middle">Foto</th>
            <th class="align-middle">Opciones</th>
        </tr>

    </thead>
    `;

  contenido += "<tbody>";

  i = 1;
  const puedeEditarOpciones = permisosAdicionales?.find(
    (opciones) => opciones === "editarOpciones"
  );

  const EditarMercancia = permisosAdicionales?.find(
    (opciones) => opciones === "EditarMercancia"
  );
  const SumarMercancia = permisosAdicionales?.find(
    (opciones) => opciones === "SumarMercancia"
  );
  let mercancia = [];
  let counterData = 0;
  response.forEach((response_data) => {
    counterData++;
    let datos = response_data.data();
    //console.log(datos);
    datosEnTabla.push(datos);
    // Se almacena la mercancia para la impresión de Etiquetas
    mercancia.push(datos);
    //console.log("🚀 ~ file: mercancia.js ~ line 197 ~ response.forEach ~ datos", datos)

    var imagenQR = "";

    // Buscamos la imagen QR que vamos a colocal en la tabla
    const qr = arrayQR.find((arrQR) => {
      if (arrQR.id === response_data.id) {
        imagenQR = `<img src="${arrQR.src}" id="img_qr_${arrQR.id}" width="110" height="110">`;
      }
    });
  
    let foto = datos.foto
    if(datos.url_imagen != ''){
      foto = datos.url_imagen;
    }

    

    // Generamos el contenido de la tabla
    contenido += `
        <tr id="${response_data.id}">
            <td>${i}</td>
            <td class="text-center"><input type="checkbox" name="mercancia" id="${datos.sku
      }" value="${response_data.id}" class="checkMercancia"></td>
            <td>${imagenQR}</td>
            <td>${datos.numero_orden_compra}</td>
            <td>${datos.categoria}</td>
            <td>${datos.producto}</td>
            <td>${datos.variacion}</td>
            <td>${datos.sku}</td>
            <td>${datos.skuML?.join(",") ?? ""}</td>
            <td>${datos.cantidad_comprada}</td>
            <td>${datos.cantidad_disponible}</td>
            <td>${datos.cantidad_vendida}</td>
            <td>${datos.medida_fisica}</td>
            <td>${datos.unidades_compradas}</td>
            <td>${datos.ubicacion}</td>
            <td>${datos.sub_ubicacion}</td>
            <td>${datos.proveedor}</td>
            <td>${datos.identificador_pieza}</td>
            <td>${datos.numeroPedimento ? datos.numeroPedimento : ""}</td>
            <td>${datos.CodigoProveedor ? datos.CodigoProveedor : ""}</td>
            <td>${formatoFechaSegundos(datos.fecha_compra)}</td>
            <td>${formatoFechaSegundos(datos.fecha_registro)}</td>
            <td>${datos.comentarios ? datos.comentarios : ""}</td>
            <td><img src="${foto}" width="100"></td>
            <td>
            ${datos.orden_cerrada
              ? ""
              : `
                        ${EditarMercancia
                ? `<button class="btn btn-warning" onclick="showModalEdit('${response_data.id}')" data-toggle="modal" data-target="#modal-edit"><i class="fas fa-pencil-alt"></i></button>`
                : ""
              }
                    <button class="btn btn-danger" onclick='borrarRegistro(${JSON.stringify({ "id": response_data.id, datos })
              })'><i class="far fa-trash-alt"></i></button>
                        `
            }

            ${SumarMercancia
              ? `<button class="btn btn-info" onclick="showModalSumarMercancia('${datos.sku}')" data-toggle="modal" data-target="#modal-SumarMercancia"><i class="fas fa-cart-plus"></i></button>`
              : ""
            }

            ${datos.historicoMercancia
              ? `<button class="btn btn-info" onclick="detalleHistorico('${datos.sku}')" title="Detalle de mercancia" data-toggle="modal" data-target="#modal-detalle"><i class="fas fa-eye"></i></button>`
              : ""
            }

            ${datos.historialMovimientos
              ? `<button class="btn btn-info" onclick="verHistorial('${datos.sku}')" title="Detalle de mercancia"><i class="fas fa-eye"></i></button>`
              : ""
            }

            ${puedeEditarOpciones
              ? ` <button class="btn btn-danger" onclick="showModalEditOpciones('${datos.numero_orden_compra}',${datos.orden_cerrada})" data-toggle="modal" data-target="#modal-editOpciones"><i class="fas fa-check"></i></button>`
              : ""
            }
            <button class="btn btn-dark" onclick="imprimirQRPDF('${datos.sku}','${datos.unidades_compradas}','${datos.numero_orden_compra}','${datos.categoria}','${datos.producto}','${datos.variacion}','${datos.sku}','${datos.skuML?.join(",") ?? ""}')"><i class="fas fa-qrcode"></i></button>
            <button class="btn btn-dark" onclick="verCostosMercancia('${response_data.id}')"><i class="fas fa-dollar-sign"></i></button>
            </td>
        </tr>
        `;
    i++;
  });

  //console.log(mercancia);

  // Eliminamos todos los registros
  localStorage.removeItem("mercancia");

  // Guardamos los registros en el Storage
  localStorage.setItem("mercancia", JSON.stringify(mercancia));

  loggerMercancia(counterData);

  contenido += "</tbody></table>";

  $("#tablaMercancia").html(contenido);

  var tablaRegistros = $("#tablaMercancia")
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
      buttons: [
        "pageLength",
        {
          extend: "excel",
          text: "Excel",
          className: "btn-dark",
          exportOptions: {
            columns: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          },
        },
        {
          extend: "pdfHtml5",
          text: "PDF QR",
          header: false,
          title: "PDF QR",
          duplicate: true,
          className: "btn-dark",
          pageOrientation: "landscape",
          pageSize: "1",
          pageMargins: [5],
          customize: function (doc) {
            createSw({
              title: "Advertencia",
              text: "No cierrre ni refresque esta pagina, se esta cargando el archivo",
              icon: "warning",
              dangerMode: true,
              content: {
                element: "input",
                attributes: {
                  type: "text",
                  disabled: true,
                  id: "idIndexCantidadQR",
                  value: "",
                  style: "border: 0px solid rgba(0,0,0,.14);",
                },
              },
            });
            let jsonPdf = { multiples: { registros: [] } };
            if (doc) {
              const tableMerca = doc.content[1].table.body;
              for (var i = 0; i < tableMerca.length; i++) {
                let idIndexCantidadQR =
                  document.getElementById("idIndexCantidadQR");
                idIndexCantidadQR.value = `Generando archivo ... ${i} de ${tableMerca.length}`;
                const objElemento = { dataQR: "", registro: "" };
                for (j in tableMerca[i]) {
                  //console.log(`i: ${i} - j: ${j}`);
                  //console.log(tableMerca[i][j].text);
                  //console.log(tableMerca[i])
                  if (j > 0) {
                    const textItem = doc.content[1].table.body[i][j].text;
                    let text = textItem ? textItem : "";
                    switch (j) {
                      case "1":
                        text = `O.C.: ${text}\n`;
                        objElemento.registro += text;
                        break;
                      case "2":
                        text = `Categoria: ${text}\n`;
                        objElemento.registro += text;
                        break;
                      case "3":
                        text = `Producto: ${text}\n`;
                        objElemento.registro += text;
                        break;
                      case "4":
                        text = `Variacion: ${text}\n`;
                        objElemento.registro += text;
                        break;
                      case "5":
                        text = `SKU: ${text}\n`;
                        objElemento.registro += text;
                        break;
                      //case "7":
                      // text = `Pedimento: ${text}\n`;
                      // objElemento.registro += text;
                      // break;
                      case "8":
                        text = `SKUML: ${text.replaceAll(",", "-")}`;
                        objElemento.registro += text;
                        break;
                      default:
                        break;
                    }
                    //objElemento.registro += text;
                  }
                }
                jsonPdf.multiples.registros.push(objElemento);
                objElemento.dataQR = tableMerca[i][5].text;
                objElemento.dimensiones = tableMerca[i][6].text;

                
              }
            }

            //console.log(jsonPdf.multiples);
            generarPdfQR(jsonPdf.multiples);
            return null

          },
          exportOptions: {
            columns: [2, 3, 4, 5, 6, 7, 13, 17, 8],
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
            columns: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
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
          targets: [0, 1, 2, 11],
          visible: false,
        },
      ],
      select: true,
      initComplete: function () {
        var api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i == 0 || i == 1 || i == 2 || i == 3 || i == 5) {
            var column = api.column(i + 3);
            var select = $(`<select class="form-control js-example-basic-multiple" name="states${i}[]" multiple="multiple" id="tableSelect${i}"><option value=""></option></select>`)
              .appendTo($(this).empty())
              .on("change", function () {

                var val = $("#tableSelect" + i).val();
                //console.log(val)

                column.search(val).draw;

                // var val = $.fn.dataTable.util.escapeRegex($(this).val());
                // column.search(val ? "^" + val + "$" : "", true, false).draw();
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
    .appendTo("#tablaMercancia_wrapper .col-md-6:eq(0)");

  $('.js-example-basic-multiple').select2({
    placeholder: 'Seleccionar'
  });
};
$(document).ready(function () {
  $("#tablaMercancia tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**************************************************/
/* AGREGAR REGISTRO */
// Agrega el registro a firebase
const agregarRegistro = () => {
  // Recuperamos la información en firebase con el ID del consecutivo
  db.collection("ConfiguracionesGenerales")
    .doc("9vECPN3cIoVqVarSOlNZ")
    .get()
    .then((response) => {
      //console.log("consulta consecutivo success")
      //console.log(response.data())

      let datos = response.data();
      let skuTriadecimal = 0;
      let consecutivo = 0;
      //Guardamos el consecutivo en una variable
      var numeroConsecutivo = parseInt(datos.ultimoMercancia);

      // Generamos el numero consecutivo
      consecutivo = parseInt(numeroConsecutivo);
      skuTriadecimal = toTria(consecutivo);
      let ultimo = parseInt(consecutivo + 1);

      // Actualizamos el consecutivo
      db.collection("ConfiguracionesGenerales")
        .doc("9vECPN3cIoVqVarSOlNZ")
        .update({
          ultimoMercancia: ultimo,
        })
        .then(() => {
          // Obtenemos los valores capturados en la ventana modal
          let numero_orden_compra = $("#numero_orden_compra").val();
          let categoria = $("#categoria").val();
          let producto = $("#producto").val();
          let variacion = $("#variacion").val();
          let identificador_pieza = $("#identificador_pieza").val();
          let medida_fisica = $("#medida_fisica").val();
          let cantidad = $("#cantidad").val();
          let unidades_compradas = $("#unidades_compradas").val();
          let proveedor = $("#proveedor").val();
          let ubicacion = $("#ubicacion").val();
          let sub_ubicacion = $("#sub_ubicacion").val();
          let numeroPedimento = $("#numeroPedimento").val();
          let codigoProveedor = $("#codigoProveedor").val();
          let comentarios = $("#comentarios").val();
          let foto = $("#foto")[0].files[0];
          let foto_empty = ".";

          const cadena1 = categoria.slice(0, 4);
          const cadena2 = producto.slice(0, 4);
          const cadena3 = variacion.slice(0, 4);

          var cadenaZFill = skuTriadecimal.padStart(4, "0");
          const cadenaCompleta =
            cadena1 + "-" + cadena2 + "-" + cadena3 + "-" + cadenaZFill;
          let sku = cadenaCompleta;

          // Agregamos a la colección
          db.collection("Mercancia")
            .add({
              numero_orden_compra: numero_orden_compra,
              categoria: categoria,
              producto: producto,
              variacion: variacion,
              identificador_pieza: identificador_pieza,
              medida_fisica: medida_fisica,
              cantidad_comprada: cantidad,
              cantidad_disponible: unidades_compradas,
              unidades_compradas: unidades_compradas,
              proveedor: proveedor,
              ubicacion: ubicacion,
              sub_ubicacion: sub_ubicacion,
              foto: foto_empty,
              sku: sku,
              numeroPedimento,
              comentarios,
              codigoProveedor,
            })
            .then((response) => {
              let id = response.id;
              if (foto != undefined && foto != null && foto != "") {
                let fotoName = foto.name;
                let pathImg = storage.ref("Mercancia/" + id + "/" + fotoName);
                let uploadFoto = pathImg.put(foto);

                // Verificamos que se subio la foto, en la primer funcion es mientras se sube, la segunda función si es que existe algun error y la tercer función es cuando se sube
                // En la tercer opción vamos a obtener la URL del archivo que se subio
                // Register three observers:
                // 1. 'state_changed' observer, called any time the state changes
                // 2. Error observer, called on failure
                // 3. Completion observer, called on successful completion
                uploadFoto.on(
                  "state_changed",
                  (snapshot) => {
                    // Observe state change events such as progress, pause, and resume
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress =
                      (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
                    // Handle unsuccessful uploads
                  },
                  () => {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    uploadFoto.snapshot.ref
                      .getDownloadURL()
                      .then((downloadURL) => {
                        //console.log('foto:', downloadURL)

                        db.collection("Mercancia")
                          .doc(id)
                          .update({
                            foto: downloadURL,
                          })
                          .then((response) => {
                            //console.log("upd mercancia success")
                            //console.log(response)

                            limpiarModal();
                            $("#modal-add").modal("hide");
                          })
                          .catch((error) => {
                            //console.log("upd mercancia failed")
                            console.log(error);
                          });
                      });
                  }
                );
              }

              limpiarModal();
              $("#modal-add").modal("hide");
            })
            .catch((error) => {
              //console.log("add mercancia failed")
              console.log(error);
            });
        })
        .catch((error) => {
          //console.log("upd consecutivo failed")
          console.log(error);
        });
    })
    .catch((error) => {
      //console.log("consulta consecutivo failed")
      console.log(error);
    });
};

const limpiarModal = () => {
  $("#numero_orden_compra").val("");
  $("#categoria").val("");
  $("#producto").val("");
  $("#variacion").val("");
  $("#identificador_pieza").val("");
  $("#medida_fisica").val("");
  $("#cantidad").val("");
  $("#unidades_compradas").val("");
  $("#proveedor").val("");
  $("#ubicacion").val("");
  $("#sub_ubicacion").val("");
  $("#imgFotoMercancia").prop("src", "");
};

const showModalEditOpciones = (numero_orden_compra, orden_cerrada) => {
  let labelMsj = document.getElementById("labelMsj");
  labelMsj.textContent = numero_orden_compra;
  let opcionesCheckbox = document.getElementById("opcionesCheckbox");
  opcionesCheckbox.checked = !orden_cerrada;
};

/**************************************************/
/* SHOW MODAL EDIT */
// Abre la ventana modal para edición y muestra la información de los campos
const showModalEdit = (id) => {
  console.log("showModalEdit");
  //console.log('id: '+id)

  // Recuperamos la información en firebase con el ID
  db.collection("Mercancia")
    .doc(id)
    .get()
    .then((response) => {
      //console.log("consulta mercancia success")
      //console.log(response.data())

      let datos = response.data();
      datosMercanciaSeleccionada = datos;

      //Add the options to the skuML edit
      document.getElementById("skuML_edit").innerHTML = skusPublicacionesML;


      // Mostramos la consulta en los campos
      $("#sku_edit").html(datos.sku);
      $("#categoria_edit").html(datos.categoria);
      $("#producto_edit").html(datos.producto);
      $("#variacion_edit").html(datos.variacion);
      $("#ubicacion_edit").val(datos.ubicacion);
      $("#sub_ubicacion_edit").val(datos.sub_ubicacion);
      $("#comentarios_edit").val(datos.comentarios);
      $("#numeroPedimento_edit").val(datos.numeroPedimento);
      $("#codigoProveedor_edit").val(datos.CodigoProveedor);
      $("#cantidad_comprada_edit").val(datos.cantidad_comprada);
      $("#cantidad_disponible_edit").val(datos.cantidad_disponible);
      $("#unidades_compradas_edit").val(datos.unidades_compradas);
      $("#urlImagen_edit").val(datos.foto == "" || !datos.foto ? datos.url_imagen : datos.foto);
      $("#costo_unitario_edit").val(datos.costo_unitario);
      $("#skuML_edit").val(datos.skuML ?? "");

      //console.log('costo_unitario_edit: ', $("#costo_unitario_edit").val());

      $(document).ready(function () {
        $('.js-example-basic-multiple').select2();
      });

      $("#id_edit").val(id);
    })
    .catch((error) => {
      //console.log("consulta mercancia failed")
      console.log(error);
    });
};

/**************************************************/
/* EDITAR REGISTRO */
// Edita el registro seleccionado en firebase
const editarRegistro = async () => {
  let ubicacion = $("#ubicacion_edit").val();
  let sub_ubicacion = $("#sub_ubicacion_edit").val();
  let id = $("#id_edit").val();
  let comentarios = $("#comentarios_edit").val();
  let numeroPedimento = $("#numeroPedimento_edit").val();
  let codigoProveedor = $("#codigoProveedor_edit").val();
  let cantidad_comprada = $("#cantidad_comprada_edit").val();
  let unidades_compradas = $("#unidades_compradas_edit").val();
  var urlImagen = $("#urlImagen_edit").val();
  let cantidad_disponible = $("#cantidad_disponible_edit").val();
  let skuML = $("#skuML_edit").val();
  let costo_unitario = $("#costo_unitario_edit").val();

  // if($("#archivo").val() != ''){

  //   var urlImagen = $("#urlarchivo").val();
  //   var type = $("#urlarchivo").attr('data-type');
  //   var ext = $("#urlarchivo").attr('data-ext');
  //   var size = $("#urlarchivo").attr('data-size');

  // }

  //Enviar mail de notificación
  var recipient = "ikamaji@gmail.com";
  var sender = "cobranzakabudumex22@gmail.com";
  var subject = "Mercancia Editada";
  var body = `Se ha editado la mercancia:


  Categoria: ${datosMercanciaSeleccionada.categoria}
  Producto: ${datosMercanciaSeleccionada.producto}
  Variacion: ${datosMercanciaSeleccionada.variacion}
  Numero Pedimento: ${datosMercanciaSeleccionada.numeroPedimento}
  Orden de Compra: ${datosMercanciaSeleccionada.numero_orden_compra}
  --
  Unidades Compradas Original: ${datosMercanciaSeleccionada.unidades_compradas}
  Unidades Compradas Nueva: ${unidades_compradas}
  Cantidad Disponible Original: ${datosMercanciaSeleccionada.cantidad_disponible}
  Cantidad Disponible Nueva: ${cantidad_disponible}
  --

  Usuario que realiza la edicion: ${user.email}
  `;

  //replace all newlines with \n
  body = body.replace(/\n/g, "<br>");

  var url = `https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?accion=enviarEmail2&a=${recipient}&de=${sender}&subject=${subject}&cuerpo=${body}`;

  //console.log(url);

  // //Fetch url with POST method
  // const response = fetch(url, {
  //   method: "POST",
  //   mode: "no-cors",
  // });

  //const responseJson = await response.json();


  // console.log(responseJson);

  // return null;

  let updatedData = {
    ubicacion: ubicacion,
    sub_ubicacion: sub_ubicacion,
    foto: foto,
    comentarios,
    numeroPedimento,
    codigoProveedor,
    cantidad_comprada: parseFloat(cantidad_comprada),
    unidades_compradas: parseFloat(unidades_compradas),
    foto: urlImagen,
    cantidad_disponible: parseFloat(cantidad_disponible),
    skuML,
    costo_unitario: parseFloat(costo_unitario),
    url_imagen: urlImagen ?? '',
    //ext: ext,
    //type: type,
  };

  db.collection("Mercancia")
    .doc(id)
    .update(updatedData)
    .then(() => {
      $("#modal-edit").modal("hide");
      $("#archivo").val('');
      logger("Mercancia", "Editar Registro", id, updatedData)
    })
    .catch((error) => {
      console.log(error);
    });
};

/**************************************************/
/* BORRAR REGISTRO */
// Elimina el registro seleccionado en firebase
const borrarRegistro = (data) => {
  console.log(data);

  let id = data.id;
  console.log(id)

  if (confirm("¿Deseas eliminar el registro?") == 1) {
    db.collection("Mercancia")
      .doc(id)
      .delete()
      .then(() => {
        var requestOptions = {
          method: "GET",
          redirect: "follow",
        };

        logger("Mercancia", "Eliminar Registro", id, data.datos)

        fetch(window.URLUpdateMercancia, requestOptions)
          .then((response) => response.text())
          .then((result) => window.location.reload())
          .catch((error) => console.log("error", error));
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
  var checkedBox = $.map(
    $('input:checkbox[name="mercancia"]:checked'),
    function (val, i) {
      // value, index
      // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
      let id = val.value;
      // Recuperamos la información en firebase con el ID
      db.collection("Mercancia")
        .doc(id)
        .get()
        .then((response) => {
          $("#modal-edit-multiple").modal("show");
        })
        .catch((error) => {
          console.log(error);
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
  const question = confirm(`ADVERTENCIA:
    En caso de cambiar la categoria, producto o variacion, es posible que el SKU no sea consistente con el nombre del producto.
    Asi mismo, si tiene una venta que esta en proceso de surtido y a su mercancia se le cambia la categoria, producto o variacion, podra generar inconsistencias en el sistema, y se tendra que eliminar la venta y volver a crear una nueva.`);
  if (!question) {
    return null;
  }

  var id_edit_multiple = $("#id_edit_multiple").val();
  var arrayIDMercancia = id_edit_multiple.split(",");
  let total_registros = arrayIDMercancia.length;

  if (total_registros > 0) {
    for (x = 0; x < total_registros; x++) {
      var id = arrayIDMercancia[x];
      let ubicacion = $("#ubicacion_edit_multiple").val();
      let sub_ubicacion = $("#sub_ubicacion_edit_multiple").val();
      let comentarios = $("#comentarios_edit_multiple").val();
      let numeroPedimento = $("#numeroPedimento_edit_multiple").val();
      let proveedor = $("#Proveedor_edit_multiple").val();
      let categoria = $("#categoria_edit_multiple").val();
      let producto = $("#producto_edit_multiple").val();
      let variacion = $("#variacion_edit_multiple").val();

      let objMerca = {
        ubicacion,
        sub_ubicacion,
        comentarios,
        numeroPedimento,
        proveedor,
        categoria,
        producto,
        variacion,
      };

      let arr = Object.keys(objMerca);
      arr.forEach((element) => {
        if (!objMerca[element]) {
          delete objMerca[element];
        }
      });
      //console.log("🚀 ~ file: mercancia.js ~ line 794 ~ arr.forEach ~ objMerca",objMerca);
      //console.log("🚀 ~ file: mercancia.js ~ line 800 ~ actualizarMultiple ~ id",id);

      db.collection("Mercancia")
        .doc(id)
        .update(objMerca)
        .then((response) => {
          $("#modal-edit-multiple").modal("hide");
        })
        .catch((error) => {
          console.log("🚀 ~ file: mercancia.js ~ line 805 ~ actualizarMultiple ~ error", error);
        });
    }
    logger("Mercancia", "Edicion Masiva", "Multiples IDs", arrayIDMercancia)
  }
};

/**************************************************/
/* BORRAR MULTIPLE */
// Elimina los registros seleccionados en firebase
const borrarMultiple = () => {
  createSw({
    title: "Advertencia",
    text: "No cierrre ni refresque esta pagina, se esta actualizando",
    icon: "warning",
  });

  let idsEliminar = [];

  if (confirm("¿Deseas eliminar los registros seleccionados?") == 1) {
    Promise.all(
      $.map($('input:checkbox[name="mercancia"]:checked'), function (val, i) {
        // value, index
        // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
        let id = val.value;
        idsEliminar.push(id)

        return db
          .collection("Mercancia")
          .doc(id)
          .delete()
          .then(() => {
            console.log("Document successfully deleted!");
          })
          .catch((error) => {
            console.error("Error removing document: ", error);
          });
      })
    ).then(() => {
      logger("Mercancia", "Eliminar Masivamente", "Multiples IDs", idsEliminar)
      var requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      fetch(window.URLUpdateMercancia, requestOptions)
        .then((response) => response.text())
        .then(() => {
          createSw({
            title: "Mercancia Eliminada",
            icon: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        })
        .catch((error) => console.log("error", error));
    });
  }
};

/**************************************************/
/* SELECT ALL */
// Sleccionar todos los registros
const selectAll = () => {
  console.log("selectAll");
  //console.log("checkMercancia: "+$(".checkMercancia").length)
  //console.log("checkMercancia:checked: "+$(".checkMercancia:checked").length)

  // Seleccionar los checkbox
  if ($(".checkMercancia").length != $(".checkMercancia:checked").length) {
    $(".checkMercancia").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkMercancia").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }

  // Deseleccionar los checkbox
  if ($(".checkMercancia").length == $(".checkMercancia:checked").length) {
    $(".checkMercancia").prop("checked", true);
    $("#selectAll").prop("checked", true);
  } else {
    $(".checkMercancia").prop("checked", false);
    $("#selectAll").prop("checked", false);
  }
};

/**************************************************/
/* MostrarImagen */
// Mostramos la imagen que se seleccionó
const mostrarImagen = (e) => {
  var file = e.files[0];
  var reader = new FileReader();

  reader.onloadend = function () {
    $("#imgFotoMercancia").prop("src", reader.result);
  };
  reader.readAsDataURL(file);
};

/**************************************************/
/* Cargar Excel */
// Se hace la consulta del archivo Excel y se suben los datos al firebase
const cargarExcel = () => {
  createSw({
    title: "Advertencia",
    text: "No cierrre ni refresque esta pagina, se esta cargando el archivo",
    icon: "warning",
    dangerMode: true,
    content: {
      element: "input",
      attributes: {
        type: "text",
        disabled: true,
        id: "idIndexCantidad",
        value: "",
        style: "border: 0px solid rgba(0,0,0,.14);",
      },
    },
  });

  var file = document.querySelector("#fileExcel").files[0];
  var type = file.name.split(".");
  if (type[type.length - 1] !== "xlsx" && type[type.length - 1] !== "xls") {
    console.log("no es un archivo de excel");
    return false;
  }
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = async (e) => {
    const data = e.target.result;
    const zzexcel = window.XLS.read(data, {
      type: "binary",
    });
    var arrExcel = [];
    const result = [];
    for (let i = 0; i < zzexcel.SheetNames.length; i++) {
      const newData = window.XLS.utils.sheet_to_json(
        zzexcel.Sheets[zzexcel.SheetNames[i]]
      );
      result.push(...newData);
    }

    //Se revisa que la categoria, producto y variacion esten la base de datos
    var mercanciaIncorrecta = await revisarCategoriaProductoVariacion(result);

    if (mercanciaIncorrecta) {
      var textMercanciaIncorrecta = "";
      mercanciaIncorrecta.forEach((mercancia) => {
        textMercanciaIncorrecta += mercancia.categoria + " - " + mercancia.producto + " - " + mercancia.variacion + " \n";
      });
      alert("La mercancia no esta en el catalogo: \n" + textMercanciaIncorrecta);
      return false;
    }

    let skuInsert = [];
    // Se consulta el arreglo JSON del excel
    Promise.all(
      result.map((response_data, index) => {
        let datosExcel = response_data;
        let skuTriadecimal = 0;

        console.log({ datosExcel });

        // Declaramos las variables
        var numero_orden_compra = "";
        var categoria = "";
        var producto = "";
        var variacion = "";
        var proveedor = "";
        var identificador_pieza = "";
        var medida_fisica = "";
        var cantidad_comprada = "";
        var unidades_compradas = "";
        var costo_unitario = "";
        var sku = "";
        var sku_unico = "";
        var ubicacion = "";
        var sub_ubicacion = "";
        var fecha_compra = "";
        var foto = "";
        var comentarios = "";
        var CodigoProveedor = "";
        var numeroPedimento = "";
        var faltan_datos = 1;
        var skuML = "";

        //Guardamos el consecutivo en una variable
        return db
          .collection("ConfiguracionesGenerales")
          .doc("9vECPN3cIoVqVarSOlNZ")
          .get()
          .then((responseConfig) => {
            let datosConfig = responseConfig.data();
            let consecutivo = parseInt(datosConfig.ultimoMercancia);
            let numeroConsecutivo = consecutivo + 1;

            // Generamos el numero consecutivo
            consecutivo = parseInt(numeroConsecutivo);
            skuTriadecimal = toTria((consecutivo += index));
            consecutivo++;
            //console.log("consecutivo: ", consecutivo)
            //console.log("triadecimal: ", skuTriadecimal)

            let ultimo = parseInt((consecutivo += index));
            //console.log("consecutivo + 1: ", ultimo)

            // Obtenemos los valores del Excel
            if ("numero_orden_compra" in datosExcel) {
              numero_orden_compra = datosExcel.numero_orden_compra;
            } else {
              faltan_datos = 1;
            }
            if ("categoria" in datosExcel) {
              categoria = datosExcel.categoria;
            } else {
              faltan_datos = 1;
              falta_sku = 1;
            }
            if ("producto" in datosExcel) {
              producto = datosExcel.producto;
            } else {
              faltan_datos = 1;
              falta_sku = 1;
            }
            if ("variacion" in datosExcel) {
              variacion = datosExcel.variacion;
            } else {
              faltan_datos = 1;
              falta_sku = 1;
            }
            if ("proveedor" in datosExcel) {
              proveedor = datosExcel.proveedor;
            } else {
              faltan_datos = 1;
            }
            if ("identificador_pieza" in datosExcel) {
              identificador_pieza = datosExcel.identificador_pieza;
            } else {
              faltan_datos = 1;
            }
            if ("medida_fisica" in datosExcel) {
              medida_fisica = datosExcel.medida_fisica;
            } else {
              faltan_datos = 1;
            }
            if ("cantidad_comprada" in datosExcel) {
              cantidad_comprada = parseFloat(datosExcel.cantidad_comprada);
            } else {
              faltan_datos = 1;
            }
            if ("unidades_compradas" in datosExcel) {
              unidades_compradas = parseFloat(datosExcel.unidades_compradas);
            } else {
              faltan_datos = 1;
            }
            if ("costo_unitario" in datosExcel) {
              costo_unitario = parseFloat(datosExcel.costo_unitario);
            } else {
              faltan_datos = 1;
            }
            // Datos que se pueden editar si no viene la información
            if ("_ubicacion" in datosExcel) {
              ubicacion = datosExcel._ubicacion;
            }
            if ("sub_ubicacion" in datosExcel) {
              sub_ubicacion = datosExcel.sub_ubicacion;
            }
            if ("numeroPedimento" in datosExcel) {
              numeroPedimento = datosExcel.numeroPedimento;
            }
            if ("comentarios" in datosExcel) {
              comentarios = datosExcel.comentarios;
            }
            if ("CodigoProveedor" in datosExcel) {
              CodigoProveedor = datosExcel.CodigoProveedor;
            }

            if ("fecha_compra" in datosExcel) {
              fecha_compra = datosExcel.fecha_compra ? new Date(datosExcel.fecha_compra).getTime() : "";
              //var fechaCompra = new Date(datosExcel.fecha_compra).getTime();
            }
            if ("foto" in datosExcel) {
              foto = datosExcel.foto;
            }
            if ("skuML" in datosExcel) {
              skuML = datosExcel.skuML;
            }

            // Se busca o se genera el SKU
            if ("sku" in datosExcel) {
              sku = datosExcel.sku;
              sku_unico = true;
            } else {
              sku_unico = false;

              const cadena1 = categoria.slice(0, 4);
              const cadena2 = producto.slice(0, 4);
              const cadena3 = variacion.slice(0, 4);

              var cadenaZFill = skuTriadecimal.padStart(4, "0");
              //console.log(cadenaZFill);

              const cadenaCompleta =
                cadena1 + "-" + cadena2 + "-" + cadena3 + "-" + cadenaZFill;

              sku = cadenaCompleta;
            }

            // Actualizamos el consecutivo en el input
            $("#consecutivo").val(ultimo);

            if (numero_orden_compra) {
              // Agregamos a la colección
              const skuAgregar = {
                numero_orden_compra: String(numero_orden_compra).toUpperCase(),
                categoria: categoria.toUpperCase().trim(),
                producto: producto.toUpperCase().trim(),
                variacion: variacion.toUpperCase().trim(),
                proveedor: proveedor,
                identificador_pieza: identificador_pieza,
                medida_fisica: medida_fisica,
                cantidad_comprada: cantidad_comprada,
                cantidad_disponible: cantidad_comprada,
                cantidad_vendida: 0,
                unidades_compradas: unidades_compradas,
                costo_unitario: costo_unitario,
                ubicacion: ubicacion,
                sub_ubicacion: sub_ubicacion,
                fecha_compra: fecha_compra,
                fecha_registro: $.now(),
                foto: foto,
                sku: sku.toUpperCase(),
                sku_unico: sku_unico,
                comentarios,
                CodigoProveedor,
                numeroPedimento,
                skuML: skuML ? skuML.split(",") : []
              };
              skuInsert.push(skuAgregar);
              return db
                .collection("Mercancia")
                .add(skuAgregar)
                .then(() => {
                  let idIndexCantidad =
                    document.getElementById("idIndexCantidad");
                  idIndexCantidad.value = `Subiendo Mercancia... ${index} de ${result.length}`;

                  // Verificamos si es el último registro
                  // Actualizamos el consecutivo
                  //console.log({numeroConsecutivo})
                  return db
                    .collection("ConfiguracionesGenerales")
                    .doc("9vECPN3cIoVqVarSOlNZ")
                    .update({
                      ultimoMercancia: (numeroConsecutivo += index),
                    })
                    .then(() => {
                      numeroConsecutivo += index;
                    });
                })
                .catch((error) => {
                  console.log("add mercancia failed");
                  console.log(error);
                });
            }
          });

        x++;
      })
    ).then(() => {
      logger("Mercancia", "Subir mercancia (Excel)", null, {
        totalMercancia: result.length,
      });

      //Listado de multiples
      let listForReport = [];
      let ordenesDeCompra = ""
      skuInsert.forEach((item) => {
        const newMultiple = {
          Categoria: item.categoria,
          Producto: item.producto,
          Variacion: item.variacion,
          "Cantidad (Bultos)": item.cantidad_comprada,
          "Kg/Mts/Pza": item.unidades_compradas,
          "Numero Orden Compra": item.numero_orden_compra,
          Proveedor: item.proveedor,
          "Fecha Compra": formatoFechaJSaRegular(item.fecha_compra),
          SKU: item.sku,
        };
        listForReport.push(newMultiple);
        ordenesDeCompra.indexOf(item.numero_orden_compra) == -1 ? ordenesDeCompra += item.numero_orden_compra + "/" : null
      });

      ordenesDeCompra.slice(0, -1)

      const objResumen = creaResumenMercancia(listForReport);
      // //Se consulta la configuracion para el API
      db.collection("ConfiguracionesGenerales")
        .doc("ConfiguracionesApiGoogle")
        .onSnapshot((response) => {
          let { NotaIngresoMercancia } = response.data();
          NotaIngresoMercancia.documentName = "Resumen Mercancia";
          const apiBody = {
            multiples: { Desglose: objResumen, Resumen: listForReport },
            Fecha: new Date(),
            Usuario: user.email,
            ordenesDeCompra,
            config: NotaIngresoMercancia,
            uploadToFirebaseStorage: {
              projectId: window.projectId,
              bucketName: window.bucketName,
              folderName: "NotaIngresoMercancia",
              fileName: `Nota Ingreso Mercancia ${new Date()}_${user.email}`,
            },
          };

          //Llamado de API para generar el documento
          const apiBodyConfig = {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(apiBody),
          };
          fetch(
            "https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?user=USUARIO&accion=generarDocumento",
            apiBodyConfig
          )
            .then((response) => response.text())
            .then((result) => {
              //Se crea una URL en firestorage
              const res = JSON.parse(result);
              res.firebaseStorageRefURL;
              const gsReference = storage.refFromURL(res.firebaseStorageRefURL);
              gsReference.getDownloadURL().then((url) => {
                //Se almacenan las ordenes de compra en la db
                db.collection("ConfiguracionesGenerales")
                  .doc("ordenesCompra")
                  .get()
                  .then((response) => {
                    let ordenesCompraEnDb = response.data().ordenesCompra;
                    ordenesCompraEnDb.push(ordenesDeCompra.slice(0, -1))

                    db.collection("ConfiguracionesGenerales")
                      .doc("ordenesCompra")
                      .update({ ordenesCompra: ordenesCompraEnDb })
                  })


                //Se almacena la data de la mercancia
                db.collection("OrdenesEntradaMercancia")
                  .add({ url, user: user.email, fecha: new Date(), ordenesDeCompra })
                  .then(() => {
                    var requestOptions = {
                      method: "GET",
                      redirect: "follow",
                    };
                    fetch(window.URLUpdateMercancia, requestOptions)
                      .then((response) => response.text())
                      .then((result) => window.location.reload())
                      .catch((error) => console.log("error", error));
                  });
              });
            });
        });
    });
  };
};

/**************************************************/
/* TRIADECIMAL */
// Algoritmo para generar el SKU
const toTria = (decimal) => {
  var residuo = decimal % 36;
  if (decimal - residuo == 0) {
    return toChar(residuo);
  }
  return toTria((decimal - residuo) / 36) + toChar(residuo);
};
const toChar = (number) => {
  const alpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alpha.charAt(number);
};


function testToHex() {
  var limite = 40;

  for (x = 0; x < limite; x++) {
    console.log(x + "-" + toTria(x));
  }
}

const actualilzarInventario = () => {
  createSw({
    title: "Advertencia",
    text: "No cierrre ni refresque esta pagina, se esta actualizando",
    icon: "warning",
  });

  var requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  fetch(window.URLUpdateMercancia, requestOptions)
    .then((response) => response.text())
    .then(() => {
      createSw({ title: "Exito", text: "Inventario Actualizado", icon: "success" });
    })
    .catch((error) => console.log("error", error));
};

const editarOpcionesOrden = () => {
  let labelMsj = document.getElementById("labelMsj");
  let opcionesCheckbox = document.getElementById("opcionesCheckbox");
  const ordenCompra = labelMsj.textContent;
  const checked = !opcionesCheckbox.checked;
  db.collection("Mercancia")
    .where("numero_orden_compra", "==", ordenCompra)
    .get()
    .then((response) => {
      let mercanciaList = [];
      response.forEach((doc) => {
        mercanciaList.push({ id: doc.id, ...doc.data() });
      });

      mercanciaList.forEach((mercancia) => {
        db.collection("Mercancia").doc(mercancia.id).update({
          orden_cerrada: checked,
        });
      });
    });
  $("#modal-editOpciones").modal("hide");
};

const selectsOptionsFilter = () => {
  db.collection("ConfiguracionesGenerales")
    .doc("ordenesCompra")
    .get()
    .then((response) => {
      let datos = response.data();
      let cliente = `<option value="">seleccionar</option>`;
      datos.ordenesCompra.sort().forEach((element) => {
        cliente += `<option value="${element}">${element}</option>`;
        document.getElementById("listOrdenesCompra").innerHTML = cliente;
      });
    });

  db.collection("INVENTARIO-TOTAL")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        infoInventario.push({ id: doc.id, ...doc.data() });
      });

      sessionStorage.infoInventario = JSON.stringify(infoInventario);

      let cat = `<option value="">seleccionar</option>`;
      infoInventario.sort().forEach((inventario) => {
        cat += `<option value="${inventario.nombreCategoria}">${inventario.nombreCategoria}</option>`;
        document.getElementById("listCategorias").innerHTML = cat;
      });
    });

  //Se formatean los selectores con select2
  $('.select2').select2({
    placeholder: 'Seleccionar'
  });
};

const selectProducto = (value, index) => {
  const listProd = infoInventario.find((inv) => inv.nombreCategoria == value);
  if (listProd?.productos.length) {
    const listProds = listProd?.productos.map((prod) => prod.produc);
    let prodValues = `<option value="">seleccionar</option>`;
    listProds.sort().forEach((prod) => {
      prodValues += `<option value="${prod}">${prod}</option>`;
      document.getElementById("listProductos").innerHTML = prodValues;
    });
  }
};

const selectVariacion = (value) => {
  const listCategorias = document.getElementById("listCategorias");
  const listProd = infoInventario.find(
    (inv) => inv.nombreCategoria == listCategorias.value
  );
  const listVariacion = listProd.productos.find((inv) => inv.produc == value);

  if (listVariacion?.variaciones.length) {
    const listProds = listVariacion?.variaciones.map((prod) => prod.variacion);
    let prodValues = `<option value="">seleccionar</option>`;
    listProds.sort().forEach((prod) => {
      prodValues += `<option value="${prod}">${prod}</option>`;
      document.getElementById("listVariacion").innerHTML = prodValues;
    });
  }
};

const buscarMercancia = () => {
  // Eliminamos todos los registros
  localStorage.removeItem("mercancia");

  createSw({
    title: "Advertencia",
    text: "No cierrre ni refresque esta pagina, se esta cargando la mercancia",
    buttons: false,
    closeOnClickOutside: false,
    icon: "https://www.boasnotas.com/img/loading2.gif",
    timer: 3000,
    dangerMode: true,
  });
  const listOrdenesCompra = $("#listOrdenesCompra").val();
  const listCategorias = $("#listCategorias").val();
  const listProductos = $("#listProductos").val();
  const listVariacion = $("#listVariacion").val();
  const listCantidad = $("#listCantidad").val();
  const busquedaSku = $("#busquedaSku").val();
  const busquedaSkuMl = $("#busquedaSkuMl").val();

  if (busquedaSku) {
    db.collection("Mercancia")
      .where("sku", "==", busquedaSku)
      .get()
      .then((response) => {
        closeAllModals();
        listarRegistro(response);
      });
  } else if(busquedaSkuMl){
    db.collection("Mercancia")
      .where("skuML", "array-contains", busquedaSkuMl)
      .get()
      .then((response) => {
        closeAllModals();
        listarRegistro(response);
      });
  } else {

    if (listCantidad === "all") {
      if (!listOrdenesCompra && !listCategorias && !listProductos) {
        //Busca toda la mercancia
        db.collection("Mercancia")
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listCategorias && !listProductos) {
        // Busca por orden de compra
        db.collection("Mercancia")
          .where("numero_orden_compra", "==", listOrdenesCompra)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listOrdenesCompra && !listProductos) {
        //Busca por categoria
        db.collection("Mercancia")
          .where("categoria", "==", listCategorias)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listOrdenesCompra) {
        if (!listVariacion) {
          //Busca por categoria y producto
          db.collection("Mercancia")
            .where("categoria", "==", listCategorias)
            .where("producto", "==", listProductos)
            .get()
            .then((response) => {
              closeAllModals();
              listarRegistro(response);
            });
        } else {
          db.collection("Mercancia") //Busca por categoria, producto y variacion
            .where("categoria", "==", listCategorias)
            .where("producto", "==", listProductos)
            .where("variacion", "==", listVariacion)
            .get()
            .then((response) => {
              closeAllModals();
              listarRegistro(response);
            });
        }
      } else {
        db.collection("Mercancia") //Busca por todos los filtros
          .where("numero_orden_compra", "==", listOrdenesCompra)
          .where("categoria", "==", listCategorias)
          .where("producto", "==", listProductos)
          .where("variacion", "==", listVariacion)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      }
    } else {
      const igualCero = listCantidad == "0";
      if (!listOrdenesCompra && !listCategorias && !listProductos) {
        //Busca toda la mercancia
        db.collection("Mercancia")
          .where("cantidad_disponible", igualCero ? "==" : ">", 0)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listCategorias && !listProductos) {
        // Busca por orden de compra
        db.collection("Mercancia")
          .where("numero_orden_compra", "==", listOrdenesCompra)
          .where("cantidad_disponible", igualCero ? "==" : ">", 0)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listOrdenesCompra && !listProductos) {
        //Busca por categoria
        db.collection("Mercancia")
          .where("categoria", "==", listCategorias)
          .where("cantidad_disponible", igualCero ? "==" : ">", 0)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      } else if (!listOrdenesCompra) {
        if (!listVariacion) {
          //Busca por categoria y producto
          db.collection("Mercancia")
            .where("categoria", "==", listCategorias)
            .where("producto", "==", listProductos)
            .where("cantidad_disponible", igualCero ? "==" : ">", 0)
            .get()
            .then((response) => {
              closeAllModals();
              listarRegistro(response);
            });
        } else {
          db.collection("Mercancia") //Busca por categoria, producto y variacion
            .where("categoria", "==", listCategorias)
            .where("producto", "==", listProductos)
            .where("variacion", "==", listVariacion)
            .where("cantidad_disponible", igualCero ? "==" : ">", 0)
            .get()
            .then((response) => {
              closeAllModals();
              listarRegistro(response);
            });
        }
      } else {
        db.collection("Mercancia") //Busca por todos los filtros
          .where("numero_orden_compra", "==", listOrdenesCompra)
          .where("categoria", "==", listCategorias)
          .where("producto", "==", listProductos)
          .where("variacion", "==", listVariacion)
          .where("cantidad_disponible", igualCero ? "==" : ">", 0)
          .get()
          .then((response) => {
            closeAllModals();
            listarRegistro(response);
          });
      }
    }
  }

  const btnImprimirEtiquetas = `<button type="button" class="btn btn-dark" onclick="modalImprimirEtiquetas()">Imprimir etiquetas</button>`;
  $("#btnImprimirEtiquetas").html(btnImprimirEtiquetas);
};

const onChangeCantidad = (value) => {
  const cantidadVendidaOriginal = datosMercanciaSeleccionada.cantidad_vendida;
  const cantidadNueva = parseInt(value);
  let nuevaCantidadDisponible = cantidadNueva - cantidadVendidaOriginal;
  document.getElementById("cantidad_disponible_edit").value =
    nuevaCantidadDisponible;
};

const verInventario = () => {
  logger("Mercancia", "Ver Inventario");
  db.collection("Ventas")
    .where("delete", "==", false)
    .where("EstatusPedido", "!=", "Pedido cerrado")
    .get()
    .then((response) => {
      let ventaList = [];
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });
      const solicitudesCantidad = [];
      ventaList.forEach((venta) => {
        if (venta?.elementos?.length) {
          venta.elementos.forEach((item) => {
            item.venta = venta.numero_orden_venta;
            solicitudesCantidad.push(item);
          });
        }
      });

      const arrMercancia = [];
      infoInventario.forEach((cat) => {
        cat.productos.forEach((prod) => {
          prod.variaciones.forEach((variacion) => {
            const findSolicitud = solicitudesCantidad.filter(
              (solictud) =>
                solictud.categoria === cat.nombreCategoria &&
                solictud.producto === prod.produc &&
                solictud.variacion === variacion.variacion
            );
            const elementosTotalCantidad = findSolicitud.reduce((nex, prev) => {
              return parseFloat(nex) + parseFloat(prev.cantidad);
            }, 0);
            const objMerca = {
              variacion: variacion.variacion,
              Totalvariacion: variacion.totalSkuCantidades,
              producto: prod.produc,
              categoria: cat.nombreCategoria,
              cantidadEnVenta: elementosTotalCantidad,
            };
            arrMercancia.push(objMerca);
          });
        });
      });

      $("#inventarioTable>tbody").empty();

      arrMercancia.forEach((item) => {
        const {
          categoria,
          producto,
          variacion,
          Totalvariacion,
          cantidadEnVenta,
        } = item;
        const campo = `
          <tr>
              <td>${categoria}</td>
              <td>${producto}</td>
              <td>${variacion}</td>
              <td>${Totalvariacion}</td>
              <td>${cantidadEnVenta}</td>
          </tr>
          `;
        $("#inventarioTable>tbody").append(campo);
      });

      $("#inventarioTable")
        .DataTable({
          dom: "Bfrtip",
          responsive: true,
          retrieve: true,
          lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Todos"],
          ],
          lengthChange: false,
          autoWidth: false,
          scrollX: false,
          stateSave: false,
          pageLength: 10,
          order: [[0, "desc"]],
          buttons: [
            "pageLength",
            {
              extend: "excel",
              text: "Excel",
              className: "btn-dark",
              exportOptions: {
                columns: [0, 1, 2, 3, 4],
              },
            },
            {
              extend: "pdfHtml5",
              text: "PDF",
              header: true,
              title: `PDF`,
              duplicate: true,
              className: "btn-dark",
              pageOrientation: "landscape",
              pageSize: "A4",
              pageMargins: [3, 3, 3, 3, 4],
              exportOptions: {
                columns: [0, 1, 2, 3, 4],
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
                columns: [0, 1, 2, 3, 4],
              },
            },
            {
              extend: "colvis",
              text: "Columnas",
              className: "btn-dark",
            },
          ],
          initComplete: function () {
            var api = this.api();
            // Se colocan los filtros en las columnas
            $(".filterhead", api.table().footer()).each(function (i) {
              if (i == 0 || i == 1 || i == 2) {
                var column = api.column(i);
                var select = $('<select><option value=""></option></select>')
                  .appendTo($(this).empty())
                  .on("change", function () {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column
                      .search(val ? "^" + val + "$" : "", true, false)
                      .draw();
                  });

                column
                  .data()
                  .unique()
                  .sort()
                  .each(function (d, j) {
                    if (d) {
                      select.append(
                        '<option value="' + d + '">' + d + "</option>"
                      );
                    }
                  });
              }
            });
          },
          select: true,
          searching: true,
          paging: true,
          info: false,
        })
        .buttons()
        .container()
        .appendTo("#inventarioTable_wrapper .col-md-6:eq(1)");
    });
};

const loggerMercancia = (totalMercanciaConteo) => {
  const OrdenesCompra = $("#listOrdenesCompra").val();
  const Categorias = $("#listCategorias").val();
  const Productos = $("#listProductos").val();
  const Variacion = $("#listVariacion").val();
  const Cantidad = $("#listCantidad").val();

  logger("Mercancia", "Buscar Mercancia", null, {
    totalMercanciaConteo,
    OrdenesCompra,
    Categorias,
    Productos,
    Variacion,
    Cantidad,
  });
};

/**
 * Sumar mercancia al sku actual
 */
const onSumarMercancia = () => {
  const CantidadIngresar = $("#CantidadIngresar_SumarMercancia").val();
  const OrdenCompra = $("#OrdenCompra_SumarMercancia").val();
  const numeroPedimento = $("#numeroPedimento_SumarMercancia").val();
  const comentariosTxt = $("#comentarios_SumarMercancia").val();

  let isValidData = validaCampos([
    CantidadIngresar,
    OrdenCompra,
    numeroPedimento,
    comentariosTxt,
  ]);

  if (isValidData) {
    db.collection("Mercancia")
      .where("sku", "==", skuSumarMercancia)
      .get()
      .then((response) => {
        let MercanciaList = [];
        response.forEach((doc) => {
          MercanciaList.push({ id: doc.id, ...doc.data() });
        });
        let {
          id,
          cantidad_comprada,
          cantidad_vendida,
          numero_orden_compra,
          comentarios,
          historicoMercancia,
        } = MercanciaList[0];
        const nuevaCantidadComprada =
          parseFloat(cantidad_comprada) + parseFloat(CantidadIngresar);
        const nuevaCantidadDisponible =
          nuevaCantidadComprada - parseFloat(cantidad_vendida);

        // Objeto con las nuevas cantidades y campos
        const objNewDataSku = {
          cantidad_comprada: nuevaCantidadComprada,
          cantidad_disponible: nuevaCantidadDisponible,
          numero_orden_compra: numero_orden_compra + "/" + OrdenCompra,
          numeroPedimento,
          comentarios: comentarios + "/" + comentariosTxt,
          fechaModificacionMercancia: new Date(),
        };

        //Se crea un historico de cambios
        if (historicoMercancia) {
          //Si ya existe se agrega la nueva modificacion
          const otrosDatos = { ...objNewDataSku };
          otrosDatos.comentarios = comentariosTxt;
          otrosDatos.numero_orden_compra = OrdenCompra;
          historicoMercancia.push({ ...otrosDatos });
        } else {
          // Si no existe se agrega el nuevo mas el anterior
          const otrosDatos = { ...objNewDataSku };
          otrosDatos.comentarios = comentariosTxt;
          otrosDatos.numero_orden_compra = OrdenCompra;
          historicoMercancia = [
            {
              cantidad_comprada,
              cantidad_vendida,
              numero_orden_compra,
              comentarios,
              fechaModificacionMercancia: new Date(),
            },
            otrosDatos,
          ];
        }
        if (objNewDataSku.fechaModificacionMercancia) {
          delete objNewDataSku.fechaModificacionMercancia;
        }
        objNewDataSku.historicoMercancia = historicoMercancia;
        db.collection("Mercancia")
          .doc(id)
          .update(objNewDataSku)
          .then(() => {
            createSw({
              title: "Mercancia Actualizada",
              icon: "success",
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            $("#modal-SumarMercancia").modal("hide");
          });
      });
  }
};

const showModalSumarMercancia = (sku) => {
  skuSumarMercancia = sku;
};

const validaCampos = (listaCampos) => {
  const tieneDatosVacios = listaCampos.some(
    (a) => a === null || a === undefined || a === ""
  );
  if (tieneDatosVacios) {
    createSw({
      title: "Error",
      text: "Ningun campo de la mercancia debe ir vacio",
      icon: "error",
    });
    return false;
  }
  return true;
};

/**
 * Muestra el historico de cambios de la mercancia
 */
const detalleHistorico = (sku) => {
  db.collection("Mercancia")
    .where("sku", "==", sku)
    .get()
    .then((response) => {
      let MercanciaList = [];
      response.forEach((doc) => {
        MercanciaList.push({ id: doc.id, ...doc.data() });
      });
      let divtblResumen = document.getElementById("divtblResumen");
      divtblResumen.innerHTML = "";
      let tableResumen = document.createElement("table");
      tableResumen.id = "tableResumen";
      tableResumen.setAttribute("class", "table table-bordered table-striped");
      divtblResumen.append(tableResumen);

      const { historicoMercancia } = MercanciaList[0];
      let newRow = `<table><thead>
      <tr>
        <th>Cantidad comprada</th>
        <th>Numero orden compra</th>
        <th>comentarios</th>
        <th>Fecha Modificacion</th> 
      </tr>
    </thead><tbody>`;

      historicoMercancia.forEach(
        ({
          cantidad_comprada,
          numero_orden_compra,
          comentarios,
          fechaModificacionMercancia,
        }) => {
          newRow += `<tr>
            <td>${cantidad_comprada}</td>
            <td>${numero_orden_compra}</td>
            <td>${comentarios}</td>
            <td>${formatoFecha(fechaModificacionMercancia)}</td>
           </tr>`;
        }
      );
      newRow += "</tbody></table>";

      $("#tableResumen").html(newRow);

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
              title: `Detalle`,
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

//Funcion para crear el resumen de la mercancia en la nota de entrada
const creaResumenMercancia = (listExcel) => {
  const listaFiltrada = [];

  //Se filtra que solo muestre las Categoria - Producto - Variacion TOTALES
  listExcel.forEach(({ Categoria, Producto, Variacion }) => {
    const existInLista = listaFiltrada.some(
      (lis) =>
        lis.Categoria === Categoria &&
        lis.Producto === Producto &&
        lis.Variacion === Variacion
    );
    if (!existInLista) {
      listaFiltrada.push({ Categoria, Producto, Variacion });
    }
  });

  listaFiltrada.forEach(({ Categoria, Producto, Variacion }, index) => {
    const buscaMercancia = listExcel.filter(
      (lis) =>
        lis.Categoria === Categoria &&
        lis.Producto === Producto &&
        lis.Variacion === Variacion
    );

    let unidades_compradasTotal = 0;
    let cantidad_compradaTotal = 0;
    buscaMercancia.forEach((mer) => {
      unidades_compradasTotal += mer["Cantidad (Bultos)"];
      cantidad_compradaTotal += mer["Kg/Mts/Pza"];
    });

    listaFiltrada[index]["Total Cantidad (Bultos)"] = unidades_compradasTotal;
    listaFiltrada[index]["Total Kg/Mts/Pza"] = cantidad_compradaTotal;
  });
  return listaFiltrada;
};

/**
 * Muestra las ordenes de entrada guardadas en firestorage
 */
const verOrdenesEntrada = () => {
  db.collection("OrdenesEntradaMercancia")
    .get()
    .then((response) => {
      let ordenesList = [];
      response.forEach((doc) => {
        ordenesList.push({ id: doc.id, ...doc.data() });
      });

      $("#inventarioOrdenesEntrada>tbody").empty();
      ordenesList.forEach((item) => {
        const { user, url, fecha, ordenesDeCompra, id } = item;
        console.log(fecha, typeof fecha, id)
        const campo = `
          <tr>
              <td>${user}</td>
              <td>${typeof fecha == "string" ? fecha : formatoFecha(fecha)}</td>
              <td>${ordenesDeCompra}</td>
              <td> <button class="btn btn-success" title="Ver notas" onclick="verOrdenDeCompra('${id}','${url}')" ${url ?? "hidden"}>Nota</button> </td>
          </tr>
          `;
        $("#inventarioOrdenesEntrada>tbody").append(campo);
      });

      $("#inventarioOrdenesEntrada")
        .DataTable({
          dom: "Bfrtip",
          responsive: true,
          retrieve: true,
          lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Todos"],
          ],
          lengthChange: false,
          autoWidth: false,
          scrollX: false,
          stateSave: false,
          pageLength: 10,
          order: [[0, "desc"]],
          buttons: [
            "pageLength",
            {
              extend: "excel",
              text: "Excel",
              className: "btn-dark",
              exportOptions: {
                columns: [0, 1, 2, 3, 4],
              },
            },
            {
              extend: "pdfHtml5",
              text: "PDF",
              header: true,
              title: `PDF`,
              duplicate: true,
              className: "btn-dark",
              pageOrientation: "landscape",
              pageSize: "A4",
              pageMargins: [3, 3, 3, 3, 4],
              exportOptions: {
                columns: [0, 1, 2, 3, 4],
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
                columns: [0, 1, 2, 3, 4],
              },
            },
            {
              extend: "colvis",
              text: "Columnas",
              className: "btn-dark",
            },
          ],
          initComplete: function () {
            var api = this.api();
            // Se colocan los filtros en las columnas
            $(".filterhead", api.table().footer()).each(function (i) {
              if (i == 0 || i == 1 || i == 2) {
                var column = api.column(i);
                var select = $('<select><option value=""></option></select>')
                  .appendTo($(this).empty())
                  .on("change", function () {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column
                      .search(val ? "^" + val + "$" : "", true, false)
                      .draw();
                  });

                column
                  .data()
                  .unique()
                  .sort()
                  .each(function (d, j) {
                    if (d) {
                      select.append(
                        '<option value="' + d + '">' + d + "</option>"
                      );
                    }
                  });
              }
            });
          },
          select: true,
          searching: true,
          paging: true,
          info: false,
        })
        .buttons()
        .container()
        .appendTo("#inventarioOrdenesEntrada_wrapper .col-md-6:eq(1)");
    });
};


//Funcion para generar y descargar el pdf de las etiquetas
function generarPdfQR(apiBody) {

  var multiples = apiBody.registros;

  var dd = []

  for (x in multiples) {

    var page = [
      {
        columns: [
          {
            qr: `${multiples[x].dataQR}`, alignment: 'center', fit: '90'
          },
          {
            text: [
              { text: `${multiples[x].registro}\n`, alignment: 'left', fontSize: 8 },
            ]
          }

        ]
      },
      {
        text: [
          { text: `Kg/Mts/Pza: ${multiples[x].dimensiones}`, alignment: 'center', fontSize: 14 }
        ],
        pageBreak: 'after'
      },
    ]

    dd.push(...page);
  }


  var docDefinition = {
    content: dd,
    pageSize: 'A8',
    pageOrientation: 'landscape',
    pageMargins: [0, 3, 0, 0]
  }


  pdfMake.createPdf(docDefinition).download(`PDF QR`);
}


//Funcion para ver el historial de una mercancia
async function verHistorial(sku) {
  var query = db.collection("Mercancia").where("sku", "==", sku).get();
  var mercancia = (await query).docs[0].data();
  var cantidad_comprada = mercancia.cantidad_comprada;
  var cantidad_vendida = mercancia.cantidad_vendida;
  var cantidad_disponible = mercancia.cantidad_disponible;

  var historial = mercancia.historialMovimientos.split("°");

  var table = `
  <p> Cantidad comprada: ${cantidad_comprada} </p>
  <p> Cantidad vendida: ${cantidad_vendida} </p>
  <p> Cantidad disponible: ${cantidad_disponible} </p>
  <table class='table table-striped table-bordered table-hover table-sm'><thead><tr><th scope='col'>Orden</th><th scope='col'>Cantidad</th></tr></thead><tbody>`;


  historial.forEach((element) => {
    var info = element.split(":");
    if (info.length != 2) return;
    console.log(info)
    table += "<tr><td>" + info[0] + "</td><td>" + info[1] + "</td></tr>";
  });

  table += "</tbody></table>";

  createModal(`Historial de la mercancia`, table);


}


//Funcion para volver a generar el documento de Resumen de mercancia
async function generarResumenMercancia(skuInsert) {
  //Listado de multiples
  let listForReport = [];
  let ordenesDeCompra = ""
  skuInsert.forEach((item) => {
    const newMultiple = {
      Categoria: item.categoria,
      Producto: item.producto,
      Variacion: item.variacion,
      "Cantidad (Bultos)": item.cantidad_comprada,
      "Kg/Mts/Pza": item.unidades_compradas,
      "Numero Orden Compra": item.numero_orden_compra,
      Proveedor: item.proveedor,
      "Fecha Compra": formatoFechaJSaRegular(item.fecha_compra),
      SKU: item.sku,
    };
    listForReport.push(newMultiple);
    ordenesDeCompra.indexOf(item.numero_orden_compra) == -1 ? ordenesDeCompra += item.numero_orden_compra + "/" : null
  });

  ordenesDeCompra.slice(0, -1)

  const objResumen = creaResumenMercancia(listForReport);
  // //Se consulta la configuracion para el API
  const snapshotConfig = await db.collection("ConfiguracionesGenerales").doc("ConfiguracionesApiGoogle").get();
  const response = snapshotConfig.data();
  let { NotaIngresoMercancia } = response;
  NotaIngresoMercancia.documentName = "Resumen Mercancia";
  const apiBody = {
    multiples: { Desglose: objResumen, Resumen: listForReport },
    Fecha: new Date(),
    Usuario: user.email,
    ordenesDeCompra,
    config: NotaIngresoMercancia,
    uploadToFirebaseStorage: {
      projectId: window.projectId,
      bucketName: window.bucketName,
      folderName: "NotaIngresoMercancia",
      fileName: `Nota Ingreso Mercancia ${new Date()}_${user.email}`,
    },
  };

  console.log(apiBody)

  //Llamado de API para generar el documento
  const apiBodyConfig = {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(apiBody),
  };
  const createDocument = await fetch("https://script.google.com/macros/s/AKfycbw4jwGyjunIy6tih5i9gQR244Wt7vBkFYVuAyGYqxk7Z8-W09GbhawXTDZnhdAQyNak/exec?user=USUARIO&accion=generarDocumento", apiBodyConfig)
  const result = await createDocument.text();


  //Se crea una URL en firestorage
  const res = JSON.parse(result);
  res.firebaseStorageRefURL;
  const gsReference = storage.refFromURL(res.firebaseStorageRefURL);
  gsReference.getDownloadURL().then((url) => {
    //Se almacenan las ordenes de compra en la db

    db.collection("OrdenesEntradaMercancia").add({ url, user: user.email, fecha: new Date(), ordenesDeCompra })
    db.collection("ConfiguracionesGenerales")
      .doc("ordenesCompra")
      .get()
      .then((response) => {
        let ordenesCompraEnDb = response.data().ordenesCompra;
        ordenesCompraEnDb.push(ordenesDeCompra.slice(0, -1))

        db.collection("ConfiguracionesGenerales")
          .doc("ordenesCompra")
          .update({ ordenesCompra: ordenesCompraEnDb })
      })
      .catch((error) => {
        console.log(error);
      });


  });

}

var infoCatalogo = [];
var listCategoriasCatalogo = [];
var listProductosCatalogo = [];
var listVariacionCatalogo = [];
var listCombinacionesCatalogo = [];

//Funciones para traer el catalogo de productos y revisar
async function descargarCatalogo() {
  var queryCatalogo = await db.collection("Catalogo").get();


  await queryCatalogo.forEach((doc) => {
    infoCatalogo.push({ id: doc.id, ...doc.data() });
    listCategoriasCatalogo.push(doc.data().Categoria);
    listProductosCatalogo.push(doc.data().Producto);
    listVariacionCatalogo.push(doc.data().Variacion);
    listCombinacionesCatalogo.push(doc.data().Categoria + doc.data().Producto + doc.data().Variacion);
  });

  return

}


async function revisarCategoriaProductoVariacion(arrayToCheck) {

  if (infoCatalogo.length == 0) {
    await descargarCatalogo();
  }

  let arrayWrongProducts = [];

  arrayToCheck.forEach(element => {
    //Omit the empty ones
    if (element.categoria == "" && element.producto == "" && element.variacion == "") return;

    if (!listCombinacionesCatalogo.includes(element.categoria + element.producto + element.variacion)) {
      arrayWrongProducts.push(element);
    }
  });

  return arrayWrongProducts.length > 0 ? arrayWrongProducts : false;
}


async function verOrdenDeCompra(docId, urlRecibo) {

  if (urlRecibo.indexOf("https:") == 0) {
    window.open(urlRecibo, "_blank")
  } else {
    //Convert storage url to download url
    var starsRef = storage.refFromURL(urlRecibo);
    var downloadUrl = await starsRef.getDownloadURL();



    //Update url in firestore
    await db.collection("OrdenesEntradaMercancia").doc(docId).update({
      url: downloadUrl
    })

    window.open(downloadUrl, "_blank")

  }
}

const imprimirQRPDF = async (dataQR, dimensiones, numero_orden_compra, categoria, producto, variacion, sku, skuML) => {

  let registros = [];

  let registro = `O.C.: ${numero_orden_compra}\nCategoria: ${categoria}\nProducto: ${producto}\nVariacion: ${variacion}\nSKU: ${sku}\nSKUML: ${skuML.replaceAll(",", "-")}`;
  // console.log({registro});

  const { value: cantidadEtiquetas } = await Swal.fire({
    title: 'Generar PDF',
    input: 'text',
    inputLabel: '¿Cantidad de etiquetas que deseas imprimir de este producto?',
    inputPlaceholder: 'Agregar cantidad',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor agrega la cantidad de etiquetas para impresión'
      }else{

        for (let i = 1; i <= value; i++) {

          registros.push({
            "dataQR": dataQR,
            "dimensiones": dimensiones,
            "registro": registro,
          });

        } // for
        
        generarPdfQR({"registros":registros});      

      } // else

    }
  
  });

}


const modalImprimirEtiquetas = () => { 
  //console.log('imprimirEtiquetas');

  // Buscamos los registros que mostraremos en la tabla
  var mercancia = JSON.parse(localStorage.getItem("mercancia")) || [];

  let divTable = document.getElementById("resultImprimirEtiquetas");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaImprimirEtiquetas";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  var contenido = `
    <table>
    <thead>
        <tr>
        <th class="align-middle">Cantidad de etiquetas</th>
        <th class="align-middle">Número Órden Compra</th>
        <th class="align-middle">Producto</th>
        <th class="align-middle">Variación</th>
        <th class="align-middle">SKU</th>
        <th class="align-middle">SKU ML</th>
        <th class="align-middle">Cantidad (Bultos) Disponible</th>
        <th class="align-middle">Kg/Mts/Pz</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";


  //console.log("mercancia total: ",mercancia.length);
  if(mercancia.length > 0) {
    for(var i = 0; i < mercancia.length; i++) {
      //console.log(mercancia[i]);

    
    // Generamos el contenido de la tabla
    contenido += `
      <tr>
          <td><input type="number" id="cantidadEtiquetas_${i}" name="cantidadEtiquetas_${i}" value="${Math.round(Number(mercancia[i].cantidad_disponible) / Number(mercancia[i].unidades_compradas))}" class="cantidadEtiquetas" data-ordencompra="${mercancia[i].numero_orden_compra}" style="width:50px;"></td>
          <td>${mercancia[i].numero_orden_compra}</td>
          <td>${mercancia[i].producto}</td>
          <td>${mercancia[i].variacion}</td>
          <td>${mercancia[i].sku}</td>
          <td>${mercancia[i].skuML?.join(",") ?? ""}</td>
          <td>${mercancia[i].cantidad_disponible}</td>
          <td>${mercancia[i].unidades_compradas}</td>
      </tr>
      `;

    } // for
  } // if

  contenido += "</tbody></table>";

  $("#tablaImprimirEtiquetas").html(contenido);


  // Mostramos el modal
  $("#modal-imprimir-etiquetas").modal('show');

}

const imprimirEtiquetasModal = () => {
  console.log("imprimirEtiquetasModal");

  let registros = [];

  // Buscamos los registros que mostraremos en la tabla
  var mercancia = JSON.parse(localStorage.getItem("mercancia")) || [];

  for (var i = 0; i < mercancia.length; i++) {

    var cantidad = $("#cantidadEtiquetas_" + i).val();
    //console.log("cantidad: " + cantidad);

    for(var j = 1; j <= cantidad; j++) {

      let registro = `O.C.: ${mercancia[i].numero_orden_compra}\nCategoria: ${mercancia[i].categoria}\nProducto: ${mercancia[i].producto}\nVariacion: ${mercancia[i].variacion}\nSKU: ${mercancia[i].sku}\nSKUML: ${mercancia[i].skuML?.join(",").replaceAll(",", "-") ?? ""}`;

      registros.push({
        "dataQR": mercancia[i].sku,
        "dimensiones": mercancia[i].unidades_compradas,
        "registro": registro,
      });

    } // for

  } // for

  //console.log(registros);

  $("#modal-imprimir-etiquetas").modal('hide');

  generarPdfQR({"registros":registros});    

}


const publicacionesSinSKUEnMercancia = async () => {
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
            <th class="align-middle">SKU ML</th>
            <th class="align-middle">ID Publicación</th>
            <th class="align-middle">ID Variación</th>
        </tr>
    </thead>
    `;

  contenido += "<tbody>";

  var queryMLSinSKU = await db.collection("ConfiguracionesGenerales").doc("MLpublicacionesConSkuNoRegistradoEnInventario").get();
  var arrSinSKU = queryMLSinSKU.data().publicacionesConSkuNoRegistradoEnInventario;

  var queryUltimaActualizacion = await db.collection("ConfiguracionesGenerales").doc("MLActualizaciones").get();
  var ultimaActualizacion = queryUltimaActualizacion.data().publicaciones.actualizacion;
  var fechaUltimaActualizacion = formatoFecha(ultimaActualizacion);

  arrSinSKU.forEach((response_data) => {

    // Generamos el contenido de la tabla
    contenido += `
        <tr>
            <td><a href="${response_data.linkPublicacion}" target="_blank">${response_data.tituloPublicacion}</a></td>
            <td>${response_data.variacionesPublicacionString}</td>
            <td>${response_data.skuML}</td>
            <td>${response_data.idPublicacion}</td>
            <td>${response_data.idVariacion}</td>
        </tr>
        `;

  });

  contenido += "</tbody></table>";

  //Add a button to download the table as CSV at the footer of the modal
  document.getElementById("tablaPublicacionesSinSkus").insertAdjacentHTML("afterend", `<div class="text-center"><button class="btn btn-success" onclick="exportTableToCSV('publicacionesSinSKU.csv')">Descargar CSV</button></div>`);
  //Add the ultima actualizacion and the total publicaciones
  document.getElementById("resultSinSkus").insertAdjacentHTML("afterbegin", `<div class="text-center"><h6>Última actualización: ${fechaUltimaActualizacion}</h6></div>`);
  document.getElementById("resultSinSkus").insertAdjacentHTML("afterbegin", `<div class="text-center"><h4>Total de publicaciones sin SKU: ${arrSinSKU.length}</h4></div>`);

  $("#tablaPublicacionesSinSkus").html(contenido);

  $("#modal-sin-sku").modal('show');

}

async function exportTableToCSV(filename) {
  //console.log('exportTableToCSV');

  var csv = [];
  var rows = document.querySelectorAll("table tr");

  for (var i = 0; i < rows.length; i++) {
    var row = [], cols = rows[i].querySelectorAll("td, th");

    for (var j = 0; j < cols.length; j++) {
      row.push(cols[j].innerText);
    }

    csv.push(row.join(","));
  }

  // Download CSV file
  downloadCSV(csv.join("\n"), filename);
}

async function downloadCSV(csv, filename) {
  //console.log('downloadCSV');

  var csvFile;
  var downloadLink;

  // CSV file
  csvFile = new Blob([csv], { type: "text/csv" });

  // Download link
  downloadLink = document.createElement("a");

  // File name
  downloadLink.download = filename;

  // Create a link to the file
  downloadLink.href = window.URL.createObjectURL(csvFile);

  // Hide download link
  downloadLink.style.display = "none";

  // Add the link to DOM
  document.body.appendChild(downloadLink);

  // Click download link
  downloadLink.click();

}

/**
 * The function `uploadFile` uploads a file to Firebase storage, retrieves the download URL, extracts
 * file information, and creates a new input field with the URL and file type information.
 * @param formFieldId - The `formFieldId` parameter in the `uploadFile` function is used to identify
 * the HTML input element from which the file will be uploaded. This parameter is a string representing
 * the ID of the form field element in the HTML document. The function uses this ID to access the file
 * selected by the
 */
//Funcion para subir un archivo a firebase
async function uploadFile(formFieldId) {
  createModal("Subir archivo", "Subiendo imagen... Espere un momento.");
  $("#btnAdd").prop("disabled", true);
  var formField = $("#" + formFieldId);
  var file = formField.prop("files")[0];
  console.log(file);

  // Tipo de archivo y extensión
  var info = file.type;
  //console.log(info);    
  
  var type = info.split('/')[0];
  var ext = info.split('/')[1];
  //console.log({type}, {ext});

  // Tamaño del archivo
  var numberOfBytes = file.size;

  // Approximate to the closest prefixed unit
  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
    "EB",
    "ZB",
    "YB",
  ];
  const exponent = Math.min(
    Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
    units.length - 1,
  );
  const approx = numberOfBytes / 1024 ** exponent;
  /*
  const output =
    exponent === 0
      ? `${numberOfBytes} bytes`
      : `${approx.toFixed(3)} ${
          units[exponent]
        } (${numberOfBytes} bytes)`;
  */

  const output =
  exponent === 0
    ? `${numberOfBytes} bytes`
    : `${approx.toFixed(3)} ${
        units[exponent]
      }`;

  console.log(output);

  // Comenzamos a subir el archivo
  const reader = new FileReader();

  if (file) {
    reader.readAsDataURL(file);
  }

  reader.onload = function () {
    //console.log(reader.result);

    var [info,result] = reader.result.split(',');
    //console.log ({info});
    //console.log ({result});

    var dataJson = {
      data: reader.result,
      formName: baseDeDatos + "-" + formFieldId,
    };

    //Add four random digits to the file name to avoid duplicates
    var randomDigits = Math.floor(Math.random() * 9000) + 1000;


    //Upload file to firebase storage and get url
    var url = "";
    var storageRef = firebase.storage().ref();
    var uploadTask = storageRef
      .child("files/" + TABLE_NAME + "/" + formFieldId + "/" + randomDigits + "_" + file.name)
      .putString(dataJson.data, "data_url");

    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      function (snapshot) {
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
      function (error) {
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;
        }
      },
      function () {
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          //console.log(info)
          url = downloadURL;
          console.log("File available at", downloadURL);
          document.getElementById("urlImagen_edit").value = downloadURL;
          closeAllModals(); 
          guardarURL(url,info);
        });
      }
    );

      
      function guardarURL(url,info_file) { 

        //var info = info_file.slice(5,-7);
        //console.log(info);    
        
        //let type = info.split('/')[0];
        //let ext = info.split('/')[1];

        //console.log({type});
        //console.log({ext});
        
        $("#url" + formFieldId).remove(); //Esto por si ya habia cargado un archivo en ese mismo campo.
          
          
          // Creamos un nuevo campo input
          var storedUrl = document.createElement("input");
          storedUrl.id = "url" + formFieldId;
          storedUrl.setAttribute("class", "storedURL");
          storedUrl.setAttribute("readOnly", true);

          // Agregamos el campo al html
          document.body.appendChild(storedUrl);

          // Agregamos el valor del campo
          $(`#url${formFieldId}`).val(url);
          $(`#url${formFieldId}`).attr('data-type',type);
          $(`#url${formFieldId}`).attr('data-ext',ext);
          $(`#url${formFieldId}`).attr('data-size',output);
  
          // Habilitamos el botón de guardado
          $("#btnAdd").prop("disabled", false);
      }

  };
}


//Funcion para ver costos de mercancia
async function verCostosMercancia(docId){

  var queryMercancia = await db.collection("Mercancia").doc(docId).get();
  var dataMercancia = queryMercancia.data();

  var costo_unitario = dataMercancia.costo_unitario ?? "No registrado";
  var costo_logistica_total = dataMercancia.costo_logistica_total ?? "No registrado";
  var costo_logistica_unitario = dataMercancia.costo_logistica_unitario ?? "No registrado";
  var costo_logistica_desglose = dataMercancia.costo_logistica_desglose ?? [];

  console.log({costo_unitario, costo_logistica_total, costo_logistica_unitario, costo_logistica_desglose})

  var headersTabla = ["idEgreso", "concepto", "descripcion", "receptor", "montoEgreso", "porcentaje", "montoAsignado", "totalCantidadComprada", "cantidad_comprada", "monto", "montoUnitario" ];

  //var htmlTableCostoLogisticaDesglose = convertJsonToHtmlTable(costo_logistica_desglose, headersTabla, "mercanciaDesglose");

  //Convertir costo_logistica_desglose a tabla
  var htmlTableCostoLogisticaDesglose = `
  <table class='table table-striped table-bordered table-hover table-sm'>
    <thead>
      <tr>
        <th>ID</th>
        <th>Concepto</th>
        <th>Descripcion</th>
        <th>Receptor</th>
        <th>Monto Egreso</th>
        <th>Porcentaje Asignado a O.C.</th>
        <th>Monto Asignado a O.C.</th>
        <th>Total Cantidad Comprada en O.C.</th>
        <th>Cantidad Comprada</th>
        <th>Monto</th>
        <th>Monto Unitario</th>
        <th>Eliminar Gasto</th>
      </tr>
    </thead>
    <tbody>
  `;

  costo_logistica_desglose.forEach((element, i) => {
    htmlTableCostoLogisticaDesglose += `
      <tr>
        <td>${element.idEgreso}</td>
        <td>${element.concepto}</td>
        <td>${element.descripcion}</td>
        <td>${element.receptor}</td>
        <td>${element.montoEgreso}</td>
        <td>${element.porcentaje}</td>
        <td>${element.montoAsignado}</td>
        <td>${element.totalCantidadComprada}</td>
        <td>${element.cantidad_comprada}</td>
        <td>${element.monto}</td>
        <td>${element.montoUnitario}</td>
        <td><button class="btn btn-danger" onclick="eliminarGastoCostoLogistica('${docId}', '${i}')">Eliminar</button></td>
      </tr>
    `;
  });

  htmlTableCostoLogisticaDesglose += "</tbody></table>";

  var buttonRecalcularCostoLogistica = `<button class="btn btn-primary" onclick="recalcularCostoLogisticaByIdMercancia('${docId}')">Recalcular costo logística</button>`;

  var htmlBodyModal = `
    <div class="container">
      <div class="row">
        <div class="col">
          <h5>Costo unitario: $${costo_unitario}</h5>
        </div>
        <div class="col">
          <h5>Total costo logística: $${costo_logistica_total}</h5>
        </div>
        <div class="col">
          <h5>Costo logística unitario: $${costo_logistica_unitario}</h5>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <h5>Costo logística desglose:</h5>
          ${htmlTableCostoLogisticaDesglose}
        </div>
      </div>
      ${buttonRecalcularCostoLogistica}
    </div>
  `;

  createModal("Costos de la mercancia", htmlBodyModal);




}

//Funcion para eliminar un gasto de un costo de logistica
async function eliminarGastoCostoLogistica(docId, index) {


  var alert = confirm("¿Estás seguro de eliminar este gasto de logística?");
  if (!alert) return;
  
    var queryMercancia = await db.collection("Mercancia").doc(docId).get();
    var dataMercancia = queryMercancia.data();
  
    var costo_logistica_desglose = dataMercancia.costo_logistica_desglose ?? [];
  
    costo_logistica_desglose.splice(index, 1);
  
    await db.collection("Mercancia").doc(docId).update({
      costo_logistica_desglose: costo_logistica_desglose
    });

    await recalcularCostoLogisticaByIdMercancia(docId);
  
  }

  //Funcion para recalcularCostoLogisticaByIdMercancia
  async function recalcularCostoLogisticaByIdMercancia(docId) {
  
    var URLFuncionesGenerales = window.URLFuncionesGenerales;
    var functionToExecute = "recalcularCostoLogisticaByIdMercancia";
  
    var url = `${URLFuncionesGenerales}?idMercancia=${docId}&functionToExecute=${functionToExecute}`;
  
    var response  = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    console.log(response);

    verCostosMercancia(docId);

    return response;
  }