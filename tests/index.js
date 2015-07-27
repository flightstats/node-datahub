/* global describe, beforeEach, it */
'use strict';

var expect = require('chai').expect;
var Datahub = require('../index.js');
var nock = require('nock');

describe('node-datahub', function(){

  var testHubUrl = 'http://hub';
  var testWSHubUrl = 'ws://hub';
  var config = {
    url: testHubUrl
  };
  var datahub = new Datahub(config);

  it('should throw an Error if no datahub url is supplied', function(){
    expect(function(){
      new Datahub({
        foo: 'bar'
      });
    }).to.throw(Error);
  });

  it('should not throw an Error', function(){
    expect(function(){
      new Datahub(config);
    }).to.not.throw(Error);
  });

  it('should have various CRUD methods', function(){
    expect(datahub).to.respondTo('createChannel');
    expect(datahub).to.respondTo('getChannels');
    expect(datahub).to.respondTo('getChannel');
    expect(datahub).to.respondTo('deleteChannel');
    expect(datahub).to.respondTo('addContent');
    expect(datahub).to.respondTo('getContent');
    expect(datahub).to.respondTo('getLatest');
    expect(datahub).to.respondTo('getEarliest');
    expect(datahub).to.respondTo('getStatus');
    expect(datahub).to.respondTo('createGroupCallback');
    expect(datahub).to.respondTo('getGroupCallbacks');
    expect(datahub).to.respondTo('getGroupCallback');
    expect(datahub).to.respondTo('deleteGroupCallback');
    expect(datahub).to.respondTo('parseChannelName');
  });

  describe('createChannel', function () {

    var hubResponse = {
      '_links': {
        self: {
          href: testHubUrl + '/channel/testChannel'
        },
        latest: {
          href: testHubUrl + '/channel/testChannel/latest'
        },
        earliest: {
          href: testHubUrl + '/channel/testChannel/earliest'
        },
        ws: {
          href: testWSHubUrl + '/channel/testChannel/ws'
        },
        time: {
          href: testHubUrl + '/channel/testChannel/time'
        },
        status : {
          href : testHubUrl + '/channel/testChannel/status'
        }
      },
      name: 'testChannel',
      creationDate: '2015-07-01T13:30:00.00Z',
      ttlDays: 10,
      description: 'testing this channel',
      tags: [ 'test1', 'test2'],
      replicationSource: ''
    };

    it('should throw an Error if no channel name is supplied', function(done) {
      expect(function() {
        datahub.createChannel();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel', ttlDays: 10, description: 'testing', tags: [ 'test' ] })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel('testChannel', 10, 'testing', [ 'test' ]), done);
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel', ttlDays: 10 })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel('testChannel', '10'), done);
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel' })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel('testChannel', {}), done);
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel' })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel('testChannel', 'test'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel', ttlDays: 10 })
        .reply(409, 'Simulating create channel thrown error!');

      promiseRejected(datahub.createChannel('testChannel', 10), done);
    });

  });

  describe('getChannels', function () {

    var hubResponse = { '_links': {
      self: { href: testHubUrl + '/channel' },
      channels: [ {
        name: 'testing123',
        href: testHubUrl + '/channel/testing123'
      } ]
    } };

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel')
        .reply(200, hubResponse);

      promiseResolved(datahub.getChannels(), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel')
        .reply(404, 'Simulating get channels thrown error!');

      promiseRejected(datahub.getChannels(), done);
    });

  });

  describe('getChannel', function () {

    var hubResponse = {
      name: 'testChannel',
      creationDate: '2015-05-06T20:32:10.333Z',
      ttlDays: 60,
      maxItems: 0,
      description: '',
      tags: [ ],
      replicationSource: '',
      _links: {
        self: {
          href: testHubUrl + '/channel/testChannel'
        },
        latest: {
          href: testHubUrl + '/channel/testChannel/latest'
        },
        earliest: {
          href: testHubUrl + '/channel/testChannel/earliest'
        },
        ws: {
          href: testWSHubUrl + '/channel/testChannel/ws'
        },
        time: {
          href: testHubUrl + '/channel/testChannel/time'
        },
        status: {
          href: testHubUrl + '/channel/testChannel/status'
        }
      }
    };

    it('should throw an Error if no channel name is supplied', function (done) {
      expect(function () {
        datahub.getChannel();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(200, hubResponse);

      promiseResolved(datahub.getChannel('testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(404, 'Simulating get channel thrown error!');

      promiseRejected(datahub.getChannel('testChannel'), done)
    });

  });

  describe('deleteChannel', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      expect(function () {
        datahub.deleteChannel();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .delete('/channel/testChannel')
        .reply(202);

      promiseResolved(datahub.deleteChannel('testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .delete('/channel/testChannel')
        .reply(404, 'Simulating delete channel thrown error!');

      promiseRejected(datahub.deleteChannel('testChannel'), done);
    });

  });

  describe('addContent', function () {

    it('should throw an Error if no channel name is supplied', function(done) {
      expect(function() {
        datahub.addContent();
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no content is supplied', function(done) {
      expect(function() {
        datahub.addContent('testChannel');
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .post('/channel/testChannel', { foo: 'bar' })
        .reply(200, {
          '_links': {
            self: {
              href: testHubUrl + '/channel/testChannel/123/345/789'
            }
          },
          content: { foo: 'bar' },
          timestamp: '2015-07-01T13:30:00.00Z'
        });

      promiseResolved(datahub.addContent('testChannel', { foo: 'bar' }), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .post('/channel/testChannel', { foo: 'bar' })
        .reply(404, 'Simulating add content thrown error!');

      promiseRejected(datahub.addContent('testChannel', { foo: 'bar' }), done);
    });

  });

  describe('getContent', function () {

    it('should throw an Error if no channel url is supplied', function (done) {
      expect(function () {
        datahub.getContent();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getContent(testHubUrl + '/channel/testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(404, 'Simulating get content thrown error!');

      promiseRejected(datahub.getContent(testHubUrl + '/channel/testChannel'), done);
    });

  });

  describe('getStatus', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      expect(function () {
        datahub.getStatus();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/status')
        .reply(200, { '_links': { 'latest': { 'href': '...' } } });

      promiseResolved(datahub.getStatus('testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/status')
        .reply(404, 'Simulating get status thrown error!');

      promiseRejected(datahub.getStatus('testChannel'), done);
    });

  });

  describe('getLatest', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      expect(function () {
        datahub.getLatest();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/latest')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getLatest('testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/latest')
        .reply(404, 'Simulating get latest thrown error!');

      promiseRejected(datahub.getLatest('testChannel'), done);
    });

  });

  describe('getEarliest', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      expect(function () {
        datahub.getEarliest();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/earliest')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getEarliest('testChannel'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel/earliest')
        .reply(404, 'Simulating get earliest thrown error!');

      promiseRejected(datahub.getEarliest('testChannel'), done);
    });

  });

  describe('createGroupCallback', function () {

    it('should throw an Error if no group name is supplied', function (done) {
      expect(function () {
        datahub.createGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no channel url is supplied', function (done) {
      expect(function () {
        datahub.createGroupCallback('testGroupCallback');
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no callback url is supplied', function (done) {
      expect(function () {
        datahub.createGroupCallback('testGroupCallback', testHubUrl + '/channel/testChannel');
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no parallel calls is supplied', function (done) {
      expect(function () {
        datahub.createGroupCallback('testGroupCallback',
          testHubUrl + '/channel/testChannel',
          'http://somewhere.com/callback');
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .put('/group/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10
        })
        .reply(200, {
          name: 'testGroupCallback',
          '_links': {
            self: {
              href: testHubUrl + '/group/testGroupCallback'
            }
          },
          parallelCalls: 10
        });

      promiseResolved(datahub.createGroupCallback('testGroupCallback',
        testHubUrl + '/channel/testChannel',
        'http://somewhere.com/callback',
        10), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .put('/group/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10
        })
        .reply(404, 'Simulating create group callback thrown error!');

      promiseRejected(datahub.createGroupCallback('testGroupCallback',
        testHubUrl + '/channel/testChannel',
        'http://somewhere.com/callback',
        10), done);
    });

  });

  describe('getGroupCallbacks', function () {

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/group')
        .reply(200, { '_links': {
          groups: []
        }});

      promiseResolved(datahub.getGroupCallbacks(), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/group')
        .reply(404, 'Simulating get group callbacks thrown error!');

      promiseRejected(datahub.getGroupCallbacks(), done);
    });

  });

  describe('getGroupCallback', function () {

    it('should throw an Error if no group callback name is supplied', function (done) {
      expect(function () {
        datahub.getGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .get('/group/testGroupCallback')
        .reply(200, {});

      promiseResolved(datahub.getGroupCallback('testGroupCallback'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .get('/group/testGroupCallback')
        .reply(404, 'Simulating get group callback thrown error!');

      promiseRejected(datahub.getGroupCallback('testGroupCallback'), done);
    });

  });

  describe('deleteGroupCallback', function () {

    it('should throw an Error if no group callback name is supplied', function (done) {
      expect(function () {
        datahub.deleteGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should return resolved promise', function(done) {
      nock(testHubUrl)
        .delete('/group/testGroupCallback')
        .reply(202);

      promiseResolved(datahub.deleteGroupCallback('testGroupCallback'), done);
    });

    it('should return rejected promise', function(done) {
      nock(testHubUrl)
        .delete('/group/testGroupCallback')
        .reply(404, 'Simulating delete group callback thrown error!');

      promiseRejected(datahub.deleteGroupCallback('testGroupCallback'), done);
    });

  });

  describe('parseChannelName', function () {

    it('should return an empty string', function (done) {
      expect(datahub.parseChannelName()).to.eql('');
      done();
    });

    it('should return a channel name', function (done) {
      var testChannel = testHubUrl + '/channel/testChannel';
      expect(datahub.parseChannelName(testChannel)).to.eql('testChannel');
      done();
    });

  });

});

function promiseResolved (promise, done) {
  expect(promise).to.respondTo('then');

  promise.then(function(resp) {
    done();
  }, function (err) {
    throw err;
  });
}

function promiseRejected (promise, done) {
  expect(promise).to.respondTo('then');

  promise.then(function(resp) {
    throw new Error('expected failure, but succeeded instead');
  }, function (err) {
    done();
  });
}
