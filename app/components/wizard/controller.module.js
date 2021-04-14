"use strict";

var controllerModule = angular.module('wizard.controllerModule', ['bootstrap3-typeahead', 'ngAnimate', 'ngSanitize']);

controllerModule.controller('wizard.controller.ctrl', function ($scope, $rootScope, $log, $http, $sce, $window, $timeout) {


        //SETTING-OPTIONS
        var defaultNumberOfDepartures = 5;

        $scope.showMyConsole = false;

        $scope.layout = "1";


        //MonitorURL
        $scope.monitorUrl = $window.location.protocol + "//" + $window.location.host + "/monitor/";


        //Request
        $scope.httpRequestProxyUrl = "http-request-proxy.php";
        $scope.httpPostConfig = {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}};


        //Input-Variablen

        $scope.stationInputFields = {
            stationGroup1: "",
            stationGroup2: ""
        };

        $scope.stationAutocompleteResult = {
            stationGroup1: [],
            stationGroup2: []
        };

        $scope.screenBuildDefinitions = {
            layout: 1,
            viewType: "singleView",
            showClock: true,
            showPerron: true,
            allowMultibleStationsPerGroup: false,
            stationGroup1Title: "",
            stationGroup1: [
                // {
                //     name: "Bern",
                //     id: "85:7000",
                //     quantityOfDepartures: 5
                // }
            ],
            stationGroup2Title: "",
            stationGroup2: []
        };

        $scope.screenBuildUrl = "URL";

        $scope.screen = {
            rotate: false,
            proportions: {
                "16to9": true,
                "16to10": false,
                "3to2": false,
                "4to3": false
            }
        };


        //Popup Eigenschaften
        $scope.popup = {
            showPopup: false,
            message: "",
            showTitle: true,
            title: "",
            showScreenshot: true,
            screenshotNumber: 2
        };


        //FUNKTIONEN//


        //Key-Down-Trigger
        $scope.enterIsBlocked = false;

        $scope.keyDown = function (e) {

            // "$"-Key soll die Konsole öffnen
            if (e.key == "$" && e.ctrlKey && e.altKey) {
                $scope.showMyConsole = !$scope.showMyConsole;
            }

            // "Enter"-Key soll offene Popup fenster schliessen
            if (e.key == "Enter") {
            //
            //     if(!$scope.enterIsBlocked){
                    $scope.closePopup();
            //     }
            //     $scope.enterIsBlocked = true;
            //     $timeout(function(){
            //         $scope.enterIsBlocked = false;
            //     }, 200);
            }
        };


        //Autocomplete
        $scope.stationAutoComplete = function (nameOfStationGroup) {
            //diese Funktion wird ausgelöst, wenn der Inhalt der Inputfelder geändert werden

            if (!!$scope.stationInputFields[nameOfStationGroup].length) {

                //request für Autocomplete
                var urlEndPart = "autocomplete/queryStationAndAdress?query=" + encodeURIComponent($scope.stationInputFields[nameOfStationGroup]) + "&filterBy=STATION";
                // $log.debug("Request für Autocomplete mit: " + urlEndPart);

                $http.post($scope.httpRequestProxyUrl, $.param({urlEndPart: urlEndPart}), $scope.httpPostConfig).success(function (data) {
                    // $log.debug("getAutocomplete erhalten");
                    // $log.debug(data);
                    $scope.stationAutocompleteResult[nameOfStationGroup] = data.result;

                }).error(function (data, status, headers, config) {
                    $scope.errorLog(data, status, headers, config, "Es gab ein Problem bei der Anfrage: getAutocomplete1");
                });
            }
        };


        //Autocomplete: Callback1 für TypeAhead von Station input
        $scope.stationTypeaheadCallback1 = function (station) {

            $scope.addStation('stationGroup1', station.name, station.id);
            $scope.createViewAndURL();
        };


        //Autocomplete: Callback2 für TypeAhead von Station input
        $scope.stationTypeaheadCallback2 = function (station) {

            $scope.addStation('stationGroup2', station.name, station.id);
            $scope.createViewAndURL();
        };


        //ausgewählte Haltestelle hinzufügen
        $scope.addStation = function (nameOfStationGroup, stationName, stationId) {

            //Hilfsfunktion
            var isThisStationIdInStationArray = function (id, stationArray) {
                var answer = false;
                stationArray.forEach(function (station) {
                    if (station.id == id) {
                        answer = true;
                    }
                });
                return answer;
            };

            //wenn "Mehrere Haltestellen pro Anzeiger zulassen" dekativiert ist
            if ($scope.screenBuildDefinitions.allowMultibleStationsPerGroup == false) {

                if (stationId == "") {
                    $scope.showPopup("Wählen Sie eine Haltestelle aus.", 2);

                } else if($scope.screenBuildDefinitions[nameOfStationGroup].length > 0){

                    $scope.showPopup(   "Es kann momentan nur eine Haltestelle pro Anzeiger ausgewählt werden.<br><br>" +
                                        "Wenn Sie mehrere Haltestellen in einer Anzeige vereinen möchten, aktivieren Sie " +
                                        "«Mehrere Haltestellen pro Anzeiger zulassen» im Bedienfeld «Optionen».", 3);

                    //Inputfeld wird zurückgesetzt
                    $scope.stationInputFields[nameOfStationGroup] = "";

                } else {


                    //Station-Informationen-Objekt wird erzeugt
                    var newStation = {
                        name: stationName,
                        id: stationId,
                        quantityOfDepartures: defaultNumberOfDepartures
                    };

                    //Der Name der Station wird als Titel übernommen
                    $scope.screenBuildDefinitions[nameOfStationGroup + "Title"] = stationName;


                    //StationenArray wird durch das neu erzeugte ersetzt
                    $scope.screenBuildDefinitions[nameOfStationGroup] = [newStation];

                    //Inputfeld wird zurückgesetzt
                    $scope.stationInputFields[nameOfStationGroup] = "";
                }

            //wenn "Mehrere Haltestellen pro Anzeiger zulassen" ativiert ist
            } else {

                if (stationId == "") {
                    $scope.showPopup("Wählen Sie eine Haltestelle aus.", 2);

                } else if ($scope.screenBuildDefinitions[nameOfStationGroup].length > 2) {
                    $scope.showPopup("Die maximal mögliche Anzahl der Haltestellen ist 3.");

                } else if (isThisStationIdInStationArray(stationId, $scope.screenBuildDefinitions[nameOfStationGroup])) {
                    $scope.showPopup("Diese Haltestelle wurde bereits ausgewählt.");

                } else if ($scope.countAllDeparturesInStationGroupAndAddThis(nameOfStationGroup, defaultNumberOfDepartures) > 30) {
                    $scope.showPopup("Die maximal mögliche Anzahl aller Abfahrten zusammen ist 30.");

                } else {

                    //Station-Informationen-Objekt wird erzeugt
                    var newStation = {
                        name: stationName,
                        id: stationId,
                        quantityOfDepartures: defaultNumberOfDepartures
                    };

                    //StationenArray wird durch das neu erzeugte erweitert
                    $scope.screenBuildDefinitions[nameOfStationGroup].push(newStation);

                    //Inputfeld wird zurückgesetzt
                    $scope.stationInputFields[nameOfStationGroup] = "";

                    //wenn noch kein Titel definiert wurde, wird anhand der ersten Haltestelle eines erzeugt


                    if( $scope.screenBuildDefinitions[nameOfStationGroup].length == 1
                        && $scope.screenBuildDefinitions[nameOfStationGroup + "Title"] == "" ){
                            $log.debug("->stationName");
                            $log.debug(stationName);
                            $scope.screenBuildDefinitions[nameOfStationGroup + "Title"] = stationName;
                    }
                }
            }


            $scope.createCSSafterTimeout();
        };


        //Delete-Button in Station-Entity wurde betätigt
        $scope.deleteButtonOfStationEntityHasBeenPushed = function (nameOfStationGroup, indexOfStationEntity) {

            $scope.screenBuildDefinitions[nameOfStationGroup].splice(indexOfStationEntity, 1);

            $scope.createViewAndURL();
        };


        //Anzahl-input in Station-Entity wurde geändert
        $scope.quantityOfStationEntityHasChanged = function (nameOfStationGroup, indexOfStationEntity) {

            if ($scope.screenBuildDefinitions[nameOfStationGroup][indexOfStationEntity].quantityOfDepartures == undefined) {
                //keine Reakion
            }
            if ($scope.screenBuildDefinitions[nameOfStationGroup][indexOfStationEntity].quantityOfDepartures > 15) {
                $scope.showPopup("Die Maxilalanzahl der Abfahrten pro Haltestelle ist 15.");
                $scope.screenBuildDefinitions[nameOfStationGroup][indexOfStationEntity].quantityOfDepartures = 15;
            }
            if ($scope.countAllDeparturesInStationGroupAndAddThis(nameOfStationGroup, 0) > 30) {
                $scope.showPopup("Die maximal mögliche Anzahl aller Abfahrten zusammen ist 30.");
                $scope.screenBuildDefinitions[nameOfStationGroup][indexOfStationEntity].quantityOfDepartures = 0;
                $scope.screenBuildDefinitions[nameOfStationGroup][indexOfStationEntity].quantityOfDepartures
                    = 30 - $scope.countAllDeparturesInStationGroupAndAddThis(nameOfStationGroup, 0);
            }

            $scope.createViewAndURL();
        };


        //"Mehrere Haltestellen pro Anzeiger zulassen"-input wurde geändert
        $scope.allowMultibleStationsPerGroupHasChanged = function (){
          if($scope.screenBuildDefinitions.allowMultibleStationsPerGroup == false) {
              //die Stationen Arrays werden auf das erste reduziert
              $scope.screenBuildDefinitions.stationGroup1.splice(1, $scope.screenBuildDefinitions.stationGroup1.length - 1);
              $scope.screenBuildDefinitions.stationGroup2.splice(1, $scope.screenBuildDefinitions.stationGroup2.length - 1);
              //Der Name der ersten Station wird als Titel übernommen
              $scope.screenBuildDefinitions.stationGroup1Title = $scope.screenBuildDefinitions.stationGroup1[0].name;
              if($scope.screenBuildDefinitions.stationGroup2[0] != undefined){
                $scope.screenBuildDefinitions.stationGroup2Title = $scope.screenBuildDefinitions.stationGroup2[0].name;
              }
          }
        };


        //Alle Abfahrten zusammenzählen
        $scope.countAllDeparturesInStationGroupAndAddThis = function (nameOfStationGroup, addThisToCount) {

            if (addThisToCount == undefined) {
                addThisToCount = 0
            }

            var quantityOfAllDepartures = 0;

            $scope.screenBuildDefinitions[nameOfStationGroup].forEach(function (station) {
                quantityOfAllDepartures += station.quantityOfDepartures;
            });

            return quantityOfAllDepartures + addThisToCount;
        };


        //Vorschau und URL erstellen
        $scope.createViewAndURL = function () {

            $scope.screenBuildUrl = $scope.monitorUrl;

            var parameter =
                "?viewType=" + $scope.screenBuildDefinitions.viewType +
                "&layout=" + $scope.screenBuildDefinitions.layout +
                "&showClock=" + $scope.screenBuildDefinitions.showClock +
                "&showPerron=" + $scope.screenBuildDefinitions.showPerron +
                "&stationGroup1Title=" + encodeURIComponent($scope.screenBuildDefinitions.stationGroup1Title);

            if ($scope.screenBuildDefinitions.viewType == "splitView") {
                parameter +=
                    "&stationGroup2Title=" + encodeURIComponent($scope.screenBuildDefinitions.stationGroup2Title);
            }

            var index = 0;

            $scope.screenBuildDefinitions.stationGroup1.forEach(function (station) {

                index++;

                parameter +=
                    "&station_" + index + "_id=" + encodeURIComponent(station.id) +
                    "&station_" + index + "_name=" + encodeURIComponent(station.name) +
                    "&station_" + index + "_quantity=" + ((station.quantityOfDepartures) ? station.quantityOfDepartures : "1") +
                    "&station_" + index + "_group=1";
            });


            if ($scope.screenBuildDefinitions.viewType == "splitView") {

                $scope.screenBuildDefinitions.stationGroup2.forEach(function (station) {

                    index++;

                    parameter +=
                        "&station_" + index + "_id=" + encodeURIComponent(station.id) +
                        "&station_" + index + "_name=" + encodeURIComponent(station.name) +
                        "&station_" + index + "_quantity=" + ((station.quantityOfDepartures) ? station.quantityOfDepartures : "1") +
                        "&station_" + index + "_group=2";
                });
            }

            $scope.screenBuildUrl += parameter;

            $scope.connectIframe();

        };


        //erstellen der Vorschau
        $scope.connectIframe = function () {
            $scope.iframeURL = $sce.trustAsResourceUrl($scope.screenBuildUrl);
        };


        //Monitor in neuem Fenster anzeigen
        $scope.openMonitorInNewWindow = function () {

            if (($scope.screenBuildDefinitions.stationGroup1.length < 1) ||
                ($scope.screenBuildDefinitions.viewType == "splitView" && $scope.screenBuildDefinitions.stationGroup2.length < 1)) {

                $scope.showPopup("Wählen Sie in allen angezeigten Feldern mindestens eine Haltestelle aus.", 2);

            } else {
                $scope.createViewAndURL();
                $window.open($scope.iframeURL);
            }
        };


        //Vorschau-Screen-Grösse ändern
        $scope.changeScreenSizeTo = function (proportionAsString) {

            for (var proportion in $scope.screen.proportions) {
                $scope.consoleInfo += proportion;
                $scope.screen.proportions[proportion] = false;
            }
            $scope.screen.proportions[proportionAsString] = true;
        };


        //Vorschau-Screen rotieren
        $scope.rotateScreen = function () {
            $scope.screen.rotate = !$scope.screen.rotate;
        };


        //Error-Meldung-Handler nach Request
        $scope.errorLog = function (data, status, headers, config, myErrorMessage) {
            $log.debug(myErrorMessage);
            $log.debug("status:");
            $log.debug(status);
            $log.debug("headers:");
            $log.debug(headers);
            $log.debug("config:");
            $log.debug(config);
            $('.routing-please-wait').fadeOut('slow');
        };


        //das eigen kreierte Popup bei Fehlermeldungen
        $scope.showPopup = function (message, screenshotNumber, title) {

            if (title == undefined) {
                title = "";
            }

            if (screenshotNumber == undefined) {
                screenshotNumber = 0;
            }

            $scope.popup.showPopup = true;
            $scope.popup.showTitle = true;
            $scope.popup.showScreenshot = true;

            $scope.popup.message = message;

            $scope.popup.title = title;
            if ($scope.popup.title == "") {
                $scope.popup.showTitle = false;
            }
            $scope.popup.screenshotNumber = screenshotNumber;
            if ($scope.popup.screenshotNumber < 1) {
                $scope.popup.showScreenshot = false;
            }

            //Fokus von allen Elementen wegnehmen, damit alle KeyDown Events greifen
            $('*').blur();
        };


        //Popup schliessen
        $scope.closePopup = function () {
            $scope.popup.showPopup = false;
        };


        //Dies ist der Listener der ausgelöst wird, wenn die Fenstergrösse verändert wird
        $(window).resize(function () {
            $scope.createCSS();
        });


        //Nach Timeout und bei Aufruf der Funktion wird das Dynamische CSS generiert
        $scope.createCSSafterTimeout = function () {
            $timeout(function () {
                $scope.createCSS();
            }, 100);
        };
        $scope.createCSSafterTimeout();
        $scope.createCSS = function () {

            //Die Position des Footers wird Dynamisch


            var windowHeight = $(window).height();

            var footerHeight = 90;
            var headerHeight = 40;

            var dynamicCSS = "";

            //Dynamisches CSS für mobile Geräte
            if ($rootScope.deviceIsMobile) {

                dynamicCSS +=
                    ".surround-border { display: block; }" +
                    ".preview-section-fitting { height: 200px; }" +
                    "";

                if ($(window).width() < 450) {

                    //die Anzeige auf mobilen Geräten wird bei kleinerer Breite als 450 in einer Spalte angezeigt
                    dynamicCSS +=
                        ".preview-section-fitting { z-index: 5000 }" +
                        ".preview-section-fitting { padding-left: 0px; }" +
                        ".preview-section-fitting { width: 100%; }" +
                        ".preview-section-fitting { height: 200px; }" +
                        ".panel-container { padding: 230px 0 30px 0; }" +
                        ".panel-section-fitting { width: 100%; }" +
                        ".contact { padding: 15px 0 0 0;}" +
                        ".contact { width: 210px;}" +
                        ".oev-plus-badges { display: block;}" +
                        ".oev-plus-badges { position: relative;}" +
                        ".oev-plus-badges { margin: 15px 0 0 0;}" +
                        ".footer { text-align: center; }" +
                        ".footer { height: 160px; }" +
                        ".footer .badge-logo { width: 103px; }" +
                        ".box-shadow { display: none; }" +
                        ".screen .button { display: none; }" +
                        ".screen .button._rotate { display: inline-block; }" +
                        "";

                    footerHeight = 160;
                }
            }


            //Dynamisches CSS für Desktop
            if (!$rootScope.deviceIsMobile) {

                dynamicCSS +=
                    ".window { min-width: 500px; }";

                if (windowHeight > $('.panel-container').outerHeight() + footerHeight + headerHeight) {
                    dynamicCSS +=
                        ".panel-fitting { height: " + (windowHeight - footerHeight - headerHeight) + "px; }";
                }
            }


            //Das CSS wird in den Head geschrieben
            $('#dynamicCSS1').html(dynamicCSS);


            //Die Grösse des Peview-Screens wird dynamisch angepasst, damit Hoch und Querformat sich optisch anpassen
            //Diese Berechnung erweist sich als kompliziert, da die Höhe des Screens sich immer dessen Breite Anpasst
            var dynamicCSS = "";

            var maxWidth;
            var FactorForWidth = ( $('.width-to-height-ratio').height() / $('.width-to-height-ratio').width() + 2) / 3;
            var maxWidthFromWidth = $('.preview-section-fitting').width() * FactorForWidth * 0.9;

            var FactorForHeigth = ($('.width-to-height-ratio').width() / $('.width-to-height-ratio').height() + 2) / 3;
            var maxWidthFromHeight = $('.preview-section-fitting').height() * FactorForHeigth * 1.2;

            if (maxWidthFromHeight < maxWidthFromWidth) {
                maxWidth = maxWidthFromHeight;
            } else {
                maxWidth = maxWidthFromWidth;
            }
            dynamicCSS += ".preview-container { max-width: " + maxWidth + "px; }";

            //Das CSS wird in den Head geschrieben
            $('#dynamicCSS2').html(dynamicCSS);

        };


        //MEINE ENTWICKLER KONSOLE
        $scope.hideConsole = function () {
            $scope.showMyConsole = false;
        };

    }
);


