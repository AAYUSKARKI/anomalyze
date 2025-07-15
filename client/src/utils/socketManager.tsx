// src/utils/socketManager.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let endpoint: string | null = null;

type Callback = (socket: Socket) => void;

export const initSocket = (url: string, onConnect?: Callback, onError?: Callback): Socket => {
  if (socket && endpoint === url) return socket; // Already connected

  if (socket) {
    socket.disconnect();
  }

  socket = io(url, {
    reconnectionAttempts: 3,
    timeout: 10000,
  });

  endpoint = url;

  if (onConnect) socket.once("connect", () => onConnect(socket!));
  if (onError) socket.once("connect_error", () => onError(socket!));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const isConnected = (): boolean => !!socket?.connected;

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    endpoint = null;
  }
};
