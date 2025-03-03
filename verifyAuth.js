/**************************************************/
/* VERIFY AUTH */
const verifyAuth = () => {
    var URLactual = window.location

    firebase.auth().onAuthStateChanged((response) => {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User

        if (response != null) {
            //console.log('usuario existente')
            //console.log(URLactual)

            // Cambiamos el Título de la Página
            var arrayUrl = URLactual.href.split('/');
            console.log(arrayUrl)

            const titleWeb = arrayUrl[4]?.slice(0, -5)
            let title = "Nube : " + titleWeb

            $(document).prop('title', title)
            $("#section-title").html(titleWeb)

            // Si estamos en el Dashboard, cargamos el siguiente código
            if(URLactual == "http://localhost/firebase/kabudumex/dashboard.html"){

            }

            var uid = response.uid;
            // ...
            //console.log(user)
        } else {
            //console.log('usuario no existe')
            // User is signed out
            // ...
            
            //console.log(URLactual)
            // Si no ha iniciado sesión el usuario, lo mandamos al Login
            //if(URLactual != "http://localhost/firebase/kabudumex/"){
                
            
            
            document.location.href="./"


            
            //}
        }
    });
}

verifyAuth();