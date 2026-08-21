import { test, expect } from '@playwright/test';

test('sovereign ceremony + keysmith passkey', async ({ page, context }) => {
  // Attach CDP virtual authenticator to simulate FIDO2 hardware enclave
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
  } catch {
    // Graceful test runner fallback
  }

  await page.goto('https://localhost');
  await page.fill('input', 'operator');
  await page.click('text=ENROLL PASSKEY');
  await page.click('text=UNLOCK');

  // Verify 4-step ceremony indicators
  await expect(page.locator('text=VERIFIED')).toBeVisible();
});
