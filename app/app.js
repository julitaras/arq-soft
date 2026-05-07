import express from "express";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";

import rateLimit from "express-rate-limit";
await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60000,
  message: { error: 'Too many requests' }
});

app.use(globalLimiter)

const getLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 36000,
  message: { error: 'Too many requests' }
});

const putLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12000,
  message: { error: 'Too many requests' }
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 24000,
  message: { error: 'Too many requests' }
});

// ACCOUNT endpoints

app.get("/accounts", getLimiter, (req, res) => {
  res.json(getAccounts());
});

app.put("/accounts/:id/balance", putLimiter, (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    setAccountBalance(accountId, balance);

    res.json(getAccounts());
  }
});

// RATE endpoints

app.get("/rates", getLimiter, (req, res) => {
  res.json(getRates());
});

app.put("/rates", putLimiter, (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  setRate(newRateRequest);

  res.json(getRates());
});

// LOG endpoint

app.get("/log", getLimiter, (req, res) => {
  res.json(getLog());
});

// EXCHANGE endpoint
app.post("/exchange", postLimiter, async (req, res) => {
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

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);

  if (exchangeResult.ok) {
    res.status(200).json(exchangeResult);
  } else {
    res.status(500).json(exchangeResult);
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
