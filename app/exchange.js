import { nanoid } from "nanoid";

import {
  init as stateInit,
  getAccounts as stateGetAccounts,
  setAccounts as stateSetAccounts,
  getRates as stateGetRates,
  setRates as stateSetRates,
  getLog as stateGetLog,
  appendLog,
  atomicFundsTransfer,
} from "./persistence.js";

export async function init() {
  await stateInit();
}

export async function getAccounts() {
  return stateGetAccounts();
}

export async function setAccountBalance(accountId, balance) {
  const accounts = await stateGetAccounts();
  const account = accounts.find((a) => a.id == accountId);
  if (account != null) {
    account.balance = balance;
    await stateSetAccounts(accounts);
  }
}

export async function getRates() {
  return stateGetRates();
}

export async function setRate({ baseCurrency, counterCurrency, rate }) {
  const rates = await stateGetRates();
  rates[baseCurrency][counterCurrency] = rate;
  rates[counterCurrency][baseCurrency] = Number((1 / rate).toFixed(5));
  await stateSetRates(rates);
}

export async function getLog() {
  return stateGetLog();
}

export async function exchange(exchangeRequest) {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId: clientBaseAccountId,
    counterAccountId: clientCounterAccountId,
    baseAmount,
  } = exchangeRequest;

  const [rates, accounts] = await Promise.all([stateGetRates(), stateGetAccounts()]);

  const exchangeRate = rates[baseCurrency][counterCurrency];
  const counterAmount = baseAmount * exchangeRate;
  const baseAccount = accounts.find((a) => a.currency === baseCurrency);
  const counterAccount = accounts.find((a) => a.currency === counterCurrency);

  const exchangeResult = {
    id: nanoid(),
    ts: new Date(),
    ok: false,
    request: exchangeRequest,
    exchangeRate: exchangeRate,
    counterAmount: 0.0,
    obs: null,
  };

  if (counterAccount.balance >= counterAmount) {
    const [t1, t2] = await Promise.all([
      transfer(clientBaseAccountId, baseAccount.id, baseAmount),
      transfer(counterAccount.id, clientCounterAccountId, counterAmount),
    ]);
    if (t1 && t2) {
        const { ok } = await atomicFundsTransfer(
          baseCurrency, counterCurrency, baseAmount, counterAmount
        );
        if (ok) {
          exchangeResult.ok = true;
          exchangeResult.counterAmount = counterAmount;
        } else {
          await transfer(counterAccount.id, clientBaseAccountId, baseAmount);
          exchangeResult.obs = "Not enough funds on counter currency account";
        }
    } else {
      exchangeResult.obs = "Could not complete transfers";
    }
  } else {
    exchangeResult.obs = "Not enough funds on counter currency account";
  }

  await appendLog(exchangeResult);

  return exchangeResult;
}

async function transfer(fromAccountId, toAccountId, amount) {
  const min = 200;
  const max = 400;
  return new Promise((resolve) =>
    setTimeout(() => resolve(true), Math.random() * (max - min + 1) + min)
  );
}

