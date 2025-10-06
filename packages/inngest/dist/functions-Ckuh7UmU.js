import { inngest } from "./client-DXOXRk7j.js";
import { schema } from "database/schema";
import { db } from "database/db";
import * as http2 from "node:http2";
import { createHash } from "node:crypto";

//#region rolldown:runtime
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function() {
	return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

//#endregion
//#region functions/userSignedIn.ts
const userSignedIn = inngest.createFunction({ id: "user-signed-in" }, { event: "user/signed_in" }, async ({ event, step }) => {
	const data = event.data;
	let userId;
	if (typeof data === "object" && data !== null && "userId" in data) {
		const value = data.userId;
		if (typeof value === "string") userId = value;
	}
	await step.run("log", () => {
		return {
			message: "User signed in",
			userId
		};
	});
	return { ok: true };
});

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/entity.js
function is(value, type) {
	if (!value || typeof value !== "object") return false;
	if (value instanceof type) return true;
	if (!Object.prototype.hasOwnProperty.call(type, entityKind)) throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
	let cls = Object.getPrototypeOf(value).constructor;
	if (cls) while (cls) {
		if (entityKind in cls && cls[entityKind] === type[entityKind]) return true;
		cls = Object.getPrototypeOf(cls);
	}
	return false;
}
var entityKind, hasOwnEntityKind;
var init_entity = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/entity.js": (() => {
	entityKind = Symbol.for("drizzle:entityKind");
	hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column.js
var Column;
var init_column = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column.js": (() => {
	init_entity();
	Column = class {
		static [entityKind] = "Column";
		name;
		keyAsName;
		primary;
		notNull;
		default;
		defaultFn;
		onUpdateFn;
		hasDefault;
		isUnique;
		uniqueName;
		uniqueType;
		dataType;
		columnType;
		enumValues = void 0;
		generated = void 0;
		generatedIdentity = void 0;
		length;
		isLengthExact;
		/** @internal */
		config;
		/** @internal */
		table;
		/** @internal */
		onInit() {}
		constructor(table, config) {
			this.config = config;
			this.onInit();
			this.table = table;
			this.name = config.name;
			this.keyAsName = config.keyAsName;
			this.notNull = config.notNull;
			this.default = config.default;
			this.defaultFn = config.defaultFn;
			this.onUpdateFn = config.onUpdateFn;
			this.hasDefault = config.hasDefault;
			this.primary = config.primaryKey;
			this.isUnique = config.isUnique;
			this.uniqueName = config.uniqueName;
			this.uniqueType = config.uniqueType;
			this.dataType = config.dataType;
			this.columnType = config.columnType;
			this.generated = config.generated;
			this.generatedIdentity = config.generatedIdentity;
			this.length = config["length"];
			this.isLengthExact = config["isLengthExact"];
		}
		mapFromDriverValue(value) {
			return value;
		}
		mapToDriverValue(value) {
			return value;
		}
		shouldDisableInsert() {
			return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder;
var init_column_builder = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column-builder.js": (() => {
	init_entity();
	ColumnBuilder = class {
		static [entityKind] = "ColumnBuilder";
		/** @internal */
		config;
		constructor(name, dataType, columnType) {
			this.config = {
				name,
				keyAsName: name === "",
				notNull: false,
				default: void 0,
				hasDefault: false,
				primaryKey: false,
				isUnique: false,
				uniqueName: void 0,
				uniqueType: void 0,
				dataType,
				columnType,
				generated: void 0
			};
		}
		/**
		* Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
		*
		* @example
		* ```ts
		* const users = pgTable('users', {
		* 	id: integer('id').$type<UserId>().primaryKey(),
		* 	details: json('details').$type<UserDetails>().notNull(),
		* });
		* ```
		*/
		$type() {
			return this;
		}
		/**
		* Adds a `not null` clause to the column definition.
		*
		* Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
		*/
		notNull() {
			this.config.notNull = true;
			return this;
		}
		/**
		* Adds a `default <value>` clause to the column definition.
		*
		* Affects the `insert` model of the table - columns *with* `default` are optional on insert.
		*
		* If you need to set a dynamic default value, use {@link $defaultFn} instead.
		*/
		default(value) {
			this.config.default = value;
			this.config.hasDefault = true;
			return this;
		}
		/**
		* Adds a dynamic default value to the column.
		* The function will be called when the row is inserted, and the returned value will be used as the column value.
		*
		* **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
		*/
		$defaultFn(fn) {
			this.config.defaultFn = fn;
			this.config.hasDefault = true;
			return this;
		}
		/**
		* Alias for {@link $defaultFn}.
		*/
		$default = this.$defaultFn;
		/**
		* Adds a dynamic update value to the column.
		* The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
		* If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
		*
		* **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
		*/
		$onUpdateFn(fn) {
			this.config.onUpdateFn = fn;
			this.config.hasDefault = true;
			return this;
		}
		/**
		* Alias for {@link $onUpdateFn}.
		*/
		$onUpdate = this.$onUpdateFn;
		/**
		* Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
		*
		* In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
		*/
		primaryKey() {
			this.config.primaryKey = true;
			this.config.notNull = true;
			return this;
		}
		/** @internal Sets the name of the column to the key within the table definition if a name was not given. */
		setName(name) {
			if (this.config.name !== "") return;
			this.config.name = name;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.utils.js
var TableName;
var init_table_utils = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.utils.js": (() => {
	TableName = Symbol.for("drizzle:Name");
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder, ForeignKey;
var init_foreign_keys = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/foreign-keys.js": (() => {
	init_entity();
	init_table_utils();
	ForeignKeyBuilder = class {
		static [entityKind] = "PgForeignKeyBuilder";
		/** @internal */
		reference;
		/** @internal */
		_onUpdate = "no action";
		/** @internal */
		_onDelete = "no action";
		constructor(config, actions) {
			this.reference = () => {
				const { name, columns, foreignColumns } = config();
				return {
					name,
					columns,
					foreignTable: foreignColumns[0].table,
					foreignColumns
				};
			};
			if (actions) {
				this._onUpdate = actions.onUpdate;
				this._onDelete = actions.onDelete;
			}
		}
		onUpdate(action) {
			this._onUpdate = action === void 0 ? "no action" : action;
			return this;
		}
		onDelete(action) {
			this._onDelete = action === void 0 ? "no action" : action;
			return this;
		}
		/** @internal */
		build(table) {
			return new ForeignKey(table, this);
		}
	};
	ForeignKey = class {
		constructor(table, builder) {
			this.table = table;
			this.reference = builder.reference;
			this.onUpdate = builder._onUpdate;
			this.onDelete = builder._onDelete;
		}
		static [entityKind] = "PgForeignKey";
		reference;
		onUpdate;
		onDelete;
		getName() {
			const { name, columns, foreignColumns } = this.reference();
			const columnNames = columns.map((column) => column.name);
			const foreignColumnNames = foreignColumns.map((column) => column.name);
			const chunks = [
				this.table[TableName],
				...columnNames,
				foreignColumns[0].table[TableName],
				...foreignColumnNames
			];
			return name ?? `${chunks.join("_")}_fk`;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
	return fn(...args);
}
var init_tracing_utils = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing-utils.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
	return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder, UniqueOnConstraintBuilder, UniqueConstraint;
var init_unique_constraint = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/unique-constraint.js": (() => {
	init_entity();
	init_table_utils();
	UniqueConstraintBuilder = class {
		constructor(columns, name) {
			this.name = name;
			this.columns = columns;
		}
		static [entityKind] = "PgUniqueConstraintBuilder";
		/** @internal */
		columns;
		/** @internal */
		nullsNotDistinctConfig = false;
		nullsNotDistinct() {
			this.nullsNotDistinctConfig = true;
			return this;
		}
		/** @internal */
		build(table) {
			return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
		}
	};
	UniqueOnConstraintBuilder = class {
		static [entityKind] = "PgUniqueOnConstraintBuilder";
		/** @internal */
		name;
		constructor(name) {
			this.name = name;
		}
		on(...columns) {
			return new UniqueConstraintBuilder(columns, this.name);
		}
	};
	UniqueConstraint = class {
		constructor(table, columns, nullsNotDistinct, name) {
			this.table = table;
			this.columns = columns;
			this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
			this.nullsNotDistinct = nullsNotDistinct;
		}
		static [entityKind] = "PgUniqueConstraint";
		columns;
		name;
		nullsNotDistinct = false;
		getName() {
			return this.name;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
	for (let i = startFrom; i < arrayString.length; i++) {
		const char = arrayString[i];
		if (char === "\\") {
			i++;
			continue;
		}
		if (char === "\"") return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
		if (inQuotes) continue;
		if (char === "," || char === "}") return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
	}
	return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
	const result = [];
	let i = startFrom;
	let lastCharIsComma = false;
	while (i < arrayString.length) {
		const char = arrayString[i];
		if (char === ",") {
			if (lastCharIsComma || i === startFrom) result.push("");
			lastCharIsComma = true;
			i++;
			continue;
		}
		lastCharIsComma = false;
		if (char === "\\") {
			i += 2;
			continue;
		}
		if (char === "\"") {
			const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
			result.push(value2);
			i = startFrom2;
			continue;
		}
		if (char === "}") return [result, i + 1];
		if (char === "{") {
			const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
			result.push(value2);
			i = startFrom2;
			continue;
		}
		const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
		result.push(value);
		i = newStartFrom;
	}
	return [result, i];
}
function parsePgArray(arrayString) {
	const [result] = parsePgNestedArray(arrayString, 1);
	return result;
}
function makePgArray(array) {
	return `{${array.map((item) => {
		if (Array.isArray(item)) return makePgArray(item);
		if (typeof item === "string") return `"${item.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
		return `${item}`;
	}).join(",")}}`;
}
var init_array = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/utils/array.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder, PgColumn, ExtraConfigColumn, IndexedColumn, PgArrayBuilder, PgArray;
var init_common = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/common.js": (() => {
	init_column_builder();
	init_column();
	init_entity();
	init_foreign_keys();
	init_tracing_utils();
	init_unique_constraint();
	init_array();
	PgColumnBuilder = class extends ColumnBuilder {
		foreignKeyConfigs = [];
		static [entityKind] = "PgColumnBuilder";
		array(length) {
			return new PgArrayBuilder(this.config.name, this, length);
		}
		references(ref, actions = {}) {
			this.foreignKeyConfigs.push({
				ref,
				actions
			});
			return this;
		}
		unique(name, config) {
			this.config.isUnique = true;
			this.config.uniqueName = name;
			this.config.uniqueType = config?.nulls;
			return this;
		}
		generatedAlwaysAs(as) {
			this.config.generated = {
				as,
				type: "always",
				mode: "stored"
			};
			return this;
		}
		/** @internal */
		buildForeignKeys(column, table) {
			return this.foreignKeyConfigs.map(({ ref, actions }) => {
				return iife((ref2, actions2) => {
					const builder = new ForeignKeyBuilder(() => {
						const foreignColumn = ref2();
						return {
							columns: [column],
							foreignColumns: [foreignColumn]
						};
					});
					if (actions2.onUpdate) builder.onUpdate(actions2.onUpdate);
					if (actions2.onDelete) builder.onDelete(actions2.onDelete);
					return builder.build(table);
				}, ref, actions);
			});
		}
		/** @internal */
		buildExtraConfigColumn(table) {
			return new ExtraConfigColumn(table, this.config);
		}
	};
	PgColumn = class extends Column {
		static [entityKind] = "PgColumn";
		/** @internal */
		table;
		constructor(table, config) {
			if (!config.uniqueName) config.uniqueName = uniqueKeyName(table, [config.name]);
			super(table, config);
			this.table = table;
		}
	};
	ExtraConfigColumn = class extends PgColumn {
		static [entityKind] = "ExtraConfigColumn";
		getSQLType() {
			return this.getSQLType();
		}
		indexConfig = {
			order: this.config.order ?? "asc",
			nulls: this.config.nulls ?? "last",
			opClass: this.config.opClass
		};
		defaultConfig = {
			order: "asc",
			nulls: "last",
			opClass: void 0
		};
		asc() {
			this.indexConfig.order = "asc";
			return this;
		}
		desc() {
			this.indexConfig.order = "desc";
			return this;
		}
		nullsFirst() {
			this.indexConfig.nulls = "first";
			return this;
		}
		nullsLast() {
			this.indexConfig.nulls = "last";
			return this;
		}
		/**
		* ### PostgreSQL documentation quote
		*
		* > An operator class with optional parameters can be specified for each column of an index.
		* The operator class identifies the operators to be used by the index for that column.
		* For example, a B-tree index on four-byte integers would use the int4_ops class;
		* this operator class includes comparison functions for four-byte integers.
		* In practice the default operator class for the column's data type is usually sufficient.
		* The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
		* For example, we might want to sort a complex-number data type either by absolute value or by real part.
		* We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
		* More information about operator classes check:
		*
		* ### Useful links
		* https://www.postgresql.org/docs/current/sql-createindex.html
		*
		* https://www.postgresql.org/docs/current/indexes-opclass.html
		*
		* https://www.postgresql.org/docs/current/xindex.html
		*
		* ### Additional types
		* If you have the `pg_vector` extension installed in your database, you can use the
		* `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
		*
		* **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
		*
		* @param opClass
		* @returns
		*/
		op(opClass) {
			this.indexConfig.opClass = opClass;
			return this;
		}
	};
	IndexedColumn = class {
		static [entityKind] = "IndexedColumn";
		constructor(name, keyAsName, type, indexConfig) {
			this.name = name;
			this.keyAsName = keyAsName;
			this.type = type;
			this.indexConfig = indexConfig;
		}
		name;
		keyAsName;
		type;
		indexConfig;
	};
	PgArrayBuilder = class extends PgColumnBuilder {
		static [entityKind] = "PgArrayBuilder";
		constructor(name, baseBuilder, length) {
			super(name, "array basecolumn", "PgArray");
			this.config.baseBuilder = baseBuilder;
			this.config.length = length;
		}
		/** @internal */
		build(table) {
			const baseColumn = this.config.baseBuilder.build(table);
			return new PgArray(table, this.config, baseColumn);
		}
	};
	PgArray = class PgArray extends PgColumn {
		constructor(table, config, baseColumn, range) {
			super(table, config);
			this.baseColumn = baseColumn;
			this.range = range;
		}
		static [entityKind] = "PgArray";
		getSQLType() {
			return `${this.baseColumn.getSQLType()}[${typeof this.length === "number" ? this.length : ""}]`;
		}
		mapFromDriverValue(value) {
			if (typeof value === "string") value = parsePgArray(value);
			return value.map((v) => this.baseColumn.mapFromDriverValue(v));
		}
		mapFromJsonValue(value) {
			if (typeof value === "string") value = parsePgArray(value);
			const base = this.baseColumn;
			return "mapFromJsonValue" in base ? value.map((v) => base.mapFromJsonValue(v)) : value.map((v) => base.mapFromDriverValue(v));
		}
		mapToDriverValue(value, isNestedArray = false) {
			const a = value.map((v) => v === null ? null : is(this.baseColumn, PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v));
			if (isNestedArray) return a;
			return makePgArray(a);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/enum.js
function isPgEnum(obj) {
	return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumObjectColumnBuilder, PgEnumObjectColumn, isPgEnumSym, PgEnumColumnBuilder, PgEnumColumn;
var init_enum = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/enum.js": (() => {
	init_entity();
	init_common();
	PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
		static [entityKind] = "PgEnumObjectColumnBuilder";
		constructor(name, enumInstance) {
			super(name, "string enum", "PgEnumObjectColumn");
			this.config.enum = enumInstance;
		}
		/** @internal */
		build(table) {
			return new PgEnumObjectColumn(table, this.config);
		}
	};
	PgEnumObjectColumn = class extends PgColumn {
		static [entityKind] = "PgEnumObjectColumn";
		enum;
		enumValues = this.config.enum.enumValues;
		constructor(table, config) {
			super(table, config);
			this.enum = config.enum;
		}
		getSQLType() {
			return this.enum.enumName;
		}
	};
	isPgEnumSym = Symbol.for("drizzle:isPgEnum");
	PgEnumColumnBuilder = class extends PgColumnBuilder {
		static [entityKind] = "PgEnumColumnBuilder";
		constructor(name, enumInstance) {
			super(name, "string enum", "PgEnumColumn");
			this.config.enum = enumInstance;
		}
		/** @internal */
		build(table) {
			return new PgEnumColumn(table, this.config);
		}
	};
	PgEnumColumn = class extends PgColumn {
		static [entityKind] = "PgEnumColumn";
		enum = this.config.enum;
		enumValues = this.config.enum.enumValues;
		constructor(table, config) {
			super(table, config);
			this.enum = config.enum;
		}
		getSQLType() {
			return this.enum.enumName;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/subquery.js
var Subquery, WithSubquery;
var init_subquery = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/subquery.js": (() => {
	init_entity();
	Subquery = class {
		static [entityKind] = "Subquery";
		constructor(sql$1, fields, alias, isWith = false, usedTables = []) {
			this._ = {
				brand: "Subquery",
				sql: sql$1,
				selectedFields: fields,
				alias,
				isWith,
				usedTables
			};
		}
	};
	WithSubquery = class extends Subquery {
		static [entityKind] = "WithSubquery";
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing.js
var tracer;
var init_tracing = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing.js": (() => {
	tracer = { startActiveSpan(name, fn) {
		return fn();
	} };
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig;
var init_view_common = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/view-common.js": (() => {
	ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.js
var TableSchema, TableColumns, ExtraConfigColumns, OriginalName, BaseName, IsAlias, ExtraConfigBuilder, IsDrizzleTable, Table;
var init_table = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.js": (() => {
	init_entity();
	init_table_utils();
	TableSchema = Symbol.for("drizzle:Schema");
	TableColumns = Symbol.for("drizzle:Columns");
	ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
	OriginalName = Symbol.for("drizzle:OriginalName");
	BaseName = Symbol.for("drizzle:BaseName");
	IsAlias = Symbol.for("drizzle:IsAlias");
	ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
	IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
	Table = class {
		static [entityKind] = "Table";
		/** @internal */
		static Symbol = {
			Name: TableName,
			Schema: TableSchema,
			OriginalName,
			Columns: TableColumns,
			ExtraConfigColumns,
			BaseName,
			IsAlias,
			ExtraConfigBuilder
		};
		/**
		* @internal
		* Can be changed if the table is aliased.
		*/
		[TableName];
		/**
		* @internal
		* Used to store the original name of the table, before any aliasing.
		*/
		[OriginalName];
		/** @internal */
		[TableSchema];
		/** @internal */
		[TableColumns];
		/** @internal */
		[ExtraConfigColumns];
		/**
		*  @internal
		* Used to store the table name before the transformation via the `tableCreator` functions.
		*/
		[BaseName];
		/** @internal */
		[IsAlias] = false;
		/** @internal */
		[IsDrizzleTable] = true;
		/** @internal */
		[ExtraConfigBuilder] = void 0;
		constructor(name, schema$1, baseName) {
			this[TableName] = this[OriginalName] = name;
			this[TableSchema] = schema$1;
			this[BaseName] = baseName;
		}
		getSQL = void 0;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
	return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
	const result = {
		sql: "",
		params: []
	};
	for (const query of queries) {
		result.sql += query.sql;
		result.params.push(...query.params);
		if (query.typings?.length) {
			if (!result.typings) result.typings = [];
			result.typings.push(...query.typings);
		}
	}
	return result;
}
function isDriverValueEncoder(value) {
	return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
function sql(strings, ...params) {
	const queryChunks = [];
	if (params.length > 0 || strings.length > 0 && strings[0] !== "") queryChunks.push(new StringChunk(strings[0]));
	for (const [paramIndex, param2] of params.entries()) queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
	return new SQL(queryChunks);
}
var FakePrimitiveParam, StringChunk, SQL, Name, noopDecoder, noopEncoder, noopMapper, Param, Placeholder, IsDrizzleView, View;
var init_sql$1 = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/sql.js": (() => {
	init_entity();
	init_enum();
	init_subquery();
	init_table_utils();
	init_tracing();
	init_view_common();
	init_column();
	init_table();
	FakePrimitiveParam = class {
		static [entityKind] = "FakePrimitiveParam";
	};
	StringChunk = class {
		static [entityKind] = "StringChunk";
		value;
		constructor(value) {
			this.value = Array.isArray(value) ? value : [value];
		}
		getSQL() {
			return new SQL([this]);
		}
	};
	SQL = class SQL {
		constructor(queryChunks) {
			this.queryChunks = queryChunks;
			for (const chunk of queryChunks) if (is(chunk, Table)) {
				const schemaName = chunk[Table.Symbol.Schema];
				this.usedTables.push(schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
			}
		}
		static [entityKind] = "SQL";
		/** @internal */
		decoder = noopDecoder;
		shouldInlineParams = false;
		/** @internal */
		usedTables = [];
		append(query) {
			this.queryChunks.push(...query.queryChunks);
			return this;
		}
		toQuery(config) {
			return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
				const query = this.buildQueryFromSourceParams(this.queryChunks, config);
				span?.setAttributes({
					"drizzle.query.text": query.sql,
					"drizzle.query.params": JSON.stringify(query.params)
				});
				return query;
			});
		}
		buildQueryFromSourceParams(chunks, _config) {
			const config = Object.assign({}, _config, {
				inlineParams: _config.inlineParams || this.shouldInlineParams,
				paramStartIndex: _config.paramStartIndex || { value: 0 }
			});
			const { casing, escapeName, escapeParam, prepareTyping, inlineParams, paramStartIndex } = config;
			return mergeQueries(chunks.map((chunk) => {
				if (is(chunk, StringChunk)) return {
					sql: chunk.value.join(""),
					params: []
				};
				if (is(chunk, Name)) return {
					sql: escapeName(chunk.value),
					params: []
				};
				if (chunk === void 0) return {
					sql: "",
					params: []
				};
				if (Array.isArray(chunk)) {
					const result = [new StringChunk("(")];
					for (const [i, p] of chunk.entries()) {
						result.push(p);
						if (i < chunk.length - 1) result.push(new StringChunk(", "));
					}
					result.push(new StringChunk(")"));
					return this.buildQueryFromSourceParams(result, config);
				}
				if (is(chunk, SQL)) return this.buildQueryFromSourceParams(chunk.queryChunks, {
					...config,
					inlineParams: inlineParams || chunk.shouldInlineParams
				});
				if (is(chunk, Table)) {
					const schemaName = chunk[Table.Symbol.Schema];
					const tableName = chunk[Table.Symbol.Name];
					return {
						sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
						params: []
					};
				}
				if (is(chunk, Column)) {
					const columnName = casing.getColumnCasing(chunk);
					if (_config.invokeSource === "indexes") return {
						sql: escapeName(columnName),
						params: []
					};
					const schemaName = chunk.table[Table.Symbol.Schema];
					return {
						sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
						params: []
					};
				}
				if (is(chunk, View)) {
					const schemaName = chunk[ViewBaseConfig].schema;
					const viewName = chunk[ViewBaseConfig].name;
					return {
						sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
						params: []
					};
				}
				if (is(chunk, Param)) {
					if (is(chunk.value, Placeholder)) return {
						sql: escapeParam(paramStartIndex.value++, chunk),
						params: [chunk],
						typings: ["none"]
					};
					const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
					if (is(mappedValue, SQL)) return this.buildQueryFromSourceParams([mappedValue], config);
					if (inlineParams) return {
						sql: this.mapInlineParam(mappedValue, config),
						params: []
					};
					let typings = ["none"];
					if (prepareTyping) typings = [prepareTyping(chunk.encoder)];
					return {
						sql: escapeParam(paramStartIndex.value++, mappedValue),
						params: [mappedValue],
						typings
					};
				}
				if (is(chunk, Placeholder)) return {
					sql: escapeParam(paramStartIndex.value++, chunk),
					params: [chunk],
					typings: ["none"]
				};
				if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) return {
					sql: escapeName(chunk.fieldAlias),
					params: []
				};
				if (is(chunk, Subquery)) {
					if (chunk._.isWith) return {
						sql: escapeName(chunk._.alias),
						params: []
					};
					return this.buildQueryFromSourceParams([
						new StringChunk("("),
						chunk._.sql,
						new StringChunk(") "),
						new Name(chunk._.alias)
					], config);
				}
				if (isPgEnum(chunk)) {
					if (chunk.schema) return {
						sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName),
						params: []
					};
					return {
						sql: escapeName(chunk.enumName),
						params: []
					};
				}
				if (isSQLWrapper(chunk)) {
					if (chunk.shouldOmitSQLParens?.()) return this.buildQueryFromSourceParams([chunk.getSQL()], config);
					return this.buildQueryFromSourceParams([
						new StringChunk("("),
						chunk.getSQL(),
						new StringChunk(")")
					], config);
				}
				if (inlineParams) return {
					sql: this.mapInlineParam(chunk, config),
					params: []
				};
				return {
					sql: escapeParam(paramStartIndex.value++, chunk),
					params: [chunk],
					typings: ["none"]
				};
			}));
		}
		mapInlineParam(chunk, { escapeString }) {
			if (chunk === null) return "null";
			if (typeof chunk === "number" || typeof chunk === "boolean") return chunk.toString();
			if (typeof chunk === "string") return escapeString(chunk);
			if (typeof chunk === "object") {
				const mappedValueAsString = chunk.toString();
				if (mappedValueAsString === "[object Object]") return escapeString(JSON.stringify(chunk));
				return escapeString(mappedValueAsString);
			}
			throw new Error("Unexpected param value: " + chunk);
		}
		getSQL() {
			return this;
		}
		as(alias) {
			if (alias === void 0) return this;
			return new SQL.Aliased(this, alias);
		}
		mapWith(decoder$1) {
			this.decoder = typeof decoder$1 === "function" ? { mapFromDriverValue: decoder$1 } : decoder$1;
			return this;
		}
		inlineParams() {
			this.shouldInlineParams = true;
			return this;
		}
		/**
		* This method is used to conditionally include a part of the query.
		*
		* @param condition - Condition to check
		* @returns itself if the condition is `true`, otherwise `undefined`
		*/
		if(condition) {
			return condition ? this : void 0;
		}
	};
	Name = class {
		constructor(value) {
			this.value = value;
		}
		static [entityKind] = "Name";
		brand;
		getSQL() {
			return new SQL([this]);
		}
	};
	noopDecoder = { mapFromDriverValue: (value) => value };
	noopEncoder = { mapToDriverValue: (value) => value };
	noopMapper = {
		...noopDecoder,
		...noopEncoder
	};
	Param = class {
		/**
		* @param value - Parameter value
		* @param encoder - Encoder to convert the value to a driver parameter
		*/
		constructor(value, encoder$1 = noopEncoder) {
			this.value = value;
			this.encoder = encoder$1;
		}
		static [entityKind] = "Param";
		brand;
		getSQL() {
			return new SQL([this]);
		}
	};
	((sql2) => {
		function empty() {
			return new SQL([]);
		}
		sql2.empty = empty;
		function fromList(list) {
			return new SQL(list);
		}
		sql2.fromList = fromList;
		function raw(str) {
			return new SQL([new StringChunk(str)]);
		}
		sql2.raw = raw;
		function join(chunks, separator) {
			const result = [];
			for (const [i, chunk] of chunks.entries()) {
				if (i > 0 && separator !== void 0) result.push(separator);
				result.push(chunk);
			}
			return new SQL(result);
		}
		sql2.join = join;
		function identifier(value) {
			return new Name(value);
		}
		sql2.identifier = identifier;
		function placeholder2(name2) {
			return new Placeholder(name2);
		}
		sql2.placeholder = placeholder2;
		function param2(value, encoder$1) {
			return new Param(value, encoder$1);
		}
		sql2.param = param2;
	})(sql || (sql = {}));
	((SQL2) => {
		class Aliased {
			constructor(sql2, fieldAlias) {
				this.sql = sql2;
				this.fieldAlias = fieldAlias;
			}
			static [entityKind] = "SQL.Aliased";
			/** @internal */
			isSelectionField = false;
			getSQL() {
				return this.sql;
			}
			/** @internal */
			clone() {
				return new Aliased(this.sql, this.fieldAlias);
			}
		}
		SQL2.Aliased = Aliased;
	})(SQL || (SQL = {}));
	Placeholder = class {
		constructor(name2) {
			this.name = name2;
		}
		static [entityKind] = "Placeholder";
		getSQL() {
			return new SQL([this]);
		}
	};
	IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
	View = class {
		static [entityKind] = "View";
		/** @internal */
		[ViewBaseConfig];
		/** @internal */
		[IsDrizzleView] = true;
		/** @internal */
		get [TableName]() {
			return this[ViewBaseConfig].name;
		}
		/** @internal */
		get [TableSchema]() {
			return this[ViewBaseConfig].schema;
		}
		/** @internal */
		get [IsAlias]() {
			return this[ViewBaseConfig].isAlias;
		}
		/** @internal */
		get [OriginalName]() {
			return this[ViewBaseConfig].originalName;
		}
		/** @internal */
		get [TableColumns]() {
			return this[ViewBaseConfig].selectedFields;
		}
		constructor({ name: name2, schema: schema$1, selectedFields, query }) {
			this[ViewBaseConfig] = {
				name: name2,
				originalName: name2,
				schema: schema$1,
				selectedFields,
				query,
				isExisting: !query,
				isAlias: false
			};
		}
		getSQL() {
			return new SQL([this]);
		}
	};
	Column.prototype.getSQL = function() {
		return new SQL([this]);
	};
	Table.prototype.getSQL = function() {
		return new SQL([this]);
	};
	Subquery.prototype.getSQL = function() {
		return new SQL([this]);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/alias.js
function aliasedTable(table, tableAlias) {
	return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
var ColumnAliasProxyHandler, TableAliasProxyHandler, RelationTableAliasProxyHandler;
var init_alias = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/alias.js": (() => {
	init_column();
	init_entity();
	init_table();
	init_view_common();
	ColumnAliasProxyHandler = class {
		constructor(table) {
			this.table = table;
		}
		static [entityKind] = "ColumnAliasProxyHandler";
		get(columnObj, prop) {
			if (prop === "table") return this.table;
			return columnObj[prop];
		}
	};
	TableAliasProxyHandler = class {
		constructor(alias, replaceOriginalName) {
			this.alias = alias;
			this.replaceOriginalName = replaceOriginalName;
		}
		static [entityKind] = "TableAliasProxyHandler";
		get(target, prop) {
			if (prop === Table.Symbol.IsAlias) return true;
			if (prop === Table.Symbol.Name) return this.alias;
			if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) return this.alias;
			if (prop === ViewBaseConfig) return {
				...target[ViewBaseConfig],
				name: this.alias,
				isAlias: true
			};
			if (prop === Table.Symbol.Columns) {
				const columns = target[Table.Symbol.Columns];
				if (!columns) return columns;
				const proxiedColumns = {};
				Object.keys(columns).map((key) => {
					proxiedColumns[key] = new Proxy(columns[key], new ColumnAliasProxyHandler(new Proxy(target, this)));
				});
				return proxiedColumns;
			}
			const value = target[prop];
			if (is(value, Column)) return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
			return value;
		}
	};
	RelationTableAliasProxyHandler = class {
		constructor(alias) {
			this.alias = alias;
		}
		static [entityKind] = "RelationTableAliasProxyHandler";
		get(target, prop) {
			if (prop === "sourceTable") return aliasedTable(target.sourceTable, this.alias);
			return target[prop];
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/errors.js
var DrizzleError, DrizzleQueryError, TransactionRollbackError;
var init_errors$1 = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/errors.js": (() => {
	init_entity();
	DrizzleError = class extends Error {
		static [entityKind] = "DrizzleError";
		constructor({ message: message$1, cause }) {
			super(message$1);
			this.name = "DrizzleError";
			this.cause = cause;
		}
	};
	DrizzleQueryError = class DrizzleQueryError extends Error {
		constructor(query, params, cause) {
			super(`Failed query: ${query}
params: ${params}`);
			this.query = query;
			this.params = params;
			this.cause = cause;
			Error.captureStackTrace(this, DrizzleQueryError);
			if (cause) this.cause = cause;
		}
		static [entityKind] = "DrizzleQueryError";
	};
	TransactionRollbackError = class extends DrizzleError {
		static [entityKind] = "TransactionRollbackError";
		constructor() {
			super({ message: "Rollback" });
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter, DefaultLogger, NoopLogger;
var init_logger = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/logger.js": (() => {
	init_entity();
	ConsoleLogWriter = class {
		static [entityKind] = "ConsoleLogWriter";
		write(message$1) {
			console.log(message$1);
		}
	};
	DefaultLogger = class {
		static [entityKind] = "DefaultLogger";
		writer;
		constructor(config) {
			this.writer = config?.writer ?? new ConsoleLogWriter();
		}
		logQuery(query, params) {
			const stringifiedParams = params.map((p) => {
				try {
					return JSON.stringify(p);
				} catch {
					return String(p);
				}
			});
			const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
			this.writer.write(`Query: ${query}${paramsStr}`);
		}
	};
	NoopLogger = class {
		static [entityKind] = "NoopLogger";
		logQuery() {}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/operations.js
var init_operations = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/operations.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/query-promise.js
var QueryPromise;
var init_query_promise = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/query-promise.js": (() => {
	init_entity();
	QueryPromise = class {
		static [entityKind] = "QueryPromise";
		[Symbol.toStringTag] = "QueryPromise";
		catch(onRejected) {
			return this.then(void 0, onRejected);
		}
		finally(onFinally) {
			return this.then((value) => {
				onFinally?.();
				return value;
			}, (reason) => {
				onFinally?.();
				throw reason;
			});
		}
		then(onFulfilled, onRejected) {
			return this.execute().then(onFulfilled, onRejected);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
	if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) return new Param(value, column);
	return value;
}
function and(...unfilteredConditions) {
	const conditions = unfilteredConditions.filter((c) => c !== void 0);
	if (conditions.length === 0) return;
	if (conditions.length === 1) return new SQL(conditions);
	return new SQL([
		new StringChunk("("),
		sql.join(conditions, new StringChunk(" and ")),
		new StringChunk(")")
	]);
}
var eq;
var init_conditions = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/conditions.js": (() => {
	init_column();
	init_entity();
	init_table();
	init_sql$1();
	eq = (left, right) => {
		return sql`${left} = ${bindIfParam(right, left)}`;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/select.js
var init_select = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/select.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/index.js
var init_expressions = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/index.js": (() => {
	init_conditions();
	init_select();
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/relations.js
function getTableAsAliasSQL(table) {
	return sql`${table[IsAlias] ? sql`${sql`${sql.identifier(table[TableSchema] ?? "")}.`.if(table[TableSchema])}${sql.identifier(table[OriginalName])} as ${table}` : table}`;
}
var Relation, One, Many, AggregatedField, Count, RelationsBuilderTable, RelationsBuilderColumn, RelationsBuilderJunctionColumn, RelationsHelperStatic;
var init_relations = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/relations.js": (() => {
	init_table();
	init_entity();
	init_sql$1();
	Relation = class {
		constructor(targetTable, targetTableName) {
			this.targetTableName = targetTableName;
			this.targetTable = targetTable;
		}
		static [entityKind] = "RelationV2";
		fieldName;
		sourceColumns;
		targetColumns;
		alias;
		where;
		sourceTable;
		targetTable;
		through;
		throughTable;
		isReversed;
		/** @internal */
		sourceColumnTableNames = [];
		/** @internal */
		targetColumnTableNames = [];
	};
	One = class extends Relation {
		static [entityKind] = "OneV2";
		relationType = "one";
		optional;
		constructor(tables, targetTable, targetTableName, config) {
			super(targetTable, targetTableName);
			this.alias = config?.alias;
			this.where = config?.where;
			if (config?.from) this.sourceColumns = (Array.isArray(config.from) ? config.from : [config.from]).map((it) => {
				this.throughTable ??= it._.through ? tables[it._.through._.tableName] : void 0;
				this.sourceColumnTableNames.push(it._.tableName);
				return it._.column;
			});
			if (config?.to) this.targetColumns = (Array.isArray(config.to) ? config.to : [config.to]).map((it) => {
				this.throughTable ??= it._.through ? tables[it._.through._.tableName] : void 0;
				this.targetColumnTableNames.push(it._.tableName);
				return it._.column;
			});
			if (this.throughTable) this.through = {
				source: (Array.isArray(config?.from) ? config.from : config?.from ? [config.from] : []).map((c) => c._.through),
				target: (Array.isArray(config?.to) ? config.to : config?.to ? [config.to] : []).map((c) => c._.through)
			};
			this.optional = config?.optional ?? true;
		}
	};
	Many = class extends Relation {
		constructor(tables, targetTable, targetTableName, config) {
			super(targetTable, targetTableName);
			this.config = config;
			this.alias = config?.alias;
			this.where = config?.where;
			if (config?.from) this.sourceColumns = (Array.isArray(config.from) ? config.from : [config.from]).map((it) => {
				this.throughTable ??= it._.through ? tables[it._.through._.tableName] : void 0;
				this.sourceColumnTableNames.push(it._.tableName);
				return it._.column;
			});
			if (config?.to) this.targetColumns = (Array.isArray(config.to) ? config.to : [config.to]).map((it) => {
				this.throughTable ??= it._.through ? tables[it._.through._.tableName] : void 0;
				this.targetColumnTableNames.push(it._.tableName);
				return it._.column;
			});
			if (this.throughTable) this.through = {
				source: (Array.isArray(config?.from) ? config.from : config?.from ? [config.from] : []).map((c) => c._.through),
				target: (Array.isArray(config?.to) ? config.to : config?.to ? [config.to] : []).map((c) => c._.through)
			};
		}
		static [entityKind] = "ManyV2";
		relationType = "many";
	};
	AggregatedField = class {
		static [entityKind] = "AggregatedField";
		table;
		onTable(table) {
			this.table = table;
			return this;
		}
	};
	Count = class extends AggregatedField {
		static [entityKind] = "AggregatedFieldCount";
		query;
		getSQL() {
			if (!this.query) {
				if (!this.table) throw new Error("Table must be set before building aggregate field");
				this.query = sql`select count(*) as ${sql.identifier("r")} from ${getTableAsAliasSQL(this.table)}`.mapWith(Number);
			}
			return this.query;
		}
	};
	RelationsBuilderTable = class {
		static [entityKind] = "RelationsBuilderTable";
		_;
		constructor(table, name) {
			this._ = {
				name,
				table
			};
		}
	};
	RelationsBuilderColumn = class {
		static [entityKind] = "RelationsBuilderColumn";
		_;
		constructor(column, tableName, key) {
			this._ = {
				tableName,
				column,
				key
			};
		}
		through(column) {
			return new RelationsBuilderJunctionColumn(this._.column, this._.tableName, this._.key, column);
		}
	};
	RelationsBuilderJunctionColumn = class {
		static [entityKind] = "RelationsBuilderColumn";
		_;
		constructor(column, tableName, key, through) {
			this._ = {
				tableName,
				column,
				through,
				key
			};
		}
	};
	RelationsHelperStatic = class {
		static [entityKind] = "RelationsHelperStatic";
		_;
		constructor(tables) {
			this._ = { tables };
			const one = {};
			const many = {};
			for (const [tableName, table] of Object.entries(tables)) {
				one[tableName] = (config) => {
					return new One(tables, table, tableName, config);
				};
				many[tableName] = (config) => {
					return new Many(tables, table, tableName, config);
				};
			}
			this.one = one;
			this.many = many;
		}
		one;
		many;
		/** @internal - to be reworked */
		aggs = { count() {
			return new Count();
		} };
	};
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/aggregate.js
var init_aggregate = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/aggregate.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/vector.js
var init_vector = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/vector.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/index.js
var init_functions = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/functions/index.js": (() => {
	init_aggregate();
	init_vector();
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/index.js
var init_sql = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/index.js": (() => {
	init_expressions();
	init_functions();
	init_sql$1();
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/utils.js
var textDecoder;
var init_utils = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/utils.js": (() => {
	textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
}) });

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/index.js
var init_drizzle_orm = __esm({ "../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/index.js": (() => {
	init_alias();
	init_column_builder();
	init_column();
	init_entity();
	init_errors$1();
	init_logger();
	init_operations();
	init_query_promise();
	init_relations();
	init_sql();
	init_subquery();
	init_table();
	init_utils();
	init_view_common();
}) });

//#endregion
//#region ../../apps/honoken/src/db/index.ts
function getDbClient(_env, _logger) {
	return db;
}
var init_db = __esm({ "../../apps/honoken/src/db/index.ts": (() => {}) });

//#endregion
//#region ../../apps/honoken/src/utils/bounded-cache.ts
/**
* Create a bounded map with default or custom size limit
*/
function createBoundedMap(maxSize) {
	return new BoundedMap(maxSize);
}
var DEFAULT_MAX_SIZE, BoundedMap;
var init_bounded_cache = __esm({ "../../apps/honoken/src/utils/bounded-cache.ts": (() => {
	DEFAULT_MAX_SIZE = 100;
	BoundedMap = class {
		cache = /* @__PURE__ */ new Map();
		maxSize;
		constructor(maxSize = DEFAULT_MAX_SIZE) {
			this.maxSize = maxSize;
		}
		get(key) {
			return this.cache.get(key);
		}
		set(key, value) {
			if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
				const firstKey = this.cache.keys().next().value;
				if (firstKey !== void 0) this.cache.delete(firstKey);
			}
			this.cache.set(key, value);
			return this;
		}
		delete(key) {
			return this.cache.delete(key);
		}
		has(key) {
			return this.cache.has(key);
		}
		get size() {
			return this.cache.size;
		}
		clear() {
			this.cache.clear();
		}
		keys() {
			return this.cache.keys();
		}
		entries() {
			return this.cache.entries();
		}
		values() {
			return this.cache.values();
		}
		[Symbol.iterator]() {
			return this.cache.entries();
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/buffer_utils.js
function concat(...buffers) {
	const size = buffers.reduce((acc, { length }) => acc + length, 0);
	const buf = new Uint8Array(size);
	let i = 0;
	for (const buffer of buffers) {
		buf.set(buffer, i);
		i += buffer.length;
	}
	return buf;
}
var encoder, decoder, MAX_INT32;
var init_buffer_utils = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/buffer_utils.js": (() => {
	encoder = new TextEncoder();
	decoder = new TextDecoder();
	MAX_INT32 = 2 ** 32;
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/base64.js
function encodeBase64(input) {
	if (Uint8Array.prototype.toBase64) return input.toBase64();
	const CHUNK_SIZE = 32768;
	const arr = [];
	for (let i = 0; i < input.length; i += CHUNK_SIZE) arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
	return btoa(arr.join(""));
}
function decodeBase64(encoded) {
	if (Uint8Array.fromBase64) return Uint8Array.fromBase64(encoded);
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
var init_base64 = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/base64.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
	if (Uint8Array.fromBase64) return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), { alphabet: "base64url" });
	let encoded = input;
	if (encoded instanceof Uint8Array) encoded = decoder.decode(encoded);
	encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
	try {
		return decodeBase64(encoded);
	} catch {
		throw new TypeError("The input to be decoded is not correctly encoded.");
	}
}
function encode(input) {
	let unencoded = input;
	if (typeof unencoded === "string") unencoded = encoder.encode(unencoded);
	if (Uint8Array.prototype.toBase64) return unencoded.toBase64({
		alphabet: "base64url",
		omitPadding: true
	});
	return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
var init_base64url = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/util/base64url.js": (() => {
	init_buffer_utils();
	init_base64();
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/util/errors.js
var JOSEError, JOSENotSupported, JWSInvalid, JWTInvalid, JWKSMultipleMatchingKeys;
var init_errors = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/util/errors.js": (() => {
	JOSEError = class extends Error {
		static code = "ERR_JOSE_GENERIC";
		code = "ERR_JOSE_GENERIC";
		constructor(message$1, options) {
			super(message$1, options);
			this.name = this.constructor.name;
			Error.captureStackTrace?.(this, this.constructor);
		}
	};
	JOSENotSupported = class extends JOSEError {
		static code = "ERR_JOSE_NOT_SUPPORTED";
		code = "ERR_JOSE_NOT_SUPPORTED";
	};
	JWSInvalid = class extends JOSEError {
		static code = "ERR_JWS_INVALID";
		code = "ERR_JWS_INVALID";
	};
	JWTInvalid = class extends JOSEError {
		static code = "ERR_JWT_INVALID";
		code = "ERR_JWT_INVALID";
	};
	JWKSMultipleMatchingKeys = class extends JOSEError {
		[Symbol.asyncIterator];
		static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
		code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
		constructor(message$1 = "multiple matching keys found in the JSON Web Key Set", options) {
			super(message$1, options);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/crypto_key.js
function unusable(name, prop = "algorithm.name") {
	return /* @__PURE__ */ new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
function isAlgorithm(algorithm, name) {
	return algorithm.name === name;
}
function getHashLength(hash) {
	return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
	switch (alg) {
		case "ES256": return "P-256";
		case "ES384": return "P-384";
		case "ES512": return "P-521";
		default: throw new Error("unreachable");
	}
}
function checkUsage(key, usage) {
	if (usage && !key.usages.includes(usage)) throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkSigCryptoKey(key, alg, usage) {
	switch (alg) {
		case "HS256":
		case "HS384":
		case "HS512": {
			if (!isAlgorithm(key.algorithm, "HMAC")) throw unusable("HMAC");
			const expected = parseInt(alg.slice(2), 10);
			if (getHashLength(key.algorithm.hash) !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
			break;
		}
		case "RS256":
		case "RS384":
		case "RS512": {
			if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5")) throw unusable("RSASSA-PKCS1-v1_5");
			const expected = parseInt(alg.slice(2), 10);
			if (getHashLength(key.algorithm.hash) !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
			break;
		}
		case "PS256":
		case "PS384":
		case "PS512": {
			if (!isAlgorithm(key.algorithm, "RSA-PSS")) throw unusable("RSA-PSS");
			const expected = parseInt(alg.slice(2), 10);
			if (getHashLength(key.algorithm.hash) !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
			break;
		}
		case "Ed25519":
		case "EdDSA":
			if (!isAlgorithm(key.algorithm, "Ed25519")) throw unusable("Ed25519");
			break;
		case "ML-DSA-44":
		case "ML-DSA-65":
		case "ML-DSA-87":
			if (!isAlgorithm(key.algorithm, alg)) throw unusable(alg);
			break;
		case "ES256":
		case "ES384":
		case "ES512": {
			if (!isAlgorithm(key.algorithm, "ECDSA")) throw unusable("ECDSA");
			const expected = getNamedCurve(alg);
			if (key.algorithm.namedCurve !== expected) throw unusable(expected, "algorithm.namedCurve");
			break;
		}
		default: throw new TypeError("CryptoKey does not support this operation");
	}
	checkUsage(key, usage);
}
var init_crypto_key = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/crypto_key.js": (() => {}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
	types = types.filter(Boolean);
	if (types.length > 2) {
		const last = types.pop();
		msg += `one of type ${types.join(", ")}, or ${last}.`;
	} else if (types.length === 2) msg += `one of type ${types[0]} or ${types[1]}.`;
	else msg += `of type ${types[0]}.`;
	if (actual == null) msg += ` Received ${actual}`;
	else if (typeof actual === "function" && actual.name) msg += ` Received function ${actual.name}`;
	else if (typeof actual === "object" && actual != null) {
		if (actual.constructor?.name) msg += ` Received an instance of ${actual.constructor.name}`;
	}
	return msg;
}
function withAlg(alg, actual, ...types) {
	return message(`Key for the ${alg} algorithm must be `, actual, ...types);
}
var invalid_key_input_default;
var init_invalid_key_input = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/invalid_key_input.js": (() => {
	invalid_key_input_default = (actual, ...types) => {
		return message("Key must be ", actual, ...types);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_key_like.js
function isCryptoKey(key) {
	return key?.[Symbol.toStringTag] === "CryptoKey";
}
function isKeyObject(key) {
	return key?.[Symbol.toStringTag] === "KeyObject";
}
var is_key_like_default;
var init_is_key_like = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_key_like.js": (() => {
	is_key_like_default = (key) => {
		return isCryptoKey(key) || isKeyObject(key);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_disjoint.js
var is_disjoint_default;
var init_is_disjoint = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_disjoint.js": (() => {
	is_disjoint_default = (...headers) => {
		const sources = headers.filter(Boolean);
		if (sources.length === 0 || sources.length === 1) return true;
		let acc;
		for (const header of sources) {
			const parameters = Object.keys(header);
			if (!acc || acc.size === 0) {
				acc = new Set(parameters);
				continue;
			}
			for (const parameter of parameters) {
				if (acc.has(parameter)) return false;
				acc.add(parameter);
			}
		}
		return true;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_object.js
function isObjectLike(value) {
	return typeof value === "object" && value !== null;
}
var is_object_default;
var init_is_object = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_object.js": (() => {
	is_object_default = (input) => {
		if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") return false;
		if (Object.getPrototypeOf(input) === null) return true;
		let proto = input;
		while (Object.getPrototypeOf(proto) !== null) proto = Object.getPrototypeOf(proto);
		return Object.getPrototypeOf(input) === proto;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/check_key_length.js
var check_key_length_default;
var init_check_key_length = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/check_key_length.js": (() => {
	check_key_length_default = (alg, key) => {
		if (alg.startsWith("RS") || alg.startsWith("PS")) {
			const { modulusLength } = key.algorithm;
			if (typeof modulusLength !== "number" || modulusLength < 2048) throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/asn1.js
function parsePKCS8Header(state) {
	expectTag(state, 48, "Invalid PKCS#8 structure");
	parseLength(state);
	expectTag(state, 2, "Expected version field");
	const verLen = parseLength(state);
	state.pos += verLen;
	expectTag(state, 48, "Expected algorithm identifier");
	const algIdLen = parseLength(state);
	return {
		algIdStart: state.pos,
		algIdLength: algIdLen
	};
}
var bytesEqual, createASN1State, parseLength, expectTag, getSubarray, parseAlgorithmOID, parseECAlgorithmIdentifier, genericImport, processPEMData, fromPKCS8;
var init_asn1 = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/asn1.js": (() => {
	init_base64();
	init_errors();
	bytesEqual = (a, b) => {
		if (a.byteLength !== b.length) return false;
		for (let i = 0; i < a.byteLength; i++) if (a[i] !== b[i]) return false;
		return true;
	};
	createASN1State = (data) => ({
		data,
		pos: 0
	});
	parseLength = (state) => {
		const first = state.data[state.pos++];
		if (first & 128) {
			const lengthOfLen = first & 127;
			let length = 0;
			for (let i = 0; i < lengthOfLen; i++) length = length << 8 | state.data[state.pos++];
			return length;
		}
		return first;
	};
	expectTag = (state, expectedTag, errorMessage) => {
		if (state.data[state.pos++] !== expectedTag) throw new Error(errorMessage);
	};
	getSubarray = (state, length) => {
		const result = state.data.subarray(state.pos, state.pos + length);
		state.pos += length;
		return result;
	};
	parseAlgorithmOID = (state) => {
		expectTag(state, 6, "Expected algorithm OID");
		const oidLen = parseLength(state);
		return getSubarray(state, oidLen);
	};
	parseECAlgorithmIdentifier = (state) => {
		const algOid = parseAlgorithmOID(state);
		if (bytesEqual(algOid, [
			43,
			101,
			110
		])) return "X25519";
		if (!bytesEqual(algOid, [
			42,
			134,
			72,
			206,
			61,
			2,
			1
		])) throw new Error("Unsupported key algorithm");
		expectTag(state, 6, "Expected curve OID");
		const curveOidLen = parseLength(state);
		const curveOid = getSubarray(state, curveOidLen);
		for (const { name, oid } of [
			{
				name: "P-256",
				oid: [
					42,
					134,
					72,
					206,
					61,
					3,
					1,
					7
				]
			},
			{
				name: "P-384",
				oid: [
					43,
					129,
					4,
					0,
					34
				]
			},
			{
				name: "P-521",
				oid: [
					43,
					129,
					4,
					0,
					35
				]
			}
		]) if (bytesEqual(curveOid, oid)) return name;
		throw new Error("Unsupported named curve");
	};
	genericImport = async (keyFormat, keyData, alg, options) => {
		let algorithm;
		let keyUsages;
		const isPublic = keyFormat === "spki";
		const getSigUsages = () => isPublic ? ["verify"] : ["sign"];
		const getEncUsages = () => isPublic ? ["encrypt", "wrapKey"] : ["decrypt", "unwrapKey"];
		switch (alg) {
			case "PS256":
			case "PS384":
			case "PS512":
				algorithm = {
					name: "RSA-PSS",
					hash: `SHA-${alg.slice(-3)}`
				};
				keyUsages = getSigUsages();
				break;
			case "RS256":
			case "RS384":
			case "RS512":
				algorithm = {
					name: "RSASSA-PKCS1-v1_5",
					hash: `SHA-${alg.slice(-3)}`
				};
				keyUsages = getSigUsages();
				break;
			case "RSA-OAEP":
			case "RSA-OAEP-256":
			case "RSA-OAEP-384":
			case "RSA-OAEP-512":
				algorithm = {
					name: "RSA-OAEP",
					hash: `SHA-${parseInt(alg.slice(-3), 10) || 1}`
				};
				keyUsages = getEncUsages();
				break;
			case "ES256":
			case "ES384":
			case "ES512":
				algorithm = {
					name: "ECDSA",
					namedCurve: {
						ES256: "P-256",
						ES384: "P-384",
						ES512: "P-521"
					}[alg]
				};
				keyUsages = getSigUsages();
				break;
			case "ECDH-ES":
			case "ECDH-ES+A128KW":
			case "ECDH-ES+A192KW":
			case "ECDH-ES+A256KW":
				try {
					const namedCurve = options.getNamedCurve(keyData);
					algorithm = namedCurve === "X25519" ? { name: "X25519" } : {
						name: "ECDH",
						namedCurve
					};
				} catch (cause) {
					throw new JOSENotSupported("Invalid or unsupported key format");
				}
				keyUsages = isPublic ? [] : ["deriveBits"];
				break;
			case "Ed25519":
			case "EdDSA":
				algorithm = { name: "Ed25519" };
				keyUsages = getSigUsages();
				break;
			case "ML-DSA-44":
			case "ML-DSA-65":
			case "ML-DSA-87":
				algorithm = { name: alg };
				keyUsages = getSigUsages();
				break;
			default: throw new JOSENotSupported("Invalid or unsupported \"alg\" (Algorithm) value");
		}
		return crypto.subtle.importKey(keyFormat, keyData, algorithm, options?.extractable ?? (isPublic ? true : false), keyUsages);
	};
	processPEMData = (pem, pattern) => {
		return decodeBase64(pem.replace(pattern, ""));
	};
	fromPKCS8 = (pem, alg, options) => {
		const keyData = processPEMData(pem, /(?:-----(?:BEGIN|END) PRIVATE KEY-----|\s)/g);
		let opts = options;
		if (alg?.startsWith?.("ECDH-ES")) {
			opts ||= {};
			opts.getNamedCurve = (keyData$1) => {
				const state = createASN1State(keyData$1);
				parsePKCS8Header(state);
				return parseECAlgorithmIdentifier(state);
			};
		}
		return genericImport("pkcs8", keyData, alg, opts);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
	let algorithm;
	let keyUsages;
	switch (jwk.kty) {
		case "AKP":
			switch (jwk.alg) {
				case "ML-DSA-44":
				case "ML-DSA-65":
				case "ML-DSA-87":
					algorithm = { name: jwk.alg };
					keyUsages = jwk.priv ? ["sign"] : ["verify"];
					break;
				default: throw new JOSENotSupported("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		case "RSA":
			switch (jwk.alg) {
				case "PS256":
				case "PS384":
				case "PS512":
					algorithm = {
						name: "RSA-PSS",
						hash: `SHA-${jwk.alg.slice(-3)}`
					};
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "RS256":
				case "RS384":
				case "RS512":
					algorithm = {
						name: "RSASSA-PKCS1-v1_5",
						hash: `SHA-${jwk.alg.slice(-3)}`
					};
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "RSA-OAEP":
				case "RSA-OAEP-256":
				case "RSA-OAEP-384":
				case "RSA-OAEP-512":
					algorithm = {
						name: "RSA-OAEP",
						hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
					};
					keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
					break;
				default: throw new JOSENotSupported("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		case "EC":
			switch (jwk.alg) {
				case "ES256":
					algorithm = {
						name: "ECDSA",
						namedCurve: "P-256"
					};
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "ES384":
					algorithm = {
						name: "ECDSA",
						namedCurve: "P-384"
					};
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "ES512":
					algorithm = {
						name: "ECDSA",
						namedCurve: "P-521"
					};
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "ECDH-ES":
				case "ECDH-ES+A128KW":
				case "ECDH-ES+A192KW":
				case "ECDH-ES+A256KW":
					algorithm = {
						name: "ECDH",
						namedCurve: jwk.crv
					};
					keyUsages = jwk.d ? ["deriveBits"] : [];
					break;
				default: throw new JOSENotSupported("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		case "OKP":
			switch (jwk.alg) {
				case "Ed25519":
				case "EdDSA":
					algorithm = { name: "Ed25519" };
					keyUsages = jwk.d ? ["sign"] : ["verify"];
					break;
				case "ECDH-ES":
				case "ECDH-ES+A128KW":
				case "ECDH-ES+A192KW":
				case "ECDH-ES+A256KW":
					algorithm = { name: jwk.crv };
					keyUsages = jwk.d ? ["deriveBits"] : [];
					break;
				default: throw new JOSENotSupported("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		default: throw new JOSENotSupported("Invalid or unsupported JWK \"kty\" (Key Type) Parameter value");
	}
	return {
		algorithm,
		keyUsages
	};
}
var jwk_to_key_default;
var init_jwk_to_key = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/jwk_to_key.js": (() => {
	init_errors();
	jwk_to_key_default = async (jwk) => {
		if (!jwk.alg) throw new TypeError("\"alg\" argument is required when \"jwk.alg\" is not present");
		const { algorithm, keyUsages } = subtleMapping(jwk);
		const keyData = { ...jwk };
		if (keyData.kty !== "AKP") delete keyData.alg;
		delete keyData.use;
		return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/key/import.js
async function importPKCS8(pkcs8, alg, options) {
	if (typeof pkcs8 !== "string" || pkcs8.indexOf("-----BEGIN PRIVATE KEY-----") !== 0) throw new TypeError("\"pkcs8\" must be PKCS#8 formatted string");
	return fromPKCS8(pkcs8, alg, options);
}
var init_import = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/key/import.js": (() => {
	init_asn1();
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/validate_crit.js
var validate_crit_default;
var init_validate_crit = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/validate_crit.js": (() => {
	init_errors();
	validate_crit_default = (Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) => {
		if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) throw new Err("\"crit\" (Critical) Header Parameter MUST be integrity protected");
		if (!protectedHeader || protectedHeader.crit === void 0) return /* @__PURE__ */ new Set();
		if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) throw new Err("\"crit\" (Critical) Header Parameter MUST be an array of non-empty strings when present");
		let recognized;
		if (recognizedOption !== void 0) recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
		else recognized = recognizedDefault;
		for (const parameter of protectedHeader.crit) {
			if (!recognized.has(parameter)) throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
			if (joseHeader[parameter] === void 0) throw new Err(`Extension Header Parameter "${parameter}" is missing`);
			if (recognized.get(parameter) && protectedHeader[parameter] === void 0) throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
		}
		return new Set(protectedHeader.crit);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_jwk.js
function isJWK(key) {
	return is_object_default(key) && typeof key.kty === "string";
}
function isPrivateJWK(key) {
	return key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
}
function isPublicJWK(key) {
	return key.kty !== "oct" && typeof key.d === "undefined" && typeof key.priv === "undefined";
}
function isSecretJWK(key) {
	return key.kty === "oct" && typeof key.k === "string";
}
var init_is_jwk = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/is_jwk.js": (() => {
	init_is_object();
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/normalize_key.js
var cache, handleJWK, handleKeyObject, normalize_key_default;
var init_normalize_key = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/normalize_key.js": (() => {
	init_is_jwk();
	init_base64url();
	init_jwk_to_key();
	init_is_key_like();
	;
	handleJWK = async (key, jwk, alg, freeze = false) => {
		cache ||= /* @__PURE__ */ new WeakMap();
		let cached = cache.get(key);
		if (cached?.[alg]) return cached[alg];
		const cryptoKey = await jwk_to_key_default({
			...jwk,
			alg
		});
		if (freeze) Object.freeze(key);
		if (!cached) cache.set(key, { [alg]: cryptoKey });
		else cached[alg] = cryptoKey;
		return cryptoKey;
	};
	handleKeyObject = (keyObject, alg) => {
		cache ||= /* @__PURE__ */ new WeakMap();
		let cached = cache.get(keyObject);
		if (cached?.[alg]) return cached[alg];
		const isPublic = keyObject.type === "public";
		const extractable = isPublic ? true : false;
		let cryptoKey;
		if (keyObject.asymmetricKeyType === "x25519") {
			switch (alg) {
				case "ECDH-ES":
				case "ECDH-ES+A128KW":
				case "ECDH-ES+A192KW":
				case "ECDH-ES+A256KW": break;
				default: throw new TypeError("given KeyObject instance cannot be used for this algorithm");
			}
			cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
		}
		if (keyObject.asymmetricKeyType === "ed25519") {
			if (alg !== "EdDSA" && alg !== "Ed25519") throw new TypeError("given KeyObject instance cannot be used for this algorithm");
			cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [isPublic ? "verify" : "sign"]);
		}
		switch (keyObject.asymmetricKeyType) {
			case "ml-dsa-44":
			case "ml-dsa-65":
			case "ml-dsa-87":
				if (alg !== keyObject.asymmetricKeyType.toUpperCase()) throw new TypeError("given KeyObject instance cannot be used for this algorithm");
				cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [isPublic ? "verify" : "sign"]);
		}
		if (keyObject.asymmetricKeyType === "rsa") {
			let hash;
			switch (alg) {
				case "RSA-OAEP":
					hash = "SHA-1";
					break;
				case "RS256":
				case "PS256":
				case "RSA-OAEP-256":
					hash = "SHA-256";
					break;
				case "RS384":
				case "PS384":
				case "RSA-OAEP-384":
					hash = "SHA-384";
					break;
				case "RS512":
				case "PS512":
				case "RSA-OAEP-512":
					hash = "SHA-512";
					break;
				default: throw new TypeError("given KeyObject instance cannot be used for this algorithm");
			}
			if (alg.startsWith("RSA-OAEP")) return keyObject.toCryptoKey({
				name: "RSA-OAEP",
				hash
			}, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
			cryptoKey = keyObject.toCryptoKey({
				name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
				hash
			}, extractable, [isPublic ? "verify" : "sign"]);
		}
		if (keyObject.asymmetricKeyType === "ec") {
			const namedCurve = new Map([
				["prime256v1", "P-256"],
				["secp384r1", "P-384"],
				["secp521r1", "P-521"]
			]).get(keyObject.asymmetricKeyDetails?.namedCurve);
			if (!namedCurve) throw new TypeError("given KeyObject instance cannot be used for this algorithm");
			if (alg === "ES256" && namedCurve === "P-256") cryptoKey = keyObject.toCryptoKey({
				name: "ECDSA",
				namedCurve
			}, extractable, [isPublic ? "verify" : "sign"]);
			if (alg === "ES384" && namedCurve === "P-384") cryptoKey = keyObject.toCryptoKey({
				name: "ECDSA",
				namedCurve
			}, extractable, [isPublic ? "verify" : "sign"]);
			if (alg === "ES512" && namedCurve === "P-521") cryptoKey = keyObject.toCryptoKey({
				name: "ECDSA",
				namedCurve
			}, extractable, [isPublic ? "verify" : "sign"]);
			if (alg.startsWith("ECDH-ES")) cryptoKey = keyObject.toCryptoKey({
				name: "ECDH",
				namedCurve
			}, extractable, isPublic ? [] : ["deriveBits"]);
		}
		if (!cryptoKey) throw new TypeError("given KeyObject instance cannot be used for this algorithm");
		if (!cached) cache.set(keyObject, { [alg]: cryptoKey });
		else cached[alg] = cryptoKey;
		return cryptoKey;
	};
	normalize_key_default = async (key, alg) => {
		if (key instanceof Uint8Array) return key;
		if (isCryptoKey(key)) return key;
		if (isKeyObject(key)) {
			if (key.type === "secret") return key.export();
			if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") try {
				return handleKeyObject(key, alg);
			} catch (err) {
				if (err instanceof TypeError) throw err;
			}
			let jwk = key.export({ format: "jwk" });
			return handleJWK(key, jwk, alg);
		}
		if (isJWK(key)) {
			if (key.k) return decode(key.k);
			return handleJWK(key, key, alg, true);
		}
		throw new Error("unreachable");
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/check_key_type.js
var tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck, check_key_type_default;
var init_check_key_type = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/check_key_type.js": (() => {
	init_invalid_key_input();
	init_is_key_like();
	init_is_jwk();
	tag = (key) => key?.[Symbol.toStringTag];
	jwkMatchesOp = (alg, key, usage) => {
		if (key.use !== void 0) {
			let expected;
			switch (usage) {
				case "sign":
				case "verify":
					expected = "sig";
					break;
				case "encrypt":
				case "decrypt":
					expected = "enc";
					break;
			}
			if (key.use !== expected) throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
		}
		if (key.alg !== void 0 && key.alg !== alg) throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
		if (Array.isArray(key.key_ops)) {
			let expectedKeyOp;
			switch (true) {
				case usage === "sign" || usage === "verify":
				case alg === "dir":
				case alg.includes("CBC-HS"):
					expectedKeyOp = usage;
					break;
				case alg.startsWith("PBES2"):
					expectedKeyOp = "deriveBits";
					break;
				case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
					if (!alg.includes("GCM") && alg.endsWith("KW")) expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
					else expectedKeyOp = usage;
					break;
				case usage === "encrypt" && alg.startsWith("RSA"):
					expectedKeyOp = "wrapKey";
					break;
				case usage === "decrypt":
					expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
					break;
			}
			if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
		}
		return true;
	};
	symmetricTypeCheck = (alg, key, usage) => {
		if (key instanceof Uint8Array) return;
		if (isJWK(key)) {
			if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage)) return;
			throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
		}
		if (!is_key_like_default(key)) throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
		if (key.type !== "secret") throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
	};
	asymmetricTypeCheck = (alg, key, usage) => {
		if (isJWK(key)) switch (usage) {
			case "decrypt":
			case "sign":
				if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage)) return;
				throw new TypeError(`JSON Web Key for this operation be a private JWK`);
			case "encrypt":
			case "verify":
				if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage)) return;
				throw new TypeError(`JSON Web Key for this operation be a public JWK`);
		}
		if (!is_key_like_default(key)) throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
		if (key.type === "secret") throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
		if (key.type === "public") switch (usage) {
			case "sign": throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
			case "decrypt": throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
			default: break;
		}
		if (key.type === "private") switch (usage) {
			case "verify": throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
			case "encrypt": throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
			default: break;
		}
	};
	check_key_type_default = (alg, key, usage) => {
		if (alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A(?:128|192|256)(?:GCM)?(?:KW)?$/.test(alg) || /^A(?:128|192|256)CBC-HS(?:256|384|512)$/.test(alg)) symmetricTypeCheck(alg, key, usage);
		else asymmetricTypeCheck(alg, key, usage);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/subtle_dsa.js
var subtle_dsa_default;
var init_subtle_dsa = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/subtle_dsa.js": (() => {
	init_errors();
	subtle_dsa_default = (alg, algorithm) => {
		const hash = `SHA-${alg.slice(-3)}`;
		switch (alg) {
			case "HS256":
			case "HS384":
			case "HS512": return {
				hash,
				name: "HMAC"
			};
			case "PS256":
			case "PS384":
			case "PS512": return {
				hash,
				name: "RSA-PSS",
				saltLength: parseInt(alg.slice(-3), 10) >> 3
			};
			case "RS256":
			case "RS384":
			case "RS512": return {
				hash,
				name: "RSASSA-PKCS1-v1_5"
			};
			case "ES256":
			case "ES384":
			case "ES512": return {
				hash,
				name: "ECDSA",
				namedCurve: algorithm.namedCurve
			};
			case "Ed25519":
			case "EdDSA": return { name: "Ed25519" };
			case "ML-DSA-44":
			case "ML-DSA-65":
			case "ML-DSA-87": return { name: alg };
			default: throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/get_sign_verify_key.js
var get_sign_verify_key_default;
var init_get_sign_verify_key = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/get_sign_verify_key.js": (() => {
	init_crypto_key();
	init_invalid_key_input();
	get_sign_verify_key_default = async (alg, key, usage) => {
		if (key instanceof Uint8Array) {
			if (!alg.startsWith("HS")) throw new TypeError(invalid_key_input_default(key, "CryptoKey", "KeyObject", "JSON Web Key"));
			return crypto.subtle.importKey("raw", key, {
				hash: `SHA-${alg.slice(-3)}`,
				name: "HMAC"
			}, false, [usage]);
		}
		checkSigCryptoKey(key, alg, usage);
		return key;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/epoch.js
var epoch_default;
var init_epoch = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/epoch.js": (() => {
	epoch_default = (date) => Math.floor(date.getTime() / 1e3);
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/secs.js
var minute, hour, day, week, year, REGEX, secs_default;
var init_secs = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/secs.js": (() => {
	minute = 60;
	hour = minute * 60;
	day = hour * 24;
	week = day * 7;
	year = day * 365.25;
	REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
	secs_default = (str) => {
		const matched = REGEX.exec(str);
		if (!matched || matched[4] && matched[1]) throw new TypeError("Invalid time period format");
		const value = parseFloat(matched[2]);
		const unit = matched[3].toLowerCase();
		let numericDate;
		switch (unit) {
			case "sec":
			case "secs":
			case "second":
			case "seconds":
			case "s":
				numericDate = Math.round(value);
				break;
			case "minute":
			case "minutes":
			case "min":
			case "mins":
			case "m":
				numericDate = Math.round(value * minute);
				break;
			case "hour":
			case "hours":
			case "hr":
			case "hrs":
			case "h":
				numericDate = Math.round(value * hour);
				break;
			case "day":
			case "days":
			case "d":
				numericDate = Math.round(value * day);
				break;
			case "week":
			case "weeks":
			case "w":
				numericDate = Math.round(value * week);
				break;
			default:
				numericDate = Math.round(value * year);
				break;
		}
		if (matched[1] === "-" || matched[4] === "ago") return -numericDate;
		return numericDate;
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/jwt_claims_set.js
function validateInput(label, input) {
	if (!Number.isFinite(input)) throw new TypeError(`Invalid ${label} input`);
	return input;
}
var JWTClaimsBuilder;
var init_jwt_claims_set = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/jwt_claims_set.js": (() => {
	init_epoch();
	init_secs();
	init_is_object();
	init_buffer_utils();
	JWTClaimsBuilder = class {
		#payload;
		constructor(payload) {
			if (!is_object_default(payload)) throw new TypeError("JWT Claims Set MUST be an object");
			this.#payload = structuredClone(payload);
		}
		data() {
			return encoder.encode(JSON.stringify(this.#payload));
		}
		get iss() {
			return this.#payload.iss;
		}
		set iss(value) {
			this.#payload.iss = value;
		}
		get sub() {
			return this.#payload.sub;
		}
		set sub(value) {
			this.#payload.sub = value;
		}
		get aud() {
			return this.#payload.aud;
		}
		set aud(value) {
			this.#payload.aud = value;
		}
		set jti(value) {
			this.#payload.jti = value;
		}
		set nbf(value) {
			if (typeof value === "number") this.#payload.nbf = validateInput("setNotBefore", value);
			else if (value instanceof Date) this.#payload.nbf = validateInput("setNotBefore", epoch_default(value));
			else this.#payload.nbf = epoch_default(/* @__PURE__ */ new Date()) + secs_default(value);
		}
		set exp(value) {
			if (typeof value === "number") this.#payload.exp = validateInput("setExpirationTime", value);
			else if (value instanceof Date) this.#payload.exp = validateInput("setExpirationTime", epoch_default(value));
			else this.#payload.exp = epoch_default(/* @__PURE__ */ new Date()) + secs_default(value);
		}
		set iat(value) {
			if (typeof value === "undefined") this.#payload.iat = epoch_default(/* @__PURE__ */ new Date());
			else if (value instanceof Date) this.#payload.iat = validateInput("setIssuedAt", epoch_default(value));
			else if (typeof value === "string") this.#payload.iat = validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(value));
			else this.#payload.iat = validateInput("setIssuedAt", value);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/sign.js
var sign_default;
var init_sign$3 = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/lib/sign.js": (() => {
	init_subtle_dsa();
	init_check_key_length();
	init_get_sign_verify_key();
	sign_default = async (alg, key, data) => {
		const cryptoKey = await get_sign_verify_key_default(alg, key, "sign");
		check_key_length_default(alg, cryptoKey);
		const signature = await crypto.subtle.sign(subtle_dsa_default(alg, cryptoKey.algorithm), cryptoKey, data);
		return new Uint8Array(signature);
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign;
var init_sign$2 = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jws/flattened/sign.js": (() => {
	init_base64url();
	init_sign$3();
	init_is_disjoint();
	init_errors();
	init_buffer_utils();
	init_check_key_type();
	init_validate_crit();
	init_normalize_key();
	FlattenedSign = class {
		#payload;
		#protectedHeader;
		#unprotectedHeader;
		constructor(payload) {
			if (!(payload instanceof Uint8Array)) throw new TypeError("payload must be an instance of Uint8Array");
			this.#payload = payload;
		}
		setProtectedHeader(protectedHeader) {
			if (this.#protectedHeader) throw new TypeError("setProtectedHeader can only be called once");
			this.#protectedHeader = protectedHeader;
			return this;
		}
		setUnprotectedHeader(unprotectedHeader) {
			if (this.#unprotectedHeader) throw new TypeError("setUnprotectedHeader can only be called once");
			this.#unprotectedHeader = unprotectedHeader;
			return this;
		}
		async sign(key, options) {
			if (!this.#protectedHeader && !this.#unprotectedHeader) throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
			if (!is_disjoint_default(this.#protectedHeader, this.#unprotectedHeader)) throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
			const joseHeader = {
				...this.#protectedHeader,
				...this.#unprotectedHeader
			};
			const extensions = validate_crit_default(JWSInvalid, new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
			let b64 = true;
			if (extensions.has("b64")) {
				b64 = this.#protectedHeader.b64;
				if (typeof b64 !== "boolean") throw new JWSInvalid("The \"b64\" (base64url-encode payload) Header Parameter must be a boolean");
			}
			const { alg } = joseHeader;
			if (typeof alg !== "string" || !alg) throw new JWSInvalid("JWS \"alg\" (Algorithm) Header Parameter missing or invalid");
			check_key_type_default(alg, key, "sign");
			let payload = this.#payload;
			if (b64) payload = encoder.encode(encode(payload));
			let protectedHeader;
			if (this.#protectedHeader) protectedHeader = encoder.encode(encode(JSON.stringify(this.#protectedHeader)));
			else protectedHeader = encoder.encode("");
			const data = concat(protectedHeader, encoder.encode("."), payload);
			const k = await normalize_key_default(key, alg);
			const signature = await sign_default(alg, k, data);
			const jws = {
				signature: encode(signature),
				payload: ""
			};
			if (b64) jws.payload = decoder.decode(payload);
			if (this.#unprotectedHeader) jws.header = this.#unprotectedHeader;
			if (this.#protectedHeader) jws.protected = decoder.decode(protectedHeader);
			return jws;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign;
var init_sign$1 = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jws/compact/sign.js": (() => {
	init_sign$2();
	CompactSign = class {
		#flattened;
		constructor(payload) {
			this.#flattened = new FlattenedSign(payload);
		}
		setProtectedHeader(protectedHeader) {
			this.#flattened.setProtectedHeader(protectedHeader);
			return this;
		}
		async sign(key, options) {
			const jws = await this.#flattened.sign(key, options);
			if (jws.payload === void 0) throw new TypeError("use the flattened module for creating JWS with b64: false");
			return `${jws.protected}.${jws.payload}.${jws.signature}`;
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT;
var init_sign = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/jwt/sign.js": (() => {
	init_sign$1();
	init_errors();
	init_jwt_claims_set();
	SignJWT = class {
		#protectedHeader;
		#jwt;
		constructor(payload = {}) {
			this.#jwt = new JWTClaimsBuilder(payload);
		}
		setIssuer(issuer) {
			this.#jwt.iss = issuer;
			return this;
		}
		setSubject(subject) {
			this.#jwt.sub = subject;
			return this;
		}
		setAudience(audience) {
			this.#jwt.aud = audience;
			return this;
		}
		setJti(jwtId) {
			this.#jwt.jti = jwtId;
			return this;
		}
		setNotBefore(input) {
			this.#jwt.nbf = input;
			return this;
		}
		setExpirationTime(input) {
			this.#jwt.exp = input;
			return this;
		}
		setIssuedAt(input) {
			this.#jwt.iat = input;
			return this;
		}
		setProtectedHeader(protectedHeader) {
			this.#protectedHeader = protectedHeader;
			return this;
		}
		async sign(key, options) {
			const sig = new CompactSign(this.#jwt.data());
			sig.setProtectedHeader(this.#protectedHeader);
			if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
			return sig.sign(key, options);
		}
	};
}) });

//#endregion
//#region ../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/index.js
var init_webapi = __esm({ "../../node_modules/.bun/jose@6.1.0/node_modules/jose/dist/webapi/index.js": (() => {
	init_sign();
	init_import();
}) });

//#endregion
//#region ../../node_modules/.bun/is-network-error@1.3.0/node_modules/is-network-error/index.js
function isNetworkError(error) {
	if (!(error && isError(error) && error.name === "TypeError" && typeof error.message === "string")) return false;
	const { message: message$1, stack } = error;
	if (message$1 === "Load failed") return stack === void 0 || "__sentry_captured__" in error;
	if (message$1.startsWith("error sending request for url")) return true;
	return errorMessages.has(message$1);
}
var objectToString, isError, errorMessages;
var init_is_network_error = __esm({ "../../node_modules/.bun/is-network-error@1.3.0/node_modules/is-network-error/index.js": (() => {
	objectToString = Object.prototype.toString;
	isError = (value) => objectToString.call(value) === "[object Error]";
	errorMessages = new Set([
		"network error",
		"Failed to fetch",
		"NetworkError when attempting to fetch resource.",
		"The Internet connection appears to be offline.",
		"Network request failed",
		"fetch failed",
		"terminated",
		" A network error occurred.",
		"Network connection lost"
	]);
}) });

//#endregion
//#region ../../node_modules/.bun/p-retry@7.0.0/node_modules/p-retry/index.js
function validateRetries(retries) {
	if (typeof retries === "number") {
		if (retries < 0) throw new TypeError("Expected `retries` to be a non-negative number.");
		if (Number.isNaN(retries)) throw new TypeError("Expected `retries` to be a valid number or Infinity, got NaN.");
	} else if (retries !== void 0) throw new TypeError("Expected `retries` to be a number or Infinity.");
}
function validateNumberOption(name, value, { min = 0, allowInfinity = false } = {}) {
	if (value === void 0) return;
	if (typeof value !== "number" || Number.isNaN(value)) throw new TypeError(`Expected \`${name}\` to be a number${allowInfinity ? " or Infinity" : ""}.`);
	if (!allowInfinity && !Number.isFinite(value)) throw new TypeError(`Expected \`${name}\` to be a finite number.`);
	if (value < min) throw new TypeError(`Expected \`${name}\` to be \u2265 ${min}.`);
}
function calculateDelay(attempt, options) {
	const random = options.randomize ? Math.random() + 1 : 1;
	let timeout = Math.round(random * Math.max(options.minTimeout, 1) * options.factor ** (attempt - 1));
	timeout = Math.min(timeout, options.maxTimeout);
	return timeout;
}
async function onAttemptFailure(error, attemptNumber, options, startTime, maxRetryTime) {
	let normalizedError = error;
	if (!(normalizedError instanceof Error)) normalizedError = /* @__PURE__ */ new TypeError(`Non-error was thrown: "${normalizedError}". You should only throw errors.`);
	if (normalizedError instanceof AbortError) throw normalizedError.originalError;
	if (normalizedError instanceof TypeError && !isNetworkError(normalizedError)) throw normalizedError;
	const context = createRetryContext(normalizedError, attemptNumber, options);
	await options.onFailedAttempt(context);
	const currentTime = Date.now();
	if (currentTime - startTime >= maxRetryTime || attemptNumber >= options.retries + 1 || !await options.shouldRetry(context)) throw normalizedError;
	const delayTime = calculateDelay(attemptNumber, options);
	const timeLeft = maxRetryTime - (currentTime - startTime);
	if (timeLeft <= 0) throw normalizedError;
	const finalDelay = Math.min(delayTime, timeLeft);
	if (finalDelay > 0) await new Promise((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timeoutToken);
			options.signal?.removeEventListener("abort", onAbort);
			reject(options.signal.reason);
		};
		const timeoutToken = setTimeout(() => {
			options.signal?.removeEventListener("abort", onAbort);
			resolve();
		}, finalDelay);
		if (options.unref) timeoutToken.unref?.();
		options.signal?.addEventListener("abort", onAbort, { once: true });
	});
	options.signal?.throwIfAborted();
}
async function pRetry(input, options = {}) {
	options = { ...options };
	validateRetries(options.retries);
	if (Object.hasOwn(options, "forever")) throw new Error("The `forever` option is no longer supported. For many use-cases, you can set `retries: Infinity` instead.");
	options.retries ??= 10;
	options.factor ??= 2;
	options.minTimeout ??= 1e3;
	options.maxTimeout ??= Number.POSITIVE_INFINITY;
	options.randomize ??= false;
	options.onFailedAttempt ??= () => {};
	options.shouldRetry ??= () => true;
	validateNumberOption("factor", options.factor, {
		min: 0,
		allowInfinity: false
	});
	validateNumberOption("minTimeout", options.minTimeout, {
		min: 0,
		allowInfinity: false
	});
	validateNumberOption("maxTimeout", options.maxTimeout, {
		min: 0,
		allowInfinity: true
	});
	const resolvedMaxRetryTime = options.maxRetryTime ?? Number.POSITIVE_INFINITY;
	validateNumberOption("maxRetryTime", resolvedMaxRetryTime, {
		min: 0,
		allowInfinity: true
	});
	if (!(options.factor > 0)) options.factor = 1;
	options.signal?.throwIfAborted();
	let attemptNumber = 0;
	const startTime = Date.now();
	const maxRetryTime = resolvedMaxRetryTime;
	while (attemptNumber < options.retries + 1) {
		attemptNumber++;
		try {
			options.signal?.throwIfAborted();
			const result = await input(attemptNumber);
			options.signal?.throwIfAborted();
			return result;
		} catch (error) {
			await onAttemptFailure(error, attemptNumber, options, startTime, maxRetryTime);
		}
	}
	throw new Error("Retry attempts exhausted without throwing an error.");
}
var AbortError, createRetryContext;
var init_p_retry = __esm({ "../../node_modules/.bun/p-retry@7.0.0/node_modules/p-retry/index.js": (() => {
	init_is_network_error();
	AbortError = class extends Error {
		constructor(message$1) {
			super();
			if (message$1 instanceof Error) {
				this.originalError = message$1;
				({message: message$1} = message$1);
			} else {
				this.originalError = new Error(message$1);
				this.originalError.stack = this.stack;
			}
			this.name = "AbortError";
			this.message = message$1;
		}
	};
	createRetryContext = (error, attemptNumber, options) => {
		const retriesLeft = options.retries - (attemptNumber - 1);
		return Object.freeze({
			error,
			attemptNumber,
			retriesLeft
		});
	};
}) });

//#endregion
//#region ../../apps/honoken/src/utils/crypto.ts
/**
* Helper to convert Base64 to ArrayBuffer
*/
function base64ToArrayBuffer(base64) {
	const buffer = Buffer.from(base64, "base64");
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
/**
* Retrieves a versioned encryption key from environment variables.
* Implements in-memory caching for imported keys.
*
* @param env - The Worker environment
* @param version - The key version to retrieve (e.g., 'v1')
* @returns The validated CryptoKey for AES-GCM encryption/decryption
* @throws If the requested key version is not found or has invalid length
*/
async function getVersionedEncryptionKey(env, version) {
	const cached = cachedKeys.get(version);
	if (cached !== void 0) return cached;
	const envVarName = `HONOKEN_ENCRYPTION_KEY_${version.toUpperCase()}`;
	const dynamicValue = env[envVarName] ?? process.env[envVarName];
	if (typeof dynamicValue !== "string" || dynamicValue.length === 0) throw new Error(`Encryption key ${envVarName} is not set.`);
	const keyBytes = base64ToArrayBuffer(dynamicValue);
	if (![
		16,
		24,
		32
	].includes(keyBytes.byteLength)) throw new Error(`Invalid ${envVarName} length: ${keyBytes.byteLength} bytes. Must be 16, 24, or 32 bytes.`);
	const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
	cachedKeys.set(version, cryptoKey);
	return cryptoKey;
}
/**
* Decrypts versioned ciphertext using the appropriate key version.
* Expects format: "version:iv:encryptedData"
*
* @param versionedCiphertext - The versioned ciphertext to decrypt
* @param env - The Worker environment
* @returns The decrypted data as ArrayBuffer
*/
async function decryptWithVersion(versionedCiphertext, env) {
	const parts = versionedCiphertext.split(":");
	if (parts.length !== 3) throw new Error("Invalid versioned ciphertext format. Expected \"version:iv:encryptedData\"");
	const [version, ivBase64, encryptedBase64] = parts;
	const cryptoKey = await getVersionedEncryptionKey(env, version);
	const iv = base64ToArrayBuffer(ivBase64);
	const encryptedData = base64ToArrayBuffer(encryptedBase64);
	return await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv
	}, cryptoKey, encryptedData);
}
var cachedKeys;
var init_crypto = __esm({ "../../apps/honoken/src/utils/crypto.ts": (() => {
	cachedKeys = /* @__PURE__ */ new Map();
}) });

//#endregion
//#region ../../apps/honoken/src/passkit/apnsKeys.ts
/**
* Loads APNs key data by keyRef from database, with in-memory caching.
*
* Workflow:
* 1. Check in-memory cache
* 2. If cache hit, verify DB last updated timestamp
* 3. If stale or cache miss, query DB for keyRef to get encrypted data
* 4. Decrypt the data
* 5. Parse and return the APNs key data
*
* @param keyRef - The key reference identifier
* @param env - The Worker environment (provides DB binding)
* @param logger - Logger instance
* @returns The loaded APNs key data or null if not found
* @throws If decryption fails or other errors occur
*/
async function loadApnsKeyData(keyRef, env, logger) {
	const cacheKey = keyRef;
	const cachedEntry = apnsKeyCache.get(cacheKey);
	if (cachedEntry) {
		const latestUpdatedAt = (await getDbClient(env, logger).select({ updatedAt: schema.walletApnsKey.updatedAt }).from(schema.walletApnsKey).where(eq(schema.walletApnsKey.keyRef, keyRef)).limit(1).then((r) => r[0]))?.updatedAt;
		if (!latestUpdatedAt || cachedEntry.dbLastUpdatedAt < latestUpdatedAt) apnsKeyCache.delete(cacheKey);
		else return cachedEntry.data;
	}
	try {
		const row = await getDbClient(env, logger).select({
			keyRef: schema.walletApnsKey.keyRef,
			teamId: schema.walletApnsKey.teamId,
			keyId: schema.walletApnsKey.keyId,
			encryptedP8Key: schema.walletApnsKey.encryptedP8Key,
			updatedAt: schema.walletApnsKey.updatedAt
		}).from(schema.walletApnsKey).where(eq(schema.walletApnsKey.keyRef, keyRef)).limit(1).then((r) => r[0]);
		if (!row) return null;
		if (!row.encryptedP8Key) {
			logger.error("Encrypted key missing for keyRef", /* @__PURE__ */ new Error("MissingEncryptedData"), { keyRef });
			throw new Error(`Encrypted key missing for keyRef: ${keyRef}`);
		}
		const decryptedData = await decryptWithVersion(row.encryptedP8Key, env);
		const p8Pem = new TextDecoder().decode(decryptedData);
		const data = {
			teamId: row.teamId,
			keyId: row.keyId,
			p8Pem
		};
		const dbLastUpdatedAt = row.updatedAt || /* @__PURE__ */ new Date();
		apnsKeyCache.set(cacheKey, {
			data,
			dbLastUpdatedAt
		});
		return data;
	} catch (error) {
		logger.error("Failed to load APNs key data", error instanceof Error ? error : new Error(String(error)), { keyRef });
		throw new Error(`Failed to load APNs key data: ${error.message}`);
	}
}
var apnsKeyCache;
var init_apnsKeys = __esm({ "../../apps/honoken/src/passkit/apnsKeys.ts": (() => {
	init_drizzle_orm();
	init_db();
	init_bounded_cache();
	init_crypto();
	apnsKeyCache = createBoundedMap();
}) });

//#endregion
//#region ../../apps/honoken/src/passkit/apnsFetch.ts
/**
* Hash device ID for privacy-preserving tracking in PostHog
*/
function hashDeviceId(deviceId) {
	if (!deviceId) return "unknown";
	return createHash("sha256").update(deviceId).digest("hex").substring(0, 16);
}
function invalidateApnsClientCache(teamId, keyId, logger, triggeredByKeyCacheInvalidation = false) {
	const cacheKey = `${teamId}:${keyId}`;
	tokenCache.delete(cacheKey);
	for (const [host, session] of h2Sessions) try {
		session.close();
	} catch (error) {
		logger.error("Error closing HTTP/2 session during cache invalidation", {
			host,
			error: error instanceof Error ? error.message : String(error)
		});
	} finally {
		h2Sessions.delete(host);
	}
	logger.info("Invalidated APNs provider token cache and closed HTTP/2 sessions", {
		teamId,
		keyId,
		triggeredByKeyCacheInvalidation,
		activeSessionsAfter: h2Sessions.size
	});
}
async function getApnsKeyForTopic(env, topic, logger) {
	const db$1 = getDbClient(env, logger);
	const passType = await db$1.query.walletPassType.findFirst({
		where: { passTypeIdentifier: topic },
		with: { cert: { columns: { teamId: true } } }
	});
	if (!passType?.cert) throw new Error(`Pass type or certificate not found for topic ${topic}`);
	const activeKey = await db$1.query.walletApnsKey.findFirst({ where: {
		teamId: passType.cert.teamId,
		isActive: true
	} });
	if (!activeKey) throw new Error(`Active APNs key not found for team ${passType.cert.teamId}`);
	const keyData = await loadApnsKeyData(activeKey.keyRef, env, logger);
	if (!keyData) throw new Error(`Unable to load APNs keyRef ${activeKey.keyRef}`);
	return {
		keyRef: activeKey.keyRef,
		teamId: activeKey.teamId,
		keyId: activeKey.keyId,
		p8Pem: keyData.p8Pem
	};
}
async function getProviderToken(teamId, keyId, p8Pem) {
	const cacheKey = `${teamId}:${keyId}`;
	const now = Math.floor(Date.now() / 1e3);
	const cached = tokenCache.get(cacheKey);
	if (cached && cached.exp - JWT_REFRESH_BEFORE_SEC > now) return cached.jwt;
	const pkcs8 = await importPKCS8(p8Pem, "ES256");
	const exp = now + TOKEN_TTL_SEC;
	const jwt = await new SignJWT({}).setProtectedHeader({
		alg: "ES256",
		kid: keyId
	}).setIssuedAt(now).setIssuer(teamId).setExpirationTime(exp).sign(pkcs8);
	tokenCache.set(cacheKey, {
		jwt,
		exp
	});
	return jwt;
}
function getH2Session(host, logger) {
	let session = h2Sessions.get(host);
	if (session && !session.closed && !session.destroyed) return session;
	if (session) {
		try {
			session.destroy();
		} catch {}
		h2Sessions.delete(host);
	}
	session = http2.connect(host, {});
	session.setTimeout(3e4, () => {
		try {
			session?.close();
		} catch {}
	});
	session.on("error", (err) => {
		logger?.error("APNs HTTP/2 session error", err instanceof Error ? err : new Error(String(err)), { host });
		try {
			session?.destroy();
		} catch {}
		h2Sessions.delete(host);
	});
	session.on("close", () => {
		h2Sessions.delete(host);
	});
	h2Sessions.set(host, session);
	return session;
}
function classifyApnsError(status, reason) {
	if (status === 200) return "success";
	if (status === 500 || status === 503 || status === 429) return "retryable";
	if (status === 410) return "unregistered";
	if (reason === "Unregistered" || reason === "BadDeviceToken") return "unregistered";
	if (status === 401 || status === 403) return "fatal";
	return "fatal";
}
async function sendOnce(device, opts) {
	const session = getH2Session(APNS_PROD, opts.logger);
	const path = `/3/device/${device.pushToken}`;
	return await new Promise((resolve) => {
		let responded = false;
		const headers = {
			":method": "POST",
			":path": path,
			authorization: `bearer ${opts.jwt}`,
			"apns-topic": opts.topic,
			"apns-push-type": "background",
			"apns-priority": "5",
			"content-length": "2",
			"content-type": "application/json"
		};
		const req = session.request(headers, { endStream: false });
		let status = 0;
		let dataBuf = "";
		let retryAfter = null;
		req.on("response", (h) => {
			status = Number(h[":status"] || 0);
			if (h["retry-after"]) retryAfter = String(h["retry-after"]);
		});
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			dataBuf += chunk;
		});
		req.on("error", (err) => {
			if (responded) return;
			responded = true;
			opts.logger.error("APNs HTTP/2 request error", err, { path });
			resolve({
				status: 500,
				reason: err.message || "http2_error",
				retryAfter: null
			});
		});
		req.on("close", () => {
			if (responded) return;
			responded = true;
			let reason = "";
			if (dataBuf.trim()) try {
				reason = JSON.parse(dataBuf).reason || dataBuf;
			} catch {
				reason = dataBuf;
			}
			resolve({
				status,
				reason,
				retryAfter
			});
		});
		req.write("{}");
		req.end();
	});
}
function getRetryAfterMs(retryAfter) {
	if (!retryAfter) return;
	const secs = Number.parseInt(retryAfter, 10);
	if (!Number.isNaN(secs)) return secs * 1e3;
	const dateMs = Date.parse(retryAfter);
	if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
}
function handleFatalAuthFailure(teamId, keyId, status, reason, logger) {
	const failureKey = `${teamId}:${keyId}`;
	const now = Date.now();
	const failure = authFailures.get(failureKey) || {
		count: 0,
		resetAt: 0
	};
	if (now >= failure.resetAt) failure.count = 0;
	failure.count++;
	failure.resetAt = now + AUTH_FAILURE_RESET_MS;
	authFailures.set(failureKey, failure);
	logger.warn("APNs auth/key fatal; invalidating cache", {
		status,
		reason,
		teamId,
		keyId,
		failureCount: failure.count,
		circuitBreakerOpen: failure.count >= AUTH_FAILURE_THRESHOLD
	});
	invalidateApnsClientCache(teamId, keyId, logger);
}
function createRetryOptions(onFailedAttempt) {
	return {
		retries: 5,
		factor: 2,
		minTimeout: 500,
		maxTimeout: 3e4,
		randomize: true,
		shouldRetry: (err) => !!err && typeof err === "object" && err.retryable === true,
		onFailedAttempt
	};
}
function createRetryError(status, reason, retryAfter, attemptCount) {
	const err = /* @__PURE__ */ new Error(`Retryable APNs ${status}: ${reason}`);
	err.retryable = true;
	if (status === 429) {
		const ms = getRetryAfterMs(retryAfter);
		if (ms !== void 0) {
			err.attemptNumber = attemptCount;
			err.retryAfterMs = ms;
		}
	}
	return err;
}
function trackDeviceUnregistration(device, ctx, reason, status) {
	if (!ctx.posthog) return;
	const hashedDeviceId = hashDeviceId(device.deviceId || device.pushToken);
	ctx.posthog.capture({
		distinctId: hashedDeviceId,
		event: "device_unregistered",
		properties: {
			passType: ctx.topic,
			teamId: ctx.teamId,
			reason: reason || "Unknown",
			status,
			hashedDeviceId
		}
	});
}
function trackPushFailure(device, ctx, error, attemptCount, totalTime) {
	if (!ctx.posthog || attemptCount < 2) return;
	const hashedDeviceId = hashDeviceId(device.deviceId || device.pushToken);
	ctx.posthog.capture({
		distinctId: hashedDeviceId,
		event: "push_failed",
		properties: {
			passType: ctx.topic,
			teamId: ctx.teamId,
			errorMessage: error.message || "Unknown error",
			attempts: attemptCount,
			totalTimeMs: totalTime,
			hashedDeviceId
		}
	});
}
function handlePushSuccess(ctx, status, attemptCount, startTime, classification) {
	if (status === 200) {
		const failureKey = `${ctx.teamId}:${ctx.keyId}`;
		authFailures.delete(failureKey);
	}
	if (attemptCount > 1 || Date.now() - startTime > 2e3) ctx.logger.info("APNs push completed after retries", {
		attempts: attemptCount,
		totalTime: Date.now() - startTime,
		status,
		classification,
		hadRetries: attemptCount > 1
	});
}
async function sendWithRetry(device, ctx) {
	const startTime = Date.now();
	let attemptCount = 0;
	const retryOpts = createRetryOptions(async (context) => {
		attemptCount++;
		const error = context.error;
		const retryAfterMs = error.retryAfterMs;
		if (retryAfterMs && retryAfterMs > 0) {
			ctx.logger.info("APNs retry with Retry-After header", {
				attempt: attemptCount,
				error: error.message,
				retriesLeft: context.retriesLeft,
				retryAfterMs,
				elapsed: Date.now() - startTime
			});
			await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
		} else ctx.logger.info("APNs retry attempt", {
			attempt: attemptCount,
			error: error.message,
			retriesLeft: context.retriesLeft,
			elapsed: Date.now() - startTime
		});
	});
	return await pRetry(async () => {
		attemptCount++;
		const { status, reason, retryAfter } = await sendOnce(device, ctx);
		const classification = classifyApnsError(status, reason);
		if (classification === "retryable") throw createRetryError(status, reason, retryAfter, attemptCount);
		if (classification === "fatal") handleFatalAuthFailure(ctx.teamId, ctx.keyId, status, reason, ctx.logger);
		handlePushSuccess(ctx, status, attemptCount, startTime, classification);
		const result = {
			ok: classification === "success",
			unregistered: classification === "unregistered",
			reason: classification !== "unregistered" ? reason : void 0
		};
		if (classification === "unregistered") trackDeviceUnregistration(device, ctx, reason, status);
		return {
			...device,
			result
		};
	}, retryOpts).catch((err) => {
		if (attemptCount >= 3) ctx.logger.error("APNs push failed after retries", err, {
			attempts: attemptCount,
			totalTime: Date.now() - startTime,
			finalError: err.message,
			severity: "critical_warn"
		});
		else ctx.logger.warn("APNs push failed", {
			attempts: attemptCount,
			totalTime: Date.now() - startTime,
			finalError: err.message
		});
		trackPushFailure(device, ctx, err, attemptCount, Date.now() - startTime);
		return {
			...device,
			result: {
				ok: false,
				reason: err.message || "Retries exhausted"
			}
		};
	});
}
async function pushToManyFetch(env, regs, topic, logger, posthog) {
	if (regs.length === 0) return {
		outcomes: [],
		summary: {
			attempted: 0,
			succeeded: 0,
			unregistered: 0,
			failed: 0
		}
	};
	const { teamId, keyId, p8Pem } = await getApnsKeyForTopic(env, topic, logger);
	const failureKey = `${teamId}:${keyId}`;
	const now = Date.now();
	const failure = authFailures.get(failureKey);
	if (failure && failure.count >= AUTH_FAILURE_THRESHOLD && now < failure.resetAt) {
		const timeUntilReset = Math.ceil((failure.resetAt - now) / 1e3);
		logger.error("APNs authentication circuit breaker open", {
			teamId,
			keyId,
			failureCount: failure.count,
			timeUntilResetSeconds: timeUntilReset
		});
		throw new Error(`APNs authentication circuit breaker open for ${failureKey} - ${timeUntilReset}s until reset`);
	}
	const jwt = await getProviderToken(teamId, keyId, p8Pem);
	const host = APNS_PROD;
	const outcomes = await Promise.all(regs.map((device) => sendWithRetry(device, {
		jwt,
		topic,
		host,
		logger,
		teamId,
		keyId,
		posthog
	})));
	const summary = {
		attempted: regs.length,
		succeeded: outcomes.filter((o) => o.result.ok).length,
		unregistered: outcomes.filter((o) => o.result.unregistered).length,
		failed: outcomes.filter((o) => !(o.result.ok || o.result.unregistered)).length
	};
	if (summary.failed === 0 && summary.unregistered === 0 && summary.attempted > 0 && summary.attempted <= 10) logger.info("APNs batch success", {
		...summary,
		topic,
		host
	});
	const failureRate = summary.failed / summary.attempted;
	if (summary.attempted > 10 || failureRate > .1 || summary.failed > 0) logger[failureRate > .2 ? "warn" : "info"]("APNs batch completed", {
		...summary,
		failureRate: Math.round(failureRate * 100) / 100,
		topic,
		batchSize: regs.length
	});
	if (regs.length <= 10) outcomes.forEach((o) => {
		const hashed = hashDeviceId(o.deviceId || o.pushToken);
		logger.info("apns_device_outcome", {
			passType: topic,
			device: hashed,
			ok: o.result.ok,
			unregistered: !!o.result.unregistered,
			reason: o.result.reason
		});
	});
	return {
		outcomes,
		summary
	};
}
function closeAllSessions() {
	for (const [host, session] of h2Sessions) {
		try {
			session.close();
		} catch {}
		h2Sessions.delete(host);
	}
}
var APNS_PROD, TOKEN_TTL_SEC, JWT_REFRESH_BEFORE_SEC, tokenCache, h2Sessions, authFailures, AUTH_FAILURE_THRESHOLD, AUTH_FAILURE_RESET_MS, pushToMany;
var init_apnsFetch = __esm({ "../../apps/honoken/src/passkit/apnsFetch.ts": (() => {
	init_bounded_cache();
	init_webapi();
	init_p_retry();
	init_apnsKeys();
	init_db();
	APNS_PROD = "https://api.push.apple.com";
	TOKEN_TTL_SEC = 1200;
	JWT_REFRESH_BEFORE_SEC = 30;
	tokenCache = createBoundedMap();
	h2Sessions = /* @__PURE__ */ new Map();
	authFailures = /* @__PURE__ */ new Map();
	AUTH_FAILURE_THRESHOLD = 3;
	AUTH_FAILURE_RESET_MS = 300 * 1e3;
	pushToMany = pushToManyFetch;
	process.on("beforeExit", closeAllSessions);
	process.on("SIGTERM", closeAllSessions);
}) });

//#endregion
//#region ../../apps/honoken/src/repo/wallet.ts
init_drizzle_orm();
function nowSeconds() {
	const ms = Date.now();
	return /* @__PURE__ */ new Date(Math.floor(ms / 1e3) * 1e3);
}
function stableStringify(value) {
	return JSON.stringify(value, (_k, v) => {
		if (v && typeof v === "object" && !Array.isArray(v)) {
			const sorted = {};
			for (const key of Object.keys(v).sort()) sorted[key] = v[key];
			return sorted;
		}
		return v;
	});
}
async function sha256Hex(input) {
	const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
	const buf = new ArrayBuffer(data.byteLength);
	new Uint8Array(buf).set(data);
	const digest = await crypto.subtle.digest("SHA-256", buf);
	const bytes = new Uint8Array(digest);
	let hex = "";
	for (const b of bytes) hex += b.toString(16).padStart(2, "0");
	return hex;
}
function computeEtagFrom(meta, contentData) {
	const payload = {
		pass: {
			passTypeIdentifier: meta.passTypeIdentifier,
			serialNumber: meta.serialNumber,
			ticketStyle: meta.ticketStyle,
			poster: meta.poster,
			updatedAtSec: Math.floor(meta.updatedAt.getTime() / 1e3)
		},
		content: contentData ?? null
	};
	return sha256Hex(stableStringify(payload));
}
function upsertPassContentWithEtag(db$1, key, data) {
	return db$1.transaction(async (tx) => {
		const pass = await tx.query.walletPass.findFirst({
			where: {
				passTypeIdentifier: key.passTypeIdentifier,
				serialNumber: key.serialNumber
			},
			columns: {
				id: true,
				ticketStyle: true,
				poster: true,
				etag: true
			}
		});
		if (!pass) throw new Error(`PASS_NOT_FOUND: ${key.passTypeIdentifier}/${key.serialNumber}`);
		const existing = await tx.query.walletPassContent.findFirst({
			where: { passId: pass.id },
			columns: { data: true }
		});
		const prevJson = existing?.data ?? null;
		const nextJson = data ?? null;
		const changed = stableStringify(prevJson) !== stableStringify(nextJson);
		if (!existing) await tx.insert(schema.walletPassContent).values({
			passId: pass.id,
			data: nextJson
		});
		else if (changed) await tx.update(schema.walletPassContent).set({
			data: nextJson,
			updatedAt: nowSeconds()
		}).where(eq(schema.walletPassContent.passId, pass.id));
		if (!changed && pass.etag) return {
			etag: pass.etag,
			updatedAt: nowSeconds(),
			changed
		};
		const updatedAt = nowSeconds();
		const etag = await computeEtagFrom({
			passTypeIdentifier: key.passTypeIdentifier,
			serialNumber: key.serialNumber,
			ticketStyle: pass.ticketStyle,
			poster: pass.poster,
			updatedAt
		}, nextJson);
		await tx.update(schema.walletPass).set({
			etag,
			updatedAt
		}).where(and(eq(schema.walletPass.passTypeIdentifier, key.passTypeIdentifier), eq(schema.walletPass.serialNumber, key.serialNumber)));
		return {
			etag,
			updatedAt,
			changed: true
		};
	});
}

//#endregion
//#region functions/wallet-pass-update.ts
init_drizzle_orm();
init_db();
init_apnsFetch();
const walletPassUpdate = inngest.createFunction({
	id: "wallet-pass-update",
	concurrency: {
		limit: 1,
		key: "event.data.serialNumber"
	}
}, { event: "pass/update.requested" }, async ({ event, step, logger }) => {
	const { passTypeIdentifier, serialNumber, content } = event.data;
	const env = process.env;
	const loggerAdapter = {
		info: (message$1, data) => logger.info(message$1, data),
		warn: (message$1, data) => logger.warn(message$1, data),
		warnAsync: async (message$1, data) => logger.warn(message$1, data),
		error: (message$1, error, data) => logger.error(message$1, error, data),
		errorAsync: async (message$1, error, data) => logger.error(message$1, error, data)
	};
	const db$1 = getDbClient(env, loggerAdapter);
	const write = await step.run("write-etag", async () => {
		return await upsertPassContentWithEtag(db$1, {
			passTypeIdentifier,
			serialNumber
		}, content);
	});
	if (!write.changed) return {
		skipped: true,
		etag: write.etag
	};
	const regs = await step.run("load-registrations", async () => {
		return await db$1.select({
			pushToken: schema.walletDevice.pushToken,
			deviceLibraryIdentifier: schema.walletDevice.deviceLibraryIdentifier
		}).from(schema.walletRegistration).innerJoin(schema.walletDevice, eq(schema.walletRegistration.deviceLibraryIdentifier, schema.walletDevice.deviceLibraryIdentifier)).where(and(eq(schema.walletRegistration.passTypeIdentifier, passTypeIdentifier), eq(schema.walletRegistration.serialNumber, serialNumber), eq(schema.walletRegistration.active, true)));
	});
	if (regs.length === 0) return {
		pushed: 0,
		etag: write.etag
	};
	return {
		pushed: await step.run("apns-push", async () => {
			return (await pushToMany(env, regs, passTypeIdentifier, loggerAdapter))?.summary?.attempted ?? regs.length;
		}),
		etag: write.etag
	};
});

//#endregion
//#region functions/index.ts
const functions = [userSignedIn, walletPassUpdate];

//#endregion
export { functions };