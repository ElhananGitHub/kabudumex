let db = firebase.firestore();
let storage = firebase.storage();
let newMercanciaList = [];
let skuAgregados = [];

//Se revisa que se tenga una sesion iniciada
if (!sessionStorage.user) {
  document.location.href = "./";
}
const uid = JSON.parse(sessionStorage.user).uid;
db.collection("Usuarios")
  .doc(uid)
  .get()
  .then((responseConfig) => {
    logger("Almacen", "Ingreso");

    //Se revisa que el usuario tenga los permisos para acceder al modulo
    let response = responseConfig.data();
    const tienePermiso = response.modulos.find(
      (modulo) => modulo.modulo == "Almacen"
    );
    if (tienePermiso) {
      db.collection("Ventas")
        .where("EstatusPedido", "in", ["Almacen", "Surtiendo..."])
        .where("delete", "==", false)
        .get()
        .then((response) => {
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
  let divTable = document.getElementById("tblVenta");
  divTable.innerHTML = "";

  let table = document.createElement("table");
  table.id = "tablaVenta";
  table.setAttribute("class", "table table-bordered table-striped");

  divTable.append(table);

  let contenido = `
    <table>

    <thead>
        <tr>
            <th class="align-middle">Numero Orden Venta</th>
            <th class="align-middle">Cliente</th>
            <th class="align-middle">Estatus de la venta</th>
            <th class="align-middle">Opciones</th>
        </tr>

    </thead>
    `;

  contenido += "<tbody>";

  response.forEach((response_data) => {
    let datos = response_data.data();
    let { numero_orden_venta, cliente, EstatusPedido } = datos;
    if (EstatusPedido === "Pendiente") {
      return null;
    }
    contenido += `
                <tr >
                    <td>${numero_orden_venta}</td>
                    <td>${cliente}</td>
                    <td>${EstatusPedido}</td>
                    <td>
                    <button class="btn btn-dark" onclick="agregarProductos('${numero_orden_venta}')" title="Cargar productos"><i class="fas fa-cart-plus"></i></button>
                    <button class="btn btn-info" onclick="cerrarOrden('${numero_orden_venta}')" title="Cerrar la órden"><i class="fas fa-check"></i></button>
                    </td>
                </tr>
                `;
  });

  contenido += "</tbody></table>";

  $("#tablaVenta").html(contenido);

  let tablaRegistros = $("#tablaVenta")
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
            columns: [0],
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
            columns: [0],
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
            columns: [0],
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
        let api = this.api();
        // Se colocan los filtros en las columnas
        $(".filterhead", api.table().footer()).each(function (i) {
          if (i != 1) {
            let column = api.column(i);
            let select = $('<select><option value=""></option></select>')
              .appendTo($(this).empty())
              .on("change", function () {
                let val = $.fn.dataTable.util.escapeRegex($(this).val());

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
    .appendTo("#tablaVenta_wrapper .col-md-6:eq(0)");
};
$(document).ready(function () {
  // Seleccionar un registro
  $("#tablaVenta tbody").on("click", "tr", function () {
    $(this).toggleClass("selected");
  });
});

/**************************************************/
/* AGREGAR PRODUCTOS */
// Se muestra el detalle de la orden para agregar los productos correspondientes
const agregarProductos = (numero_orden_venta) => {
  $("#addProductosHeader").show();
  $("#tblVenta").html("");

  let ventaList = [];
  return db
    .collection("Ventas")
    .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
    .where("delete", "==", false)
    .get()
    .then((response) => {
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });

      //Actualiza la venta a estatus de surtiendo
      db.collection("Ventas").doc(ventaList[0].id).update({
          EstatusPedido: "Surtiendo...",
        })

      const { numero_orden_venta, cliente, elementos } = ventaList[0];
      if (!newMercanciaList.length) {
        newMercanciaList = elementos?.length ? elementos : [];
      }
      //Valida que los skus no hayan sido agregados
      if (!skuAgregados.length) {
        elementos.forEach((item) => {
          if (item?.skus?.length) {
            item.skus.forEach((sku) => {
              skuAgregados.push(sku.sku);
            });
          }
        });
      }
      elementos?.forEach((item, x) => {
        const { categoria, producto, variacion, cantidad } = item;
        // Suma cantidades y renderiza la tabla de skus agregados
        const { htmlElements, cantidadTotal } = sumaTotalSkus(
          categoria,
          producto,
          variacion
        );
        let contenidoTablaSku = "";
        if(cantidadTotal > cantidad){
          alert(`La cantidad de ${categoria} ${producto} ${variacion} es mayor a la solicitada`)
        }
        contenidoTablaSku = `
                <div class="callout callout-${cantidad != cantidadTotal ? "danger" : "success"
          }">
                    <div class="row">
                        <div class="col-lg-8 col-sm-12 col-md-12">
                            <div class="row">
                                <div class="col-3"><label>Categoría</label></div>
                                <div class="col-3" id="categoria_">${categoria}</div>
                            </div>
                            <div class="row">
                                <div class="col-3"><label>Producto</label></div>
                                <div class="col-3" id="producto_">${producto}</div>
                            </div>
                            <div class="row">
                                <div class="col-3"><label>Variación</label></div>
                                <div class="col-3" id="variacion_">${variacion}</div>
                            </div>
                            <div class="row">
                                <div class="col-3"><label>Cantidad</label></div>
                                <div class="col-3" id="cantidad_solicitada-${categoria}-${producto}-${variacion}">${cantidad}</div>
                            </div>
                            <div class="row">
                                <div class="col-3"><label>Cantidad (bultos) Agregada</label></div>
                                <div class="col-3" id="cantidad_add-${categoria}-${producto}-${variacion}">${cantidadTotal}</div>
                            </div>
                          </div>
                        </div>

                        <div class="table-responsive">
                      <table id="${producto}-${variacion}-${cantidad}" class="table table-bordered table-striped">
                          <thead>
                              <tr>
                                  <th>SKU</th>
                                  <th>Cantidad (Bultos)</th>
                                  <th>Kg/Mts/Pz</th>
                                  <th>Disponible Inventario</th>
                                  <th>Opciones</th>
                              </tr>
                          </thead>
                          <tbody>
                          ${htmlElements}
                          </tbody>
                      </table>
                    </div>
                    </div>
                    <input type="hidden" id="item1_" class="form-group">


                    
                </div>
            `;

        $("#numero_orden_venta_venta").html(numero_orden_venta);
        $("#cliente_venta").html(cliente);
        $("#tblVenta").append(contenidoTablaSku);
      });
      $("#tblVenta")
        .append(`<button class="btn btn-primary" onclick="guardarAlmacen()">Guardar Órden</button>
      <button class="btn btn-dark" onclick="cerrarOrden()">Cerrar Órden</button>`);
    });
};

/* Suma cantidades y renderiza la tabla de skus agregados */
const sumaTotalSkus = (categoria, producto, variacion) => {
  var convinacion = newMercanciaList.filter((item) => {
    return (
      item.categoria == categoria &&
      item.producto == producto &&
      item.variacion == variacion
    );
  });

  //Se revisa si existe un producto repetido
  if (convinacion.length > 1) {
    createSw({
      title: "Error",
      text: `${convinacion[0].categoria} - ${convinacion[0].producto} - ${convinacion[0].variacion} esta repetido, se tiene que corregir el pedido para poder surtir.`

    })
    return null
  }

  var convinacion = convinacion[0]

  let cantidadTotal = 0;
  if (convinacion?.skus?.length) {
    const htmlElements = convinacion?.skus
      .map((sku) => {
        const skuID = sku.sku;
        let cantidadDisponible = sku?.cantidad_disponible;
        //Cantiddad actual agregada
        if (
          sku?.cantidad_disponible === null ||
          sku.cantidad_disponible === undefined
        ) {
          db.collection("Mercancia")
            .where("sku", "==", skuID)
            .get()
            .then((response) => {
              let MercanciaList = [];
              response.forEach((doc) => {
                MercanciaList.push({ id: doc.id, ...doc.data() });
              });
              let sukSelected = MercanciaList[0];
              const cantidad_disponibleLabel = document.getElementById(
                `cantidad_disponible${skuID}`
              );
              cantidad_disponibleLabel.innerHTML =
                sukSelected.cantidad_disponible.toString();
            });
        }
        let cantidadActual =
          sku?.cantidadAgregada > 1
            ? parseFloat(sku?.cantidadAgregada)
            : sku.id
              ? 1
              : parseFloat(sku.cantidad);
        cantidadTotal += parseFloat(cantidadActual);
        console.log({skuID, cantidadDisponible, cantidadActual})
        return `<tr>
        <td>${skuID}</td>
        <td><input
              type="number"
              id="${skuID.replaceAll(" ", "")}"
              class="form-control"
              value="${cantidadActual}"
              oninput="changeCantidadSku(this)"
            /></td>
        <td>${sku?.unidades_compradas ? sku?.unidades_compradas : sku.dimesiones
          }</td>
        <td id="cantidad_disponible${skuID}">${cantidadDisponible === undefined || cantidadDisponible === null
            ? ""
            : cantidadDisponible
          }</td>
        <td><button class="btn btn-danger" onclick="borrarSKU('${skuID}')"><i class="far fa-trash-alt"></i></button></td>
       </tr>`;
      })
      .join("");

    return { htmlElements, cantidadTotal };
  } else {
    return { htmlElements: "", cantidadTotal: 0 };
  }
};

/* Suma la cantidad agregada de tosos los sku por categoria, producto y variacion */
const changeCantidadSku = (sku) => {
  for (let i = 0; i < newMercanciaList.length; i++) {
    if (newMercanciaList[i]?.skus?.length) {
      newMercanciaList[i].skus.forEach((skuItem, index) => {
        if (skuItem.sku.replaceAll(" ", "") == sku.id) {
          newMercanciaList[i].skus[index].cantidadAgregada = sku.value;
        }
      });
    }
    const { categoria, producto, variacion } = newMercanciaList[i];
    const cantidadAdd = document.getElementById(
      `cantidad_add-${categoria}-${producto}-${variacion}`
    );
    const convinacion = newMercanciaList.find((item) => {
      return (
        item.categoria == categoria &&
        item.producto == producto &&
        item.variacion == variacion
      );
    });
    if (convinacion?.skus?.length) {
      const totalCantidadBySku = convinacion.skus.reduce((nex, prev) => {
        const cantidadAgregada = parseFloat(
          prev.cantidadAgregada ? prev.cantidadAgregada : 0
        );
        const cantidad = parseFloat(prev.cantidad ? prev.cantidad : 0);
        return (
          parseFloat(nex) +
          parseFloat(cantidadAgregada ? cantidadAgregada : cantidad)
        );
      }, 0);
      cantidadAdd.innerHTML = totalCantidadBySku;


  }
}
};

/**Borra un sku temporalmente agregado por cada convinacion  */
const borrarSKU = (skuID) => {
  for (let i = 0; i < newMercanciaList.length; i++) {
    if (newMercanciaList[i]?.skus?.length) {
      newMercanciaList[i].skus = newMercanciaList[i].skus.filter(
        (sku) => sku.sku != skuID
      );
      if (newMercanciaList[i].skus.length == 0) {
        delete newMercanciaList[i].skus;
      }
    }
  }
  let numero_orden_venta = $("#numero_orden_venta_venta").text();
  agregarProductos(numero_orden_venta).then((result) => {
    skuAgregados = skuAgregados.filter((sku) => sku != skuID);
  });
};

/**************************************************/
/* ESCANEO QR WEBCAM */
// Código para escanear los QR's a través de la webcam
arrayQR = new Array();
arrayOrden = new Array();
let n = 1;
let numero_sku;
function onScanSuccess(qrCodeMessage, isTextSku, isMasivo) {
  if (isTextSku) {
    let skuManual = document.getElementById("skuManual");
    qrCodeMessage = skuManual.value.trim();
    skuManual.value = "";
  }
  let numero_orden_venta = $("#numero_orden_venta_venta").text();
  let MercanciaList = [];

  if (!skuAgregados.some((skulist) => skulist == qrCodeMessage)) {
    skuAgregados.push(qrCodeMessage);

    db.collection("Mercancia")
      .where("sku", "==", qrCodeMessage)
      .get()
      .then((response) => {
        response.forEach((doc) => {
          MercanciaList.push({ id: doc.id, ...doc.data() });
        });

        //console.log({ MercanciaList })
        if (MercanciaList.length == 0) {
          let shutter = new Audio();
          shutter.autoplay = true;
          shutter.src = navigator.userAgent.match(/firefox/)
            ? "beep.ogg"
            : "error.mp3";
            alert(`El sku ${qrCodeMessage} no existe en la base de datos`)
          return;
        }

        if(MercanciaList[0].cantidad_disponible == 0){
          let shutter = new Audio();
          shutter.autoplay = true;
          shutter.src = navigator.userAgent.match(/firefox/)
            ? "beep.ogg"
            : "error.mp3";
          alert(`El sku ${qrCodeMessage} no tiene existencia`)
          return;
        }

        let sukSelected = MercanciaList[0];
        /**Agrega el sku escaneado a su convinacion correspondiente de la orden */
        for (let i = 0; i < newMercanciaList.length; i++) {
          if (
            newMercanciaList[i].categoria == sukSelected.categoria &&
            newMercanciaList[i].producto.replaceAll("  ", " ") == sukSelected.producto.replaceAll("  ", " ") &&
            newMercanciaList[i].variacion == sukSelected.variacion
          ) {
            if (newMercanciaList[i]?.skus?.length) {
              newMercanciaList[i].skus.push(MercanciaList[0]);
              break;
            } else {
              newMercanciaList[i].skus = [MercanciaList[0]];
              break;
            }
          } else {
            //console.log("No existe la convinacion")
            if (i == newMercanciaList.length - 1) {
              let shutter = new Audio();
              shutter.autoplay = true;
              shutter.src = navigator.userAgent.match(/firefox/)
                ? "beep.ogg"
                : "error.mp3";
              alert(`El sku ${qrCodeMessage} no pertenece a la orden`)
              return;
            }
          }
        }
        /**Renderiza el sku escanedo a su convinacion correspondiente*/
        if (!isMasivo) {
          agregarProductos(numero_orden_venta);
        }
     

    let shutter = new Audio();
    shutter.autoplay = true;
    shutter.src = navigator.userAgent.match(/firefox/)
      ? "beep.ogg"
      : "beep.mp3";
    });
  } else {
    let shutter = new Audio();
    shutter.autoplay = true;
    shutter.src = navigator.userAgent.match(/firefox/)
      ? "beep.ogg"
      : "error.mp3";
  }
}

function onScanError(errorMessage) {
  console.log(
    "🚀 ~ file: almacen.js ~ line 315 ~ onScanError ~ errorMessage",
    errorMessage
  );
}

let html5QrcodeScanner = new Html5QrcodeScanner("reader", {
  fps: 10,
  qrbox: 200,
  rememberLastUsedCamera: true,
});
html5QrcodeScanner.render(onScanSuccess, onScanError);

/**************************************************/
/* GUARDAR ALAMACEN */
// Código para escanear los QR's a través de la webcam
const guardarAlmacen = () => {
  newMercanciaList.forEach((mercancia, itemMerca) => {
    if (mercancia?.skus?.length) {
      let skuList = [];
      //Agrega los nuevos sku que se registran con QR
      mercancia.skus.forEach((sku) => {
        const objSku = {
          cantidad:
            parseInt(sku?.cantidadAgregada) > 1 || parseInt(sku?.cantidad) > 1
              ? parseInt(
                sku?.cantidadAgregada ? sku.cantidadAgregada : sku.cantidad
              )
              : 1,
          dimesiones: sku?.unidades_compradas
            ? sku?.unidades_compradas
            : sku.dimesiones,
          sku: sku?.sku,
          numero_orden_compra: sku?.numero_orden_compra,
          costo_unitario: sku?.costo_unitario ?? 0,
        };
        skuList.push(objSku);
      });
      newMercanciaList[itemMerca].skus = skuList;
    }
  });

  const arrSkus = [];
  const arrSkusInfo = [];
  newMercanciaList.forEach((mercancia) => {
    if (mercancia?.skus?.length) {
      mercancia.skus.forEach((sku) => {
        arrSkusInfo.push({ sku: sku?.sku, cantidad: sku.cantidad });
        arrSkus.push(sku?.sku);
      });
    }
  });
  const listExist = [];
  if (skuAgregados.length) {
    /*Guarda en una lista temporal la informacion de firebase de los sku agregados
     y valida que este disponible*/
    Promise.all(
      arrSkus.map((skuElement) => {
        return db
          .collection("Mercancia")
          .where("sku", "==", skuElement)
          .get()
          .then((response) => {
            let mercaList = [];
            response.forEach((doc) => {
              mercaList.push({ id: doc.id, ...doc.data() });
            });
            mercaList.forEach((merca) => {
              const findMerca = arrSkusInfo.find((i) => i.sku == merca.sku);
              if (findMerca.cantidad > merca.cantidad_disponible) {
                listExist.push({
                  sku: merca.sku,
                  cantidad_disponible_Merca: merca.cantidad_disponible,
                  cantidad_solicitada: findMerca.cantidad,
                });
              }
            });
          });
      })
    )
      .then(() => {
        //En caso que no hay skus disponibles muestra un error
        if (listExist.length) {
          createSw({
            title: "Error",
            text: `Los skus ${Array.from(
              listExist,
              (x) => `[${x.sku} - Disponible: ${x.cantidad_disponible_Merca}]`
            ).join(" | ")} no cuentan con inventario suficiente`,
            icon: "error",
          });
          throw new Error("Exception message");
        } else {
          // en caso que todos los sku esten disponibles los guarda en la orden
          console.log({ newMercanciaList });
          let numero_orden_venta = $("#numero_orden_venta_venta").text();
          return db
            .collection("Ventas")
            .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
            .where("delete", "==", false)
            .get()
            .then((response) => {
              let ventaList = [];
              response.forEach((doc) => {
                ventaList.push({ id: doc.id, ...doc.data() });
              });
              const { id } = ventaList[0];
              return db
                .collection("Ventas")
                .doc(id)
                .update({
                  elementos: newMercanciaList,
                  EstatusPedido: "Almacen"
                })
                .then(() => {
                  createSw({title: "Exito", text: "Mercancia actualizada", icon: "success"});
                  window.location.reload();
                })
                .catch((error) => {
                  console.log(
                    "🚀 ~ file: almacen.js ~ line 494 ~ .then ~ error",
                    error
                  );
                });
            });
        }
      })
      .catch((error) => {
        console.log("🚀 ~ file: almacen.js ~ line 532 ~ ).then ~ error", error);
      });
  } else {
    let numero_orden_venta = $("#numero_orden_venta_venta").text();
    db.collection("Ventas")
      .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
      .where("delete", "==", false)
      .get()
      .then((response) => {
        let ventaList = [];
        response.forEach((doc) => {
          ventaList.push({ id: doc.id, ...doc.data() });
        });
        const { id } = ventaList[0];
        //Inserta en firebase los nuevos skus en la orden
        console.log({ newMercanciaList })
        db.collection("Ventas")
          .doc(id)
          .update({
            elementos: newMercanciaList,
            EstatusPedido: "Almacen"
          })
          .then(() => {
            logger("Almacen", "Guardar Pedido", id, newMercanciaList);
            createSw({title: "Exito", text: "Mercancia actualizada", icon: "success"});
            setTimeout(() => {
              // window.location.reload();
            }, 1000);
          })
          .catch((error) => {
            console.log(
              "🚀 ~ file: almacen.js ~ line 494 ~ .then ~ error",
              error
            );
          });
      });
  }
};

/**Cierra la orden cambiando el estado a Surtida */
const cerrarOrden = () => {
  let numero_orden_venta = $("#numero_orden_venta_venta").text();
  db.collection("Ventas")
    .where("numero_orden_venta", "==", parseInt(numero_orden_venta))
    .where("delete", "==", false)
    .get()
    .then((response) => {
      let ventaList = [];
      response.forEach((doc) => {
        ventaList.push({ id: doc.id, ...doc.data() });
      });
      const { id, elementos } = ventaList[0];

      console.log({ "idventa:": id })

      //Sumatoria de las cantidades de los SKUs solicitados en venta
      const elementosTotalCantidad = elementos.reduce((nex, prev) => {
        return parseFloat(nex) + parseFloat(prev.cantidad);
      }, 0);

      //Suma el total de las cantidades de los SKUs actuales en las tablas
      let totalCantidadBySkus = 0;
      elementos.forEach((mercancia) => {
        if (mercancia?.skus?.length) {
          const totalCantidadBySku = mercancia.skus.reduce((nex, prev) => {
            const cantidadAgregada = parseFloat(
              prev.cantidadAgregada ? prev.cantidadAgregada : 0
            );
            const cantidad = parseFloat(prev.cantidad ? prev.cantidad : 0);
            return (
              parseFloat(nex) +
              parseFloat(cantidadAgregada > 0 ? cantidadAgregada : cantidad)
            );
          }, 0);
          totalCantidadBySkus += totalCantidadBySku;
        }
      });
      console.log({ totalCantidadBySkus, elementosTotalCantidad })
      if (totalCantidadBySkus == elementosTotalCantidad) {
        db.collection("Ventas")
          .doc(id)
          .update({
            EstatusPedido: "Pedido surtido",
          })
          .then(() => {
            logger("Almacen", "Cerrar Pedido ", id);
            createSw({
              title: "Guardado",
              text: "El pedido fue actualizado",
              icon: "success",
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((error) => {
            console.log(
              "🚀 ~ file: almacen.js ~ line 549 ~ .then ~ error",
              error
            );
          });
      } else {
        createSw({
          title: "Error",
          text: "Las cantidades guardadas no coinciden con lo solicitado",
          icon: "error",
        });
      }
    });
};

/**
 * Se agrega el sku si contiene el numero de caracteres de un sku
 */

const agregarSkuByInput = (value) => {
  if (value.trim().length === 19) {
    onScanSuccess(value.trim(), true);
  }
};

//Function to surtir masivamente
const surtirMasivamente = (data) => {
  data.forEach((element) => {
    console.log(element);
    onScanSuccess(element.SKU, false, true);
  });

  let numero_orden_venta = $("#numero_orden_venta_venta").text();
  agregarProductos(numero_orden_venta)

  //Wait 1 second and then add the quantity
  setTimeout(() => {
    data.forEach((element) => {
      console.log(element);
      $("#" + element.SKU.replaceAll(" ", "")).val(Number(element.Cantidad));
      changeCantidadSku(document.getElementById(element.SKU.replaceAll(" ", "")));
    })
  }, 2000);
};


//Function to upload excel and convert to json
const cargarExcelSurtidoMasivos = () => {
  var file = document.querySelector("#fileExcel").files[0];
  var type = file.name.split(".");
  if (type[type.length - 1] !== "xlsx" && type[type.length - 1] !== "xls") {
    alert("El archivo no es un excel");
    return false;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, {
      type: "binary"
    });
    workbook.SheetNames.forEach((sheet) => {
      var rowObject = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet]);

      if (rowObject.length > 0) {
        var rowObject = rowObject.filter((obj) => obj.SKU);
        console.log(rowObject)
        surtirMasivamente(rowObject);
      }
    });
  };
  reader.onerror = (ex) => {
    console.log(ex);
  };
  reader.readAsBinaryString(file);

  document.getElementById("fileExcel").value = "";
};
