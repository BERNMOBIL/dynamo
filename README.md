# dynamo

Dynamic departures web application for public transport

## Installation

### OpenShift

Create a new php application and point to the Git repository.
Make sure that you either set the API_URL and API_KEY
environment variables or set values in http-request-proxy.php 
and monitor/http-request-proxy.php

### Bare metal 

The application requires a web server with support for php.
Any should do, Apache with mod_php is tested.
Just set up a regular site and copy the contents of this directory,
without README.md and LICENSE, into your web root.
Note that a set-up with subpaths is currently not supported.
Make sure that you either set the API_URL and API_KEY
environment variables or set values in http-request-proxy.php 
and monitor/http-request-proxy.php.

## Backend

The website requires a backend providing the needed public transport data.
It basically expects the two following URLs after $urlFirstPart defined
in http-request-proxy.php, providing the following data:

### Autocomplete

Has to be located at autocomplete/queryStationAndAdress

Takes as parameters: 

* Query {string}: the first letters to autocomplete with
* filterBy {string}: type to filter by, default passed is filterBy=STATION

The result should be json in the following format: 

```
{
  "result": [
    {
      "type" (string): type to filter by,
      "id" (string): DIDOK Id, see the BAV published DIDOK list
      "name" (string): name that will be printed,
      "priority" (integer): priority (ignored)
    },
    {
      ...
    }
  ]
}
```

e.g. for a query string of "Flama" the result could look like this:

```
{
  "result": [
    {
      "type": "station",
      "id": "85:4103",
      "name": "Flamatt",
      "priority": 8
    },
    {
      "type": "station",
      "id": "85:4191",
      "name": "Flamatt Dorf",
      "priority": 8
    },
    {
      "type": "street",
      "id": "S:-1541172281",
      "name": "Bernstrasse, Flamatt"
    },
    {
      "type": "address",
      "id": "A:-531700403",
      "name": "Bernstrasse 4, Flamatt"
    }
  ]
}
```

### Departures

Has to be located at departure

Takes as parameters: 

* from (string): DIDOK Id, see autocomplete above
* dateTime (string):  date and time in YYYYMMDDHH24MM  format 
* medium (string): optional comma separated list to filter incidents
* apiKey (string): api key defined in http-request-proxy.php

The result should be json in the following format: 
(Note that quite a lot of these are optional and, for now, ignored. 
Check the current code to see which ones are needed)

```
StationDeparture {
    station (station),
    stops (Array[stoppoint]),
    routes (Array[route]),
    messages (Array[incident], optional)
}
station {
    name (string): printed name of a station,
    priority (integer, optional): priority,
    type (string): One out of station, stoppoint, address, street, poi,
    id (string): ID of the station,
    coords (coords, optional)
}
stoppoint {
    type (string):  One out of station, stoppoint, address, street, poi,
    type (string): One out of station, stoppoint, address, street, poi,
    id (string): ID of the station,
    coords (coords, optional),
    plattform (string, optional): name of the plattform
    station (station, optional)
}
route {
    line (line),
    inactive (boolean, optional):
    direction (Array[direction], optional),
    departures (Array[departure], optional)
}
incident {
    id (string, optional): Id of an incident,
    agency (inline_model, optional): transport agency,
    type (string, optional): Type of incident (PLANNED, UNPLANNED) ,
    publication (inline_model_0, optional): duration of the incident, for publication,
    shortMessage (string, optional): short text of an incident,
    longMessage (string, optional): long text of an incident,
    infoMessage (inline_model_1, optional): info message of an incident,
    title (string, optional): title of an incident
}
coords {
    latitude (int),
    longitude (int),
    type (string): WGS 84 Coordinates
}
line {
    id (string, optional): Id
    name (string, optional): name of a line, e.g. "U3"
    agency (agency, optional),
    vehicle (string, optional) = ['TRAM', 'BUS', 'TROLLEY', 'METRO', 'RAIL', 'CARTRAIN', 'BOAT', 'CABLECAR', 'GONDOLA', 'FUNICULAR', 'WALK', 'TAXI', 'FLINC'],
    lineColor (linecolor, optional)
}
direction {
    key (string, optional): key
    name (string, optional): name
    kid (string, optional): Id of the stop point
}
departure {
    trip (trip, optional),
    stop (stop, optional),
    realtimedeparture (boolean, optional),
    fahrtSpezialText (string, optional),
    polylines (Array[string], optional),
    messages (Array[incident], optional),
    azimut (number, optional),
}
inline_model {
    agencyId (string, optional)
}
inline_model_0 {
    startTime (number, optional): timestamp in ms for publication start,
    endTime (number, optional): timestamp in ms for publication end,
}
agency {
    id (string, optional): Id,
    goNumber (string, optional): goNumber of the agency,
    name (string, optional): name of the agency, e.g. "BERNMOBIL",
    color (linecolor, optional)
}
linecolor {
    background (color, optional),
    foreground (color, optional),
    border (color, optional)
}
trip {
    id (string, optional): Id,
    line (line, optional),
    headsign (string, optional),
    direction (string, optional):
    vehicle (string, optional) = ['TRAM', 'BUS', 'TROLLEY', 'METRO', 'RAIL', 'CARTRAIN', 'BOAT', 'CABLECAR', 'GONDOLA', 'FUNICULAR', 'WALK', 'TAXI', 'FLINC'],
    stops (Array[stop], optional),
    messages (incident, optional)
}
stop {
    stopPoint (stoppoint, optional),
    plan (stopTime, optional),
    prognosis (stopTime, optional),
    headsign (string, optional),
    stopSequence (integer, optional): sequence of stops on the trip, e.g. out of INFO+
}
color {
    r (integer, optional),
    g (integer, optional),
    b (integer, optional)
}
stopTime {
    departure (number, optional),
    arrival (number, optional),
    noExit (boolean, optional),
    noEntry (boolean, optional),
    plattform (string, optional)
} 
```
