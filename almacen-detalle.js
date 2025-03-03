var db = firebase.firestore()
var storage = firebase.storage();


db.collection("Ventas")
.orderBy('numero_orden_venta')
.onSnapshot(response => {
    //console.log(response)
    listarRegistro(response)  
})

/**************************************************/
/* LISTAR REGISTRO */
// Muestra los registros contenidos en firebase
const listarRegistro = (response, cantidad=10) => {
    console.log("listarRegistro")
    //console.log(response)
    //console.log("cantidad: "+cantidad)

    let divTable = document.getElementById("tblVenta")
    divTable.innerHTML = ""

    let table = document.createElement('table')
    table.id = "tablaVenta"
    table.setAttribute("class","table table-bordered table-striped")

    divTable.append(table)

    var contenido = `
    <table>

    <thead>
        <tr>
            <th class="align-middle">Número Órden Venta</th>
            <th class="align-middle">Opciones</th>
        </tr>

    </thead>
    `;

    contenido += "<tbody>"

    var i = 1
    var numero_venta = ""
    var td_id = ""
    response.forEach(response_data=>{
        //console.log(response_data)
        //console.log(response_data.data())
        let datos = response_data.data()

        let {numero_orden_venta} = datos
        let {id} = response_data
        /*
        console.log(`
        numero_orden_venta: ${numero_orden_venta}
        categoria: ${categoria}
        producto: ${producto}
        variacion: ${variacion}
        cantidad: ${cantidad}
        precio: ${precio}
        `)
        */

        if(i==1){
            numero_venta = numero_orden_venta
            td_id += id
        }

        if(numero_orden_venta == numero_venta){
            //console.log("mismo numero")
            if(i > 1){
                td_id += ","+id
            }
        }else{
            //console.log("cambio numero")

            // Generamos el contenido de la tabla
            contenido += `
            <tr id="${response_data.id}">
                <td>${datos.numero_orden_venta}</td>
                <td>
                <button class="btn btn-dark" onclick="agregarProductos('${td_id}')"><i class="fas fa-cart-arrow-down"></i></button>
                </td>
            </tr>
            `
            // Generamos la información del siguiente registro
            numero_venta = numero_orden_venta

            td_id = ""
        
            td_id += id
        }
        /*
        console.log(`
        td_categoria: ${td_categoria}
        td_producto: ${td_producto}
        td_variacion: ${td_variacion}
        td_cantidad: ${td_cantidad}
        td_precio: ${td_precio}
        `)
        */

        i++
    })

    contenido += "</tbody></table>"
    
    //console.log("cantidad: "+cantidad)
    
    $("#tablaVenta").html(contenido)

    //console.log("datatable") 

    var tablaRegistros = $("#tablaVenta").DataTable({
        dom: 'Bfrtip',
        "responsive": true, 
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
        "lengthChange": false, 
        "autoWidth": false,
        "scrollX": false,
        "stateSave": false,
        'pageLength': cantidad,
        order:[
            [2,"asc"]
        ],
        "buttons": [
            'pageLength',
            { 
                extend: 'excel', 
                text: 'Excel', 
                className: 'btn-dark',
                exportOptions: {
                    columns: [0]
                }  
            },
            { 
                extend: 'pdfHtml5', 
                text: 'PDF', 
                header: false,
                title: 'PDF',
                duplicate:true,
                className: 'btn-dark',
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [ 5, 5, 5, 5 ],
                exportOptions: {
                    columns: [0],
                    alignment: 'center',
                    stripHtml: false
                },
                pageBreak: 'after',
            },
            { 
                extend: 'print', 
                text: 'Imprimir', 
                className: 'btn-dark',
                pageSize : 'A4',
                orientation: 'landscape',
                exportOptions: {
                    columns: [0]
                } 
            },
            { 
                extend: 'colvis', 
                text: 'Columnas', 
                className: 'btn-dark' 
            },
            /*
            { 
                extend: 'selectAll', 
                text: 'Seleccionar Todo', 
                className: 'btn-info' 
            },
            { 
                extend: 'selectNone', 
                text: 'Quitar Seleccion' 
            },
            */
        ],
        // ocultar columnas
        "columnDefs": [
            {
                "targets": [ 1 ],
                "orderable": false,
                "searchable": false,
                //"visible": false,
            }
        ],
        "select": true,
        initComplete: function () {
            var api = this.api();
            // Se colocan los filtros en las columnas
              $('.filterhead', api.table().footer()).each( function (i) {
                if(i!=1) {
                var column = api.column(i);
                  var select = $('<select><option value=""></option></select>')
                      .appendTo( $(this).empty() )
                      .on( 'change', function () {
                          var val = $.fn.dataTable.util.escapeRegex(
                              $(this).val()
                          );
   
                          column
                              .search( val ? '^'+val+'$' : '', true, false )
                              .draw();
                      } );
   
                  column.data().unique().sort().each( function ( d, j ) {
                      select.append( '<option value="'+d+'">'+d+'</option>' );
                  } );
                }
              } ); // filter
          } // init
    }).buttons().container().appendTo('#tablaVenta_wrapper .col-md-6:eq(0)');    
    
}
$(document).ready(function() {
    $('#tablaVenta tbody').on( 'click', 'tr', function () {
        $(this).toggleClass('selected');
    } );
    /*
    $('#button').click( function () {
        alert( tablaRegistros.rows('.selected').data().length +' row(s) selected' );
    } );
    */

})

