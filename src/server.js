const WebSocket = require('ws');
const _ = require('lodash');

const wss = new WebSocket.Server({ port: 8080 });
const stocksList = [];

wss.broadcast = function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log('Broadcast to client...');
      client.send(data);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('websocket server running....');
  ws.on('message', (message) => {
    console.log(`Got message: ${message}`);
    const msgObj = JSON.parse(message);
    let returnObj;

    switch (msgObj.action) {
      case 'RESET_STOCKS':
        stocksList.length = 0;
        returnObj = { stocks: stocksList };
        wss.broadcast(JSON.stringify(returnObj));
        break;
      case 'ADD_STOCK':
        if (stocksList.indexOf(msgObj.symbol) === -1) {
          stocksList.push(msgObj.symbol);
        }
        returnObj = { stocks: stocksList };
        wss.broadcast(JSON.stringify(returnObj));
        break;
      case 'REMOVE_STOCK':
        _.pull(stocksList, msgObj.symbol);
        returnObj = { stocks: stocksList };
        wss.broadcast(JSON.stringify(returnObj));
        break;
      case 'GET_STOCKS':
        returnObj = { stocks: stocksList };
        ws.send(JSON.stringify(returnObj));
        break;
      default:
        returnObj = { error: `Unknown action: '${msgObj.action}'` };
        ws.send(JSON.stringify(returnObj));
    }
  });

  // ws.send('something');
});
