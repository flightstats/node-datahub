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

const watcher = new HubWatcher(expressApp, config);
watcher.watchChannel('wma_email_outbox', sendEmail);

 */

import Datahub from './datahub';
import os from 'os';

let localIPAddress = null;
const SUCCESS_STATUS_CODE = 200;
const FAILURE_STATUS_CODE = 422;
const RESPONSE_HEADERS = {'Content-Type': 'text/json'};

export default class HubWatcher {
  constructor(expressApp, config) {
    if (!expressApp) {
      throw new Error(`HubWatcher: Missing Express app`);
    }

    if (!config) {
      throw new Error('HubWatcher: Missing config');
    }

    if (!config.hubHost || !config.appHost[env()]) {
      throw new Error(`HubWatcher config: Missing "hubHost.${env()}"`);
    }

    if (!config.appHost || !config.appHost[env()]) {
      throw new Error(`HubWatcher config: Missing "appHost.${env()}"`);
    }

    if (typeof(expressApp.post) !== 'function') {
      throw new Error('HubWatcher: Express app must implement .post()');
    }

    this.expressApp = expressApp;
    this.config = config;
    this.watchedChannels = [];
  }

  watchChannel(channelName, fnHandler) {
    this.expressApp.post(buildCallbackRoute(channelName), this.postHandler(channelName, fnHandler));

    if (this.watchedChannels.indexOf(channelName) === -1) {
      return this.initWebhook(channelName)
      .then(() => {
        this.watchedChannels.push(channelName);
      });
    }
    else {
      console.log('[node-datahub HubWatcher] webhook already initialized for', channelName);
    }

    return Promise.resolve();
  }

  postHandler(channelName, fnHandler) {
    return (req, res) => {
      if (typeof(fnHandler) !== 'function') {
        throw new Error(`Callback handler for ${channelName} is not a function. It's a ${typeof(fnHandler)}: ${fnHandler}`)
      }

      let responseStatusCode = FAILURE_STATUS_CODE;
      let requestBodyData = null;

      try {
        if (typeof(req.body) === 'string') {
          requestBodyData = JSON.parse(req.body);
        }
        else {
          requestBodyData = req.body;
        }

        const datahub = new Datahub({
          url: this.config.hubHost[env()],
          requestPromiseOptions: {
            resolveWithFullResponse: true
          },
        });

        return datahub.getGroupCallbackContent(requestBodyData)
        .then((hubDataItemResponse) => {
          if (requestBodyData.uris && requestBodyData.uris.length > 1) {
            throw new Error(`HubWatcher: Expected hub callback "uris" attribute to be length 1 but was ${JSON.stringify(requestBodyData.uris)}`);
          }

          const hubDataItemURI = (requestBodyData.uris ? requestBodyData.uris[0] : null);

          return fnHandler(hubDataItemResponse.body, hubDataItemURI)
          .then((result) => {
            responseStatusCode = SUCCESS_STATUS_CODE;
          })
          .catch((err) => {
            throw new Error(`Error running ${channelName} callback handler: ${err}`);
          })
        })
        .catch((err) => {
          console.error('[node-datahub HubWatcher] Error getting', channelName, 'callback content:', err.message);
        })
        .then(() => {
          res.status(responseStatusCode).end();
        });
      }
      catch(err) {
        console.error('[node-datahub HubWatcher] Caught error getting', channelName, 'callback content:', err);
        res.status(responseStatusCode).end();
      }
    }
  }

  initWebhook(channelName) {
    const callbackConfig = {
      name: buildCallbackName(channelName),
      channelName: channelName,
      callbackUrl: buildCallbackUrl(channelName, this.config.appHost[env()]),
      parallelCalls: this.config.hubParallelCalls,
    };

    const hubHost = this.config.hubHost[env()];

    const datahub = new Datahub({
      url: hubHost,
      requestPromiseOptions: { resolveWithFullResponse: true },
    });

    const callbackName = buildCallbackName(channelName);

    return datahub.getGroupCallback(callbackName)
    .then((result) => {
      // if dev env, and if host is different, recreate group for current host
      const localCallbackUrl = callbackConfig.callbackUrl;

      if (result && result.body && result.body.callbackUrl !== localCallbackUrl) {
        console.log('[node-datahub HubWatcher] Updating group callback URL from', result.body.callbackUrl, 'to', callbackConfig.callbackUrl);

        return datahub.deleteGroupCallback(callbackName)
        .then((result) => {
          console.log('[node-datahub HubWatcher] Deleted hub callback:', callbackName);
          return createHubCallback(datahub, callbackConfig);
        })
        .catch((error) => {
          console.error('[node-datahub HubWatcher] Error deleting hub callback:', error.stack);
          done(error);
        }
        );
      }
      else {
        // Existing callback configured properly
        return null;
      }
    })
    .catch((error) => {
      if (error.statusCode == 404) {
        console.log('[node-datahub HubWatcher] Creating nonexistent callback', callbackConfig);
        return createHubCallback(datahub, callbackConfig);
      }

      console.error('[node-datahub HubWatcher] Error retrieving group callback:', error);
      return null;
    });
  }

} // end of class

function createHubCallback(datahub, callbackConfig) {
  return datahub.createGroupCallback(callbackConfig)
  .then((result) => {
    console.log('[node-datahub HubWatcher] Created hub callback for', callbackConfig.name);
  })
  .catch((error) => {
    console.error('[node-datahub HubWatcher] Failed to create callback:', error);
  });
}

function getLocalIPAddress() {
  if (localIPAddress) {
    return localIPAddress;
  }

  if (process.env.IP) {
    localIPAddress = process.env.IP;
    console.log('[node-datahub HubWatcher] using IP environment variable for hub webhook:', localIPAddress);
  }
  else {
    const ifaces = os.networkInterfaces();
    let firstIPAddress = null;

    for (let ifname in ifaces) {
      let ifaceAddresses = ifaces[ifname];

      for (let j in ifaceAddresses) {
        const iface = ifaceAddresses[j];

        if (iface.family === 'IPv4' && !iface.internal) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          
          localIPAddress = iface.address;

          if (env() === 'development') {
            if (iface.address.search(/10\.*/) === 0) {
              localIPAddress = iface.address;
            }
          }
          else {
            // Use the first IP
            localIPAddress = localIPAddress || iface.address;
          }
        }
      }
    }

    console.log('[node-datahub HubWatcher] detected IP:', localIPAddress);
  }


  if (!localIPAddress) {
    throw new Error('Unable to get local IP address. Set the IP environment variable to your 10.x.x.x address.');
  }

  return localIPAddress;
}

function buildCallbackName(channelName) {
  return [channelName, env()].join('_');
}

function buildCallbackRoute(channelName) {
  return `/hub-callbacks/${channelName}`;
}

function buildCallbackUrl(channelName, appHost) {
  const callbackUrl = appHost + buildCallbackRoute(channelName);
  return callbackUrl.replace(/localhost/, getLocalIPAddress());
}

function env() {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
}
