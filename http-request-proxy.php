<?php

$urlFirstPart = "https://your-api-endpoi.nt/here";
$apiKey = "YourAPIKeyHere";

$debugModeEnabled = False;

set_error_handler(
    function ($severity, $message, $file, $line) {
        throw new ErrorException($message, $severity, $severity, $file, $line);
    }
);

try {

    $debugModeEnabled =  getenv('DEBUG_MODE_ENABLED');
    
    $api_url = getenv('API_URL');
    $api_key = getenv('API_KEY');
    
    if (!empty($api_url)) {
        $urlFirstPart = $api_url;
    }
    
    if (!empty($api_key)) {
        $apiKey = $api_key;
    }

    if (!empty($debugModeEnabled)) {
        if ($debugModeEnabled === "True" or $debugModeEnabled === "true" or $debugModeEnabled === "1")  {
            $debugModeEnabled = True;
        }
    }


} catch (Exception $ex) {
    error_log("Error occured: " . $ex);
}

try {

    $urlEndPart = $_POST['urlEndPart'];

    if (isset($_POST['apiKey'])) {
        if ($_POST['apiKey'] == "required") {
            $urlEndPart = $urlEndPart . "&apikey=" . $apiKey;
        }
    }

    $content = @file_get_contents($urlFirstPart . $urlEndPart);

} catch (Exception $ex) {

    if ($debugModeEnabled) {
        $content = "{'error': 'Bad Request: " . $ex . "'}";
    }
    else {
         error_log("Error occured: " . $ex);
         $content = "{'error': 'Bad Request: Contact the system administrator. The error was logged.'}";
    }
}

echo $content;

?>
