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

  const TABLE_NAME = "Catalogo";
  let headersSchema = {};
  
  var baseDeDatos = TABLE_NAME;
  $("#botonAgregar, #modalTitle").append(baseDeDatos);
  var filter = " ";
  var db = firebase.firestore();
  let permisosByUser = {};
  const uid = JSON.parse(sessionStorage.user).uid;
  db.collection("Usuarios")
    .doc(uid)
    .get()
    .then((responseConfig) => {
      let response = responseConfig.data();
      const tienePermiso = response.modulos.find(
        (modulo) => modulo.modulo == TABLE_NAME
      );
      if (tienePermiso) {
        permisosByUser = tienePermiso;
        logger(TABLE_NAME, "Ingreso");
        db.collection(TABLE_NAME).get().then((response) => {
          const arrData = [];
          response.forEach((response_data) => {
            let datos = response_data.data();
            datos.ID = response_data.id;
            arrData.push(datos);
          });
          //console.log(arrData)
  
          //Se concatenan las configuraciones con la data de la tabla
          db.collection("ConfiguracionesGenerales")
            .doc(TABLE_NAME)
            .get().then((response) => {
              let datos = response.data();
              const formatTableJson = convertirJsonEnArray(
                arrData,
                datos.headersSchema
              );
              headersSchema = datos.headersSchema;
              formatTableJson.push(datos.configSchema);
              formatTableJson.push(datos.headersSchema);
              setDynamicData(formatTableJson.reverse());
            });
        });
      } else {
        if (window.confirm("No tienes permisos para acceder.")) {
          document.location.href = "./";
        } else {
          document.location.href = "./";
        }
      }
    });
  
  function setDynamicData(datosDeTabla) {
    document.getElementById("datosCompletos").innerHTML =
      JSON.stringify(datosDeTabla);
  
    construirSelectorDeColumnas();
    construirTabla();
    construirFormulario();
    construirFiltros();
  }
  
  //Construir tabla
  function construirTabla() {
    var divTabla = document.getElementById("divTabla");
    divTabla.innerHTML = "";
    var tabla = document.createElement("table");
    tabla.id = "tabla1";
    tabla.setAttribute("class", "table table-bordered table-striped");
    var tableHeader = tabla.createTHead().insertRow(0);
    var tableBody = tabla.createTBody();
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
    var datosTablaHeaders = datosTabla[0];
  
    var formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  
    for (i in datosTabla[0]) {
      tableHeader.insertCell(i).innerHTML = datosTabla[0][i];
    }
    const PuedeEditarMasivo = permisosByUser.opciones.find(
      (permiso) => permiso === "PuedeEditarMasivo"
    );
  
    const PuedeEliminarMasivo = permisosByUser.opciones.find(
      (permiso) => permiso === "PuedeEliminarMasivo"
    );
  
    //Aca se agrega el header para todos los botones deseados
    tableHeader.insertCell(datosTabla[0].length).innerHTML = "Acciones";
    tableHeader.insertCell(0).innerHTML = `   <div class="col-12">
      ${
        PuedeEditarMasivo
          ? `<button class="btn btn-warning m-bottom-10 d-inline-block" onclick="edicionMultiple()">Editar</button>`
          : ""
      }
      ${
        PuedeEliminarMasivo
          ? `<button class="btn btn-danger m-bottom-10 d-inline-block" onclick="borrarMultiple()">Borrar</button>`
          : ""
      }
    </div>
    <div class="col-12">
      <label for="selectAll" class="cursor-pointer">Seleccionar</label> <input type="checkbox" class="cursor-pointer" id="selectAll" onchange="selectAll()">
    </div>`;
  
    for (x = 2; x < datosTabla.length; x++) {
      var row = tableBody.insertRow(-1);
      for (y = 0; y < datosTabla[0].length; y++) {
        var columnConfig = JSON.parse(datosTabla[1][y]);
        var cellData = datosTabla[x][y];
        //En caso de ser array:
        if (columnConfig.formatType == "array" && cellData.length > 1) {
          var array = datosTabla[x][y].split("°");
          var html = "";
          if (columnConfig.dataType == "currency") {
            array.forEach((d) => {
              if (d != "") {
                html += `<br>-${formatter.format(d)}`;
              }
            });
          } else if (columnConfig.dataType == "URL" && cellData.length > 1) {
            array.forEach((d) => {
              if (d != "") {
                html += `<br>-<a href="${d}" target="_blank">Link</a>`;
              }
            });
          } else if (columnConfig.dataType == "date") {
            array.forEach((d) => {
              if (d != "") {
                html += `<br>-${d.slice(0, 10)}`;
              }
            });
          } else {
            array.forEach((d) => {
              if (d != "") {
                html += `<br>-${d}`;
              }
            });
          }
          row.insertCell(y).innerHTML = html;
        } else if (columnConfig.formatType == "card") {
          var innerCardBody = "";
          columnConfig.card.forEach((d) => {
            var data = datosTabla[x][datosTablaHeaders.indexOf(d)];
            var columnConfig = JSON.parse(
              datosTabla[1][datosTablaHeaders.indexOf(d)]
            );
  
            if (columnConfig.formatType == "array" && data.length > 1) {
              var array = data.split("°");
              var html = "";
              if (columnConfig.dataType == "currency") {
                array.forEach((e) => {
                  if (e != "") {
                    html += `<br>-${formatter.format(e)}`;
                  }
                });
              } else if (columnConfig.dataType == "URL" && data.length > 1) {
                array.forEach((e) => {
                  if (e != "") {
                    html += `<a href="${e}" target="_blank">Link</a>`;
                  }
                });
              } else if (columnConfig.dataType == "date") {
                array.forEach((d) => {
                  if (e != "") {
                    html += `<br>-${e.slice(0, 10)}`;
                  }
                });
              } else {
                array.forEach((d) => {
                  if (d != "") {
                    html += `<br>-${d}`;
                  }
                });
              }
              var data = html;
            } else if (columnConfig.dataType == "currency") {
              var data = formatter.format(data);
            } else if (columnConfig.dataType == "imageURL") {
              var data = "<img src=" + data + ' width="60px" height="25px">';
            } else if (columnConfig.dataType == "URL" && cellData.length > 1) {
              var data = `<a href="${data}" target="_blank">Link</a>`;
            } else if (columnConfig.dataType == "date") {
              var data = data.slice(0, 10);
            } else if (columnConfig.button) {
              if (columnConfig.buttonCondition == data) {
                var data = `<button type="button" class="btn btn-success btn-block" onClick="botonEditar(${x}, '${columnConfig.button}')">${data}</button>`;
              } else {
                var data = `<button type="button" class="btn btn-info btn-block" onClick="botonEditar(${x}, '${columnConfig.button}')">${data}</button>`;
              }
            }
  
            innerCardBody += `
            <b>${d}: </b>${data}<br>
        `;
          });
  
          var buttonColor = "primary";
          if (columnConfig.buttonCondition == cellData) {
            var buttonColor = "success";
          }
  
          row.insertCell(y).innerHTML = `
              <button class="btn btn-${buttonColor} btn btn-block" type="button" data-toggle="collapse" data-target="#collapse${x}-${y}" aria-expanded="false" aria-controls="collapseExample">
          ${cellData}
        </button>
      <div class="collapse" id="collapse${x}-${y}">
      <div class="card card-body">
      ${innerCardBody}
      </div>
      </div>`;
        } else if (columnConfig.dataType == "currency") {
          row.insertCell(y).innerHTML = formatter.format(cellData);
        } else if (columnConfig.dataType == "imageURL") {
          row.insertCell(y).innerHTML =
            "<img src=" + cellData + ' width="60px" height="25px">';
        } else if (columnConfig.dataType == "URL" && cellData.length > 1) {
          row.insertCell(
            y
          ).innerHTML = `<a href="${cellData}" target="_blank">Link</a>`;
        } else if (columnConfig.dataType == "date") {
          row.insertCell(y).innerHTML = cellData.slice(0, 10);
        } else if (columnConfig.button) {
          if (columnConfig.buttonCondition == cellData) {
            row.insertCell(
              y
            ).innerHTML = `<button type="button" class="btn btn-success btn-block" onClick="botonEditar(${x}, '${columnConfig.button}')">${cellData}</button>`;
          } else {
            row.insertCell(
              y
            ).innerHTML = `<button type="button" class="btn btn-info btn-block" onClick="botonEditar(${x}, '${columnConfig.button}')">${cellData}</button>`;
          }
        } else {
          row.insertCell(y).innerHTML = cellData;
        }
      }
      //boton para editar al registro
      //boton para editar al cliente
      const puedeEditar = permisosByUser.opciones.find(
        (permiso) => permiso === "PuedeEditar"
      );
  
      const PuedeEliminar = permisosByUser.opciones.find(
        (permiso) => permiso === "PuedeEliminar"
      );
      row.insertCell(y).innerHTML =
        `${
          puedeEditar
            ? `<button id="'${datosTabla[x][0]}'" type="button" class="btn btn-secondary btn-sm" onclick="botonEditar('${x}')"><i class="fas fa-pencil-alt"></i></button>`
            : ""
        }` +
        `${
          PuedeEliminar
            ? `<button id="${datosTabla[x][0]}" type="button" class="btn btn-danger btn-sm" onclick="eliminarRegistro(${x}, '${datosTabla[x][0]}')"><i class="far fa-trash-alt"></i></button}>`
            : ""
        }`;
  
      //Boton para acciones Masivas
      row.insertCell(
        0
      ).innerHTML = ` <td class="text-center"><input type="checkbox" name="checkMasivo" id="${datosTabla[x][0]}" 
          value="${datosTabla[x][0]}" class="checkTabla"></td>`;
    }
    divTabla.appendChild(tabla);
  
    // $("#tabla1>tbody")
  
    let table = $("#tabla1")
      .DataTable({
        dom: "Bfrtip",
        responsive: true,
        lengthMenu: [
          [10, 25, 50, 100, -1],
          [10, 25, 50, 100, "Todos"],
        ],
        columnDefs: [
          {
            targets: [0, 1],
            visible: false,
          },
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
            header: false,
            title: "PDF",
            duplicate: true,
            className: "btn-dark",
            pageOrientation: "landscape",
            pageSize: "A4",
            pageMargins: [5, 5, 5, 5],
            exportOptions: {
              columns: [0, 1, 2, 3, 4, 5, 6, 7],
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
              columns: [0, 1, 2, 3, 4, 5, 6, 7],
            },
          },
          {
            extend: "colvis",
            text: "Columnas",
            className: "btn-dark",
          },
        ],
        select: true,
      })
      .buttons()
      .container()
      .appendTo("#tabla1_wrapper .col-md-6:eq(0)");
    for (z in datosTabla[1]) {
      if (datosTabla[1][z].indexOf("hidden") > -1) {
        // table.column(z).visible(false);
      } else {
        var checkbox = document.getElementById(
          "checkbox" + datosTabla[0][z].replaceAll(" ", "")
        );
        // checkbox.checked = true;
      }
    }
  
    if (filter != " ") {
      $("#botonObtenerTodosLosRegistros").show();
    }
  }
  
  function seleccionarColumnas(columnNumber) {
    var table = $("#tabla1").DataTable();
    var column = table.column(columnNumber);
    column.visible(!column.visible());
  
    var checked = document.getElementById("checkboxRango");
    checked.innerHTML = "Missing";
  }
  
  //Se construye el formulario. La variable de campos, es en caso que se quiera mostrar en el formulario unicamente unos campos especificos
  function construirFormulario(campos) {
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
    var formulario = document.getElementById("modalForm");
    formulario.innerHTML = "";
  
    for (x in datosTabla[0]) {
      var div = document.createElement("div");
      div.setAttribute("class", "row");
      div.id = "div" + datosTabla[0][x].replaceAll(" ", "");
      var columnConfig = JSON.parse(datosTabla[1][x]);
  
      var formType = "input";
      var inputType = "text";
      if (columnConfig.formType) {
        var formType = columnConfig.formType;
      }
      if (columnConfig.inputType) {
        var inputType = columnConfig.inputType;
      }
      var input = document.createElement(formType);
      input.type = inputType;
      input.name = datosTabla[0][x];
      //input.placeholder = datosTabla[0][x];
      input.id = datosTabla[0][x].replaceAll(" ", "");
      input.setAttribute("class", `col-md-8 form-control ${input.id}`);
      if (columnConfig.readOnly) {
        input.setAttribute("readOnly", true);
      }
      if (columnConfig.inputType == "file") {
        input.setAttribute("onchange", `uploadFile("${input.id}")`);
      }
      //En caso de ser allowNew se manda a la funcion para convertir el select en input
      if (columnConfig.allowNew) {
        input.setAttribute(
          "onchange",
          `permitirEscrituraSelector("${input.id}")`
        );
        var defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.innerHTML = "Selecciona";
  
        input.appendChild(defaultOption);
      }
      //En caso de ser multipleInput se agrega el boton para agregar mercancia al lado del input
      if (columnConfig.multipleInput) {
        var botonMultipleInput = document.createElement("span");
        botonMultipleInput.id =
          "botonMultipleInput" + datosTabla[0][x].replaceAll(" ", "");
        botonMultipleInput.innerHTML = "+";
        botonMultipleInput.setAttribute("class", "badge badge-warning");
        botonMultipleInput.setAttribute(
          "onclick",
          `agregarMultipleInput("${datosTabla[0][x].replaceAll(" ", "")}")`
        );
  
        //Se elimina todas las urls guardadas en caso de haber in imput file
        document.querySelectorAll(".storedURL").forEach((e) => e.remove());
      }
  
      var label = document.createElement("Label");
      label.id = "label" + datosTabla[0][x].replaceAll(" ", "");
      //label.htmlFor =  datosTabla[0][x];
      label.innerHTML = datosTabla[0][x];
      label.setAttribute("class", "col-md-4");
  
      formulario.appendChild(div);
      div.appendChild(label);
      div.appendChild(input);
      if (columnConfig.multipleInput) {
        label.appendChild(botonMultipleInput);
      }
    }
    var buttonAgregar = document.createElement("Button");
    buttonAgregar.innerHTML = "Guardar";
    buttonAgregar.id = "botonFormulario";
    buttonAgregar.setAttribute("class", "btn btn-primary mt-3 mx-auto d-block");
    buttonAgregar.setAttribute("onclick", "submitInfo()");
  
    var buttonBorrar = document.createElement("Button");
    buttonBorrar.innerHTML = "Borrar Formulario";
    buttonBorrar.id = "botonBorrarFormulario";
    buttonBorrar.setAttribute("class", "btn btn-warning mt-3 mx-auto");
    buttonBorrar.setAttribute("style", "display: none");
    buttonBorrar.setAttribute("onclick", "construirFormulario()");
  
    formulario.appendChild(buttonAgregar);
    formulario.appendChild(buttonBorrar);
  
    //En esta iteracion se revisan 3 cosas: si existe un campo que es noForm, y se oculta. Si existe un campo con AutoFill y se ejecutan las configuraciones necesarias. En caso que un campo no este en la variable de campos se oculta del formulario
    for (z in datosTabla[1]) {
      var config = JSON.parse(datosTabla[1][z]);
      if (config.readOnly == "noForm") {
        $("#div" + datosTabla[0][z].replaceAll(" ", "")).hide();
      }
      if (config.autoFill) {
        var configValue = config["autoFill"];
        var sourceField = configValue.slice(0, configValue.indexOf("-&gt;"));
        var sourceDatos = JSON.parse(
          datosTabla[1][datosTabla[0].indexOf(sourceField)]
        ).formSource;
        var targetField = datosTabla[0][z];
        var targetDatos = configValue.slice(configValue.indexOf("-&gt;") + 5);
        $("#" + sourceField.replaceAll(" ", "")).attr(
          "onChange",
          `autoFill("${sourceField.replaceAll(
            " ",
            ""
          )}", "${sourceDatos}", "${targetField.replaceAll(
            " ",
            ""
          )}", "${targetDatos}")`
        );
      }
      //Se ocultan todos los campos que no estan establecidos en la variable campos
      if (campos) {
        var camposLista = campos.split(",");
        if (camposLista.indexOf(datosTabla[0][z]) < 0) {
          $("#div" + datosTabla[0][z].replaceAll(" ", "")).hide();
        }
        buttonBorrar.remove();
      }
    }
  
    //En caso que alguno de los campos viene con formSource quiere decir que se tiene que se tiene que popular los selectores con opciones
    for (y in datosTabla[1]) {
      if (JSON.parse(datosTabla[1][y]).formSource) {
        popularOpcionesSelectores();
        break;
      }
    }
  }
  
  //Funcion para popular las opciones de los selectores del formulario
  function popularOpcionesSelectores() {
    //La condicion y la clase que se agrega es para prevenir que se soliciten multiples veces los datos
    if ($("#datosFormularios").attr("class") == undefined) {
      $("#datosFormularios").addClass("enviado");
  
      db.collection("ConfiguracionesGenerales")
        .doc("DatosSelectores")
        .onSnapshot((response) => {
          var datosSelectores = response.data();
          setFormsData(datosSelectores);
        });
    } else {
      setFormsData(
        JSON.parse(document.getElementById("datosFormularios").innerHTML)
      );
    }
  
    function setFormsData(datosFormularios) {
      var datosTabla = JSON.parse(
        document.getElementById("datosCompletos").innerHTML
      );
  
      for (x in datosTabla[1]) {
        if (JSON.parse(datosTabla[1][x]).formSource) {
          var selectId = datosTabla[0][x].replaceAll(" ", "");
          var source = JSON.parse(datosTabla[1][x]).formSource;
          var select = document.getElementById(selectId);
          //select.remove(0);
          for (y in datosFormularios[source]) {
            var element = document.createElement("option");
            element.textContent = datosFormularios[source][y];
            select.appendChild(element);
          }
        }
      }
      //Se revisa si esta configurado el envio por mail del documento
      var dbConfig = datosFormularios["Configuraciones Enviar Mail"];
      var config = dbConfig.find((e) => e.indexOf(baseDeDatos) > -1);
      if (config) {
        var idTemplate = config.slice(config.indexOf(":") + 1);
      }
    }
  }
  
  //Esta funcion es para construir el selector de columnas de la tabla
  function construirSelectorDeColumnas() {
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
  
    for (x in datosTabla[0]) {
      var row = document.createElement("li");
      row.setAttribute("class", "dropdown-item");
  
      var columnCheckbox = document.createElement("div");
      columnCheckbox.setAttribute("class", "col");
  
      var columnLabel = document.createElement("div");
      columnCheckbox.setAttribute("class", "col");
  
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "checkbox" + datosTabla[0][x].replaceAll(" ", "");
      checkbox.setAttribute("onclick", "seleccionarColumnas(" + x + ")");
  
      var label = document.createElement("Label");
      label.htmlFor = "checkbox" + datosTabla[0][x].replaceAll(" ", "");
      label.innerHTML = datosTabla[0][x];
      label.setAttribute("style", "padding-left: 6px");
  
      row.appendChild(checkbox);
      row.appendChild(label);
    }
  }
  
  //Funcion para construir los filtros
  function construirFiltros() {
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
    var buscadorDiv = document.getElementById("buscador");
  
    for (x in datosTabla[1]) {
      if (datosTabla[1][x].indexOf("filterText") > -1) {
        var div = document.createElement("div");
        div.setAttribute("class", "col-sm-3");
        var input = document.createElement("input");
        input.type = "input";
        input.placeholder = datosTabla[0][x];
        input.id = "column" + x;
        input.setAttribute("class", "form-control");
        input.setAttribute("onkeyup", "filterSpecificColumn(" + x + ")");
  
        buscadorDiv.appendChild(div);
        div.appendChild(input);
        continue;
      } else if (datosTabla[1][x].indexOf("filterSelect") > -1) {
        var div = document.createElement("div");
        div.setAttribute("class", "col-sm-3");
        var selector = document.createElement("select");
        selector.type = "select";
        selector.placeholder = datosTabla[0][x];
        selector.id = "column" + x;
        selector.setAttribute("class", "form-control");
        selector.setAttribute("onChange", "filterSpecificColumn(" + x + ")");
  
        var valuesOfSelectRaw = [];
  
        for (y in datosTabla) {
          if (y > 1) {
            valuesOfSelectRaw.push(datosTabla[y][x]);
          }
        }
  
        var valuesOfSelectUnique = [...new Set(valuesOfSelectRaw)].sort();
        var option = document.createElement("option");
        option.textContent = datosTabla[0][x];
        option.value = "";
  
        selector.appendChild(option);
  
        for (z in valuesOfSelectUnique) {
          var option = document.createElement("option");
          option.textContent = valuesOfSelectUnique[z];
  
          selector.appendChild(option);
        }
  
        buscadorDiv.appendChild(div);
        div.appendChild(selector);
        continue;
      }
    }
  }
  
  $(".dropdown-toggle").dropdown();
  
  //Fucion para filtrar una columna especifica
  function filterSpecificColumn(idColumn) {
    // $("#tabla1")
    //   .DataTable()
    //   .column(idColumn)
    //   .search($("#column" + idColumn).val())
    //   .draw();
  }
  
  //Funcion del boton para proposito general
  function botonEditar(datosTablaIndex, campos) {
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
    construirFormulario(campos);
  
    var modal = $("#myModal").modal();
    //Se llena la informacion existente en los campos de formulario
    for (y in datosTabla[0]) {
      var columnConfig = JSON.parse(datosTabla[1][y]);
      var cellData = datosTabla[datosTablaIndex][y];
      var fieldId = $("#" + datosTabla[0][y].replaceAll(" ", ""));
      if (columnConfig.dataType == "date") {
        fieldId.val(new Date(cellData).toISOString().substring(0, 10));
      } else if (columnConfig.formatType == "array") {
        var array = cellData.split("°");
        for (z in array) {
          if (z == 0) {
            fieldId.val(array[z]);
          }
        }
      } else {
        fieldId.val(cellData);
      }
      if (columnConfig.edit == false) {
        fieldId.attr("disabled", true);
      }
    }
  }
  
  //Otra funcion para un segundo boton de proposito general
  function testGeneralButton2(datosTablaIndex) {
    $("#tabla2 tr").remove();
  
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
  
    var table = document.getElementById("tabla2");
    for (x in datosTabla[datosTablaIndex]) {
      var row = table.insertRow(-1);
      row.insertCell(0).innerHTML = datosTabla[0][x];
      row.insertCell(1).innerHTML = datosTabla[datosTablaIndex][x];
    }
  
    $(document).ready(function () {
      $("#tabla2").DataTable();
    });
  }
  
  //Funcion utilizada para traer todos los registros sin ningun filtro
  function obtenerTodosLosRegistros() {
    $("#datosCompletos").html("");
    $("#buscador").html(
      `<ul class="dropdown-menu" aria-labelledby="Columnas" id="selectorColmunas" style="left:auto !important;"></ul>`
    );
    $("#selectorColmunas").html("");
    $("#tabla1").html("");
  
    var filter = " ";
    google.script.run
      .withSuccessHandler(setDynamicData)
      .interactWithDb("globalGetQuery", baseDeDatos, filter);
  }
  
  //Funcion para enviar informacion del formulario al servidor
  function submitInfo() {
    event.preventDefault();
    $("#botonFormulario").removeClass("d-block").hide();
    alertaSnackbar("Enviando Peticion", 1000);
  
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
  
    var enteredInfo = {};
  
    for (x in datosTabla[0]) {
      var fieldValue = document.getElementById(
        datosTabla[0][x].replaceAll(" ", "")
      ).value;
      var configColumn = JSON.parse(datosTabla[1][x]);
      if (configColumn.required && fieldValue == "") {
        alert("No ha llenado el campo: " + datosTabla[0][x]);
        $("#botonFormulario").addClass("d-block").show();
        return null;
      } else if (configColumn.multipleInput) {
        var fieldValue = "";
        var fields = document.getElementsByClassName(
          datosTabla[0][x].replaceAll(" ", "")
        );
        //En caso de ser file, los datos se sacan de las urls guardadas
        if (configColumn.inputType == "file") {
          var fields = document.getElementsByClassName("storedURL");
        }
        for (y = 0; y < fields.length; y++) {
          fieldValue += "°" + fields[y].value;
        }
        enteredInfo[datosTabla[0][x]] = fieldValue.split(1);
        continue;
      } else if (configColumn.inputType == "file") {
        enteredInfo[datosTabla[0][x]] = $(
          "#url" + datosTabla[0][x].replaceAll(" ", "")
        ).text();
        continue;
      }
      enteredInfo[datosTabla[0][x]] = fieldValue;
    }
  
    $("#botonBorrarFormulario").addClass("d-block").show();
  
    var boton = document.getElementById("botonFormulario");
    var botonTextoActual = boton.innerHTML;
    boton.innerHTML =
      '<img src="https://icon-library.com/images/spinner-icon-gif/spinner-icon-gif-27.jpg" width="40px" height="15px">';
  
    //Se crea un array con todos los datos nuevos
    var datosNuevos = [];
    for (x in enteredInfo) {
      datosNuevos.push(enteredInfo[x]);
    }
  
    //Condicion para cambiar el ID (cuando esta vacio) en un ID temporal
    if (datosNuevos[0] == "") {
      datosNuevos[0] = "TempID" + Math.floor(Math.random() * 10 ** 3);
    }
  
    //Esto es para guardar los cambios en el JSON local, para que si se interactua con el JSON antes de refrescar la pagina se visualice el
    for (y in datosTabla) {
      if (datosTabla[y][0] == datosNuevos[0]) {
        datosTabla[y] = datosNuevos;
        break;
      } else if (y == datosTabla.length - 1) {
        datosTabla.push(datosNuevos);
      }
    }
  
    document.getElementById("datosCompletos").innerHTML =
      JSON.stringify(datosTabla);
    construirTabla();
  
    //Actualizar Datos
  
    //Elimina espacion de las keys
    const keysWrite = Object.keys(enteredInfo);
    keysWrite.forEach((keyW) => {
      let valueActual = enteredInfo[keyW];
      let keyName = keyW.replace(/ /g, "");
      enteredInfo[keyName] = valueActual;
    });
  
    //Si NO existe el documento lo crea
    if (enteredInfo?.ID) {
      db.collection(TABLE_NAME).doc(enteredInfo.ID).update(enteredInfo);
    } else {
      db.collection(TABLE_NAME).add(enteredInfo);
    }
    //Se revisa si esta configurado el envio por mail del documento
    var dbConfig = datosFormularios["Configuraciones Enviar Mail"];
    var config = dbConfig.find((e) => e.indexOf(baseDeDatos) > -1);
    if (config) {
      var idTemplate = config.slice(config.indexOf(":") + 1);
      google.script.run.envioDocumento(enteredInfo, idTemplate);
    }
  
    function getServerResponse(serverResponse) {
      alertaSnackbar("Registro agregado o editado con exito!");
    }
  }
  
  //Funcion para eliminar un registro
  function eliminarRegistro(tableIndex, id) {
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
    var dataJson = {};
    dataJson[datosTabla[0][0]] = id;
  
    var text = "Seguro que desea eliminar el registro " + datosTabla[tableIndex][1];
    if (confirm(text) == true) {
      alertaSnackbar("Enviando Peticion", 1000);
  
      //Borrar registro
      db.collection(TABLE_NAME).doc(dataJson.ID).delete();
  
      //Para eliminar inmediatamente la informacion de la tabla
      var table = $("#tabla1").DataTable();
      table
        .row(tableIndex - 2)
        .remove()
        .draw(false);
    } else {
      text = "You canceled!";
    }
  }
  
  //Funcion para subir un archivo a drive
  function uploadFile(formFieldId) {
    $("#botonFormulario").prop("disabled", true);
    var formField = $("#" + formFieldId);
    var file = formField.prop("files")[0];
  
    const reader = new FileReader();
  
    if (file) {
      reader.readAsDataURL(file);
    }
  
    reader.onload = function () {
      var dataJson = {
        data: reader.result,
        formName: baseDeDatos + "-" + formFieldId,
      };
  
      google.script.run
        .withSuccessHandler(serverResult)
        .interactWithDb("enviarArchivo", null, JSON.stringify(dataJson));
  
      function serverResult(url) {
        $("#url" + formFieldId).remove(); //Esto por si ya habia cargado un archivo en ese mismo campo.
        var storedUrl = document.createElement("input");
        storedUrl.value = url;
        storedUrl.id = "url" + formFieldId;
        storedUrl.setAttribute("class", "storedURL");
        storedUrl.setAttribute("readOnly", true);
  
        document.body.appendChild(storedUrl);
  
        $("#botonFormulario").prop("disabled", false);
      }
    };
  }
  
  //Funcion para mostrar alertas en el SnackBar
  function alertaSnackbar(mensaje, timeout = 3000) {
    var snackbar = document.getElementById("snackbar");
    snackbar.innerHTML = mensaje;
  
    snackbar.className = "show";
  
    setTimeout(function () {
      snackbar.className = snackbar.className.replace("show", "");
    }, timeout);
  }
  
  //Funcion para agregar nuevos items en multpleItems
  function agregarMultipleInput(idField) {
    var divToAdd = document.getElementById("div" + idField);
    var elementToRepeat = document.querySelector("#" + idField);
    var clone = elementToRepeat.cloneNode(true);
    clone.id = idField + Math.floor(Math.random() * 10 ** 6);
    clone.classList.add("offset-md-4");
    clone.value = "";
  
    //Se revisa si el tipo de input es file, y en caso afirmativo se modifica el onChange con el nuevo id
    if (clone.type == "file") {
      clone.removeAttribute("onchange");
      clone.setAttribute("onchange", `uploadFile("${clone.id}")`);
    }
  
    divToAdd.appendChild(clone);
  }
  
  function permitirEscrituraSelector(fieldId) {
    var field = $("#" + fieldId);
    var fieldVal = field.val();
    if (fieldVal == "Nuevo") {
      field.replaceWith(
        `<input type="text" id="${fieldId}" class="col-md-8 form-control ${fieldId}}">`
      );
    }
  }
  
  //Funcion que se utiliza para llenar un campo cuando se modifica otro campo
  function autoFill(sourceFieldId, sourceDatos, targetFieldId, targetDatos) {
    $("#" + targetFieldId).val();
  
    var sourceFieldValue = $("#" + sourceFieldId).val();
    var index = datosFormularios[sourceDatos].indexOf(sourceFieldValue);
    var valueTarget = datosFormularios[targetDatos][index];
    $("#" + targetFieldId).val(valueTarget);
  }
  
  function convertirJsonEnArray(json, headers, breakDown = []) {
    //var breakDown = ["elementos"];
    var addMissingColumns = false;
    var breakDownDimension = false;
    //Se quita los espacios de los headers (porque desde firebase vienen sin espacios)
    var headers = headers.map((h) => h.replace(/ /g, ""));
  
    var dataArray = [];
    var actualizarHeaders = [];
  
    json.forEach((e) => {
      var rowArray = new Array(headers.length).fill("");
      var allFields = e;
      for (x in allFields) {
        var indexOfKey = headers.indexOf(x);
        var keyValue = Object.keys(allFields[x]);
        var value = allFields[x];
        if (typeof value == "object") {
          var value = JSON.stringify(value);
        }
        if (indexOfKey > -1) {
          rowArray.splice(indexOfKey, 1, value);
        } else if (breakDown.indexOf(x) > -1 && breakDownDimension) {
          var typeOfObjectToSpread = Object.keys(allFields[x])[0];
          if (typeOfObjectToSpread == "arrayValue") {
            try {
              var objectToSpread =
                allFields[x].arrayValue.values[0].mapValue.fields;
            } catch (err) {
              console.log(
                "🚀 ~ file: construirTabla.js ~ line 922 ~ json.forEach ~ err",
                err
              );
            }
          } else {
            var objectToSpread = allFields[x].mapValue.fields;
          }
          for (y in objectToSpread) {
            var indexOfKey = headers.indexOf(x + "/" + y);
            var keyValue = Object.keys(objectToSpread[y])[0];
            rowArray.splice(
              indexOfKey,
              1,
              JSON.stringify(objectToSpread[y][keyValue]).slice(1).slice(0, -1)
            );
          }
        } else if (addMissingColumns) {
          headers.push(x);
          rowArray.push(value);
          actualizarHeaders.push(x);
          dataArray.forEach((array) => array.push(""));
        }
      }
      dataArray.push(rowArray);
    });
  
    return dataArray;
  }
  
  const cargarExcel = () => {
    var file = document.querySelector("#fileExcel").files[0];
    var type = file.name.split(".");
    if (type[type.length - 1] !== "xlsx" && type[type.length - 1] !== "xls") {
      console.log("no es un archivo de excel");
      return false;
    }
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (e) => {
      const data = e.target.result;
      const zzexcel = window.XLS.read(data, {
        type: "binary",
      });
      const result = [];
      for (let i = 0; i < zzexcel.SheetNames.length; i++) {
        const newData = window.XLS.utils.sheet_to_json(
          zzexcel.Sheets[zzexcel.SheetNames[i]]
        );
        //Se filtran todos las filas vacias
        result.push(...newData.filter((item) => item["Razon Social"] != ""));
      }
      swal({
        title: "Advertencia",
        text: "No cierre ni refresque esta pagina, se esta cargando el archivo",
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
  
      Promise.all(
        result.map((item, index) => {
          let idIndexCantidad = document.getElementById("idIndexCantidad");
          idIndexCantidad.value = `Subiendo ${TABLE_NAME}... ${index} de ${result.length}`;
          let newObjCampo = {};
          headersSchema.forEach((header) => {
            const value = item[header];
            const key = header;
            if (value !== undefined && value !== null && value !== "") {
              newObjCampo[key.replace(/ /g, "")] = value;
            }
          });

          //If the new object is empty, it means that the row is empty
          if (Object.keys(newObjCampo).length === 0) {
            return;
          }
          return db.collection(TABLE_NAME).add(newObjCampo);
        })
      ).then(() => {
        swal("Success!", "Los registros fueron cargados!", "success");
      });
    };
  };
  
  /**************************************************/
  /* BORRAR MULTIPLE */
  // Elimina los registros seleccionados en firebase
  const borrarMultiple = () => {
    swal({
      title: "Advertencia",
      text: "No cierrre ni refresque esta pagina, se esta actualizando",
      icon: "warning",
    });
  
    if (confirm("¿Deseas eliminar los registros seleccionados?") == 1) {
      Promise.all(
        $.map($('input:checkbox[name="checkMasivo"]:checked'), function (val, i) {
          // value, index
          // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
          let id = val.value;
          //console.log(val, id);
  
          return db
            .collection(TABLE_NAME)
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
        var requestOptions = {
          method: "GET",
          redirect: "follow",
        };
        fetch(window.URLUpdateMercancia, requestOptions)
          .then((response) => response.text())
          .then(() => {
            swal({
              title: "Registros Eliminados",
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
    if ($(".checkTabla").length != $(".checkTabla:checked").length) {
      $(".checkTabla").prop("checked", true);
      $("#selectAll").prop("checked", true);
    } else {
      $(".checkTabla").prop("checked", false);
      $("#selectAll").prop("checked", false);
    }
  
    // Deseleccionar los checkbox
    if ($(".checkTabla").length == $(".checkTabla:checked").length) {
      $(".checkTabla").prop("checked", true);
      $("#selectAll").prop("checked", true);
    } else {
      $(".checkTabla").prop("checked", false);
      $("#selectAll").prop("checked", false);
    }
  };
  
  /* EDICIÓN MULTIPLE */
  // Se abre una ventana modal y se muestran todos los registros que se seleccionaron para Editar
  const edicionMultiple = () => {
    console.log("here1");
  
    //construirFormulario();
    console.log("here2");
    $("#myModal").modal("show");
    $("#botonFormulario").attr("onClick", "submitInfoMasive()");
    $("#botonFormulario").text("Editar Masivamente");
  };
  
  //Funcion para editar masivamente
  const submitInfoMasive = () => {
    event.preventDefault();
  
    var datosTabla = JSON.parse(
      document.getElementById("datosCompletos").innerHTML
    );
  
    var enteredInfo = {};
  
    for (x in datosTabla[0]) {
      var fieldValue = document.getElementById(
        datosTabla[0][x].replaceAll(" ", "")
      ).value;
      var configColumn = JSON.parse(datosTabla[1][x]);
      if (configColumn.multipleInput) {
        var fieldValue = "";
        var fields = document.getElementsByClassName(
          datosTabla[0][x].replaceAll(" ", "")
        );
        //En caso de ser file, los datos se sacan de las urls guardadas
        if (configColumn.inputType == "file") {
          var fields = document.getElementsByClassName("storedURL");
        }
        for (y = 0; y < fields.length; y++) {
          fieldValue += "°" + fields[y].value;
        }
        enteredInfo[datosTabla[0][x]] = fieldValue.split(1);
        continue;
      } else if (configColumn.inputType == "file") {
        enteredInfo[datosTabla[0][x]] = $(
          "#url" + datosTabla[0][x].replaceAll(" ", "")
        ).text();
        continue;
      }
      enteredInfo[datosTabla[0][x].replaceAll(" ", "")] = fieldValue;
    }
  
    var checkedBox = $.map(
      $('input:checkbox[name="checkMasivo"]:checked'),
      function (val, i) {
        let id = val.value;
        console.log(id);
  
        let keys = Object.keys(enteredInfo);
  
        for (key in enteredInfo) {
          if (enteredInfo[key] != "") {
            var objectToEdit = {};
            objectToEdit[key] = enteredInfo[key];
            console.log({ objectToEdit, id });
            db.collection(TABLE_NAME)
              .doc(id)
              .update(objectToEdit)
              .then((response) => {
                //$("#modal-edit-multiple").modal("hide");
              })
              .catch((error) => {
                console.log("🚀 ~ Error al edtiar el registro", error);
              });
          }
        }
        $("#myModal").modal("hide");
      }
    );
  };
  