import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "moonDB";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoPromise: Promise<MongoClient> | undefined;
}

let client = global._mongoClient;
let promise = global._mongoPromise;

if (!client) {
  client = new MongoClient(MONGODB_URI);
  promise = client.connect();
  global._mongoClient = client;
  global._mongoPromise = promise;
}

export async function connectDB(): Promise<Db> {
  await promise;
  return client!.db(DB_NAME);
}
