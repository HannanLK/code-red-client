import { io, Socket } from 'socket.io-client';
import { env } from '@/utils/env';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/ws';

export class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelayMs = 500;

  connect(token?: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(env.NEXT_PUBLIC_SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: token ? { token } : undefined,
    });

    // Register default listeners
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') return;
      this.tryReconnect();
    });

    this.socket.connect();
    return this.socket;
  }

  private tryReconnect() {
    if (!this.socket) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(5000, this.baseDelayMs * 2 ** (this.reconnectAttempts - 1));
    setTimeout(() => {
      if (!this.socket) return;
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  get instance() {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketManager = new SocketManager();
