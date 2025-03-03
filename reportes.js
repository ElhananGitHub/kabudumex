var db = firebase.firestore();

//Funcion para abrir el Iframe de los reportes selecciomnados
function abrirReportes(reporte) {
  logger("Reportes", "Seleccion", reporte);
  var reportesJson = {
    ventas:
      "https://lookerstudio.google.com/embed/reporting/5ef74ad5-b240-417c-86fa-b8e618b0c431/page/F6icD",
    cancelaciones:
      "https://lookerstudio.google.com/embed/reporting/5ef74ad5-b240-417c-86fa-b8e618b0c431/page/p_6aux4dbw9c",
    mercancia:
      "https://lookerstudio.google.com/embed/reporting/5ef74ad5-b240-417c-86fa-b8e618b0c431/page/p_4d6a2tanad",
    ingresos:
      "https://datastudio.google.com/embed/reporting/5dd72789-327e-4b68-b043-6ac7a5a762dc/page/p_2sqj34jstc",
    estadosDeCuenta:
      "https://datastudio.google.com/embed/reporting/5dd72789-327e-4b68-b043-6ac7a5a762dc/page/p_tpvfi2kstc",
    contabilidad:
      "https://datastudio.google.com/embed/reporting/5dd72789-327e-4b68-b043-6ac7a5a762dc/page/p_natru5rovc",
  };

  var iframe = document.getElementById("iframeReportes");
  iframe.src = reportesJson[reporte];
}

//Funcion para ejecutar comando que se actualicen todos los reportes
function actualizarReportes() {
  var accion = "actualizarReportes";
  var area = "Mercancia";
  var url = `https://script.google.com/macros/s/AKfycbz_h49_Jwd2WDtOEsaLovOe0egg6owSD28S34aM9JNz2dxfGFyko_dq0xSiro8MSnoAnQ/exec?accion=${accion}&area=${area}`;
  var boton = document.getElementById("botonActualizarReportes");
  boton.disabled = true;
  boton.innerHTML = "Actualizando...";
  boton.className = "btn btn-secondary btn-sm";

  var requestOptions = {
    method: "GET",
    headers: { "Content-Type": "text/plain" },
  };

  fetch(url, requestOptions)
    .then((response) =>
      response.text().then((data) => {
        console.log(data);
        //var parsed = JSON.parse(data);
        // console.log(parsed.urlDocumentoDownload)
        boton.innerHTML = "Reportes Actualizados";
      })
    )
    .catch((error) => console.log("error", error));
}
