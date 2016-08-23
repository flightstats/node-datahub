 /*

 EXAMPLE USAGE:
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

 const forwarder = new HubForwarder(app, conf);
 forwarder.forwardToChannel('/sendgrid/webhook', 'wma_email_receipts', processSendgridWebhook);

 */

 import Datahub from './datahub';

 let localIPAddress = null;
 const SUCCESS_STATUS_CODE = 200;
 const FAILURE_STATUS_CODE = 422;
 const RESPONSE_HEADERS = {'Content-Type': 'text/json'};

 export default class HubForwarder {
  constructor(expressApp, config) {
    if (!expressApp) {
      throw new Error(`HubForwarder: Missing Express app`);
    }

    if (!config) {
      throw new Error('HubForwarder: Missing config');
    }

    if (!config.hubHost || !config.appHost[env()]) {
      throw new Error(`HubForwarder config: Missing "hubHost.${env()}"`);
    }

    if (!config.appHost || !config.appHost[env()]) {
      throw new Error(`HubForwarder config: Missing "appHost.${env()}"`);
    }

    if (typeof(expressApp.post) !== 'function') {
      throw new Error('HubForwarder: Express app must implement .post()');
    }

    this.expressApp = expressApp;
    this.config = config;
    this.watchedChannels = [];
  }

  forwardToChannel(routePath, channelName, fnTransformer) {
    console.log('adding route', routePath);
    this.expressApp.post(routePath, this.postHandler(channelName, fnTransformer));
  }

  postHandler(channelName, fnTransformer) {
    return (req, res) => {
      if (fnTransformer && typeof(fnTransformer) !== 'function') {
        throw new Error(`Route handler for ${channelName} is not a function. It's a ${typeof(fnTransformer)}: ${fnTransformer}`)
      }

      let responseStatusCode = FAILURE_STATUS_CODE;

      try {
        let requestBodyData = null;

        if (typeof(req.body) === 'string') {
          requestBodyData = JSON.parse(req.body);
        }
        else {
          requestBodyData = req.body;
        }

        let transformedData = null;

        if (fnTransformer) {
          transformedData = fnTransformer(requestBodyData) || {stuff:true};
        }
        else {
          transformedData = requestBodyData;  
        }

        if (!transformedData) {
          throw new Error(`Nothing to post to hub channel ${channelName}`);
        }

        const datahub = new Datahub({
          url: this.config.hubHost[env()],
          requestPromiseOptions: {
            resolveWithFullResponse: true
          },
        });

        return datahub.addContent(channelName, transformedData)
        .then((hubRes) => {
          console.log('Successfully forwarded request to hub channel', channelName);
          responseStatusCode = SUCCESS_STATUS_CODE;
        })
        .catch((err) => {
          console.log('Error forwarding request to hub channel', channelName, err.message);
          responseStatusCode = FAILURE_STATUS_CODE;
        })
        .finally(() => {
          res.status(responseStatusCode).end();
        });
      }
      catch(err) {
        console.error('Caught error preparing or posting data to hub channel', channelName, err.message);
        res.status(responseStatusCode).end();
      }
    }
  }
}

function env() {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
}
