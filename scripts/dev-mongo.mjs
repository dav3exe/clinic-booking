// Local in-memory MongoDB for development, so you do not need Atlas or Docker to try the app.
// Run `npm run dev:db`, then set MONGODB_URI=mongodb://127.0.0.1:27018/clinic in .env.local.
import { MongoMemoryServer } from "mongodb-memory-server";

const server = await MongoMemoryServer.create({ instance: { port: 27018 } });
console.log(`MongoDB ready: ${server.getUri("clinic")}`);
process.on("SIGINT", async () => {
  await server.stop();
  process.exit(0);
});
