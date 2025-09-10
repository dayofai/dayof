# `drizzle-kit generate`

This guide assumes familiarity with:

- Get started with Drizzle and `drizzle-kit` \- [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/get-started)
- Drizzle schema foundamentals - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/sql-schema-declaration)
- Database connection basics - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/connect-overview)
- Drizzle migrations foundamentals - [read here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/migrations)
- Drizzle Kit [overview](https://rqbv2.drizzle-orm-fe.pages.dev/docs/kit-overview) and [config file](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-config-file)

`drizzle-kit generate` lets you generate SQL migrations based on you Drizzle schema upon declaration or on subsequent schema changes.

How it works under the hood?

Drizzle Kit `generate` command triggers a sequence of events:

1. It will read through your Drizzle schema file(s) and compose a json snapshot of your schema
2. It will read through your previous migrations folders and compare current json snapshot to the most recent one
3. Based on json differences it will generate SQL migrations
4. Save `migration.sql` and `snapshot.json` in migration folder under current timestamp

```
import * as p from "./drizzle-orm/pg-core";

export const users = p.pgTable("users", {
  id: p.serial().primaryKey(),
  name: p.text(),
  email: p.text().unique(),
};
```

```
┌────────────────────────┐
│ $ drizzle-kit generate │
└─┬──────────────────────┘
  │
  └ 1. read previous migration folders
    2. find diff between current and previous scheama
    3. prompt developer for renames if necessary
  ┌ 4. generate SQL migration and persist to file
  │    ┌─┴───────────────────────────────────────┐
  │      📂 drizzle
  │      ├ 📂 _meta
  │      └ 📜 0000_premium_mister_fear.sql
  v
```

```
-- drizzle/0000_premium_mister_fear.sql

CREATE TABLE "users" (
 "id" SERIAL PRIMARY KEY,
 "name" TEXT,
 "email" TEXT UNIQUE
);
```

It’s designed to cover [code first](https://rqbv2.drizzle-orm-fe.pages.dev/docs/migrations) approach of managing Drizzle migrations.
You can apply generated migrations using [`drizzle-kit migrate`](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-kit-migrate), using drizzle-orm’s `migrate()`,
using external migration tools like bytebase or running migrations yourself directly on the database.

`drizzle-kit generate` command requires you to provide both `dialect` and `schema` path options,
you can set them either via [drizzle.config.ts](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-config-file) config file or via CLI options

With config file

As CLI options

```
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
});
```

```
npx drizzle-kit generate
```

```
npx drizzle-kit generate --dialect=postgresql --schema=./src/schema.ts
```

### Schema files path

You can have a single `schema.ts` file or as many schema files as you want spread out across the project.
Drizzle Kit requires you to specify path(s) to them as a [glob](https://www.digitalocean.com/community/tools/glob?comments=true&glob=/**/*.js&matches=false&tests=//%20This%20will%20match%20as%20it%20ends%20with%20%27.js%27&tests=/hello/world.js&tests=//%20This%20won%27t%20match!&tests=/test/some/globs) via `schema` configuration option.

Example 1

Example 2

Example 3

Example 4

```
📦 <project root>
 ├ ...
 ├ 📂 drizzle
 ├ 📂 src
 │ ├ ...
 │ ├ 📜 index.ts
 │ └ 📜 schema.ts
 ├ 📜 drizzle.config.ts
 └ 📜 package.json
```

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
});
```

```
📦 <project root>
 ├ ...
 ├ 📂 drizzle
 ├ 📂 src
 │ ├ 📂 user
 │ │ ├ 📜 handler.ts
 │ │ └ 📜 schema.ts
 │ ├ 📂 posts
 │ │ ├ 📜 handler.ts
 │ │ └ 📜 schema.ts
 │ └ 📜 index.ts
 ├ 📜 drizzle.config.ts
 └ 📜 package.json
```

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/**/schema.ts",
  //or
  schema: ["./src/user/schema.ts", "./src/posts/schema.ts"]
});
```

```
📦 <project root>
 ├ ...
 ├ 📂 drizzle
 ├ 📂 src
 │ ├ 📂 schema
 │ │ ├ 📜 user.ts
 │ │ ├ 📜 post.ts
 │ │ └ 📜 comment.ts
 │ └ 📜 index.ts
 ├ 📜 drizzle.config.ts
 └ 📜 package.json
```

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/*",
});
```

```
📦 <project root>
 ├ ...
 ├ 📂 drizzle
 ├ 📂 src
 │ ├ 📜 userById.ts
 │ ├ 📜 userByEmail.ts
 │ ├ 📜 listUsers.ts
 │ ├ 📜 user.sql.ts
 │ ├ 📜 postById.ts
 │ ├ 📜 listPosts.ts
 │ └ 📜 post.sql.ts
 │ 📜 index.ts
 ├ 📜 drizzle.config.ts
 └ 📜 package.json
```

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/**/*.sql.ts", // Dax's favourite
});
```

### Custom migration file name

You can set custom migration file names by providing `--name` CLI option

```
npx drizzle-kit generate --name=init
```

```
📦 <project root>
 ├ 📂 drizzle
 │ ├ 📂 _meta
 │ └ 📜 0000_init.sql
 ├ 📂 src
 └ …
