var firebaseConfigDesarrollo = {
  apiKey: "AIzaSyDmWoPDy76ODJCu47mtB4lnPPLxy8QMjNo",
  authDomain: "marketertextil.firebaseapp.com",
  projectId: "marketertextil",
  storageBucket: "marketertextil.appspot.com",
  messagingSenderId: "945690027765",
  appId: "1:945690027765:web:201e36ea874b619d16c7bc",
  measurementId: "G-QZ9TBM32PN",
};

var firebaseConfigProduccion = {
  apiKey: "AIzaSyBBY1tUbE5Jo0GjOdsbzLa9wWUHJVYEbv8",
  authDomain: "grupomayoreomexico.firebaseapp.com",
  projectId: "grupomayoreomexico",
  storageBucket: "grupomayoreomexico.appspot.com",
  messagingSenderId: "768788946026",
  appId: "1:768788946026:web:d33adffee86ad3539a3e13"
};


const URLUpdateMercanciaDESARROLLO = "https://us-central1-marketertextil.cloudfunctions.net/onUpdateMercancia";
const URLUpdateMercanciaPROD = "https://us-central1-grupomayoreomexico.cloudfunctions.net/summarizeInventory";


if (document.domain) {
  window.URLUpdateMercancia = URLUpdateMercanciaPROD;
  window.URLCerrarVenta = `https://us-central1-${firebaseConfigProduccion.projectId}.cloudfunctions.net/cerrarVentas`;
  window.URLFuncionesGenerales = `https://us-central1-${firebaseConfigProduccion.projectId}.cloudfunctions.net/executeFuncionesGenerales`;
  firebase.initializeApp(firebaseConfigProduccion);
  window.projectId = firebaseConfigProduccion.projectId;
  window.bucketName = firebaseConfigProduccion.storageBucket;
} else {

  window.URLUpdateMercancia = URLUpdateMercanciaDESARROLLO;
  window.URLCerrarVenta = `https://us-central1-${firebaseConfigDesarrollo.projectId}.cloudfunctions.net/cerrarVentas`;
  //window.URLCerrarVenta = `http://localhost:5000/marketertextil/us-central1/cerrarVentas`;
  window.URLFuncionesGenerales = `https://us-central1-${firebaseConfigDesarrollo.projectId}.cloudfunctions.net/executeFuncionesGenerales`;
  window.URLMercadolibreFunctions = 'http://localhost:5001/marketertextil/us-central1/executeMercadolibreFunctions';
  firebase.initializeApp(firebaseConfigDesarrollo);
  window.projectId = firebaseConfigDesarrollo.projectId;
  window.bucketName = firebaseConfigDesarrollo.storageBucket;
}
