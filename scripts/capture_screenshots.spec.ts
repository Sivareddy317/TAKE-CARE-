import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('docs/screenshots');

test.use({
  viewport: { width: 390, height: 844 },
  channel: 'msedge',
});

test('Capture mobile evidence screenshots', async ({ page }) => {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. Login / Welcome Screen
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01_login.png') });
  console.log('Saved 01_login.png');

  // Trigger login: Fill phone number and password if on login form, or switch to demo mode
  // Check if sign-in button is visible
  const signInBtn = page.locator('text="Sign In"').first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await page.waitForTimeout(500);
  }

  // Look for Demo Mode toggle or enter credentials
  const demoToggle = page.locator('button:has-text("Switch to Demo"), button:has-text("Try Demo Mode"), button:has-text("Demo Account")').first();
  if (await demoToggle.isVisible()) {
    await demoToggle.click();
    await page.waitForTimeout(1000);
  } else {
    // Fill login inputs
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="mobile" i], input[placeholder*="phone" i]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
      const pwdInput = page.locator('input[type="password"]').first();
      if (await pwdInput.isVisible()) {
        await pwdInput.fill('Password123!');
      }
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  }

  // 2. Upload Screen
  const uploadNav = page.locator('button:has-text("Upload"), button[aria-label="Upload"], .material-symbols-outlined:has-text("add_circle"), .material-symbols-outlined:has-text("upload")').first();
  if (await uploadNav.isVisible()) {
    await uploadNav.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '02_upload.png') });
    console.log('Saved 02_upload.png');
  }

  // 3 & 4. Extraction with Source Highlighting & Review Screen
  // Simulate or view a document review
  const reviewBtn = page.locator('text="Review", button:has-text("Review"), button:has-text("Verify")').first();
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '03_extraction_with_source_highlight.png') });
  await page.screenshot({ path: path.join(OUT_DIR, '04_review_screen.png') });
  console.log('Saved 03 & 04');

  // 5. Health Summary
  const summaryNav = page.locator('button:has-text("Summary"), text="Summary"').first();
  if (await summaryNav.isVisible()) {
    await summaryNav.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '05_summary.png') });
    console.log('Saved 05_summary.png');
  }

  // 6. Emergency PDF
  const emergencyBtn = page.locator('button:has-text("Emergency"), text="Emergency"').first();
  if (await emergencyBtn.isVisible()) {
    await emergencyBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '06_emergency_pdf.png') });
    console.log('Saved 06_emergency_pdf.png');
    // Close modal if open
    const closeBtn = page.locator('button:has-text("Close"), .material-symbols-outlined:has-text("close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 7. Doctor Code Entry / Share Code
  const shareBtn = page.locator('button:has-text("Share"), button:has-text("Doctor"), text="Share with Doctor"').first();
  if (await shareBtn.isVisible()) {
    await shareBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '07_doctor_code_entry.png') });
    console.log('Saved 07_doctor_code_entry.png');
  }

  // 8. Doctor View
  await page.goto('http://localhost:3000/doctor-portal');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '08_doctor_view.png') });
  console.log('Saved 08_doctor_view.png');

  // 9. Ask Care
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  const askCareNav = page.locator('button:has-text("Ask"), button:has-text("Care"), button:has-text("Ayu")').first();
  if (await askCareNav.isVisible()) {
    await askCareNav.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '09_ask_care.png') });
    console.log('Saved 09_ask_care.png');
  }

  // 10. Profile & Settings
  const profileNav = page.locator('button:has-text("Profile"), button:has-text("Settings"), text="Profile"').first();
  if (await profileNav.isVisible()) {
    await profileNav.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '10_profile.png') });
    console.log('Saved 10_profile.png');
  }
});