```

### Multiple configuration files in one project

You can have multiple config files in the project, it’s very useful when you have multiple database stages or multiple databases or different databases on the same project:

npm

yarn

pnpm

bun

```
npx drizzle-kit generate --config=drizzle-dev.config.ts
npx drizzle-kit generate --config=drizzle-prod.config.ts
```

```
yarn drizzle-kit generate --config=drizzle-dev.config.ts
yarn drizzle-kit generate --config=drizzle-prod.config.ts
```

```
pnpm drizzle-kit generate --config=drizzle-dev.config.ts
pnpm drizzle-kit generate --config=drizzle-prod.config.ts
```

```
bun drizzle-kit generate --config=drizzle-dev.config.ts
bun drizzle-kit generate --config=drizzle-prod.config.ts
```

```
📦 <project root>
 ├ 📂 drizzle
 ├ 📂 src
 ├ 📜 .env
 ├ 📜 drizzle-dev.config.ts
 ├ 📜 drizzle-prod.config.ts
 ├ 📜 package.json
 └ 📜 tsconfig.json
```

### Custom migrations

You can generate empty migration files to write your own custom SQL migrations
for DDL alternations currently not supported by Drizzle Kit or data seeding. Extended docs on custom migrations - [see here](https://rqbv2.drizzle-orm-fe.pages.dev/docs/kit-custom-migrations)

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

### Extended list of available configurations

`drizzle-kit generate` has a list of cli-only options

|          |                                         |
| -------- | --------------------------------------- |
| `custom` | generate empty SQL for custom migration |
| `name`   | generate migration with custom name     |

npm

yarn

pnpm

bun

```
npx drizzle-kit generate --name=init
npx drizzle-kit generate --name=seed_users --custom
```

```
yarn drizzle-kit generate --name=init
yarn drizzle-kit generate --name=seed_users --custom
```

```
pnpm drizzle-kit generate --name=init
pnpm drizzle-kit generate --name=seed_users --custom
```

```
bun drizzle-kit generate --name=init
bun drizzle-kit generate --name=seed_users --custom
```

---

We recommend configuring `drizzle-kit` through [drizzle.config.ts](https://rqbv2.drizzle-orm-fe.pages.dev/docs/drizzle-config-file) file,
yet you can provide all configuration options through CLI if necessary, e.g. in CI/CD pipelines, etc.

|               |            |                                                                              |
| ------------- | ---------- | ---------------------------------------------------------------------------- |
| `dialect`     | `required` | Database dialect, one of `postgresql` `mysql` `sqlite` `turso` `singlestore` |
| `schema`      | `required` | Path to typescript schema file(s) or folder(s) with multiple schema files    |
| `out`         |            | Migrations output folder, default is `./drizzle`                             |
| `config`      |            | Configuration file path, default is `drizzle.config.ts`                      |
| `breakpoints` |            | SQL statements breakpoints, default is `true`                                |

### Extended example

Example of how to create a custom postgresql migration file named `0001_seed-users.sql`
with Drizzle schema located in `./src/schema.ts` and migrations folder named `./migrations` instead of default `./drizzle`.

We will also place drizzle config file in the `configs` folder.

Let’s create config file:

```
📦 <project root>
 ├ 📂 migrations
 ├ 📂 configs
 │ └ 📜 drizzle.config.ts
 ├ 📂 src
 └ …
```

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
});
```

Now let’s run

```
npx drizzle-kit generate --config=./configs/drizzle.config.ts --name=seed-users --custom
```

And it will successfully generate

```
📦 <project root>
 ├ …
 ├ 📂 migrations
 │ ├ 📂 _meta
 │ ├ 📜 0000_init.sql
 │ └ 📜 0001_seed-users.sql
 └ …
```

```
-- ./drizzle/0001_seed-users.sql

INSERT INTO "users" ("name") VALUES('Dan');
INSERT INTO "users" ("name") VALUES('Andrew');
INSERT INTO "users" ("name") VALUES('Dandrew');
```
