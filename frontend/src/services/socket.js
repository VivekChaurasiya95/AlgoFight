// frontend/src/services/socket.js
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4001";

class BrowserSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this.auth = {};
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.connected = true;
        this.trigger("connect");

        if (this.auth?.uid || this.auth?.token) {
          this.emit("auth", { userId: this.auth.uid });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const eventName = raw.event || raw.action || raw.type;
          if (eventName) {
            const data = raw.payload && typeof raw.payload === "object"
              ? { ...raw, ...raw.payload }
              : (raw.payload !== undefined ? raw.payload : raw);
            this.trigger(eventName, data);
          }
        } catch (e) {
          console.error("Socket parse error:", e);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.trigger("disconnect");
      };

      this.ws.onerror = (err) => {
        this.trigger("connect_error", err);
      };
    } catch (err) {
      this.trigger("connect_error", err);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  emit(action, data = {}) {
    const payload = JSON.stringify({ action, ...data });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      // Retry once opened
      const onOpen = () => {
        this.ws.removeEventListener("open", onOpen);
        this.ws.send(payload);
      };
      if (this.ws) {
        this.ws.addEventListener("open", onOpen);
      }
    }
  }

  trigger(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => cb(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = new BrowserSocketClient();
  }
  return socketInstance;
}

export function connectSocket(token, uid) {
  const s = getSocket();
  s.auth = { ...(token ? { token } : {}), ...(uid ? { uid } : {}) };
  s.connect();
  return s;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
