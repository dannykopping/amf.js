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
header('Content-Type: application/x-amf;charset=utf-8');

class_alias('StrictType', 'com.flowsa.bob');

try {
    $d = amf3_decode($data, $count, AMF3_CLASS_MAP | AMF3_CLASS_CONSTRUCT);
} catch (ErrorException $e) {
    return;
}

if (isset($d)) {
    echo amf3_encode($d, AMF3_FORCE_OBJECT);
}

class StrictType
{
    public $data;
    public $message = 'yay!';

    public function __construct()
    {
        $this->message = "Constructor was called in ".__CLASS__;
    }
}