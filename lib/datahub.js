'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _crypto = require('crypto2');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = console;

/**
 * Datahub
 * @constructor Datahub
 * @param {Object} config - configuration object
 * @param {string} config.url - datahub url
 * @param {Object} [config.requestPromiseOptions] - options passed to request-promise
 * @param {boolean} [config.queueEnabled=true] - enable/disable the sending of channel data via a queue
 * @param {number} [config.queueTimerInterval=10000] - the timer interval (in milliseconds) that is used for sending queued channel data
 * @param {number} [config.queueMaxPending=1000] - the maximum number of items held in the channel data queue before being sent
 * @param {function} [config.queueFinishedCallback=null] - a callback function to be called after the queue has finished sending
 *
 * @see {@link https://github.com/flightstats/hub|Hub}
 * @example
 *    new Datahub({
 *      url: '...',
 *    });
 *
 */

var Datahub = function () {
  function Datahub(config) {
    _classCallCheck(this, Datahub);

    this.config = (0, _objectAssign2.default)({
      url: null,
      logger: logger,
      queueEnabled: true,
      queueTimerInterval: 10000,
      queueMaxPending: 1000,
      queueFinishedCallback: null,
      encryptionPassword: null
    }, config);

    if (!this.config.url) {
      throw new Error('Missing datahub URL');
    }

    if (this.config.queueFinishedCallback && typeof this.config.queueFinishedCallback !== 'function') {
      throw new Error('Queue finished callback should be a function');
    }

    this.config.url = (0, _util.sanitizeURL)(this.config.url);

    this.queueShouldFinish = false;
    this.queue = { curCount: 0, data: {} }; // { curCount: X, data: { channelName1: content, channelName2: content, ... } }
    this.queueTimerId = null;
    this.queueTimerCallback = this.sendQueue.bind(this);

    Object.defineProperty(this, 'queueEnabled', {
      get: function get() {
        return this.config.queueEnabled;
      },
      set: function set(val) {
        this.config.queueEnabled = val;
      }
    });
  }

  _createClass(Datahub, [{
    key: 'startQueue',
    value: function startQueue() {
      if (!this.queueTimerId) {
        this.queueTimerId = setInterval(this.queueTimerCallback, this.config.queueTimerInterval);
      }
    }
  }, {
    key: 'stopQueue',
    value: function stopQueue() {
      if (this.queueTimerId) {
        clearInterval(this.queueTimerId);
        this.queueTimerId = null;
      }
    }
  }, {
    key: 'finishQueue',
    value: function finishQueue() {
      if (this.queueTimerId) {
        this.queueShouldFinish = true;
      }
    }
  }, {
    key: 'sendQueue',
    value: function sendQueue() {
      if (this.config.queueEnabled && this.queue.curCount > 0) {
        var that = this;
        var queueItemsToParse = this.queue.data;
        this.queue = { curCount: 0, data: {} };

        var queueItems = [];
        Object.keys(queueItemsToParse).forEach(function (key) {
          queueItems.push({ channelName: key, content: queueItemsToParse[key] });
        });

        _bluebird2.default.map(queueItems, function (queueItem) {
          return that.addContent(queueItem.channelName, queueItem.content).then(function (resp) {
            that.config.logger.log('[node-datahub] Successfully added ' + queueItem.content.length + ' queued items to \'' + queueItem.channelName + '\'');
            return _bluebird2.default.resolve(resp);
          }, function (err) {
            that.config.logger.error('[node-datahub] Error adding queued items to \'' + queueItem.channelName + '\'', err.message ? err.message : err);
            return _bluebird2.default.resolve(); // don't reject whole queue if one queue item fails...
          });
        }, { concurrency: 10 }).then(function (hubResponse) {
          if (that.queueShouldFinish) {
            that.stopQueue();
            that.queueShouldFinish = false;
          }

          if (that.config.queueFinishedCallback) {
            that.config.queueFinishedCallback(hubResponse, queueItems);
          }
        });
      }
    }
  }, {
    key: '_crud',
    value: function _crud(url, method, data) {
      var _this = this;

      var flags = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var options = {
        method: method
      };

      if (this.config.requestPromiseOptions) {
        options = (0, _objectAssign2.default)(options, this.config.requestPromiseOptions);
      }

      if (this.config.encryptionPassword && (method === 'POST' || method === 'PUT')) {
        options.body = data;
      } else {
        if (method === 'GET') {
          options.json = options.json == null ? true : options.json;

          if (this.config.encryptionPassword && flags.isItem) {
            options.json = false;
            return (0, _requestPromise2.default)(url, options).then(function (res) {
              try {
                var parsedJSON = JSON.parse(res);
                console.warn('Got unencrypted payload');
                return parsedJSON;
              } catch (e) {
                console.log('Decrypting...');
                return (0, _crypto.decrypt)(res, _this.config.encryptionPassword);
              }
            });
          }
        } else if (method === 'POST' || method === 'PUT') {
          options.json = data;
        }
      }

      return (0, _requestPromise2.default)(url, options);
    }

    /**
     * Create a new channel.
     * @see {@link https://github.com/flightstats/hub#create-a-channel|Create a Channel}
     * @param {Object} config - configuration details for new channel
     * @param {string} config.name - name of new channel
     * @param {string} config.owner - owner of new channel
     * @param {number} [config.ttlDays=120] - number of days used to limit the items in a channel by time
     * @param {string} [config.description] - channel description
     * @param {array} [config.tags] - string tags
     * @param {string} [config.replicationSource] - fully qualified path to channel in a another hub
     * @param {string} [config.storage='SINGLE'] - specification of how to store long term data ('SINGLE' or 'BATCH')
     */

  }, {
    key: 'createChannel',
    value: function createChannel(config) {
      if (!config) {
        return _bluebird2.default.reject(new Error('Missing channel configuration'));
      }

      if (!config.name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (!config.owner) {
        return _bluebird2.default.reject(new Error('Missing channel owner'));
      }

      var data = { name: config.name, owner: config.owner };
      if (Number.isFinite(config.ttlDays)) {
        data.ttlDays = config.ttlDays;
      } else if ((0, _util.isString)(config.ttlDays)) {
        var ttlDays = parseInt(config.ttlDays, 10);
        if (ttlDays) {
          data.ttlDays = ttlDays;
        }
      }
      if (config.description) {
        data.description = config.description;
      }
      if (config.tags) {
        data.tags = config.tags;
      }
      if (config.replicationSource) {
        data.replicationSource = config.replicationSource;
      }
      if (config.storage && (config.storage.toUpperCase() === 'SINGLE' || config.storage.toUpperCase() === 'BATCH')) {
        data.storage = config.storage.toUpperCase();
      }

      return this._crud(this.config.url + '/channel', 'POST', data);
    }

    /**
     * Update a channel.
     * @see {@link https://github.com/flightstats/hub#update-a-channel|Update a Channel}
     * @param {string} name - channel name
     * @param {Object} config - updated configuration details for channel
     * @param {string} [config.owner] - owner of channel
     * @param {number} [config.ttlDays=120] - number of days used to limit the items in a channel by time
     * @param {string} [config.description] - channel description
     * @param {array} [config.tags] - string tags
     * @param {string} [config.replicationSource] - fully qualified path to channel in a another hub
     */

  }, {
    key: 'updateChannel',
    value: function updateChannel(name, config) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (!config) {
        return _bluebird2.default.reject(new Error('Missing channel configuration'));
      }

      var data = {};
      if (config.owner) {
        data.owner = config.owner;
      }
      if (Number.isFinite(config.ttlDays)) {
        data.ttlDays = config.ttlDays;
      } else if ((0, _util.isString)(config.ttlDays)) {
        var ttlDays = parseInt(config.ttlDays, 10);
        if (ttlDays) {
          data.ttlDays = ttlDays;
        }
      }
      if (config.description) {
        data.description = config.description;
      }
      if (config.tags) {
        data.tags = config.tags;
      }
      if (config.replicationSource) {
        data.replicationSource = config.replicationSource;
      }

      return this._crud(this.config.url + '/channel/' + name, 'PUT', data);
    }

    /**
     * Get a list of channels.
     * @see {@link https://github.com/flightstats/hub#list-channels|List Channels}
     */

  }, {
    key: 'getChannels',
    value: function getChannels() {
      return this._crud(this.config.url + '/channel', 'GET');
    }

    /**
     * Get a specific channel.
     * @see {@link https://github.com/flightstats/hub#fetch-channel-metadata|Fetch Channel Metadata}
     * @param {string} name - channel name
     */

  }, {
    key: 'getChannel',
    value: function getChannel(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      return this._crud(this.config.url + '/channel/' + name, 'GET');
    }

    /**
     * Delete a specific channel.
     * @param {string} name - channel name
     * @see {@link https://github.com/flightstats/hub#delete-a-channel|Delete a Channel}
     */

  }, {
    key: 'deleteChannel',
    value: function deleteChannel(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      return this._crud(this.config.url + '/channel/' + name, 'DELETE');
    }

    /**
     * Get channel status.
     * @see {@link https://github.com/flightstats/hub#channel-status|Get Channel Status}
     * @param {string} name - channel name
     */

  }, {
    key: 'getChannelStatus',
    value: function getChannelStatus(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      return this._crud(this.config.url + '/channel/' + name + '/status', 'GET');
    }

    /**
     * Add content to a channel.
     * @see {@link https://github.com/flightstats/hub#insert-content-into-channel|Insert content into a Channel}
     * @param {string} name - channel name
     * @param {string} content - text content to add to channel
     */

  }, {
    key: 'addContent',
    value: function addContent(name, content) {
      var _this2 = this;

      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (!content) {
        return _bluebird2.default.reject(new Error('Missing content'));
      }

      if (this.config.encryptionPassword) {
        if (typeof content !== 'string') {
          throw new Error('Content must be stringified when encrypting');
        }
        console.log('Encrypting...');
        return (0, _crypto.encrypt)(content, this.config.encryptionPassword).then(function (encrypted) {
          return _this2._crud(_this2.config.url + '/channel/' + name, 'POST', encrypted);
        });
      }

      return this._crud(this.config.url + '/channel/' + name, 'POST', content);
    }

    /**
     * Get channel content.
     * @see {@link https://github.com/flightstats/hub#fetch-content-from-channel|Fetch content from a Channel}
     * @param {string} name - channel name
     * @param {string} id - content id
     */

  }, {
    key: 'getContent',
    value: function getContent(name, id) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (!id) {
        return _bluebird2.default.reject(new Error('Missing content id'));
      }

      var url = this.config.url + '/channel/' + name + '/' + id;

      return this._crud(url, 'GET', null, { isItem: true });
    }

    /**
     * Get latest channel content.
     * @see {@link https://github.com/flightstats/hub#fetch-latest-channel-item|Latest Channel Item}
     * @param {string} name - channel name
     * @param {number} [N] - retrieve the latest N items
     */

  }, {
    key: 'getLatest',
    value: function getLatest(name, N) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (N && !Number.isFinite(N)) {
        return _bluebird2.default.reject(new Error('Invalid number parameter'));
      }

      return this._crud(this.config.url + '/channel/' + name + '/latest' + (N ? '/' + N : ''), 'GET', null, { isItem: true });
    }

    /**
     * Get earliest channel content.
     * @see {@link https://github.com/flightstats/hub#fetch-earliest-channel-item|Earliest Channel Item}
     * @param {string} name - channel name
     * @param {number} [N] - retrieve the earliest N items
     */

  }, {
    key: 'getEarliest',
    value: function getEarliest(name, N) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (N && !Number.isFinite(N)) {
        return _bluebird2.default.reject(new Error('Invalid number parameter'));
      }

      return this._crud(this.config.url + '/channel/' + name + '/earliest' + (N ? '/' + N : ''), 'GET', null, { isItem: true });
    }

    /**
     * Get channel time.
     * @see {@link https://github.com/flightstats/hub#time-interface|Channel Time}
     * @param {string} name - channel name
     */

  }, {
    key: 'getTime',
    value: function getTime(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      return this._crud(this.config.url + '/channel/' + name + '/time', 'GET');
    }

    /**
     * Create a group callback.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     * @param {Object} config - configuration details for new group callback
     * @param {string} config.name - group callback name
     * @param {string} config.channelName - the channel name to monitor for new items
     * @param {string} config.callbackUrl - the fully qualified location to receive callbacks from the server
     * @param {number} [config.parallelCalls=1] - number of callbacks to make in parallel
     * @param {string} [config.startItem] - fully qualified item location where the callback should start from
     * @param {boolean} [config.paused=false] - When true, this will pause a group callback
     * @param {string} [config.batch='SINGLE'] - 'SINGLE' will return each item by itself, 'MINUTE' will return each minute's worth of data in the channel
     * @param {boolean} [config.heartbeat=false] - false for SINGLE, or true for MINUTE batches that will always have a heartbeat, a callback which identifies the end of a minute period
     * @param {number} [config.maxWaitMinutes=1] - the maximum amount of time between retry attempts to the callbackUrl
     * @param {number} [config.ttlMinutes=0] - if greater than 0, the hub will not attempt to send an item which is older than the ttl
     */

  }, {
    key: 'createGroupCallback',
    value: function createGroupCallback(config) {
      if (!config) {
        return _bluebird2.default.reject(new Error('Missing group configuration'));
      }

      if (!config.name) {
        return _bluebird2.default.reject(new Error('Missing group name'));
      }

      if (!config.channelName) {
        return _bluebird2.default.reject(new Error('Missing channel name'));
      }

      if (!config.callbackUrl) {
        return _bluebird2.default.reject(new Error('Missing callback URL'));
      }

      var data = {
        channelUrl: this.config.url + '/channel/' + config.channelName,
        callbackUrl: config.callbackUrl
      };

      if (Number.isFinite(config.parallelCalls)) {
        data.parallelCalls = config.parallelCalls;
      } else if ((0, _util.isString)(config.parallelCalls)) {
        var parallelCalls = parseInt(config.parallelCalls, 10);
        if (parallelCalls) {
          data.parallelCalls = parallelCalls;
        }
      }

      if (config.startItem) {
        data.startItem = config.startItem;
      }
      if (config.paused) {
        data.paused = true;
      }
      if (config.batch && (config.batch.toUpperCase() === 'SINGLE' || config.batch.toUpperCase() === 'MINUTE')) {
        data.batch = config.batch.toUpperCase();
      }
      if (config.heartbeat) {
        data.heartbeat = true;
      }

      if (Number.isFinite(config.maxWaitMinutes)) {
        data.maxWaitMinutes = config.maxWaitMinutes;
      } else if ((0, _util.isString)(config.maxWaitMinutes)) {
        var maxWaitMinutes = parseInt(config.maxWaitMinutes, 10);
        if (maxWaitMinutes) {
          data.maxWaitMinutes = maxWaitMinutes;
        }
      }

      if (Number.isFinite(config.ttlMinutes)) {
        data.ttlMinutes = config.ttlMinutes;
      } else if ((0, _util.isString)(config.ttlMinutes)) {
        var ttlMinutes = parseInt(config.ttlMinutes, 10);
        if (ttlMinutes) {
          data.ttlMinutes = ttlMinutes;
        }
      }

      return this._crud(this.config.url + '/webhook/' + config.name, 'PUT', data);
    }

    /**
     * Update a group callback.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     * @param {string} name - group name
     * @param {Object} config - updated configuration details for group
     * @param {string} config.callbackUrl - the fully qualified location to receive callbacks from the server
     * @param {number} [config.parallelCalls=1] - number of callbacks to make in parallel
     * @param {boolean} [config.paused=false] - When true, this will pause a group callback
     * @param {boolean} [config.heartbeat=false] - false for SINGLE, or true for MINUTE batches that will always have a heartbeat, a callback which identifies the end of a minute period
     * @param {number} [config.maxWaitMinutes=1] - the maximum amount of time between retry attempts to the callbackUrl
     * @param {number} [config.ttlMinutes=0] - if greater than 0, the hub will not attempt to send an item which is older than the ttl
     */

  }, {
    key: 'updateGroupCallback',
    value: function updateGroupCallback(name, config) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing group name'));
      }

      if (!config) {
        return _bluebird2.default.reject(new Error('Missing group configuration'));
      }

      var data = {};

      if (config.callbackUrl) {
        data.callbackUrl = config.callbackUrl;
      }

      if (Number.isFinite(config.parallelCalls)) {
        data.parallelCalls = config.parallelCalls;
      } else if ((0, _util.isString)(config.parallelCalls)) {
        var parallelCalls = parseInt(config.parallelCalls, 10);
        if (parallelCalls) {
          data.parallelCalls = parallelCalls;
        }
      }

      if (typeof config.paused !== 'undefined') {
        data.paused = config.paused;
      }
      if (typeof config.heartbeat !== 'undefined') {
        data.heartbeat = config.heartbeat;
      }

      if (Number.isFinite(config.maxWaitMinutes)) {
        data.maxWaitMinutes = config.maxWaitMinutes;
      } else if ((0, _util.isString)(config.maxWaitMinutes)) {
        var maxWaitMinutes = parseInt(config.maxWaitMinutes, 10);
        if (maxWaitMinutes) {
          data.maxWaitMinutes = maxWaitMinutes;
        }
      }

      if (Number.isFinite(config.ttlMinutes)) {
        data.ttlMinutes = config.ttlMinutes;
      } else if ((0, _util.isString)(config.ttlMinutes)) {
        var ttlMinutes = parseInt(config.ttlMinutes, 10);
        if (ttlMinutes) {
          data.ttlMinutes = ttlMinutes;
        }
      }

      return this._crud(this.config.url + '/webhook/' + name, 'PUT', data);
    }

    /**
     * Get a list of existing group callbacks.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     */

  }, {
    key: 'getGroupCallbacks',
    value: function getGroupCallbacks() {
      return this._crud(this.config.url + '/webhook', 'GET');
    }

    /**
     * Get the configuration and status of an existing group callback.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     * @param {string} name - group callback name
     */

  }, {
    key: 'getGroupCallback',
    value: function getGroupCallback(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing group name'));
      }
      return this._crud(this.config.url + '/webhook/' + name, 'GET');
    }

    /**
     * Delete an existing group callback.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     * @param {string} name - group callback name
     */

  }, {
    key: 'deleteGroupCallback',
    value: function deleteGroupCallback(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing group name'));
      }

      return this._crud(this.config.url + '/webhook/' + name, 'DELETE');
    }

    /**
     * Get content for first uri included in a callback.
     * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
     * @param {string} data - group callback response data
     */

  }, {
    key: 'getGroupCallbackContent',
    value: function getGroupCallbackContent(data) {
      if (!data || !data.uris || !data.uris[0]) {
        return _bluebird2.default.reject(new Error('Missing data'));
      } else {
        var url = data.uris[0];
        return this._crud(url, 'GET', null, { isItem: true });
      }
    }

    /**
     * Create/update a channel alert.
     * @see {@link https://github.com/flightstats/hub#alerts|Alerts}
     * @param {string} name - alert name
     * @param {Object} config - configuration details for channel alert
     * @param {string} config.source - name of the channel to monitor
     * @param {string} config.serviceName - user defined end point for the alert
     * @param {number} config.timeWindowMinutes - period of time to evaluate
     * @param {string} config.operator - can be '>=', '>', '==', '<', or '<='
     * @param {number} config.threshold - value to compare
     */

  }, {
    key: 'channelAlert',
    value: function channelAlert(name, config) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing alert name'));
      }

      if (!config) {
        return _bluebird2.default.reject(new Error('Missing alert configuration'));
      }

      if (!config.source) {
        return _bluebird2.default.reject(new Error('Missing alert source'));
      }

      if (!config.serviceName) {
        return _bluebird2.default.reject(new Error('Missing alert service name'));
      }

      if (!config.timeWindowMinutes) {
        return _bluebird2.default.reject(new Error('Missing alert time window'));
      }

      if (!config.operator) {
        return _bluebird2.default.reject(new Error('Missing alert operator'));
      }

      if (!config.threshold) {
        return _bluebird2.default.reject(new Error('Missing alert threshold'));
      }

      var data = {
        source: config.source,
        serviceName: config.serviceName,
        type: 'channel'
      };

      if (Number.isFinite(config.timeWindowMinutes)) {
        data.timeWindowMinutes = config.timeWindowMinutes;
      } else if ((0, _util.isString)(config.timeWindowMinutes)) {
        var timeWindowMinutes = parseInt(config.timeWindowMinutes, 10);
        if (timeWindowMinutes) {
          data.timeWindowMinutes = timeWindowMinutes;
        }
      }
      if (!data.timeWindowMinutes) {
        return _bluebird2.default.reject(new Error('Invalid alert time window'));
      }

      if ((0, _util.isString)(config.operator) && ['>=', '>', '==', '<', '<='].indexOf(config.operator) !== -1) {
        data.operator = config.operator;
      } else {
        return _bluebird2.default.reject(new Error('Invalid alert operator'));
      }

      if (Number.isFinite(config.threshold)) {
        data.threshold = config.threshold;
      } else if ((0, _util.isString)(config.threshold)) {
        var threshold = parseInt(config.threshold, 10);
        if (threshold) {
          data.threshold = threshold;
        }
      }
      if (!data.threshold) {
        return _bluebird2.default.reject(new Error('Invalid alert threshold'));
      }

      return this._crud(this.config.url + '/alert/' + name, 'PUT', data);
    }

    /**
     * Create/update a group alert.
     * @see {@link https://github.com/flightstats/hub#alerts|Alerts}
     * @param {string} name - alert name
     * @param {Object} config - configuration details for group alert
     * @param {string} config.source - name of the group to monitor
     * @param {string} config.serviceName - user defined end point for the alert
     * @param {number} config.timeWindowMinutes - period of time to evaluate
     */

  }, {
    key: 'groupAlert',
    value: function groupAlert(name, config) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing alert name'));
      }

      if (!config) {
        return _bluebird2.default.reject(new Error('Missing alert configuration'));
      }

      if (!config.source) {
        return _bluebird2.default.reject(new Error('Missing alert source'));
      }

      if (!config.serviceName) {
        return _bluebird2.default.reject(new Error('Missing alert service name'));
      }

      if (!config.timeWindowMinutes) {
        return _bluebird2.default.reject(new Error('Missing alert time window'));
      }

      var data = {
        source: config.source,
        serviceName: config.serviceName,
        type: 'group'
      };

      if (Number.isFinite(config.timeWindowMinutes)) {
        data.timeWindowMinutes = config.timeWindowMinutes;
      } else if ((0, _util.isString)(config.timeWindowMinutes)) {
        var timeWindowMinutes = parseInt(config.timeWindowMinutes, 10);
        if (timeWindowMinutes) {
          data.timeWindowMinutes = timeWindowMinutes;
        }
      }
      if (!data.timeWindowMinutes) {
        return _bluebird2.default.reject(new Error('Invalid alert time window'));
      }

      return this._crud(this.config.url + '/alert/' + name, 'PUT', data);
    }

    /**
     * Get channel/group alert status.
     * @see {@link https://github.com/flightstats/hub#channel-alert-status|Channel Alert Status}
     * @see {@link https://github.com/flightstats/hub#group-alert-status|Channel Group Status}
     * @param {string} name - alert name
     */

  }, {
    key: 'alertStatus',
    value: function alertStatus(name) {
      if (!name) {
        return _bluebird2.default.reject(new Error('Missing alert name'));
      }

      return this._crud(this.config.url + '/alert/' + name, 'GET');
    }
  }]);

  return Datahub;
}();

exports.default = Datahub;