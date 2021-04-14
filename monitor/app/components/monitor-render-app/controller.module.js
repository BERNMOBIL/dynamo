"use strict";

var controllerModule = angular.module('monitorRender.controllerModule', []);

controllerModule.controller('monitorRender.controller.ctrl', function ($scope, $rootScope, $log, $http, $interval, $filter, $timeout) {


        //SETTING-OPTIONS
        var timeForRequestIntervalInMilliseconds = 60000;
        var addThisMillisecondsToRequestTime = 60000;
        var timeForIncidentMessageSliderInterval = 20000;
        var summariseRedundantIncidentMessages = true; // Messages mit gleicher ID werden zu einer zusammengefasst
        $scope.showMyConsole = false;



        //Request-Variablen
        $scope.httpRequestProxyUrl = "http-request-proxy.php";
        $scope.httpPostConfig = {headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}};

        //Dies ist die Höheneinheit für die HTML-Elemente
        $scope.theHeight = undefined;

        //Die vom Server elhaltene Parameter werden umstukturiert und in dieses Objekt rein geschrieben
        $scope.screenBuildDefinitions = {
            viewType: undefined,
            layout: undefined,
            showClock: undefined,
            showPerron: undefined,
            showLine: undefined,
            stationGroup1Title: undefined,
            stationGroup2Title: undefined,
            stationGroup1: [
                // {"name":"Fribourg/Freiburg","id":"85:4100","quatityOfDepartures":"4","group":"1"},
                // {"name":"Rolle","id":"85:1033","quatityOfDepartures":"5","group":"1"}
            ],
            stationGroup2: [
                // {"name":"Zürich Flughafen","id":"85:3016","quatityOfDepartures":"5","group":"2"}
            ]
        };

        //Die Resultate der Request der Abfahrten werden in dieses Objekt rein geschrieben
        $scope.departureResults = [[], []];

        //Die Abfahrten in diesem Array werden am Display angezeigt
        $scope.departureDisplayData = [[
            // {
            //     name: "Fribourg/Freiburg",
            //     departures: [
            //          {"vehicleType":"RAIL","lineName":"IC","destinationName":"Genève-Aéroport",
            //           "plattformNumber":"2","currentTime":1480496060490,"allocatedTimeInMilliseconds":1480496160000,"hasRealtime":false,
            //           "alternateDisplayWithMinutes":false,"limitForDisplayWithMinutesInMintutes":30,"timeUntilDepartureInMinutes":1,
            //           "departureTimeInMilliseconds":1480496160000,"departureTimeOnDisplay":"09:56","messageOnDisplay":""},
            //     ]
            // }
        ], []];

        //Die Meldungen von Störungen werden in diesem Array zusammengefasst
        $scope.incidentMessages = [];
        $scope.currentIndexOfIncidentMessage = 0;
        $scope.incidentMessagesRegisterText = [];
        // $scope.allLineNamesShownOnDispay = [];
        $scope.incidentIconIsActive = {};


        //FUNKTIONEN

        //Die Parameter die vom Server mitgegeben wurden, werden in dieser Funktion für bessere Lesbarkeit umstrukturiert
        $rootScope.writeScreenBuildDefinitions = function () {

            $.each($rootScope.parameterObject, function (key, value) {


                if (key == 'viewType') {
                    $scope.screenBuildDefinitions.viewType = value;
                }
                else if (key == 'layout') {
                    $scope.screenBuildDefinitions.layout = value;
                }
                else if (key == 'showClock') {
                    $scope.screenBuildDefinitions.showClock = value;
                }
                else if (key == 'showPerron') {
                    $scope.screenBuildDefinitions.showPerron = value;
                }
                else if (key == 'showLine') {
                    $scope.screenBuildDefinitions.showLine = value;
                }
                else if (key == 'stationGroup1Title') {
                    $scope.screenBuildDefinitions.stationGroup1Title = value;
                }
                else if (key == 'stationGroup2Title') {
                    $scope.screenBuildDefinitions.stationGroup2Title = value;
                }
                else if (key.match(/station/g).length > 0) {

                    var keyInParts = key.split('_');
                    var stationIndex = keyInParts[1] - 1;
                    var stationProperty = keyInParts[2];

                    if ($scope.screenBuildDefinitions.stationGroup1.length <= stationIndex) {
                        $scope.screenBuildDefinitions.stationGroup1.push(
                            {name: undefined, id: undefined, quatityOfDepartures: undefined, group: undefined});
                    }

                    if (stationProperty == 'id') {
                        $scope.screenBuildDefinitions.stationGroup1[stationIndex].id = value;
                    }
                    else if (stationProperty == 'name') {
                        $scope.screenBuildDefinitions.stationGroup1[stationIndex].name = value;
                    }
                    else if (stationProperty == 'quantity') {
                        $scope.screenBuildDefinitions.stationGroup1[stationIndex].quatityOfDepartures = value;
                    }
                    else if (stationProperty == 'group') {
                        $scope.screenBuildDefinitions.stationGroup1[stationIndex].group = value;
                    }
                }

                $("body").addClass("layout-" + $scope.screenBuildDefinitions.layout);

            });

            // die Stations mit "Gruppe: 2" werden in "stationGroup2" kopiert und in "stationGroup1" gelöscht

            var youHaveToDelete = [];

            $scope.screenBuildDefinitions.stationGroup1.forEach(function (station, index) {

                if (station.group == 2) {
                    $scope.screenBuildDefinitions.stationGroup2.push(station);
                    youHaveToDelete.push(index);
                }
            });

            youHaveToDelete.reverse();

            youHaveToDelete.forEach(function (numberOfIndex) {
                $scope.screenBuildDefinitions.stationGroup1.splice(numberOfIndex, 1);

            });


        };


        //Der Interval für die Abahrt-Abfragen wird gestartet
        $rootScope.startRequestInterval = function () {

            $scope.departureResults = [[], []];

            $scope.makeDepartureRequest(0, 0);

            $interval(function () {
                $scope.makeDepartureRequest(0, 0);
            }, timeForRequestIntervalInMilliseconds);
        };


        //Diese Funktion macht die Requests für die Abfahrten
        $scope.makeDepartureRequest = function (IndexOfGroup, indexOfRequest) {

            if (IndexOfGroup == 0) {
                var groupname = "stationGroup1"
            }
            if (IndexOfGroup == 1) {
                var groupname = "stationGroup2"
            }

            //Es wird anhand des IndexOfRequest überprüft, ob noch weitere Station-Einträge im screenBuildDefinitions-Objekt vohanden sind
            if (indexOfRequest >= $scope.screenBuildDefinitions[groupname].length) {

                if (IndexOfGroup == 0) {
                    $scope.makeDepartureRequest(IndexOfGroup + 1, 0);
                } else {

                    //Broadcast wird ausgesendet: Die Requests sind beendet
                    $rootScope.$broadcast('allDeparturesRecieved');
                }

            } else {

                //Ein Request für Abfahrten wird gestartet

                //Der Inhalt des "departureResults"-Objekt wird beim ersten Durchgang geresetet
                if (indexOfRequest == 0) {
                    $log.debug('"departureResults"-Objekt wird zurückgesetzt');
                    $scope.departureResults[IndexOfGroup] = [];
                }

                //jetzige Zeit bestimmen, einige Sekunden dazuzaddieren und formatieren
                var timeForRequest = new Date();
                timeForRequest.setMilliseconds(timeForRequest.getMilliseconds() + addThisMillisecondsToRequestTime); //der Aktuellen Zeit werden einige Sekunden dazuaddiert
                var numberPadding = function (number, pad) {
                    while ((number + "").length < pad) {
                        number = "0" + number;
                    }
                    return number;
                };
                var currentTimeInCorrectFormat = "" + numberPadding(timeForRequest.getFullYear(), 4) + numberPadding(timeForRequest.getMonth() + 1, 2) +
                    numberPadding(timeForRequest.getDate(), 2) + numberPadding(timeForRequest.getHours(), 2) + numberPadding(timeForRequest.getMinutes(), 2);

                //Request URL-Endpart erzeugen
                var urlEndPart = "departure?from=" + $scope.screenBuildDefinitions[groupname][indexOfRequest].id + "&dateTime=" + currentTimeInCorrectFormat + "&medium=OEVPLUSCH";
                $log.debug("makeDepartureRequest-Request: " + urlEndPart);


                //Request starten an den Proxy
                $http.post($scope.httpRequestProxyUrl, $.param({
                    urlEndPart: urlEndPart,
                    apiKey: "required"
                }), $scope.httpPostConfig).success(function (data) {

                    $log.debug("Abfahrten erhalten");
                    $log.debug(data);

                    if ('failure' in data) {
                        //wenn vom Routing-Server keine Resultate erzeugt werden konnten wird ein "failure"-Objekt zurückgegeben
                        $scope.departureResults[IndexOfGroup].push(data);

                    } else {
                        //wenn vom Routing-Server einwandfreie Abfahrten erhalten wurden wird das "departureResult"-Objekt mit dem Resultat ergänzt
                        $scope.departureResults[IndexOfGroup].push(data);
                    }

                    //Rekursive wiederholung der Funktion
                    $log.debug('Eine Abfahrt-Request von Gruppe ' + (IndexOfGroup + 1) + ' wurde beendet und die Daten ins "departureResults"-Objekt geschrieben:');
                    $log.debug($scope.departureResults[IndexOfGroup]);
                    $scope.makeDepartureRequest(IndexOfGroup, indexOfRequest + 1);

                }).error(function (data, status, headers, config) {

                    $scope.errorLog(data, status, headers, config, "Es gab ein Problem bei der Anfrage: getNextAddressFromCurrentPosition");

                    //Rekursive wiederholung der Funktion
                    $scope.makeDepartureRequest(IndexOfGroup, indexOfRequest + 1);
                });
            }
        };


        //Listener: wenn alle Abfahrten erhalten wurden
        $scope.$on('allDeparturesRecieved', function () {
            $log.debug("$scope.departureResults");
            $log.debug($scope.departureResults);
            $scope.makeDepartureDisplayData();
        });


        //Das Objekt mit den zu angezeigenden Abfahrten wird geschrieben
        $scope.makeDepartureDisplayData = function () {

            //die Daten werden zurückgesetzt
            $scope.departureDisplayData = [[], []];
            $scope.incidentMessages = [];
            // $scope.allLineNamesShownOnDispay = [];

            $scope.departureResults.forEach(function (group, indexOfGroup) {

                group.forEach(function (departuresObject, indexOfDeparture) {

                    $scope.departureDisplayData[indexOfGroup].push({
                        name: departuresObject.station.name,
                        departures: []
                    });

                    var departures = [];

                    $log.debug("$scope.incidentMessages");
                    $log.debug($scope.incidentMessages);

                    departuresObject.routes.forEach(function (route, index) {
                      if (!$scope.screenBuildDefinitions.showLine || route.line.name == $scope.screenBuildDefinitions.showLine) {
                        route.departures.forEach(function (departureObjekt, index) {


                            //Incident Meldungen werden vorbereitet
                            //Hilfsfunktion
                            var isThisIdInThatArray = function (id, array) {
                                var answer = false;
                                array.forEach(function (object, index) {
                                    if (object.id == id) {
                                        answer = true;
                                    }
                                });
                                return answer;
                            };
                            //Incident Meldungen werden gebüschelt
                            if (departureObjekt.messages.length > 0) {
                                departureObjekt.messages.forEach(function (message, index) {
                                    //redundante Messages werden zusammengefasst, wenn Option true ist
                                    if (summariseRedundantIncidentMessages) {
                                        if (!isThisIdInThatArray(message.id, $scope.incidentMessages)) {
                                            $scope.incidentMessages.push(message);
                                        }
                                    } else {
                                        $scope.incidentMessages.push(message);
                                    }
                                });
                            }


                            //dieses Departure Objekt soll alle relevanten Informationen zur Abfahrt erhalten
                            var departure = {
                                vehicleType: departureObjekt.trip.line.vehicle,
                                lineName: departureObjekt.trip.line.name,
                                destinationName: departureObjekt.stop.headSign,
                                plattformNumber: departureObjekt.stop.plan.platform,

                                currentTime: new Date().getTime(),
                                allocatedTimeInMilliseconds: departureObjekt.stop.plan.departure,
                                hasRealtime: departureObjekt.realtimeDeparture,

                                hasIncidentMessage: undefined,
                                alternateDisplayWithMinutes: undefined,
                                limitForDisplayWithMinutesInMintutes: undefined,

                                realTimeInMilliseconds: undefined,
                                hasDelay: undefined,
                                delayInMinutes: undefined,
                                timeUntilDepartureInMinutes: undefined,

                                relevantDepartureTimeInMilliseconds: undefined,

                                departureTimeOnDisplay: undefined,
                                messageOnDisplay: undefined
                            };

                            //Ob die Abfahrt eine Störungsmeldung hat
                            if (departureObjekt.messages.length > 0) {
                                departure.hasIncidentMessage = true;
                            } else {
                                departure.hasIncidentMessage = false;
                            }

                            //Bedingung zu welcher die Anzeige in Minuten angezeigt werden soll
                            if (departure.vehicleType == "BUS" || departure.vehicleType == "TRAM" || departure.vehicleType == "FUNICULAR") {
                                departure.alternateDisplayWithMinutes = true;
                            } else {
                                departure.alternateDisplayWithMinutes = false;
                            }

                            //Minutenlimit für Alternative Anzeige
                            departure.limitForDisplayWithMinutesInMintutes = 15;

                            //Wenn die Abfahrt "Realtime" hat, wird das Objekt mit weiteren Informationen ergänzt

                            if (departure.hasRealtime) {

                                departure.realTimeInMilliseconds = departureObjekt.stop.prognosis.departure;

                                departure.timeUntilDepartureInMinutes = Math.floor(moment.duration(moment(departure.realTimeInMilliseconds).diff(departure.currentTime)).asMinutes());

                                departure.relevantDepartureTimeInMilliseconds = departure.realTimeInMilliseconds;

                                departure.delayInMinutes = Math.floor(moment.duration(moment(departure.realTimeInMilliseconds).diff(departure.allocatedTimeInMilliseconds)).asMinutes());

                                if (departure.delayInMinutes > 0) {
                                    departure.hasDelay = true
                                } else {
                                    departure.hasDelay = false
                                }

                            } else {

                                departure.relevantDepartureTimeInMilliseconds = departure.allocatedTimeInMilliseconds;

                                departure.timeUntilDepartureInMinutes = Math.floor(moment.duration(moment(departure.allocatedTimeInMilliseconds).diff(departure.currentTime)).asMinutes());
                            }

                            //weitere Angaben für das Display werden generiert: Abfahrtszeit und Hinweis
                            if (departure.hasRealtime) {

                                if (departure.alternateDisplayWithMinutes && departure.timeUntilDepartureInMinutes < departure.limitForDisplayWithMinutesInMintutes) {

                                    departure.departureTimeOnDisplay = departure.timeUntilDepartureInMinutes + "'";

                                } else {
                                    departure.departureTimeOnDisplay = $filter('date')(departure.allocatedTimeInMilliseconds, 'HH:mm');
                                }

                                // Show delay in yellow in case of not showing departure in minutes
                                if (departure.hasDelay && !departure.alternateDisplayWithMinutes ) {
                                   departure.messageOnDisplay = "+ " + departure.delayInMinutes + "'";
                                } else {
                                   departure.messageOnDisplay = "";
                                }

                            }

                            if (!departure.hasRealtime) {

                                if (departure.alternateDisplayWithMinutes && departure.timeUntilDepartureInMinutes < departure.limitForDisplayWithMinutesInMintutes) {

                                    departure.departureTimeOnDisplay = departure.timeUntilDepartureInMinutes + "'";
                                    departure.messageOnDisplay = "";
                                } else {
                                    departure.departureTimeOnDisplay = $filter('date')(departure.allocatedTimeInMilliseconds, 'HH:mm');
                                }
                            }

                            departures.push(departure);
                        });
                      }
                    });

                    //Abfahrten werden nach Zeit sortiert
                    var departuresSorted = $filter('orderBy')(departures, 'relevantDepartureTimeInMilliseconds');

                    if (indexOfGroup == 0) {
                        var groupname = "stationGroup1"
                    }
                    if (indexOfGroup == 1) {
                        var groupname = "stationGroup2"
                    }

                    //Abfahrten werden auf die Anzahl der gewünschten Abfahrten reduziert
                    var departuresLimited = $filter('limitTo')(departuresSorted, $scope.screenBuildDefinitions[groupname][indexOfDeparture].quatityOfDepartures);

                    //Wenn die Anzahl der Abfahrten weniger sind als von den Optionen gewünscht, so wird der Rest mit leeren Objekten als Platzhalter aufgefüllt
                    //dadurch verändert sich die Proportionen in der Anzeige nicht

                    $log.debug("departuresLimited:", departuresLimited.length );
                    $log.debug("quatityOfDepartures:", $scope.screenBuildDefinitions[groupname][indexOfDeparture].quatityOfDepartures);

                    if(departuresLimited.length < $scope.screenBuildDefinitions[groupname][indexOfDeparture].quatityOfDepartures){
                        var difference = $scope.screenBuildDefinitions[groupname][indexOfDeparture].quatityOfDepartures - departuresLimited.length;
                        $log.debug("difference:", difference);
                        for(var i = 0; i < difference; i++){
                            departuresLimited.push({});
                        }
                    }

                    $scope.departureDisplayData[indexOfGroup][indexOfDeparture].departures = departuresLimited;

                    // // In diesem Array werden alle Linien-Namen aufgelistet. dies Hilft bei der IncidentMessage-Icon anzeige
                    // $scope.departureDisplayData.forEach(function (departureDisplayDatas) {
                    //     departureDisplayDatas.forEach(function (departures) {
                    //         departures.departures.forEach(function (departure) {
                    //             $scope.allLineNamesShownOnDispay.push(departure.lineName);
                    //         });
                    //     })
                    // })
                });
            });

            $log.debug('Das "departureDisplayData"-Objekt wurde mit den Request-Daten beschrieben');
            $log.debug($scope.departureDisplayData);

            if ($scope.incidentMessages.length > 0) {
                $rootScope.startIncidentMessageSlider();
            }

            $rootScope.createCSS();
        };


        //Anhand der berechneten Anzahl der Abfahrten wird die Höheneinheit berechnet
        $scope.getTheHeight = function () {

            //Zähle die Anzahl aller Abfahrten
            var numberOfAllDepartures = 0;
            $scope.departureDisplayData.forEach(function (array) {
                array.forEach(function (departures) {
                    numberOfAllDepartures += departures.departures.length;
                });
            });

            var factorForTheHeight = numberOfAllDepartures * 2 + 5;

            if ($scope.screenBuildDefinitions.viewType == 'splitView' &&
                ($scope.screenBuildDefinitions.stationGroup1.length > 0 && $scope.screenBuildDefinitions.stationGroup2.length > 0)) {
                factorForTheHeight += 3;
            }

            if ($scope.incidentMessages.length > 0) {
                factorForTheHeight += 5;
            }

            $scope.theHeight = ($(window).height() - $('#partner-logo').height() )/ factorForTheHeight;

            return $scope.theHeight;
        };


        //Dies ist der Listener der triggert, wenn die Fenstergrösse verändert wird
        $(window).resize(function () {
            $scope.createCSS();
        });

        $scope.theFactor1 = "-";
        $scope.theFactor2 = "-";
        //Das Dynamische CSS wird dem HTML-Head hinzugefügt
        $rootScope.createCSS = function () {

            var theHeight = $scope.getTheHeight();

            var theBorderWidth = theHeight / 20;
            var theBoxShadowSize = theHeight;
            var theBoxShadowOpacity = 0.1;
            var theFontSize = theHeight;


            // var incidentMessageString = $scope.incidentMessages[$scope.currentIndexOfIncidentMessage].message;

            // var factorFromIncidentMessageContainerSpace = $('.incident-message-container').width() * $('.incident-message-container').height() / 3000;

            // var factorFromIncidentMessageStringLength = 1 / incidentMessageString.length * 180;

            // $log.debug("factorFromIncidentMessageStringLength");
            // $log.debug(factorFromIncidentMessageStringLength);

            // if (factorFromIncidentMessageStringLength > 1) {
            //     factorFromIncidentMessageStringLength = 1;
            // }

            // var theFontSizeForIncidentMessage = factorFromIncidentMessageContainerSpace * factorFromIncidentMessageStringLength;

            // $log.debug("theFontSizeForIncidentMessage");
            // $log.debug(theFontSizeForIncidentMessage);



            if ($(window).width() < theFontSize * 27) {

                $scope.theFactor1 = theHeight * 10 / $(window).width();

                $scope.theFactor2 = 0.3 + 0.7 * $scope.theFactor1 + 0.6;

                theFontSize = $(window).width() * $scope.theFactor2 / 29;

            } else {
                $scope.theFactor1 = "-";
                $scope.theFactor2 = "-";
            }



            //Incident-Message-Slider
            var dynamicCSS2 =
                ".incident-message .message { font-size: " + (0.65 * theFontSize) + "px }" +
                ".incident-message .title { font-size: " + (0.7 * theFontSize) + "px }" +
                ".incident-message .incident-icon-container { height: " + (0.5 * theFontSize) + "px }" +
                ".incident-message .incident-icon-container { width: " + (0.5 * theFontSize) + "px }" +
                ".incident-message .incident-icon-container { margin-right: " + 0.5 * theFontSize + "px }" +
                "";


            if ($rootScope.deviceIsMobile) {
                dynamicCSS2 +=
                    ".incident-message .message {font-family: 'frutiger-bold', sans-serif;}" +
                    ".incident-message .message {font-family: 'frutiger-bold', sans-serif;}" +

                    "";
            }

            $('#sizeOfIncidentMessage').html(dynamicCSS2);


            var dynamicCSS =
                ".table-title-row { height: " + ( 2 * theHeight ) + "px }" +
                ".table-label-row { height: " + ( theHeight ) + "px }" +
                ".table-departure-row { height: " + ( 2 * theHeight ) + "px }" +
                ".table-empty-row { height: " + ( theHeight ) + "px }" +

                ".table-title-row .table-cell{ font-size: " + theFontSize + "px }" +
                ".table-label-row .table-cell{ font-size: " + 0.5 * theFontSize + "px }" +
                ".table-departure-row .table-cell{ font-size: " + 0.9 * theFontSize + "px }" +

                ".table-label-row { border-width: " + theBorderWidth + "px solid white }" +
                ".table-departure-row { border-width: " + theBorderWidth + "px solid white }" +
                ".simple-line { border-width: " + theBorderWidth + "px solid white }" +

                ".right-aligner-container { height: " + Math.floor(theFontSize / 5 * 3) + "px }" +
                ".right-aligner-container .right-aligner{ line-height: " + Math.floor(theFontSize / 5 * 3) + "px }" +

                "#clock-fitting { height: " + ( 4 * theHeight ) + "px }" +
                "#clock-container { height: " + ( 2.5 * theHeight ) + "px }" +
                "#clock-container { max-width: " + ( 2.5 * theHeight ) + "px }" +
                "#clock-container { left: " + ( 0.2 * theHeight ) + "px }" +

                "";

            //Breite der Zellen werden definiert
            var width;
            if ($scope.screenBuildDefinitions.showPerron == 'true') {
                width = {icon: "7%", line: "10%", destination: "41%", perron: "11%", departuretime: "14%", message: "12%"};
            }
            if ($scope.screenBuildDefinitions.showPerron == 'false') {
                width = {icon: "9%", line: "11%", destination: "54%", departuretime: "14%", message: "12%"};
                dynamicCSS += ".table-cell._perron { display: none }";
            }

            dynamicCSS +=
                ".table-cell._icon { width: " + width.icon + " }" +
                ".table-cell._line { width: " + width.line + " }" +
                ".table-cell._destination { width: " + width.destination + " }" +
                ".table-cell._perron { width: " + width.perron + " }" +
                ".table-cell._departuretime { width: " + width.departuretime + " }" +
                ".table-cell._message { width: " + width.message + " }" +
                "";


            //Incident-Message-Slider
            if ($scope.incidentMessages.length > 0) {
                dynamicCSS +=
                    ".space-for-incident-message { height: " + ( 5 * theHeight ) + "px }" +
                    ".incident-message-container { height: " + ( 4.4 * theHeight ) + "px }" +
                    ".incident-message-container { box-shadow: 0px -" + theBoxShadowSize + "px " + theBoxShadowSize + "px 0px rgba(0, 0, 0, " + theBoxShadowOpacity + ")}" +

                    ".incident-message .title { font-size: " + Math.floor(theFontSize / 6 * 4) + "px }" +
                    ".incident-message .title { line-height: " + Math.floor(theFontSize / 6 * 7) + "px }" +
                    ".incident-message .incident-icon-container { margin-right: " + 0.2 * theFontSize + "px }" +
                    ".incident-message .message { font-size: " + 0.5 * theFontSize + "px }" +

                    ".incident-icon-container { height: " + 0.5 * theFontSize + "px }" +
                    ".incident-icon-container { width: " + 0.5 * theFontSize + "px }" +
                    ".incident-message-slide-box .incident-icon { border: " + theBorderWidth + "px solid white; }" +
                    ".table-cell._message .incident-icon { box-shadow: 0px 0px " + theBoxShadowSize + "px 0px rgba(0, 0, 0, " + theBoxShadowOpacity + ")}" +

                    ".register-container { height: " + 0.8 * (theHeight+1) + "px; }" + //einen Pixel mehr damit im IE korrekt dargestellt wird
                    ".register-container { top: -" + 0.8 * theHeight + "px; }" +
                    ".register { font-size: " + 0.5 * theFontSize + "px }" +
                    ".register { border-top-left-radius: " + 0.1 * theHeight + "px }" +
                    ".register { border-top-right-radius: " + 0.1 * theHeight + "px }" +
                    ".register { box-shadow: 0px -" + 0.5 * theBoxShadowSize + "px " + 0.5 * theBoxShadowSize + "px 0px rgba(0, 0, 0, " + 0.5 * theBoxShadowOpacity + ")}" +
                    ".register { padding-top: " + 0.2 * theFontSize + "px }" +

                    "";
            }




            $('#dynamicMonitorCSS').html(dynamicCSS);
        };


        //Error-Meldung nach Request
        $scope.errorLog = function (data, status, headers, config, myErrorMessage) {
            $log.debug("myErrorMessage:");
            $log.debug(myErrorMessage);
            $log.debug("data:");
            $log.debug(data);
            $log.debug("status:");
            $log.debug(status);
            $log.debug("headers:");
            $log.debug(headers);
            $log.debug("config:");
            $log.debug(config);
            $('.routing-please-wait').fadeOut('slow');
        };


        //Die Uhr beginnt zu ticken
        $rootScope.startClockAnimation = function () {

            if ($scope.screenBuildDefinitions.showClock == "true") {
                $interval(function () {

                    var currentTime = new Date();

                    var deg = currentTime.getSeconds() * 6;
                    $('#second-hand').css({transform: "rotate(" + deg + "deg)"});

                    var deg = currentTime.getMinutes() * 6;
                    if (currentTime.getSeconds() == 0) {
                        deg -= 6;
                    }
                    $('#minute-hand').css({transform: "rotate(" + deg + "deg)"});

                    var deg = ( currentTime.getHours() * 30 + currentTime.getMinutes() * 6 / 10 );
                    $scope.console = deg;
                    $('#hour-hand').css({transform: "rotate(" + deg + "deg)"});

                }, 1000);
            }

            $timeout(function () {

                $('#clock').css("display", "block");

                $('#clock')
                    .draggable({
                        appendTo: "body",
                        disabled: true
                    })
                    .resizable({
                        disabled: true,
                        aspectRatio: true
                    });

                $('#clock').dblclick(function () {

                    if ($('#clock').draggable("option", "disabled")) {
                        $('#clock').draggable("option", "disabled", false);
                    } else {
                        $('#clock').draggable("option", "disabled", true);
                    }

                    if ($('#clock').resizable("option", "disabled")) {
                        $('#clock').resizable("option", "disabled", false);
                        $('#clock-container').css("max-width", "100%");
                    } else {
                        $('#clock').resizable("option", "disabled", true);
                    }

                    $('#clock').toggleClass('viewResizable');

                });
            }, 1000);

        };

        // onClick auf incident icon
        $scope.onIncidentClick = function( departure ) {
            for( var i = 0; i < $scope.incidentMessages.length; i++ ) {
                $scope.incidentMessages[i].lines.forEach( function( line ) {
                    if( line.name == departure.lineName ) {
                        // show the incident
                        $scope.doOneSlide( i );
                        // only show the first one
                        i = $scope.incidentMessages.length;
                    }
                });
            }
        }

        // Onclick auf den incident-tab, zeige spezifischen incident
        $scope.showIncident = function( currentIncident ) {
            $scope.doOneSlide( currentIncident );
            // SliderInterval zurücksetzen
            $scope.createIntervalSlider();
        };

        //Incident-Message-Slider
        $scope.sliderIntervalPromise;

        // Zeige einen spezifischen oder den nächsten Incident slide an
        $scope.doOneSlide = function( index ) {
            if( index !== undefined ) {
                // if the requested incident is already shown, do nothing
                if( index == $scope.currentIndexOfIncidentMessage ) return;
                
                $scope.currentIndexOfIncidentMessage = index;
            } else {
                $scope.currentIndexOfIncidentMessage++;
            }

            var countOfMessages = $scope.incidentMessages.length;

            // Wenn der Index die Anzahl der Incident-Messages überschreitet wird der index auf 0 gesetzt
            if ($scope.currentIndexOfIncidentMessage == countOfMessages) {
                $scope.currentIndexOfIncidentMessage = 0;
            }
            var index = $scope.currentIndexOfIncidentMessage;
            $log.debug("Slide-Message: Index " + index);

            //Hilfs-Funktion zum Verschieben des Indexes in eine Richtung bezogen auf die Array-Länge
            function getShiftedIndex(oldIndex, lengthOfIndex, shiftValue) {

                var newIndex = oldIndex + shiftValue;

                if (newIndex < 0) {
                    newIndex = lengthOfIndex + newIndex;
                }
                if (newIndex >= lengthOfIndex) {
                    newIndex = newIndex - lengthOfIndex;
                }
                return newIndex;
            }

            //remove old slider-elements
            $('.incident-message-content').empty();

            //Das Objekt mit den Namen der aktiven Linien wird beschrieben
            $scope.incidentIconIsActive = {};
            $scope.incidentMessages[index].lines.forEach(function (line, index) {
                $scope.incidentIconIsActive[line.name] = true;
            });

            //Neuer Slider-Kontent wird als HTML eingefügt und animiert
            var html =
                '<div class="incident-message-slide-box _' + index + '">' +
                '<div class="va1"><div class="va2"><div class="incident-message">' +
                '<p class="title"><span class="incident-icon-container"><span class="incident-icon"></span></span>' + $scope.incidentMessages[index].title + '</p>' +
                '<p class="message">' + $scope.incidentMessages[index].message + '</p>' +
                '</div></div>' +
                '</div></div>';

            $rootScope.createCSS();

            $('.incident-message-content').append(html);
            $('.incident-message-slide-box._' + index).css("left", "-100%");


            //ein Timeout wurde eingesetzt damit die Animation funktioniert
            $timeout(function () {
                $('.incident-message-slide-box._' + getShiftedIndex(index, countOfMessages, -1)).css("left", "100%");
                $('.incident-message-slide-box._' + index).css("left", "0%");
            }, 100);
        };

        $rootScope.startIncidentMessageSlider = function () {

            //Vorbereitungen

            $log.debug("Slider wird vorbereitet");
            $log.debug("Anzahl der zu anzeigenden Incident-Messages: " + $scope.incidentMessages.length);


            //Hilfs-Funktion zur Feststellung, ob ein Array einen bestimmten Namen enthält
            function isThisNameInThatArray(name, array) {
                var answer = false;
                array.forEach(function (element) {
                    if (element == name) {
                        answer = true
                    }
                });
                return answer;
            }


            //Daten für Register werden geschrieben
            $scope.incidentMessagesRegisterText = [];
            $scope.incidentMessages.forEach(function (incidentMessage, indexOfIncidentMessage) {

                $scope.incidentMessagesRegisterText.push([]);
                incidentMessage.lines.forEach(function (line, index) {

                    if ( !isThisNameInThatArray(line.name, $scope.incidentMessagesRegisterText[indexOfIncidentMessage])) {
                        $scope.incidentMessagesRegisterText[indexOfIncidentMessage].push(line.name);
                    }
                });
            });

            $log.debug("Text für Incident-Message Register wurde geschrieben:");
            $log.debug($scope.incidentMessagesRegisterText);


            //Vorangegangener Slider-Interval wird zurückgesetzt
            $interval.cancel($scope.sliderIntervalPromise);

            $scope.currentIndexOfIncidentMessage = 0;
            var index = $scope.currentIndexOfIncidentMessage;

            //Das Objekt mit den Namen der aktiven Linien wird geschrieben
            $scope.incidentIconIsActive = {};
            $scope.incidentMessages[index].lines.forEach(function (line, index) {
                $scope.incidentIconIsActive[line.name] = true;
            });

            //Erster Slider-Kontent wird als HTML eingefügt und animiert
            var html =
                '<div class="incident-message-slide-box _' + index + '">' +
                '<div class="va1"><div class="va2"><div class="incident-message">' +
                '<p class="title">' +
                '<span class="incident-icon-container"><span class="incident-icon"></span></span>' +
                '' + $scope.incidentMessages[index].title + '</p>' +
                '<p class="message">' + $scope.incidentMessages[index].message + '</p>' +
                '</div></div>' +
                '</div></div>';

            $rootScope.createCSS();

            $('.incident-message-content').html(html);

            //Slider-Kontent wird platziert: nur wenn mehr als eine Message vorhanden ist.
            if ($scope.incidentMessages.length > 1) {
                $('.incident-message-slide-box._' + index).css("left", "-100%");
            }

            //ein Timeout wurde eingesetzt damit die Animation einwandfrei funktioniert
            $timeout(function () {
                $('.incident-message-slide-box._' + index).css("left", "0%");
            }, 100);

            $log.debug("Slider wurde gestartet");
            $log.debug("Do-First-Message: Index " + index);

            // Zeige den ersten Slide an
            $scope.doOneSlide();

            //Hier wird der Slide ausgelöst: nur wenn die Message-Anzahl grösser als 1 ist.
            $scope.createIntervalSlider();
        };

        $scope.createIntervalSlider = function() {
            if( $scope.sliderIntervalPromise ) {
                $interval.cancel( $scope.sliderIntervalPromise );
            }
            if ($scope.incidentMessages.length > 1) {
                $scope.sliderIntervalPromise = $interval(function () {
                    $log.debug("doOneSlide()");
                    $scope.doOneSlide();
                }, timeForIncidentMessageSliderInterval);
            }
        };


        //MEINE ENTWICKLER KONSOLE
        //diese Konsole kann beim Entwickeln der Applikation hilfreich sein und wird nach eingenen Bedürfnissen verwendet
        $scope.hideConsole = function () {
            $scope.showMyConsole = false;
        };
        //Entwickler-Konsole mit "$" Taste ein und ausblenden
        $scope.keyDown = function (e) {
            if (e.keyCode == 89 && e.ctrlKey && e.altKey) {
                $scope.showMyConsole = !$scope.showMyConsole;
            }
        };
    }
);