const selectCliente = () => {
    console.log("selectCliente")
    //console.log(response)

    var cliente = `<option value="">seleccionar</option>`

    // Recuperamos la información de los clientes en firebase
    db.collection("Clientes")
    .onSnapshot(response => {
        //console.log(response)
        response.forEach(response_data=>{
            //console.log(response_data.data())
            let datos = response_data.data()

            cliente += `<option value="${datos.nombre_cliente}">${datos.nombre_cliente}</option>`;

            document.getElementById("clienteList").innerHTML=cliente;
    
        })
    })

}

/**************************************************/
/* SELECT CATALOGOS */
// Muestra los select de los catalogos en la ventana modal
const selectCatalogos = (id=0,op="",val1="",val2="",val3="") => {
    console.log('selectCatalogos')
    console.log('id: '+id)
    console.log('op: '+op)
    console.log('val1: '+val1)
    console.log('val2: '+val2)
    console.log('val3: '+val3)

    fetch("./modelos2.json")
    .then(response => {
       return response.json();
    })
    .then(response => {
        console.log(response)

        var selectedCategoria = ""
        var iCategoria = ""

        // Categoría
        var categoria = `<option value="">seleccionar</option>`
        for(var i=0;i<response.length;i++){
            console.log("i: ",i)
            console.log("response_i_categoria: ", response[i]["categoria"])
            if(response[i]["categoria"] === val1){
                selectedCategoria = 'selected'
                textCategoria = response[i]["categoria"]
                iCategoria = i
            }else{
                selectedCategoria = ""
            }
            console.log("iCategoria: ", iCategoria)
            console.log("selectedCategoria: ", selectedCategoria)
            categoria += `<option value="${response[i]["categoria"]}" ${selectedCategoria}>${response[i]["categoria" ]}</option>`;
        }

        document.getElementById("categoriaList_"+id).innerHTML=categoria;
    
        // Producto
        if(op=='prod' || op=="variacion"){
            console.log("-------------")
            console.log("prod")
            var producto = `<option value="">seleccionar</option>`
            if(textCategoria == val1){
                console.log("iCategoria_Prod: ", iCategoria)
                console.log("total_productos: ", response[iCategoria]['producto'].length)

                for(var j=0;j<response[iCategoria]['producto'].length;j++){
                    if(response[iCategoria]["producto"][j]["nombre"] === val2){
                        selectedProducto = 'selected'
                        textProducto = response[iCategoria]["producto"][j]["nombre"]
                        iProducto = j
                    }else{
                        selectedProducto = ""
                    }
                    console.log(response[iCategoria]["producto"][0])
                    producto += `<option value="${response[iCategoria]["producto"][j]["nombre"]}" ${selectedProducto}>${response[iCategoria]["producto"][j]["nombre"]}</option>`;
                }
        
                document.getElementById("productoList_"+id).innerHTML=producto;
                $("#productoList_"+id).attr("onchange", "selectCatalogos("+id+",'variacion','"+val1+"',this.value)");
                //$('#sel_id').change(showModalAdd('variacion',val1,this.value));
            }
        }

        // Variación
        if(op=='variacion' || op=='cantidad'){
            console.log("-------------")
            console.log("variacion")
            var variacion = `<option value="">seleccionar</option>`
            if(textProducto == val2){
                console.log("iProducto_Variacion: ", iProducto)
                console.log(response[iCategoria]["producto"][iProducto]["variacion"])
                console.log("total_variaciones: ", response[iCategoria]["producto"][iProducto]["variacion"].length)

                for(var k=0;k<response[iCategoria]['producto'][iProducto]["variacion"].length;k++){
                    if(response[iCategoria]['producto'][iProducto]["variacion"][k]["nombre"] === val3){
                        selectedVariacion = 'selected'
                        textVariacion = response[iCategoria]['producto'][iProducto]["variacion"][k]["nombre"]
                        var cantidad = response[iCategoria]['producto'][iProducto]["variacion"][k]["cantidad"]
                        iVariacion = k
                    }else{
                        selectedVariacion = ""
                    }
                    console.log(response[iCategoria]['producto'][iProducto]["variacion"][k])
                    variacion += `<option value="${response[iCategoria]['producto'][iProducto]["variacion"][k]["nombre"]}" ${selectedVariacion}>${response[iCategoria]['producto'][iProducto]["variacion"][k]["nombre"]}</option>`;
                }
        
                document.getElementById("variacionList_"+id).innerHTML=variacion;
                $("#variacionList_"+id).attr("onchange", "selectCatalogos("+id+",'cantidad','"+val1+"','"+val2+"',this.value)");
            }
            console.log("cantidad variacion: ", cantidad)
        }

        if(op=='cantidad'){
            console.log("-------------")
            console.log("variacion")
            
                console.log("cantidad: ", cantidad)
        
                document.getElementById("cantidad_"+id).placeholder="Disponible(s): "+cantidad;
        }

    });
        

    /*
    // Recuperamos la información en firebase con el ID
    db.collection("Mercancia").doc(id).get()
    .then(response=>{
        //console.log("consulta mercancia success")
        //console.log(response.data())

        let datos = response.data()

        // Mostramos la consulta en los campos
        $("#sku_edit").html(datos.sku)
        $("#categoria_edit").html(datos.categoria)
        $("#producto_edit").html(datos.producto)
        $("#variacion_edit").html(datos.variacion)
        $("#ubicacion_edit").val(datos.ubicacion)
        $("#sub_ubicacion_edit").val(datos.sub_ubicacion)
        

        $("#id_edit").val(id)

    }).catch(error=>{
        //console.log("consulta mercancia failed")
        console.log(error)
    })
    */        
}

