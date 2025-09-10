# Views

PostgreSQL

SQLite

MySQL

SingleStore

There’re several ways you can declare views with Drizzle ORM.

You can declare views that have to be created or you can declare views that already exist in the database.

You can declare views statements with an inline `query builder` syntax, with `standalone query builder` and with raw `sql` operators.

When views are created with either inlined or standalone query builders, view columns schema will be automatically inferred,
yet when you use `sql` you have to explicitly declare view columns schema.

### Declaring views

PostgreSQL

MySQL

SQLite

```
import { pgTable, pgView, serial, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: serial(),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const userView = pgView("user_view").as((qb) => qb.select().from(user));
export const customersView = pgView("customers_view").as((qb) => qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

```
import { text, mysqlTable, mysqlView, int, timestamp } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: int().primaryKey().autoincrement(),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const userView = mysqlView("user_view").as((qb) => qb.select().from(user));
export const customersView = mysqlView("customers_view").as((qb) => qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

```
import { integer, text, sqliteView, sqliteTable } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const userView = sqliteView("user_view").as((qb) => qb.select().from(user));
export const customersView = sqliteView("customers_view").as((qb) => qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

If you need a subset of columns you can use `.select({ ... })` method in query builder, like this:

```
export const customersView = pgView("customers_view").as((qb) => {
  return qb
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user);
});
```

```
CREATE VIEW "customers_view" AS SELECT "id", "name", "email" FROM "user" WHERE "role" = 'customer';
```

You can also declare views using `standalone query builder`, it works exactly the same way:

PostgreSQL

MySQL

SQLite

```
import { pgTable, pgView, serial, text, timestamp, QueryBuilder} from "drizzle-orm/pg-core";

const qb = new QueryBuilder();

export const user = pgTable("user", {
  id: serial(),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const userView = pgView("user_view").as(qb.select().from(user));
export const customersView = pgView("customers_view").as(qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

```
import { text, mysqlTable, mysqlView, int, timestamp, QueryBuilder } from "drizzle-orm/mysql-core";

const qb = new QueryBuilder();

export const user = mysqlTable("user", {
  id: int().primaryKey().autoincrement(),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const userView = mysqlView("user_view").as(qb.select().from(user));
export const customersView = mysqlView("customers_view").as(qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

```
import { integer, text, sqliteView, sqliteTable, QueryBuilder } from "drizzle-orm/sqlite-core";

const qb = new QueryBuilder();

export const user = sqliteTable("user", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const userView = sqliteView("user_view").as((qb) => qb.select().from(user));
export const customerView = sqliteView("customers_view").as((qb) => qb.select().from(user).where(eq(user.role, "customer")));
```

```
CREATE VIEW "user_view" AS SELECT * FROM "user";
CREATE VIEW "customers_view" AS SELECT * FROM "user" WHERE "role" = 'customer';
```

### Declaring views with raw SQL

Whenever you need to declare view using a syntax that is not supported by the query builder,
you can directly use `sql` operator and explicitly specify view columns schema.

```
// regular view
const newYorkers = pgView('new_yorkers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  cityId: integer('city_id').notNull(),
}).as(sql`select * from ${users} where ${eq(users.cityId, 1)}`);

// materialized view
const newYorkers = pgMaterializedView('new_yorkers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  cityId: integer('city_id').notNull(),
}).as(sql`select * from ${users} where ${eq(users.cityId, 1)}`);
```

### Declaring existing views

When you’re provided with a read only access to an existing view in the database you should use `.existing()` view configuration,
`drizzle-kit` will ignore and will not generate a `create view` statement in the generated migration.

```
export const user = pgTable("user", {
  id: serial(),
  name: text(),
  email: text(),
  password: text(),
  role: text().$type<"admin" | "customer">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// regular view
export const trimmedUser = pgView("trimmed_user", {
  id: serial("id"),
  name: text("name"),
  email: text("email"),
}).existing();

// materialized view won't make any difference, yet you can use it for consistency
export const trimmedUser = pgMaterializedView("trimmed_user", {
  id: serial("id"),
  name: text("name"),
  email: text("email"),
}).existing();
```

### Materialized views

PostgreSQL

MySQL

SQLite

According to the official docs, PostgreSQL has both **[`regular`](https://www.postgresql.org/docs/current/sql-createview.html)**
and **[`materialized`](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)** views.

Materialized views in PostgreSQL use the rule system like views do, but persist the results in a table-like form.

Drizzle ORM natively supports PostgreSQL materialized views:

```
const newYorkers = pgMaterializedView('new_yorkers').as((qb) => qb.select().from(users).where(eq(users.cityId, 1)));
```

```
CREATE MATERIALIZED VIEW "new_yorkers" AS SELECT * FROM "users";
```

You can then refresh materialized views in the application runtime:

```
await db.refreshMaterializedView(newYorkers);

await db.refreshMaterializedView(newYorkers).concurrently();

await db.refreshMaterializedView(newYorkers).withNoData();
```

### Extended example

All the parameters inside the query will be inlined, instead of replaced by `$1`, `$2`, etc.

```
// regular view
const newYorkers = pgView('new_yorkers')
  .with({
    checkOption: 'cascaded',
    securityBarrier: true,
    securityInvoker: true,
  })
  .as((qb) => {
    const sq = qb
      .$with('sq')
      .as(
        qb.select({ userId: users.id, cityId: cities.id })
          .from(users)
          .leftJoin(cities, eq(cities.id, users.homeCity))
          .where(sql`${users.age1} > 18`),
      );
    return qb.with(sq).select().from(sq).where(sql`${users.homeCity} = 1`);
  });

// materialized view
const newYorkers2 = pgMaterializedView('new_yorkers')
  .using('btree')
  .with({
    fillfactor: 90,
    toast_tuple_target: 0.5,
    autovacuum_enabled: true,
    ...
  })
  .tablespace('custom_tablespace')
  .withNoData()
  .as((qb) => {
    const sq = qb
      .$with('sq')
      .as(
        qb.select({ userId: users.id, cityId: cities.id })
          .from(users)
          .leftJoin(cities, eq(cities.id, users.homeCity))
          .where(sql`${users.age1} > 18`),
      );
    return qb.with(sq).select().from(sq).where(sql`${users.homeCity} = 1`);
  });
```
