const axios = require("axios");
const { promisify } = require('util');
const fs = require("fs");

//Firebase storage
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();


//  const admin = require("firebase-admin");
// const { doc } = require("firebase/firestore");


// admin.initializeApp({
//   credential: admin.credential.cert({
//     "type": "service_account",
//     "project_id": "kabudumex",
//     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC04kaWULqNoF6e\ng6ka+d7BnyxuyJtrBudl2VqncKSiPFDVXuIKKsfWU3n+7IowPegXXtpHvPZTB4bt\n8O+Sh56GggtuE4is9D1VakbqgeS7Pi7eUThcoTt+Sndl+di5K/0iAFq0X86mGgDw\n4tWV25hlgFguKN2c8lfAXG5Vu6jV95M0X1U8MasX/iUeZt+sLzXiyTDeMMj091EP\nbF927jZEEC/Wn/GBB8yHOfVjM09FtJ5PzmDXhXev4lCftvRN5yB4e6P9HsfES7Ft\nSLEaioPVAp9uWu+TVwdVIcE3XPr4540RBv74Iyny1RFDqH+vgfknQatYqYImNimd\n+K3NIOZbAgMBAAECggEALXf7umlMm7FGV55M8eUBo7Y5Wxe+SacQn7+FVDWyjL2Q\nrDIPq/KZDT0qm3QmQH4vS0CiqgnL+Y8Y0dMQxcqlhLZH3UG3x5IVoNT4QpaoQpEd\nAvFzs4UsCVD6tn2ZhuKR3Owt4M18irBasDK08dijdFBQ2jmXi443lLknWxGzHSWT\nrZLI+yoDAZJxf4cKzka++aRmyz8xUu7+HMsJtjgUNkG+ytmzKOQeqfZ0Q5tkWzmO\nfF7iWhIM7P9Tz0A5uZfPut07jJyjYN9OWcFCr7jenAAhIN6bUCislK4i72u4/5uq\n3MIll/TIEOwqg0G+31Xw7oEkKZHcrzPwBdiCY843EQKBgQDzhvhC713ywbkBUjkA\nDI3q/mhjXc6t8eeONj9CbCbq+h8d52vc9VsOFBkHkSgkC+pYLaUdfCmk090j5FZl\n4pS4/ddMXWhkI/sJ3rMWaFVY5KQaaAnjh0G8lhqNrxW416lR5+IXuWdfr9PY8Lv/\nIgaEhMdyZi1fE9GgjSOB+xbt9wKBgQC+JfOyU/2sqFvngRVQ0yqcx6uqewmtFSUQ\ntIwFjsaCqrkkYt9zg8LBRtLC1j6i/uVxFgzQeRhlsVgsyP1GIbPJPnUgXgn+GQwj\nBLkHHc+gZ7PApnjjSlXNElcsm8kxuvtfTJ76K7ULqDnyzv0A1MP1m1P8DUZdq7pr\nY27it5TBvQKBgEPuDUhWjuVNZnbY4a+C0P+Q8btuCl35EXdY6HJ1yrFXDeEAkdTz\n1+9oacbzlbfgXwEz0lAUN2WT96awZe1Ls+KaZDkYASuV4cvSBDCm78+5D5GSHdgK\n/apGUKffA/coqUGApk+p1w0Y9cYY+MflTN4gT6Y4nEVeOOZJGHOEf9PnAoGAP6Ib\nx9Xr0tgUyYidRYsle4omnMrIFjA5UznYkhORwzC2/MJJ3TJ+/odhCOsB0zJSPmIO\nr8WWsJGE3Jf2in3E2NgaAlb2KR7gvOdbtFH5pciOky4izo2V4Sb+HWOVFRtp/B58\nJWRzFg+aNPOoH5sUaSEuHe+jWL2biUyhUyX0llECgYEAoJ9B5BnDbiXqxVbF7bZ9\nl2Fgv3LkichA4pFqaKsskYHEEmCYWhv/0WZrdelM/EhbY7TFioki8NIHtFwxlETc\nCj/U7fBYmIjAckH2ULT4JD/y0JG2MtW8W8ehY/l0WQe7QOUB3t83wybLs4Rm6vsz\njTtPoT+l3HMwyhNe2xWRgJU=\n-----END PRIVATE KEY-----\n",
//     "client_email": "firebase-adminsdk-kziw4@kabudumex.iam.gserviceaccount.com",
//     "firebaseApiKey": "AIzaSyDmWoPDy76ODJCu47mtB4lnPPLxy8QMjNo"
//   }),
//   //databaseURL: "https://friendlychat-b87dc-default-rtdb.firebaseio.com"
// });
//  const db = admin.firestore();
const { FieldValue } = require('@google-cloud/firestore');
const { off } = require("process");



let keysML;
//let db;


//getKeysML();
// Obtiene las credenciales desde firebase
async function getKeysML(db) {
	//console.log('getKeysML');
	const docRef = db.collection("ConfiguracionesGenerales").doc("keysML");
	const docSnap = await docRef.get();
	
	var keysMLList = docSnap.data();
	keysML = keysMLList;

	//Check if the token is expired form field expires_in
	const expires_in_seconds = keysML.expires_in;
	const ultimaActualizacion = keysML.ultimaActualizacion?.toDate().getTime();
	const fechaActualTimestamp = new Date().getTime();
	const fechaExpiracionTimestamp = ultimaActualizacion + (expires_in_seconds * 1000);


	if (!ultimaActualizacion || fechaActualTimestamp > fechaExpiracionTimestamp) {
		console.log("Token expirado");
		var keysMLList = await makeAuthRefresh(keysMLList, db)
		keysML = keysMLList;

	}

	return keysMLList;
}



//Funcion para completar la autentificacion (se intercambia el secret code por el Token)
async function makeAuth(code) {
	const url = "https://api.mercadolibre.com/oauth/token";
	const response = await axios.post(url, {
		grant_type: "authorization_code",
		client_id: appClientId,
		client_secret: appClientSecret,
		redirect_uri: redirect_uri,
		code
	}, {
		"headers": {
			"accept": "application/json",
			"content-type": "application/x-www-form-urlencoded",
			"Content-Type": "application/x-www-form-urlencoded"
		},
	});
	// var textAccessToken = "Bearer " + accessTokenParsed;


	return response.data;

}

//makeAuthRefresh()

//Funcion para completar la autentificacion del refresh (se intercambia el refreshToken por el Token)
async function makeAuthRefresh(credentials, db) {

	var credentials = credentials ? credentials : await getKeysML(db);


	const url = "https://api.mercadolibre.com/oauth/token"
	const response = await axios.post(url, {
		grant_type: "refresh_token",
		client_id: credentials.appClientId,
		client_secret: credentials.appClientSecret,
		refresh_token: credentials.refresh_token,
		redirect_uri: credentials.redirect_uri
	}, {
		headers: {
			accept: "application/json",
		},
	});

	console.log(response.data);

	// const keysMLRef = collection(db, "ConfiguracionesGenerales");
	// setDoc(doc(keysMLRef, "keysML"), response.data);

	const docRef = db.collection("ConfiguracionesGenerales").doc("keysML");

	await docRef.update({ ...response.data, ultimaActualizacion: new Date() });

	return response.data;
}

async function makeMlRequest({ url, method, auth, data, retry }) {

	try {
		const response = await axios({
			method,
			url,
			headers: {
				"Authorization": `Bearer ${auth.access_token}`,
			},
			data
		});
		//console.log({response});

		let dataML = null

		if (response.data !== undefined) {
			dataML = response.data;
		}

		return dataML;
	} catch (e) {
		//console.log(e)
		const error = e.response;
		console.log('error');
		//console.log(error);
		if (error != undefined) {
			if (error.status === 401 || error.status === 403 && !retry) {
				console.log("about to refresh token")
				const refresh = await makeAuthRefresh()
				keysML = refresh;
				console.log({ keysML })
				if (refresh) {

					const response = await makeMlRequest({ url, method, auth: keysML, data, retry: true })
					return response;

				}
				//refresh
			} else {
				//console.log("error.data.message:", error.data.message);
				return Promise.reject(new Error(error.message || error));

			}
		} else {
			const refresh = await makeAuthRefresh()
			keysML = refresh;
			if (refresh) {

				//await saveTokenMercadoLibre(refresh);
				const response = await makeMlRequest({ url, method, auth: keysML, data, retry: true })
				return response;

			}

		}
	}
}

