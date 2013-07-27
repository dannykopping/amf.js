<?php
require_once "vendor/autoload.php";

//if(function_exists('xdebug_disable'))
//{
//    xdebug_disable();
//}

//$config = new Amfphp_Core_Config();
//$config->serviceFolderPaths = array(dirname(__FILE__) . '/tests/');
//$gateway = Amfphp_Core_HttpRequestGatewayFactory::createGateway($config);
//$gateway->service();
//$gateway->output();

$data = file_get_contents("php://input");

function handleError($errno, $errstr, $errfile, $errline, array $errcontext)
{
    // error was suppressed with the @-operator
    if (0 === error_reporting()) {
        return false;
    }

    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

set_error_handler('handleError');
header('Content-Type: text/html;charset=utf-8');


if($_GET['target'] == '-1956') {
    xdebug_break();
}

try {
    $d = amf3_decode(substr($data, 1));
} catch (ErrorException $e) {
    return;
}
//    if(strlen($php_errormsg)) {
//        continue;
//    }

echo print_r($d, true) . "\n";