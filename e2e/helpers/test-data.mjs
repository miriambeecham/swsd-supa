// e2e/helpers/test-data.mjs
// Loads test schedule data written by scripts/e2e-data-setup.mjs

import { readFileSync, existsSync } from 'fs';

let _data = null;

export function getTestData() {
  if (_data) return _data;
  if (existsSync('e2e-test-data.json')) {
    _data = JSON.parse(readFileSync('e2e-test-data.json', 'utf-8'));
    return _data;
  }
  throw new Error('e2e-test-data.json not found. Run: node scripts/e2e-data-setup.mjs');
}

/**
 * Navigate to a booking page with the correct React Router state.
 * The booking pages require location.state.classSchedule, which is
 * normally set by clicking "Sign Up" on the public classes page.
 * We replicate this by navigating to the public page first, then
 * using page.evaluate to call React Router's navigate().
 */
export async function navigateToBooking(page, type) {
  const data = getTestData();
  const entry = data[type];
  if (!entry) throw new Error(`No test data for type: ${type}`);

  const { scheduleId, classSchedule } = entry;

  const isMotherDaughter = classSchedule.type === 'public: mother & daughter';
  const path = isMotherDaughter
    ? `/book-mother-daughter-class/${scheduleId}`
    : `/book-adult-class/${scheduleId}`;

  // Navigate to the booking page URL first
  await page.goto(path);

  // The page will show "No Class Selected" because there's no state.
  // Inject the state via history.replaceState and reload.
  // React Router v7 stores state in history.state.usr
  await page.evaluate(({ path, classSchedule }) => {
    const state = { usr: { classSchedule }, key: 'test' };
    window.history.replaceState(state, '', path);
  }, { path, classSchedule });

  // Reload to pick up the state
  await page.reload();
}
