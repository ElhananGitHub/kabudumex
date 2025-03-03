const moment = require("moment");
module.exports = ({mercadoLibre, publicacionRepository, getMlAuth, insertPublicacionMl})=>{
  return getPublicacion = async (ml_id, ml_variation_id) =>{
		const auth = await getMlAuth();

		const publicacion = await getPublicacionX(ml_id, ml_variation_id)
		if(publicacion)return publicacion;

		const p = await mercadoLibre.getProduct({auth: auth, id:ml_id });//idVariante:item.item.variation_id
		const insertR = await insertPublicacionMl(p)

		const r= await getPublicacionX(ml_id, ml_variation_id)
		return r;
		
	}
	async function getPublicacionX(ml_id, ml_variation_id){
		let publicacion;
		if(ml_variation_id){
			publicacion = await publicacionRepository.findOne({ml_variation_id:String(ml_variation_id)},{},{silent:true})
		}else{
			publicacion = await publicacionRepository.findOne({ml_id},{},{silent:true})
		}
		return publicacion;
	}
}