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

Datahub.channelNamePattern = /\/channel\/([a-zA-Z0-9_]*)/;

Datahub.prototype._get = function (url) {
  return rp(url, {
    method: 'GET',
    json: true
  });
};

Datahub.prototype._post = function (url, data) {
  return rp(url, {
    method: 'POST',
    json: data
  });
};

Datahub.prototype._put = function (url, data) {
  return rp(url, {
    method: 'PUT',
    json: data
  });
};

Datahub.prototype._delete = function (url) {
  return rp(url, {
    method: 'DELETE'
  });
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

  return this._post(this.config.url + '/channel', data);
};

Datahub.prototype.getChannels = function(){
  return this._get(this.config.url + '/channel');
};

Datahub.prototype.getChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._get(this.config.url + '/channel/' + name);
};

Datahub.prototype.deleteChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._delete(this.config.url + '/channel/' + name);
};

Datahub.prototype.addContent = function(name, content){
  if (!name){
    throw new Error("Missing channel name");
  }

  if (!content){
    throw new Error("Missing content");
  }

  return this._post(this.config.url + '/channel/' + name, content);
};

Datahub.prototype.getContent = function(channelUrl){
  if (!channelUrl){
    throw new Error("Missing channel URL");
  }

  return this._get(channelUrl);
};

Datahub.prototype.getStatus = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._get(this.config.url + '/channel/' + name + '/status');
};

Datahub.prototype.getLatest = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._get(this.config.url + '/channel/' + name + '/latest');
};

Datahub.prototype.getEarliest = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  return this._get(this.config.url + '/channel/' + name + '/earliest');
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

  return this._put(this.config.url + '/group/' + name, data);
};

Datahub.prototype.getGroupCallbacks = function(){
  return this._get(this.config.url + '/group');
};

Datahub.prototype.getGroupCallback = function(name){
  if (!name){
    throw new Error("Missing group name");
  }

  return this._get(this.config.url + '/group/' + name);
};

Datahub.prototype.deleteGroupCallback = function(name){
  if (!name){
    throw new Error("Missing group name");
  }

  return this._delete(this.config.url + '/group/' + name);
};


/*
  Helpers
 */

Datahub.prototype.parseChannelName = function(channelUrl){
  if (channelUrl && _.isString(channelUrl)) {
    return channelUrl.match(Datahub.channelNamePattern)[1];
  }

  return '';
};

module.exports = Datahub;
