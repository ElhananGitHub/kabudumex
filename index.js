/**************************************************/
/* LOGIN - LOGOUT */
const login = () => {
  let db = firebase.firestore();
  //console.log('login')
  const email = $("#email").val();
  const password = $("#pass").val();

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

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((response) => {
      const user = response.user;
      sessionStorage.user = JSON.stringify(user);
      db.collection("Usuarios")
        .doc(user.uid)
        .get()
        .then((responseConfig) => {
          let response = responseConfig.data();
          logger("LOGIN", "Inicio de sesion").then(() => {
            sessionStorage.userConfiguraciones = JSON.stringify(response);
            document.location.href = "dashboard.html";
          });
        })
        .catch((error) => {
          console.log("🚀 ~ file: index.js ~ line 27 ~ .then ~ error", error);
        });
    })
    .catch((error) => {
      alert("Usuario o contraseña incorrectos")
      console.log("🚀 ~ file: index.js ~ line 38 ~ login ~ error", error);
    });
};

const logout = () => {
  //console.log('logout')

  firebase
    .auth()
    .signOut()
    .then((response) => {
      //console.log('logout success')
      // Signed Out
      //console.log(response)
      document.location.href = "./";
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      //console.log('logout error')
      //console.log(error)
    });
};
