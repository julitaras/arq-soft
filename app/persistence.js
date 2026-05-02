import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

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

const EXCHANGE_ACCOUNTS_SCRIPT = `
local accounts = cjson.decode(redis.call('GET', KEYS[1]))
local baseCurrency = ARGV[1]
local counterCurrency = ARGV[2]
local baseAmount = tonumber(ARGV[3])
local counterAmount = tonumber(ARGV[4])
local baseAcc = nil
local counterAcc = nil
for _, acc in ipairs(accounts) do
  if acc['currency'] == baseCurrency then baseAcc = acc end
  if acc['currency'] == counterCurrency then counterAcc = acc end
end
if counterAcc == nil or baseAcc == nil then
  return redis.error_reply('Account not found')
end
if counterAcc['balance'] < counterAmount then
  return cjson.encode({ok = false})
end
baseAcc['balance'] = baseAcc['balance'] + baseAmount
counterAcc['balance'] = counterAcc['balance'] - counterAmount
redis.call('SET', KEYS[1], cjson.encode(accounts))
return cjson.encode({ok = true})
`;

export async function atomicFundsTransfer(baseCurrency, counterCurrency, baseAmount, counterAmount) {
  const result = await client.eval(EXCHANGE_ACCOUNTS_SCRIPT, {
    keys: [KEYS.accounts],
    arguments: [baseCurrency, counterCurrency, String(baseAmount), String(counterAmount)],
  });
  return JSON.parse(result);
}
