# Legacy database imports

Place MySQL/phpMyAdmin dumps here:

- `novasori_novaosp.sql` — Novasori legacy export (symlink or copy)

Import Novasori catalog:

```bash
npm run db:import-novasori
```

Re-import and update existing rows:

```bash
npm run db:import-novasori -- --force-update
```

Product images must be in `public/products/` (see project `products/` folder).
