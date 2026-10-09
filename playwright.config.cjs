const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
    testDir: './tests', testMatch: '**/*.spec.cjs', timeout: 30000,
    use: { baseURL: 'http://127.0.0.1:5180', browserName: 'chromium' },
    webServer: { command: 'npm start', url: 'http://127.0.0.1:5180', reuseExistingServer: !process.env.CI }
});
