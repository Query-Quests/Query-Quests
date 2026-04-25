# Prisma migrations

This directory is intentionally empty.

## Why

The project's earlier history (see `migrations.sqlite-archive/`) targeted
SQLite. Commit `2949df8` switched the schema to MySQL, but the SQLite-syntax
migration files were never re-runnable against MySQL. The effective workflow
since the switch has been `prisma db push`, which doesn't write to this
directory.

## Working with the schema

**Day to day:** apply schema changes locally with

```bash
cd src
npx prisma db push
```

This diffs `schema.prisma` against the connected MySQL database and applies
the difference. It does **not** create migration files.

**Production deploys:** the project ships explicit MySQL DDL files for the
breaking changes, applied manually:

- `docs/migrations/phase-a-schema.sql` — Phase A validator rewrite columns
- `docs/migrations/phase-b-schema.sql` — `ChallengeDataset` table
- `docs/migrations/phase-c-mysql.sql` — MySQL user-level limits

## If you want a real migration history

When the project is ready to maintain migrations going forward, baseline the
current schema:

```bash
cd src
npx prisma migrate dev --name init   # against an empty MySQL DB
```

This will populate `migrations/` with a single `init` migration matching
`schema.prisma`. Subsequent `prisma migrate dev` calls add incremental
migrations as the schema evolves.

## Archive

`../migrations.sqlite-archive/` preserves the SQLite-era migrations for
reference. Nothing in the live codebase reads it.
