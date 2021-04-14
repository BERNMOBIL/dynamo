"use strict";

var app = angular.module('app', ['wizard.controllerModule', 'ng.deviceDetector']);

app .constant({appName: "Wizard"})
    .constant({appVersion: "1.0"})
    .constant({appAuthor: "Glue Software Engineering AG"})
    .value({pageTitle: "ÖV-Plus Abfahrtsanzeige erstellen"});

app.run(function ($rootScope, $log, pageTitle, appName, deviceDetector) {

    //Diese Objekte enthalten Informationen zum vom Client verwendeten Browser und Betriebsystem
    $rootScope.deviceDetector = deviceDetector;
    $rootScope.deviceIsMobile = false;
    if(
        $rootScope.deviceDetector.raw.device["iphone"] ||
        $rootScope.deviceDetector.raw.device["android"] ||
        $rootScope.deviceDetector.raw.device["blackberry"] ||
        $rootScope.deviceDetector.raw.device["firefox-os"] ||
        $rootScope.deviceDetector.raw.device["windows-phone"]
    ){
        $rootScope.deviceIsMobile = true;
    }

    //Seitentitel
    $rootScope.pageTitle = pageTitle;

    //App is running message
    $log.info(appName + " is running");
    
});


app.config(function($logProvider){
    $logProvider.debugEnabled(true);
});
