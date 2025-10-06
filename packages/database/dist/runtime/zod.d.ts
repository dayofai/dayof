import * as drizzle_orm_pg_core550 from "drizzle-orm/pg-core";
import * as drizzle_zod0 from "drizzle-zod";
import { z } from "zod";

//#region runtime/zod.d.ts
declare const idWithPrefix: (prefix: string) => z.ZodString;
declare const jsonValue: z.ZodType<unknown>;
declare const ianaTimezone: z.ZodString;
declare const dineroSnapshot: z.ZodObject<{
  amount: z.ZodNumber;
  currency: z.ZodOptional<z.ZodObject<{
    code: z.ZodString;
    base: z.ZodNumber;
    exponent: z.ZodNumber;
  }, z.core.$strip>>;
  scale: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
declare const UsersInsert: drizzle_zod0.BuildSchema<"insert", any, undefined, {
  date: true;
}>;
declare const UsersSelect: drizzle_zod0.BuildSchema<"select", any, undefined, {
  date: true;
}>;
declare const UsersUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const OrganizationsInsert: drizzle_zod0.BuildSchema<"insert", any, undefined, {
  date: true;
}>;
declare const OrganizationsSelect: drizzle_zod0.BuildSchema<"select", any, undefined, {
  date: true;
}>;
declare const OrganizationsUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const CurrencyInsert: drizzle_zod0.BuildSchema<"insert", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  code: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  base: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  exponent: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  symbol: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  code: z.ZodString;
}, {
  date: true;
}>;
declare const CurrencySelect: drizzle_zod0.BuildSchema<"select", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  code: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  base: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  exponent: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  symbol: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  code: z.ZodString;
}, {
  date: true;
}>;
declare const CurrencyUpdate: drizzle_zod0.BuildSchema<"update", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  code: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  base: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  exponent: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "number int32";
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  symbol: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "currency";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  code: z.ZodString;
}, {
  date: true;
}>;
declare const RegionInsert: drizzle_zod0.BuildSchema<"insert", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  currencyCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  automaticTaxes: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: false;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionSelect: drizzle_zod0.BuildSchema<"select", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  currencyCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  automaticTaxes: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: false;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionUpdate: drizzle_zod0.BuildSchema<"update", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  currencyCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  automaticTaxes: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: false;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionCountryInsert: drizzle_zod0.BuildSchema<"insert", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso3: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  numCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  displayName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  regionId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionCountrySelect: drizzle_zod0.BuildSchema<"select", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso3: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  numCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  displayName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  regionId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionCountryUpdate: drizzle_zod0.BuildSchema<"update", {
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  iso3: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  numCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  displayName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  regionId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "region_country";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RegionPaymentProviderInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const RegionPaymentProviderSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const RegionPaymentProviderUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const LocationTypeInsert: drizzle_zod0.BuildSchema<"insert", {
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const LocationTypeSelect: drizzle_zod0.BuildSchema<"select", {
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const LocationTypeUpdate: drizzle_zod0.BuildSchema<"update", {
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location_type";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, undefined, {
  date: true;
}>;
declare const LocationInsert: drizzle_zod0.BuildSchema<"insert", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationParentId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  handle: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationTypeId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  timezone: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "custom";
    data: string;
    driverParam: unknown;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodOptional<z.ZodString>;
  timezone: z.ZodString;
}, {
  date: true;
}>;
declare const LocationSelect: drizzle_zod0.BuildSchema<"select", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationParentId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  handle: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationTypeId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  timezone: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "custom";
    data: string;
    driverParam: unknown;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodString;
  timezone: z.ZodString;
}, {
  date: true;
}>;
declare const LocationUpdate: drizzle_zod0.BuildSchema<"update", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationParentId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  name: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  handle: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  description: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  locationTypeId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  timezone: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "location";
    dataType: "custom";
    data: string;
    driverParam: unknown;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  timezone: z.ZodString;
}, {
  date: true;
}>;
declare const AddressInsert: drizzle_zod0.BuildSchema<"insert", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  addressName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultShipping: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultBilling: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  company: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  firstName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  lastName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address1: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  city: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  countryCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  province: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  postalCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  longitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  latitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  originalPhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  e164PhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const AddressSelect: drizzle_zod0.BuildSchema<"select", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  addressName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultShipping: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultBilling: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  company: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  firstName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  lastName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address1: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  city: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  countryCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  province: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  postalCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  longitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  latitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  originalPhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  e164PhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const AddressUpdate: drizzle_zod0.BuildSchema<"update", {
  actorType: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string enum";
    data: "user" | "system" | "api_token";
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: ["user", "system", "api_token"];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  userId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  orgId: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  createdAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  updatedAt: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object date";
    data: Date;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  id: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  addressName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultShipping: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  isDefaultBilling: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "boolean";
    data: boolean;
    driverParam: boolean;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  company: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  firstName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  lastName: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address1: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  address2: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  city: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  countryCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  province: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  postalCode: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  longitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  latitude: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "number double";
    data: number;
    driverParam: string | number;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  originalPhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  e164PhoneNumber: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "string";
    data: string;
    driverParam: string;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
  metadata: drizzle_orm_pg_core550.PgColumn<{
    name: string;
    tableName: "address";
    dataType: "object json";
    data: unknown;
    driverParam: unknown;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }, {}>;
}, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const TagsInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const TagsSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const TagsUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const OrganizationSettingsInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  featureFlags: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const OrganizationSettingsSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  featureFlags: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const OrganizationSettingsUpdate: drizzle_zod0.BuildSchema<"update", any, {
  featureFlags: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const BrandProfileInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  brandIdentity: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  socialLinks: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const BrandProfileSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  brandIdentity: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  socialLinks: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const BrandProfileUpdate: drizzle_zod0.BuildSchema<"update", any, {
  brandIdentity: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  socialLinks: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const StockLocationInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const StockLocationSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const StockLocationUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SalesChannelInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SalesChannelSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SalesChannelUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SalesChannelStockLocationInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const SalesChannelStockLocationSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const SalesChannelStockLocationUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const ProductTypeInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductTypeSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductTypeUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductCategoryInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductCategorySelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductCategoryUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductGroupInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductGroupSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductGroupUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductGroupProductInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const ProductGroupProductSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const ProductGroupProductUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const ProductCategoryProductInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const ProductCategoryProductSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const ProductCategoryProductUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const ProductTagInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const ProductTagSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const ProductTagUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const PriceSetInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  rules: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PriceSetSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  rules: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PriceSetUpdate: drizzle_zod0.BuildSchema<"update", any, {
  rules: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PriceInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  minQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  maxQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PriceSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  minQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  maxQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PriceUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  minQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  maxQuantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantPriceSetInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const ProductVariantPriceSetSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const ProductVariantPriceSetUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const ProductSalesChannelInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
}, {
  date: true;
}>;
declare const ProductSalesChannelSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
}, {
  date: true;
}>;
declare const ProductSalesChannelUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
declare const TaxRateInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  rate: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  rawRate: z.ZodCoercedNumber<unknown>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const TaxRateSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  rate: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  rawRate: z.ZodCoercedNumber<unknown>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const TaxRateUpdate: drizzle_zod0.BuildSchema<"update", any, {
  rate: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  rawRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantTaxRateInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantTaxRateSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const ProductVariantTaxRateUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const FeeInsert: z.ZodObject<any, z.core.$strip>;
declare const FeeSelect: z.ZodObject<any, z.core.$strip>;
declare const FeeUpdate: drizzle_zod0.BuildSchema<"update", any, {
  percentage: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentProviderInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  config: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentProviderSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  config: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentProviderUpdate: drizzle_zod0.BuildSchema<"update", any, {
  config: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentCollectionInsert: z.ZodObject<any, z.core.$strip>;
declare const PaymentCollectionSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  totalAmount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  authorizedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  capturedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  refundedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentCollectionUpdate: drizzle_zod0.BuildSchema<"update", any, {
  totalAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  authorizedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  capturedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  refundedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentIntentInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentIntentSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentIntentUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentAttemptInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentAttemptSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentAttemptUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentMethodInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentMethodSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PaymentMethodUpdate: drizzle_zod0.BuildSchema<"update", any, {
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundReasonInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundReasonSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundReasonUpdate: drizzle_zod0.BuildSchema<"update", any, {
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const RefundUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InvoiceInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InvoiceSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InvoiceUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SubscriptionInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SubscriptionSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SubscriptionUpdate: drizzle_zod0.BuildSchema<"update", any, {
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const SubscriptionSchedulePhaseInsert: z.ZodObject<any, z.core.$strip>;
declare const SubscriptionSchedulePhaseSelect: z.ZodObject<any, z.core.$strip>;
declare const SubscriptionSchedulePhaseUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InstallmentInsert: drizzle_zod0.BuildSchema<"insert", any, {
  id: z.ZodOptional<z.ZodString>;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  refundedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InstallmentSelect: drizzle_zod0.BuildSchema<"select", any, {
  id: z.ZodString;
  amount: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>;
  refundedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const InstallmentUpdate: drizzle_zod0.BuildSchema<"update", any, {
  amount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  refundedAmount: z.ZodOptional<z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodOptional<z.ZodObject<{
      code: z.ZodString;
      base: z.ZodNumber;
      exponent: z.ZodNumber;
    }, z.core.$strip>>;
    scale: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  metadata: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
}, {
  date: true;
}>;
declare const PromotionInsert: drizzle_zod0.BuildSchema<"insert", any, undefined, {
  date: true;
}>;
declare const PromotionSelect: drizzle_zod0.BuildSchema<"select", any, undefined, {
  date: true;
}>;
declare const PromotionUpdate: drizzle_zod0.BuildSchema<"update", any, undefined, {
  date: true;
}>;
//#endregion
export { AddressInsert, AddressSelect, AddressUpdate, BrandProfileInsert, BrandProfileSelect, BrandProfileUpdate, CurrencyInsert, CurrencySelect, CurrencyUpdate, FeeInsert, FeeSelect, FeeUpdate, InstallmentInsert, InstallmentSelect, InstallmentUpdate, InvoiceInsert, InvoiceSelect, InvoiceUpdate, LocationInsert, LocationSelect, LocationTypeInsert, LocationTypeSelect, LocationTypeUpdate, LocationUpdate, OrganizationSettingsInsert, OrganizationSettingsSelect, OrganizationSettingsUpdate, OrganizationsInsert, OrganizationsSelect, OrganizationsUpdate, PaymentAttemptInsert, PaymentAttemptSelect, PaymentAttemptUpdate, PaymentCollectionInsert, PaymentCollectionSelect, PaymentCollectionUpdate, PaymentIntentInsert, PaymentIntentSelect, PaymentIntentUpdate, PaymentMethodInsert, PaymentMethodSelect, PaymentMethodUpdate, PaymentProviderInsert, PaymentProviderSelect, PaymentProviderUpdate, PriceInsert, PriceSelect, PriceSetInsert, PriceSetSelect, PriceSetUpdate, PriceUpdate, ProductCategoryInsert, ProductCategoryProductInsert, ProductCategoryProductSelect, ProductCategoryProductUpdate, ProductCategorySelect, ProductCategoryUpdate, ProductGroupInsert, ProductGroupProductInsert, ProductGroupProductSelect, ProductGroupProductUpdate, ProductGroupSelect, ProductGroupUpdate, ProductInsert, ProductSalesChannelInsert, ProductSalesChannelSelect, ProductSalesChannelUpdate, ProductSelect, ProductTagInsert, ProductTagSelect, ProductTagUpdate, ProductTypeInsert, ProductTypeSelect, ProductTypeUpdate, ProductUpdate, ProductVariantInsert, ProductVariantPriceSetInsert, ProductVariantPriceSetSelect, ProductVariantPriceSetUpdate, ProductVariantSelect, ProductVariantTaxRateInsert, ProductVariantTaxRateSelect, ProductVariantTaxRateUpdate, ProductVariantUpdate, PromotionInsert, PromotionSelect, PromotionUpdate, RefundInsert, RefundReasonInsert, RefundReasonSelect, RefundReasonUpdate, RefundSelect, RefundUpdate, RegionCountryInsert, RegionCountrySelect, RegionCountryUpdate, RegionInsert, RegionPaymentProviderInsert, RegionPaymentProviderSelect, RegionPaymentProviderUpdate, RegionSelect, RegionUpdate, SalesChannelInsert, SalesChannelSelect, SalesChannelStockLocationInsert, SalesChannelStockLocationSelect, SalesChannelStockLocationUpdate, SalesChannelUpdate, StockLocationInsert, StockLocationSelect, StockLocationUpdate, SubscriptionInsert, SubscriptionSchedulePhaseInsert, SubscriptionSchedulePhaseSelect, SubscriptionSchedulePhaseUpdate, SubscriptionSelect, SubscriptionUpdate, TagsInsert, TagsSelect, TagsUpdate, TaxRateInsert, TaxRateSelect, TaxRateUpdate, UsersInsert, UsersSelect, UsersUpdate, dineroSnapshot, ianaTimezone, idWithPrefix, jsonValue };