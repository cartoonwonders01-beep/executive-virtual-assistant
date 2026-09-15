import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Eve v2 Multi-Viewport Visual Regression Audit', () => {
  test.beforeAll(() => {
    const dir = path.resolve('.agents/visual_audit');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('renders executive workspace and captures viewport screenshot', async ({ page }, testInfo) => {
    // 1. Navigate to local preview
    await page.goto('/');

    // 2. Wait for root DOM container
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // 3. Verify title and document structure
    await expect(page).toHaveTitle(/Executive AI Assistant/i);

    // 4. Capture screenshot
    const screenshotPath = path.resolve(`.agents/visual_audit/${testInfo.project.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    expect(fs.existsSync(screenshotPath)).toBe(true);
  });
});
