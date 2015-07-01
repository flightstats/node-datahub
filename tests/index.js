'use strict';

var expect = require('chai').expect;
var Datahub = require('../index.js');
var nock = require('nock');

describe('node-datahub', function(){

  var testHubUrl = 'http://hub';
  var config;

  beforeEach(function(){
    config = {
      datahubUrl: testHubUrl
    };
  });

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

  it('should have the method createChannel', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('createChannel');
  });

  it('should have the method getChannels', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('getChannels');
  });

  it('should have the method getChannel', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('getChannel');
  });

  it('should have the method addContent', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('addContent');
  });

  it('should have the method getContent', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('getContent');
  });

  it('should have the method deleteChannel', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('deleteChannel');
  });

  it('should have the method upsertGroupCallback', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('upsertGroupCallback');
  });

  it('should have the method getGroupCallbacks', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('getGroupCallbacks');
  });

  it('should have the method getGroupCallback', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('getGroupCallback');
  });

  it('should have the method deleteGroupCallback', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('deleteGroupCallback');
  });

  it('should have the method parseChannelName', function(){
    var datahub = new Datahub(config);
    expect(datahub).to.respondTo('parseChannelName');
  });

  describe('createChannel', function () {

    it('should throw an Error if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      expect(function() {
        datahub.createChannel();
      }).to.throw(Error);
      done();
    });

    it('should create a channel', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel', ttlDays: 10 })
        .reply(200, {
          name: 'testChannel',
          '_links': {
            self: {
              href: testHubUrl + '/channel/testChannel'
            }
          },
          ttlDays: 10,
          creationDate: '2015-07-01T13:30:00.00Z'
        });

      var datahub = new Datahub(config);
      var promise = datahub.createChannel('testChannel', 10);
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('name' in result).to.eql(true);
        expect(result.name).to.be.a('string');
        expect('href' in result).to.eql(true);
        expect(result.href).to.be.a('string');
        expect('ttlDays' in result).to.eql(true);
        expect(result.ttlDays).to.be.a('number');
        expect('createdOn' in result).to.eql(true);
        expect(result.createdOn).to.be.an.instanceof(Date);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .post('/channel', { name: 'testChannel', ttlDays: 10 })
        .reply(409, 'Simulating create channel thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.createChannel('testChannel', 10);
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('getChannels', function () {

    it('should retrieve an array of channels', function(done) {
      nock(testHubUrl)
        .get('/channel')
        .reply(200, { '_links': {
          channels: []
        }});

      var datahub = new Datahub(config);
      var promise = datahub.getChannels();
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('Array');
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .get('/channel')
        .reply(404, 'Simulating get channels thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.getChannels();
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('getChannel', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.getChannel();
      }).to.throw(Error);
      done();
    });

    it('should get a channel', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(200, {});

      var datahub = new Datahub(config);
      var promise = datahub.getChannel('testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(404, 'Simulating get channel thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.getChannel('testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('addContent', function () {

    it('should throw an Error if no channel name is supplied', function(done) {
      var datahub = new Datahub(config);
      expect(function() {
        datahub.addContent();
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no content is supplied', function(done) {
      var datahub = new Datahub(config);
      expect(function() {
        datahub.addContent('testChannel');
      }).to.throw(Error);
      done();
    });

    it('should add content', function(done) {
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

      var datahub = new Datahub(config);
      var promise = datahub.addContent('testChannel', { foo: 'bar' });
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('url' in result).to.eql(true);
        expect(result.url).to.be.a('string');
        expect('content' in result).to.eql(true);
        expect(result.content).to.be.an('object');
        expect('createdOn' in result).to.eql(true);
        expect(result.createdOn).to.be.an.instanceof(Date);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .post('/channel/testChannel', { foo: 'bar' })
        .reply(200, {
          '_links': {
            self: {
              href: testHubUrl + '/channel/testChannel/aaa'
            }
          },
          content: { foo: 'bar' },
          timestamp: '2015-07-01T13:30:00.00Z'
        });

      var datahub = new Datahub(config);
      var promise = datahub.addContent('testChannel', { foo: 'bar' });
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .post('/channel/testChannel', { foo: 'bar' })
        .reply(404, 'Simulating add content thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.addContent('testChannel', { foo: 'bar' });
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('getContent', function () {

    it('should throw an Error if no channel url is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.getContent();
      }).to.throw(Error);
      done();
    });

    it('should get content', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(200, { foo: 'bar' });

      var datahub = new Datahub(config);
      var promise = datahub.getContent(testHubUrl + '/channel/testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('foo' in result).to.eql(true);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .get('/channel/testChannel')
        .reply(404, 'Simulating get content thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.getContent(testHubUrl + '/channel/testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('deleteChannel', function () {

    it('should throw an Error if no channel name is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.deleteChannel();
      }).to.throw(Error);
      done();
    });

    it('should delete a channel', function(done) {
      nock(testHubUrl)
        .delete('/channel/testChannel')
        .reply(202);

      var datahub = new Datahub(config);
      var promise = datahub.deleteChannel('testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('number');
        expect(result).to.eql(202);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .delete('/channel/testChannel')
        .reply(404, 'Simulating delete channel thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.deleteChannel('testChannel');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('upsertGroupCallback', function () {

    it('should throw an Error if no group name is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.upsertGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no channel url is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.upsertGroupCallback('testGroupCallback');
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no callback url is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.upsertGroupCallback('testGroupCallback', testHubUrl + '/channel/testChannel');
      }).to.throw(Error);
      done();
    });

    it('should throw an Error if no parallel calls is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.upsertGroupCallback('testGroupCallback',
          testHubUrl + '/channel/testChannel',
          'http://somewhere.com/callback');
      }).to.throw(Error);
      done();
    });

    it('should upsert group callback', function(done) {
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

      var datahub = new Datahub(config);
      var promise = datahub.upsertGroupCallback('testGroupCallback',
        testHubUrl + '/channel/testChannel',
        'http://somewhere.com/callback',
        10);
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('name' in result).to.eql(true);
        expect(result.name).to.be.a('string');
        expect('_links' in result).to.eql(true);
        expect(result['_links']).to.be.an('object');
        expect('parallelCalls' in result).to.eql(true);
        expect(result.parallelCalls).to.be.a('number');
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .put('/group/testGroupCallback', {
          channelUrl: testHubUrl + '/channel/testChannel',
          callbackUrl: 'http://somewhere.com/callback',
          parallelCalls: 10
        })
        .reply(404, 'Simulating upsert group callback thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.upsertGroupCallback('testGroupCallback',
        testHubUrl + '/channel/testChannel',
        'http://somewhere.com/callback',
        10);
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('getGroupCallbacks', function () {

    it('should retrieve an array of group callbacks', function(done) {
      nock(testHubUrl)
        .get('/group')
        .reply(200, { '_links': {
          groups: []
        }});

      var datahub = new Datahub(config);
      var promise = datahub.getGroupCallbacks();
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('Array');
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .get('/group')
        .reply(404, 'Simulating get group callbacks thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.getGroupCallbacks();
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('getGroupCallback', function () {

    it('should throw an Error if no group callback name is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.getGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should get a group callback', function(done) {
      nock(testHubUrl)
        .get('/group/testGroupCallback')
        .reply(200, {});

      var datahub = new Datahub(config);
      var promise = datahub.getGroupCallback('testGroupCallback');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .get('/group/testGroupCallback')
        .reply(404, 'Simulating get group callback thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.getGroupCallback('testGroupCallback');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('deleteGroupCallback', function () {

    it('should throw an Error if no group callback name is supplied', function (done) {
      var datahub = new Datahub(config);
      expect(function () {
        datahub.deleteGroupCallback();
      }).to.throw(Error);
      done();
    });

    it('should delete a group callback', function(done) {
      nock(testHubUrl)
        .delete('/group/testGroupCallback')
        .reply(202);

      var datahub = new Datahub(config);
      var promise = datahub.deleteGroupCallback('testGroupCallback');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('number');
        expect(result).to.eql(202);
        done();
      });
    });

    it('should return an HTTP status code between 400-599', function(done) {
      nock(testHubUrl)
        .delete('/group/testGroupCallback')
        .reply(404, 'Simulating delete group callback thrown error!');

      var datahub = new Datahub(config);
      var promise = datahub.deleteGroupCallback('testGroupCallback');
      expect(promise).to.respondTo('then');

      promise.then(function(result) {
        expect(result).to.be.an('object');
        expect('statusCode' in result).to.eql(true);
        expect(result.statusCode).to.be.above(399);
        expect(result.statusCode).to.be.below(600);
        done();
      });
    });

  });

  describe('parseChannelName', function () {

    it('should return an empty string', function (done) {
      var datahub = new Datahub(config);
      expect(datahub.parseChannelName()).to.eql('');
      done();
    });

    it('should return a channel name', function (done) {
      var testChannel = testHubUrl + '/channel/testChannel';
      var datahub = new Datahub(config);
      expect(datahub.parseChannelName(testChannel)).to.eql('testChannel');
      done();
    });

  })

});
