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
    options.json = true;
  } else if (method === 'POST' || method === 'PUT') {
    options.json = data;
  }

  return rp(url, options);
};

/**
* create a new channel
* @param {string} name - name of new channel
* @param {number} [ttlDays=120] - number of days used to limit the items in a channel by time
* @param {string} [description] - channel description
* @param {array} [tags] - string tags
*/
Datahub.prototype.createChannel = function(name, ttlDays, description, tags){
  if (!name){
    throw new Error('Missing channel name');
  }

  var data = { name: name };
  if (_.isNumber(ttlDays)) {
    data.ttlDays = ttlDays;
  } else if (_.isString(ttlDays)){
    ttlDays = parseInt(ttlDays, 10);
    if (ttlDays){
      data.ttlDays = ttlDays;
    }
  }
  if (description) { data.description = description; }
  if (tags) { data.tags = tags; }

  return this._crud(this.config.url + '/channel', 'POST', data);
};

/**
 * get a list of channels
 */
Datahub.prototype.getChannels = function(){
  return this._crud(this.config.url + '/channel', 'GET');
};

/**
 * get a specific channel
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
 */
Datahub.prototype.deleteChannel = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name, 'DELETE');
};

/**
 * add content to a channel
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
 */
Datahub.prototype.getContent = function(channelUrl){
  if (!channelUrl){
    throw new Error('Missing channel URL');
  }

  return this._crud(this.config.url + channelUrl, 'GET');
};

/**
 * get channel status
 */
Datahub.prototype.getStatus = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/status', 'GET');
};

/**
 * get latest channel content
 */
Datahub.prototype.getLatest = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/latest', 'GET');
};

/**
 * get earliest channel content
 */
Datahub.prototype.getEarliest = function(name){
  if (!name){
    throw new Error('Missing channel name');
  }

  return this._crud(this.config.url + '/channel/' + name + '/earliest', 'GET');
};

/*
  Group Callback Operations
 */

Datahub.prototype.createGroupCallback = function(name, channelUrl, callbackUrl, parallelCalls){
  if (!name){
    throw new Error('Missing group name');
  }

  if (!channelUrl){
    throw new Error('Missing channel URL');
  }

  if (!callbackUrl){
    throw new Error('Missing callback URL');
  }

  if (!parallelCalls){
    throw new Error('Missing number of parallel calls');
  }

  var data = {
    channelUrl: channelUrl,
    callbackUrl: callbackUrl,
    parallelCalls: parallelCalls
  };

  return this._crud(this.config.url + '/group/' + name, 'PUT', data);
};

Datahub.prototype.getGroupCallbacks = function(){
  return this._crud(this.config.url + '/group', 'GET');
};

Datahub.prototype.getGroupCallback = function(name){
  if (!name){
    throw new Error('Missing group name');
  }

  return this._crud(this.config.url + '/group/' + name, 'GET');
};

Datahub.prototype.deleteGroupCallback = function(name){
  if (!name){
    throw new Error('Missing group name');
  }

  return this._crud(this.config.url + '/group/' + name, 'DELETE');
};

module.exports = Datahub;
