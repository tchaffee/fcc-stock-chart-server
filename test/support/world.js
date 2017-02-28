require('dotenv').config();

const { defineSupportCode } = require('cucumber');

function CustomWorld() {
  /*
  this.ws = new WebSocket('ws://www.host.com/path', {
    perMessageDeflate: false
  });
  */
}

defineSupportCode(({ setWorldConstructor }) => {
  setWorldConstructor(CustomWorld);
});
