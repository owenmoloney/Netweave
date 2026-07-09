import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@netweave.app`;
const TEST_PASSWORD = 'password123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Netweave').first()).toBeVisible({ timeout: 15000 });
}

test.describe('Netweave E2E', () => {
  test('user can add a person and company and connect them', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Add Company' }).click();
    await page.getByLabel('Company name *').fill('E2E Corp');
    await page.getByRole('button', { name: 'Add Company' }).last().click();

    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByLabel('Full name *').fill('E2E Person');
    await page.getByRole('button', { name: 'Add Person' }).last().click();

    await expect(page.getByText('E2E Person')).toBeVisible();
    await expect(page.getByText('E2E Corp')).toBeVisible();
  });

  test('clicking a node opens the detail panel', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByLabel('Full name *').fill('Panel Test');
    await page.getByRole('button', { name: 'Add Person' }).last().click();

    await expect(page.getByRole('heading', { name: 'Panel Test' })).toBeVisible();
    await expect(page.getByText('Connections')).toBeVisible();
  });

  test('search finds a node and focuses the canvas on it', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByLabel('Full name *').fill('Searchable Alice');
    await page.getByRole('button', { name: 'Add Person' }).last().click();

    await page.keyboard.press('Meta+k');
    await page.getByPlaceholder('Search people and companies…').fill('Searchable');
    await page.getByText('Searchable Alice').click();

    await expect(page.getByRole('heading', { name: 'Searchable Alice' })).toBeVisible();
  });

  test('deleting a node removes it from the panel', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByLabel('Full name *').fill('To Delete');
    await page.getByRole('button', { name: 'Add Person' }).last().click();

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).last().click();

    await expect(page.getByRole('heading', { name: 'To Delete' })).not.toBeVisible();
  });
});
