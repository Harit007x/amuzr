import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log('A user connected');

  ws.on('message', (message: string) => {
    const broadcastMessage = message.toString();
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMessage);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));