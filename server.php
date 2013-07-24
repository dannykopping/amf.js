<?php
require_once "vendor/autoload.php";

if(function_exists('xdebug_disable'))
{
    xdebug_disable();
}

set_include_path("vendor/silexlabs/amfphp/Amfphp");
require_once "vendor/silexlabs/amfphp/Amfphp/index.php";