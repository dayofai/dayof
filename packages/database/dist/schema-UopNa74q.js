import { sql } from "drizzle-orm";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (all) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i$1 = 0, n$1 = keys.length, key; i$1 < n$1; i$1++) {
		key = keys[i$1];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k$1) => from[k$1]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/entity.js
const entityKind = Symbol.for("drizzle:entityKind");
const hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is$1(value, type) {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column.js
var Column$1 = class {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.utils.js
const TableName = Symbol.for("drizzle:Name");

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
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
var ForeignKey = class {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
	return fn(...args);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/unique-constraint.js
function unique(name) {
	return new UniqueOnConstraintBuilder(name);
}
function uniqueKeyName(table, columns) {
	return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
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
var UniqueOnConstraintBuilder = class {
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
var UniqueConstraint = class {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
	for (let i$1 = startFrom; i$1 < arrayString.length; i$1++) {
		const char$1 = arrayString[i$1];
		if (char$1 === "\\") {
			i$1++;
			continue;
		}
		if (char$1 === "\"") return [arrayString.slice(startFrom, i$1).replace(/\\/g, ""), i$1 + 1];
		if (inQuotes) continue;
		if (char$1 === "," || char$1 === "}") return [arrayString.slice(startFrom, i$1).replace(/\\/g, ""), i$1];
	}
	return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
	const result = [];
	let i$1 = startFrom;
	let lastCharIsComma = false;
	while (i$1 < arrayString.length) {
		const char$1 = arrayString[i$1];
		if (char$1 === ",") {
			if (lastCharIsComma || i$1 === startFrom) result.push("");
			lastCharIsComma = true;
			i$1++;
			continue;
		}
		lastCharIsComma = false;
		if (char$1 === "\\") {
			i$1 += 2;
			continue;
		}
		if (char$1 === "\"") {
			const [value2, startFrom2] = parsePgArrayValue(arrayString, i$1 + 1, true);
			result.push(value2);
			i$1 = startFrom2;
			continue;
		}
		if (char$1 === "}") return [result, i$1 + 1];
		if (char$1 === "{") {
			const [value2, startFrom2] = parsePgNestedArray(arrayString, i$1 + 1);
			result.push(value2);
			i$1 = startFrom2;
			continue;
		}
		const [value, newStartFrom] = parsePgArrayValue(arrayString, i$1, false);
		result.push(value);
		i$1 = newStartFrom;
	}
	return [result, i$1];
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
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
var PgColumn = class extends Column$1 {
	static [entityKind] = "PgColumn";
	/** @internal */
	table;
	constructor(table, config) {
		if (!config.uniqueName) config.uniqueName = uniqueKeyName(table, [config.name]);
		super(table, config);
		this.table = table;
	}
};
var ExtraConfigColumn = class extends PgColumn {
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
var IndexedColumn = class {
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
var PgArrayBuilder = class extends PgColumnBuilder {
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
var PgArray = class PgArray extends PgColumn {
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
		return value.map((v$1) => this.baseColumn.mapFromDriverValue(v$1));
	}
	mapFromJsonValue(value) {
		if (typeof value === "string") value = parsePgArray(value);
		const base = this.baseColumn;
		return "mapFromJsonValue" in base ? value.map((v$1) => base.mapFromJsonValue(v$1)) : value.map((v$1) => base.mapFromDriverValue(v$1));
	}
	mapToDriverValue(value, isNestedArray = false) {
		const a$1 = value.map((v$1) => v$1 === null ? null : is$1(this.baseColumn, PgArray) ? this.baseColumn.mapToDriverValue(v$1, true) : this.baseColumn.mapToDriverValue(v$1));
		if (isNestedArray) return a$1;
		return makePgArray(a$1);
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
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
var PgEnumObjectColumn = class extends PgColumn {
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
const isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
	return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
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
var PgEnumColumn = class extends PgColumn {
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
function pgEnum(enumName, input) {
	return Array.isArray(input) ? pgEnumWithSchema(enumName, [...input], void 0) : pgEnumObjectWithSchema(enumName, input, void 0);
}
function pgEnumWithSchema(enumName, values, schema$1) {
	const enumInstance = Object.assign((name) => new PgEnumColumnBuilder(name ?? "", enumInstance), {
		enumName,
		enumValues: values,
		schema: schema$1,
		[isPgEnumSym]: true
	});
	return enumInstance;
}
function pgEnumObjectWithSchema(enumName, values, schema$1) {
	const enumInstance = Object.assign((name) => new PgEnumObjectColumnBuilder(name ?? "", enumInstance), {
		enumName,
		enumValues: Object.values(values),
		schema: schema$1,
		[isPgEnumSym]: true
	});
	return enumInstance;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/subquery.js
var Subquery = class {
	static [entityKind] = "Subquery";
	constructor(sql$2, fields, alias, isWith = false, usedTables = []) {
		this._ = {
			brand: "Subquery",
			sql: sql$2,
			selectedFields: fields,
			alias,
			isWith,
			usedTables
		};
	}
};
var WithSubquery = class extends Subquery {
	static [entityKind] = "WithSubquery";
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/tracing.js
const tracer = { startActiveSpan(name, fn) {
	return fn();
} };

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/view-common.js
const ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/table.js
const TableSchema = Symbol.for("drizzle:Schema");
const TableColumns = Symbol.for("drizzle:Columns");
const ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
const OriginalName = Symbol.for("drizzle:OriginalName");
const BaseName = Symbol.for("drizzle:BaseName");
const IsAlias = Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
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
function getTableName(table) {
	return table[TableName];
}
function getTableUniqueName(table) {
	return `${table[TableSchema] ?? "public"}.${table[TableName]}`;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
	static [entityKind] = "FakePrimitiveParam";
};
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
var StringChunk = class {
	static [entityKind] = "StringChunk";
	value;
	constructor(value) {
		this.value = Array.isArray(value) ? value : [value];
	}
	getSQL() {
		return new SQL$1([this]);
	}
};
var SQL$1 = class SQL$1 {
	constructor(queryChunks) {
		this.queryChunks = queryChunks;
		for (const chunk of queryChunks) if (is$1(chunk, Table)) {
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
			if (is$1(chunk, StringChunk)) return {
				sql: chunk.value.join(""),
				params: []
			};
			if (is$1(chunk, Name)) return {
				sql: escapeName(chunk.value),
				params: []
			};
			if (chunk === void 0) return {
				sql: "",
				params: []
			};
			if (Array.isArray(chunk)) {
				const result = [new StringChunk("(")];
				for (const [i$1, p$1] of chunk.entries()) {
					result.push(p$1);
					if (i$1 < chunk.length - 1) result.push(new StringChunk(", "));
				}
				result.push(new StringChunk(")"));
				return this.buildQueryFromSourceParams(result, config);
			}
			if (is$1(chunk, SQL$1)) return this.buildQueryFromSourceParams(chunk.queryChunks, {
				...config,
				inlineParams: inlineParams || chunk.shouldInlineParams
			});
			if (is$1(chunk, Table)) {
				const schemaName = chunk[Table.Symbol.Schema];
				const tableName = chunk[Table.Symbol.Name];
				return {
					sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
					params: []
				};
			}
			if (is$1(chunk, Column$1)) {
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
			if (is$1(chunk, View)) {
				const schemaName = chunk[ViewBaseConfig].schema;
				const viewName = chunk[ViewBaseConfig].name;
				return {
					sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
					params: []
				};
			}
			if (is$1(chunk, Param)) {
				if (is$1(chunk.value, Placeholder)) return {
					sql: escapeParam(paramStartIndex.value++, chunk),
					params: [chunk],
					typings: ["none"]
				};
				const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
				if (is$1(mappedValue, SQL$1)) return this.buildQueryFromSourceParams([mappedValue], config);
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
			if (is$1(chunk, Placeholder)) return {
				sql: escapeParam(paramStartIndex.value++, chunk),
				params: [chunk],
				typings: ["none"]
			};
			if (is$1(chunk, SQL$1.Aliased) && chunk.fieldAlias !== void 0) return {
				sql: escapeName(chunk.fieldAlias),
				params: []
			};
			if (is$1(chunk, Subquery)) {
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
		return new SQL$1.Aliased(this, alias);
	}
	mapWith(decoder) {
		this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
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
var Name = class {
	constructor(value) {
		this.value = value;
	}
	static [entityKind] = "Name";
	brand;
	getSQL() {
		return new SQL$1([this]);
	}
};
function isDriverValueEncoder(value) {
	return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = { mapFromDriverValue: (value) => value };
const noopEncoder = { mapToDriverValue: (value) => value };
const noopMapper = {
	...noopDecoder,
	...noopEncoder
};
var Param = class {
	/**
	* @param value - Parameter value
	* @param encoder - Encoder to convert the value to a driver parameter
	*/
	constructor(value, encoder = noopEncoder) {
		this.value = value;
		this.encoder = encoder;
	}
	static [entityKind] = "Param";
	brand;
	getSQL() {
		return new SQL$1([this]);
	}
};
function sql$1(strings, ...params) {
	const queryChunks = [];
	if (params.length > 0 || strings.length > 0 && strings[0] !== "") queryChunks.push(new StringChunk(strings[0]));
	for (const [paramIndex, param2] of params.entries()) queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
	return new SQL$1(queryChunks);
}
((sql2) => {
	function empty() {
		return new SQL$1([]);
	}
	sql2.empty = empty;
	function fromList(list) {
		return new SQL$1(list);
	}
	sql2.fromList = fromList;
	function raw(str) {
		return new SQL$1([new StringChunk(str)]);
	}
	sql2.raw = raw;
	function join(chunks, separator) {
		const result = [];
		for (const [i$1, chunk] of chunks.entries()) {
			if (i$1 > 0 && separator !== void 0) result.push(separator);
			result.push(chunk);
		}
		return new SQL$1(result);
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
	function param2(value, encoder) {
		return new Param(value, encoder);
	}
	sql2.param = param2;
})(sql$1 || (sql$1 = {}));
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
})(SQL$1 || (SQL$1 = {}));
var Placeholder = class {
	constructor(name2) {
		this.name = name2;
	}
	static [entityKind] = "Placeholder";
	getSQL() {
		return new SQL$1([this]);
	}
};
function fillPlaceholders(params, values) {
	return params.map((p$1) => {
		if (is$1(p$1, Placeholder)) {
			if (!(p$1.name in values)) throw new Error(`No value for placeholder "${p$1.name}" was provided`);
			return values[p$1.name];
		}
		if (is$1(p$1, Param) && is$1(p$1.value, Placeholder)) {
			if (!(p$1.value.name in values)) throw new Error(`No value for placeholder "${p$1.value.name}" was provided`);
			return p$1.encoder.mapToDriverValue(values[p$1.value.name]);
		}
		return p$1;
	});
}
const IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
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
		return new SQL$1([this]);
	}
};
Column$1.prototype.getSQL = function() {
	return new SQL$1([this]);
};
Table.prototype.getSQL = function() {
	return new SQL$1([this]);
};
Subquery.prototype.getSQL = function() {
	return new SQL$1([this]);
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/checks.js
var CheckBuilder = class {
	constructor(name, value) {
		this.name = name;
		this.value = value;
	}
	static [entityKind] = "PgCheckBuilder";
	brand;
	/** @internal */
	build(table) {
		return new Check(table, this);
	}
};
var Check = class {
	constructor(table, builder) {
		this.table = table;
		this.name = builder.name;
		this.value = builder.value;
	}
	static [entityKind] = "PgCheck";
	name;
	value;
};
function check(name, value) {
	return new CheckBuilder(name, value);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
	const nullifyMap = {};
	const result = columns.reduce((result2, { path, field }, columnIndex) => {
		let decoder;
		if (is$1(field, Column$1)) decoder = field;
		else if (is$1(field, SQL$1)) decoder = field.decoder;
		else decoder = field.sql.decoder;
		let node = result2;
		for (const [pathChunkIndex, pathChunk] of path.entries()) if (pathChunkIndex < path.length - 1) {
			if (!(pathChunk in node)) node[pathChunk] = {};
			node = node[pathChunk];
		} else {
			const rawValue = row[columnIndex];
			const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
			if (joinsNotNullableMap && is$1(field, Column$1) && path.length === 2) {
				const objectName = path[0];
				if (!(objectName in nullifyMap)) nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
				else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) nullifyMap[objectName] = false;
			}
		}
		return result2;
	}, {});
	if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
		for (const [objectName, tableName] of Object.entries(nullifyMap)) if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) result[objectName] = null;
	}
	return result;
}
function orderSelectedFields(fields, pathPrefix) {
	return Object.entries(fields).reduce((result, [name, field]) => {
		if (typeof name !== "string") return result;
		const newPath = pathPrefix ? [...pathPrefix, name] : [name];
		if (is$1(field, Column$1) || is$1(field, SQL$1) || is$1(field, SQL$1.Aliased)) result.push({
			path: newPath,
			field
		});
		else if (is$1(field, Table)) result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
		else result.push(...orderSelectedFields(field, newPath));
		return result;
	}, []);
}
function haveSameKeys(left, right) {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length) return false;
	for (const [index$1, key] of leftKeys.entries()) if (key !== rightKeys[index$1]) return false;
	return true;
}
function mapUpdateSet(table, values) {
	const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
		if (is$1(value, SQL$1) || is$1(value, Column$1)) return [key, value];
		else return [key, new Param(value, table[Table.Symbol.Columns][key])];
	});
	if (entries.length === 0) throw new Error("No values to set");
	return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
	for (const extendedClass of extendedClasses) for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
		if (name === "constructor") continue;
		Object.defineProperty(baseClass.prototype, name, Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null));
	}
}
function getTableColumns$1(table) {
	return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
	return is$1(table, Subquery) ? table._.alias : is$1(table, View) ? table[ViewBaseConfig].name : is$1(table, SQL$1) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a$1, b$1) {
	return {
		name: typeof a$1 === "string" && a$1.length > 0 ? a$1 : "",
		config: typeof a$1 === "object" ? a$1 : b$1
	};
}
function isConfig(data) {
	if (typeof data !== "object" || data === null) return false;
	if (data.constructor.name !== "Object") return false;
	if ("logger" in data) {
		const type = typeof data["logger"];
		if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
		return true;
	}
	if ("schema" in data) {
		const type = typeof data["schema"];
		if (type !== "object" && type !== "undefined") return false;
		return true;
	}
	if ("relations" in data) {
		const type = typeof data["relations"];
		if (type !== "object" && type !== "undefined") return false;
		return true;
	}
	if ("casing" in data) {
		const type = typeof data["casing"];
		if (type !== "string" && type !== "undefined") return false;
		return true;
	}
	if ("mode" in data) {
		if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
		return true;
	}
	if ("connection" in data) {
		const type = typeof data["connection"];
		if (type !== "string" && type !== "object" && type !== "undefined") return false;
		return true;
	}
	if ("client" in data) {
		const type = typeof data["client"];
		if (type !== "object" && type !== "function" && type !== "undefined") return false;
		return true;
	}
	if (Object.keys(data).length === 0) return true;
	return false;
}
const textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgIntColumnBaseBuilder";
	generatedAlwaysAsIdentity(sequence) {
		if (sequence) {
			const { name,...options } = sequence;
			this.config.generatedIdentity = {
				type: "always",
				sequenceName: name,
				sequenceOptions: options
			};
		} else this.config.generatedIdentity = { type: "always" };
		this.config.hasDefault = true;
		this.config.notNull = true;
		return this;
	}
	generatedByDefaultAsIdentity(sequence) {
		if (sequence) {
			const { name,...options } = sequence;
			this.config.generatedIdentity = {
				type: "byDefault",
				sequenceName: name,
				sequenceOptions: options
			};
		} else this.config.generatedIdentity = { type: "byDefault" };
		this.config.hasDefault = true;
		this.config.notNull = true;
		return this;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
	static [entityKind] = "PgBigInt53Builder";
	constructor(name) {
		super(name, "number int53", "PgBigInt53");
	}
	/** @internal */
	build(table) {
		return new PgBigInt53(table, this.config);
	}
};
var PgBigInt53 = class extends PgColumn {
	static [entityKind] = "PgBigInt53";
	getSQLType() {
		return "bigint";
	}
	mapFromDriverValue(value) {
		if (typeof value === "number") return value;
		return Number(value);
	}
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
	static [entityKind] = "PgBigInt64Builder";
	constructor(name) {
		super(name, "bigint int64", "PgBigInt64");
	}
	/** @internal */
	build(table) {
		return new PgBigInt64(table, this.config);
	}
};
var PgBigInt64 = class extends PgColumn {
	static [entityKind] = "PgBigInt64";
	getSQLType() {
		return "bigint";
	}
	mapFromDriverValue(value) {
		return BigInt(value);
	}
};
function bigint(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (config.mode === "number") return new PgBigInt53Builder(name);
	return new PgBigInt64Builder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
	static [entityKind] = "PgBigSerial53Builder";
	constructor(name) {
		super(name, "number int53", "PgBigSerial53");
		this.config.hasDefault = true;
		this.config.notNull = true;
	}
	/** @internal */
	build(table) {
		return new PgBigSerial53(table, this.config);
	}
};
var PgBigSerial53 = class extends PgColumn {
	static [entityKind] = "PgBigSerial53";
	getSQLType() {
		return "bigserial";
	}
	mapFromDriverValue(value) {
		if (typeof value === "number") return value;
		return Number(value);
	}
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
	static [entityKind] = "PgBigSerial64Builder";
	constructor(name) {
		super(name, "bigint int64", "PgBigSerial64");
		this.config.hasDefault = true;
	}
	/** @internal */
	build(table) {
		return new PgBigSerial64(table, this.config);
	}
};
var PgBigSerial64 = class extends PgColumn {
	static [entityKind] = "PgBigSerial64";
	getSQLType() {
		return "bigserial";
	}
	mapFromDriverValue(value) {
		return BigInt(value);
	}
};
function bigserial(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (config.mode === "number") return new PgBigSerial53Builder(name);
	return new PgBigSerial64Builder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgBooleanBuilder";
	constructor(name) {
		super(name, "boolean", "PgBoolean");
	}
	/** @internal */
	build(table) {
		return new PgBoolean(table, this.config);
	}
};
var PgBoolean = class extends PgColumn {
	static [entityKind] = "PgBoolean";
	getSQLType() {
		return "boolean";
	}
};
function boolean(name) {
	return new PgBooleanBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgCharBuilder";
	constructor(name, config) {
		super(name, config.enum?.length ? "string enum" : "string", "PgChar");
		this.config.length = config.length ?? 1;
		this.config.setLength = config.length !== void 0;
		this.config.enumValues = config.enum;
		this.config.isLengthExact = true;
	}
	/** @internal */
	build(table) {
		return new PgChar(table, this.config);
	}
};
var PgChar = class extends PgColumn {
	static [entityKind] = "PgChar";
	enumValues = this.config.enumValues;
	getSQLType() {
		return this.config.setLength ? `char(${this.length})` : `char`;
	}
};
function char(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgCharBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgCidrBuilder";
	constructor(name) {
		super(name, "string cidr", "PgCidr");
	}
	/** @internal */
	build(table) {
		return new PgCidr(table, this.config);
	}
};
var PgCidr = class extends PgColumn {
	static [entityKind] = "PgCidr";
	getSQLType() {
		return "cidr";
	}
};
function cidr(name) {
	return new PgCidrBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgCustomColumnBuilder";
	constructor(name, fieldConfig, customTypeParams) {
		super(name, "custom", "PgCustomColumn");
		this.config.fieldConfig = fieldConfig;
		this.config.customTypeParams = customTypeParams;
	}
	/** @internal */
	build(table) {
		return new PgCustomColumn(table, this.config);
	}
};
var PgCustomColumn = class extends PgColumn {
	static [entityKind] = "PgCustomColumn";
	sqlName;
	mapTo;
	mapFrom;
	mapJson;
	forJsonSelect;
	constructor(table, config) {
		super(table, config);
		this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
		this.mapTo = config.customTypeParams.toDriver;
		this.mapFrom = config.customTypeParams.fromDriver;
		this.mapJson = config.customTypeParams.fromJson;
		this.forJsonSelect = config.customTypeParams.forJsonSelect;
	}
	getSQLType() {
		return this.sqlName;
	}
	mapFromDriverValue(value) {
		return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
	}
	mapFromJsonValue(value) {
		return typeof this.mapJson === "function" ? this.mapJson(value) : this.mapFromDriverValue(value);
	}
	jsonSelectIdentifier(identifier, sql$2, arrayDimensions) {
		if (typeof this.forJsonSelect === "function") return this.forJsonSelect(identifier, sql$2, arrayDimensions);
		const rawType = this.getSQLType().toLowerCase();
		const parenPos = rawType.indexOf("(");
		switch (parenPos + 1 ? rawType.slice(0, parenPos) : rawType) {
			case "bytea":
			case "geometry":
			case "timestamp":
			case "numeric":
			case "bigint": {
				const arrVal = "[]".repeat(arrayDimensions ?? 0);
				return sql$2`${identifier}::text${sql$2.raw(arrVal).if(arrayDimensions)}`;
			}
			default: return identifier;
		}
	}
	mapToDriverValue(value) {
		return typeof this.mapTo === "function" ? this.mapTo(value) : value;
	}
};
function customType(customTypeParams) {
	return (a$1, b$1) => {
		const { name, config } = getColumnNameAndConfig(a$1, b$1);
		return new PgCustomColumnBuilder(name, config, customTypeParams);
	};
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgDateColumnBaseBuilder";
	defaultNow() {
		return this.default(sql$1`now()`);
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
	static [entityKind] = "PgDateBuilder";
	constructor(name) {
		super(name, "object date", "PgDate");
	}
	/** @internal */
	build(table) {
		return new PgDate(table, this.config);
	}
};
var PgDate = class extends PgColumn {
	static [entityKind] = "PgDate";
	getSQLType() {
		return "date";
	}
	mapFromDriverValue(value) {
		return new Date(value);
	}
	mapToDriverValue(value) {
		return value.toISOString();
	}
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
	static [entityKind] = "PgDateStringBuilder";
	constructor(name) {
		super(name, "string date", "PgDateString");
	}
	/** @internal */
	build(table) {
		return new PgDateString(table, this.config);
	}
};
var PgDateString = class extends PgColumn {
	static [entityKind] = "PgDateString";
	getSQLType() {
		return "date";
	}
};
function date(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (config?.mode === "date") return new PgDateBuilder(name);
	return new PgDateStringBuilder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgDoublePrecisionBuilder";
	constructor(name) {
		super(name, "number double", "PgDoublePrecision");
	}
	/** @internal */
	build(table) {
		return new PgDoublePrecision(table, this.config);
	}
};
var PgDoublePrecision = class extends PgColumn {
	static [entityKind] = "PgDoublePrecision";
	getSQLType() {
		return "double precision";
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") return Number.parseFloat(value);
		return value;
	}
};
function doublePrecision(name) {
	return new PgDoublePrecisionBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgInetBuilder";
	constructor(name) {
		super(name, "string inet", "PgInet");
	}
	/** @internal */
	build(table) {
		return new PgInet(table, this.config);
	}
};
var PgInet = class extends PgColumn {
	static [entityKind] = "PgInet";
	getSQLType() {
		return "inet";
	}
};
function inet(name) {
	return new PgInetBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
	static [entityKind] = "PgIntegerBuilder";
	constructor(name) {
		super(name, "number int32", "PgInteger");
	}
	/** @internal */
	build(table) {
		return new PgInteger(table, this.config);
	}
};
var PgInteger = class extends PgColumn {
	static [entityKind] = "PgInteger";
	getSQLType() {
		return "integer";
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") return Number.parseInt(value);
		return value;
	}
};
function integer(name) {
	return new PgIntegerBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgIntervalBuilder";
	constructor(name, intervalConfig) {
		super(name, "string interval", "PgInterval");
		this.config.intervalConfig = intervalConfig;
	}
	/** @internal */
	build(table) {
		return new PgInterval(table, this.config);
	}
};
var PgInterval = class extends PgColumn {
	static [entityKind] = "PgInterval";
	fields = this.config.intervalConfig.fields;
	precision = this.config.intervalConfig.precision;
	getSQLType() {
		const fields = this.fields ? ` ${this.fields}` : "";
		const precision = this.precision ? `(${this.precision})` : "";
		return `interval${fields}${precision}`;
	}
};
function interval(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgIntervalBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgJsonBuilder";
	constructor(name) {
		super(name, "object json", "PgJson");
	}
	/** @internal */
	build(table) {
		return new PgJson(table, this.config);
	}
};
var PgJson = class extends PgColumn {
	static [entityKind] = "PgJson";
	constructor(table, config) {
		super(table, config);
	}
	getSQLType() {
		return "json";
	}
	mapToDriverValue(value) {
		return JSON.stringify(value);
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") try {
			return JSON.parse(value);
		} catch {
			return value;
		}
		return value;
	}
};
function json(name) {
	return new PgJsonBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgJsonbBuilder";
	constructor(name) {
		super(name, "object json", "PgJsonb");
	}
	/** @internal */
	build(table) {
		return new PgJsonb(table, this.config);
	}
};
var PgJsonb = class extends PgColumn {
	static [entityKind] = "PgJsonb";
	constructor(table, config) {
		super(table, config);
	}
	getSQLType() {
		return "jsonb";
	}
	mapToDriverValue(value) {
		return JSON.stringify(value);
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") try {
			return JSON.parse(value);
		} catch {
			return value;
		}
		return value;
	}
};
function jsonb(name) {
	return new PgJsonbBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgLineBuilder";
	constructor(name) {
		super(name, "array line", "PgLine");
	}
	/** @internal */
	build(table) {
		return new PgLineTuple(table, this.config);
	}
};
var PgLineTuple = class extends PgColumn {
	static [entityKind] = "PgLine";
	getSQLType() {
		return "line";
	}
	mapFromDriverValue(value) {
		const [a$1, b$1, c$1] = value.slice(1, -1).split(",");
		return [
			Number.parseFloat(a$1),
			Number.parseFloat(b$1),
			Number.parseFloat(c$1)
		];
	}
	mapToDriverValue(value) {
		return `{${value[0]},${value[1]},${value[2]}}`;
	}
};
var PgLineABCBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgLineABCBuilder";
	constructor(name) {
		super(name, "object line", "PgLineABC");
	}
	/** @internal */
	build(table) {
		return new PgLineABC(table, this.config);
	}
};
var PgLineABC = class extends PgColumn {
	static [entityKind] = "PgLineABC";
	getSQLType() {
		return "line";
	}
	mapFromDriverValue(value) {
		const [a$1, b$1, c$1] = value.slice(1, -1).split(",");
		return {
			a: Number.parseFloat(a$1),
			b: Number.parseFloat(b$1),
			c: Number.parseFloat(c$1)
		};
	}
	mapToDriverValue(value) {
		return `{${value.a},${value.b},${value.c}}`;
	}
};
function line(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (!config?.mode || config.mode === "tuple") return new PgLineBuilder(name);
	return new PgLineABCBuilder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgMacaddrBuilder";
	constructor(name) {
		super(name, "string macaddr", "PgMacaddr");
	}
	/** @internal */
	build(table) {
		return new PgMacaddr(table, this.config);
	}
};
var PgMacaddr = class extends PgColumn {
	static [entityKind] = "PgMacaddr";
	getSQLType() {
		return "macaddr";
	}
};
function macaddr(name) {
	return new PgMacaddrBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
	static [entityKind] = "PgMacaddr8Builder";
	constructor(name) {
		super(name, "string macaddr8", "PgMacaddr8");
	}
	/** @internal */
	build(table) {
		return new PgMacaddr8(table, this.config);
	}
};
var PgMacaddr8 = class extends PgColumn {
	static [entityKind] = "PgMacaddr8";
	getSQLType() {
		return "macaddr8";
	}
};
function macaddr8(name) {
	return new PgMacaddr8Builder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgNumericBuilder";
	constructor(name, precision, scale) {
		super(name, "string numeric", "PgNumeric");
		this.config.precision = precision;
		this.config.scale = scale;
	}
	/** @internal */
	build(table) {
		return new PgNumeric(table, this.config);
	}
};
var PgNumeric = class extends PgColumn {
	static [entityKind] = "PgNumeric";
	precision;
	scale;
	constructor(table, config) {
		super(table, config);
		this.precision = config.precision;
		this.scale = config.scale;
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") return value;
		return String(value);
	}
	getSQLType() {
		if (this.precision !== void 0 && this.scale !== void 0) return `numeric(${this.precision}, ${this.scale})`;
		else if (this.precision === void 0) return "numeric";
		else return `numeric(${this.precision})`;
	}
};
var PgNumericNumberBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgNumericNumberBuilder";
	constructor(name, precision, scale) {
		super(name, "number", "PgNumericNumber");
		this.config.precision = precision;
		this.config.scale = scale;
	}
	/** @internal */
	build(table) {
		return new PgNumericNumber(table, this.config);
	}
};
var PgNumericNumber = class extends PgColumn {
	static [entityKind] = "PgNumericNumber";
	precision;
	scale;
	constructor(table, config) {
		super(table, config);
		this.precision = config.precision;
		this.scale = config.scale;
	}
	mapFromDriverValue(value) {
		if (typeof value === "number") return value;
		return Number(value);
	}
	mapToDriverValue = String;
	getSQLType() {
		if (this.precision !== void 0 && this.scale !== void 0) return `numeric(${this.precision}, ${this.scale})`;
		else if (this.precision === void 0) return "numeric";
		else return `numeric(${this.precision})`;
	}
};
var PgNumericBigIntBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgNumericBigIntBuilder";
	constructor(name, precision, scale) {
		super(name, "bigint int64", "PgNumericBigInt");
		this.config.precision = precision;
		this.config.scale = scale;
	}
	/** @internal */
	build(table) {
		return new PgNumericBigInt(table, this.config);
	}
};
var PgNumericBigInt = class extends PgColumn {
	static [entityKind] = "PgNumericBigInt";
	precision;
	scale;
	constructor(table, config) {
		super(table, config);
		this.precision = config.precision;
		this.scale = config.scale;
	}
	mapFromDriverValue = BigInt;
	mapToDriverValue = String;
	getSQLType() {
		if (this.precision !== void 0 && this.scale !== void 0) return `numeric(${this.precision}, ${this.scale})`;
		else if (this.precision === void 0) return "numeric";
		else return `numeric(${this.precision})`;
	}
};
function numeric(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	const mode = config?.mode;
	return mode === "number" ? new PgNumericNumberBuilder(name, config?.precision, config?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name, config?.precision, config?.scale) : new PgNumericBuilder(name, config?.precision, config?.scale);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgPointTupleBuilder";
	constructor(name) {
		super(name, "array point", "PgPointTuple");
	}
	/** @internal */
	build(table) {
		return new PgPointTuple(table, this.config);
	}
};
var PgPointTuple = class extends PgColumn {
	static [entityKind] = "PgPointTuple";
	getSQLType() {
		return "point";
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") {
			const [x$1, y$1] = value.slice(1, -1).split(",");
			return [Number.parseFloat(x$1), Number.parseFloat(y$1)];
		}
		return [value.x, value.y];
	}
	mapToDriverValue(value) {
		return `(${value[0]},${value[1]})`;
	}
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgPointObjectBuilder";
	constructor(name) {
		super(name, "object point", "PgPointObject");
	}
	/** @internal */
	build(table) {
		return new PgPointObject(table, this.config);
	}
};
var PgPointObject = class extends PgColumn {
	static [entityKind] = "PgPointObject";
	getSQLType() {
		return "point";
	}
	mapFromDriverValue(value) {
		if (typeof value === "string") {
			const [x$1, y$1] = value.slice(1, -1).split(",");
			return {
				x: Number.parseFloat(x$1),
				y: Number.parseFloat(y$1)
			};
		}
		return value;
	}
	mapToDriverValue(value) {
		return `(${value.x},${value.y})`;
	}
};
function point(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (!config?.mode || config.mode === "tuple") return new PgPointTupleBuilder(name);
	return new PgPointObjectBuilder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
	const bytes = [];
	for (let c$1 = 0; c$1 < hex.length; c$1 += 2) bytes.push(Number.parseInt(hex.slice(c$1, c$1 + 2), 16));
	return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
	const buffer = /* @__PURE__ */ new ArrayBuffer(8);
	const view = new DataView(buffer);
	for (let i$1 = 0; i$1 < 8; i$1++) view.setUint8(i$1, bytes[offset + i$1]);
	return view.getFloat64(0, true);
}
function parseEWKB(hex) {
	const bytes = hexToBytes(hex);
	let offset = 0;
	const byteOrder = bytes[offset];
	offset += 1;
	const view = new DataView(bytes.buffer);
	const geomType = view.getUint32(offset, byteOrder === 1);
	offset += 4;
	if (geomType & 536870912) {
		view.getUint32(offset, byteOrder === 1);
		offset += 4;
	}
	if ((geomType & 65535) === 1) {
		const x$1 = bytesToFloat64(bytes, offset);
		offset += 8;
		const y$1 = bytesToFloat64(bytes, offset);
		offset += 8;
		return [x$1, y$1];
	}
	throw new Error("Unsupported geometry type");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgGeometryBuilder";
	constructor(name) {
		super(name, "array geometry", "PgGeometry");
	}
	/** @internal */
	build(table) {
		return new PgGeometry(table, this.config);
	}
};
var PgGeometry = class extends PgColumn {
	static [entityKind] = "PgGeometry";
	getSQLType() {
		return "geometry(point)";
	}
	mapFromDriverValue(value) {
		if (typeof value !== "string") return value;
		return parseEWKB(value);
	}
	mapToDriverValue(value) {
		return `point(${value[0]} ${value[1]})`;
	}
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgGeometryObjectBuilder";
	constructor(name) {
		super(name, "object geometry", "PgGeometryObject");
	}
	/** @internal */
	build(table) {
		return new PgGeometryObject(table, this.config);
	}
};
var PgGeometryObject = class extends PgColumn {
	static [entityKind] = "PgGeometryObject";
	getSQLType() {
		return "geometry(point)";
	}
	mapFromDriverValue(value) {
		const parsed = parseEWKB(value);
		return {
			x: parsed[0],
			y: parsed[1]
		};
	}
	mapToDriverValue(value) {
		return `point(${value.x} ${value.y})`;
	}
};
function geometry(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (!config?.mode || config.mode === "tuple") return new PgGeometryBuilder(name);
	return new PgGeometryObjectBuilder(name);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgRealBuilder";
	constructor(name, length) {
		super(name, "number float", "PgReal");
		this.config.length = length;
	}
	/** @internal */
	build(table) {
		return new PgReal(table, this.config);
	}
};
var PgReal = class extends PgColumn {
	static [entityKind] = "PgReal";
	constructor(table, config) {
		super(table, config);
	}
	getSQLType() {
		return "real";
	}
	mapFromDriverValue = (value) => {
		if (typeof value === "string") return Number.parseFloat(value);
		return value;
	};
};
function real(name) {
	return new PgRealBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgSerialBuilder";
	constructor(name) {
		super(name, "number int32", "PgSerial");
		this.config.hasDefault = true;
		this.config.notNull = true;
	}
	/** @internal */
	build(table) {
		return new PgSerial(table, this.config);
	}
};
var PgSerial = class extends PgColumn {
	static [entityKind] = "PgSerial";
	getSQLType() {
		return "serial";
	}
};
function serial(name) {
	return new PgSerialBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
	static [entityKind] = "PgSmallIntBuilder";
	constructor(name) {
		super(name, "number int16", "PgSmallInt");
	}
	/** @internal */
	build(table) {
		return new PgSmallInt(table, this.config);
	}
};
var PgSmallInt = class extends PgColumn {
	static [entityKind] = "PgSmallInt";
	getSQLType() {
		return "smallint";
	}
	mapFromDriverValue = (value) => {
		if (typeof value === "string") return Number(value);
		return value;
	};
};
function smallint(name) {
	return new PgSmallIntBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgSmallSerialBuilder";
	constructor(name) {
		super(name, "number int16", "PgSmallSerial");
		this.config.hasDefault = true;
		this.config.notNull = true;
	}
	/** @internal */
	build(table) {
		return new PgSmallSerial(table, this.config);
	}
};
var PgSmallSerial = class extends PgColumn {
	static [entityKind] = "PgSmallSerial";
	getSQLType() {
		return "smallserial";
	}
};
function smallserial(name) {
	return new PgSmallSerialBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgTextBuilder";
	constructor(name, config) {
		super(name, config.enum?.length ? "string enum" : "string", "PgText");
		this.config.enumValues = config.enum;
	}
	/** @internal */
	build(table) {
		return new PgText(table, this.config, this.config.enumValues);
	}
};
var PgText = class extends PgColumn {
	static [entityKind] = "PgText";
	enumValues;
	constructor(table, config, enumValues) {
		super(table, config);
		this.enumValues = enumValues;
	}
	getSQLType() {
		return "text";
	}
};
function text(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgTextBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
	constructor(name, withTimezone, precision) {
		super(name, "string time", "PgTime");
		this.withTimezone = withTimezone;
		this.precision = precision;
		this.config.withTimezone = withTimezone;
		this.config.precision = precision;
	}
	static [entityKind] = "PgTimeBuilder";
	/** @internal */
	build(table) {
		return new PgTime(table, this.config);
	}
};
var PgTime = class extends PgColumn {
	static [entityKind] = "PgTime";
	withTimezone;
	precision;
	constructor(table, config) {
		super(table, config);
		this.withTimezone = config.withTimezone;
		this.precision = config.precision;
	}
	getSQLType() {
		return `time${this.precision === void 0 ? "" : `(${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
	}
};
function time(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
	static [entityKind] = "PgTimestampBuilder";
	constructor(name, withTimezone, precision) {
		super(name, "object date", "PgTimestamp");
		this.config.withTimezone = withTimezone;
		this.config.precision = precision;
	}
	/** @internal */
	build(table) {
		return new PgTimestamp(table, this.config);
	}
};
var PgTimestamp = class extends PgColumn {
	static [entityKind] = "PgTimestamp";
	withTimezone;
	precision;
	constructor(table, config) {
		super(table, config);
		this.withTimezone = config.withTimezone;
		this.precision = config.precision;
	}
	getSQLType() {
		return `timestamp${this.precision === void 0 ? "" : ` (${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
	}
	mapFromDriverValue = (value) => {
		return new Date(this.withTimezone ? value : value + "+0000");
	};
	mapToDriverValue = (value) => {
		return value.toISOString();
	};
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
	static [entityKind] = "PgTimestampStringBuilder";
	constructor(name, withTimezone, precision) {
		super(name, "string timestamp", "PgTimestampString");
		this.config.withTimezone = withTimezone;
		this.config.precision = precision;
	}
	/** @internal */
	build(table) {
		return new PgTimestampString(table, this.config);
	}
};
var PgTimestampString = class extends PgColumn {
	static [entityKind] = "PgTimestampString";
	withTimezone;
	precision;
	constructor(table, config) {
		super(table, config);
		this.withTimezone = config.withTimezone;
		this.precision = config.precision;
	}
	getSQLType() {
		return `timestamp${this.precision === void 0 ? "" : `(${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
	}
};
function timestamp(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	if (config?.mode === "string") return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
	return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgUUIDBuilder";
	constructor(name) {
		super(name, "string uuid", "PgUUID");
	}
	/**
	* Adds `default gen_random_uuid()` to the column definition.
	*/
	defaultRandom() {
		return this.default(sql$1`gen_random_uuid()`);
	}
	/** @internal */
	build(table) {
		return new PgUUID(table, this.config);
	}
};
var PgUUID = class extends PgColumn {
	static [entityKind] = "PgUUID";
	getSQLType() {
		return "uuid";
	}
};
function uuid(name) {
	return new PgUUIDBuilder(name ?? "");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgVarcharBuilder";
	constructor(name, config) {
		super(name, config.enum?.length ? "string enum" : "string", "PgVarchar");
		this.config.length = config.length;
		this.config.enumValues = config.enum;
	}
	/** @internal */
	build(table) {
		return new PgVarchar(table, this.config);
	}
};
var PgVarchar = class extends PgColumn {
	static [entityKind] = "PgVarchar";
	enumValues = this.config.enumValues;
	getSQLType() {
		return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
	}
};
function varchar(a$1, b$1 = {}) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgVarcharBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgBinaryVectorBuilder";
	constructor(name, config) {
		super(name, "string binary", "PgBinaryVector");
		this.config.length = config.dimensions;
		this.config.isLengthExact = true;
	}
	/** @internal */
	build(table) {
		return new PgBinaryVector(table, this.config);
	}
};
var PgBinaryVector = class extends PgColumn {
	static [entityKind] = "PgBinaryVector";
	getSQLType() {
		return `bit(${this.length})`;
	}
};
function bit(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgBinaryVectorBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgHalfVectorBuilder";
	constructor(name, config) {
		super(name, "array halfvector", "PgHalfVector");
		this.config.length = config.dimensions;
		this.config.isLengthExact = true;
	}
	/** @internal */
	build(table) {
		return new PgHalfVector(table, this.config);
	}
};
var PgHalfVector = class extends PgColumn {
	static [entityKind] = "PgHalfVector";
	getSQLType() {
		return `halfvec(${this.length})`;
	}
	mapToDriverValue(value) {
		return JSON.stringify(value);
	}
	mapFromDriverValue(value) {
		return value.slice(1, -1).split(",").map((v$1) => Number.parseFloat(v$1));
	}
};
function halfvec(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgHalfVectorBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgSparseVectorBuilder";
	constructor(name, config) {
		super(name, "string sparsevec", "PgSparseVector");
		this.config.dimensions = config.dimensions;
	}
	/** @internal */
	build(table) {
		return new PgSparseVector(table, this.config);
	}
};
var PgSparseVector = class extends PgColumn {
	static [entityKind] = "PgSparseVector";
	dimensions = this.config.dimensions;
	getSQLType() {
		return `sparsevec(${this.dimensions})`;
	}
};
function sparsevec(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgSparseVectorBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
	static [entityKind] = "PgVectorBuilder";
	constructor(name, config) {
		super(name, "array vector", "PgVector");
		this.config.length = config.dimensions;
		this.config.isLengthExact = true;
	}
	/** @internal */
	build(table) {
		return new PgVector(table, this.config);
	}
};
var PgVector = class extends PgColumn {
	static [entityKind] = "PgVector";
	getSQLType() {
		return `vector(${this.length})`;
	}
	mapToDriverValue(value) {
		return JSON.stringify(value);
	}
	mapFromDriverValue(value) {
		return value.slice(1, -1).split(",").map((v$1) => Number.parseFloat(v$1));
	}
};
function vector(a$1, b$1) {
	const { name, config } = getColumnNameAndConfig(a$1, b$1);
	return new PgVectorBuilder(name, config);
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
	return {
		bigint,
		bigserial,
		boolean,
		char,
		cidr,
		customType,
		date,
		doublePrecision,
		inet,
		integer,
		interval,
		json,
		jsonb,
		line,
		macaddr,
		macaddr8,
		numeric,
		point,
		geometry,
		real,
		serial,
		smallint,
		smallserial,
		text,
		time,
		timestamp,
		uuid,
		varchar,
		bit,
		halfvec,
		sparsevec,
		vector
	};
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/table.js
const InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
const EnableRLS = Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
	static [entityKind] = "PgTable";
	/** @internal */
	static Symbol = Object.assign({}, Table.Symbol, {
		InlineForeignKeys,
		EnableRLS
	});
	/**@internal */
	[InlineForeignKeys] = [];
	/** @internal */
	[EnableRLS] = false;
	/** @internal */
	[Table.Symbol.ExtraConfigBuilder] = void 0;
	/** @internal */
	[Table.Symbol.ExtraConfigColumns] = {};
};
function pgTableWithSchema(name, columns, extraConfig, schema$1, baseName = name) {
	const rawTable = new PgTable(name, schema$1, baseName);
	const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
	const builtColumns = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
		const colBuilder = colBuilderBase;
		colBuilder.setName(name2);
		const column = colBuilder.build(rawTable);
		rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
		return [name2, column];
	}));
	const builtColumnsForExtraConfig = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
		const colBuilder = colBuilderBase;
		colBuilder.setName(name2);
		const column = colBuilder.buildExtraConfigColumn(rawTable);
		return [name2, column];
	}));
	const table = Object.assign(rawTable, builtColumns);
	table[Table.Symbol.Columns] = builtColumns;
	table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
	if (extraConfig) table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
	return Object.assign(table, { enableRLS: () => {
		table[PgTable.Symbol.EnableRLS] = true;
		return table;
	} });
}
const pgTable = (name, columns, extraConfig) => {
	return pgTableWithSchema(name, columns, extraConfig, void 0);
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/indexes.js
var IndexBuilderOn = class {
	constructor(unique$1, name) {
		this.unique = unique$1;
		this.name = name;
	}
	static [entityKind] = "PgIndexBuilderOn";
	on(...columns) {
		return new IndexBuilder(columns.map((it) => {
			if (is$1(it, SQL$1)) return it;
			it = it;
			const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
			it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
			return clonedIndexedColumn;
		}), this.unique, false, this.name);
	}
	onOnly(...columns) {
		return new IndexBuilder(columns.map((it) => {
			if (is$1(it, SQL$1)) return it;
			it = it;
			const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
			it.indexConfig = it.defaultConfig;
			return clonedIndexedColumn;
		}), this.unique, true, this.name);
	}
	/**
	* Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
	*
	* If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
	*
	* **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
	*
	* @param method The name of the index method to be used
	* @param columns
	* @returns
	*/
	using(method, ...columns) {
		return new IndexBuilder(columns.map((it) => {
			if (is$1(it, SQL$1)) return it;
			it = it;
			const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
			it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
			return clonedIndexedColumn;
		}), this.unique, true, this.name, method);
	}
};
var IndexBuilder = class {
	static [entityKind] = "PgIndexBuilder";
	/** @internal */
	config;
	constructor(columns, unique$1, only, name, method = "btree") {
		this.config = {
			name,
			columns,
			unique: unique$1,
			only,
			method
		};
	}
	concurrently() {
		this.config.concurrently = true;
		return this;
	}
	with(obj) {
		this.config.with = obj;
		return this;
	}
	where(condition) {
		this.config.where = condition;
		return this;
	}
	/** @internal */
	build(table) {
		return new Index(this.config, table);
	}
};
var Index = class {
	static [entityKind] = "PgIndex";
	config;
	constructor(config, table) {
		this.config = {
			...config,
			table
		};
	}
};
function index(name) {
	return new IndexBuilderOn(false, name);
}
function uniqueIndex(name) {
	return new IndexBuilderOn(true, name);
}

//#endregion
//#region schema/better-auth.ts
const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	phoneNumber: text("phone_number").unique(),
	phoneNumberVerified: boolean("phone_number_verified"),
	isAnonymous: boolean("is_anonymous"),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires")
});
const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	activeOrganizationId: text("active_organization_id"),
	impersonatedBy: text("impersonated_by")
});
const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	createdAt: timestamp("created_at").notNull(),
	metadata: text("metadata")
});
const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	createdAt: timestamp("created_at").notNull()
});
const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").default("pending").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" })
});
const jwks = pgTable("jwks", {
	id: text("id").primaryKey(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at").notNull()
});

//#endregion
//#region schema/extend-created-by.ts
const actorTypeEnum = pgEnum("actor_type_enum", [
	"user",
	"system",
	"api_token"
]);
const createdBy = () => {
	return {
		actorType: actorTypeEnum("actor_type").default("user").notNull(),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		orgId: text("org_id").references(() => organization.id, { onDelete: "cascade" })
	};
};
const createdByCheck = (table) => ({ validActorConstraints: check("valid_actor_constraints", sql`
			CASE ${table.actorType}
				WHEN 'user' THEN 
					${table.userId} IS NOT NULL AND ${table.orgId} IS NOT NULL
				WHEN 'system' THEN 
					${table.userId} IS NULL
				WHEN 'api_token' THEN 
					${table.userId} IS NULL
				ELSE FALSE
			END
		`) });

//#endregion
//#region schema/extend-timestamps.ts
const timeStamps = ({ softDelete }) => {
	const commonTimestamps = {
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull()
	};
	const deleteTimestamp = { deletedAt: timestamp("deleted_at", { withTimezone: true }) };
	return softDelete ? {
		...commonTimestamps,
		...deleteTimestamp
	} : commonTimestamps;
};

//#endregion
//#region schema/currency.ts
/**
* Currency Configuration for Dinero.js
*
* const USD = {
*   code: "USD",
*   base: 10,        // decimal-based
*   exponent: 2,     // cents
*   symbol: "$",
*   name: "US Dollar"
* }
*
* Usage:
* const amount = dinero({
*   amount: 1000,    // $10.00 (stored in minor units - cents)
*   currency: USD
* })
*
*/
const currency = pgTable("currency", {
	code: text("code").primaryKey(),
	base: integer("base").default(10).notNull(),
	exponent: integer("exponent").default(2).notNull(),
	symbol: text("symbol").notNull(),
	name: text("name").notNull(),
	...timeStamps({ softDelete: true })
});

//#endregion
//#region schema/region.ts
const region = pgTable("region", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	name: t$1.text("name").notNull(),
	currencyCode: t$1.text("currency_code").references(() => currency.code).notNull(),
	automaticTaxes: t$1.boolean("automatic_taxes").default(true),
	metadata: t$1.jsonb("metadata"),
	...timeStamps({ softDelete: true })
}), (t$1) => [index("region_currency_code_idx").on(t$1.currencyCode)]);
const regionCountry = pgTable("region_country", (t$1) => ({
	iso2: t$1.text("iso_2").primaryKey(),
	iso3: t$1.text("iso_3"),
	numCode: t$1.text("num_code").notNull(),
	name: t$1.text("name").notNull(),
	displayName: t$1.text("display_name").notNull(),
	regionId: t$1.text("region_id").references(() => region.id),
	metadata: t$1.jsonb("metadata"),
	...timeStamps({ softDelete: true })
}), (t$1) => [index("region_country_region_id_idx").on(t$1.regionId)]);

