var firebaseConfigDesarrollo = {
  apiKey: "AIzaSyCkBN4SSLXQlrWOjEsWZQgPFCZSvegI9aA",
  authDomain: "kabudumex.firebaseapp.com",
  projectId: "kabudumex",
  storageBucket: "kabudumex.firebasestorage.app",
  messagingSenderId: "409964664649",
  appId: "1:409964664649:web:5bbc0491f3066dc0dd2c98",
  //measurementId: "G-QZ9TBM32PN",
};

var firebaseConfigProduccion = {
  apiKey: "AIzaSyCkBN4SSLXQlrWOjEsWZQgPFCZSvegI9aA",
  authDomain: "kabudumex.firebaseapp.com",
  projectId: "kabudumex",
  storageBucket: "kabudumex.firebasestorage.app",
  messagingSenderId: "409964664649",
  appId: "1:409964664649:web:5bbc0491f3066dc0dd2c98",
  //messagingSenderId: "768788946026",
};


const URLUpdateMercanciaDESARROLLO = "https://us-central1-kabudumex.cloudfunctions.net/onUpdateMercancia";
const URLUpdateMercanciaPROD = "https://us-central1-kabudumex.cloudfunctions.net/summarizeInventory";


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
  //window.URLCerrarVenta = `http://localhost:5000/kabudumex/us-central1/cerrarVentas`;
  window.URLFuncionesGenerales = `https://us-central1-${firebaseConfigDesarrollo.projectId}.cloudfunctions.net/executeFuncionesGenerales`;
  window.URLMercadolibreFunctions = 'http://localhost:5001/kabudumex/us-central1/executeMercadolibreFunctions';
  firebase.initializeApp(firebaseConfigDesarrollo);
  window.projectId = firebaseConfigDesarrollo.projectId;
  window.bucketName = firebaseConfigDesarrollo.storageBucket;
}