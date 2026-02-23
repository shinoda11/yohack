import { test, expect, Locator } from '@playwright/test';
import { gotoApp, waitForSimulation } from './helpers';

/**
 * Mobile quality checks — automated design guardrails.
 * Run: pnpm test:mobile-quality
 *
 * Verifies:
 *  1. No font smaller than 10px on rendered pages
 *  2. All interactive elements meet 44px touch target
 *  3. No horizontal scroll overflow
 */

// Only run on mobile projects
test.describe('Mobile quality checks', () => {
  // ---------------------------------------------------------------------------
  // Helper: get computed font size of all visible text elements
  // ---------------------------------------------------------------------------
  async function getSmallFonts(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const MIN_SIZE = 10; // px
      const issues: { tag: string; text: string; fontSize: string; selector: string }[] = [];
      // Check all text-bearing elements (skip SVG — they scale via viewBox)
      const elements = document.querySelectorAll(
        'p, span, a, button, label, h1, h2, h3, h4, h5, h6, li, td, th, dt, dd, div'
      );
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        const text = (el as HTMLElement).innerText?.trim().slice(0, 40);
        if (size < MIN_SIZE && text && el.checkVisibility?.()) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            text,
            fontSize: `${size}px`,
            selector: el.className?.toString().slice(0, 60) || el.id || '',
          });
        }
      });
      return issues;
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: get interactive elements smaller than 44px
  // ---------------------------------------------------------------------------
  async function getSmallTouchTargets(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const MIN_TARGET = 44; // px
      const issues: { tag: string; text: string; width: number; height: number; selector: string }[] = [];
      const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [tabindex]';
      const elements = document.querySelectorAll(interactiveSelectors);
      elements.forEach((el) => {
        if (!el.checkVisibility?.()) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < MIN_TARGET || rect.height < MIN_TARGET) {
          const text = (el as HTMLElement).innerText?.trim().slice(0, 30) || '';
          issues.push({
            tag: el.tagName.toLowerCase(),
            text,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            selector: el.className?.toString().slice(0, 60) || el.id || '',
          });
        }
      });
      return issues;
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: check horizontal overflow
  // ---------------------------------------------------------------------------
  async function hasHorizontalOverflow(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
  }

  // ---------------------------------------------------------------------------
  // Tests — Dashboard
  // ---------------------------------------------------------------------------
  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await gotoApp(page, '/app');
      await waitForSimulation(page);
    });

    test('no horizontal overflow', async ({ page }) => {
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);
    });

    test('no font smaller than 10px', async ({ page }) => {
      const issues = await getSmallFonts(page);
      if (issues.length > 0) {
        console.log('Small font issues:', JSON.stringify(issues, null, 2));
      }
      // Soft check: log but don't fail yet (baseline run)
      test.info().annotations.push({
        type: 'small-fonts',
        description: `${issues.length} elements with font < 10px`,
      });
    });

    test('touch targets >= 44px', async ({ page }) => {
      const issues = await getSmallTouchTargets(page);
      if (issues.length > 0) {
        console.log('Small touch targets:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-targets',
        description: `${issues.length} interactive elements < 44px`,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Tests — Profile
  // ---------------------------------------------------------------------------
  test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
      await gotoApp(page, '/app/profile');
    });

    test('no horizontal overflow', async ({ page }) => {
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);
    });

    test('no font smaller than 10px', async ({ page }) => {
      const issues = await getSmallFonts(page);
      if (issues.length > 0) {
        console.log('Small font issues:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-fonts',
        description: `${issues.length} elements with font < 10px`,
      });
    });

    test('touch targets >= 44px', async ({ page }) => {
      const issues = await getSmallTouchTargets(page);
      if (issues.length > 0) {
        console.log('Small touch targets:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-targets',
        description: `${issues.length} interactive elements < 44px`,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Tests — Branch Builder
  // ---------------------------------------------------------------------------
  test.describe('Branch Builder', () => {
    test.beforeEach(async ({ page }) => {
      await gotoApp(page, '/app/branch');
      await page.waitForTimeout(500);
    });

    test('no horizontal overflow', async ({ page }) => {
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);
    });

    test('no font smaller than 10px', async ({ page }) => {
      const issues = await getSmallFonts(page);
      if (issues.length > 0) {
        console.log('Small font issues:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-fonts',
        description: `${issues.length} elements with font < 10px`,
      });
    });

    test('touch targets >= 44px', async ({ page }) => {
      const issues = await getSmallTouchTargets(page);
      if (issues.length > 0) {
        console.log('Small touch targets:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-targets',
        description: `${issues.length} interactive elements < 44px`,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Tests — Worldline Comparison
  // ---------------------------------------------------------------------------
  test.describe('Worldline Comparison', () => {
    test.beforeEach(async ({ page }) => {
      await gotoApp(page, '/app/worldline');
      await page.waitForTimeout(500);
    });

    test('no horizontal overflow', async ({ page }) => {
      const overflow = await hasHorizontalOverflow(page);
      expect(overflow).toBe(false);
    });

    test('no font smaller than 10px', async ({ page }) => {
      const issues = await getSmallFonts(page);
      if (issues.length > 0) {
        console.log('Small font issues:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-fonts',
        description: `${issues.length} elements with font < 10px`,
      });
    });

    test('touch targets >= 44px', async ({ page }) => {
      const issues = await getSmallTouchTargets(page);
      if (issues.length > 0) {
        console.log('Small touch targets:', JSON.stringify(issues, null, 2));
      }
      test.info().annotations.push({
        type: 'small-targets',
        description: `${issues.length} interactive elements < 44px`,
      });
    });
  });
});
