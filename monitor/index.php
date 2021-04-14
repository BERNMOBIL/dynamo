<!DOCTYPE html>
<html lang="de" ng-app="app">
<head>

    <link href="assets/img/favicon/favicon.png" rel="icon" type="image/x-icon" />

    <!--Metadaten-->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Wenn JS deaktiviert ist wird dies mit einem Hinweis abgefangen -->
    <style id="if-no-JS">
        .info-if-no-JS { display: block !important }
        .window { display: none !important; }
        * { transition: none !important; }
    </style>

    <script>
        document.getElementById("if-no-JS").innerHTML = ".info-if-no-JS {display: none;} .window {display: block;}"
    </script>

    <!--Seitentitel-->
    <title ng-bind="pageTitle"></title>

    <!--CSS-->
    <link rel="stylesheet" href="assets/libs/bootstrap-3.3.7-dist/css/bootstrap.css">
    <link rel="stylesheet" href="assets/libs/jquery-ui-1.11.4/jquery-ui.css">
    <link rel="stylesheet" href="assets/css/monitor-render-100.css">

    <!--Dynamisches CSS: wird von JS erstellt-->
    <style id="dynamicMonitorCSS"></style>
    <style id="sizeOfIncidentMessage"></style>

    <!--JS von Libraries-->
    <script src="assets/libs/angular-1.5.0-rc.1/angular.js"></script> <!-- AngularJS -->
    <script src="assets/libs/moment.js"></script> <!-- MomentJS -->
    <script src="assets/libs/jquery-3.1.1.js"></script>
    <script src="assets/libs/jquery-ui-1.11.4/jquery-ui.js"></script>
    <script src="assets/libs/re-tree-master/re-tree.js"></script>
    <script src="assets/libs/ng-device-detector-master/ng-device-detector.js"></script>


    <!--meine App-->
    <script src="app/app.module.js"></script>
    <script src="app/components/monitor-render-app/controller.module.js"></script>
    <script src="app/components/monitor-render-app/filter.js"></script>
    
    

    <!-- Matomo 
    <script type="text/javascript">
      var _paq = window._paq || [];
      /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="//matomo.myurl.tld/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '42']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    </script>
    <!-- End Matomo Code -->



</head>

<body ng-controller="monitorRender.controller.ctrl" ng-keydown="keyDown($event)">

<div class="info-if-no-JS">
    <div class="va1">
        <div class="va2">
            Sie haben Javascript bei ihrem Browser nicht aktiviert. Diese Seite wird so lange nicht angezeigt.
        </div>
    </div>
</div>
    

<!-- Matomo Image Tracker
<noscript>
<img src="https://myurl.tld/matomo/matomo.php?idsite=42&amp;rec=1" style="border:0" alt="" />
</noscript>
<!-- End Matomo -->

