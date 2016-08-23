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

## HubWatcher & HubForwarder

### Config

```
import { HubWatcher, HubForwarder } from 'node-datahub';
import express from 'express';

const expressApp = express();

const config = {
 hubHost: {
   production: 'http://hub.svc.prod',
   staging: 'http://hub.svc.staging',
   test: 'http://hub.svc.dev',
   development: 'http://hub.svc.dev',
 },
 appHost: {
   production: 'http://wma-email-sender.prod.flightstats.io:3000',
   staging: 'http://wma-email-sender.staging.flightstats.io:3000',
   test: 'http://localhost:3001',
   development: 'http://localhost:3000',
 },
 hubParallelCalls: 2,
};
```

### HubWatcher

Use the HubWatcher to receive process new hub channel items.

```
const watcher = new HubWatcher(expressApp, config);

const doSomething = (hubChannelItem, hubItemURI) => {
  console.log('New hub item', hubChannelItem, 'exists at', hubItemURI);
};

// Process each new hub channel item 
watcher.watchChannel('some-channel', doSomething);

```

### HubForwarder

Use the HubForwarder to receive an HTTP post to an Express route
and then post the transformed request to a hub channel.

```
const forwarder = new HubForwarder(expressApp, config);

const xfm = (req) => {
  // See http://expressjs.com/en/api.html#req
  console.log('Transforming request to', req.originalUrl, 'Headers:', req.headers, 'Body:', req.body);
  return req.body;
};

// Forward post requests from a route to a channel running an optional transformer.
forwarder.forwardToChannel('/some/route', 'some-channel', xfm);

```




