const crypto = require('crypto');

// Function to encrypt a number
function encryptNumber(numberToEncrypt, secretKey) {
    const cipher = crypto.createCipher('aes-256-ctr', secretKey);
    var encryptedNumber = cipher.update(numberToEncrypt.toString(), 'utf-8', 'hex');
    encryptedNumber += cipher.final('hex');
    var lastFourChars = encryptedNumber.substr(encryptedNumber.length - 4);
    var encryptedNumber = lastFourChars + encryptedNumber.substr(0, encryptedNumber.length - 4);
    return encryptedNumber;
}

// Function to decrypt a number
function decryptNumber(encryptedNumber, secretKey) {
    var encryptedNumber = encryptedNumber.substr(4) + encryptedNumber.substr(0, 4);
    const decipher = crypto.createDecipher('aes-256-ctr', secretKey);
    let decryptedNumber = decipher.update(encryptedNumber, 'hex', 'utf-8');
    decryptedNumber += decipher.final('utf-8');
    return parseInt(decryptedNumber, 10);
}

// Example usage
const secretKey = 'arandomkey'; // Replace with your secret key

// Number to encrypt
const originalNumber = 2000006187038930;

// Encrypt the number
const encryptedNumber = encryptNumber(originalNumber, secretKey);
console.log('Encrypted Number:', encryptedNumber);

// Decrypt the number
const decryptedNumber = decryptNumber(encryptedNumber, secretKey);
console.log('Decrypted Number:', decryptedNumber);


async function getFacturacion(db, id) {

    if (!db) {
        const functions = require("firebase-functions");
        const admin = require("firebase-admin");
        admin.initializeApp(functions.config().firebase);
        const db = admin.firestore();
    }

    var ordeId = decryptNumber(id, secretKey);

    var queryVenta = await db.collection('ventas').doc(ordeId).get();
    var venta = queryVenta.data();

    if(venta.status == "cancelled"){
        return {status: "error", message: "La venta fue cancelada"};
    }

    var idComprador = venta.idComprador;

    var queryComprador = await db.collection('MLCompradores').doc(idComprador).get();
    var comprador = queryComprador.data();

    var objVenta = {
        orderId : venta.orderId,
        totalPagado : venta.totalPagado,
        nicknameComprador : venta.nicknameComprador,
        firstNameComprador: venta.firstNameComprador,
        lastNameComprador: venta.lastNameComprador,
        CatAB: venta.CatAB,
        tituloPublicacion : venta.tituloPublicacion,
        cantidad : venta.cantidad,
        p_unitario : venta.p_unitario,
        fechaVenta : venta.fechaVenta,
    }

    return { objVenta, comprador };


}
