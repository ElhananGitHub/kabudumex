$(document).ready(function () {
  const infoInventario = JSON.parse(sessionStorage.infoInventario);

  const arrayData = infoInventario.map((cat) => {
    const productos = cat.productos.map((prod) => {
      const variaciones = prod.variaciones.map((variacion) => {
        return {
          id: variacion.variacion,
          text: `<b>${variacion.variacion}</b> | <b style="color: green;" >Total:</b> ${variacion.totalByVariacion}`,
          children: [],
        };
      });
      return {
        id: prod.produc,
        text: `<b>${prod.produc}</b> | <b style="color: green;" >Total:</b> ${prod.totalByProduct}`,
        children: variaciones,
      };
    });
    return {
      id: cat.id,
      text: `<b>${cat.nombreCategoria}</b> | <b style="color: green;" >Total:</b> ${cat.totalSkuByCategoria}`,
      children: productos,
    };
  });

  $("#tree").tree({
    uiLibrary: "bootstrap4",
    dataSource: arrayData,
    primaryKey: "id",
    imageUrlField: "flagUrl",
    border: true,
    width: "100%",
    height: 500,
  });
});