var nextinput = 1;
function agregarCampos(){
    console.log('agregarCampos')
    nextinput++
    campo = `
    <tr id="td_${nextinput}">
        <td>&nbsp;</td>
        <td><select class="form-control categoriaSelect" id="categoriaList_${nextinput}" data-id="${nextinput}" onchange="selectCatalogos(${nextinput},'prod',this.value)"></select></td>
        <td><select class="form-control productoSelect" id="productoList_${nextinput}" data-id="${nextinput}"></select></td>
        <td><select class="form-control variacionSelect" id="variacionList_${nextinput}" data-id="${nextinput}"></select></td>
        <td><input type="text" class="form-control cantidadInput" id="cantidad_${nextinput}" data-id="${nextinput}"></td>
        <td><input type="text" class="form-control precioInput" id="precio_${nextinput}"  data-id="${nextinput}"></td>
    </tr>
    `
    $("#catalogosTable>tbody").append(campo)

    selectCatalogos(nextinput)
}

const guardarOrden = () =>{
    var categoriaList =  document.getElementsByClassName("categoriaSelect")
    total_registros = categoriaList.length 
    //console.log(categoriaList.length)

    if($("#numero_orden_venta").val() == ""){
        
        swal({
            title: "Error!",
            text: "Debes colocar el Número de Órden",
            icon: "error",
          });
          return
          
    }

    if($("#clienteList").val() == ""){
        
        swal({
            title: "Error!",
            text: "Debes seleccionar un Cliente",
            icon: "error",
          });
          return
          
    }


    var numero_orden_venta = $("#numero_orden_venta").val()
    var cliente = $("#clienteList").val()
    console.log(` 
    numero_orden_venta: ${numero_orden_venta},
    cliente: ${cliente}
    `)

    if(total_registros > 0){
        for(var i=0; i<total_registros; i++){
            //console.dir(categoriaList[i])
            //console.log(categoriaList[i].id)
            //console.log(categoriaList[i].value)
            //console.log( 'id',  $(categoriaList[i]).attr("data-id") )
            //console.log($("#productoList_"+id).val() )

            var id = $(categoriaList[i]).attr("data-id")
            var categoria = categoriaList[i].value
            var producto = $("#productoList_"+id).val()
            var variacion = $("#variacionList_"+id).val()
            var cantidad = $("#cantidad_"+id).val()
            var precio = $("#precio_"+id).val()

            console.log(` 
                id: ${id},
                categoria: ${categoria},
                producto: ${producto},
                variacion: ${variacion},
                cantidad: ${cantidad},
                precio: ${precio}
            `)

            
            // Agregamos a la colección
            db.collection("Ventas").add({
                numero_orden_venta:numero_orden_venta,
                categoria:categoria,
                producto:producto,
                variacion:variacion,
                cantidad:cantidad,
                precio:precio,
                cliente:cliente
            }).then(response=>{
                console.log("add venta success")
                //console.log(response)

                //let id = response.id
            })
            
                        
        }
    }

    limpiarModal(total_registros)
    $('#modal-add').modal('hide')

}

