 /*

 EXAMPLE USAGE:
 // Choose one of two config types
 const simpleConfig = {
   hubHost: 'http://hub.iad.dev.flightstats.io',
 };

 const environmentConfig = {
   hubHost: {
     production: 'http://hub.iad.prod.flightstats.io',
     staging: 'http://hub.iad.staging.flightstats.io',
     test: 'http://hub.iad.dev.flightstats.io',
     development: 'http://hub.iad.dev.flightstats.io',
   },
 };

 const forwarder = new HubForwarder(app, simpleConfig);
 forwarder.forwardToChannel('/sendgrid/webhook', 'wma_email_receipts', processSendgridWebhook);

 */

 import Datahub from './datahub';

 let localIPAddress = null;
 const SUCCESS_STATUS_CODE = 200;
 const FAILURE_STATUS_CODE = 422;
 const RESPONSE_HEADERS = {'Content-Type': 'text/json'};

 export default class HubForwarder {

  /**
   * HubForwarder
   * @constructor HubForwarder
   * @param {Object} expressApp - an Express instance
   * @param {Object} config - configuration object
   */
  constructor(expressApp, config) {
    if (!expressApp) {
      throw new Error(`HubForwarder: Missing Express app`);
    }

    if (!config) {
      throw new Error('HubForwarder: Missing config');
    }

    if (!((config.hubHost && config.hubHost[env()]) || config.hubHost)) {
      throw new Error(`HubWatcher config: Missing "hubHost" or "hubHost.${env()}"`);
    }

    if (typeof(expressApp.post) !== 'function') {
      throw new Error('HubForwarder: Express app must implement .post()');
    }

    this.expressApp = expressApp;
    this.config = config;
    this.watchedChannels = [];
  }

  get hubHost() {
    return this.config.hubHost[env()] || this.config.hubHost;
  }

  forwardToChannel(routePath, channelName, fnTransformer) {
    console.log('[node-datahub HubForwarder] adding route', routePath);
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
          transformedData = fnTransformer(req);
        }
        else {
          transformedData = requestBodyData;
        }

        if (!transformedData) {
          throw new Error(`Nothing to post to hub channel ${channelName}`);
        }

        const datahub = new Datahub({
          url: this.hubHost,
          requestPromiseOptions: {
            resolveWithFullResponse: true
          },
        });

        return datahub.addContent(channelName, transformedData)
        .then((hubRes) => {
          console.log('[node-datahub HubForwarder] Successfully forwarded request to hub channel', channelName);
          responseStatusCode = SUCCESS_STATUS_CODE;
        })
        .catch((err) => {
          console.log('[node-datahub HubForwarder] Error forwarding request to hub channel', channelName, err.message);
          responseStatusCode = FAILURE_STATUS_CODE;
        })
        .finally(() => {
          res.status(responseStatusCode).end();
        });
      }
      catch (err) {
        console.error('[node-datahub HubForwarder] Caught error preparing or posting data to hub channel', channelName, err.message);
        res.status(responseStatusCode).end();
      }
    }
  }
}

function env() {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
}
