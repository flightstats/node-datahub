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

## watcher

Use the HubWatcher

```
// EXAMPLE USAGE:
import { HubWatcher } from 'node-datahub';

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

const watcher = new HubWatcher(expressApp, config);
watcher.watchChannel('wma_email_outbox', sendEmail);
```

## forwarder

Use the HubForwarder to receive an HTTP post to an Express route
and then post the transformed input to a hub channel.

```
// See config for HubWatcher.
const forwarder = new HubForwarder(app, config);
forwarder.addHandler('/sendgrid/webhook', processSendgridWebhook, 'wma_email_receipts');

```




