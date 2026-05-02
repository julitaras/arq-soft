import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://exchange-redis:6379";

export const KEYS = {
  accounts: "state:accounts",
  rates: "state:rates",
  log: "state:log",
};

let client;

export async function init() {
  client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  console.log("Connected to Redis at", REDIS_URL);
}

export async function getAccounts() {
  return JSON.parse(await client.get(KEYS.accounts));
}

export async function setAccounts(accounts) {
  await client.set(KEYS.accounts, JSON.stringify(accounts));
}

export async function getRates() {
  return JSON.parse(await client.get(KEYS.rates));
}

export async function setRates(rates) {
  await client.set(KEYS.rates, JSON.stringify(rates));
}

export async function getLog() {
  const entries = await client.lRange(KEYS.log, 0, -1);
  return entries.map((e) => JSON.parse(e));
}

export async function appendLog(entry) {
  await client.rPush(KEYS.log, JSON.stringify(entry));
}
