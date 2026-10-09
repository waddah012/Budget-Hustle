const { test, expect } = require('@playwright/test');
async function start(page) {
    await page.goto('/'); await page.getByRole('button', { name: /Start a city run|Continue city run/ }).click();
}
async function quiz(page) {
    for (const answer of ['$10', 'Set aside money when paid', 'Unexpected essential costs']) {
        await page.getByRole('button', { name: answer, exact: true }).click();
        await page.getByRole('button', { name: /Next question|Finish round/ }).click();
    }
}
test('quiz pays once, unlocks next district, and persists', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await start(page);
    await page.getByRole('button', { name: 'Legacy Market, level 2, locked' }).click();
    await expect(page.locator('#overlay')).toBeHidden();
    await page.getByRole('button', { name: 'Budget Hub, level 1, open' }).click();
    await quiz(page);
    await expect(page.locator('#money')).toHaveText('$160');
    await expect(page.locator('#levelComplete')).toBeVisible();
    await page.getByRole('button', { name: 'Back to city' }).click();
    await expect(page.getByRole('button', { name: 'Legacy Market, level 2, open' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue city run' }).click();
    await expect(page.locator('#money')).toHaveText('$160');
    expect(errors).toEqual([]);
});
test('rapid answer attempts cannot advance or multiply rewards', async ({ page }) => {
    await start(page); await page.locator('#budget-hub').click();
    await page.getByRole('button', { name: '$10', exact: true }).dblclick();
    await expect(page.getByText('Question 1 of 3')).toBeVisible();
    await expect(page.locator('.feedback')).toHaveCount(1);
    await expect(page.locator('#money')).toHaveText('$0');
    await page.keyboard.press('Escape');
    await expect(page.locator('#overlay')).toBeHidden();
});
test('sprint counts clicks and discrete space presses, then pays once', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('budget-hustle-v1', JSON.stringify({ version: 1, money: 200, rep: 40, lives: 3, completed: ['budget-hub', 'market'] })));
    await start(page); await page.locator('#savings-cafe').click();
    await page.getByRole('button', { name: 'Start five-second round' }).click();
    await page.locator('#tapBtn').click();
    await page.keyboard.press('Space');
    await expect(page.locator('#sprintScore')).toHaveText('$10 earned');
    await expect(page.locator('#levelComplete')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('#money')).toHaveText('$240');
    await page.waitForTimeout(150);
    await expect(page.locator('#money')).toHaveText('$240');
    expect(errors).toEqual([]);
});
test('leaving a timed round clears pending reward', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('budget-hustle-v1', JSON.stringify({ version: 1, money: 200, rep: 40, lives: 3, completed: ['budget-hub', 'market'] })));
    await start(page); await page.locator('#savings-cafe').click();
    await page.getByRole('button', { name: 'Start five-second round' }).click();
    await page.locator('#tapBtn').click(); await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.waitForTimeout(5200);
    await expect(page.locator('#money')).toHaveText('$200');
    await expect(page.locator('#levelComplete')).toBeHidden();
});
test('mobile layout fits and reset requires an explicit second click', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await start(page);
    await page.screenshot({ path: testInfo.outputPath('city-mobile.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#budget-hub').click(); await quiz(page);
    await page.getByRole('button', { name: 'Back to city' }).click();
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Reset saved progress' }).click();
    await expect(page.locator('#money')).toHaveText('$160');
    await page.getByRole('button', { name: 'Click again to erase progress' }).click();
    await expect(page.locator('#money')).toHaveText('$0');
    await page.screenshot({ path: testInfo.outputPath('start-mobile.png') });
});
test('all ten districts are playable through the final result', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('budget-hustle-v1', JSON.stringify({ version: 1, money: 10000, rep: 0, lives: 3, completed: [] })));
    await start(page);
    for (const id of ['budget-hub', 'market', 'savings-cafe', 'bank', 'freedom-park', 'code-lab', 'tech-center', 'investment-hub', 'venture-vault', 'fin-tech-tower']) {
        await page.locator('#' + id).click();
        const sprint = page.getByRole('button', { name: 'Start five-second round' });
        if (await sprint.count()) {
            await sprint.click(); await page.locator('#tapBtn').click();
        } else {
            for (let i = 0; i < 3; i++) {
                await page.locator('#minigameContent .mg-btn').first().click();
                await page.getByRole('button', { name: /Next question|Finish round/ }).click();
            }
        }
        await expect(page.locator('#levelComplete')).toBeVisible({ timeout: 7000 });
        await page.getByRole('button', { name: 'Back to city' }).click();
    }
    await expect(page.locator('#currentLevel')).toHaveText('10/10 districts completed');
});
