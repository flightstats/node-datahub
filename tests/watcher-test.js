import { expect } from 'chai';
import HubWatcher from '../src/hub-watcher';

describe('node-datahub HubWatcher', function() {

  const testHubUrl = 'http://hub';
  let config;
  let expressApp = null;
  let watcher = null;

  beforeEach(function() {
    config = {
      hubHost: {
        production: 'http://hub.svc.prod',
        staging: 'http://hub.svc.staging',
        test: 'http://hub.svc.dev',
        development: 'http://hub.svc.dev',
      },
      appHost: {
        production: 'http://wma-email-sender.prod.flightstats.io:3000',
        staging: 'http://wma-email-sender.staging.flightstats.io:3000',
        test: 'http://localhost:3001',
        development: 'http://localhost:3000',
      },
      hubParallelCalls: 2,
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
      expressApp.post = null;
      new HubWatcher(expressApp, config);
    }).to.throw(Error);
  });

  it('should define watchChannel()', function(){
    const watcher = new HubWatcher(expressApp, config);
    expect(watcher.watchChannel).to.not.be.empty;
  });

  it('should not throw an Error when watchChannel is called', function(done){
    expect(function(){
      const watcher = new HubWatcher(expressApp, config);
      watcher.watchChannel('some-channel', (hubItem, uri) => {
        console.log('received hub item');
      })
      .then(done);
    }).to.not.throw(Error);
  });

});
