const configUser = sessionStorage.userConfiguraciones
  ? JSON.parse(sessionStorage.userConfiguraciones)
  : {};

//Listado de las propiedades del nav
const propertiesNav = [
  { moduleName: "Mercancia", class: "fas fa-pallet", menu: "", submenu: "" },
  { moduleName: "Clientes", class: "fas fa-user", menu: "", submenu: "" },
  { moduleName: "Venta", class: "fas fa-boxes", menu: "", submenu: "" },
  { moduleName: "Almacen", class: "fas fa-cart-plus", menu: "", submenu: "" },
  { moduleName: "Configuraciones", class: "fas fa-cog", menu: "", submenu: "" },
  { moduleName: "Cobranza", class: "fas fa-calculator", menu: "", submenu: "" },
  { moduleName: "Contabilidad", class: "fas fa-donate", menu: "", submenu: "" },
  { moduleName: "Reportes", class: "fas fa-chart-line", menu: "", submenu: "" },
  { moduleName: "Reportes Administrativos", class: "fas fa-chart-line", menu: "", submenu: "" },
  { moduleName: "Catalogo", class: "fas fa-book", menu: "", submenu: "" },
  { moduleName: "Reportes Administrativos", class: "fas fa-chart-line", menu: "", submenu: "" },
  { moduleName: "Devoluciones", class: "fas fa-angle-double-left", menu: "", submenu: "" },
  { moduleName: "Egresos", class: "fas fa-cart-arrow-down", menu: "", submenu: "" },
  { moduleName: "Cuentas Por Pagar", class: "fas fa-calendar-day", menu: "", submenu: "" },
  { moduleName: "Usuarios y Permisos", class: "fas fa-user", menu: "", submenu: "" },
  { moduleName: "Mercadolibre", class: "fas fa-hands-helping", menu: "ml-0" },
  { moduleName: "MercadoLibre Inventario", class: "fas fa-layer-group", menu: "ml-1", submenu: "ml-2" },
  { moduleName: "MercadoLibre Ventas", class: "fas fa-hand-holding-usd", menu: "ml-1", submenu: "ml-2" },
  { moduleName: "MercadoLibre Ordenes", class: "fas fa-hands-helping", menu: "ml-1", submenu: "ml-2" },
  { moduleName: "MercadoLibre Devoluciones", class: "fas fa-hands-helping", menu: "ml-1", submenu: "ml-2" },
  { moduleName: "MercadoLibre Traspasos", class: "fas fa-hands-helping", menu: "ml-1", submenu: "ml-2" },
  { moduleName: "MercadoLibre Preguntas", class: "fas fa-hands-helping", menu: "ml-1", submenu: "ml-2" },
];

let content = "";

//console.log(configUser);

const findElement = (array, searchedModule) => {
  //console.log('findElement');
  //console.log(array);
  //console.log({searchedModule});
  let contador = 0;
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    elementModule = element.modulo.split(' ')[0];
    //console.log({elementModule});
    if (elementModule == searchedModule) {
      //console.log(element.modulo);
      contador++

    }
  }

  if(contador > 0){
    return contador;
  }else{
    return 0;
  }
  
}


let totalModuleML = findElement(configUser.modulos, 'MercadoLibre'); 


//Se renderizan solo los modulos a los que se tiene permiso
x=1;
configUser?.modulos?.forEach((element) => {
  //console.log('element');
  //console.log(element)
  const propertiesModule = propertiesNav.find(
    (prop) => prop.moduleName == element.modulo
  );
  //console.log(propertiesModule)
  if (propertiesModule) {
    //console.log('propertiesModule');
    //console.log({x});
    // Los menus de afuera x == 1, los menus internos x se incrementa en 1
    if(propertiesModule.menu == ''){
      x=1;
    }

    if(x==1){
      content += ` <li class="nav-item">
      <a href="./${element.modulo.replace(/ /g, "")}.html" class="nav-link">
      `;
    }

    if(propertiesModule.menu != ''){
      //console.log('menu: ',propertiesModule.menu);
      //console.log('submenu: ',propertiesModule.submenu);

      let [menuInicial,menuName] = propertiesModule.moduleName.split(' ')
      let [menu,nivel] = propertiesModule.menu.split('-')
      //console.log({menu});
      //console.log({nivel});
      //console.log({x});

      let findMenu = menu+'-0'
      
      //console.log(propertiesNav)

      const foundMenu = propertiesNav.find(element => element.menu == findMenu );

      if(x==1){
        content += `
        <i class="${foundMenu.class}"></i>
        <p>${foundMenu.moduleName}</p>
        <i class="fas fa-angle-left right"></i>
        </p>
        </a>`;
        content += `<ul class="nav nav-treeview">`;

        if(menuName != ''){
          content += `
            <li class="nav-item">
            <a href="./${element.modulo.replace(/ /g, "")}.html" class="nav-link">
            <i class="${propertiesModule.class}"></i>
            <p>${menuName}</p>
            </a>
            </li>
          `;
        } // if
      }else{
        if(menuName != ''){
          content += `
            <li class="nav-item">
            <a href="./${element.modulo.replace(/ /g, "")}.html" class="nav-link">
            <i class="${propertiesModule.class}"></i>
            <p>${menuName}</p>
            </a>
            </li>
            
          `;
          // Verificamos cuantos menus de MercadoLibre estan activos
          //console.log(totalModuleML);

          // Verificamos cuando termina los submodulos internos de MercadoLibre y cerramos el tag <ul> de la lista
          if(totalModuleML == x){
            content += `</ul>`;
          }

        } // if
      } // else
        
      x++;
      
    }else{
      content += `
      <i class="${propertiesModule.class}"></i>
      <p>${element.modulo}</p>
      `;
    }

    if(x==1){
      content += `
      </a>
      </li>`;
    }
  }
});
content += `<li class="nav-item">
             <a href="" class="nav-link" onclick="logout()">
              <i class="fas fa-sign-out-alt"></i>
              <p>Cerrar Sesión</p>
             </a>
            </li>`;
let navModules = document.getElementById("navModules");
navModules.innerHTML = content;
