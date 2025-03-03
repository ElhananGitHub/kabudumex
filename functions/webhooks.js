const container = require('../loader');
const moment = require("moment");
const asyncHandler = require('express-async-handler');
const pMap = require('p-map');

exports.mercadoLibre = asyncHandler(async (request, response) => {
		
		if(request.body.user_id!==642273229){
			return response.json({ok:1});
		}

		const config = await container.cradle.configRepository.findOne();
		const auth = config.mercado_libre

		const resource = request.body.resource;
		const topic = request.body.topic;
		
		
		let result;
    switch (topic) {
			case "items":{//producto actualizado

				
				return response.json(200);
			}
			
			case "questions":{
				const data = await container.cradle.mercadoLibre.getResource({auth, resource});
				log.info({webhookData:data, topic, resource})

				//Esta funcion es para consultar la publicacion interna en la base de datos o crearla en caso que no exista
				let publicacion = await container.cradle.getPublicacion(data.item_id);

				console.log({publicacion})
				const insertData = {
					fecha: data.date_created,
					id_publicacion: publicacion._id,
					status: data.status,
					pregunta: data.text,
					external_id: data.id+"",
					id_usuario: data.from?.id+"",
					respuesta: data.answer?.text
				}
				
				result = await container.cradle.preguntaRepository.insertOrUpdate({data:insertData, query:{external_id: data.id+""}});

				return response.json(200);
			}
			case "orders_v2":{
				
				const data = await container.cradle.mercadoLibre.getResource({auth, resource});
				log.info({webhookData:data, topic, resource})
				//se inserta la venta				
				const insertData = await container.cradle.mapVentaMl(data);

				//se verifica si ya existe la venta dentro de la base de datos
				let result = await container.cradle.ventaRepository.findOne({external_id:insertData.external_id}, {}, {silent:true});
				if(result.status === data.status && result){
					return response.json({ok:1});
				}


				if(data.status==="cancelled"){
					result = await pMap(insertData.productos, async ({cantidad, id_producto, id_publicacion})=>{

						// const publicacion = publicacionRepository.findOne({});
						return await container.cradle.cancelacionRepository.insertOrUpdate({
							data:{
								id_pedido_externo: insertData.external_id, 
								id_publicacion,
								id_producto, 
								cantidad, 
								status:"pendiente",
								codigo_cancelacion: data.cancel_detail.code,
								motivo_cancelacion: data.cancel_detail.description,
								solicitado_por: data.cancel_detail.requested_by,
								fecha_cancelacion: data.cancel_detail.date
							},
							query:{id_producto: id_producto, id_pedido_externo: insertData.external_id},
						});

					})				
					return response.json(result);
				}

				result = await container.cradle.ventaRepository.insert({...insertData, vendido_por:"mercado_libre", status_envio:"pendiente"}, {external_id: data.id+""});

				//se actualiza el inventario en bodega
				//TODO que id de bodega es?
				result = await pMap(result.data.productos, async producto=>{
					await container.cradle.inventarioRepository.insertOrUpdate({
						data:{id_producto: producto.id_producto, id_bodega:"63a10ce6d5ff861e484888eb", id_publicacion:producto.id_publicacion},
						query:{id_producto: producto.id_producto, id_bodega:"63a10ce6d5ff861e484888eb", id_publicacion:producto.id_publicacion},
						otherOps:{$inc:{inventario:-producto.cantidad, total_vendido:producto.cantidad}}
					});

					//se actualiza el lote
					let lote = await container.cradle.loteRepository.findOne({id_producto: producto.id_producto, inventario:{$gt:0}},{},{silent:true});
					if(!lote) lote = await container.cradle.loteRepository.findOne({id_producto: producto.id_producto},{},{silent:true});
					
					if(!lote) lote = await container.cradle.loteRepository.insert({id_producto: producto.id_producto, inventario:-1});
					else await container.cradle.loteRepository.updateOne({id_producto: producto.id_producto},{}, {otherOps:{$inc:{inventario:-1}}});

					// const inv = await container.cradle.loteRepository.insertOrUpdate({
					// 	otherOps:{$inc:{vendidos:1, inventario:-1}},
					// 	query:{id_producto: producto.id_producto, inventario:{$gt:0}},
					// 	data:{}
					// });

					// const inv = await container.cradle.loteRepository.findOne({id_producto: producto.id_producto, inventario:{$gt:0}});
					// await container.cradle.loteRepository.rawUpdate({_id:inv._id}, {$inc:{vendidos:1, inventario:-1}});

				})
				

				return response.json(result);
			}
		}
			
		log.info({webhookResult:result})

  
    // Return a 200 response to acknowledge receipt of the event
    response.json({received: true});
})