<div class="window">


    <div id="monitor">
        <div id="partner-logo"></div>
        <div id="departures" ng-show="departureDisplayData[0].length > 0 || departureDisplayData[1].length > 0">

            <!--Bahnhof-Uhr-->
            <div id="clock-fitting" ng-if="screenBuildDefinitions.showClock == 'true'">
                <div class="va1">
                    <div class="va2">
                        <div id="clock-container">
                            <div id="clock">
                                <div id="hour-hand"></div>
                                <div id="minute-hand"></div>
                                <div id="second-hand"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div class="departure-table-container">

                <div class="departure-table" ng-repeat="group in departureDisplayData">

                    <div ng-if="group.length > 0">

                        <div class="table-title-row">
                            <div class="table-cell _icon"></div>
                            <div class="table-cell _line"></div>
                            <div class="table-cell _title">
                                <div class="va1">
                                    <div class="va2"><b>{{screenBuildDefinitions['stationGroup'+ ($index+1) +'Title']}}</b></div>
                                </div>
                            </div>
                        </div>


                        <div class="table-label-row"
                             ng-if="( $index == 0 ) || ( $index == 1 && departureDisplayData[0].length == 0 )">
                            <div class="table-cell _icon"></div>
                            <div class="table-cell _line">
                                <div class="va1">
                                    <div class="va2">Linie</div>
                                </div>
                            </div>
                            <div class="table-cell _destination">
                                <div class="va1">
                                    <div class="va2">Ziel</div>
                                </div>
                            </div>
                            <div class="table-cell _perron">
                                <div class="va1">
                                    <div class="va2">
                                        <div class="right-aligner-container">
                                            <div class="right-aligner">Kante / Gleis</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="table-cell _departuretime">
                                <div class="va1">
                                    <div class="va2">Abfahrt</div>
                                </div>
                            </div>
                            <div class="table-cell _message">
                                <div class="va1">
                                    <div class="va2">Hinweis</div>
                                </div>
                            </div>
                        </div>

                        <div class="simple-line"
                             ng-if="( $index == 1 && departureDisplayData[0].length > 0 ) && ( $index != 0 )"></div>

                        <div class="table-departure-row"
                             ng-repeat="departure in group | filterDataBy: 'departures' | orderBy: 'relevantDepartureTimeInMilliseconds'">
                            <div class="table-cell _icon">
                                <div class="va1">
                                    <div class="va2">
                                        <div class="SBB-icon {{departure.vehicleType}}"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="table-cell _line">
                                <div class="va1">
                                    <div class="va2">{{departure.lineName}}</div>
                                </div>
                            </div>
                            <div class="table-cell _destination">
                                <div class="va1">
                                    <div class="va2">{{departure.destinationName}}</div>
                                </div>
                            </div>
                            <div class="table-cell _perron">
                                <div class="va1">
                                    <div class="va2">
                                        {{departure.plattformNumber}}
                                    </div>
                                </div>
                            </div>
                            <div class="table-cell _departuretime">
                                <div class="va1">
                                    <div class="va2">
                                        {{ departure.departureTimeOnDisplay }}
                                    </div>
                                </div>
                            </div>
                            <div class="table-cell _message">
                                <div class="va1">
                                    <div class="va2">
                                        <span class="special-color">{{ departure.messageOnDisplay }}</span>
                                        <span class="incident-icon-container">
                                        <span class="incident-icon clickable"
                                              ng-if="departure.hasIncidentMessage"
                                              ng-class="{'active': incidentIconIsActive[departure.lineName]}" ng-click="onIncidentClick(departure) "></span>
                                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="table-empty-row"></div>


                    </div>
                </div>
                <div class="space-for-incident-message"></div>
            </div>

        </div>

        <!--Footer mit Störungs-Meldungen-->
        <div class="incident-message-container" ng-show="incidentMessages.length > 0">
            <div class="register-container">
                <div class="register clickable" ng-repeat="registerTextArray in incidentMessagesRegisterText"
                     ng-class="{'active': $index == currentIndexOfIncidentMessage}" ng-click="showIncident( $index )">
                    <div class="va1">
                        <div class="va2">
                            Meldung für Linie:
                            <span ng-repeat="registerText in registerTextArray">
                            {{registerText}}
                        <span ng-if="$index + 1 < registerTextArray.length">, </span>
                        </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="incident-message-content" id="incident-message-content">
                <!-- dieser Inhalt wird im JS eingefügt-->
            </div>
        </div>

    </div>



<!--Entwickler-Konsole: kann mit "$" ein- und ausgeblendet werden-->
<aside class="console" ng-if="showMyConsole">
    <p class="console-label">console</p>
    <div class="content">
        <b>screenBuildDefinitions</b> {{screenBuildDefinitions}}<br><br>
        <b>departureDisplayData</b> {{departureDisplayData}}<br><br>
        <b>IncidentMessages:</b> {{incidentMessages}}<br><br>
        <b>incidentIconIsActive:</b> {{incidentIconIsActive}}<br><br>

    </div>
</aside>


<div ng-controller="monitorRender.getParameter.ctrl"></div>

<script id="getParameterInAngularjs">

    "use strict";
    //Dieser Kontroller dient zum Übertragen von GET-Parameter ins JavaScript
    controllerModule.controller('monitorRender.getParameter.ctrl', function ($rootScope) {

        //Dieses Objekt erhält die PHP-GET-Parameter
        $rootScope.parameterObject = {
            <?php
            $layout = '';
            foreach ($_GET as $key => $val) {

                Print($key . " : '" . $val . "',");
                if( $key == 'layout' ) {
                    $layout = $val;
                }
            };
            ?>
        };

        //Die Funktion löst die Umstrukturierung der Parameter aus
        $rootScope.writeScreenBuildDefinitions();

        $rootScope.startClockAnimation();

        $rootScope.startRequestInterval();
    });

</script>
<?php
    if( $layout != '' && $layout != '1' ) {
?>
    <link rel="stylesheet" href="assets/css/monitor-render-layout-<?php echo $layout; ?>.css">
<?php
    }
?>

</div>
</body>
</html>