async function getAll({ url, auth, limit = 20 }) {
	let offset = 0;
	let data = [];
	let total = 0;
	do {
		const response = await makeMlRequest({ url: url + "&offset=" + offset, method: "get", auth })
		data = [...data, ...response.results];
		total = response.paging.total;
		offset += response.results.length;
	} while (total > data.length && data.length < limit);
	return data;
}

//Function to make multiple request with axios
async function makeMultipleRequests(urls, auth) {

	auth = keysML;

	var headers = {
		"Authorization": "Bearer " + auth.access_token,
	}

	try {
		const requests = urls.map(url => axios.get(url, { headers }));
		const responses = await Promise.all(requests);
		const data = responses.map(response => response.data);
		//console.log(data)
		return data;
	} catch (e) {
		console.log("eror al ejecutar multiple")
		console.log(e.response.status)
		//If request fails with status code 400, we refresh the token and try again
		if (e.response.status == 400 || e.response.status == 401 || e.response.status == 403) {
			console.log({ keysML })
			const refresh = await makeAuthRefresh(keysML.refresh_token)
			keysML = refresh;
			//console.log({refresh})
			if (refresh) {
				//await saveTokenMercadoLibre(refresh);
				const response = await makeMultipleRequests(urls, refresh)
				return response;
			}
		}
	}
}





async function getInfoUser({ auth, id }) {

	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/users/me", method: "get", auth })
	// const url = "https://api.mercadolibre.com/users/me"; //"https://api.mercadolibre.com/users/" + sellerId;

	return response;
}

async function getStockOfItem({ auth, id }) {

	const response = await makeMlRequest({ url: `https://api.mercadolibre.com/stock/fulfillment/operations/search`, method: "get", auth })

	return response;
}

async function getIdsPublicaciones(auth) {

	auth = keysML;

	const url = `https://api.mercadolibre.com/users/${auth.user_id}/items/search/?`
	const result = await getAll({ url, auth, limit: 4000 });

	//console.log(result);
	return result;
}



async function getResource(auth, resource) {
	return await makeMlRequest({ url: `https://api.mercadolibre.com${resource}`, method: "get", auth })
}

async function getOrder({ auth, id }) {
	return await makeMlRequest({ url: `https://api.mercadolibre.com/orders/${id}`, method: "get", auth })
}


async function testGetOrder(){
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();


	const auth = await getKeysML(db);
	//const order = await getOrder({ auth, id: 2000007268712294 });
	//const ads = await makeMlRequest({ url: `https://api.mercadolibre.com/advertising/product_ads_2/campaigns/search?user_id=${auth.user_id}`, method: "get", auth })
	const campaigns = await makeMlRequest({ url: `https://api.mercadolibre.com/advertising/product_ads/ads/MLM1857475583`, method: "get", auth })
	console.log(campaigns, campaigns.campaign_id);
	const adMetric = await makeMlRequest({ url: `https://api.mercadolibre.com/advertising/product_ads_2/campaigns/${campaigns.campaign_id}/ads/metrics?date_from=2024-01-14&date_to=2024-01-16&ids=MLM1857475583`, method: "get", auth })
	console.log(adMetric);

	return

}

 //testGetOrder();

// async function getOrderWithShipping({ auth, id }) {
// 	const order = await getOrder({ auth, id });
// 	const shipping = await getShipmentDetails(auth, order.shipping.id);
// 	return { ...order, shippingDetails: shipping }
// }

async function getOrdersOfSeller({ auth, fromDate, toDate }) {
	const url = `https://api.mercadolibre.com/orders/search?seller=${auth.user_id}&order.date_created.from=${moment().subtract(1, "day").toISOString()}&order.date_created.to=${moment().toISOString()}`//&offset=" + offset`;
	const result = await getAll({ url, auth, limit: 400 });

	return result;
}

async function getOrdersOfSellerWithShipping(args) {
	const ordenes = await getOrdersOfSeller(args);

	const promises = ordenes.map(async (orden) => {
		const shipping = await getShipmentDetails(args.auth, orden.shipping.id);
		return { ...orden, shipping };
	});

	const response = await Promise.all(promises);
	return response;
}


async function getShippingItems(shipmentId, auth) {
	console.log("getShippingItems");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/shipments/" + shipmentId + "/items", method: "get", auth })
	//console.log(response);
	return response;
}

async function getShippingDetails(shipmentId, auth) {
	console.log("getShippingDetails");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/shipments/" + shipmentId, method: "get", auth })
	//console.log(response);
	return response;
}

async function getShippingCosts(shipmentId, auth) {
	console.log("getShippingCosts");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/shipments/" + shipmentId + "/costs", method: "get", auth })
	//console.log(response);
	return response;
}

async function getShipmentDetails(shipmentId, auth) {
	console.log("getShipmentDetails");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/shipments/" + shipmentId + "/costs", method: "get", auth })
	//console.log(response);
	return response;
}

async function getSpecificMediation(mediationId, auth) {
	console.log("getSpecificMediation");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/v1/claims/search?id=" + mediationId, method: "get", auth })
	//console.log(response);
	return response;
}

async function getSpecificMediationReason(reasonId, auth) {
	console.log("getSpecificMediationReason");
	const response = await makeMlRequest({ url: "https://api.mercadolibre.com/post-purchase/sites/MLM/v2/reasons/" + reasonId, method: "get", auth })
	//console.log(response);
	return response;
}

async function getQuestions(auth, unanswered='') {
	const url = `https://api.mercadolibre.com/questions/search?seller_id=${auth.user_id}&sort_fields=date_created&sort_types=ASC&api_version=4&status=${unanswered}`;
	const response = await makeMlRequest({ url, method: "get", auth })
	return response;

}
// curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/stock/fulfillment/operations/search?seller_id=384324657&inventory_id=DEHW09303&date_from=2020-06-01&date_to=2020-06-30


async function getCatalogue({ auth }) {
	const url = `https://api.mercadolibre.com/users/${auth.user_id}/items/search?`
	const response = await getAll({ url, auth, method: "get" });
	// console.log(response);
	const items = await getDetailsOfItem({ auth, catalogue: response });
	//`https://api.mercadolibre.com/items?ids=MLM1497987422&include_attributes=all`
	return items;
}

async function getDetailsOfItem(auth, catalogue) {
	const arrays = [];
	const size = 20;

	while (catalogue.length > 0) {
		arrays.push(catalogue.splice(0, size));
	}

	const promises = arrays.map(async (array) => {
		const ids = array.join(",");
		const url = `https://api.mercadolibre.com/items?ids=${ids}&include_attributes=all`;
		const response = await makeMlRequest({ url, auth, method: "get" });
		return response;
	});

	const aaa = await Promise.all(promises);
	const r = aaa.flat().map((a) => a.body);
	return r;
}

async function getUserCustomer( auth, id ) {

	const response = await makeMlRequest({
		url: `https://api.mercadolibre.com/users/${id}`,
		method: "get",
		auth
	})

	return response;
}


async function getProduct( auth, id ) {

	const response = await makeMlRequest({
		url: `https://api.mercadolibre.com/items/${id}?include_attributes=all`,
		method: "get",
		auth
	})

	return response;
}

async function getVariant({ auth, idPublicacion, idVariante }) {

	const response = await makeMlRequest({
		url: `https://api.mercadolibre.com/items/${idPublicacion}/variations/${idVariante}`,
		method: "get",
		auth
	})

	return response;
}



async function answerQuestion({ idPregunta, auth, respuesta }) {

	const url = `https://api.mercadolibre.com/answers`;
	const response = await makeMlRequest({
		url, method: "post", auth, data: {
			"question_id": idPregunta,
			"text": respuesta
		}
	})


	return response;

}

async function getCategoryML(db, coleccion, documento) {
	const docRef = db.collection(coleccion).doc(documento);
	const docSnap = await docRef.get();

	let categoryML = null;

	if (docSnap.exists) {
		categoryML = docSnap.data();
	}

	//console.log(categoryML);
	return categoryML;
}

