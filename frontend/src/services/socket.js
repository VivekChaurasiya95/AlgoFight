// frontend/src/services/socket.js
export const getWsUrl = () => {
  const envWs = import.meta.env.VITE_WS_URL;
  const isLocal = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (envWs) {
    if (!isLocal && (envWs.includes("localhost") || envWs.includes("127.0.0.1"))) {
      // Ignore local env var in production
    } else {
      return envWs;
    }
  }

  if (typeof window !== "undefined" && !isLocal) {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    if (apiUrl && !apiUrl.includes("localhost") && !apiUrl.includes("127.0.0.1")) {
      const baseWsUrl = apiUrl.replace(/^http/, "ws");
      return baseWsUrl.endsWith("/ws") ? baseWsUrl : `${baseWsUrl}/ws`;
    }
    return window.location.protocol === "https:"
      ? `wss://${window.location.host}/ws`
      : `ws://${window.location.host}/ws`;
  }
  return "ws://localhost:3000/ws";
};

export const WS_URL = getWsUrl();

class BrowserSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this.auth = {};
    
    // Reconnection State
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 6; // Max 30s roughly
    this.reconnectTimeout = null;
    this.intentionalDisconnect = false;

    // Heartbeat State
    this.pingInterval = null;
  }

  connect() {
    this.intentionalDisconnect = false;
    
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN && (this.auth?.uid || this.auth?.userId)) {
        this.emit("auth", {
          userId: this.auth.uid || this.auth.userId,
          username: this.auth.username || this.auth.displayName || "Player",
        });
      }
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0; // Reset on successful connection
        this.startHeartbeat();
        this.trigger("connect");

        if (this.auth?.uid || this.auth?.userId) {
          this.emit("auth", {
            userId: this.auth.uid || this.auth.userId,
            username: this.auth.username || this.auth.displayName || "Player",
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          // Backend sends pong, we just ignore it as it means the connection is alive
          if (event.data === "pong") return;
          
          const raw = JSON.parse(event.data);
          const eventName = raw.event || raw.action || raw.type;
          if (eventName) {
            const data = raw.payload !== undefined
              ? (typeof raw.payload === "object" ? { ...raw, ...raw.payload } : raw.payload)
              : raw;
            this.trigger(eventName, data);
          }
        } catch (e) {
          console.error("Socket parse error:", e);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.stopHeartbeat();
        this.trigger("disconnect");
        this.handleReconnect();
      };

      this.ws.onerror = (err) => {
        this.trigger("connect_error", err);
      };
    } catch (err) {
      this.trigger("connect_error", err);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.intentionalDisconnect) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnect attempts reached. Please refresh the page.");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s
    const baseDelay = Math.pow(2, this.reconnectAttempts) * 1000;
    // Cap at 30 seconds
    const cappedDelay = Math.min(baseDelay, 30000);
    // Add 0-500ms jitter to prevent thundering herd
    const jitter = Math.floor(Math.random() * 500);
    const delay = cappedDelay + jitter;

    this.reconnectAttempts++;

    console.log(`[WebSocket] Disconnected. Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})...`);
    
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // We can just send a simple ping message. Fastify/ws allows custom ping payload or standard frame.
        // We will just send a JSON stringified ping event.
        this.ws.send(JSON.stringify({ action: "ping", type: "ping" }));
      }
    }, 25000); // 25s ping
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
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
    // Ensure all emitted messages wrap data in standard format
    const payload = JSON.stringify({ action, type: action, ...data });
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
      handlers.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
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

export function connectSocket(token, uid, username) {
  const s = getSocket();
  s.auth = {
    ...(token ? { token } : {}),
    ...(uid ? { uid, userId: uid } : {}),
    ...(username ? { username, displayName: username } : {}),
  };
  s.connect();
  return s;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
