const pMap = require("p-map");

module.exports = ({ publicacionRepository, mercadoLibre, getMlAuth, getPublicacion, insertPublicacionMl, loteRepository, inventarioRepository, traspasoRepository }) => {
	return mapVenta = async (v) => {
		const auth = await getMlAuth();


		const shippingItems = await mercadoLibre.getShippingItems(v.shipping.id, auth);
		const shippingDetails = await mercadoLibre.getShippingDetails(v.shipping.id, auth);
		const tipoEnvio = shippingDetails.logistic_type === "fulfillment" ? "mercado_libre" : "manual";
		const shipping = await mercadoLibre.getShippingCosts(v.shipping.id, auth);

		const costoEnvio = shipping.senders[0].cost;

		const costoEnvioPorProducto = costoEnvio / shippingItems.length

		const tituloPublicacion = v.item.item.title;

		const item = v.order_items[0];
		const cantidad = item.quantity;
		const p_unitario = item.unit_price;
		const costo = 0;
		const total = item.quantity * item.unit_price;
		const comision = item.sale_fee
		const totalComision = item.sale_fee * cantidad;
		const totalPagado = v.total_amount;
		const utilidad = total - costo - comision;
		const costo_envio = costoEnvioPorProducto;
		const orderId = v.id.toString();
		const fechaVenta = v.date_closed;
		const status = v.status;
		const total_pagado = v.paid_amount;
		const vendidoPor = "ML"
		const sku = item.item.seller_sku;
		const shipmentId = v.shipping.id;
        const nicknameComprador = v.buyer.nickname;
        const idComprador = v.buyer.id;
        const tituloURL = "https://www.mercadolibre.com.mx/ventas/" + orderId + "/detalle";
		try{
		var atributos = item.variation_attributes.map((a) => a.value_name).join(" - ");
		} catch(e){
			var atributos = ""
		}
	

        



		const objetoVenta = {
			tituloPublicacion,
			cantidad,
			p_unitario,
			costo,
			total,
			comision,
			totalComision,
			totalPagado,
			utilidad,
			costo_envio,
			orderId,
			fechaVenta,
			status,
			total_pagado,
			vendidoPor,
			sku,
			shipmentId,
			nicknameComprador,
			idComprador,
			tituloURL,
			atributos,
		};

		return mapped;
	}
};
