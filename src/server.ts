import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import app from "./app";
import config from "./config";
import { notificationServices } from "./app/modules/notifications/notification.service";
import prisma from "./shared/prisma";
import seedSuperAdmin from "./app/Admin";

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  userId?: string;
}

const port = config.port || 5000;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log("Server is running on port ", port);
  });

  await seedSuperAdmin();
}

main();
