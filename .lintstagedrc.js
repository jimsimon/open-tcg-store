export default {
  '*.{ts,js,tsx,jsx}': (files) => {
    const filtered = files.filter((f) => !f.includes('.generated.'));
    if (filtered.length === 0) return [];
    return [`pnpm run lint:check ${filtered.join(' ')}`, `pnpm run format ${filtered.join(' ')}`];
  },
  '!(**/migrations/**).{json,css,html}': ['pnpm run format'],
};
