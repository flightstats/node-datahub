'use strict';

var _ = require('lodash');
var rp = require('request-promise');

/**
 * Datahub
 * @constructor
 * @param {Object} config - configuration object
 * @param {string} config.url - datahub url
 * @param {Object} [config.requestPromiseOptions] - options passed to request-promise
 *
 * @see {@link https://github.com/flightstats/hub|Hub}
 * @example
 *    new Datahub({
 *      url: '...',
 *    });
 *
 */
function Datahub(config){
  this.config = _.assign({
    url: null
  }, config);

  if (_.isEmpty(this.config.url)){
    throw new Error('Missing datahub URL');
  }
}

Datahub.prototype._crud = function (url, method, data) {
  var options = {
    method: method
  };

  if (this.config.requestPromiseOptions) {
    options = _.assign(options, this.config.requestPromiseOptions);
  }

  if (method === 'GET') {
    options.json = (options.json == null) ? true : options.json;
  } else if (method === 'POST' || method === 'PUT') {
    options.json = data;
  }

  return rp(url, options);
};

/**
 * create a new channel
 * @see {@link https://github.com/flightstats/hub#create-a-channel|Create a Channel}
 * @param {Object} config - configuration details for new channel
 * @param {string} config.name - name of new channel
 * @param {string} config.owner - owner of new channel
 * @param {number} [config.ttlDays=120] - number of days used to limit the items in a channel by time
 * @param {string} [config.description] - channel description
 * @param {array} [config.tags] - string tags
 */
Datahub.prototype.createChannel = function(config){
  if (!config.name){
    throw new Error('Missing channel name');
  }

  if (!config.owner){
    throw new Error('Missing channel owner');
  }

  var data = { name: config.name, owner: config.owner };
  if (_.isNumber(config.ttlDays)) {
    data.ttlDays = config.ttlDays;
  } else if (_.isString(config.ttlDays)){
    var ttlDays = parseInt(config.ttlDays, 10);
    if (ttlDays){
      data.ttlDays = ttlDays;
    }
  }
  if (config.description) { data.description = config.description; }
  if (config.tags) { data.tags = config.tags; }

  return this._crud(this.config.url + '/channel', 'POST', data);
};

/**
 * get a list of channels
 * @see {@link https://github.com/flightstats/hub#list-channels|List Channels}
 */
Datahub.prototype.getChannels = function(){
  return this._crud(this.config.url + '/channel', 'GET');
};

/**
 * get a specific channel
 * @see {@link https://github.com/flightstats/hub#fetch-channel-metadata|Fetch Channel Metadata}
 * @param {string} name - channel name
 */
Datahub.prototype.getChannel = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name, 'GET');
};

/**
 * delete a specific channel
 * @param {string} name - channel name
 * @see {@link https://github.com/flightstats/hub#delete-a-channel|Delete a Channel}
 */
Datahub.prototype.deleteChannel = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name, 'DELETE');
};

/**
 * add content to a channel
 * @see {@link https://github.com/flightstats/hub#insert-content-into-channel|Insert content into a Channel}
 * @param {string} name - channel name
 * @param {string} content - text content to add to channel
 */
Datahub.prototype.addContent = function(name, content){
  if (!name){
    throw new Error('Missing channel name');
  }

  if (!content){
    throw new Error('Missing content');
  }

  return this._crud(this.config.url + '/channel/' + name, 'POST', content);
};

/**
 * get channel content
 * @see {@link https://github.com/flightstats/hub#fetch-content-from-channel|Fetch content from a Channel}
 * @param {string} name - channel name
 * @param {string} id - content id
 */
Datahub.prototype.getContent = function(name, id){
  if (!name){
    throw new Error('Missing channel name');
  }

  if (!id){
    throw new Error('Missing content id');
  }

  return this._crud(this.config.url + '/channel/' + name + '/' + id, 'GET');
};

/**
 * get channel status
 * @see {@link https://github.com/flightstats/hub#channel-status|Get Channel Status}
 * @param {string} name - channel name
 */
Datahub.prototype.getStatus = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/status', 'GET');
};

/**
 * get latest channel content
 * @see {@link https://github.com/flightstats/hub#latest-channel-item|Latest Channel Item}
 * @param {string} name - channel name
 */
Datahub.prototype.getLatest = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/latest', 'GET');
};

/**
 * get earliest channel content
 * @see {@link https://github.com/flightstats/hub#earliest-channel-item|Earliest Channel Item}
 * @param {string} name - channel name
 */
Datahub.prototype.getEarliest = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/earliest', 'GET');
};

/**
 * create a group callback
 * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
 * @param {Object} config - configuration details for new group callback
 * @param {string} config.name - group callback name
 * @param {string} config.channelName - the channel name to monitor for new items
 * @param {string} config.callbackUrl - the fully qualified location to receive callbacks from the server
 * @param {number} [config.parallelCalls=1] - number of callbacks to make in parallel
 * @param {string} [config.startItem] - fully qualified item location where the callback should start from
 */
Datahub.prototype.createGroupCallback = function(config){
  if (!config.name){
    throw new Error('Missing group name');
  }

  if (!config.channelName){
    throw new Error('Missing channel name');
  }

  if (!config.callbackUrl){
    throw new Error('Missing callback URL');
  }

  var data = {
    channelUrl: this.config.url + '/channel/' + config.channelName,
    callbackUrl: config.callbackUrl
  };

  if (_.isNumber(config.parallelCalls)) {
    data.parallelCalls = config.parallelCalls;
  } else if (_.isString(config.parallelCalls)){
    var parallelCalls = parseInt(config.parallelCalls, 10);
    if (parallelCalls){
      data.parallelCalls = parallelCalls;
    }
  }

  if (config.startItem) { data.startItem = config.startItem; }

  return this._crud(this.config.url + '/group/' + config.name, 'PUT', data);
};

/**
 * Get a list of existing group callbacks
 * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
 */
Datahub.prototype.getGroupCallbacks = function(){
  return this._crud(this.config.url + '/group', 'GET');
};

/**
 * Get the configuration and status of an existing group callback
 * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
 * @param {string} name - group callback name
 */
Datahub.prototype.getGroupCallback = function(name){
  if (!name){
    throw new Error('Missing group name');
  }

  return this._crud(this.config.url + '/group/' + name, 'GET');
};

/**
 * Delete an existing group callback
 * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
 * @param {string} name - group callback name
 */
Datahub.prototype.deleteGroupCallback = function(name){
  if (!name){
    throw new Error('Missing group name');
  }

  return this._crud(this.config.url + '/group/' + name, 'DELETE');
};

/**
 * Get content for first uri included in a callback
 * @see {@link https://github.com/flightstats/hub#group-callback|Group Callbacks}
 * @param {string} data - group callback response data
 */
Datahub.prototype.getGroupCallbackContent = function(data) {
  if (!data || !data.uris || !data.uris[0]) {
    throw new Error('Missing data');
  } else {
    var url = data.uris[0];
    return this._crud(url, 'GET');
  }
};

module.exports = Datahub;
