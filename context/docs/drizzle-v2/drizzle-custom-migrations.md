# Migrations with Drizzle Kit

This guide assumes familiarity with:

- Get started with Drizzle and `drizzle-kit` \- [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/get-started)
- Drizzle schema foundamentals - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/sql-schema-declaration)
- Database connection basics - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/connect-overview)
- Drizzle migrations foundamentals - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/migrations)
- Drizzle Kit [overview](https://rqbv2.drizzle-orm-fe.pages.dev/docs/kit-overview) and [config file](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-config-file)
- `drizzle-kit generate` command - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-kit-generate)
- `drizzle-kit migrate` command - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-kit-migrate)

Drizzle lets you generate empty migration files to write your own custom SQL migrations
for DDL alternations currently not supported by Drizzle Kit or data seeding, which you can then run with [`drizzle-kit migrate`](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-kit-migrate) command.

```
drizzle-kit generate --custom --name=seed-users
```

```
📦 <project root>
 ├ 📂 drizzle
 │ ├ 📂 _meta
 │ ├ 📜 0000_init.sql
 │ └ 📜 0001_seed-users.sql
 ├ 📂 src
 └ …
```

```
-- ./drizzle/0001_seed-users.sql

INSERT INTO "users" ("name") VALUES('Dan');
INSERT INTO "users" ("name") VALUES('Andrew');
INSERT INTO "users" ("name") VALUES('Dandrew');
```

### Running JavaScript and TypeScript migrations

We will add ability to run custom JavaScript and TypeScript migration/seeding scripts in the upcoming release, you can follow [github discussion](https://github.com/drizzle-team/drizzle-orm/discussions/2832).
