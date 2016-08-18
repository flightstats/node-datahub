import { expect } from 'chai';
import HubWatcher from '../src/hub-watcher';

describe('node-datahub HubWatcher', function() {

  const testHubUrl = 'http://hub';
  let config;

  const expressApp = {
    post: (route, handler) => {
      console.log('Received post to', route);
    }
  }

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

    const watcher = new HubWatcher(expressApp, config);
    // watcher.watchChannel('wma_email_outbox', sendEmail);
  });

});
