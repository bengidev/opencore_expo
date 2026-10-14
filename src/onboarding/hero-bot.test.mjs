import assert from 'node:assert/strict';
import test from 'node:test';
import { botAvatarPresets, parseColor, shade } from 'bot-avatars';
import * as heroBot from './hero-bot.ts';

test('keeps crisp ghost and touch interaction enabled', () => {
  assert.equal(heroBot.ONBOARDING_HERO_BOT.shading, 'crisp');
  assert.equal(heroBot.ONBOARDING_HERO_BOT.depth, 0.65);
  assert.equal(heroBot.ONBOARDING_HERO_BOT.interactive, true);
  assert.equal(heroBot.INITIAL_ONBOARDING_HERO.type, 'ghost');
  assert.equal(heroBot.INITIAL_ONBOARDING_HERO.jumpEvery, 0);
});

test('uses the web ghost palette with its original saturation', () => {
  const saturation = heroBot.ONBOARDING_HERO_BOT.saturation ?? 1.5;
  const body = shade(botAvatarPresets.ghost.color, 0, (saturation - 1) * 0.5);

  assert.deepEqual(parseColor(body), [242.978025, 239.88105, 252.26895]);
});

test('uses one original ghost body color in every theme', () => {
  assert.equal(heroBot.ONBOARDING_HERO_COLOR, botAvatarPresets.ghost.color);
});

test('selects a single hop-only preset', () => {
  const hop = heroBot.randomizeOnboardingHero('ghost', () => 0);

  assert.equal(hop.type, 'ghost');
  assert.equal(hop.state, 'default');
  assert.equal(hop.speed, 1);
  assert.equal(hop.jumpSpin, 0);
  assert.equal(hop.whirl, 0);
  assert.equal(hop.jumpEvery, 0);
});

test('selects one spin-hop preset at the same tempo', () => {
  const spinHop = heroBot.randomizeOnboardingHero('ghost', () => 0.999);

  assert.equal(spinHop.type, 'ghost');
  assert.equal(spinHop.state, 'default');
  assert.equal(spinHop.speed, 1);
  assert.equal(spinHop.jumpSpin, 1);
  assert.equal(spinHop.whirl, 0.4);
  assert.equal(spinHop.jumpEvery, 0);
  assert.equal(spinHop.jumpTime, heroBot.INITIAL_ONBOARDING_HERO.jumpTime);
  assert.equal(spinHop.jumpSquashEase, heroBot.INITIAL_ONBOARDING_HERO.jumpSquashEase);
});

test('holds tap input through the full click motion', () => {
  const expected = 0.24 + 0.68 + (2 / 7) * 0.24 + 0.11 + 0.33 + 0.05;
  const duration = heroBot.tapMotionDurationSeconds(heroBot.INITIAL_ONBOARDING_HERO, 1);

  assert.ok(Math.abs(duration - expected) < 1e-9);
  assert.ok(Math.abs(heroBot.tapMotionDurationSeconds(heroBot.INITIAL_ONBOARDING_HERO, 2) - expected / 2) < 1e-9);
});
