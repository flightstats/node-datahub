'use strict';

var _ = require('lodash');
var rp = require('request-promise');
var logger = console;

function Datahub(config){
  this.config = _.assign({
    datahubUrl: null,
    logger: logger
  }, config);

  if (_.isEmpty(this.config.datahubUrl)){
    throw new Error('Missing datahub URL');
  }
}

Datahub.idPattern = /\/channel\/(?:.+)\/([0-9]+)/;
Datahub.channelNamePattern = /\/channel\/([a-zA-Z0-9_]*)/;

/*
  Channel(s) Operations
 */

Datahub.prototype.createChannel = function(name, ttlDays, description, tags){
  if (!name){
    throw new Error("Missing channel name");
  }

  var that = this;
  var url = this.config.datahubUrl + '/channel';
  var data = { name: name };
  if (_.isNumber(ttlDays)) {
    data.ttlDays = ttlDays;
  }
  else if (_.isString(ttlDays)){
    ttlDays = parseInt(ttlDays, 10);
    if (_.isNumber(ttlDays)){
      data.ttlDays = ttlDays;
    }
  }
  if (description) { data.description = description; }
  if (tags) { data.tags = tags; }

  return rp(url, {
    method: 'POST',
    json: data
  })
    .then(function(resp){
      var created = {
        name: resp.name,
        href: resp._links.self.href,
        ttlDays: parseInt(resp.ttlDays, 10),
        createdOn: new Date(resp.creationDate)
      };

      that.config.logger.log('Created hub channel', created);
      return created;
    })
    .catch(function(err){
      that.config.logger.error('Error created hub channel', err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.getChannels = function(){
  var that = this;
  var url = this.config.datahubUrl + '/channel';

  return rp(url, {
    method: 'GET',
    json: true
  })
    .then(function(resp){
      var channels = resp._links.channels || [];

      that.config.logger.log('Retrieved hub channels on ' + url, channels.length + ' channels found');
      return channels;
    })
    .catch(function(err){
      that.config.logger.error('Error retrieving hub channels on ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.getChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  var that = this;
  var url = this.config.datahubUrl + '/channel/' + name;

  return rp(url, {
    method: 'GET',
    json: true
  })
    .then(function(resp){
      that.config.logger.log('Retrieved response on hub channel', url);
      return resp;
    })
    .catch(function(err){
      that.config.logger.error('Error retrieving response on hub channel ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.addContent = function(name, content){
  if (!name){
    throw new Error("Missing channel name");
  }

  if (!content){
    throw new Error("Missing content");
  }

  var that = this;
  var url = this.config.datahubUrl + '/channel/' + name;

  return rp(url, {
    method: 'POST',
    json: content
  })
    .then(function(resp){
      var payload = {
        url: resp._links.self.href,
        content: content,
        createdOn: new Date(resp.timestamp)
      };

      var idMatch = resp._links.self.href.match(Datahub.idPattern);
      if (idMatch){
        payload.id = parseInt(idMatch[1]);
      } else {
        that.config.logger.error('Could not determine the payload id while adding hub content', url);
        return { statusCode: 500 };
      }

      that.config.logger.log('Posted content on hub channel', url);
      return payload;
    })
    .catch(function(err){
      that.config.logger.error('Error posting content on hub channel ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.getContent = function(channelUrl){
  if (!channelUrl){
    throw new Error("Missing channel URL");
  }

  var that = this;

  return rp(channelUrl, {
    method: 'GET',
    json: true
  })
    .then(function (resp) {
      that.config.logger.log('Retrieved content on hub channel', channelUrl);
      return resp;
    })
    .catch(function (err) {
      that.config.logger.error('Error retrieving content on hub channel ' + channelUrl, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.deleteChannel = function(name){
  if (!name){
    throw new Error("Missing channel name");
  }

  var that = this;
  var url = this.config.datahubUrl + '/channel/' + name;

  return rp(url, {
    method: 'DELETE'
  })
    .then(function (/*resp*/) {
      that.config.logger.log('Deleted hub channel', url);
      return 202;
    })
    .catch(function (err) {
      that.config.logger.error('Error deleting hub channel ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

/*
  Group Callback Operations
 */

Datahub.prototype.upsertGroupCallback = function(name, channelUrl, callbackUrl, parallelCalls){
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

  var that = this;
  var url = this.config.datahubUrl + '/group/' + name;
  var data = {
    channelUrl: channelUrl,
    callbackUrl: callbackUrl,
    parallelCalls: parallelCalls
  };

  return rp(url, {
    method: 'PUT',
    json: data
  })
    .then(function (resp) {
      that.config.logger.log('Created hub group callback', { url: url, data: data });
      return resp;
    })
    .catch(function (err) {
      that.config.logger.error('Error creating hub group callback for ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.getGroupCallbacks = function(){
  var that = this;
  var url = this.config.datahubUrl + '/group';

  return rp(url, {
    method: 'GET',
    json: true
  })
    .then(function (resp) {
      var groups = resp._links.groups || [];

      that.config.logger.log('Retrieved hub group callbacks on ' + url, groups.length + ' group callbacks found');
      return groups;
    })
    .catch(function (err) {
      that.config.logger.error('Error retrieving hub group callbacks on ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.getGroupCallback = function(name){
  if (!name){
    throw new Error("Missing group name");
  }

  var that = this;
  var url = this.config.datahubUrl + '/group/' + name;

  return rp(url, {
    method: 'GET',
    json: true
  })
    .then(function (resp) {
      that.config.logger.log('Retrieved response on hub group callback', url);
      return resp;
    })
    .catch(function (err) {
      that.config.logger.error('Error retrieving response on hub group callback ' + url, err.message);
      return { statusCode: err.statusCode };
    });
};

Datahub.prototype.deleteGroupCallback = function(name){
  if (!name){
    throw new Error("Missing group name");
  }

  var that = this;
  var url = this.config.datahubUrl + '/group/' + name;

  return rp(url, {
    method: 'DELETE'
  })
    .then(function (/*resp*/) {
      that.config.logger.log('Deleted hub group callback', url);
      return 202;
    })
    .catch(function (err) {
      that.config.logger.error('Error deleting group callback ' + url, err.message);
      return { statusCode: err.statusCode };
    });
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
