import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoGamblingFlow } from '../src/services/guardrails.js';
test('blocks paid entry',()=>assert.throws(()=>assertNoGamblingFlow({entryFeeCents:1000,prizeSource:'SPONSOR'})));
test('allows free sponsor tournament',()=>assert.equal(assertNoGamblingFlow({entryFeeCents:0,rebuyCents:0,prizeSource:'SPONSOR',usesPlayerFunds:false,allowsChipCashout:false}),true));
