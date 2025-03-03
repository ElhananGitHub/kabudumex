const functions = require("firebase-functions");
const admin = require("firebase-admin");

const axios = require('axios');
const pMap = require('p-map');
const moment = require('moment');

admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "marketertextil",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC04kaWULqNoF6e\ng6ka+d7BnyxuyJtrBudl2VqncKSiPFDVXuIKKsfWU3n+7IowPegXXtpHvPZTB4bt\n8O+Sh56GggtuE4is9D1VakbqgeS7Pi7eUThcoTt+Sndl+di5K/0iAFq0X86mGgDw\n4tWV25hlgFguKN2c8lfAXG5Vu6jV95M0X1U8MasX/iUeZt+sLzXiyTDeMMj091EP\nbF927jZEEC/Wn/GBB8yHOfVjM09FtJ5PzmDXhXev4lCftvRN5yB4e6P9HsfES7Ft\nSLEaioPVAp9uWu+TVwdVIcE3XPr4540RBv74Iyny1RFDqH+vgfknQatYqYImNimd\n+K3NIOZbAgMBAAECggEALXf7umlMm7FGV55M8eUBo7Y5Wxe+SacQn7+FVDWyjL2Q\nrDIPq/KZDT0qm3QmQH4vS0CiqgnL+Y8Y0dMQxcqlhLZH3UG3x5IVoNT4QpaoQpEd\nAvFzs4UsCVD6tn2ZhuKR3Owt4M18irBasDK08dijdFBQ2jmXi443lLknWxGzHSWT\nrZLI+yoDAZJxf4cKzka++aRmyz8xUu7+HMsJtjgUNkG+ytmzKOQeqfZ0Q5tkWzmO\nfF7iWhIM7P9Tz0A5uZfPut07jJyjYN9OWcFCr7jenAAhIN6bUCislK4i72u4/5uq\n3MIll/TIEOwqg0G+31Xw7oEkKZHcrzPwBdiCY843EQKBgQDzhvhC713ywbkBUjkA\nDI3q/mhjXc6t8eeONj9CbCbq+h8d52vc9VsOFBkHkSgkC+pYLaUdfCmk090j5FZl\n4pS4/ddMXWhkI/sJ3rMWaFVY5KQaaAnjh0G8lhqNrxW416lR5+IXuWdfr9PY8Lv/\nIgaEhMdyZi1fE9GgjSOB+xbt9wKBgQC+JfOyU/2sqFvngRVQ0yqcx6uqewmtFSUQ\ntIwFjsaCqrkkYt9zg8LBRtLC1j6i/uVxFgzQeRhlsVgsyP1GIbPJPnUgXgn+GQwj\nBLkHHc+gZ7PApnjjSlXNElcsm8kxuvtfTJ76K7ULqDnyzv0A1MP1m1P8DUZdq7pr\nY27it5TBvQKBgEPuDUhWjuVNZnbY4a+C0P+Q8btuCl35EXdY6HJ1yrFXDeEAkdTz\n1+9oacbzlbfgXwEz0lAUN2WT96awZe1Ls+KaZDkYASuV4cvSBDCm78+5D5GSHdgK\n/apGUKffA/coqUGApk+p1w0Y9cYY+MflTN4gT6Y4nEVeOOZJGHOEf9PnAoGAP6Ib\nx9Xr0tgUyYidRYsle4omnMrIFjA5UznYkhORwzC2/MJJ3TJ+/odhCOsB0zJSPmIO\nr8WWsJGE3Jf2in3E2NgaAlb2KR7gvOdbtFH5pciOky4izo2V4Sb+HWOVFRtp/B58\nJWRzFg+aNPOoH5sUaSEuHe+jWL2biUyhUyX0llECgYEAoJ9B5BnDbiXqxVbF7bZ9\nl2Fgv3LkichA4pFqaKsskYHEEmCYWhv/0WZrdelM/EhbY7TFioki8NIHtFwxlETc\nCj/U7fBYmIjAckH2ULT4JD/y0JG2MtW8W8ehY/l0WQe7QOUB3t83wybLs4Rm6vsz\njTtPoT+l3HMwyhNe2xWRgJU=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-kziw4@marketertextil.iam.gserviceaccount.com",
        "firebaseApiKey": "AIzaSyDmWoPDy76ODJCu47mtB4lnPPLxy8QMjNo"
        }
        ),
    //databaseURL: "https://friendlychat-b87dc-default-rtdb.firebaseio.com"
  });
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true })


