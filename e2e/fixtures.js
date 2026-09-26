import { test as base, expect } from '@playwright/test';

export const API = 'https://api.e2e.invalid';
const APP_ORIGIN = 'http://127.0.0.1:4173';

// The app and the fake API are different origins, so faked answers still
// need CORS headers or the browser would discard them.
const CORS_HEADERS = {
    'access-control-allow-origin': APP_ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

// A small, realistic catalogue in the exact public GET /service-definitions
// shape (see src/utils/serviceDefinitionCatalog.js#isWellFormedDefinition).
export const CATALOGUE = {
    serviceDefinitions: [
        {
            id: 'e2e-def-phone-screen', productCategorySlug: 'smartphone', repairCategorySlug: 'display-screen',
            label: 'Screen replacement', description: 'Cracked or dead screen replaced.',
            pricingEstimate: { currency: 'BDT', min: 1500, max: 6000, inspectionFee: 200 },
            requiredExpertiseLevel: 'intermediate', estimatedDurationMinutes: 90, inspectionRequired: true,
            imageRequirements: { min: 0, max: 3, recommended: true },
        },
        {
            id: 'e2e-def-laptop-battery', productCategorySlug: 'laptop', repairCategorySlug: 'battery-power',
            label: 'Battery replacement', description: 'Battery that no longer holds a charge.',
            pricingEstimate: { currency: 'BDT', min: 2500, max: 8000, inspectionFee: 300 },
            requiredExpertiseLevel: 'intermediate', estimatedDurationMinutes: 120, inspectionRequired: true,
            imageRequirements: { min: 0, max: 3, recommended: false },
        },
    ],
};

// Every test gets:
//  - `api`: register fake API answers per test, e.g.
//        api.on('GET', '/public/trackings/SRB-abc', { status: 200, json: {...} })
//    /service-definitions answers with CATALOGUE unless a test overrides it;
//    any other API call gets a 503 (so a page's error state shows, instead of
//    a real network request), and is listed in `api.unhandled`.
//  - no outside network: anything that is not the local app or the fake API
//    (Firebase, Google Fonts, image hosts) is blocked.
//  - a check that the page threw no uncaught JavaScript error.
export const test = base.extend({
    api: [async ({ page }, use) => {
        const handlers = new Map();
        const unhandled = [];
        const api = {
            on(method, path, response) { handlers.set(`${method} ${path}`, response); },
            unhandled,
        };
        api.on('GET', '/service-definitions', { status: 200, json: CATALOGUE });

        await page.route('**/*', async (route) => {
            const url = new URL(route.request().url());
            if (url.origin === API) {
                const key = `${route.request().method()} ${url.pathname}`;
                const response = handlers.get(key);
                if (response) {
                    return route.fulfill({ status: response.status ?? 200, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify(response.json ?? {}) });
                }
                if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS_HEADERS });
                unhandled.push(key);
                return route.fulfill({ status: 503, headers: CORS_HEADERS, contentType: 'application/json', body: '{"message":"not faked in this test"}' });
            }
            if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
            return route.abort('blockedbyclient');
        });

        await use(api);
    }, { auto: true }],

    pageErrors: [async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await use(errors);
        expect(errors, 'the page threw an uncaught JavaScript error').toEqual([]);
    }, { auto: true }],
});

export { expect };
