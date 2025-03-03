const logger = (area, accion, id, mensaje) => {
  const user = JSON.parse(sessionStorage.user);
  const objLog = {
    timestamp: new Date(),
    usuario: user.email,
    area,
    accion,
    id,
    mensaje,
  };
  Object.keys(objLog).forEach((key) => {
    if (objLog[key] === undefined || objLog[key] === null) {
      delete objLog[key];
    }
  });
  return db.collection("CUSTOM-LOGS").doc().set(objLog);
};
