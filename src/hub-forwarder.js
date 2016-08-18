/*


const forwarder = new HubForwarder(app, conf);
forwarder.addHandler('/sendgrid/webhook', processSendgridWebhook, 'wma_email_receipts');
 */


export default class HubForwarder {
  constructor(app, hubConfig) {
    this.app = app;
    this.hubConfig = hubConfig;
  }

  addHandler(route, fn, channelName) {
    // this.app.post(route, )
    // this.handlers[channelName].push(fn);
  }


}