// Credenciales de ML
var credentials = {
	appClientId: "4154918412892791",
	appClientSecret: "Ezk4dmQ2MwLNB52gGeeJSCxyrpmyOx5J",
	redirect_uri: "https://script.google.com/macros/s/AKfycbxiVKu1q4fGPE9dlw0Gg_pnEZE61Zt-uKteDZCe8xlPxE0TffDWAdXYZM65yTtovd7H/exec",
	client_id: "642273229",

}

var keys = {
  access_token: 'APP_USR-4154918412892791-090519-bfd4a16f5c5f546d927d5ea2230b8a1f-642273229',
  token_type: 'Bearer',
  expires_in: 21600,
  scope: 'offline_access read write',
  user_id: 642273229,
  refresh_token: 'TG-647c8bf37cfc2d000103c34f-642273229'
}

//Funcion para popular Publicaciones
async function popularPublicaciones(keys) {
    //General Variables
    var accessToken = keys.access_token;
    var sellerId = keys.user_id;

  

    var queryMInventario = await db.collection("MLInventario").get()
    var dataPublicaciones = queryMInventario.docs.map((doc) => doc.data());
    //console.log(dataPublicaciones);
    console.log(dataPublicaciones.length);

    var listaPublicaciones = [];
   
      for (x in dataPublicaciones) {
        //console.log(x)
        var dataPublicacion = dataPublicaciones[x];
        var idPublicacion = dataPublicacion.id;
        var tituloPublicacion = dataPublicacion.title;
        var precioPublicacion = dataPublicacion.price;
        var cantidadInicial = dataPublicacion.initial_quantity;
        var cantidadDisponible = dataPublicacion.available_quantity;
        var cantidadVendida = dataPublicacion.sold_quantity;
        var fechaPublicacion = dataPublicacion.start_time.slice(0, 10);
        var fechaActualizacion = dataPublicacion.last_updated.slice(0, 10);
        var estatusPublicacion = dataPublicacion.status;
        var skuPublicacion = dataPublicacion.attributes.find((e) => e.id == "SELLER_SKU").value_name;
        var linkPublicacion = dataPublicacion.permalink;
        var imagenPublicacion = dataPublicacion.thumbnail;
        var saludPublicacion = dataPublicacion.health * 100;
        var variacionesPublicacion = dataPublicacion.variations.length;
        //var warningsPublicacion = JSON.stringify(dataPublicacion.warnings);

        if(dataPublicacion.inventory_id != null){
          console.log(x)
          console.log(`
          idPublicacion: ${idPublicacion}
          tituloPublicacion: ${tituloPublicacion}
          precioPublicacion: ${precioPublicacion}
          cantidadInicial: ${cantidadInicial}
          cantidadDisponible: ${cantidadDisponible}
          cantidadVendida: ${cantidadVendida}
          fechaPublicacion: ${fechaPublicacion}
          fechaActualizacion: ${fechaActualizacion}
          estatusPublicacion: ${estatusPublicacion}
          skuPublicacion: ${skuPublicacion}
          linkPublicacion: ${linkPublicacion}
          imagenPublicacion: ${imagenPublicacion}
          saludPublicacion: ${saludPublicacion}
          variacionesPublicacion: ${variacionesPublicacion}
          inventoryID: ${dataPublicacion.inventory_id}
          `);
        }

        for (x in dataPublicacion.attributes) { //Esto se neceista porque no todos los vendedores ponen el SKU en sellercustomfield
          if (dataPublicacion.attributes[x].id == "SELLER_SKU") {
            var skuPublicacion = dataPublicacion.attributes[x].value_name
            console.log('skuPublicacion: ',skuPublicacion);
            break;
          }
        }
        
        //Lo siguiente es para stock de Full
        var fullInventoryId = dataPublicacion.inventory_id;
        if(fullInventoryId){
          var infoFull = obtenerStockFull(fullInventoryId, accessToken);
          var fullTotal = infoFull.total;
          var fullDisponible = infoFull.available_quantity;
          var fullNoDisponible = infoFull.not_available_quantity;
          var fullDetalleNoDisponible = infoFull.not_available_detail;
  
          var fullResumenNoDisponible = "";
          for(x in fullDetalleNoDisponible){
            var fullDetalleNoDisponibleStatus = fullDetalleNoDisponible[x].status;
            var fullDetalleNoDisponibleCantidad = fullDetalleNoDisponible[x].quantity;
  
            fullResumenNoDisponible += `-${fullDetalleNoDisponibleStatus}: ${fullDetalleNoDisponibleCantidad}`
          }
  
        } else {
          var fullTotal = "";
          var fullDisponible = "";
          var fullNoDisponible = "";
          var fullResumenNoDisponible = "";
  
        }
  
        listaPublicaciones.push({x: idPublicacion,imagenPublicacion, fechaPublicacion, fechaActualizacion, variacionesPublicacion, precioPublicacion, cantidadInicial, cantidadVendida, cantidadDisponible, saludPublicacion, estatusPublicacion, fullInventoryId, fullTotal, fullDisponible, fullNoDisponible, fullResumenNoDisponible, idPublicacion, tituloPublicacion});
        
        //Agregar las vistas de ultimos 30 dias de la publicacion
        //vistasUltimosTreintaDias(tituloPublicacion, idPublicacion, accessToken);
  
  
        //Con esto se obtienen las variables de cada publicacion
        if (variacionesPublicacion > 1) {
          var variacionesTodas = dataPublicacion.variations;
          var allInventoryIds = []
  
          variacionesTodas.map((e) => {e.inventory_id ? allInventoryIds.push(e.inventory_id) : null});

          //console.log(variacionesTodas);
          //console.log(variacionesTodas.attributes);
  
          //Logger.log("All Inventoriy IDs: " + allInventoryIds)
          //var infoFullVariaciones = obtenerStockFull(allInventoryIds, accessToken)
          //Logger.log("infoFullVariaciones: " + infoFullVariaciones)
          
          for (x in variacionesTodas) {
            var variacionesPublicacion = [];
            for (y in variacionesTodas[x].attribute_combinations) {
              variacionesPublicacion.push(variacionesTodas[x].attribute_combinations[y].value_name);
            }
            var idVariacion = variacionesTodas[x].id;
            var precioVariacion = variacionesTodas[x].price;
            var disponiblesVariacion = variacionesTodas[x].available_quantity;
            var vendidosVariacion = variacionesTodas[x].sold_quantity;
            skuVariacion = variacionesTodas[x].attributes.find((e) => e.id == "SELLER_SKU").value_name;
            var variacionesPublicacionString = [].concat.apply([], variacionesPublicacion).toString();
  
            //Lo siguiente es para stock de Full
            var fullInventoryIdVariacion = variacionesTodas[x].inventory_id;
            //Logger.log("fullInventoryIdVariacion: " + fullInventoryIdVariacion)
            if(fullInventoryIdVariacion){
              /*
              var infoFullVariacion = infoFullVariaciones.find((e) => JSON.parse(e).inventory_id == fullInventoryIdVariacion);
              //Logger.log("infoFullVariacion: " + infoFullVariacion)
              var fullTotalVariacion = infoFullVariacion.total;
              var fullDisponibleVariacion = infoFullVariacion.available_quantity;
              var fullNoDisponibleVariacion = infoFullVariacion.not_available_quantity;
              var fullDetalleNoDisponibleVariacion = infoFullVariacion.not_available_detail;
              */
              
      
              var fullResumenNoDisponibleVariacion = "";
              /*
              for(z in fullDetalleNoDisponibleVariacion){
                var fullDetalleNoDisponibleStatusVariacion = fullDetalleNoDisponibleVariacion[z].status;
                var fullDetalleNoDisponibleCantidadVariacion = fullDetalleNoDisponibleVariacion[z].quantity;
      
                fullResumenNoDisponibleVariacion += `-${fullDetalleNoDisponibleStatusVariacion}: ${fullDetalleNoDisponibleCantidadVariacion}`
              }
              */
      
            } else {
              var fullTotalVariacion = "";
              var fullDisponibleVariacion = "";
              var fullNoDisponibleVariacion = "";
              var fullResumenNoDisponibleVariacion = "";
      
            }
            
  
            listaPublicaciones.push({x: idPublicacion +'-'+ idVariacion +'-'+fullInventoryIdVariacion, item: "",variacionesPublicacionString, precioVariacion, vendidosVariacion, disponiblesVariacion, skuVariacion, fullInventoryIdVariacion, fullTotalVariacion, fullDisponibleVariacion, fullNoDisponibleVariacion, fullResumenNoDisponibleVariacion, idPublicacion, tituloPublicacion});
  
  
          }
          
        }
        
      }

      
      //Create batchs of 500 documents
        var batchs = [];
        while (listaPublicaciones.length > 0){
            batchs.push(listaPublicaciones.splice(0, 500));
        }

        //Upload the batchs to Firestore in collection "DesglosePublicacionesML"
        for (x in batchs){
            var batch = db.batch();
            for (y in batchs[x]){
                var docRef = batchs[x][y].x;
                batch.set(db.collection("DesglosePubML").doc(docRef), batchs[x][y]);
            }
            await batch.commit();
        }

        return "Done"
        

  }

  popularPublicaciones(keys);

