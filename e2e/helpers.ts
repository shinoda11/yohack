import { Page } from '@playwright/test';

/**
 * Skip onboarding dialogs by setting localStorage flags,
 * then reload the page so the app picks them up.
 */
export async function skipOnboarding(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('yohack-onboarding-complete', 'complete');
    localStorage.setItem('yohack-profile-edited', '1');
    localStorage.setItem('yohack-brand-story-seen', '1');
  });
}

/** Wait for simulation results to render (score number visible). */
export async function waitForSimulation(page: Page) {
  // Wait for the "/100" text to appear — it's always visible when score renders
  await page.locator('text=/100').first().waitFor({
    state: 'visible',
    timeout: 15_000,
  });
  // Extra settle time for animations (800ms count-up + stagger)
  await page.waitForTimeout(1200);
}

/** Navigate to an /app/* page with onboarding skipped. */
export async function gotoApp(page: Page, path: string) {
  // First visit to set localStorage
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await skipOnboarding(page);
  // Now navigate to the target page
  await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(800);
}
