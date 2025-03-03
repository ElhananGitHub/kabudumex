$('.tbl-accordion-nested').each(function () {
  var thead = $(this).find('thead');
  var tbody = $(this).find('tbody');

  tbody.hide();
  thead.click(function () {
    tbody.slideToggle();
  })
});

const formatoFecha = (fechaVenta) => {
  console.log(fechaVenta);
  const dt = new Date(fechaVenta.seconds * 1000);
  console.log(dt);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFechaSegundos = (fechaSegundos) => {
  const dt = new Date(fechaSegundos);
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFechaNow = () => {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, "0")}/${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}`;
};

const formatoFechaHorario = (fechaHorario) => {
  const dt = new Date(fechaHorario.seconds * 1000);
  //console.log(dt);
  return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear().toString().padStart(4, "0")} ${dt.getHours().toString()}:${dt.getMinutes().toString()}:${dt.getSeconds().toString()} `;
};

const toCurrencyMXN = (monto) =>
  Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    monto
  );

const formatoFechaHora = (fechaHora) => {
  let [fecha,hora] = fechaHora.split('T');

  let [anio,mes,dia] = fecha.split('-');

  let fechaFormat = `${dia}/${mes}/${anio}`;

  let horaFormat = hora.slice(0,-6);

  return `${fechaFormat} ${horaFormat}`;
}