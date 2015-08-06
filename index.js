'use strict';

var _ = require('lodash');
var rp = require('request-promise');

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

/*
  Channel(s) Operations
 */

Datahub.prototype.createChannel = function(name, ttlDays, description, tags){
  if (!name){
    throw new Error("Missing channel name");
  }

  var data = { name: name };
  if (_.isNumber(ttlDays)) {
    data.ttlDays = ttlDays;
  }
  else if (_.isString(ttlDays)){
    ttlDays = parseInt(ttlDays, 10);
    if (ttlDays){
      data.ttlDays = ttlDays;
    }
  }
  if (description) { data.description = description; }
  if (tags) { data.tags = tags; }

  return this._crud(this.config.url + '/channel', 'POST', data);
};

Datahub.prototype.getChannels = function(){
  return this._crud(this.config.url + '/channel', 'GET');
};

Datahub.prototype.getChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._crud(this.config.url + '/channel/' + name, 'GET');
};

Datahub.prototype.deleteChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._crud(this.config.url + '/channel/' + name, 'DELETE');
};

Datahub.prototype.addContent = function(name, content){
  if (!name){
    throw new Error("Missing channel name");
  }

  if (!content){
    throw new Error("Missing content");
  }

  return this._crud(this.config.url + '/channel/' + name, 'POST', content);
};

Datahub.prototype.getContent = function(channelUrl){
  if (!channelUrl){
    throw new Error("Missing channel URL");
  }

  return this._crud(this.config.url + channelUrl, 'GET');
};

Datahub.prototype.getStatus = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._crud(this.config.url + '/channel/' + name + '/status', 'GET');
};

Datahub.prototype.getLatest = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._crud(this.config.url + '/channel/' + name + '/latest', 'GET');
};

Datahub.prototype.getEarliest = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._crud(this.config.url + '/channel/' + name + '/earliest', 'GET');
};

/*
  Group Callback Operations
 */

Datahub.prototype.createGroupCallback = function(name, channelUrl, callbackUrl, parallelCalls){
  if (!name){
    throw new Error("Missing group name");
  }

  if (!channelUrl){
    throw new Error("Missing channel URL");
  }

  if (!callbackUrl){
    throw new Error("Missing callback URL");
  }

  if (!parallelCalls){
    throw new Error("Missing number of parallel calls");
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
    throw new Error("Missing group name");
  }

  return this._crud(this.config.url + '/group/' + name, 'GET');
};

Datahub.prototype.deleteGroupCallback = function(name){
  if (!name){
    throw new Error("Missing group name");
  }

  return this._crud(this.config.url + '/group/' + name, 'DELETE');
};

module.exports = Datahub;
