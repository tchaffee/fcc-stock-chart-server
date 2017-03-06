const _ = require('lodash');
const WebSocket = require('ws');

// Cucumber doesn't support arrow functions due to binding 'this'.
/* eslint func-names: ["error", "never"]*/
/* eslint prefer-arrow-callback: 0 */
// TODO: Remove the below line before committing.
/* eslint no-console: 0 */

const { defineSupportCode } = require('cucumber');

// Hash of named websockets.
const ws = {};

defineSupportCode(({ Given, When, Then }) => {
  let serverAddress;
  let err;

  const newConnection = function (name) {
    if (ws[name]) {
      ws[name].close();
    }
    ws[name] = new WebSocket(serverAddress);
    serverAddress = process.env.WEBSOCKET_SERVER;
  };

  const openConnectionAndCatch = function (name, callback) {
    ws[name].on('error', (error) => {
      err = error;
      if (callback) {
        callback();
      }
    });
    ws[name].on('open', () => {
      if (callback) {
        callback();
      }
    });
  };

  const openConnection = function (name, callback) {
    ws[name].on('open', () => {
      if (callback) {
        callback();
      }
    });
  };

  Given('The server is already started using \'npm start\'', () => true);

  Given('I make a connection {arg1:stringInDoubleQuotes}', function (arg1) {
    newConnection(arg1);
  });

  Given('I open a connection {arg1:stringInDoubleQuotes}', function (arg1, callback) {
    openConnection(arg1, callback);
  });

  Given('I open a connection {arg1:stringInDoubleQuotes} and catch errors', function (arg1, callback) {
    openConnectionAndCatch(arg1, callback);
  });

  Given('I use a bad address like {arg1:stringInDoubleQuotes}', (arg1) => {
    serverAddress = arg1;
  });

  Given('I add {arg1:stringInDoubleQuotes} stock to the list on connection {arg2:stringInDoubleQuotes}', function (arg1, arg2, callback) {
    const eventListener = (message) => {
      console.log('Added a stock....');
      console.log(message);
      if (message.includes(arg1)) {
        ws[arg2].removeEventListener('message', eventListener);
        callback();
      }
    };

    ws[arg2].on('message', eventListener);

    ws[arg2].send(`{ "action": "ADD_STOCK", "symbol": "${arg1}" }`);
  });

  Given('The list of stocks is reset to empty on connection {arg1:stringInDoubleQuotes}', function (arg1, callback) {
    const eventListener = (message) => {
      const json = JSON.parse(message);
      if (json.stocks.length === 0) {
        console.log('The list of stocks is reset....');
        console.log(message);
        ws[arg1].removeEventListener('message', eventListener);
        callback();
      }
    };

    ws[arg1].on('message', eventListener);

    ws[arg1].send('{ "action": "RESET_STOCKS" }');
  });

  Then('I should eventually get an empty list of {arg1:stringInDoubleQuotes} from connection {arg2:stringInDoubleQuotes}', function (arg1, arg2, callback) {
    const eventListener = (message) => {
      const json = JSON.parse(message);
      console.log(`Got message from server: ${message}`);
      console.log(json[arg1]);
      // Check if the array is empty.
      if (json[arg1].length === 0) {
        callback();
      } else {
        callback('Returned list should be empty and is not.');
      }
      ws[arg1].removeEventListener('message', eventListener);
    };

    ws[arg2].on('message', eventListener);
  });

  Then('Error with code {arg1:stringInDoubleQuotes} should be caught', (arg1, callback) => {
    if (arg1 === err.code) {
      callback();
    } else {
      callback(err);
    }
  });

  /*
   * Check everything below this line.
   */

  When('I send the following JSON string using connection {arg1:stringInDoubleQuotes}:', function (arg1, string, callback) {
    ws[arg1].send(string);
    callback();
  });

  Given('I listen for a message on connection {arg1:stringInDoubleQuotes}', function (arg1) {
    ws[arg1].message = null;
    ws[arg1].on('message', (message) => {
      ws[arg1].message = message;
    });
  });

  Then('I should get a listened message from connection {arg1:stringInDoubleQuotes} containing:', function (arg1, string, callback) {
    setTimeout(function () {
      if (ws[arg1].message && ws[arg1].message.includes(string)) {
        callback();
      }
    }, 2000);
  });

  Then('I should eventually get a message from connection {arg1:stringInDoubleQuotes} containing:', function (arg1, string, callback) {
    ws[arg1].on('message', (message) => {
      if (message.includes(string)) {
        callback();
      }
    });
  });

  Then('I should eventually get a message from connection {arg1:stringInDoubleQuotes} NOT containing:', function (arg1, string, callback) {
    ws[arg1].on('message', (message) => {
      if (message.includes(string)) {
        callback(`Found not allowed string ${string} in list of stocks returned.`);
      } else {
        callback();
      }
    });
  });

  Then('I should eventually get a list of {arg1:stringInDoubleQuotes} from connection {arg2:stringInDoubleQuotes} containing:', function (arg1, arg2, table, callback) {
    const eventListener = (message) => {
      const json = JSON.parse(message);
      console.log(`I should eventually get a list...: ${message}`);
      console.log(json[arg1]);
      console.log(table.raw()[0]);
      // Check if the arrays are equal, order doesn't matter.
      if (_.isEmpty(_.xor(json[arg1], table.raw()[0]))) {
        callback();
        ws[arg1].removeEventListener('message', eventListener);
      }
    };

    ws[arg2].on('message', eventListener);
  });

  Then('I should NOT get a message from connection {arg1:stringInDoubleQuotes}', function (arg1, callback) {
    ws[arg1].on('message', (message) => {
      callback(`${arg1} connection should NOT get message: ${message}`);
    });

    // This is the non-error condition. Since the message should never be
    // received.
    setTimeout(function () {
      callback();
    }, 1000);
  });
});
