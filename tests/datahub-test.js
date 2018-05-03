
import { expect } from 'chai';
import Datahub from '../src/index';
import nock from 'nock';

describe('node-datahub Datahub', function(){

  var testHubUrl = 'http://hub';
  var testWSHubUrl = 'ws://hub';
  var config;

  beforeEach(function(){
    config = {
      url: testHubUrl,
      requestPromiseOptions: {},
      queueTimerInterval: 500,
      queueMaxPending: 5
    };
  });

  it('should throw an Error if no datahub url is supplied', function(){
    expect(function(){
      new Datahub({
        foo: 'bar'
      });
    }).to.throw(Error);
  });

  it('should sanitize datahub url', function(){
    var hub = new Datahub({
      url: 'noScheme.com'
    });
    expect(hub.config.url.indexOf('http://')).to.equal(0);
  });

  it('should sanitize datahub url (2)', function(){
    var url = 'HTTPS://noScheme.com';
    var hub = new Datahub({
      url: url
    });
    expect(hub.config.url).to.equal(url.toLowerCase());
  });

  it('should not throw an Error creating via require', function(){
    var Datahub2 = require('../src/index');
    expect(function(){
      new Datahub2(config);
    }).to.not.throw(Error);
  });

  it('should throw an Error if queue finished callback defined is not a function', function(){
    expect(function(){
      new Datahub(Object.assign(config, { 'queueFinishedCallback': 12345 }));
    }).to.throw(Error);
  });

  it('should not throw an Error', function(){
    expect(function(){
      new Datahub(Object.assign(config, { 'queueFinishedCallback': () => {} }));
    }).to.not.throw(Error);
  });

  it('should be possible to get and set the property queueEnabled', function(){
    var datahub = new Datahub(config);
    datahub.queueEnabled = false;
    expect(datahub.queueEnabled).to.be.false;
    datahub.queueEnabled = true;
    expect(datahub.queueEnabled).to.be.true;
  });

  it('should have queue methods', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('startQueue');
    expect(datahub).to.respondTo('stopQueue');
    expect(datahub).to.respondTo('finishQueue');
    expect(datahub).to.respondTo('sendQueue');
  });

  it('should have various CRUD methods', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('createChannel');
    expect(datahub).to.respondTo('updateChannel');
    expect(datahub).to.respondTo('getChannels');
    expect(datahub).to.respondTo('getChannel');
    expect(datahub).to.respondTo('deleteChannel');
    expect(datahub).to.respondTo('getChannelStatus');
    expect(datahub).to.respondTo('addContent');
    expect(datahub).to.respondTo('getContent');
    expect(datahub).to.respondTo('getLatest');
    expect(datahub).to.respondTo('getEarliest');
    expect(datahub).to.respondTo('getTime');
    expect(datahub).to.respondTo('createGroupCallback');
    expect(datahub).to.respondTo('updateGroupCallback');
    expect(datahub).to.respondTo('getGroupCallbacks');
    expect(datahub).to.respondTo('getGroupCallback');
    expect(datahub).to.respondTo('deleteGroupCallback');
    expect(datahub).to.respondTo('getGroupCallbackContent');
    expect(datahub).to.respondTo('channelAlert');
    expect(datahub).to.respondTo('groupAlert');
    expect(datahub).to.respondTo('alertStatus');
  });

  describe('createChannel', function () {

    var hubResponse = {
      name: 'testChannel',
      owner: 'testOwner',
      creationDate: '2015-07-01T13:30:00.00Z',
      ttlDays: 10,
      maxItems: 0,
      description: 'testing this channel',
      tags: [ 'test1', 'test2'],
      replicationSource: 'http://testing.com/replication',
      storage: 'SINGLE',
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
        batch: {
          href: testHubUrl + '/channel/testChannel/batch'
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
      }
    };

    it('should return rejected promise if no channel configuration is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createChannel(), done);
    });

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createChannel({}), done);
    });

    it('should return rejected promise if no channel owner is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createChannel({ name: 'testChannel' }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .post('/channel', {
          name: 'testChannel',
          owner: 'testOwner'
        })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel({
        name: 'testChannel',
        owner: 'testOwner'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .post('/channel', {
          name: 'testChannel',
          owner: 'testOwner',
          description: 'testing this channel',
          tags: [ 'test1', 'test2']
        })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel({
        name: 'testChannel',
        owner: 'testOwner',
        ttlDays: '{}',
        description: 'testing this channel',
        tags: [ 'test1', 'test2']
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .post('/channel', {
          name: 'testChannel',
          owner: 'testOwner',
          ttlDays: 10,
          description: 'testing this channel',
          tags: [ 'test1', 'test2'],
          replicationSource: 'http://testing.com/replication',
          storage: 'SINGLE'
        })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel({
        name: 'testChannel',
        owner: 'testOwner',
        ttlDays: '10',
        description: 'testing this channel',
        tags: [ 'test1', 'test2'],
        replicationSource: 'http://testing.com/replication',
        storage: 'SINGLE'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .post('/channel', {
          name: 'testChannel',
          owner: 'testOwner',
          ttlDays: 10,
          description: 'testing this channel',
          tags: [ 'test1', 'test2'],
          replicationSource: 'http://testing.com/replication',
          storage: 'BATCH'
        })
        .reply(200, hubResponse);

      promiseResolved(datahub.createChannel({
        name: 'testChannel',
        owner: 'testOwner',
        ttlDays: 10,
        description: 'testing this channel',
        tags: [ 'test1', 'test2'],
        replicationSource: 'http://testing.com/replication',
        storage: 'BATCH'
      }), done);
    });

  });

  describe('updateChannel', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.updateChannel(), done);
    });

    it('should return rejected promise if no channel configuration is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.updateChannel('testChannel'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/channel/testChannel', {})
        .reply(200, {});

      promiseResolved(datahub.updateChannel('testChannel', {}), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/channel/testChannel', {})
        .reply(200, {});

      promiseResolved(datahub.updateChannel('testChannel', {
        ttlDays: '{}'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/channel/testChannel', {
          ttlDays: 10
        })
        .reply(200, {});

      promiseResolved(datahub.updateChannel('testChannel', {
        ttlDays: '10'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/channel/testChannel', {
          owner: 'testOwner',
          ttlDays: 10,
          description: 'testing this channel',
          tags: [ 'test1', 'test2'],
          replicationSource: 'http://testing.com/replication'
        })
        .reply(200, {});

      promiseResolved(datahub.updateChannel('testChannel', {
        owner: 'testOwner',
        ttlDays: 10,
        description: 'testing this channel',
        tags: [ 'test1', 'test2'],
        replicationSource: 'http://testing.com/replication'
      }), done);
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
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel')
        .reply(200, hubResponse);

      promiseResolved(datahub.getChannels(), done);
    });

  });

  describe('getChannel', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getChannel(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(200, {});

      promiseResolved(datahub.getChannel('testChannel'), done);
    });

  });

  describe('deleteChannel', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.deleteChannel(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .delete('/channel/testChannel')
        .reply(202);

      promiseResolved(datahub.deleteChannel('testChannel'), done);
    });

  });

  describe('getChannelStatus', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getChannelStatus(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/status')
        .reply(200, { '_links': { 'latest': { 'href': '...' } } });

      promiseResolved(datahub.getChannelStatus('testChannel'), done);
    });

  });

  describe('addContent', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.addContent(), done);
    });

    it('should return rejected promise if no content is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.addContent('testChannel'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
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

    it('should encrypt', function(done) {
      config.encryptionPassword = 'test';
      var datahub = new Datahub(config);
      var stringified = JSON.stringify({ foo: 'bar' });
      nock(testHubUrl)
        .post('/channel/testChannel', '278a970e71bbe158e31d3d15a095bdee')
        .reply(200, {
          '_links': {
            self: {
              href: testHubUrl + '/channel/testChannel/123/345/777'
            }
          },
          content: '278a970e71bbe158e31d3d15a095bdee',
          timestamp: '2015-07-01T13:30:00.00Z'
        });

      promiseResolved(datahub.addContent('testChannel', stringified), done);
    });

  });

  describe('getContent', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getContent(), done);
    });

    it('should return rejected promise if no channel id is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getContent('testChannel'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/2015/01/01/123abc')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getContent('testChannel', '2015/01/01/123abc'), done);
    });

    it('should decrypt', function(done) {
      config.encryptionPassword = 'test';
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/2015/01/01/123abc')
        .reply(200, '278a970e71bbe158e31d3d15a095bdee');

      promiseResolved(datahub.getContent('testChannel', '2015/01/01/123abc'), done);
    });

  });

  describe('getLatest', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getLatest(), done);
    });

    it('should return rejected promise if invalid number parameter is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getLatest('testChannel', 'A'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/latest')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getLatest('testChannel'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/latest/5')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getLatest('testChannel', 5), done);
    });

  });

  describe('getEarliest', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getEarliest(), done);
    });

    it('should return rejected promise if invalid number parameter is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getEarliest('testChannel', 'A'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/earliest')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getEarliest('testChannel'), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/earliest/5')
        .reply(200, { foo: 'bar' });

      promiseResolved(datahub.getEarliest('testChannel', 5), done);
    });

  });

  describe('getTime', function () {

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getTime(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/channel/testChannel/time')
        .reply(200, { });

      promiseResolved(datahub.getTime('testChannel'), done);
    });

  });

  describe('createGroupCallback', function () {

    it('should return rejected promise if no group configuration is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createGroupCallback(), done);
    });

    it('should return rejected promise if no group name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createGroupCallback({}), done);
    });

    it('should return rejected promise if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createGroupCallback({ name: 'testGroupCallback' }), done);
    });

    it('should return rejected promise if no callback url is supplied', function(done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel'
      }), done);
    });

    it('should return resolved promise 1', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback'
        })
        .reply(200, {});

      promiseResolved(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel',
        callbackUrl: 'http://somewhere.com/callback'
      }), done);
    });

    it('should return resolved promise 2', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback'
        })
        .reply(200, {});

      promiseResolved(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel',
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: '{}',
        maxWaitMinutes: '{}',
        ttlMinutes: '{}'
      }), done);
    });

    it('should return resolved promise 3', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel',
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: '10',
        maxWaitMinutes: '15',
        ttlMinutes: '20'
      }), done);
    });

    it('should return resolved promise 4', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          startItem: 'http://somewhere.com/channel/startItem',
          batch: 'SINGLE',
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel',
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: 10,
        paused: false,
        startItem: 'http://somewhere.com/channel/startItem',
        batch: 'single',
        heartbeat: false,
        maxWaitMinutes: 15,
        ttlMinutes: 20
      }), done);
    });

    it('should return resolved promise 5', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          paused: true,
          startItem: 'http://somewhere.com/channel/startItem',
          batch: 'MINUTE',
          heartbeat: true,
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.createGroupCallback({
        name: 'testGroupCallback',
        channelName: 'testChannel',
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: 10,
        paused: true,
        startItem: 'http://somewhere.com/channel/startItem',
        batch: 'minute',
        heartbeat: true,
        maxWaitMinutes: 15,
        ttlMinutes: 20
      }), done);
    });

  });

  describe('updateGroupCallback', function () {

    it('should return rejected promise if no group name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.updateGroupCallback(), done);
    });

    it('should return rejected promise if no group configuration is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.updateGroupCallback('testGroupCallback'), done);
    });

    it('should return resolved promise 1', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {})
        .reply(200, {});

      promiseResolved(datahub.updateGroupCallback('testGroupCallback', {}), done);
    });

    it('should return resolved promise 2', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          callbackUrl: 'http://somewhere.com/callback'
        })
        .reply(200, {});

      promiseResolved(datahub.updateGroupCallback('testGroupCallback', {
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: '{}',
        maxWaitMinutes: '{}',
        ttlMinutes: '{}'
      }), done);
    });

    it('should return resolved promise 3', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.updateGroupCallback('testGroupCallback', {
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: '10',
        maxWaitMinutes: '15',
        ttlMinutes: '20'
      }), done);
    });

    it('should return resolved promise 4', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          paused: false,
          heartbeat: false,
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.updateGroupCallback('testGroupCallback', {
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: 10,
        paused: false,
        heartbeat: false,
        maxWaitMinutes: 15,
        ttlMinutes: 20
      }), done);
    });

    it('should return resolved promise 5', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/webhook/testGroupCallback', {
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10,
          paused: true,
          heartbeat: true,
          maxWaitMinutes: 15,
          ttlMinutes: 20
        })
        .reply(200, {});

      promiseResolved(datahub.updateGroupCallback('testGroupCallback', {
        callbackUrl: 'http://somewhere.com/callback',
        parallelCalls: 10,
        paused: true,
        heartbeat: true,
        maxWaitMinutes: 15,
        ttlMinutes: 20
      }), done);
    });

  });

  describe('getGroupCallbacks', function () {

    it('should return resolved promise 6', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/webhook')
        .reply(200, { '_links': {
          groups: []
        }});

      promiseResolved(datahub.getGroupCallbacks(), done);
    });

  });

  describe('getGroupCallback', function () {

    it('should return rejected promise if no group callback name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getGroupCallback(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/webhook/testGroupCallback')
        .reply(200, {});

      promiseResolved(datahub.getGroupCallback('testGroupCallback'), done);
    });

  });

  describe('deleteGroupCallback', function () {

    it('should return rejected promise if no group callback name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.deleteGroupCallback(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .delete('/webhook/testGroupCallback')
        .reply(202);

      promiseResolved(datahub.deleteGroupCallback('testGroupCallback'), done);
    });

  });

  describe('getGroupCallbackContent', function () {

    it('should return rejected promise if no data is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.getGroupCallbackContent(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/webhook/testGroupCallback')
        .reply(200, {});

      promiseResolved(datahub.getGroupCallbackContent({uris:[testHubUrl + '/webhook/testGroupCallback']}), done);
    });

  });

  describe('channelAlert', function() {

    it('should return rejected promise if no alert name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert(), done);
    });

    it('should return rejected promise if no alert config is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert'), done);
    });

    it('should return rejected promise if no alert source is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {}), done);
    });

    it('should return rejected promise if no alert serviceName is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource'
      }), done);
    });

    it('should return rejected promise if no alert time window is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName'
      }), done);
    });

    it('should return rejected promise if no alert operator is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10
      }), done);
    });

    it('should return rejected promise if no alert threshold is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10,
        operator: 'testAlertOperator'
      }), done);
    });

    it('should return rejected promise if invalid alert time window is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: {},
        operator: '==',
        threshold: 10
      }), done);
    });

    it('should return rejected promise if invalid alert time window is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: '{}',
        operator: '==',
        threshold: 10
      }), done);
    });

    it('should return rejected promise if invalid alert operator is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10,
        operator: {},
        threshold: 10
      }), done);
    });

    it('should return rejected promise if invalid alert threshold is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10,
        operator: '==',
        threshold: {}
      }), done);
    });

    it('should return rejected promise if invalid alert threshold is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10,
        operator: '==',
        threshold: '{}'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/alert/testAlert', {
          source: 'testAlertSource',
          serviceName: 'testAlertServiceName',
          type: 'channel',
          timeWindowMinutes: 10,
          operator: '==',
          threshold: 10
        })
        .reply(200, {});

      promiseResolved(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10,
        operator: '==',
        threshold: 10
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/alert/testAlert', {
          source: 'testAlertSource',
          serviceName: 'testAlertServiceName',
          type: 'channel',
          timeWindowMinutes: 10,
          operator: '==',
          threshold: 10
        })
        .reply(200, {});

      promiseResolved(datahub.channelAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: '10',
        operator: '==',
        threshold: '10'
      }), done);
    });

  });

  describe('groupAlert', function() {

    it('should return rejected promise if no alert name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert(), done);
    });

    it('should return rejected promise if no alert config is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert'), done);
    });

    it('should return rejected promise if no alert source is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert', {}), done);
    });

    it('should return rejected promise if no alert serviceName is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert', {
        source: 'testAlertSource'
      }), done);
    });

    it('should return rejected promise if no alert timeWindowMinutes is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName'
      }), done);
    });

    it('should return rejected promise if invalid alert time window is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: {}
      }), done);
    });

    it('should return rejected promise if invalid alert time window is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.groupAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: '{}'
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/alert/testAlert', {
          source: 'testAlertSource',
          serviceName: 'testAlertServiceName',
          type: 'group',
          timeWindowMinutes: 10
        })
        .reply(200, {});

      promiseResolved(datahub.groupAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: 10
      }), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .put('/alert/testAlert', {
          source: 'testAlertSource',
          serviceName: 'testAlertServiceName',
          type: 'group',
          timeWindowMinutes: 10
        })
        .reply(200, {});

      promiseResolved(datahub.groupAlert('testAlert', {
        source: 'testAlertSource',
        serviceName: 'testAlertServiceName',
        timeWindowMinutes: '10'
      }), done);
    });

  });

  describe('alertStatus', function() {

    it('should return rejected promise if no alert name is supplied', function (done) {
      var datahub = new Datahub(config);
      promiseRejected(datahub.alertStatus(), done);
    });

    it('should return resolved promise', function(done) {
      var datahub = new Datahub(config);
      nock(testHubUrl)
        .get('/alert/testAlert')
        .reply(200, {});

      promiseResolved(datahub.alertStatus('testAlert'), done);
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
