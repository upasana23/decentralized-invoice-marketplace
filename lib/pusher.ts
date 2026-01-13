import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID) {
  console.warn("PUSHER_APP_ID is not set. Real-time chat will be disabled on the server.");
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "eu",
  useTLS: true,
});
