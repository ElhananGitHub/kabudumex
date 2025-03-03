<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.mercadolibre.com/shipment_labels?shipment_ids=42655789091&response_type=pdf',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer APP_USR-4154918412892791-092816-1b6117235e96cee9bbd0ff0649f66f28-642273229'
  ),
));

$response = curl_exec($curl);

curl_close($curl);

header("Content-Type: application/pdf");
echo $response;

//return $response;

?>