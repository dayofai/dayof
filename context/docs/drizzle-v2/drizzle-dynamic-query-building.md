# Dynamic query building

By default, as all the query builders in Drizzle try to conform to SQL as much as possible, you can only invoke most of the methods once.
For example, in a `SELECT` statement there might only be one `WHERE` clause, so you can only invoke `.where()` once:

```
const query = db
	.select()
	.from(users)
	.where(eq(users.id, 1))
	.where(eq(users.name, 'John')); // ❌ Type error - where() can only be invoked once
```

In the previous ORM versions, when such restrictions weren’t implemented, this example in particular was a source of confusion for many users, as they expected the query builder to “merge” multiple `.where()` calls into a single condition.

This behavior is useful for conventional query building, i.e. when you create the whole query at once.
However, it becomes a problem when you want to build a query dynamically, i.e. if you have a shared function that takes a query builder and enhances it.
To solve this problem, Drizzle provides a special ‘dynamic’ mode for query builders, which removes the restriction of invoking methods only once.
To enable it, you need to call `.$dynamic()` on a query builder.

Let’s see how it works by implementing a simple `withPagination` function that adds `LIMIT` and `OFFSET` clauses to a query based on the provided page number and an optional page size:

```
function withPagination<T extends PgSelect>(
	qb: T,
	page: number = 1,
	pageSize: number = 10,
) {
	return qb.limit(pageSize).offset((page - 1) * pageSize);
}

const query = db.select().from(users).where(eq(users.id, 1));
withPagination(query, 1); // ❌ Type error - the query builder is not in dynamic mode

const dynamicQuery = query.$dynamic();
withPagination(dynamicQuery, 1); // ✅ OK
```

Note that the `withPagination` function is generic, which allows you to modify the result type of the query builder inside it, for example by adding a join:

```
function withFriends<T extends PgSelect>(qb: T) {
	return qb.leftJoin(friends, eq(friends.userId, users.id));
}

let query = db.select().from(users).where(eq(users.id, 1)).$dynamic();
query = withFriends(query);
```

This is possible, because `PgSelect` and other similar types are specifically designed to be used in dynamic query building. They can only be used in dynamic mode.

Here is the list of all types that can be used as generic parameters in dynamic query building:

| **Dialect**                | **Type**       |
| -------------------------- | -------------- | -------------- | -------------- | -------------- |
| **Query**                  | **Select**     | **Insert**     | **Update**     | **Delete**     |
| ---                        | ---            | ---            | ---            | ---            |
| Postgres                   | `PgSelect`     | `PgInsert`     | `PgUpdate`     | `PgDelete`     |
| `PgSelectQueryBuilder`     |
| MySQL                      | `MySqlSelect`  | `MySqlInsert`  | `MySqlUpdate`  | `MySqlDelete`  |
| `MySqlSelectQueryBuilder`  |
| SQLite                     | `SQLiteSelect` | `SQLiteInsert` | `SQLiteUpdate` | `SQLiteDelete` |
| `SQLiteSelectQueryBuilder` |

The `...QueryBuilder` types are for usage with [standalone query builder\\
instances](https://rqbv2.drizzle-orm-fe.pages.dev/docs/goodies#standalone-query-builder). DB query builders are
subclasses of them, so you can use them as well.

```
	import { QueryBuilder } from 'drizzle-orm/pg-core';

	function withFriends<T extends PgSelectQueryBuilder>(qb: T) {
		return qb.leftJoin(friends, eq(friends.userId, users.id));
	}

	const qb = new QueryBuilder();
	let query = qb.select().from(users).where(eq(users.id, 1)).$dynamic();
	query = withFriends(query);
```