async function mapVentaML(v, keys, db) {

	const auth = keys;

	let tipoEnvio = '';
	let costoEnvioPorProducto = 0;

	var shipping_logistic_type = 'No encontrado';
	var shipping_type = 'No encontrado';
	var shipping_substatus = 'No encontrado';
	var shipping_status = 'No encontrado';
	var shipping_method_id = 'No encontrado';

	var status_history_date_shipped = 'No encontrado';
	var status_history_date_returned = 'No encontrado';
	var status_history_date_delivered = 'No encontrado';
	var status_history_date_first_visit = 'No encontrado';
	var status_history_date_not_delivered = 'No encontrado';
	var status_history_date_cancelled = 'No encontrado';
	var status_history_date_handling = 'No encontrado';
	var status_history_date_ready_to_ship = 'No encontrado';

	var fechaRegistro = new Date();


	if (v.shipping.id != null) {

		// getShippingItems
		let shippingItemsML = await getShippingItems(v.shipping.id, auth);
		let shippingItems = null;

		if (shippingItemsML.length > 0) {
			shippingItems = shippingItemsML;
		}


		// shippingDetails
		let shippingDetailsML = await getShippingDetails(v.shipping.id, auth);
		let shippingDetails = null;

		if (shippingDetailsML) {
			//console.log('shippingDetailsML');
			shippingDetails = shippingDetailsML;

			tipoEnvio = shippingDetails.logistic_type === "fulfillment" ? "fullML" : "bodega";
			shipping_logistic_type = shippingDetails.logistic_type ?? "No encontrado";
			shipping_type = shippingDetails.type ?? "No encontrado";
			shipping_substatus = shippingDetails.substatus ?? "No encontrado";
			shipping_status = shippingDetails.status ?? "No encontrado";

			if (shippingDetails.shipping_option) {
				shipping_method_id = shippingDetails.shipping_option.shipping_method_id > 0 ? shippingDetails.shipping_option.shipping_method_id : "No encontrado";
			}

			if (shippingDetails.status_history) {

				status_history_date_shipped = shippingDetails.status_history.date_shipped ?? "No encontrado";
				status_history_date_returned = shippingDetails.status_history.date_returned ?? "No encontrado";
				status_history_date_delivered = shippingDetails.status_history.date_delivered ?? "No encontrado";
				status_history_date_first_visit = shippingDetails.status_history.date_first_visit ?? "No encontrado";
				status_history_date_not_delivered = shippingDetails.status_history.date_not_delivered ?? "No encontrado";
				status_history_date_cancelled = shippingDetails.status_history.date_cancelled ?? "No encontrado";
				status_history_date_handling = shippingDetails.status_history.date_handling ?? "No encontrado";
				status_history_date_ready_to_ship = shippingDetails.status_history.date_ready_to_ship ?? "No encontrado";

			}
		}

		// getShippingCosts
		let costoEnvio = 0;
		let shippingCostsML = await getShippingCosts(v.shipping.id, auth);
		//console.log('shippingCostsML');
		//console.log(shippingCostsML);

		// Costo de Envío
		let shipping = 0;
		if (shippingCostsML.senders.length > 0) {
			
			shipping = shippingCostsML;

			// console.log('shipping');
			// console.log(shipping);
			//console.log('shipping.senders[0].cost: ',shipping.senders[0].cost);

			costoEnvio = shipping.senders[0].cost;

			//console.log('costoEnvio dentro: ',costoEnvio);
		}

		//console.log('costoEnvio fuera: ',costoEnvio);
		//console.log('shippingItems.length: ',shippingItems.length);

		//console.log({costoEnvio});

		if (shippingItems.length > 0) {
			costoEnvioPorProducto = costoEnvio / shippingItems.length;
		}

		//console.log({costoEnvioPorProducto});

	}

	const tituloPublicacion = v.order_items[0].item.title;
	const idPublicacion = v.order_items[0].item.id;
	const idCategory = v.order_items[0].item.category_id;
	const idVariation = v.order_items[0].item.variation_id;

	const id_publicacion = idPublicacion.slice(3);

	const item = v.order_items[0];
	const cantidad = item.quantity;
	const p_unitario = item.unit_price;
	const costo = 0;
	const total = item.quantity * item.unit_price;
	const comision = item.sale_fee
	const totalComision = item.sale_fee * cantidad;
	const totalPagado = v.total_amount;

	const costo_envio = costoEnvioPorProducto;
	const flujoEntrante = totalPagado - totalComision - costo_envio;
	const orderId = v.id.toString();
	const fechaVenta = v.date_closed;
	const status = v.status;
	const total_pagado = v.paid_amount;
	const vendidoPor = "ML"
	const sku = item.item.seller_sku;
	const shipmentId = v.shipping.id;
	const packId = v.pack_id;

	let tags = "No encontrado";
	if (v.tags && v.tags.length > 0) {
		tags = v.tags.toString();
	}

	let internalTags = "No encontrado";
	if (v.internal_tags && v.internal_tags.length > 0) {
		internalTags = v.internal_tags.toString();
	}



	// Comprador
	let nicknameComprador = '';
	let firstnameComprador = '';
	let lastnameComprador = '';
	if (v.buyer.nickname) {
		nicknameComprador = v.buyer.nickname;
	}
	if (v.buyer.first_name) {
		firstnameComprador = v.buyer.first_name;
	}
	if (v.buyer.last_name) {
		lastnameComprador = v.buyer.last_name;
	}
	const idComprador = v.buyer.id;


	const tituloURL = "https://www.mercadolibre.com.mx/ventas/" + orderId + "/detalle";
	const urlPublicacion = `https://articulo.mercadolibre.com.mx/MLM-${id_publicacion}`
	try {
		var atributos = v.order_items[0].item.variation_attributes.map((a) => a.value_name).join(" - ");
	} catch (e) {
		var atributos = ""
	}

	// Categorias de MercadoLibre
	//console.log({idCategory});
	let CatA = 'No encontrado';
	let CatAB = 'No encontrado';
	if (idCategory != '') {
		let getCategory = await getCategoryML(db, "MLCategorias", idCategory);
		if (getCategory != null && getCategory) {
			CatA = getCategory.CatA;
			CatAB = getCategory.CatAB;
		}
	}



	console.log({ status })


	var mediationId = "N/A";
	var reasonId = "N/A";
	var reasonOfCancellation = "N/A";
	var resolutionReason = "N/A";

	var cancelGroup = "N/A";
	var cancelCode = "N/A";
	var cancelDescription = "N/A";
	var cancelRequestedBy = "N/A";
	var cancelDate = "N/A";


	// Status Order
	if (status == "cancelled") {

		var cancelGroup = v.cancel_detail.group;
		var cancelCode = v.cancel_detail.code;
		var cancelDescription = v.cancel_detail.description;
		var cancelRequestedBy = v.cancel_detail.requested_by;
		var cancelDate = v.cancel_detail.date;

		//console.log('mediations');
		//console.log(v.mediations);

		// Mediations
		if (v.mediations && v.mediations.length > 0) {
			//console.log('entro a v.mediations');

			var mediationId = v.mediations[0].id;

			// mediationId
			if (mediationId > 0) {
				//console.log('mediationId > 0'); 

				var specificMediationData = await getSpecificMediation(mediationId, auth);

				if (specificMediationData && specificMediationData.data.length > 0) {
					//console.log('entro a specificMediationData');

					// reasonId
					var reasonId = specificMediationData.data[0].reason_id;
					//console.log({reasonId});

					var specificMediationReason = await getSpecificMediationReason(reasonId, auth);
					//console.log(specificMediationReason);

					if (specificMediationReason && specificMediationReason != null) {
						//console.log('entro a specificMediationReason')
						reasonOfCancellation = specificMediationReason.detail;
					}

					if (specificMediationData.data[0].resolution != null) {
						//console.log('entro a specificMediationData resolution')
						resolutionReason = specificMediationData.data[0].resolution.reason
					}
				}

			}

		}

	}

	const objetoVenta = {
		fechaRegistro,
		idPublicacion,
		idCategory,
		idVariation,
		tituloPublicacion,
		tipoEnvio,
		CatA,
		CatAB,
		cantidad,
		p_unitario,
		total,
		comision,
		totalComision,
		totalPagado,
		costo_envio,
		orderId,
		fechaVenta,
		status,
		total_pagado,
		vendidoPor,
		sku,
		packId,
		tags,
		internalTags,
		shipmentId,
		nicknameComprador,
		firstnameComprador,
		lastnameComprador,
		idComprador,
		tituloURL,
		urlPublicacion,
		atributos,
		cancelGroup,
		cancelCode,
		cancelDescription,
		cancelRequestedBy,
		cancelDate,
		mediationId,
		reasonId,
		reasonOfCancellation,
		resolutionReason,
		shipping_logistic_type,
		shipping_type,
		shipping_substatus,
		shipping_status,
		shipping_method_id,
		status_history_date_shipped,
		status_history_date_returned,
		status_history_date_delivered,
		status_history_date_first_visit,
		status_history_date_not_delivered,
		status_history_date_cancelled,
		status_history_date_handling,
		status_history_date_ready_to_ship,

	};

	//console.log({objetoVenta});
	return objetoVenta;
}

