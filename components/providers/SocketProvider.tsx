"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect if a Socket.IO URL is explicitly configured
    if (!SOCKET_URL) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    // Listen for PO status updates
    s.on("po:status_updated", (data: { reference_number: string; status: string }) => {
      toast.info(`PO ${data.reference_number} status changed to ${data.status}`);
    });

    // Listen for new PO notifications
    s.on("po:created", (data: { reference_number: string }) => {
      toast.info(`New PO created: ${data.reference_number}`);
    });

    // Listen for stock alerts
    s.on("stock:low", (data: { product_name: string; quantity: number }) => {
      toast.warning(`Low stock alert: ${data.product_name} (${data.quantity} remaining)`);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
