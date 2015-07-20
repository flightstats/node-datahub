# node-datahub

FlightStats data hub request-promise client.

## installation

```shell
npm install node-datahub --save
```

## usage

Create a Datahub instance and pass in an object with your data hub url.

For more information about the FlightStats data hub : https://github.com/flightstats/hub

```
var Datahub = require('node-datahub');

var datahub = new Datahub({
    url: <YOUR_DATAHUB_URL>
});

datahub.getChannels()
    .then(function (result) {
        // ...
    });
```

## tests

Run the tests
```shell
grunt test
```
