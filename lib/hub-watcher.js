'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
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

var _datahub = require('./datahub');

var _datahub2 = _interopRequireDefault(_datahub);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var localIPAddress = null;
var SUCCESS_STATUS_CODE = 200;
var FAILURE_STATUS_CODE = 422;
var RESPONSE_HEADERS = { 'Content-Type': 'text/json' };

var HubWatcher = function () {
  function HubWatcher(expressApp, config) {
    _classCallCheck(this, HubWatcher);

    if (!expressApp) {
      throw new Error('HubWatcher: Missing Express app');
    }

    if (!config) {
      throw new Error('HubWatcher: Missing config');
    }

    if (!config.hubHost || !config.appHost[env()]) {
      throw new Error('HubWatcher config: Missing "hubHost.' + env() + '"');
    }

    if (!config.appHost || !config.appHost[env()]) {
      throw new Error('HubWatcher config: Missing "appHost.' + env() + '"');
    }

    if (typeof expressApp.post !== 'function') {
      throw new Error('HubWatcher: Express app must implement .post()');
    }

    this.expressApp = expressApp;
    this.config = config;
    this.watchedChannels = [];
  }

  _createClass(HubWatcher, [{
    key: 'watchChannel',
    value: function watchChannel(channelName, fnHandler) {
      var _this = this;

      this.expressApp.post(buildCallbackRoute(channelName), this.postHandler(channelName, fnHandler));

      if (this.watchedChannels.indexOf(channelName) === -1) {
        return this.initWebhook(channelName).then(function () {
          _this.watchedChannels.push(channelName);
        });
      } else {
        console.log('[node-datahub HubWatcher] webhook already initialized for', channelName);
      }

      return Promise.resolve();
    }
  }, {
    key: 'postHandler',
    value: function postHandler(channelName, fnHandler) {
      var _this2 = this;

      return function (req, res) {
        if (typeof fnHandler !== 'function') {
          throw new Error('Callback handler for ' + channelName + ' is not a function. It\'s a ' + (typeof fnHandler === 'undefined' ? 'undefined' : _typeof(fnHandler)) + ': ' + fnHandler);
        }

        var responseStatusCode = FAILURE_STATUS_CODE;
        var requestBodyData = null;

        try {
          if (typeof req.body === 'string') {
            requestBodyData = JSON.parse(req.body);
          } else {
            requestBodyData = req.body;
          }

          var datahub = new _datahub2.default({
            url: _this2.config.hubHost[env()],
            requestPromiseOptions: {
              resolveWithFullResponse: true
            }
          });

          return datahub.getGroupCallbackContent(requestBodyData).then(function (hubDataItemResponse) {
            if (requestBodyData.uris && requestBodyData.uris.length > 1) {
              throw new Error('HubWatcher: Expected hub callback "uris" attribute to be length 1 but was ' + JSON.stringify(requestBodyData.uris));
            }

            var hubDataItemURI = requestBodyData.uris ? requestBodyData.uris[0] : null;

            return fnHandler(hubDataItemResponse.body, hubDataItemURI).then(function (result) {
              responseStatusCode = SUCCESS_STATUS_CODE;
            }).catch(function (err) {
              throw new Error('Error running ' + channelName + ' callback handler: ' + err);
            });
          }).catch(function (err) {
            console.error('[node-datahub HubWatcher] Error getting', channelName, 'callback content:', err);
          }).then(function () {
            res.status(responseStatusCode).end();
          });
        } catch (err) {
          console.error('[node-datahub HubWatcher] Caught error getting', channelName, 'callback content:', err);
          res.status(responseStatusCode).end();
        }
      };
    }
  }, {
    key: 'initWebhook',
    value: function initWebhook(channelName) {
      var callbackName = buildCallbackName(channelName);

      var callbackConfig = {
        name: callbackName,
        channelName: channelName,
        callbackUrl: buildCallbackUrl(channelName, this.config.appHost[env()]),
        parallelCalls: this.config.hubParallelCalls
      };

      var hubHost = this.config.hubHost[env()];

      var datahub = new _datahub2.default({
        url: hubHost,
        requestPromiseOptions: { resolveWithFullResponse: true }
      });

      return datahub.getGroupCallback(callbackName).then(function (result) {
        // if dev env, and if host is different, recreate group for current host
        var localCallbackUrl = callbackConfig.callbackUrl;

        if (result && result.body && result.body.callbackUrl !== localCallbackUrl) {
          console.log('[node-datahub HubWatcher] Updating group callback URL from', result.body.callbackUrl, 'to', callbackConfig.callbackUrl);

          return datahub.deleteGroupCallback(callbackName).then(function (result) {
            console.log('[node-datahub HubWatcher] Deleted hub callback:', callbackName);
            return createHubCallback(datahub, callbackConfig);
          }).catch(function (error) {
            console.error('[node-datahub HubWatcher] Error deleting hub callback:', error.stack);
            done(error);
          });
        } else {
          // Existing callback configured properly
          return null;
        }
      }).catch(function (error) {
        if (error.statusCode == 404) {
          console.log('[node-datahub HubWatcher] Creating nonexistent callback', callbackConfig);
          return createHubCallback(datahub, callbackConfig);
        }

        console.error('[node-datahub HubWatcher] Error retrieving group callback:', error);
        return null;
      });
    }
  }]);

  return HubWatcher;
}(); // end of class

exports.default = HubWatcher;
function createHubCallback(datahub, callbackConfig) {
  return datahub.createGroupCallback(callbackConfig).then(function (result) {
    console.log('[node-datahub HubWatcher] Created hub callback for', callbackConfig.name);
  }).catch(function (error) {
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
  } else {
    var ifaces = _os2.default.networkInterfaces();
    var firstIPAddress = null;

    for (var ifname in ifaces) {
      var ifaceAddresses = ifaces[ifname];

      for (var j in ifaceAddresses) {
        var iface = ifaceAddresses[j];

        if (iface.family === 'IPv4' && !iface.internal) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses

          localIPAddress = iface.address;

          if (env() === 'development') {
            if (iface.address.search(/10\.*/) === 0) {
              localIPAddress = iface.address;
            }
          } else {
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
  var suffix = env();

  if (['development', 'test'].indexOf(env()) !== -1) {
    suffix = (process.env.USER || getLocalIPAddress().replace(/\./g, '_')) + '_' + suffix;
  }

  return [channelName, suffix].join('_');
}

function buildCallbackRoute(channelName) {
  return '/hub-callbacks/' + channelName;
}

function buildCallbackUrl(channelName, appHost) {
  var callbackUrl = appHost + buildCallbackRoute(channelName);
  return callbackUrl.replace(/localhost/, getLocalIPAddress());
}

function env() {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
}