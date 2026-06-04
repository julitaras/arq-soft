import express from "express";
import dgram from "dgram";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";

const STATSD_HOST = process.env.STATSD_HOST || "graphite";
const STATSD_PORT = 8125;

function sendStatsd(metric, value, type = "c") {
  const message = Buffer.from(`${metric}:${value}|${type}`);
  const client = dgram.createSocket("udp4");
  client.send(message, STATSD_PORT, STATSD_HOST, () => client.close());
}

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", async (req, res) => {
  res.json(await getAccounts());
});

app.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    await setAccountBalance(accountId, balance);
    res.json(await getAccounts());
  }
});

// RATE endpoints

app.get("/rates", async (req, res) => {
  res.json(await getRates());
});

app.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  await setRate({ ...req.body });
  res.json(await getRates());
});

// LOG endpoint

app.get("/log", async (req, res) => {
  res.json(await getLog());
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeResult = await exchange({ ...req.body });

  if (exchangeResult.ok) {
    const { baseCurrency, counterCurrency, baseAmount } = exchangeRequest;
    const counterAmount = exchangeResult.counterAmount;

    sendStatsd(`business.volume.${baseCurrency}`, baseAmount);
    sendStatsd(`business.volume.${counterCurrency}`, counterAmount);
    sendStatsd(`business.net.${baseCurrency}`, baseAmount);
    sendStatsd(`business.net.${counterCurrency}`, -counterAmount);

    res.status(200).json(exchangeResult);
  } else {
    res.status(500).json(exchangeResult);
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
