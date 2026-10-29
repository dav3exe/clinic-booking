import dns from "node:dns";
import mongoose from "mongoose";
import { BookingModel } from "@/models/booking";
import { IdempotencyModel } from "@/models/idempotency-record";
import { RateLimitModel } from "@/models/rate-limit";
import { SlotModel } from "@/models/slot";

// Cached on globalThis so warm serverless invocations (and dev hot reloads) reuse one connection.
const globalCache = globalThis as typeof globalThis & { __mongo?: Promise<typeof mongoose> };

async function connect(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  // Some local networks refuse the SRV lookup behind mongodb+srv:// URIs; opt into public resolvers locally.
  const dnsServers = process.env.MONGODB_DNS_SERVERS;
  if (dnsServers) {
    const servers = dnsServers.split(",").map((server) => server.trim());
    // The driver resolves SRV through dns.promises, which keeps its own server list.
    dns.setServers(servers);
    dns.promises.setServers(servers);
  }
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 });
  // Indexes (esp. the partial unique one on bookings) must exist before the first write.
  await Promise.all([
    SlotModel.init(),
    BookingModel.init(),
    IdempotencyModel.init(),
    RateLimitModel.init(),
  ]);
  return conn;
}

export function connectDb(): Promise<typeof mongoose> {
  if (!globalCache.__mongo) {
    globalCache.__mongo = connect().catch((err) => {
      globalCache.__mongo = undefined;
      throw err;
    });
  }
  return globalCache.__mongo;
}
