const moment = require("moment");
module.exports = ({mercadoLibre, publicacionRepository, configRepository})=>{
  return obtenerProductosMercadoLibre = async (producto) =>{
		
		const productos = [];
		producto.variations?.map(variation=>{
			if(variation.attribute_combinations[0]){
				const nombre = variation.attribute_combinations[0].value_name;
				const sku = getSellerSKUFromAtributes(variation.attributes);
				productos.push({
					titulo:producto.title,
					subtitulo:nombre, 
					sku,  
					url:producto.permalink, 
					img:producto.thumbnail, 
					precio:producto.price, 
					ml_id:producto.id+"", 
					ml_variation_id:variation.id+"", 
					ml_inv_id:variation.inventory_id+""
				})
			}
			
		})
		let r;
		if(productos.length>0){
			r = await publicacionRepository.multInsert(productos);

		}else{
			const sku = getSellerSKUFromAtributes(producto.attributes);
			r = await publicacionRepository.multInsert([{
				titulo:producto.title,
				// subtitulo:nombre, 
				sku,
				url:producto.permalink, 
				img:producto.thumbnail, 
				precio:producto.price, 
				ml_id:producto.id+"", 
				// ml_variation_id:variation.id+"", 
				ml_inv_id:producto.inventory_id+""
			}]);

		}

		function getSellerSKUFromAtributes(attributes){
			const attribute = attributes.find(att=>att.id==="SELLER_SKU");
			return attribute?.value_name || "";
		}

		return r;
  }
};