//Diese Direktive für 'typeahead' wurde von einem Template übernommen. Einzig eigene Änderungen sind im "elem.bind("keydown")
controllerModule.directive('typeahead', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: 'A',
        transclude: true,
        scope: {
            ngModel: '=',
            typeahead: '=',
            typeaheadCallback: "="
        },
        link: function (scope, elem, attrs) {

            var template = '<div class="dropdown typeahead">' +
                '<ul class="dropdown-menu" style="display:block;" ng-hide="!ngModel.length || !filitered.length || selected">' +
                '<li ng-mousedown="click(item)" ng-repeat="item in filitered = (typeahead | limitTo:10) track by $index" ' +
                'style="cursor:pointer" ng-class="{active:$index==active}" ng-mouseenter="mouseenter($index)">' +
                '<a>{{item.name}}</a></li></ul></div>';

            elem.bind('blur', function () {
                $timeout(function () {
                    scope.selected = true
                }, 100)
            });

            elem.bind("keydown", function ($event) { //Event wurde auf Keydown geändert um Event-Komplikationen zu vermeiden
                if ($event.keyCode == 38 && scope.active > 0) { // arrow up
                    scope.active--;
                    scope.$digest()
                } else if ($event.keyCode == 40 && scope.active < scope.filitered.length - 1) { // arrow down
                    scope.active++;
                    scope.$digest()
                } else if ($event.keyCode == 13) { // enter
                    $timeout(function(){ //Ein Timeout wurde eingesetzt um Kollision mit Popup zu vermeiden
                        scope.$apply(function () {
                            scope.click(scope.filitered[scope.active])
                        })
                    },100)
                }
            });

            scope.click = function (item) {
                scope.ngModel = item.name;
                scope.selected = item;
                if (scope.typeaheadCallback) {
                    scope.typeaheadCallback(item)
                }
                elem[0].blur()

            };

            scope.mouseenter = function ($index) {
                scope.active = $index
            };

            scope.$watch('ngModel', function (input) {
                if (scope.selected && scope.selected.name == input) {
                    return
                }

                scope.active = 0;
                scope.selected = false;

            });

            elem.after($compile(template)(scope))
        }
    }
}]);