//#endregion
//#region schema/address.ts
const address = pgTable("address", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	addressName: t$1.text("address_name"),
	isDefaultShipping: t$1.boolean("is_default_shipping").default(false).notNull(),
	isDefaultBilling: t$1.boolean("is_default_billing").default(false).notNull(),
	company: t$1.text("company"),
	firstName: t$1.text("first_name"),
	lastName: t$1.text("last_name"),
	address1: t$1.text("address_1").notNull(),
	address2: t$1.text("address_2"),
	city: t$1.text("city").notNull(),
	countryCode: t$1.text("country_code").references(() => regionCountry.iso2).notNull(),
	province: t$1.text("province"),
	postalCode: t$1.text("postal_code").notNull(),
	longitude: t$1.doublePrecision("longitude"),
	latitude: t$1.doublePrecision("latitude"),
	originalPhoneNumber: t$1.text("original_phone_number").notNull(),
	e164PhoneNumber: t$1.text("e164_phone_number").notNull(),
	metadata: t$1.jsonb("metadata"),
	...timeStamps({ softDelete: true }),
	...createdBy()
}), (t$1) => [index("address_country_code_idx").on(t$1.countryCode)]);

//#endregion
//#region ../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.production.js
var require_index_production = /* @__PURE__ */ __commonJS({ "../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.production.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: !0 });
	var r, n = "Objects must have the same currency.";
	function t(r$1, n$1) {
		if (!r$1) throw new Error("[Dinero.js] ".concat(n$1));
	}
	function e(r$1) {
		var n$1 = r$1.calculator, t$1 = r$1.onCreate, e$1 = r$1.formatter, o$1 = void 0 === e$1 ? {
			toNumber: Number,
			toString: String
		} : e$1;
		return function r$2(e$2) {
			var u$1 = e$2.amount, a$1 = e$2.currency, c$1 = a$1.code, i$1 = a$1.base, l$1 = a$1.exponent, f$1 = e$2.scale, y$1 = void 0 === f$1 ? l$1 : f$1, v$1 = {
				code: c$1,
				base: i$1,
				exponent: l$1
			};
			return t$1?.({
				amount: u$1,
				currency: v$1,
				scale: y$1
			}), {
				calculator: n$1,
				formatter: o$1,
				create: r$2,
				toJSON: function() {
					return {
						amount: u$1,
						currency: v$1,
						scale: y$1
					};
				}
			};
		};
	}
	function o(n$1) {
		return function(t$1, e$1) {
			return n$1.compare(t$1, e$1) === r.EQ;
		};
	}
	function u(n$1) {
		return function(t$1, e$1) {
			return n$1.compare(t$1, e$1) === r.LT;
		};
	}
	function a(r$1) {
		var n$1 = o(r$1), t$1 = u(r$1), e$1 = r$1.zero();
		return function(o$1) {
			if (n$1(o$1, e$1)) return e$1;
			if (t$1(o$1, e$1)) {
				var u$1 = r$1.decrement(e$1);
				return r$1.multiply(u$1, o$1);
			}
			return o$1;
		};
	}
	function c(r$1) {
		return Array.isArray(r$1);
	}
	function i(r$1) {
		return function(n$1) {
			return c(n$1) ? n$1.reduce((function(n$2, t$1) {
				return r$1.multiply(n$2, t$1);
			})) : n$1;
		};
	}
	function l(n$1) {
		return function(t$1, e$1) {
			return n$1.compare(t$1, e$1) === r.GT;
		};
	}
	function f(r$1) {
		return function(n$1, t$1) {
			return l(r$1)(n$1, t$1) || o(r$1)(n$1, t$1);
		};
	}
	function y(r$1) {
		return function(n$1, t$1) {
			var e$1 = o(r$1), a$1 = l(r$1), c$1 = u(r$1), i$1 = f(r$1), y$1 = r$1.zero(), v$1 = r$1.increment(y$1), s$1 = t$1.reduce((function(n$2, t$2) {
				return r$1.add(n$2, t$2);
			}), y$1);
			if (e$1(s$1, y$1)) return t$1;
			for (var m$1 = n$1, p$1 = t$1.map((function(t$2) {
				var e$2 = r$1.integerDivide(r$1.multiply(n$1, t$2), s$1) || y$1;
				return m$1 = r$1.subtract(m$1, e$2), e$2;
			})), h$1 = i$1(n$1, y$1), d$1 = h$1 ? a$1 : c$1, b$1 = h$1 ? v$1 : r$1.decrement(y$1), g$1 = 0; d$1(m$1, y$1);) e$1(t$1[g$1], y$1) || (p$1[g$1] = r$1.add(p$1[g$1], b$1), m$1 = r$1.subtract(m$1, b$1)), g$1++;
			return p$1;
		};
	}
	function v(r$1, n$1) {
		var t$1, e$1;
		return (null == (e$1 = r$1) ? void 0 : e$1.hasOwnProperty("amount")) ? {
			amount: r$1.amount,
			scale: null !== (t$1 = null == r$1 ? void 0 : r$1.scale) && void 0 !== t$1 ? t$1 : n$1
		} : {
			amount: r$1,
			scale: n$1
		};
	}
	function s(r$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return m(r$2);
		}(r$1) || function(r$2) {
			if ("undefined" != typeof Symbol && null != r$2[Symbol.iterator] || null != r$2["@@iterator"]) return Array.from(r$2);
		}(r$1) || function(r$2, n$1) {
			if (!r$2) return;
			if ("string" == typeof r$2) return m(r$2, n$1);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return m(r$2, n$1);
		}(r$1) || function() {
			throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function m(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function p(r$1) {
		var n$1 = o(r$1), t$1 = r$1.zero(), e$1 = r$1.increment(r$1.increment(t$1));
		return function(o$1) {
			return n$1(r$1.modulo(o$1, e$1), t$1);
		};
	}
	function h(r$1) {
		var n$1 = o(r$1), t$1 = a(r$1);
		return function(e$1, o$1) {
			var u$1 = t$1(r$1.modulo(e$1, o$1)), a$1 = r$1.subtract(o$1, u$1);
			return n$1(a$1, u$1);
		};
	}
	function d(r$1) {
		var n$1 = u(r$1);
		return function(r$2) {
			return r$2.reduce((function(r$3, t$1) {
				return n$1(r$3, t$1) ? t$1 : r$3;
			}));
		};
	}
	function b(r$1) {
		var n$1 = o(r$1), t$1 = u(r$1), e$1 = r$1.zero();
		return function(o$1) {
			if (n$1(o$1, e$1)) return e$1;
			var u$1 = r$1.increment(e$1), a$1 = r$1.decrement(e$1);
			return t$1(o$1, e$1) ? a$1 : u$1;
		};
	}
	function g(r$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2) {
			if ("undefined" != typeof Symbol && null != r$2[Symbol.iterator] || null != r$2["@@iterator"]) return Array.from(r$2);
		}(r$1) || function(r$2, n$1) {
			if (!r$2) return;
			if ("string" == typeof r$2) return A(r$2, n$1);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return A(r$2, n$1);
		}(r$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function A(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function w(r$1) {
		var n$1 = g(r$1), t$1 = n$1[0], e$1 = n$1.slice(1), u$1 = i(t$1.calculator), a$1 = t$1.toJSON().currency, c$1 = o(t$1.calculator), l$1 = u$1(a$1.base);
		return e$1.every((function(r$2) {
			var n$2 = r$2.toJSON().currency, t$2 = u$1(n$2.base);
			return n$2.code === a$1.code && c$1(t$2, l$1) && c$1(n$2.exponent, a$1.exponent);
		}));
	}
	(function(r$1) {
		r$1[r$1.LT = -1] = "LT", r$1[r$1.EQ = 0] = "EQ", r$1[r$1.GT = 1] = "GT";
	})(r || (r = {}));
	var S = function(r$1, n$1, t$1) {
		var e$1 = l(t$1), u$1 = o(t$1), a$1 = t$1.zero(), c$1 = e$1(r$1, a$1), i$1 = t$1.integerDivide(r$1, n$1), f$1 = u$1(t$1.modulo(r$1, n$1), a$1);
		return c$1 || f$1 ? i$1 : t$1.decrement(i$1);
	}, O = function(r$1, n$1, t$1) {
		var e$1 = l(t$1), o$1 = h(t$1), u$1 = a(t$1), c$1 = t$1.zero(), i$1 = u$1(t$1.modulo(r$1, n$1)), f$1 = e$1(t$1.subtract(n$1, i$1), i$1), y$1 = e$1(r$1, c$1);
		return o$1(r$1, n$1) || y$1 && !f$1 || !y$1 && f$1 ? x(r$1, n$1, t$1) : S(r$1, n$1, t$1);
	}, x = function(r$1, n$1, t$1) {
		var e$1 = l(t$1), u$1 = o(t$1), a$1 = t$1.zero(), c$1 = e$1(r$1, a$1), i$1 = t$1.integerDivide(r$1, n$1);
		return !u$1(t$1.modulo(r$1, n$1), a$1) && c$1 ? t$1.increment(i$1) : i$1;
	};
	function j(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return I(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return I(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function I(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function N(r$1) {
		var n$1 = l(r$1), t$1 = i(r$1);
		return function() {
			for (var e$1 = arguments.length, o$1 = new Array(e$1), u$1 = 0; u$1 < e$1; u$1++) o$1[u$1] = arguments[u$1];
			var a$1 = o$1[0], c$1 = o$1[1], i$1 = o$1[2], l$1 = void 0 === i$1 ? S : i$1, f$1 = a$1.toJSON(), y$1 = f$1.amount, v$1 = f$1.currency, s$1 = f$1.scale, m$1 = n$1(c$1, s$1), p$1 = m$1 ? r$1.multiply : l$1, h$1 = m$1 ? [c$1, s$1] : [s$1, c$1], d$1 = j(h$1, 2), b$1 = d$1[0], g$1 = d$1[1], A$1 = t$1(v$1.base), w$1 = r$1.power(A$1, r$1.subtract(b$1, g$1));
			return a$1.create({
				amount: p$1(y$1, w$1, r$1),
				currency: v$1,
				scale: c$1
			});
		};
	}
	function J(r$1) {
		var n$1 = d(r$1), t$1 = N(r$1), e$1 = o(r$1);
		return function() {
			for (var o$1 = arguments.length, u$1 = new Array(o$1), a$1 = 0; a$1 < o$1; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = c$1.reduce((function(r$2, t$2) {
				var e$2 = t$2.toJSON().scale;
				return n$1([r$2, e$2]);
			}), r$1.zero());
			return c$1.map((function(r$2) {
				var n$2 = r$2.toJSON().scale;
				return e$1(n$2, i$1) ? r$2 : t$1(r$2, i$1);
			}));
		};
	}
	function T(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return E(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return E(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function E(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function z(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			return function() {
				for (var n$1 = arguments.length, t$1 = new Array(n$1), e$2 = 0; e$2 < n$1; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = t$1[0], u$1 = t$1[1], a$1 = o$2.toJSON(), c$1 = a$1.amount, i$1 = a$1.currency, l$1 = a$1.scale, f$1 = u$1.toJSON().amount, y$1 = r$2.add(c$1, f$1);
				return o$2.create({
					amount: y$1,
					currency: i$1,
					scale: l$1
				});
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = T(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function C(r$1) {
		var n$1 = function(r$2) {
			return function() {
				for (var n$2 = arguments.length, t$1 = new Array(n$2), e$2 = 0; e$2 < n$2; e$2++) t$1[e$2] = arguments[e$2];
				var o$1 = t$1[0], u$2 = t$1[1], a$2 = o$1.toJSON(), c$2 = a$2.amount, i$2 = a$2.currency, l$1 = a$2.scale;
				return y(r$2)(c$2, u$2.map((function(r$3) {
					return r$3.amount;
				}))).map((function(r$3) {
					return o$1.create({
						amount: r$3,
						currency: i$2,
						scale: l$1
					});
				}));
			};
		}(r$1), e$1 = f(r$1), u$1 = l(r$1), a$1 = N(r$1), c$1 = d(r$1), i$1 = o(r$1), s$1 = r$1.zero(), m$1 = new Array(10).fill(null).reduce(r$1.increment, s$1);
		return function() {
			for (var o$1 = arguments.length, l$1 = new Array(o$1), f$1 = 0; f$1 < o$1; f$1++) l$1[f$1] = arguments[f$1];
			var y$1 = l$1[0], p$1 = l$1[1], h$1 = p$1.length > 0, d$1 = p$1.map((function(r$2) {
				return v(r$2, s$1);
			})), b$1 = h$1 ? c$1(d$1.map((function(r$2) {
				return r$2.scale;
			}))) : s$1, g$1 = d$1.map((function(n$2) {
				var t$1 = n$2.amount, e$2 = n$2.scale, o$2 = i$1(e$2, b$1) ? s$1 : r$1.subtract(b$1, e$2);
				return {
					amount: r$1.multiply(t$1, r$1.power(m$1, o$2)),
					scale: e$2
				};
			})), A$1 = g$1.every((function(r$2) {
				var n$2 = r$2.amount;
				return e$1(n$2, s$1);
			})), w$1 = g$1.some((function(r$2) {
				var n$2 = r$2.amount;
				return u$1(n$2, s$1);
			}));
			t(h$1 && A$1 && w$1, "Ratios are invalid.");
			var O$1 = y$1.toJSON(), x$1 = O$1.scale, j$1 = r$1.add(x$1, b$1);
			return n$1(a$1(y$1, j$1), g$1);
		};
	}
	function M(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return U(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return U(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function U(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function $(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			var n$1 = function(r$3) {
				return function(n$2, t$1) {
					return r$3.compare(n$2, t$1);
				};
			}(r$2);
			return function() {
				for (var r$3 = arguments.length, t$1 = new Array(r$3), e$2 = 0; e$2 < r$3; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = M([t$1[0], t$1[1]].map((function(r$4) {
					return r$4.toJSON().amount;
				})), 2), u$1 = o$2[0], a$1 = o$2[1];
				return n$1(u$1, a$1);
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = M(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function D(r$1) {
		var n$1 = N(r$1), t$1 = d(r$1), e$1 = r$1.zero();
		return function() {
			for (var o$1 = arguments.length, u$1 = new Array(o$1), a$1 = 0; a$1 < o$1; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = u$1[2], f$1 = l$1[i$1.code], y$1 = c$1.toJSON(), s$1 = y$1.amount, m$1 = y$1.scale, p$1 = v(f$1, e$1), h$1 = p$1.amount, d$1 = p$1.scale, b$1 = r$1.add(m$1, d$1);
			return n$1(c$1.create({
				amount: r$1.multiply(s$1, h$1),
				currency: i$1,
				scale: b$1
			}), t$1([b$1, i$1.exponent]));
		};
	}
	function G(r$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2) {
			if ("undefined" != typeof Symbol && null != r$2[Symbol.iterator] || null != r$2["@@iterator"]) return Array.from(r$2);
		}(r$1) || function(r$2, n$1) {
			if (!r$2) return;
			if ("string" == typeof r$2) return L(r$2, n$1);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return L(r$2, n$1);
		}(r$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function L(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function Q(r$1) {
		var n$1 = J(r$1), t$1 = o(r$1);
		return function() {
			for (var r$2 = arguments.length, e$1 = new Array(r$2), o$1 = 0; o$1 < r$2; o$1++) e$1[o$1] = arguments[o$1];
			var u$1 = e$1[0], a$1 = n$1(u$1), c$1 = G(a$1), i$1 = c$1[0], l$1 = c$1.slice(1), f$1 = i$1.toJSON(), y$1 = f$1.amount;
			return l$1.every((function(r$3) {
				var n$2 = r$3.toJSON().amount;
				return t$1(n$2, y$1);
			}));
		};
	}
	function q(r$1) {
		return function() {
			for (var n$1 = arguments.length, t$1 = new Array(n$1), e$1 = 0; e$1 < n$1; e$1++) t$1[e$1] = arguments[e$1];
			var o$1 = t$1[0], u$1 = t$1[1];
			return Q(r$1)([o$1, u$1]) && w([o$1, u$1]);
		};
	}
	function P(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return Z(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return Z(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function Z(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function _(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			var n$1 = l(r$2);
			return function() {
				for (var r$3 = arguments.length, t$1 = new Array(r$3), e$2 = 0; e$2 < r$3; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = P([t$1[0], t$1[1]].map((function(r$4) {
					return r$4.toJSON().amount;
				})), 2), u$1 = o$2[0], a$1 = o$2[1];
				return n$1(u$1, a$1);
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = P(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function F(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return R(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return R(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function R(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function k(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			var n$1 = f(r$2);
			return function() {
				for (var r$3 = arguments.length, t$1 = new Array(r$3), e$2 = 0; e$2 < r$3; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = F([t$1[0], t$1[1]].map((function(r$4) {
					return r$4.toJSON().amount;
				})), 2), u$1 = o$2[0], a$1 = o$2[1];
				return n$1(u$1, a$1);
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = F(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function B(r$1) {
		var n$1 = o(r$1), t$1 = i(r$1);
		return function() {
			for (var e$1 = arguments.length, o$1 = new Array(e$1), u$1 = 0; u$1 < e$1; u$1++) o$1[u$1] = arguments[u$1];
			var a$1 = o$1[0], c$1 = a$1.toJSON(), i$1 = c$1.amount, l$1 = c$1.currency, f$1 = c$1.scale, y$1 = t$1(l$1.base);
			return !n$1(r$1.modulo(i$1, r$1.power(y$1, f$1)), r$1.zero());
		};
	}
	function H(r$1) {
		var n$1 = u(r$1);
		return function() {
			for (var t$1 = arguments.length, e$1 = new Array(t$1), o$1 = 0; o$1 < t$1; o$1++) e$1[o$1] = arguments[o$1];
			var u$1 = e$1[0], a$1 = u$1.toJSON(), c$1 = a$1.amount;
			return n$1(c$1, r$1.zero());
		};
	}
	function K(r$1) {
		var n$1 = l(r$1);
		return function() {
			for (var t$1 = arguments.length, e$1 = new Array(t$1), o$1 = 0; o$1 < t$1; o$1++) e$1[o$1] = arguments[o$1];
			var u$1 = e$1[0], a$1 = u$1.toJSON(), c$1 = a$1.amount;
			return n$1(c$1, r$1.zero());
		};
	}
	function V(r$1) {
		var n$1 = o(r$1);
		return function() {
			for (var t$1 = arguments.length, e$1 = new Array(t$1), o$1 = 0; o$1 < t$1; o$1++) e$1[o$1] = arguments[o$1];
			var u$1 = e$1[0], a$1 = u$1.toJSON(), c$1 = a$1.amount;
			return n$1(c$1, r$1.zero());
		};
	}
	function W(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return X(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return X(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function X(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function Y(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			var n$1 = u(r$2);
			return function() {
				for (var r$3 = arguments.length, t$1 = new Array(r$3), e$2 = 0; e$2 < r$3; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = W([t$1[0], t$1[1]].map((function(r$4) {
					return r$4.toJSON().amount;
				})), 2), u$1 = o$2[0], a$1 = o$2[1];
				return n$1(u$1, a$1);
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = W(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function rr(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return nr(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return nr(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function nr(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function tr(r$1) {
		var n$1 = function(r$2) {
			return function(n$2, t$1) {
				return u(r$2)(n$2, t$1) || o(r$2)(n$2, t$1);
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, t$1 = new Array(r$2), e$1 = 0; e$1 < r$2; e$1++) t$1[e$1] = arguments[e$1];
			var o$1 = t$1[0], u$1 = t$1[1], a$1 = [o$1, u$1], c$1 = a$1.map((function(r$3) {
				return r$3.toJSON().amount;
			})), i$1 = rr(c$1, 2), l$1 = i$1[0], f$1 = i$1[1];
			return n$1(l$1, f$1);
		};
	}
	function er(r$1) {
		var e$1 = J(r$1), o$1 = tr(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = rr(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function or(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return ur(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return ur(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function ur(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function ar(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			var n$1 = d(r$2);
			return function() {
				for (var r$3 = arguments.length, t$1 = new Array(r$3), e$2 = 0; e$2 < r$3; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = t$1[0], u$1 = or(o$2, 1)[0], a$1 = u$1.toJSON(), c$1 = a$1.currency, i$1 = a$1.scale, l$1 = n$1(o$2.map((function(r$4) {
					return r$4.toJSON().amount;
				})));
				return u$1.create({
					amount: l$1,
					currency: c$1,
					scale: i$1
				});
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = w(c$1);
			t(i$1, n);
			var l$1 = e$1(c$1);
			return o$1(l$1);
		};
	}
	function cr(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return ir(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return ir(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function ir(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function lr(r$1) {
		var n$1 = function(r$2) {
			var n$2 = l(r$2);
			return function(r$3) {
				return r$3.reduce((function(r$4, t$1) {
					return n$2(r$4, t$1) ? t$1 : r$4;
				}));
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, t$1 = new Array(r$2), e$1 = 0; e$1 < r$2; e$1++) t$1[e$1] = arguments[e$1];
			var o$1 = t$1[0], u$1 = cr(o$1, 1), a$1 = u$1[0], c$1 = a$1.toJSON(), i$1 = c$1.currency, l$1 = c$1.scale, f$1 = n$1(o$1.map((function(r$3) {
				return r$3.toJSON().amount;
			})));
			return a$1.create({
				amount: f$1,
				currency: i$1,
				scale: l$1
			});
		};
	}
	function fr(r$1) {
		var e$1 = J(r$1), o$1 = lr(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = w(c$1);
			t(i$1, n);
			var l$1 = e$1(c$1);
			return o$1(l$1);
		};
	}
	function yr(r$1) {
		var n$1 = N(r$1), t$1 = r$1.zero();
		return function() {
			for (var e$1 = arguments.length, o$1 = new Array(e$1), u$1 = 0; u$1 < e$1; u$1++) o$1[u$1] = arguments[u$1];
			var a$1 = o$1[0], c$1 = o$1[1], i$1 = a$1.toJSON(), l$1 = i$1.amount, f$1 = i$1.currency, y$1 = i$1.scale, s$1 = v(c$1, t$1), m$1 = s$1.amount, p$1 = s$1.scale, h$1 = r$1.add(y$1, p$1);
			return n$1(a$1.create({
				amount: r$1.multiply(l$1, m$1),
				currency: f$1,
				scale: h$1
			}), h$1);
		};
	}
	function vr(r$1, n$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return r$2;
		}(r$1) || function(r$2, n$2) {
			var t$1 = null == r$2 ? null : "undefined" != typeof Symbol && r$2[Symbol.iterator] || r$2["@@iterator"];
			if (null == t$1) return;
			var e$1, o$1, u$1 = [], a$1 = !0, c$1 = !1;
			try {
				for (t$1 = t$1.call(r$2); !(a$1 = (e$1 = t$1.next()).done) && (u$1.push(e$1.value), !n$2 || u$1.length !== n$2); a$1 = !0);
			} catch (r$3) {
				c$1 = !0, o$1 = r$3;
			} finally {
				try {
					a$1 || null == t$1.return || t$1.return();
				} finally {
					if (c$1) throw o$1;
				}
			}
			return u$1;
		}(r$1, n$1) || function(r$2, n$2) {
			if (!r$2) return;
			if ("string" == typeof r$2) return sr(r$2, n$2);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return sr(r$2, n$2);
		}(r$1, n$1) || function() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function sr(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function mr(r$1) {
		var e$1 = J(r$1), o$1 = function(r$2) {
			return function() {
				for (var n$1 = arguments.length, t$1 = new Array(n$1), e$2 = 0; e$2 < n$1; e$2++) t$1[e$2] = arguments[e$2];
				var o$2 = t$1[0], u$1 = t$1[1], a$1 = o$2.toJSON(), c$1 = a$1.amount, i$1 = a$1.currency, l$1 = a$1.scale, f$1 = u$1.toJSON().amount, y$1 = r$2.subtract(c$1, f$1);
				return o$2.create({
					amount: y$1,
					currency: i$1,
					scale: l$1
				});
			};
		}(r$1);
		return function() {
			for (var r$2 = arguments.length, u$1 = new Array(r$2), a$1 = 0; a$1 < r$2; a$1++) u$1[a$1] = arguments[a$1];
			var c$1 = u$1[0], i$1 = u$1[1], l$1 = w([c$1, i$1]);
			t(l$1, n);
			var f$1 = e$1([c$1, i$1]), y$1 = vr(f$1, 2), v$1 = y$1[0], s$1 = y$1[1];
			return o$1(v$1, s$1);
		};
	}
	function pr(r$1) {
		return function(r$2) {
			if (Array.isArray(r$2)) return hr(r$2);
		}(r$1) || function(r$2) {
			if ("undefined" != typeof Symbol && null != r$2[Symbol.iterator] || null != r$2["@@iterator"]) return Array.from(r$2);
		}(r$1) || function(r$2, n$1) {
			if (!r$2) return;
			if ("string" == typeof r$2) return hr(r$2, n$1);
			var t$1 = Object.prototype.toString.call(r$2).slice(8, -1);
			"Object" === t$1 && r$2.constructor && (t$1 = r$2.constructor.name);
			if ("Map" === t$1 || "Set" === t$1) return Array.from(r$2);
			if ("Arguments" === t$1 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t$1)) return hr(r$2, n$1);
		}(r$1) || function() {
			throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}();
	}
	function hr(r$1, n$1) {
		(null == n$1 || n$1 > r$1.length) && (n$1 = r$1.length);
		for (var t$1 = 0, e$1 = new Array(n$1); t$1 < n$1; t$1++) e$1[t$1] = r$1[t$1];
		return e$1;
	}
	function dr(r$1) {
		var n$1 = function(r$2) {
			var n$2 = r$2.multiply;
			return function(r$3) {
				return r$3.reduce((function(t$1, e$1, o$1) {
					var u$1 = r$3.slice(o$1).reduce((function(r$4, t$2) {
						return n$2(r$4, t$2);
					}));
					return [].concat(s(t$1), [u$1]);
				}), []);
			};
		}(r$1);
		return function() {
			for (var t$1 = arguments.length, e$1 = new Array(t$1), o$1 = 0; o$1 < t$1; o$1++) e$1[o$1] = arguments[o$1];
			var u$1 = e$1[0], a$1 = e$1[1], i$1 = u$1.toJSON(), l$1 = i$1.amount, f$1 = i$1.currency, y$1 = i$1.scale, v$1 = r$1.power, s$1 = r$1.integerDivide, m$1 = r$1.modulo, p$1 = c(f$1.base) ? f$1.base : [f$1.base], h$1 = n$1(p$1.map((function(r$2) {
				return v$1(r$2, y$1);
			}))), d$1 = h$1.reduce((function(r$2, n$2, t$2) {
				var e$2 = r$2[t$2], o$2 = s$1(e$2, n$2), u$2 = m$1(e$2, n$2);
				return [].concat(pr(r$2.filter((function(r$3, n$3) {
					return n$3 !== t$2;
				}))), [o$2, u$2]);
			}), [l$1]);
			return a$1 ? a$1({
				value: d$1,
				currency: f$1
			}) : d$1;
		};
	}
	function br(r$1) {
		var n$1 = dr(r$1), e$1 = i(r$1), u$1 = o(r$1);
		return function() {
			for (var o$1 = arguments.length, a$1 = new Array(o$1), i$1 = 0; i$1 < o$1; i$1++) a$1[i$1] = arguments[i$1];
			var l$1 = a$1[0], f$1 = a$1[1], y$1 = l$1.toJSON(), v$1 = y$1.currency, s$1 = y$1.scale, m$1 = e$1(v$1.base), p$1 = r$1.zero(), h$1 = new Array(10).fill(null).reduce(r$1.increment, p$1), d$1 = c(v$1.base), b$1 = u$1(r$1.modulo(m$1, h$1), p$1);
			t(!d$1 && b$1, "Currency is not decimal.");
			var A$1 = n$1(l$1), w$1 = gr(r$1, l$1.formatter), S$1 = w$1(A$1, s$1);
			return f$1 ? f$1({
				value: S$1,
				currency: v$1
			}) : S$1;
		};
	}
	function gr(r$1, n$1) {
		var t$1 = a(r$1), e$1 = o(r$1), c$1 = u(r$1), i$1 = r$1.zero();
		return function(r$2, o$1) {
			var u$1 = n$1.toString(r$2[0]), a$1 = n$1.toString(t$1(r$2[1])), l$1 = n$1.toNumber(o$1), f$1 = "".concat(u$1, ".").concat(a$1.padStart(l$1, "0")), y$1 = e$1(r$2[0], i$1), v$1 = c$1(r$2[1], i$1);
			return y$1 && v$1 ? "-".concat(f$1) : f$1;
		};
	}
	function Ar(r$1) {
		var n$1 = function(r$2) {
			var n$2 = o(r$2);
			return function(t$2, e$2) {
				var o$1 = r$2.zero();
				if (n$2(o$1, t$2)) return r$2.zero();
				for (var u$2 = o$1, a$2 = t$2; n$2(r$2.modulo(a$2, e$2), o$1);) a$2 = r$2.integerDivide(a$2, e$2), u$2 = r$2.increment(u$2);
				return u$2;
			};
		}(r$1), t$1 = o(r$1), e$1 = d(r$1), u$1 = N(r$1), a$1 = i(r$1);
		return function() {
			for (var o$1 = arguments.length, c$1 = new Array(o$1), i$1 = 0; i$1 < o$1; i$1++) c$1[i$1] = arguments[i$1];
			var l$1 = c$1[0], f$1 = l$1.toJSON(), y$1 = f$1.amount, v$1 = f$1.currency, s$1 = f$1.scale, m$1 = a$1(v$1.base), p$1 = n$1(y$1, m$1), h$1 = r$1.subtract(s$1, p$1), d$1 = e$1([h$1, v$1.exponent]);
			return t$1(d$1, s$1) ? l$1 : u$1(l$1, d$1);
		};
	}
	var wr = w;
	var Sr = function(r$1) {
		return r$1.toJSON();
	};
	var Or = e({
		calculator: {
			add: function(r$1, n$1) {
				return r$1 + n$1;
			},
			compare: function(n$1, t$1) {
				return n$1 < t$1 ? r.LT : n$1 > t$1 ? r.GT : r.EQ;
			},
			decrement: function(r$1) {
				return r$1 - 1;
			},
			increment: function(r$1) {
				return r$1 + 1;
			},
			integerDivide: function(r$1, n$1) {
				return Math.trunc(r$1 / n$1);
			},
			modulo: function(r$1, n$1) {
				return r$1 % n$1;
			},
			multiply: function(r$1, n$1) {
				return r$1 * n$1;
			},
			power: function(r$1, n$1) {
				return Math.pow(r$1, n$1);
			},
			subtract: function(r$1, n$1) {
				return r$1 - n$1;
			},
			zero: function() {
				return 0;
			}
		},
		onCreate: function(r$1) {
			var n$1 = r$1.amount, e$1 = r$1.scale;
			t(Number.isInteger(n$1), "Amount is invalid."), t(Number.isInteger(e$1), "Scale is invalid.");
		}
	});
	exports.add = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return z(u$1)(e$1, o$1);
	}, exports.allocate = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return C(u$1)(e$1, o$1);
	}, exports.compare = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return $(u$1)(e$1, o$1);
	}, exports.convert = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = n$1[2], a$1 = e$1.calculator;
		return D(a$1)(e$1, o$1, u$1);
	}, exports.createDinero = e, exports.dinero = Or, exports.down = S, exports.equal = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return q(u$1)(e$1, o$1);
	}, exports.greaterThan = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return _(u$1)(e$1, o$1);
	}, exports.greaterThanOrEqual = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return k(u$1)(e$1, o$1);
	}, exports.halfAwayFromZero = function(r$1, n$1, t$1) {
		var e$1 = b(t$1), o$1 = h(t$1), u$1 = a(t$1);
		return o$1(r$1, n$1) ? t$1.multiply(e$1(r$1), x(u$1(r$1), n$1, t$1)) : O(r$1, n$1, t$1);
	}, exports.halfDown = function(r$1, n$1, t$1) {
		return h(t$1)(r$1, n$1) ? S(r$1, n$1, t$1) : O(r$1, n$1, t$1);
	}, exports.halfEven = function(r$1, n$1, t$1) {
		var e$1 = p(t$1), o$1 = h(t$1), u$1 = O(r$1, n$1, t$1);
		return o$1(r$1, n$1) ? e$1(u$1) ? u$1 : t$1.decrement(u$1) : u$1;
	}, exports.halfOdd = function(r$1, n$1, t$1) {
		var e$1 = p(t$1), o$1 = h(t$1), u$1 = O(r$1, n$1, t$1);
		return o$1(r$1, n$1) && e$1(u$1) ? t$1.decrement(u$1) : u$1;
	}, exports.halfTowardsZero = function(r$1, n$1, t$1) {
		var e$1 = b(t$1), o$1 = h(t$1), u$1 = a(t$1);
		return o$1(r$1, n$1) ? t$1.multiply(e$1(r$1), S(u$1(r$1), n$1, t$1)) : O(r$1, n$1, t$1);
	}, exports.halfUp = O, exports.hasSubUnits = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1.calculator;
		return B(o$1)(e$1);
	}, exports.haveSameAmount = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1[0].calculator;
		return Q(o$1)(e$1);
	}, exports.haveSameCurrency = wr, exports.isNegative = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1.calculator;
		return H(o$1)(e$1);
	}, exports.isPositive = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1.calculator;
		return K(o$1)(e$1);
	}, exports.isZero = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1.calculator;
		return V(o$1)(e$1);
	}, exports.lessThan = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return Y(u$1)(e$1, o$1);
	}, exports.lessThanOrEqual = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return er(u$1)(e$1, o$1);
	}, exports.maximum = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1[0].calculator;
		return ar(o$1)(e$1);
	}, exports.minimum = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1[0].calculator;
		return fr(o$1)(e$1);
	}, exports.multiply = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return yr(u$1)(e$1, o$1);
	}, exports.normalizeScale = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1[0].calculator;
		return J(o$1)(e$1);
	}, exports.subtract = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return mr(u$1)(e$1, o$1);
	}, exports.toDecimal = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return br(u$1)(e$1, o$1);
	}, exports.toSnapshot = Sr, exports.toUnits = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = e$1.calculator;
		return dr(u$1)(e$1, o$1);
	}, exports.transformScale = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = n$1[1], u$1 = n$1[2], a$1 = e$1.calculator;
		return N(a$1)(e$1, o$1, u$1);
	}, exports.trimScale = function() {
		for (var r$1 = arguments.length, n$1 = new Array(r$1), t$1 = 0; t$1 < r$1; t$1++) n$1[t$1] = arguments[t$1];
		var e$1 = n$1[0], o$1 = e$1.calculator;
		return Ar(o$1)(e$1);
	}, exports.up = x;
}) });

//#endregion
//#region ../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.development.js
var require_index_development = /* @__PURE__ */ __commonJS({ "../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.development.js": ((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var INVALID_AMOUNT_MESSAGE = "Amount is invalid.";
	var INVALID_SCALE_MESSAGE = "Scale is invalid.";
	/**
	* Assert a condition.
	*
	* @param condition - The condition to verify.
	* @param message - The error message to throw.
	*
	* @throws If the condition isn't met.
	*/
	function assert(condition, message) {
		if (!condition) throw new Error("[Dinero.js] ".concat(message));
	}
	function createDinero(_ref) {
		var calculator = _ref.calculator, onCreate = _ref.onCreate, _ref$formatter = _ref.formatter, formatter = _ref$formatter === void 0 ? {
			toNumber: Number,
			toString: String
		} : _ref$formatter;
		return function dinero$2(_ref2) {
			var amount = _ref2.amount, _ref2$currency = _ref2.currency, code = _ref2$currency.code, base = _ref2$currency.base, exponent = _ref2$currency.exponent, _ref2$scale = _ref2.scale, scale = _ref2$scale === void 0 ? exponent : _ref2$scale;
			var currency$1 = {
				code,
				base,
				exponent
			};
			onCreate === null || onCreate === void 0 || onCreate({
				amount,
				currency: currency$1,
				scale
			});
			return {
				calculator,
				formatter,
				create: dinero$2,
				toJSON: function toJSON() {
					return {
						amount,
						currency: currency$1,
						scale
					};
				}
			};
		};
	}
	var ComparisonOperator;
	(function(ComparisonOperator$1) {
		ComparisonOperator$1[ComparisonOperator$1["LT"] = -1] = "LT";
		ComparisonOperator$1[ComparisonOperator$1["EQ"] = 0] = "EQ";
		ComparisonOperator$1[ComparisonOperator$1["GT"] = 1] = "GT";
	})(ComparisonOperator || (ComparisonOperator = {}));
	/**
	* Returns the sum of two numbers.
	*
	* @param augend - The number to add to.
	* @param addend - The number to add.
	*
	* @returns The sum of the two numbers.
	*/
	var add = function add$1(augend, addend) {
		return augend + addend;
	};
	/**
	* Compare two numbers.
	*
	* @param a - The first number to compare.
	* @param b - The second number to compare.
	*
	* @returns Whether the two numbers are equal, or whether the first one is greater or less than the other.
	*/
	var compare = function compare$1(a$1, b$1) {
		if (a$1 < b$1) return ComparisonOperator.LT;
		if (a$1 > b$1) return ComparisonOperator.GT;
		return ComparisonOperator.EQ;
	};
	/**
	* Returns an decremented number.
	*
	* @param value - The number to decrement.
	*
	* @returns The decremented number.
	*/
	var decrement = function decrement$1(value) {
		return value - 1;
	};
	/**
	* Returns an incremented number.
	*
	* @param value - The number to increment.
	*
	* @returns The incremented number.
	*/
	var increment = function increment$1(value) {
		return value + 1;
	};
	/**
	* Returns the quotient of two numbers with no fractional part.
	*
	* @param dividend - The number to divide.
	* @param divisor - The number to divide with.
	*
	* @returns The quotient of the two numbers.
	*/
	var integerDivide = function integerDivide$1(dividend, divisor) {
		return Math.trunc(dividend / divisor);
	};
	/**
	* Returns the remainder of two numbers.
	*
	* @param dividend - The number to divide.
	* @param divisor - The number to divide with.
	*
	* @returns The remainder of the two numbers.
	*/
	var modulo = function modulo$1(dividend, divisor) {
		return dividend % divisor;
	};
	/**
	* Returns the product of two numbers.
	*
	* @param multiplicand - The number to multiply.
	* @param multiplier - The number to multiply with.
	*
	* @returns The product of the two numbers.
	*/
	var multiply = function multiply$1(multiplicand, multiplier) {
		return multiplicand * multiplier;
	};
	/**
	* Returns an number to the power of an exponent.
	*
	* @param base - The base number.
	* @param exponent - The exponent to raise the base to.
	*
	* @returns The base to the power of the exponent.
	*/
	var power = function power$1(base, exponent) {
		return Math.pow(base, exponent);
	};
	/**
	* Returns the difference between two numbers.
	*
	* @param minuend - The number to subtract from.
	* @param subtrahend - The number to subtract.
	*
	* @returns The difference of the two numbers.
	*/
	var subtract = function subtract$1(minuend, subtrahend) {
		return minuend - subtrahend;
	};
	/**
	* Return zero as a number.
	*
	* @returns Zero as a number.
	*/
	function zero() {
		return 0;
	}
	/**
	* Create a Dinero object.
	*
	* @param options.amount - The amount in minor currency units.
	* @param options.currency - The currency.
	* @param options.scale - The number of decimal places to represent.
	*
	* @returns The created Dinero object.
	*
	* @public
	*/
	var dinero$1 = createDinero({
		calculator: {
			add,
			compare,
			decrement,
			increment,
			integerDivide,
			modulo,
			multiply,
			power,
			subtract,
			zero
		},
		onCreate: function onCreate(_ref) {
			var amount = _ref.amount, scale = _ref.scale;
			assert(Number.isInteger(amount), INVALID_AMOUNT_MESSAGE);
			assert(Number.isInteger(scale), INVALID_SCALE_MESSAGE);
		}
	});
}) });

//#endregion
//#region ../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.js
var require_cjs = /* @__PURE__ */ __commonJS({ "../../node_modules/.bun/dinero.js@2.0.0-alpha.14/node_modules/dinero.js/dist/cjs/index.js": ((exports, module) => {
	if (process.env.NODE_ENV === "production") module.exports = require_index_production();
	else module.exports = require_index_development();
}) });

//#endregion
//#region schema/custom-types.ts
var import_cjs = /* @__PURE__ */ __toESM(require_cjs(), 1);
/**
* Custom type for storing Dinero.js snapshots in a JSONB column.
* Stores the snapshot but returns a Dinero object when retrieved.
*/
const dineroType = customType({
	dataType: () => "jsonb",
	toDriver(value) {
		return JSON.stringify((0, import_cjs.toSnapshot)(value));
	},
	fromDriver(value) {
		const snapshot = JSON.parse(value);
		return (0, import_cjs.dinero)(snapshot);
	}
});
const ianaTimezone = customType({
	dataType() {
		return "text";
	},
	toDriver(value) {
		try {
			Intl.DateTimeFormat(void 0, { timeZone: value });
			return value;
		} catch {
			throw new Error(`Invalid IANA timezone identifier: ${value}`);
		}
	}
});

//#endregion
//#region schema/location.ts
const locationType = pgTable("location_type", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	name: t$1.text("name").notNull(),
	description: t$1.text("description")
}));
const location = pgTable("location", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	locationParentId: t$1.text("location_parent_id").references(() => location.id, { onDelete: "restrict" }),
	name: t$1.text("name").notNull(),
	handle: t$1.text("handle").notNull(),
	description: t$1.text("description"),
	locationTypeId: t$1.text("location_type_id").references(() => locationType.id, { onDelete: "restrict" }).notNull(),
	timezone: ianaTimezone("timezone").notNull(),
	...timeStamps({ softDelete: true }),
	...createdBy()
}), (t$1) => [
	unique("location_handle_org_unique").on(t$1.handle, t$1.orgId),
	index("location_location_parent_id_idx").on(t$1.locationParentId),
	index("location_location_type_id_idx").on(t$1.locationTypeId)
]);

//#endregion
//#region schema/wallet.ts
const walletTicketStyleEnum = pgEnum("wallet_ticket_style_enum", [
	"event",
	"coupon",
	"generic"
]);
const walletCert = pgTable("wallet_cert", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	certRef: t$1.text("cert_ref").notNull(),
	description: t$1.text("description"),
	isEnhanced: t$1.boolean("is_enhanced").notNull().default(false),
	teamId: t$1.text("team_id").notNull(),
	encryptedBundle: t$1.text("encrypted_bundle").notNull(),
	...timeStamps({ softDelete: true })
}), (t$1) => [
	index("idx_wallet_certs_enhanced").on(t$1.isEnhanced),
	index("idx_wallet_certs_team_id").on(t$1.teamId),
	unique("uq_wallet_cert_cert_ref").on(t$1.certRef)
]);
const walletApnsKey = pgTable("wallet_apns_key", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	keyRef: t$1.text("key_ref").notNull(),
	teamId: t$1.text("team_id").notNull(),
	isActive: t$1.boolean("is_active").notNull().default(true),
	keyId: t$1.text("key_id").notNull(),
	encryptedP8Key: t$1.text("encrypted_p8_key").notNull(),
	...timeStamps({ softDelete: true })
}), (t$1) => [
	index("idx_wallet_apns_key_team_active").on(t$1.teamId, t$1.isActive),
	uniqueIndex("uq_wallet_apns_key_team_key").on(t$1.teamId, t$1.keyId),
	uniqueIndex("uq_wallet_apns_key_key_ref").on(t$1.keyRef)
]);
const walletPassType = pgTable("wallet_pass_type", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	passTypeIdentifier: t$1.text("pass_type_identifier").notNull(),
	certRef: t$1.text("cert_ref").notNull().references(() => walletCert.certRef),
	...timeStamps({ softDelete: true })
}), (t$1) => [index("idx_wallet_pass_type_cert_ref").on(t$1.certRef), uniqueIndex("uq_wallet_pass_type_identifier").on(t$1.passTypeIdentifier)]);
const walletPass = pgTable("wallet_pass", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	passTypeIdentifier: t$1.text("pass_type_identifier").notNull(),
	serialNumber: t$1.text("serial_number").notNull(),
	eventId: t$1.text("event_id").notNull(),
	authenticationToken: t$1.text("authentication_token").notNull(),
	ticketStyle: walletTicketStyleEnum("ticket_style"),
	poster: t$1.boolean("poster").notNull().default(false),
	etag: t$1.text("etag"),
	...timeStamps({ softDelete: true }),
	...createdBy()
}), (t$1) => [
	index("idx_wallet_pass_updated_at").on(t$1.updatedAt),
	index("idx_wallet_pass_auth_token").on(t$1.authenticationToken),
	index("idx_wallet_pass_event_id").on(t$1.eventId),
	uniqueIndex("uq_wallet_pass_type_serial").on(t$1.passTypeIdentifier, t$1.serialNumber)
]);
const walletDevice = pgTable("wallet_device", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	deviceLibraryIdentifier: t$1.text("device_library_identifier").notNull(),
	pushToken: t$1.text("push_token").notNull(),
	...timeStamps({ softDelete: true })
}), (t$1) => [unique("uq_wallet_device_library_identifier").on(t$1.deviceLibraryIdentifier)]);
const walletRegistration = pgTable("wallet_registration", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	passId: t$1.text("pass_id").notNull().references(() => walletPass.id, {
		onDelete: "cascade",
		onUpdate: "cascade"
	}),
	deviceLibraryIdentifier: t$1.text("device_library_identifier").notNull().references(() => walletDevice.deviceLibraryIdentifier),
	passTypeIdentifier: t$1.text("pass_type_identifier").notNull(),
	serialNumber: t$1.text("serial_number").notNull(),
	active: t$1.boolean("active").notNull().default(true),
	...timeStamps({ softDelete: true }),
	...createdBy()
}), (t$1) => [
	index("idx_wallet_registration_pass_ref").on(t$1.passTypeIdentifier, t$1.serialNumber),
	index("idx_wallet_registration_device_active").on(t$1.deviceLibraryIdentifier, t$1.active),
	uniqueIndex("uq_wallet_registration_device_pass").on(t$1.deviceLibraryIdentifier, t$1.passId),
	index("wallet_registration_pass_id_idx").on(t$1.passId)
]);
const walletPassContent = pgTable("wallet_pass_content", (t$1) => ({
	id: t$1.text("id").primaryKey().default(sql`nanoid()`),
	passId: t$1.text("pass_id").notNull().references(() => walletPass.id, {
		onDelete: "cascade",
		onUpdate: "cascade"
	}),
	data: t$1.jsonb("data").notNull(),
	...timeStamps({ softDelete: true }),
	...createdBy()
}), (t$1) => [uniqueIndex("uq_wallet_pass_content_pass_id").on(t$1.passId)]);

//#endregion
//#region schema/index.ts
const schema = {
	user,
	session,
	account,
	verification,
	organization,
	member,
	invitation,
	jwks,
	currency,
	region,
	regionCountry,
	locationType,
	address,
	location,
	walletTicketStyleEnum,
	walletCert,
	walletApnsKey,
	walletPassType,
	walletPass,
	walletDevice,
	walletRegistration,
	walletPassContent
};

//#endregion
export { Column$1 as Column, IsAlias, OriginalName, Param, PgArray, PgColumn, PgDate, PgDateString, PgJson, PgJsonb, PgNumeric, PgTable, PgTime, PgTimestamp, PgTimestampString, PgUUID, Placeholder, SQL$1 as SQL, StringChunk, Subquery, Table, TableColumns, TableSchema, View, ViewBaseConfig, WithSubquery, __export, __toESM, account, actorTypeEnum, address, applyMixins, createdBy, createdByCheck, currency, dineroType, entityKind, fillPlaceholders, getTableColumns$1 as getTableColumns, getTableLikeName, getTableName, getTableUniqueName, haveSameKeys, ianaTimezone, invitation, is$1 as is, isConfig, isDriverValueEncoder, isSQLWrapper, jwks, location, locationType, mapResultRow, mapUpdateSet, member, orderSelectedFields, organization, region, regionCountry, require_cjs, schema, session, sql$1 as sql, timeStamps, tracer, user, verification, walletApnsKey, walletCert, walletDevice, walletPass, walletPassContent, walletPassType, walletRegistration, walletTicketStyleEnum };