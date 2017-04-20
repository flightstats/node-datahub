import { expect } from 'chai';
import { HubWatcher } from '../src/index.js';

describe('node-datahub HubWatcher', function() {

  const testHubUrl = 'http://hub';
  let config;
  let config2;
  let expressApp = null;
  let watcher = null;

  beforeEach(function() {
    config = {
      hubHost: {
        production: 'http://hub.iad.prod.flightstats.io',
        staging: 'http://hub.iad.staging.flightstats.io',
        test: 'http://hub.iad.dev.flightstats.io',
        development: 'http://hub.iad.dev.flightstats.io',
      },
      appHost: {
        production: 'http://wma-email-sender.prod.flightstats.io:3000',
        staging: 'http://wma-email-sender.staging.flightstats.io:3000',
        test: 'http://localhost:3001',
        development: 'http://localhost:3000',
      },
      hubParallelCalls: 2,
    };

    config2 = {
      hubHost: config.hubHost.test,
      appHost: config.appHost.test,
      hubParallelCalls: config.hubParallelCalls,
    };

    expressApp = {
      post: (route, handler) => {
        console.log('Mocked express route to', route);
      }
    }

  });

  it('should not throw an Error with valid args', function(){
    expect(function(){
      new HubWatcher(expressApp, config);
    }).to.not.throw(Error);
  });

  it('should not throw an Error with valid simpler args', function(){
    expect(function(){
      new HubWatcher(expressApp, config2);
    }).to.not.throw(Error);
  });

  it('should throw an Error if no Express app is supplied', function(){
    expect(function(){
      new HubWatcher(null, config);
    }).to.throw(Error);
  });

  it('should throw an Error if no config is supplied', function(){
    expect(function(){
      new HubWatcher(expressApp, null);
    }).to.throw(Error);
  });

  it('should throw an Error if no hubHost is supplied', function(){
    expect(function(){
      config.hubHost = null;
      new HubWatcher(expressApp, config);
    }).to.throw(Error);
  });

  it('should throw an Error if no appHost is supplied', function(){
    expect(function(){
      config.appHost = null;
      new HubWatcher(expressApp, config);
    }).to.throw(Error);
  });

  it('should throw an Error if no hubHost is supplied with simpler args', function(){
    expect(function(){
      config2.hubHost = null;
      new HubWatcher(expressApp, config2);
    }).to.throw(Error);
  });

  it('should throw an Error if no appHost is supplied with simpler args', function(){
    expect(function(){
      config2.appHost = null;
      new HubWatcher(expressApp, config2);
    }).to.throw(Error);
  });

  it('should define watchChannel()', function(){
    const watcher = new HubWatcher(expressApp, config);
    expect(watcher.watchChannel).to.not.be.empty;
  });

  it('should not throw an Error when watchChannel is called', function(done){
    this.timeout = 30000;
    expect(function(){
      const watcher = new HubWatcher(expressApp, config);
      watcher.watchChannel('some-channel', (hubItem, uri) => {
        console.log('received hub item:', hubItem);
      })
      .then(done);
    }).to.not.throw(Error);
  });

  it('should not throw an Error when watchChannel is called with simpler args', function(done){
    this.timeout = 30000;
    expect(function(){
      const watcher = new HubWatcher(expressApp, config2);
      watcher.watchChannel('some-channel', (hubItem, uri) => {
        console.log('received hub item:', hubItem);
      })
      .then(done);
    }).to.not.throw(Error);
  });

});