//Function para checar el costo de las ventas
async function checarCostoVentas(arraySkus) {

	//var arraySkus = [{ sku: "SILLONBARBERO1NkEGRO", cantidad: 1, orderId: "2000006246074558", tipoEnvio: "Bodega" }, { sku: "CAMINADORAELECTRICA", cantidad: 4, orderId: "2000006275797732", tipoEnvio: "fullML" }, { sku: "CAMINADORAELECTRICA", cantidad: 1, orderId: "2000006276193992", tipoEnvio: "fullML" }, { sku: "SILLONBARBERO1NEGRO", cantidad: 1, orderId: "2000006277846288", tipoEnvio: "Bodega" }];
  
	//Order arraySkus by sku and tipoEnvio
	arraySkus.sort((a, b) => (a.sku > b.sku) ? 1 : (a.sku === b.sku) ? ((a.tipoEnvio > b.tipoEnvio) ? 1 : -1) : -1)
  
	//Get the cost of each sku
	var skuToCheck;
	var tipoEnvioToCheck;
	var infoTraspasos;
	var indexTraspasoCantidadDisponible;
	var indexTraspasoDisponible;
	var indexTraspaso;
	var cantidadDisponible = 0;
	var costo;
	var totalCantidadVendida = 0;
	for (let v in arraySkus) {
	  var venta = arraySkus[v];
	  var sku = venta.sku;
	  var cantidadVendida = venta.cantidad;
	  var orderId = venta.orderId;
	  var tipoEnvio = venta.tipoEnvio;
  
	  if (tipoEnvio == "fullML") {
		if (skuToCheck != sku) {
		  skuToCheck = sku;
		  tipoEnvioToCheck = tipoEnvio;
		  totalCantidadVendida = 0;
  
		  var queryInventario = await db.collection("InventarioTraspaso").doc(sku).get();
		  var queryData = queryInventario.data();
		  if (!queryData) {
			console.log("No existe el sku en el inventario")
			db.collection("MLVentas").doc(orderId).update({ costoActualizado: false });
			continue;
		  }
		  var infoTraspasos = queryData.traspasos;
		  var indexTraspasoDisponible = infoTraspasos.findIndex((traspaso) => traspaso.cantidadDisponible > 0);
		  var indexTraspaso = indexTraspasoDisponible != -1 ? indexTraspasoDisponible : infoTraspasos.length - 1;
		  console.log({ indexTraspaso, sku })
		  var cantidadDisponible = infoTraspasos[indexTraspaso].cantidadDisponible;
		  var costo = infoTraspasos[indexTraspaso].costo;
		  var numero_orden_compra = infoTraspasos[indexTraspaso].numero_orden_compra;
  
		  totalCantidadVendida += cantidadVendida;
		  cantidadDisponible -= cantidadVendida;
  
		  db.collection("MLVentas").doc(orderId).update({ costoUnitario: costo, costoTotal: costo * cantidadVendida, costoActualizado: true, costoCorrecto: indexTraspasoDisponible != -1 ? true : false, numero_orden_compra });
		} else {
		  totalCantidadVendida += cantidadVendida;
		  cantidadDisponible -= cantidadVendida;
		  db.collection("MLVentas").doc(orderId).update({ costoUnitario: costo, costoTotal: costo * cantidadVendida, costoActualizado: true, costoCorrecto: indexTraspasoDisponible != -1 ? true : false, numero_orden_compra });
		}
  
		//Update the traspaso
		if (!arraySkus[v + 1] || arraySkus[v + 1].sku != sku) {
		  infoTraspasos[indexTraspaso].cantidadVendida += totalCantidadVendida;
		  infoTraspasos[indexTraspaso].cantidadDisponible -= totalCantidadVendida;
		  db.collection("InventarioTraspaso").doc(sku).update({ traspasos: infoTraspasos });
		}
	  }
	}
  }


// Agregamos las publicaciones de ML a Firebase
async function agregarMLInventario(db) {
	console.log('agregarMLInventario');

	var startTime = new Date().getTime();
	var keys = await getKeysML(db);
	//console.log('db',db);

	// Consultamos los ID's de las publicaciones
	let IdsPublicaciones = await getIdsPublicaciones(keys);

	// Obtenemos la información completa de la publicación de ML a trevés de si ID
	let publicacionesArray = await getDetailsOfItem(keys, IdsPublicaciones);

	console.log({ publicacionesArrayLength: publicacionesArray.length });

	// Crea batches de 500 documentos para agregarlos a Firestore
	const publicacionesBatches = [];
	while (publicacionesArray.length > 0) {
		publicacionesBatches.push(publicacionesArray.splice(0, 100));
	}


	publicacionesBatches.forEach(async (currentBatch, index) => {
	// Creamos una operación de escritura por lotes
	const batch = db.batch();

	// Recorremos la matriz de datos y agregamos cada documento al lote
	currentBatch.forEach((data) => {

		let id = data.id;
		//console.log('id:', id);

		//const docRef = doc(collectionRef); // Creamos un nuevo documento con una referencia de identificación única (unique ID)
		const docRef = db.collection("MLInventario").doc(id);
		batch.set(docRef, { ...data }); // Agregamos los datos del lote al nuevo documento creado
	});

	// Confirmamos la operación de escritura por lotes
	await batch.commit();

	console.log(`Added batch ${index + 1} of ${publicacionesBatches.length}`);
    });

	// Actualización de Fecha en MLActualizaciones cuando se corren los Cloud Functions
	var endTime = new Date().getTime();
	var seconds = (endTime - startTime) / 1000;

	let docRefActualizaciones = db.collection("ConfiguracionesGenerales").doc("MLActualizaciones");
	docRefActualizaciones.update({
		publicaciones: { actualizacion: new Date(), segundos: seconds }
	})


	await popularPublicaciones(db);

	return { status: 'ok', updated: publicacionesArray.length };



}