//Funcion para completar la autentificacion del refresh (se intercambia el refreshToken por el Token)
async function makeAuthRefresh(refresh_token) {

  const url = "https://api.mercadolibre.com/oauth/token"
  const response = await axios.post(url,{
    grant_type: "refresh_token",
    client_id: credentials.appClientId,
    client_secret: credentials.appClientSecret,
    refresh_token: refresh_token,
    redirect_uri: credentials.redirect_uri
  }, {
    headers: {
      accept: "application/json",
    },
  });

  console.log(response.data);

  return response.data;
}

async function makeMlRequest({url, method, auth, data, retry}){

  //console.log({url, method, auth, data, retry})
  try{
    const response = await axios({
      method,
      url,
      headers:{
        "Authorization": `Bearer ${auth.access_token}`,
      },
      data
    });
    return response.data;
  }catch(e){
    console.log(e)
    const error = e.response.data;
    if(error.status===401 && !retry){
      const refresh = await makeAuthRefresh(auth.refresh_token)
      if(refresh){
        await saveTokenMercadoLibre(refresh);
        const response = await makeMlRequest({url, method, auth, data, retry:true})
        return response.data;
      }
      //refresh
    }else{
      return Promise.reject(new Error(error.message || error));

    }
  }
}

async function getAll({url, auth, limit=20}){
  let offset = 0;
  let data = [];
  let total = 0;
  do{
    const response = await makeMlRequest({url:url+"&offset="+offset, method:"get", auth})	
    data = [...data, ...response.results];
    total = response.paging.total;
    offset += response.results.length;
  }while(total > data.length && data.length<limit );
  return data;
}

/*
function obtenerStockFull(inventoryId, accessToken) {
  var url = `https://api.mercadolibre.com/inventories/${inventoryId}/stock/fulfillment`;
  return "Test"
}
*/

async function obtenerStockFull(inventoryId, keys){

  const url = `https://api.mercadolibre.com/inventories/${inventoryId}/stock/fulfillment`
  const result = await getAll({url, auth, limit:400});

  //console.log(result);
  return result;
}