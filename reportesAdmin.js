var db = firebase.firestore();


//Funcion para abrir el Iframe de los reportes selecciomnados
function abrirReportes(reporte) {
    logger("Reportes", "Seleccion", reporte);
    var reportesJson = {
      mercancia:
        "https://lookerstudio.google.com/embed/reporting/58dc989a-d71d-413e-ac5e-af5011111b72/page/p_4d6a2tanad",
    };
  
    var iframe = document.getElementById("iframeReportes");
    iframe.src = reportesJson[reporte];
  }