//Funcion para popular Publicaciones
async function popularPublicaciones(db) {

	var keys = keysML ? keysML : await getKeysML(db);

	var startTime = new Date().getTime();

	//var queryMInventario = db.collection("MLInventario").where("status", "==", "active");
	var queryMInventario = db.collection("MLInventario");
	//console.log(queryMInventario);
	var dataInventario = await queryMInventario.get();
	const dataPublicaciones = dataInventario.docs.map(doc => doc.data());
	//console.log(dataPublicaciones);
	console.log({ dataPublicacionesLength: dataPublicaciones.length });


	var listaPublicaciones = [];
	var referenciasPublicaciones = [];
	var publicacionesSinSku = [];
	var publicacionesConSkuNoRegistradoEnInventario = [];

	for (var x in dataPublicaciones) {
		//console.log(x, dataPublicaciones[x])
		var dataPublicacion = dataPublicaciones[x];
		var idPublicacion = dataPublicacion.id;
		var tituloPublicacion = dataPublicacion.title;
		var idCategory = dataPublicacion.category_id;
		var precioPublicacion = dataPublicacion.price;
		var cantidadInicial = dataPublicacion.initial_quantity;
		var cantidadDisponible = dataPublicacion.available_quantity;
		var cantidadVendida = dataPublicacion.sold_quantity;
		var fechaPublicacion = dataPublicacion.start_time.slice(0, 10);
		var fechaActualizacion = dataPublicacion.last_updated.slice(0, 10);
		var estatusPublicacion = dataPublicacion.status;
		//var skuPublicacion = dataPublicacion.seller_custom_field;
		var skuPublicacion = dataPublicacion.attributes.find((e) => e.id == "SELLER_SKU") ? dataPublicacion.attributes.find((e) => e.id == "SELLER_SKU").value_name : "N/A";
		var linkPublicacion = dataPublicacion.permalink;
		var imagenPublicacion = dataPublicacion.thumbnail;
		var saludPublicacion = dataPublicacion.health * 100;
		var variacionesPublicacion = dataPublicacion.variations.length;
		var publicacionPadre = dataPublicacion.variations.length > 0 ? true : false;
		var fullInventoryId = dataPublicacion.inventory_id;
		var idPublicacionCompleta = idPublicacion + "|" + "NA" +(fullInventoryId ? "|" + fullInventoryId : "")
		var referenciaPublicacion = tituloPublicacion + "|" + skuPublicacion + "|" + idPublicacionCompleta;

		// Categorias de MercadoLibre
		//console.log({idPublicacion});
		//console.log({idCategory});
		let CatA = 'No encontrado';
		let CatAB = 'No encontrado';
		if (idCategory != '') {
			let getCategory = await getCategoryML(db, "MLCategorias", idCategory);
			if (getCategory != null && getCategory) {
				CatA = getCategory.CatA;
				CatAB = getCategory.CatAB;
			}
		}

		//console.log({CatA});
		//console.log({CatAB});

		/*
		//var referenciaPublicacion = {};
		referenciaPublicacion.idPublicacion = idPublicacion;
		referenciaPublicacion.skuPublicacion = skuPublicacion;
		referenciaPublicacion.tituloPublicacion = tituloPublicacion.slice(0,10);
		*/

		if (!publicacionPadre) {
			referenciasPublicaciones.push(referenciaPublicacion);
		}



		//Lo siguiente es para stock de Full


		if (fullInventoryId) {
			var infoFull = await obtenerStockFull(fullInventoryId, keys);
			//console.log(infoFull);

			var fullTotal = infoFull.total;
			var fullDisponible = infoFull.available_quantity;
			var fullNoDisponible = infoFull.not_available_quantity;
			var fullDetalleNoDisponible = infoFull.not_available_detail;

			var fullResumenNoDisponible = "";
			for (x in fullDetalleNoDisponible) {
				var fullDetalleNoDisponibleStatus = fullDetalleNoDisponible[x].status;
				var fullDetalleNoDisponibleCantidad = fullDetalleNoDisponible[x].quantity;

				fullResumenNoDisponible += `-${fullDetalleNoDisponibleStatus}: ${fullDetalleNoDisponibleCantidad}`
			}

		} else {

			var fullTotal = 0;
			var fullDisponible = 0;
			var fullNoDisponible = 0;
			var fullResumenNoDisponible = "N/A";
		}

		if (skuPublicacion == "N/A" && publicacionPadre == false) {
			publicacionesSinSku.push({ idPublicacion, tituloPublicacion, publicacionPadre, referenciaPublicacion, linkPublicacion });
		}

		if (skuPublicacion != "N/A" && publicacionPadre == false && estatusPublicacion == 'active') {
			var queryMercancia = await db.collection("Mercancia").where("skuML", "array-contains", skuPublicacion).get();
			var dataMercancia = queryMercancia.docs.map(doc => doc.data());

			if(dataMercancia.length == 0){
				publicacionesConSkuNoRegistradoEnInventario.push({ idPublicacion, tituloPublicacion, publicacionPadre, referenciaPublicacion, linkPublicacion, skuML: skuPublicacion });
			}
		}

		listaPublicaciones.push({ idPublicacionCompleta, imagenPublicacion, fechaPublicacion, fechaActualizacion, variacionesPublicacion, precioPublicacion, cantidadInicial, cantidadVendida, cantidadDisponible, saludPublicacion, estatusPublicacion, fullInventoryId, fullTotal, fullDisponible, fullNoDisponible, fullResumenNoDisponible, idPublicacion, tituloPublicacion, skuPublicacion, publicacionPadre, referenciaPublicacion, CatA, CatAB });

		//Agregar las vistas de ultimos 30 dias de la publicacion
		//vistasUltimosTreintaDias(tituloPublicacion, idPublicacion, accessToken);

		//Con esto se obtienen las variables de cada publicacion
		if (variacionesPublicacion > 0) {
			var variacionesTodas = dataPublicacion.variations;
			var allInventoryIds = []

			variacionesTodas.map((e) => { e.inventory_id ? allInventoryIds.push(e.inventory_id) : "N/A" });

			//console.log(variacionesTodas);
			//console.log(variacionesTodas.attributes);
			//console.log(allInventoryIds);
			var infoFullAllVariations = await obtenerStockFull(allInventoryIds, keys);

			//Logger.log("All Inventoriy IDs: " + allInventoryIds)

			//console.log(infoFullVariaciones);
			//Logger.log("infoFullVariaciones: " + infoFullVariaciones)

			for (x in variacionesTodas) {
				var variacionesPublicacion = [];
				//var referenciaPublicacion = {};

				for (var y in variacionesTodas[x].attribute_combinations) {
					variacionesPublicacion.push(variacionesTodas[x].attribute_combinations[y].value_name);
				}
				var idVariacion = variacionesTodas[x].id;
				var precioVariacion = variacionesTodas[x].price;
				var disponiblesVariacion = variacionesTodas[x].available_quantity;
				var imagenVariacion = `http://http2.mlstatic.com/D_${variacionesTodas[x].picture_ids[0]}-I.jpg`;
				var vendidosVariacion = variacionesTodas[x].sold_quantity;
				//var skuVariacion = variacionesTodas[x].seller_custom_field;
				var skuVariacion = variacionesTodas[x].attributes.find((e) => e.id == "SELLER_SKU") ? variacionesTodas[x].attributes.find((e) => e.id == "SELLER_SKU").value_name : "N/A";
				var variacionesPublicacionString = [].concat.apply([], variacionesPublicacion).toString();






				//Lo siguiente es para stock de Full
				var fullInventoryIdVariacion = variacionesTodas[x].inventory_id;
				//Logger.log("fullInventoryIdVariacion: " + fullInventoryIdVariacion)

				var idPublicacionCompleta = (idPublicacion + '|' + idVariacion) + (fullInventoryIdVariacion ? "|" + fullInventoryIdVariacion : "");
				//var idPublicacionCompleta = fullInventoryIdVariacion ? fullInventoryIdVariacion : "";
				var referenciaPublicacion = tituloPublicacion + "-" + variacionesPublicacionString + "|" + skuVariacion + "|" + idPublicacionCompleta;

				/*
				referenciaPublicacion.idPublicacion = idPublicacion;
				referenciaPublicacion.idVariacion = idVariacion;
				referenciaPublicacion.fullInventoryId = fullInventoryIdVariacion;
				referenciaPublicacion.skuPublicacion = skuVariacion;
				referenciaPublicacion.tituloPublicacion = tituloPublicacion.slice(0,10);
				referenciaPublicacion.tituloVariacion = variacionesPublicacionString;
				*/

				//if (estatusPublicacion == 'active') {
				referenciasPublicaciones.push(referenciaPublicacion);
				//}


				if (fullInventoryIdVariacion) {

					var infoFullVariacion = infoFullAllVariations.find((e) => e.inventory_id == fullInventoryIdVariacion);

					//var infoFullVariacion = infoFullVariaciones.find((e) => JSON.parse(e).inventory_id == fullInventoryIdVariacion);
					//Logger.log("infoFullVariacion: " + infoFullVariacion)
					var fullTotalVariacion = infoFullVariacion.total;
					var fullDisponibleVariacion = infoFullVariacion.available_quantity;
					var fullNoDisponibleVariacion = infoFullVariacion.not_available_quantity;
					var fullDetalleNoDisponibleVariacion = infoFullVariacion.not_available_detail;

					var fullResumenNoDisponibleVariacion = "";

					for (var z in fullDetalleNoDisponibleVariacion) {
						var fullDetalleNoDisponibleStatusVariacion = fullDetalleNoDisponibleVariacion[z].status;
						var fullDetalleNoDisponibleCantidadVariacion = fullDetalleNoDisponibleVariacion[z].quantity;

						fullResumenNoDisponibleVariacion += `-${fullDetalleNoDisponibleStatusVariacion}: ${fullDetalleNoDisponibleCantidadVariacion}`
					}



				} else {
					var fullTotalVariacion = 0;
					var fullDisponibleVariacion = 0;
					var fullNoDisponibleVariacion = 0;
					var fullResumenNoDisponibleVariacion = "N/A";

				} // else

				if (skuVariacion == "N/A") {
					publicacionesSinSku.push({ idPublicacion, tituloPublicacion, publicacionPadre: false, referenciaPublicacion, idVariacion, variacionesPublicacionString, linkPublicacion });
				}

				if (skuVariacion != "N/A" && estatusPublicacion == 'active') {
					var queryMercancia = await db.collection("Mercancia").where("skuML", "array-contains", skuVariacion).get();
					var dataMercancia = queryMercancia.docs.map(doc => doc.data());

					if(dataMercancia.length == 0){
						publicacionesConSkuNoRegistradoEnInventario.push({ idPublicacion, tituloPublicacion, publicacionPadre: false, referenciaPublicacion, idVariacion, variacionesPublicacionString, linkPublicacion, skuML: skuVariacion });
					}
				}


				listaPublicaciones.push({ idPublicacionCompleta, idVariacion, item: "", variacionesPublicacionString, precioVariacion, vendidosVariacion, disponiblesVariacion, skuVariacion, imagenVariacion, fullInventoryIdVariacion, fullTotalVariacion, fullDisponibleVariacion, fullNoDisponibleVariacion, fullResumenNoDisponibleVariacion, idPublicacion, tituloPublicacion, fechaPublicacion, fechaActualizacion, saludPublicacion, estatusPublicacion, publicacionPadre: false, referenciaPublicacion, CatA, CatAB });

			} // for
		} // if
	} // for


	console.log('listaPublicaciones: ' + listaPublicaciones.length);
	console.log('referenciasPublicaciones: ' + referenciasPublicaciones.length);

	//Se guarda el array de referencias de publicaciones
	db.collection("ConfiguracionesGenerales").doc("referenciasPublicaciones").set({ referenciasPublicaciones });
	db.collection("ConfiguracionesGenerales").doc("MLpublicacionesSinSku").set({ publicacionesSinSku });
	db.collection("ConfiguracionesGenerales").doc("MLpublicacionesConSkuNoRegistradoEnInventario").set({ publicacionesConSkuNoRegistradoEnInventario });

	//Se guarda el MLInventario en Firebase
	//Create batchs of 500 documents
	var batchs = [];
	while (listaPublicaciones.length > 0) {
		batchs.push(listaPublicaciones.splice(0, 500));
	}
	//console.log(batchs);


	//Upload the batchs to Firestore in collection "MLDesglosePublicaciones"
	for (let x in batchs) {

		// Obtenemos la referencia a la colección.
		const collectionRef = db.collection("MLDesglosePublicaciones");
		//console.log(docRef);

		// Creamos una operación de escritura por lotes
		const batch = db.batch();

		// Recorremos la matriz de datos y agregamos cada documento al lote
		for (let y in batchs[x]) {

			let id = batchs[x][y].idPublicacionCompleta;
			//console.log('id:',id);

			if (!id || id == "") { console.log(batchs[x][y]); continue; }

			//const docRef = doc(collectionRef); // Creamos un nuevo documento con una referencia de identificación única (unique ID)
			const docRef = db.collection("MLDesglosePublicaciones").doc(batchs[x][y].idPublicacionCompleta);
			batch.set(docRef, batchs[x][y]); // Agregamos los datos del lote al nuevo documento creado
		} // for

		// Confirmamos la operación de escritura por lotes
		await batch.commit();

	} // for batch

	var endTime = new Date().getTime();
	var seconds = (endTime - startTime) / 1000;

	let docRefActualizaciones = db.collection("ConfiguracionesGenerales").doc("MLActualizaciones");
	docRefActualizaciones.set({
		desglosePublicaciones: { actualizacion: new Date(), segundos: seconds }
	}, {
		merge: true
	});



}


