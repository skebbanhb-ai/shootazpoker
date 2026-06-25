import test from 'node:test'; import assert from 'node:assert/strict'; import { evaluateSeven } from '../src/game/handEvaluator.js';
test('royal flush',()=>assert.equal(evaluateSeven(['AH','KH','QH','JH','TH','2C','3D']).name,'Royal Flush'));
test('wheel straight',()=>{ const r=evaluateSeven(['AH','2C','3D','4S','5H','9C','KD']); assert.equal(r.name,'Straight'); assert.equal(r.tiebreakers[0],5); });