const limpiarModal = (total) => {
    //console.log(limpiarModal)
    //console.log("total"+total)
    $("#numero_orden_venta").val('')
    $("#clienteList").val('')

    $('#categoriaList_1 option:eq(1)')
    $("#productoList_1").empty()
    $("#variacionList_1").empty()
    $("#cantidad_1").val('')
    $("#precio_1").val('')

    if(total > 1){
        for(var i=2; i<=total; i++){
            $("#categoriaList_"+i).remove()
            $("#productoList_"+i).remove()
            $("#variacionList_"+i).remove()
            $("#cantidad_"+i).remove()
            $("#precio_"+i).remove()
            $("#td_"+i).remove()
        }
    }
}

const agregarProductos = (arrayid) => {
    console.log("agregarProductos")
    console.log("arrid: ", arrayid)

    let arrID = arrayid.split(',');
    //console.log("arrID: ", arrID)

    for(var i=0; i<arrID.length; i++){
        //console.log(arrID[i])

        var id = arrID[i]
        var contenido = ""
        var x=1

        // Recuperamos la información en firebase con el ID del consecutivo
        db.collection("Ventas").doc(id).get()
        .then(response=>{
            console.log(response.data())
            //console.log(Object.entries(response.data()))

        
            let datos = response.data()

            const {numero_orden_venta} = datos
            const {cliente} = datos

            const {categoria} = datos
            const {producto} = datos
            const {variacion} = datos

            const {cantidad} = datos
            const {id} = response
            
            console.log(`
                numero_orden_venta: ${numero_orden_venta}
                cliente: ${cliente}
                categoria: ${categoria}
                producto: ${producto}
                variacion: ${variacion}
                cantidad: ${cantidad}
                id: ${id}
            `)
            
            contenido = `
                <div class="callout callout-info">
                    <div class="row">
                        <div class="col-12">
                            <table class="table">
                                <tr>
                                    <td><label>Categoría</label></td>
                                    <td><label>Producto</label></td>
                                    <td><label>Variación</label></td>
                                    <td><label>Cantidad</label></td>
                                </tr>
                                <tr>
                                    <td>${categoria}</td>
                                    <td>${producto}</td>
                                    <td>${variacion}</td>
                                    <td>${cantidad}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Agregar o Escaner SKU</label>
                        <input type="text" class="form-control" id="inputSKU_${x}">
                        <!--<textarea id="inputSKU_${x}"></textarea>-->
                    </div>
                    <div id="item_${x}" class="form-group">

                    </div>
                </div>
            `
            x++

            $("#numero_orden_venta_venta").html(numero_orden_venta)
            $("#cliente_venta").html(cliente)
            $("#addSKU").append(contenido)
        
        }).catch(error=>{
            //console.log("consulta consecutivo failed")
            console.log(error)
        })  

    } // END for

}