// Obtener la información completa del stock de la Publicación de Mercadolibre
async function obtenerStockFull(inventoryId, auth) {

	var auth = keysML;

	if (typeof inventoryId == "string") {

		const url = `https://api.mercadolibre.com/inventories/${inventoryId}/stock/fulfillment`;
		const method = 'GET';
		const result = await makeMlRequest({ url, method, auth });

		//console.log(result);
		return result;

	} else {
		var arrayUrls = [];
		inventoryId.map(i => arrayUrls.push(`https://api.mercadolibre.com/inventories/${i}/stock/fulfillment`))
		try {
			var allResults = await makeMultipleRequests(arrayUrls, auth);
		} catch (e) {
			console.log("error en obtenerStockFull multiple")
		}
		return allResults
	}
}


/***************************************************************************************/
// Obtenemos el webhookMercadoLibre de firebase
async function obtenerWebhookML(db, topic = '', status = '') {
	console.log('obtenerWebhookML');

	let arrResources = [];
	//Date minus 2 hours
	let nowDate = new Date();
	nowDate.setHours(nowDate.getHours() - 1);
	nowDate = nowDate.toISOString();

	const q = db.collection("webhookMercadoLibre").where("topic", "==", topic).where("status", "==", status).where("received", "<", nowDate);

	const querySnapshot = await q.get();

	querySnapshot.forEach((doc) => {
		// doc.data() is never undefined for query doc snapshots
		//console.log(doc.id, " => ", doc.data());

		let datos = doc.data();
		let resource = datos.resource;


		arrResources.push(resource);

	});

	//console.log(arrResources);
	return arrResources;
}

// Obtener la información completa del resource de la Publicación de Mercadolibre
async function obtenerResourceFull(resource, auth) {

	if (typeof resource == "string") {

		const url = `https://api.mercadolibre.com${resource}`;
		const method = 'GET';
		const result = await makeMlRequest({ url, method, auth });

		//console.log(result);
		return result;

	} else {
		var arrayUrls = [];
		resource.map(i => arrayUrls.push(`https://api.mercadolibre.com${i}`))
		var allResults = await makeMultipleRequests(arrayUrls, auth);
		return allResults
	}
}

// Obtener la información completa del resource de la Publicación de Mercadolibre
async function obtenerResource(resource, auth) {
	//console.log('obtenerResource');

	if (typeof resource == "string") {
		//console.log('resource string');

		const url = `https://api.mercadolibre.com${resource}`;
		const method = 'GET';
		const result = await makeMlRequest({ url, method, auth });

		//console.log(result);
		return result;

	}
}

//agregarVentasML(db);

async function agregarVentasML(db) {
	var startTime = new Date().getTime();

	var keys = await getKeysML(db);

	let listaVentas = [];
	let listaOrdenes = [];
	let listaDatos = [];

	var topic = 'orders_v2';
	var status = 'pending';

	// Nos traemos la colección webhookMercadoLibre de Firebase
	var resourcesOrders = await obtenerWebhookML(db, topic, status);

	console.log(resourcesOrders.length);
	for (let i = 0; i < resourcesOrders.length; i++) {
		console.log({ i });
		console.log(resourcesOrders[i]); // Order ID

		// Nos traemos el resource de MercadoLibre
		var resoucesComplete = await obtenerResource(resourcesOrders[i], keys);
		//console.log({resoucesComplete});

		// Procesamos la información del Resource y armamos el objeto que se enviara al Firebase
		let MLVenta = await mapVentaML(resoucesComplete, keys, db);
		//console.log({MLVenta});

		let docWebhookML = `orders${MLVenta.orderId}`;
		//console.log(docWebhookML);

		listaVentas.push(MLVenta);
		listaOrdenes.push(docWebhookML);
		listaDatos.push(
			{
				"sku": MLVenta.sku,
				"cantidad": MLVenta.cantidad,
				"orderId": MLVenta.orderId,
				"tipoEnvio": MLVenta.tipoEnvio,
			}
		);


		let docRefVentas = db.collection("MLVentas").doc(MLVenta.orderId);
		docRefVentas.set({ ...MLVenta, iterations: FieldValue.increment(1) },
			{ merge: true });


		let docRefWebhook = db.collection("webhookMercadoLibre").doc(docWebhookML);
		docRefWebhook.update({
			status: 'processed'
		});


	}


	var endTime = new Date().getTime();
	var seconds = (endTime - startTime) / 1000;

	let docRefActualizaciones = db.collection("ConfiguracionesGenerales").doc("MLActualizaciones");
	docRefActualizaciones.update({ ventas: { actualizacion: new Date(), segundos: seconds } });

	return { status: 'ok', updated: resourcesOrders.length };

}

