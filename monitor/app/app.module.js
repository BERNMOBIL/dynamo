"use strict";

var app = angular.module('app', ['monitorRender.controllerModule', 'ng.deviceDetector']);

app .constant({appName: "Monitor-Render"})
    .constant({appVersion: "1.0"})
    .constant({appAuthor: "Glue Software Engineering AG"})
    .value({pageTitle: "ÖV-Plus Abfahrtsanzeige"});

app.run(function ($rootScope, $log, pageTitle, appName, deviceDetector) {


    //Dieses Objekt enthält Informationen zum vom Client verwendeten Browser und Betriebsystem
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

    $log.info(appName + " is running");

});


app.config(function($logProvider){
    $logProvider.debugEnabled(true);
});

