import { pgTable } from "drizzle-orm/pg-core";

export const users = pgTable("users", (t) => ({
	id: t.text("id").primaryKey(),
}));

export const organizations = pgTable("organizations", (t) => ({
	id: t.text("id").primaryKey(),
}));