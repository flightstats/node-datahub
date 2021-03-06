import { expect } from 'chai';
import { HubForwarder } from '../src/index.js';
import app from './app';
import request from 'nodeunit-express';
 
var globalOptions = {
  prepare: function (res) {
    if (res.body != null) {
      res.body = JSON.parse(res.body);
    }

    return res;
  }
};

const TEST_ROUTE = '/some/endpoint';
const TEST_CHANNEL = 'some-test-channel';

describe('node-datahub HubForwarder', function() {

  const testHubUrl = 'http://hub';
  let config;
  let config2;
  let forwarder = null;
  const express = request(app);

  beforeEach(function() {
    config = {
      hubHost: {
        production: 'http://hub.iad.prod.flightstats.io',
        staging: 'http://hub.iad.staging.flightstats.io',
        test: 'http://hub.iad.dev.flightstats.io',
        development: 'http://hub.iad.dev.flightstats.io',
      },
    };

    config2 = {
      hubHost: 'http://hub.iad.dev.flightstats.io',
    };

    // app = {
    //   post: (route, handler) => {
    //     console.log('Mocked express route to', route);
    //   }
    // }

  });

  it('should not throw an Error with valid args', function(){
    expect(function(){
      new HubForwarder(app, config);
    }).to.not.throw(Error);
  });

  it('should not throw an Error with valid simpler args', function(){
    expect(function(){
      new HubForwarder(app, config2);
    }).to.not.throw(Error);
  });

  it('should throw an Error if no Express app is supplied', function(){
    expect(function(){
      new HubForwarder(null, config);
    }).to.throw(Error);
  });

  it('should throw an Error if no config is supplied', function(){
    expect(function(){
      new HubForwarder(app, null);
    }).to.throw(Error);
  });

  it('should throw an Error if no hubHost is supplied', function(){
    expect(function(){
      config.hubHost = null;
      new HubForwarder(app, config);
    }).to.throw(Error);
  });

  it('should throw an Error if no hubHost is supplied with simpler args', function(){
    expect(function(){
      config2.hubHost = null;
      new HubForwarder(app, config2);
    }).to.throw(Error);
  });

  it('should define forwardToChannel()', function(){
    const forwarder = new HubForwarder(app, config);
    expect(forwarder.forwardToChannel).to.not.be.empty;
  });

  it('should not throw an Error when forwardToChannel is called', function(){
    expect(function(){
      const forwarder = new HubForwarder(app, config);

      forwarder.forwardToChannel(TEST_ROUTE, TEST_CHANNEL, (request) => {
        // console.log('received post:', request && request.body);
        return {transformed: true};
      });

    }).to.not.throw(Error);
  });

  it('should not throw an Error when forwardToChannel is called with simpler config', function(){
    expect(function(){
      const forwarder = new HubForwarder(app, config2);

      forwarder.forwardToChannel(TEST_ROUTE, TEST_CHANNEL, (request) => {
        // console.log('received post:', request && request.body);
        return {transformed: true};
      });

    }).to.not.throw(Error);
  });

  xit('should handle a request to /', function(done) {
    express.get('/').expect(function(response) {
      console.log('response.body:', response.body)
      expect(response.body).to.equal('ok');
      expect(response.statusCode).to.equal(200);
      expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
      // express.close();
      done();
    });
  });

  it('should handle a post to test route', function(done) {

    // simulate an incoming request
    // TODO: find a better way to send post data to the handler
    
    express.post(TEST_ROUTE).expect(function(response) {
      expect(response).to.not.be.null;
      expect(response.body).to.equal('');
      expect(response.statusCode).to.equal(200);
      // express.close();
      done();
    });
  });

});