// Agregamos las preguntas desde el webhook
async function agregarPreguntasML(db) {
	var startTime = new Date().getTime();

	var keys = keysML ? keysML : await getKeysML(db);

	let listaPreguntas = [];

	var topic = 'questions';
	var status = 'pending';

	// Nos traemos las preguntas de ML y las mandamos a Firebase
	var resourcesQuestions = await obtenerWebhookML(db, topic, status);
	console.log(resourcesQuestions.length);
	//console.log(resourcesQuestions);

	for (let i = 0; i < resourcesQuestions.length; i++) {
		//console.log({ i });
		//console.log(resourcesQuestions[i]); // Question ID

		let resourceURL = resourcesQuestions[i];
		let questionID = resourceURL.slice(1)
		let docWebhookML = questionID.replace('/', '');
		console.log({docWebhookML});

		var resoucesComplete = await obtenerResource(resourceURL, keys);
		//console.log(resoucesComplete);

		// Armamos los datos que vamos a enviar a Firebase
		elementos = {};

		let publicacionID = resoucesComplete.item_id;
		let userID = resoucesComplete.from.id;
		let preguntaID = resoucesComplete.id;

		elementos.publicacionID = publicacionID;
		elementos.preguntaID = preguntaID;
		elementos.userID = userID;

		elementos.fechaPregunta = resoucesComplete.date_created;
		elementos.status = resoucesComplete.status;
		elementos.pregunta = resoucesComplete.text;
		
		elementos.deleted_from_listing = resoucesComplete.deleted_from_listing;
		elementos.hold = resoucesComplete.hold;

		elementos.respuesta = null;
		if(resoucesComplete.answer && resoucesComplete.answer != null){
			elementos.respuesta = resoucesComplete.answer.text;
			elementos.statusRespuesta = resoucesComplete.answer.status;
			elementos.fechaRespuesta = resoucesComplete.answer.date_created;
		}
		
		

		// Obtenemos los datos de la Publicación
		let infoPublicacion = await getProduct( keys, publicacionID );
		//console.log( infoPublicacion );

		elementos.tituloPublicacion = infoPublicacion.title;
		elementos.precio = infoPublicacion.price;
		elementos.urlPublicacion = infoPublicacion.permalink;
		elementos.urlImagen = infoPublicacion.thumbnail;
		elementos.urlSecureImagen = infoPublicacion.secure_thumbnail;

		var skuPublicacion = infoPublicacion.attributes.find((e) => e.id == "SELLER_SKU") ? infoPublicacion.attributes.find((e) => e.id == "SELLER_SKU").value_name : "N/A";
		elementos.skuPublicacion = skuPublicacion;

		// Obtenemos los datos del Usuario que desea Comprar
		let infoUser = await getUserCustomer( keys, userID );
		//console.log( infoUser );

		elementos.nickname = infoUser.nickname;

		//console.log(elementos);
		//console.log('*********************');

		// Creamos el documento en Firebase con los datos de la Pregunta y Respuesta
		let doc_id = `${publicacionID}-${preguntaID}`;
		
		let docRefPreguntas = db.collection("MLPreguntas").doc(doc_id);
		docRefPreguntas.set({ ...elementos, iterations: FieldValue.increment(1) },
		{ merge: true });

		
		let docRefWebhook = db.collection("webhookMercadoLibre").doc(docWebhookML);
		docRefWebhook.update({
			status: 'processed'
		});

	} // for

	var endTime = new Date().getTime();
	var seconds = (endTime - startTime) / 1000;

	
	let docRefActualizaciones = db.collection("ConfiguracionesGenerales").doc("MLActualizaciones");
	docRefActualizaciones.update({ preguntas: { actualizacion: new Date(), segundos: seconds } });

	return { status: 'ok', updated: resourcesQuestions.length };

}


// Actualiza ML Ventas
async function actualizarMLVentas(db) {
	var startTime = new Date().getTime();

	var keys = await getKeysML(db);

	let arrResources = [];
	let listaVentas = [];
	let listaOrdenes = [];
	let listaDatos = [];

	const q = db.collection("MLVentas").where("tipoEnvio", "==", "bodega").where("status", "==", "paid").where("shipping_status", "in", ["ready_to_ship", "pending"]);

	const querySnapshot = await q.get();

	querySnapshot.forEach((doc) => {
		// doc.data() is never undefined for query doc snapshots
		//console.log(doc.id, " => ", doc.data());

		let datos = doc.data();
		let resource = datos.orderId;

		arrResources.push(resource);

	});

	console.log(arrResources.length);

	for (let i = 0; i < arrResources.length; i++) {
		console.log({ i });
		console.log(arrResources[i]); // Order ID

		// Nos traemos el resource de MercadoLibre
		var mlRequestComplete = await obtenerResource(`/orders/${arrResources[i]}`, keys);
		//console.log({resoucesComplete});

		// Procesamos la información del Resource y armamos el objeto que se enviara al Firebase
		let MLVenta = await mapVentaML(mlRequestComplete, keys, db);
		//console.log({MLVenta});

		let docWebhookML = `orders${MLVenta.orderId}`;
		//console.log(docWebhookML);

		listaVentas.push(MLVenta);
		listaOrdenes.push(docWebhookML);
		listaDatos.push(
			{
				"sku": MLVenta.sku,
				"cantidad": MLVenta.cantidad,
				"orderId": MLVenta.orderId,
				"tipoEnvio": MLVenta.tipoEnvio,
			}
		);

		//console.log(MLVenta);
		
		let docRefVentas = db.collection("MLVentas").doc(MLVenta.orderId);
		docRefVentas.update({ ...MLVenta, iterations: FieldValue.increment(1) },
			{ merge: true });


		let docRefWebhook = db.collection("webhookMercadoLibre").doc(docWebhookML);
		docRefWebhook.update({
			status: 'processed'
		});
		


	}


	var endTime = new Date().getTime();
	var seconds = (endTime - startTime) / 1000;

	
	let docRefActualizaciones = db.collection("ConfiguracionesGenerales").doc("MLActualizaciones");
	docRefActualizaciones.update({ ventas: { actualizacion: new Date(), segundos: seconds } });
	

	return { status: 'ok', updated: arrResources.length };


}

// Buscar ML Ventas
async function buscarMLVentas(db) {
	console.log('buscarMLVentas');
	var startTime = new Date().getTime();

	var keys = await getKeysML(db);



	let arrResources = [];
	const q = db.collection("MLVentas").limit(4400).offset(640).orderBy("orderId", "desc");

	const querySnapshot = await q.get();
	//console.log('querySnapshot');
	//console.log(querySnapshot);


	querySnapshot.forEach((doc) => {
		// doc.data() is never undefined for query doc snapshots
		//console.log(doc.id, " => ", doc.data());

		let datos = doc.data();
		let resource = datos.orderId;

		arrResources.push(resource);

	});

	//console.log(arrResources);

	for (let i = 0; i < arrResources.length; i++) {
		console.log({ i });
		console.log(arrResources[i]); // Order ID

		// Nos traemos el resource de MercadoLibre
		var resoucesComplete = await obtenerResource(`/orders/${arrResources[i]}`, keys);
		//console.log({resoucesComplete});

		// Procesamos la información del Resource y armamos el objeto que se enviara al Firebase
		let MLVenta = await mapVentaML(resoucesComplete, keys, db);
		//console.log({MLVenta});

		let costo_envio = MLVenta.costo_envio;
		console.log({costo_envio});

		if(costo_envio > 0){

		let docRefVentas = db.collection("MLVentas").doc(MLVenta.orderId);
		docRefVentas.update({ costo_envio },
			{ merge: true });

		}



	}


	return { status: 'ok', updated: arrResources.length };
}

