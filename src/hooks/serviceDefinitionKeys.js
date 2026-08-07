// Stable query-key factory for the public service-definition catalogue
// (mirrors damageImageKeys.js's structure). This data carries no signed
// URLs and no per-user scoping - the server route is public and always
// active-only - so unlike damageImageKeys it is never cleared on logout.
export const serviceDefinitionKeys = {
    all: ['service-definitions'],
    list: () => [...serviceDefinitionKeys.all, 'list'],
};
