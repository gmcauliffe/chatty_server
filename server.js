// server.js

const express = require('express');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const uuid = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new WebSocketServer({ server });

// Broadcast helper, allows us to send a message to all connected clients.
wss.broadcast = msg => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Initial message object to send to the connecting client.
  const initialMessage = {
    id: uuid(),
    type: 'incomingNotification',
    content: 'Welcome to Chatty!',
    timestamp: new Date()
  };

  // Send the initial message to the client which just connected.
  // This allows the react app to start with the right data.
  ws.send(JSON.stringify(initialMessage));

  // Message event handler, fires whenever a message from a client is received.
  ws.on('message', message => {
    console.log(`WS message ${message}`);
    // Message payloads are all JSON, so parse into JS data structures.
    const json = JSON.parse(message);
    if (json.type === 'postNotification') {
      json.type = 'incomingNotification'
    } else { json.type = 'incomingMessage' }
  // Create a message to send back out
    const outMsg = {
      // Spread operator here copies all the key-value pairs from the json object into this object
      ...json,
      // Add an id
      id: uuid(),
      // Add a timestamp.
      timestamp: new Date()
    };
    // Broadcast the change back to all clients.
    wss.broadcast(JSON.stringify(outMsg));
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => console.log('Client disconnected'));
});

console.log(`Socket Server is now listening at ws://localhost:${PORT}/`);