const agregarSKU = (idDoc,id,sku) =>{
    console.log('agregarSKU')
    console.log(` 
        idDoc: ${idDoc}, 
        id: ${id}, 
        sku: ${sku} 
    `)
    //$("#inputSKU_"+id).val('')
}
/*
$("#inputSKU_1").change(function() {
    console.log("inputSKU_: "+ $('#inputSKU_').val());

})
*/

$("#inputSKU_1").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        // Do something
        console.log("inputSKU_: "+ $('#inputSKU_1').val());
        $("#inputSKU_1").val('')
    }
});
    


/**************************************************/
/* SHOW MODAL EDIT */
// Abre la ventana modal para edición y muestra la información de los campos
const showModalEdit = (id) => {
    console.log('showModalEdit')
    //console.log('id: '+id)

    // Recuperamos la información en firebase con el ID
    db.collection("Mercancia").doc(id).get()
    .then(response=>{
        //console.log("consulta mercancia success")
        //console.log(response.data())

        let datos = response.data()

        // Mostramos la consulta en los campos
        $("#sku_edit").html(datos.sku)
        $("#categoria_edit").html(datos.categoria)
        $("#producto_edit").html(datos.producto)
        $("#variacion_edit").html(datos.variacion)
        $("#ubicacion_edit").val(datos.ubicacion)
        $("#sub_ubicacion_edit").val(datos.sub_ubicacion)
        

        $("#id_edit").val(id)

    }).catch(error=>{
        //console.log("consulta mercancia failed")
        console.log(error)
    })        
}

/**************************************************/
/* EDITAR REGISTRO */
// Edita el registro seleccionado en firebase
const editarRegistro = () => {
    let ubicacion = $("#ubicacion_edit").val()
    let sub_ubicacion = $("#sub_ubicacion_edit").val()
    let foto = $("#foto_edit").val()
    let id = $("#id_edit").val()

    //console.log(`id: ${id}, ubicacion: ${ubicacion}, sub_ubicacion: ${sub_ubicacion}, foto: ${foto}`)

    db.collection("Mercancia").doc(id).update({
        ubicacion:ubicacion,
        sub_ubicacion:sub_ubicacion,
        foto:foto,
    }).then(response=>{
        //console.log("upd mercancia success")
        //console.log(response)

        $('#modal-edit').modal('hide')

    }).catch(error=>{
        //console.log("upd mercancia failed")
        console.log(error)
    })
}

/**************************************************/
/* BORRAR REGISTRO */
// Elimina el registro seleccionado en firebase
const borrarRegistro = id => {
    console.log("borrarRegistro")

    if( confirm("¿Deseas eliminar el registro?") == 1 ){

        db.collection("Mercancia").doc(id).delete()
        .then(() => {
            console.log("Document successfully deleted!")

        }).catch((error) => {
            console.error("Error removing document: ", error)
        });
    }
}

