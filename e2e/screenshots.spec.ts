import { test } from '@playwright/test';
import { gotoApp, waitForSimulation } from './helpers';

const SCREENSHOT_DIR = 'e2e/screenshots';

/**
 * Full-page screenshots of the 4 main app pages.
 * Run: pnpm test:screenshots
 *
 * These capture visual snapshots for design review, not assertions.
 * Screenshots are saved to e2e/screenshots/{project}/{page}.png
 */

test.describe('Full-page screenshots', () => {
  test('Dashboard', async ({ page }, testInfo) => {
    await gotoApp(page, '/app');
    await waitForSimulation(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${testInfo.project.name}/dashboard.png`,
      fullPage: true,
    });
  });

  test('Profile', async ({ page }, testInfo) => {
    await gotoApp(page, '/app/profile');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${testInfo.project.name}/profile.png`,
      fullPage: true,
    });
  });

  test('Branch Builder', async ({ page }, testInfo) => {
    await gotoApp(page, '/app/branch');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${testInfo.project.name}/branch.png`,
      fullPage: true,
    });
  });

  test('Worldline Comparison', async ({ page }, testInfo) => {
    await gotoApp(page, '/app/worldline');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${testInfo.project.name}/worldline.png`,
      fullPage: true,
    });
  });
});