// Agregamos las preguntas desde: 
//https://api.mercadolibre.com/questions/search?seller_id=${auth.user_id}&sort_fields=date_created&sort_types=ASC&api_version=4&status=${unanswered}
/*
async function agregarPreguntasML(db) {
	var startTime = new Date().getTime();

	var keys = keysML ? keysML : await getKeysML(db);

	let listaPreguntas = [];

	var topic = 'questions';
	var status = 'pending';

	// Nos traemos las preguntas de ML y las mandamos a Firebase
	var resourcesQuestions = await getQuestions(keys, 'UNANSWERED');
	console.log(resourcesQuestions.questions.length);
	//console.log(resourcesQuestions);

	for (let i = 0; i < resourcesQuestions.questions.length; i++) {
		//console.log({ i });
		//console.log(resourcesQuestions.questions[i]); // Question ID

		// Armamos los datos que vamos a enviar a Firebase
		elementos = {};

		let publicacionID = resourcesQuestions.questions[i].item_id;
		let userID = resourcesQuestions.questions[i].from.id;
		let preguntaID = resourcesQuestions.questions[i].id;

		elementos.publicacionID = publicacionID;
		elementos.preguntaID = preguntaID;
		elementos.userID = userID;

		elementos.fecha_pregunta = resourcesQuestions.questions[i].date_created;
		elementos.status = resourcesQuestions.questions[i].status;
		elementos.pregunta = resourcesQuestions.questions[i].text;
		
		elementos.deleted_from_listing = resourcesQuestions.questions[i].deleted_from_listing;
		elementos.hold = resourcesQuestions.questions[i].hold;
		elementos.respuesta = resourcesQuestions.questions[i].answer;
		

		// Obtenemos los datos de la Publicación
		let infoPublicacion = await getProduct( keys, publicacionID );
		//console.log( infoPublicacion );

		elementos.tituloPublicacion = infoPublicacion.title;
		elementos.precio = infoPublicacion.price;
		elementos.urlPublicacion = infoPublicacion.permalink;
		elementos.urlImagen = infoPublicacion.thumbnail;
		elementos.urlSecureImagen = infoPublicacion.secure_thumbnail;

		var skuPublicacion = infoPublicacion.attributes.find((e) => e.id == "SELLER_SKU") ? infoPublicacion.attributes.find((e) => e.id == "SELLER_SKU").value_name : "N/A";
		elementos.skuPublicacion = skuPublicacion;

		// Obtenemos los datos del Usuario que desea Comprar
		let infoUser = await getUserCustomer( keys, userID );
		//console.log( infoUser );

		elementos.nickname = infoUser.nickname;

		//console.log(elementos);
		//console.log('****************0');

		let doc_id = `${publicacionID}-${preguntaID}`;
		
		let docRefPreguntas = db.collection("MLPreguntas").doc(doc_id);
		docRefPreguntas.set({ ...elementos, iterations: FieldValue.increment(1) },
		{ merge: true });

	} // for

	return { status: 'ok', updated: resourcesQuestions.length };

}
*/



//Export functions agregarMLInventario, popularPublicaciones, agregarVentasML
module.exports = {
	agregarMLInventario,
	popularPublicaciones,
	agregarVentasML,
	agregarPreguntasML,
	actualizarMLVentas,
	buscarMLVentas,
	makeAuthRefresh,
	getKeysML,
};



/************************************/
// EJECUTAR FUNCIONES
/************************************/
//makeAuthRefresh(keysML.refresh_token);
//agregarMLInventario();
//popularPublicaciones();
//agregarVentasML();



// PRUEBAS - TESTING
//getCategoryML(db,"MLCategorias","MLM11041");

//console.log(moment().subtract(1, "day").toISOString()); // hora con diferencia de 1 día
//console.log(moment().subtract(1, "hour").toISOString()); // hora con diferencia de 1 hora
//console.log(moment().subtract(1, 'h').format()); // hora actual

// var ids = [
// 	'GXBW30661', 'TBXI30516',
// 	'DMVX30500', 'JGTO31295',
// 	'ZEWV30345', 'QKHT29729',
// 	'LCUY30309', 'IUKA33588',
// 	'DINU30117', 'TXPA30690',
// 	'UXUK33162', 'ZRFM30724'
//   ]
// var arrayUrls = [];
// ids.map(i => arrayUrls.push(`https://api.mercadolibre.com/inventories/${i}/stock/fulfillment`));
// makeMultipleRequests(arrayUrls, keys);



/*
async function imprimirEtiquetas(db, dataImpresion) {
	console.log('imprimirEtiquetas');
	console.log(dataImpresion);

	var outputFiles = [];
	let arrImpresion = '';
	if (dataImpresion.includes(",")) {
		arrImpresion = dataImpresion.split(",");
	} else {
		arrImpresion = [dataImpresion];
	}

	// Armamos los arreglos de 50 shippingIds
	etiquetasImpresion = [];
	while (arrImpresion.length > 0) {
		etiquetasImpresion.push(arrImpresion.splice(0, 50));
	}

	console.log(etiquetasImpresion.length);

	var keys = keysML ? keysML : await getKeysML(db);
	//console.log(keys);

	const ACCESS_TOKEN = keys.access_token;

	let bucketName = "kabudumex.appspot.com";
	let folderStorage = "etiquetasML";

	
	// Generamos los PDF's con 50 etiquetas
	for (var i = 0; i < etiquetasImpresion.length; i++) {
		var fileName = etiquetasImpresion[i][0];
		let shippingIds = etiquetasImpresion[i].toString();

		console.log({ fileName });

		//const writeFileAsync = promisify(fs.writeFile);


		// Define the API URL with properly encoded query parameters
		const apiUrl = `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shippingIds}&response_type=pdf`;


		// Set up the request headers
		const headers = {
			'Authorization': `Bearer ${ACCESS_TOKEN}`,
		};

		try {
			const response = await axios.get(apiUrl, { headers, responseType: 'stream' });

			console.log(response.status);
			console.log(response);

			if (response.status === 200) {
				console.log("200")
				// Save the PDF to a file
				const outputFile = `output-${fileName}.pdf`;
				const writer = fs.createWriteStream(`pdfs/${outputFile}`);

				

				response.data.pipe(writer);

				return new Promise((resolve, reject) => {
					writer.on('finish', () => {
						//uploadPDFToStorage('pdfs',fileName,bucketName,folderStorage);
						
						// //Get pdf from folder
						// var pdf = fs.readFileSync(`pdfs/${outputFile}`);

						
						// //Upload pdf to firebase storage
						// const bucket = storage.bucket("kabudumex.appspot.com");
						// const file = bucket.file(`etiquetasML/${outputFile}`);
						// file.save(pdf, {
						// 	metadata: {
						// 		contentType: "application/pdf",
						// 	},
						// 	resumable: false,
						// });

						outputFiles.push(outputFile);

						console.log(`PDF saved to ${outputFile}`);
						
						resolve(outputFile);

					});
					writer.on('error', (error) => {
						reject(error);
					});
				});

			} else {
				console.error(`Received status code ${response.status}: ${response.statusText}`);
				result = { error: "Error", status: response.status, response: response };
				return result;
			}
		} catch (error) {
			console.error('Error:', error.message);
			result = { error: "Error", status: error.message };
			return result;
		}


	} // for
	

}

// imprimirEtiquetas().then(result =>{
// 	//Solo tendras disponible la informacion de la promesa aqui dentro de then
// 	console.log(result);

}).catch(e => console.log(e));






//Export functions agregarMLInventario, popularPublicaciones, agregarVentasML
module.exports = {
	agregarMLInventario,
	popularPublicaciones,
	agregarVentasML,
	imprimirEtiquetas,
	makeAuthRefresh,
	getKeysML,
};



/************************************/
// EJECUTAR FUNCIONES
/************************************/
//makeAuthRefresh(keysML.refresh_token);
//agregarMLInventario();
//popularPublicaciones();
//agregarVentasML();



// PRUEBAS - TESTING
//getCategoryML(db,"MLCategorias","MLM11041");

//console.log(moment().subtract(1, "day").toISOString()); // hora con diferencia de 1 día
//console.log(moment().subtract(1, "hour").toISOString()); // hora con diferencia de 1 hora
//console.log(moment().subtract(1, 'h').format()); // hora actual

// var ids = [
// 	'GXBW30661', 'TBXI30516',
// 	'DMVX30500', 'JGTO31295',
// 	'ZEWV30345', 'QKHT29729',
// 	'LCUY30309', 'IUKA33588',
// 	'DINU30117', 'TXPA30690',
// 	'UXUK33162', 'ZRFM30724'
//   ]
// var arrayUrls = [];
// ids.map(i => arrayUrls.push(`https://api.mercadolibre.com/inventories/${i}/stock/fulfillment`));
// makeMultipleRequests(arrayUrls, keys);