/**************************************************/
/* EDICIÓN MULTIPLE */
// Se abre una ventana modal y se muestran todos los registros que se seleccionaron para Editar
const edicionMultiple = () => {
    console.log('edicionMultiple')

    var contenido = ""

    var checkedBox = $.map($('input:checkbox[name="mercancia"]:checked'), 
    function(val, i) { // value, index
        // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
        let id = val.value
        //console.log("id: "+id)
        // Recuperamos la información en firebase con el ID
        db.collection("Mercancia").doc(id).get()
        .then(response=>{
            //console.log("consulta mercancia success")
            //console.log(response.data())

            let datos = response.data()
            //console.log(datos)

            $('#modal-edit-multiple').modal('show')   

        }).catch(error=>{
            //console.log("consulta mercancia failed")
            console.log(error)
        }) 

        return val.value
    });
    //console.clear();
    //console.log(checkedBox);

    $("#id_edit_multiple").val(checkedBox)
}

/**************************************************/
/* ACTUALZIAR MULTIPLE */
// Edita los registros seleccionados en firebase
const actualizarMultiple = () => {
    console.log("actualizarMultiple")

    var id_edit_multiple = $("#id_edit_multiple").val()
    //console.log(id_edit_multiple)

    var arrayIDMercancia = id_edit_multiple.split(',')
    //console.log(arrayIDMercancia)

    let total_registros = arrayIDMercancia.length
    //console.log("total_registros: "+total_registros)

    if(total_registros > 0){
        for(x=0;x<total_registros;x++){
            var id = arrayIDMercancia[x]
            let ubicacion = $("#ubicacion_edit_multiple").val()
            let sub_ubicacion = $("#sub_ubicacion_edit_multiple").val()

            //console.log("ubicacion_edit_multiple_: "+ubicacion)
            //console.log("sub_ubicacion_edit_multiple_: "+sububicacion)

            db.collection("Mercancia").doc(id).update({
                ubicacion:ubicacion,
                sub_ubicacion:sub_ubicacion
            }).then(response=>{
                //console.log("upd mercancia nultiple success")
                //console.log(response)
        
                $('#modal-edit-multiple').modal('hide')
        
            }).catch(error=>{
                //console.log("upd mercancia multiple failed")
                console.log(error)
            })
        }
        
    }

}

/**************************************************/
/* BORRAR MULTIPLE */
// Elimina los registros seleccionados en firebase
const borrarMultiple = () => {
    console.log("borrarMultiple")

    if( confirm("¿Deseas eliminar los registros seleccionados?") == 1 ){

        var checkedBox = $.map($('input:checkbox[name="mercancia"]:checked'), 
        function(val, i) { // value, index
            // Se procesan los ID's de la mercancia que se mostrará en el modal para edición
            let id = val.value
            //console.log("id: "+id)

            db.collection("Mercancia").doc(id).delete()
            .then(() => {
                console.log("Document successfully deleted!")

            }).catch((error) => {
                console.error("Error removing document: ", error)
            });

            return val.value
        })
    }
    //console.clear();
    console.log(checkedBox);

}


/**************************************************/
/* SELECT ALL */
// Sleccionar todos los registros
const selectAll = () => {
    console.log("selectAll")
    //console.log("checkMercancia: "+$(".checkMercancia").length)
    //console.log("checkMercancia:checked: "+$(".checkMercancia:checked").length)

    // Seleccionar los checkbox
    if ($(".checkMercancia").length != $(".checkMercancia:checked").length) {
        $(".checkMercancia").prop("checked", true);
        $("#selectAll").prop("checked", true);
    } else {
        $(".checkMercancia").prop("checked", false);
        $("#selectAll").prop("checked", false);
    }

    // Deseleccionar los checkbox
    if ($(".checkMercancia").length == $(".checkMercancia:checked").length) {
        $(".checkMercancia").prop("checked", true);
        $("#selectAll").prop("checked", true);
    } else {
        $(".checkMercancia").prop("checked", false);
        $("#selectAll").prop("checked", false);
    }
}