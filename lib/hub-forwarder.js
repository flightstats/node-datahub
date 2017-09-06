'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

var _datahub = require('./datahub');

var _datahub2 = _interopRequireDefault(_datahub);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var localIPAddress = null;
var SUCCESS_STATUS_CODE = 200;
var FAILURE_STATUS_CODE = 422;
var RESPONSE_HEADERS = { 'Content-Type': 'text/json' };

var HubForwarder = function () {

  /**
   * HubForwarder
   * @constructor HubForwarder
   * @param {Object} expressApp - an Express instance
   * @param {Object} config - configuration object
   */
  function HubForwarder(expressApp, config) {
    _classCallCheck(this, HubForwarder);

    if (!expressApp) {
      throw new Error('HubForwarder: Missing Express app');
    }

    if (!config) {
      throw new Error('HubForwarder: Missing config');
    }

    if (!(config.hubHost && config.hubHost[env()] || config.hubHost)) {
      throw new Error('HubWatcher config: Missing "hubHost" or "hubHost.' + env() + '"');
    }

    if (typeof expressApp.post !== 'function') {
      throw new Error('HubForwarder: Express app must implement .post()');
    }

    this.expressApp = expressApp;
    this.config = config;
    this.watchedChannels = [];
  }

  _createClass(HubForwarder, [{
    key: 'forwardToChannel',
    value: function forwardToChannel(routePath, channelName, fnTransformer) {
      console.log('[node-datahub HubForwarder] adding route', routePath);
      this.expressApp.post(routePath, this.postHandler(channelName, fnTransformer));
    }
  }, {
    key: 'postHandler',
    value: function postHandler(channelName, fnTransformer) {
      var _this = this;

      return function (req, res) {
        if (fnTransformer && typeof fnTransformer !== 'function') {
          throw new Error('Route handler for ' + channelName + ' is not a function. It\'s a ' + (typeof fnTransformer === 'undefined' ? 'undefined' : _typeof(fnTransformer)) + ': ' + fnTransformer);
        }

        var responseStatusCode = FAILURE_STATUS_CODE;

        try {
          var requestBodyData = null;

          if (typeof req.body === 'string') {
            requestBodyData = JSON.parse(req.body);
          } else {
            requestBodyData = req.body;
          }

          var transformedData = null;

          if (fnTransformer) {
            transformedData = fnTransformer(req);
          } else {
            transformedData = requestBodyData;
          }

          if (!transformedData) {
            throw new Error('Nothing to post to hub channel ' + channelName);
          }

          var datahub = new _datahub2.default({
            url: _this.hubHost,
            requestPromiseOptions: {
              resolveWithFullResponse: true
            }
          });

          return datahub.addContent(channelName, transformedData).then(function (hubRes) {
            console.log('[node-datahub HubForwarder] Successfully forwarded request to hub channel', channelName);
            responseStatusCode = SUCCESS_STATUS_CODE;
          }).catch(function (err) {
            console.log('[node-datahub HubForwarder] Error forwarding request to hub channel', channelName, err.message);
            responseStatusCode = FAILURE_STATUS_CODE;
          }).finally(function () {
            res.status(responseStatusCode).end();
          });
        } catch (err) {
          console.error('[node-datahub HubForwarder] Caught error preparing or posting data to hub channel', channelName, err.message);
          res.status(responseStatusCode).end();
        }
      };
    }
  }, {
    key: 'hubHost',
    get: function get() {
      return this.config.hubHost[env()] || this.config.hubHost;
    }
  }]);

  return HubForwarder;
}();

exports.default = HubForwarder;


function env() {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
}