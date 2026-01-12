const { test, expect } = require('@playwright/test');

const setSliderValue = async (page, label, value) => {
  const slider = page.getByLabel(label);
  await slider.waitFor();
  await slider.evaluate(
    (node, nextValue) => {
      node.value = String(nextValue);
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
};

test('standard workout flow', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /start workout/i }).click();
  await page.getByRole('button', { name: /start set/i }).click();

  await setSliderValue(page, /left cable length/i, 3.5);
  await setSliderValue(page, /right cable length/i, 3.5);

  await expect(page.locator('#leftCableDistance')).toContainText('3.5');
  await expect(page.locator('#rightCableDistance')).toContainText('3.5');

  await expect(page.locator('#leftCurrentResistance')).not.toHaveText('0');
  await expect(page.locator('#rightCurrentResistance')).not.toHaveText('0');

  await page.getByRole('button', { name: /pause/i }).click();
  await expect(page.getByRole('button', { name: /play/i })).toBeVisible();
  await page.getByRole('button', { name: /play/i }).click();

  await page.getByRole('button', { name: /end set/i }).click();
  await page.getByRole('button', { name: /end workout/i }).click();
});

test('force curve profiles and eccentric mode', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /start workout/i }).click();
  await page.getByRole('button', { name: /start set/i }).click();

  const modePill = page.locator('.force-pill.mode');
  await modePill.click();
  await expect(modePill).not.toHaveText(/linear/i);

  const eccentricPill = page.locator('.force-pill.eccentric');
  await eccentricPill.click();
  await expect(eccentricPill).toHaveAttribute('aria-pressed', 'true');

  await setSliderValue(page, /left cable length/i, 3.5);
  await setSliderValue(page, /right cable length/i, 3.5);

  const eccentricModePill = page.locator('.force-pill.eccentric-mode');
  const eccentricModeLabel = (await eccentricModePill.textContent()) || '';
  await eccentricModePill.click();
  await expect(eccentricModePill).not.toHaveText(eccentricModeLabel.trim());
});
