// index.js
export class CloudRoom {
  constructor(state, env) {
    this.state = state;
    this.sockets = new Set();

    // Accept incoming WebSocket connections
    this.state.getSockets().forEach((socket) => {
      this.sockets.add(socket);
    });
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.sockets.add(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Broadcast incoming variable messages to all connected players
  async webSocketMessage(ws, message) {
    for (const socket of this.sockets) {
      if (socket !== ws && socket.readyState === 1) {
        socket.send(message);
      }
    }
  }

  async webSocketClose(ws) {
    this.sockets.delete(ws);
  }

  async webSocketError(ws) {
    this.sockets.delete(ws);
  }
}

export default {
  async fetch(request, env) {
    // Route connections to a default room instance
    const id = env.CLOUD_ROOM.idFromName("global-room");
    const room = env.CLOUD_ROOM.get(id);
    return room.fetch(request);
  },
};