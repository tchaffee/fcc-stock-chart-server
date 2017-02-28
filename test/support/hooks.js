var myHooks = function () {
  this.Before(function (scenario, callback) {
    // Just like inside step definitions, "this" is set to a World instance.
    // It's actually the same instance the current scenario step definitions
    // will receive.

    // Let's say we have a bunch of "maintenance" methods available on our World
    // instance, we can fire some to prepare the application for the next
    // scenario:

    /*
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      callback();
    }
    */

  });

};

module.exports = myHooks;
