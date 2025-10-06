import { Column as Column$1, IsAlias, OriginalName, Param, PgArray, PgColumn, PgDate, PgDateString, PgJson, PgJsonb, PgNumeric, PgTable, PgTime, PgTimestamp, PgTimestampString, PgUUID, Placeholder, SQL as SQL$1, StringChunk, Subquery, Table, TableColumns, TableSchema, View, ViewBaseConfig, WithSubquery, address, applyMixins, currency, entityKind, fillPlaceholders, getTableColumns as getTableColumns$1, getTableLikeName, getTableName, getTableUniqueName, haveSameKeys, is as is$1, isConfig, isDriverValueEncoder, isSQLWrapper, location, locationType, mapResultRow, mapUpdateSet, orderSelectedFields, organization, region, regionCountry, schema, sql as sql$1, tracer, walletApnsKey, walletCert, walletDevice, walletPass, walletPassContent, walletPassType, walletRegistration } from "../schema-UopNa74q.js";
import { defineRelations } from "drizzle-orm";
import { Pool, neonConfig, types } from "@neondatabase/serverless";
import { WebSocket } from "ws";

//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
	constructor(table) {
		this.table = table;
	}
	static [entityKind] = "ColumnAliasProxyHandler";
	get(columnObj, prop) {
		if (prop === "table") return this.table;
		return columnObj[prop];
	}
};
var TableAliasProxyHandler = class {
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
		if (is$1(value, Column$1)) return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
		return value;
	}
};
var RelationTableAliasProxyHandler = class {
	constructor(alias) {
		this.alias = alias;
	}
	static [entityKind] = "RelationTableAliasProxyHandler";
	get(target, prop) {
		if (prop === "sourceTable") return aliasedTable(target.sourceTable, this.alias);
		return target[prop];
	}
};
function aliasedTable(table, tableAlias) {
	return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
	return new Proxy(column, new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false))));
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
	return new SQL$1.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
	return sql$1.join(query.queryChunks.map((c) => {
		if (is$1(c, Column$1)) return aliasedTableColumn(c, alias);
		if (is$1(c, SQL$1)) return mapColumnsInSQLToAlias(c, alias);
		if (is$1(c, SQL$1.Aliased)) return mapColumnsInAliasedSQLToAlias(c, alias);
		return c;
	}));
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
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

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class SelectionProxyHandler {
	static [entityKind] = "SelectionProxyHandler";
	config;
	constructor(config) {
		this.config = { ...config };
	}
	get(subquery, prop) {
		if (prop === "_") return {
			...subquery["_"],
			selectedFields: new Proxy(subquery._.selectedFields, this)
		};
		if (prop === ViewBaseConfig) return {
			...subquery[ViewBaseConfig],
			selectedFields: new Proxy(subquery[ViewBaseConfig].selectedFields, this)
		};
		if (typeof prop === "symbol") return subquery[prop];
		const value = (is$1(subquery, Subquery) ? subquery._.selectedFields : is$1(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery)[prop];
		if (is$1(value, SQL$1.Aliased)) {
			if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) return value.sql;
			const newValue = value.clone();
			newValue.isSelectionField = true;
			return newValue;
		}
		if (is$1(value, SQL$1)) {
			if (this.config.sqlBehavior === "sql") return value;
			throw new Error(`You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`);
		}
		if (is$1(value, Column$1)) {
			if (this.config.alias) return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(value.table, new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false))));
			return value;
		}
		if (typeof value !== "object" || value === null) return value;
		return new Proxy(value, new SelectionProxyHandler(this.config));
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
	static [entityKind] = "PgPrimaryKeyBuilder";
	/** @internal */
	columns;
	/** @internal */
	name;
	constructor(columns, name) {
		this.columns = columns;
		this.name = name;
	}
	/** @internal */
	build(table) {
		return new PrimaryKey(table, this.columns, this.name);
	}
};
var PrimaryKey = class {
	constructor(table, columns, name) {
		this.table = table;
		this.columns = columns;
		this.name = name;
	}
	static [entityKind] = "PgPrimaryKey";
	columns;
	name;
	getName() {
		return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
	if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is$1(value, Param) && !is$1(value, Placeholder) && !is$1(value, Column$1) && !is$1(value, Table) && !is$1(value, View)) return new Param(value, column);
	return value;
}
const eq = (left, right) => {
	return sql$1`${left} = ${bindIfParam(right, left)}`;
};
const ne = (left, right) => {
	return sql$1`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
	const conditions = unfilteredConditions.filter((c) => c !== void 0);
	if (conditions.length === 0) return;
	if (conditions.length === 1) return new SQL$1(conditions);
	return new SQL$1([
		new StringChunk("("),
		sql$1.join(conditions, new StringChunk(" and ")),
		new StringChunk(")")
	]);
}
function or(...unfilteredConditions) {
	const conditions = unfilteredConditions.filter((c) => c !== void 0);
	if (conditions.length === 0) return;
	if (conditions.length === 1) return new SQL$1(conditions);
	return new SQL$1([
		new StringChunk("("),
		sql$1.join(conditions, new StringChunk(" or ")),
		new StringChunk(")")
	]);
}
function not(condition) {
	return sql$1`not ${condition}`;
}
const gt = (left, right) => {
	return sql$1`${left} > ${bindIfParam(right, left)}`;
};
const gte = (left, right) => {
	return sql$1`${left} >= ${bindIfParam(right, left)}`;
};
const lt = (left, right) => {
	return sql$1`${left} < ${bindIfParam(right, left)}`;
};
const lte = (left, right) => {
	return sql$1`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) return sql$1`false`;
		return sql$1`${column} in ${values.map((v) => bindIfParam(v, column))}`;
	}
	return sql$1`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) return sql$1`true`;
		return sql$1`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
	}
	return sql$1`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
	return sql$1`${value} is null`;
}
function isNotNull(value) {
	return sql$1`${value} is not null`;
}
function exists(subquery) {
	return sql$1`exists ${subquery}`;
}
function notExists(subquery) {
	return sql$1`not exists ${subquery}`;
}
function between(column, min, max) {
	return sql$1`${column} between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
function notBetween(column, min, max) {
	return sql$1`${column} not between ${bindIfParam(min, column)} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
	return sql$1`${column} like ${value}`;
}
function notLike(column, value) {
	return sql$1`${column} not like ${value}`;
}
function ilike(column, value) {
	return sql$1`${column} ilike ${value}`;
}
function notIlike(column, value) {
	return sql$1`${column} not ilike ${value}`;
}
function arrayContains(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayContains requires at least one value");
		const array = sql$1`${bindIfParam(values, column)}`;
		return sql$1`${column} @> ${array}`;
	}
	return sql$1`${column} @> ${bindIfParam(values, column)}`;
}
function arrayContained(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayContained requires at least one value");
		const array = sql$1`${bindIfParam(values, column)}`;
		return sql$1`${column} <@ ${array}`;
	}
	return sql$1`${column} <@ ${bindIfParam(values, column)}`;
}
function arrayOverlaps(column, values) {
	if (Array.isArray(values)) {
		if (values.length === 0) throw new Error("arrayOverlaps requires at least one value");
		const array = sql$1`${bindIfParam(values, column)}`;
		return sql$1`${column} && ${array}`;
	}
	return sql$1`${column} && ${bindIfParam(values, column)}`;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
	return sql$1`${column} asc`;
}
function desc(column) {
	return sql$1`${column} desc`;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/_relations.js
var Relation$1 = class {
	constructor(sourceTable, referencedTable, relationName) {
		this.sourceTable = sourceTable;
		this.referencedTable = referencedTable;
		this.relationName = relationName;
		this.referencedTableName = referencedTable[Table.Symbol.Name];
	}
	static [entityKind] = "Relation";
	referencedTableName;
	fieldName;
};
var Relations = class {
	constructor(table, config) {
		this.table = table;
		this.config = config;
	}
	static [entityKind] = "Relations";
};
var One$1 = class One$1 extends Relation$1 {
	constructor(sourceTable, referencedTable, config, isNullable) {
		super(sourceTable, referencedTable, config?.relationName);
		this.config = config;
		this.isNullable = isNullable;
	}
	static [entityKind] = "One";
	withFieldName(fieldName) {
		const relation = new One$1(this.sourceTable, this.referencedTable, this.config, this.isNullable);
		relation.fieldName = fieldName;
		return relation;
	}
};
var Many$1 = class Many$1 extends Relation$1 {
	constructor(sourceTable, referencedTable, config) {
		super(sourceTable, referencedTable, config?.relationName);
		this.config = config;
	}
	static [entityKind] = "Many";
	withFieldName(fieldName) {
		const relation = new Many$1(this.sourceTable, this.referencedTable, this.config);
		relation.fieldName = fieldName;
		return relation;
	}
};
function getOperators() {
	return {
		and,
		between,
		eq,
		exists,
		gt,
		gte,
		ilike,
		inArray,
		isNull,
		isNotNull,
		like,
		lt,
		lte,
		ne,
		not,
		notBetween,
		notExists,
		notLike,
		notIlike,
		notInArray,
		or,
		sql: sql$1
	};
}
function getOrderByOperators() {
	return {
		sql: sql$1,
		asc,
		desc
	};
}
function extractTablesRelationalConfig(schema$1, configHelpers) {
	if (Object.keys(schema$1).length === 1 && "default" in schema$1 && !is$1(schema$1["default"], Table)) schema$1 = schema$1["default"];
	const tableNamesMap = {};
	const relationsBuffer = {};
	const tablesConfig = {};
	for (const [key, value] of Object.entries(schema$1)) if (is$1(value, Table)) {
		const dbName = getTableUniqueName(value);
		const bufferedRelations = relationsBuffer[dbName];
		tableNamesMap[dbName] = key;
		tablesConfig[key] = {
			tsName: key,
			dbName: value[Table.Symbol.Name],
			schema: value[Table.Symbol.Schema],
			columns: value[Table.Symbol.Columns],
			relations: bufferedRelations?.relations ?? {},
			primaryKey: bufferedRelations?.primaryKey ?? []
		};
		for (const column of Object.values(value[Table.Symbol.Columns])) if (column.primary) tablesConfig[key].primaryKey.push(column);
		const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
		if (extraConfig) {
			for (const configEntry of Object.values(extraConfig)) if (is$1(configEntry, PrimaryKeyBuilder)) tablesConfig[key].primaryKey.push(...configEntry.columns);
		}
	} else if (is$1(value, Relations)) {
		const dbName = getTableUniqueName(value.table);
		const tableName = tableNamesMap[dbName];
		const relations2 = value.config(configHelpers(value.table));
		let primaryKey;
		for (const [relationName, relation] of Object.entries(relations2)) if (tableName) {
			const tableConfig = tablesConfig[tableName];
			tableConfig.relations[relationName] = relation;
		} else {
			if (!(dbName in relationsBuffer)) relationsBuffer[dbName] = {
				relations: {},
				primaryKey
			};
			relationsBuffer[dbName].relations[relationName] = relation;
		}
	}
	return {
		tables: tablesConfig,
		tableNamesMap
	};
}
function createOne(sourceTable) {
	return function one(table, config) {
		return new One$1(sourceTable, table, config, config?.fields.reduce((res, f) => res && f.notNull, true) ?? false);
	};
}
function createMany(sourceTable) {
	return function many(referencedTable, config) {
		return new Many$1(sourceTable, referencedTable, config);
	};
}
function normalizeRelation(schema$1, tableNamesMap, relation) {
	if (is$1(relation, One$1) && relation.config) return {
		fields: relation.config.fields,
		references: relation.config.references
	};
	const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
	if (!referencedTableTsName) throw new Error(`Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`);
	const referencedTableConfig = schema$1[referencedTableTsName];
	if (!referencedTableConfig) throw new Error(`Table "${referencedTableTsName}" not found in schema`);
	const sourceTable = relation.sourceTable;
	const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
	if (!sourceTableTsName) throw new Error(`Table "${sourceTable[Table.Symbol.Name]}" not found in schema`);
	const reverseRelations = [];
	for (const referencedTableRelation of Object.values(referencedTableConfig.relations)) if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) reverseRelations.push(referencedTableRelation);
	if (reverseRelations.length > 1) throw relation.relationName ? /* @__PURE__ */ new Error(`There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`) : /* @__PURE__ */ new Error(`There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`);
	if (reverseRelations[0] && is$1(reverseRelations[0], One$1) && reverseRelations[0].config) return {
		fields: reverseRelations[0].config.references,
		references: reverseRelations[0].config.fields
	};
	throw new Error(`There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`);
}
function createTableRelationsHelpers(sourceTable) {
	return {
		one: createOne(sourceTable),
		many: createMany(sourceTable)
	};
}
function mapRelationalRow$1(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
	const result = {};
	for (const [selectionItemIndex, selectionItem] of buildQueryResultSelection.entries()) if (selectionItem.isJson) {
		const relation = tableConfig.relations[selectionItem.tsKey];
		const rawSubRows = row[selectionItemIndex];
		const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
		result[selectionItem.tsKey] = is$1(relation, One$1) ? subRows && mapRelationalRow$1(tablesConfig, tablesConfig[selectionItem.relationTableTsKey], subRows, selectionItem.selection, mapColumnValue) : subRows.map((subRow) => mapRelationalRow$1(tablesConfig, tablesConfig[selectionItem.relationTableTsKey], subRow, selectionItem.selection, mapColumnValue));
	} else {
		const value = mapColumnValue(row[selectionItemIndex]);
		const field = selectionItem.field;
		let decoder;
		if (is$1(field, Column$1)) decoder = field;
		else if (is$1(field, SQL$1)) decoder = field.decoder;
		else decoder = field.sql.decoder;
		result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
	}
	return result;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
	return (input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? []).map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
	return (input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? []).reduce((acc, word, i) => {
		const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
		return acc + formattedWord;
	}, "");
}
function noopCase(input) {
	return input;
}
var CasingCache = class {
	static [entityKind] = "CasingCache";
	/** @internal */
	cache = {};
	cachedTables = {};
	convert;
	constructor(casing) {
		this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
	}
	getColumnCasing(column) {
		if (!column.keyAsName) return column.name;
		const schema$1 = column.table[Table.Symbol.Schema] ?? "public";
		const tableName = column.table[Table.Symbol.OriginalName];
		const key = `${schema$1}.${tableName}.${column.name}`;
		if (!this.cache[key]) this.cacheTable(column.table);
		return this.cache[key];
	}
	cacheTable(table) {
		const schema$1 = table[Table.Symbol.Schema] ?? "public";
		const tableName = table[Table.Symbol.OriginalName];
		const tableKey = `${schema$1}.${tableName}`;
		if (!this.cachedTables[tableKey]) {
			for (const column of Object.values(table[Table.Symbol.Columns])) {
				if (!is$1(column, Column$1)) continue;
				const columnKey = `${tableKey}.${column.name}`;
				this.cache[columnKey] = this.convert(column.name);
			}
			this.cachedTables[tableKey] = true;
		}
	}
	clearCache() {
		this.cache = {};
		this.cachedTables = {};
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
	static [entityKind] = "DrizzleError";
	constructor({ message, cause }) {
		super(message);
		this.name = "DrizzleError";
		this.cause = cause;
	}
};
var DrizzleQueryError = class DrizzleQueryError extends Error {
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
var TransactionRollbackError = class extends DrizzleError {
	static [entityKind] = "TransactionRollbackError";
	constructor() {
		super({ message: "Rollback" });
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/relations.js
var Relation = class {
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
var One = class extends Relation {
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
var Many = class extends Relation {
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
var AggregatedField = class {
	static [entityKind] = "AggregatedField";
	table;
	onTable(table) {
		this.table = table;
		return this;
	}
};
var Count = class extends AggregatedField {
	static [entityKind] = "AggregatedFieldCount";
	query;
	getSQL() {
		if (!this.query) {
			if (!this.table) throw new Error("Table must be set before building aggregate field");
			this.query = sql$1`select count(*) as ${sql$1.identifier("r")} from ${getTableAsAliasSQL(this.table)}`.mapWith(Number);
		}
		return this.query;
	}
};
const operators = {
	and,
	between,
	eq,
	exists,
	gt,
	gte,
	ilike,
	inArray,
	arrayContains,
	arrayContained,
	arrayOverlaps,
	isNull,
	isNotNull,
	like,
	lt,
	lte,
	ne,
	not,
	notBetween,
	notExists,
	notLike,
	notIlike,
	notInArray,
	or,
	sql: sql$1
};
const orderByOperators = {
	sql: sql$1,
	asc,
	desc
};
function mapRelationalRow(row, buildQueryResultSelection, mapColumnValue = (value) => value, parseJson = false, parseJsonIfString = false, path) {
	for (const selectionItem of buildQueryResultSelection) {
		if (selectionItem.selection) {
			const currentPath = `${path ? `${path}.` : ""}${selectionItem.key}`;
			if (row[selectionItem.key] === null) continue;
			if (parseJson) row[selectionItem.key] = JSON.parse(row[selectionItem.key]);
			if (parseJsonIfString && typeof row[selectionItem.key] === "string") row[selectionItem.key] = JSON.parse(row[selectionItem.key]);
			if (selectionItem.isArray) {
				for (const item of row[selectionItem.key]) mapRelationalRow(item, selectionItem.selection, mapColumnValue, false, parseJsonIfString, currentPath);
				continue;
			}
			mapRelationalRow(row[selectionItem.key], selectionItem.selection, mapColumnValue, false, parseJsonIfString, currentPath);
			continue;
		}
		const field = selectionItem.field;
		const value = mapColumnValue(row[selectionItem.key]);
		if (value === null) continue;
		let decoder;
		if (is$1(field, Column$1)) decoder = field;
		else if (is$1(field, SQL$1)) decoder = field.decoder;
		else if (is$1(field, SQL$1.Aliased)) decoder = field.sql.decoder;
		else decoder = field.getSQL().decoder;
		row[selectionItem.key] = "mapFromJsonValue" in decoder ? decoder.mapFromJsonValue(value) : decoder.mapFromDriverValue(value);
	}
	return row;
}
var RelationsBuilderTable = class {
	static [entityKind] = "RelationsBuilderTable";
	_;
	constructor(table, name) {
		this._ = {
			name,
			table
		};
	}
};
var RelationsBuilderColumn = class {
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
var RelationsBuilderJunctionColumn = class {
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
var RelationsHelperStatic = class {
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
function fieldSelectionToSQL(table, target) {
	const field = table[TableColumns][target];
	return field ? is$1(field, Column$1) ? field : is$1(field, SQL$1.Aliased) ? sql$1`${table}.${sql$1.identifier(field.fieldAlias)}` : sql$1`${table}.${sql$1.identifier(target)}` : sql$1`${table}.${sql$1.identifier(target)}`;
}
function relationsFieldFilterToSQL(column, filter) {
	if (typeof filter !== "object" || is$1(filter, Placeholder)) return eq(column, filter);
	const entries = Object.entries(filter);
	if (!entries.length) return void 0;
	const parts = [];
	for (const [target, value] of entries) {
		if (value === void 0) continue;
		switch (target) {
			case "NOT": {
				const res = relationsFieldFilterToSQL(column, value);
				if (!res) continue;
				parts.push(not(res));
				continue;
			}
			case "OR":
				if (!value.length) continue;
				parts.push(or(...value.map((subFilter) => relationsFieldFilterToSQL(column, subFilter))));
				continue;
			case "AND":
				if (!value.length) continue;
				parts.push(and(...value.map((subFilter) => relationsFieldFilterToSQL(column, subFilter))));
				continue;
			case "isNotNull":
			case "isNull":
				if (!value) continue;
				parts.push(operators[target](column));
				continue;
			case "in":
				parts.push(operators.inArray(column, value));
				continue;
			case "notIn":
				parts.push(operators.notInArray(column, value));
				continue;
			default:
				parts.push(operators[target](column, value));
				continue;
		}
	}
	if (!parts.length) return void 0;
	return and(...parts);
}
function relationsFilterToSQL(table, filter, tableRelations = {}, tablesRelations = {}, casing, depth = 0) {
	const entries = Object.entries(filter);
	if (!entries.length) return void 0;
	const parts = [];
	for (const [target, value] of entries) {
		if (value === void 0) continue;
		switch (target) {
			case "RAW": {
				const processed = typeof value === "function" ? value(table, operators) : value.getSQL();
				parts.push(processed);
				continue;
			}
			case "OR":
				if (!value?.length) continue;
				parts.push(or(...value.map((subFilter) => relationsFilterToSQL(table, subFilter, tableRelations, tablesRelations, casing, depth))));
				continue;
			case "AND":
				if (!value?.length) continue;
				parts.push(and(...value.map((subFilter) => relationsFilterToSQL(table, subFilter, tableRelations, tablesRelations, casing, depth))));
				continue;
			case "NOT": {
				if (value === void 0) continue;
				const built = relationsFilterToSQL(table, value, tableRelations, tablesRelations, casing, depth);
				if (!built) continue;
				parts.push(not(built));
				continue;
			}
			default: {
				if (table[TableColumns][target]) {
					const column = fieldSelectionToSQL(table, target);
					const colFilter = relationsFieldFilterToSQL(column, value);
					if (colFilter) parts.push(colFilter);
					continue;
				}
				const relation = tableRelations[target];
				if (!relation) throw new DrizzleError({ message: `Unknown relational filter field: "${target}"` });
				const targetTable = aliasedTable(relation.targetTable, `f${depth}`);
				const throughTable = relation.throughTable ? aliasedTable(relation.throughTable, `ft${depth}`) : void 0;
				const targetConfig = tablesRelations[relation.targetTableName];
				const { filter: relationFilter, joinCondition } = relationToSQL(casing, relation, table, targetTable, throughTable);
				const subfilter = typeof value === "boolean" ? void 0 : relationsFilterToSQL(targetTable, value, targetConfig.relations, tablesRelations, casing, depth + 1);
				const filter2 = and(relationFilter, subfilter);
				const subquery = throughTable ? sql$1`(select * from ${getTableAsAliasSQL(targetTable)} inner join ${getTableAsAliasSQL(throughTable)} on ${joinCondition}${sql$1` where ${filter2}`.if(filter2)} limit 1)` : sql$1`(select * from ${getTableAsAliasSQL(targetTable)}${sql$1` where ${filter2}`.if(filter2)} limit 1)`;
				if (filter2) parts.push((value ? exists : notExists)(subquery));
			}
		}
	}
	return and(...parts);
}
function relationsOrderToSQL(table, orders) {
	if (typeof orders === "function") {
		const data = orders(table, orderByOperators);
		return is$1(data, SQL$1) ? data : Array.isArray(data) ? data.length ? sql$1.join(data.map((o) => is$1(o, SQL$1) ? o : asc(o)), sql$1`, `) : void 0 : is$1(data, Column$1) ? asc(data) : void 0;
	}
	const entries = Object.entries(orders).filter(([_, value]) => value);
	if (!entries.length) return void 0;
	return sql$1.join(entries.map(([target, value]) => (value === "asc" ? asc : desc)(fieldSelectionToSQL(table, target))), sql$1`, `);
}
function relationExtrasToSQL(table, extras) {
	const subqueries = [];
	const selection = [];
	for (const [key, field] of Object.entries(extras)) {
		if (!field) continue;
		const extra = typeof field === "function" ? field(table, { sql: operators.sql }) : field;
		const query = sql$1`(${extra.getSQL()}) as ${sql$1.identifier(key)}`;
		query.decoder = extra.getSQL().decoder;
		subqueries.push(query);
		selection.push({
			key,
			field: query
		});
	}
	return {
		sql: subqueries.length ? sql$1.join(subqueries, sql$1`, `) : void 0,
		selection
	};
}
function relationToSQL(casing, relation, sourceTable, targetTable, throughTable) {
	if (relation.through) {
		const outerColumnWhere = relation.sourceColumns.map((s, i) => {
			const t = relation.through.source[i];
			return eq(sql$1`${sourceTable}.${sql$1.identifier(casing.getColumnCasing(s))}`, sql$1`${throughTable}.${sql$1.identifier(is$1(t._.column, Column$1) ? casing.getColumnCasing(t._.column) : t._.key)}`);
		});
		const innerColumnWhere = relation.targetColumns.map((s, i) => {
			const t = relation.through.target[i];
			return eq(sql$1`${throughTable}.${sql$1.identifier(is$1(t._.column, Column$1) ? casing.getColumnCasing(t._.column) : t._.key)}`, sql$1`${targetTable}.${sql$1.identifier(casing.getColumnCasing(s))}`);
		});
		return {
			filter: and(relation.where ? relationsFilterToSQL(relation.isReversed ? sourceTable : targetTable, relation.where) : void 0, ...outerColumnWhere),
			joinCondition: and(...innerColumnWhere)
		};
	}
	const columnWhere = relation.sourceColumns.map((s, i) => {
		const t = relation.targetColumns[i];
		return eq(sql$1`${sourceTable}.${sql$1.identifier(casing.getColumnCasing(s))}`, sql$1`${targetTable}.${sql$1.identifier(casing.getColumnCasing(t))}`);
	});
	return { filter: and(...columnWhere, relation.where ? relationsFilterToSQL(relation.isReversed ? sourceTable : targetTable, relation.where) : void 0) };
}
function getTableAsAliasSQL(table) {
	return sql$1`${table[IsAlias] ? sql$1`${sql$1`${sql$1.identifier(table[TableSchema] ?? "")}.`.if(table[TableSchema])}${sql$1.identifier(table[OriginalName])} as ${table}` : table}`;
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
	static [entityKind] = "PgViewBase";
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
	static [entityKind] = "PgDialect";
	/** @internal */
	casing;
	constructor(config) {
		this.casing = new CasingCache(config?.casing);
	}
	async migrate(migrations, session, config) {
		const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
		const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
		const migrationTableCreate = sql$1`
			CREATE TABLE IF NOT EXISTS ${sql$1.identifier(migrationsSchema)}.${sql$1.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
		await session.execute(sql$1`CREATE SCHEMA IF NOT EXISTS ${sql$1.identifier(migrationsSchema)}`);
		await session.execute(migrationTableCreate);
		const lastDbMigration = (await session.all(sql$1`select id, hash, created_at from ${sql$1.identifier(migrationsSchema)}.${sql$1.identifier(migrationsTable)} order by created_at desc limit 1`))[0];
		await session.transaction(async (tx) => {
			for await (const migration of migrations) if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
				for (const stmt of migration.sql) await tx.execute(sql$1.raw(stmt));
				await tx.execute(sql$1`insert into ${sql$1.identifier(migrationsSchema)}.${sql$1.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`);
			}
		});
	}
	escapeName(name) {
		return `"${name}"`;
	}
	escapeParam(num) {
		return `$${num + 1}`;
	}
	escapeString(str) {
		return `'${str.replace(/'/g, "''")}'`;
	}
	buildWithCTE(queries) {
		if (!queries?.length) return void 0;
		const withSqlChunks = [sql$1`with `];
		for (const [i, w] of queries.entries()) {
			withSqlChunks.push(sql$1`${sql$1.identifier(w._.alias)} as (${w._.sql})`);
			if (i < queries.length - 1) withSqlChunks.push(sql$1`, `);
		}
		withSqlChunks.push(sql$1` `);
		return sql$1.join(withSqlChunks);
	}
	buildDeleteQuery({ table, where, returning, withList }) {
		const withSql = this.buildWithCTE(withList);
		const returningSql = returning ? sql$1` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
		const whereSql = where ? sql$1` where ${where}` : void 0;
		return sql$1`${withSql}delete from ${table}${whereSql}${returningSql}`;
	}
	buildUpdateSet(table, set) {
		const tableColumns = table[Table.Symbol.Columns];
		const columnNames = Object.keys(tableColumns).filter((colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0);
		const setLength = columnNames.length;
		return sql$1.join(columnNames.flatMap((colName, i) => {
			const col = tableColumns[colName];
			const value = set[colName] ?? sql$1.param(col.onUpdateFn(), col);
			const res = sql$1`${sql$1.identifier(this.casing.getColumnCasing(col))} = ${value}`;
			if (i < setLength - 1) return [res, sql$1.raw(", ")];
			return [res];
		}));
	}
	buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
		const withSql = this.buildWithCTE(withList);
		const tableName = table[PgTable.Symbol.Name];
		const tableSchema = table[PgTable.Symbol.Schema];
		const origTableName = table[PgTable.Symbol.OriginalName];
		const alias = tableName === origTableName ? void 0 : tableName;
		const tableSql = sql$1`${tableSchema ? sql$1`${sql$1.identifier(tableSchema)}.` : void 0}${sql$1.identifier(origTableName)}${alias && sql$1` ${sql$1.identifier(alias)}`}`;
		const setSql = this.buildUpdateSet(table, set);
		const fromSql = from && sql$1.join([sql$1.raw(" from "), this.buildFromTable(from)]);
		const joinsSql = this.buildJoins(joins);
		const returningSql = returning ? sql$1` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
		const whereSql = where ? sql$1` where ${where}` : void 0;
		return sql$1`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
	}
	/**
	* Builds selection SQL with provided fields/expressions
	*
	* Examples:
	*
	* `select <selection> from`
	*
	* `insert ... returning <selection>`
	*
	* If `isSingleTable` is true, then columns won't be prefixed with table name
	*/
	buildSelection(fields, { isSingleTable = false } = {}) {
		const columnsLen = fields.length;
		const chunks = fields.flatMap(({ field }, i) => {
			const chunk = [];
			if (is$1(field, SQL$1.Aliased) && field.isSelectionField) chunk.push(sql$1.identifier(field.fieldAlias));
			else if (is$1(field, SQL$1.Aliased) || is$1(field, SQL$1)) {
				const query = is$1(field, SQL$1.Aliased) ? field.sql : field;
				if (isSingleTable) chunk.push(new SQL$1(query.queryChunks.map((c) => {
					if (is$1(c, PgColumn)) return sql$1.identifier(this.casing.getColumnCasing(c));
					return c;
				})));
				else chunk.push(query);
				if (is$1(field, SQL$1.Aliased)) chunk.push(sql$1` as ${sql$1.identifier(field.fieldAlias)}`);
			} else if (is$1(field, Column$1)) if (isSingleTable) chunk.push(sql$1.identifier(this.casing.getColumnCasing(field)));
			else chunk.push(field);
			if (i < columnsLen - 1) chunk.push(sql$1`, `);
			return chunk;
		});
		return sql$1.join(chunks);
	}
	buildJoins(joins) {
		if (!joins || joins.length === 0) return;
		const joinsArray = [];
		for (const [index, joinMeta] of joins.entries()) {
			if (index === 0) joinsArray.push(sql$1` `);
			const table = joinMeta.table;
			const lateralSql = joinMeta.lateral ? sql$1` lateral` : void 0;
			const onSql = joinMeta.on ? sql$1` on ${joinMeta.on}` : void 0;
			if (is$1(table, PgTable)) {
				const tableName = table[PgTable.Symbol.Name];
				const tableSchema = table[PgTable.Symbol.Schema];
				const origTableName = table[PgTable.Symbol.OriginalName];
				const alias = tableName === origTableName ? void 0 : joinMeta.alias;
				joinsArray.push(sql$1`${sql$1.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql$1`${sql$1.identifier(tableSchema)}.` : void 0}${sql$1.identifier(origTableName)}${alias && sql$1` ${sql$1.identifier(alias)}`}${onSql}`);
			} else if (is$1(table, View)) {
				const viewName = table[ViewBaseConfig].name;
				const viewSchema = table[ViewBaseConfig].schema;
				const origViewName = table[ViewBaseConfig].originalName;
				const alias = viewName === origViewName ? void 0 : joinMeta.alias;
				joinsArray.push(sql$1`${sql$1.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql$1`${sql$1.identifier(viewSchema)}.` : void 0}${sql$1.identifier(origViewName)}${alias && sql$1` ${sql$1.identifier(alias)}`}${onSql}`);
			} else joinsArray.push(sql$1`${sql$1.raw(joinMeta.joinType)} join${lateralSql} ${table}${onSql}`);
			if (index < joins.length - 1) joinsArray.push(sql$1` `);
		}
		return sql$1.join(joinsArray);
	}
	buildFromTable(table) {
		if (is$1(table, Table) && table[Table.Symbol.IsAlias]) {
			let fullName = sql$1`${sql$1.identifier(table[Table.Symbol.OriginalName])}`;
			if (table[Table.Symbol.Schema]) fullName = sql$1`${sql$1.identifier(table[Table.Symbol.Schema])}.${fullName}`;
			return sql$1`${fullName} ${sql$1.identifier(table[Table.Symbol.Name])}`;
		}
		return table;
	}
	buildSelectQuery({ withList, fields, fieldsFlat, where, having, table, joins, orderBy, groupBy, limit, offset, lockingClause, distinct, setOperators }) {
		const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
		for (const f of fieldsList) if (is$1(f.field, Column$1) && getTableName(f.field.table) !== (is$1(table, Subquery) ? table._.alias : is$1(table, PgViewBase) ? table[ViewBaseConfig].name : is$1(table, SQL$1) ? void 0 : getTableName(table)) && !((table2) => joins?.some(({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])))(f.field.table)) {
			const tableName = getTableName(f.field.table);
			throw new Error(`Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`);
		}
		const isSingleTable = !joins || joins.length === 0;
		const withSql = this.buildWithCTE(withList);
		let distinctSql;
		if (distinct) distinctSql = distinct === true ? sql$1` distinct` : sql$1` distinct on (${sql$1.join(distinct.on, sql$1`, `)})`;
		const selection = this.buildSelection(fieldsList, { isSingleTable });
		const tableSql = this.buildFromTable(table);
		const joinsSql = this.buildJoins(joins);
		const whereSql = where ? sql$1` where ${where}` : void 0;
		const havingSql = having ? sql$1` having ${having}` : void 0;
		let orderBySql;
		if (orderBy && orderBy.length > 0) orderBySql = sql$1` order by ${sql$1.join(orderBy, sql$1`, `)}`;
		let groupBySql;
		if (groupBy && groupBy.length > 0) groupBySql = sql$1` group by ${sql$1.join(groupBy, sql$1`, `)}`;
		const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql$1` limit ${limit}` : void 0;
		const offsetSql = offset ? sql$1` offset ${offset}` : void 0;
		const lockingClauseSql = sql$1.empty();
		if (lockingClause) {
			const clauseSql = sql$1` for ${sql$1.raw(lockingClause.strength)}`;
			if (lockingClause.config.of) clauseSql.append(sql$1` of ${sql$1.join(Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of], sql$1`, `)}`);
			if (lockingClause.config.noWait) clauseSql.append(sql$1` nowait`);
			else if (lockingClause.config.skipLocked) clauseSql.append(sql$1` skip locked`);
			lockingClauseSql.append(clauseSql);
		}
		const finalQuery = sql$1`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
		if (setOperators.length > 0) return this.buildSetOperations(finalQuery, setOperators);
		return finalQuery;
	}
	buildSetOperations(leftSelect, setOperators) {
		const [setOperator, ...rest] = setOperators;
		if (!setOperator) throw new Error("Cannot pass undefined values to any set operator");
		if (rest.length === 0) return this.buildSetOperationQuery({
			leftSelect,
			setOperator
		});
		return this.buildSetOperations(this.buildSetOperationQuery({
			leftSelect,
			setOperator
		}), rest);
	}
	buildSetOperationQuery({ leftSelect, setOperator: { type, isAll, rightSelect, limit, orderBy, offset } }) {
		const leftChunk = sql$1`(${leftSelect.getSQL()}) `;
		const rightChunk = sql$1`(${rightSelect.getSQL()})`;
		let orderBySql;
		if (orderBy && orderBy.length > 0) {
			const orderByValues = [];
			for (const singleOrderBy of orderBy) if (is$1(singleOrderBy, PgColumn)) orderByValues.push(sql$1.identifier(singleOrderBy.name));
			else if (is$1(singleOrderBy, SQL$1)) {
				for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
					const chunk = singleOrderBy.queryChunks[i];
					if (is$1(chunk, PgColumn)) singleOrderBy.queryChunks[i] = sql$1.identifier(chunk.name);
				}
				orderByValues.push(sql$1`${singleOrderBy}`);
			} else orderByValues.push(sql$1`${singleOrderBy}`);
			orderBySql = sql$1` order by ${sql$1.join(orderByValues, sql$1`, `)} `;
		}
		const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql$1` limit ${limit}` : void 0;
		const operatorChunk = sql$1.raw(`${type} ${isAll ? "all " : ""}`);
		const offsetSql = offset ? sql$1` offset ${offset}` : void 0;
		return sql$1`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
	}
	buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
		const valuesSqlList = [];
		const columns = table[Table.Symbol.Columns];
		const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
		const insertOrder = colEntries.map(([, column]) => sql$1.identifier(this.casing.getColumnCasing(column)));
		if (select) {
			const select2 = valuesOrSelect;
			if (is$1(select2, SQL$1)) valuesSqlList.push(select2);
			else valuesSqlList.push(select2.getSQL());
		} else {
			const values = valuesOrSelect;
			valuesSqlList.push(sql$1.raw("values "));
			for (const [valueIndex, value] of values.entries()) {
				const valueList = [];
				for (const [fieldName, col] of colEntries) {
					const colValue = value[fieldName];
					if (colValue === void 0 || is$1(colValue, Param) && colValue.value === void 0) if (col.defaultFn !== void 0) {
						const defaultFnResult = col.defaultFn();
						const defaultValue = is$1(defaultFnResult, SQL$1) ? defaultFnResult : sql$1.param(defaultFnResult, col);
						valueList.push(defaultValue);
					} else if (!col.default && col.onUpdateFn !== void 0) {
						const onUpdateFnResult = col.onUpdateFn();
						const newValue = is$1(onUpdateFnResult, SQL$1) ? onUpdateFnResult : sql$1.param(onUpdateFnResult, col);
						valueList.push(newValue);
					} else valueList.push(sql$1`default`);
					else valueList.push(colValue);
				}
				valuesSqlList.push(valueList);
				if (valueIndex < values.length - 1) valuesSqlList.push(sql$1`, `);
			}
		}
		const withSql = this.buildWithCTE(withList);
		const valuesSql = sql$1.join(valuesSqlList);
		const returningSql = returning ? sql$1` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
		const onConflictSql = onConflict ? sql$1` on conflict ${onConflict}` : void 0;
		const overridingSql = overridingSystemValue_ === true ? sql$1`overriding system value ` : void 0;
		return sql$1`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
	}
	buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
		const concurrentlySql = concurrently ? sql$1` concurrently` : void 0;
		const withNoDataSql = withNoData ? sql$1` with no data` : void 0;
		return sql$1`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
	}
	prepareTyping(encoder) {
		if (is$1(encoder, PgJsonb) || is$1(encoder, PgJson)) return "json";
		else if (is$1(encoder, PgNumeric)) return "decimal";
		else if (is$1(encoder, PgTime)) return "time";
		else if (is$1(encoder, PgTimestamp) || is$1(encoder, PgTimestampString)) return "timestamp";
		else if (is$1(encoder, PgDate) || is$1(encoder, PgDateString)) return "date";
		else if (is$1(encoder, PgUUID)) return "uuid";
		else return "none";
	}
	sqlToQuery(sql2, invokeSource) {
		return sql2.toQuery({
			casing: this.casing,
			escapeName: this.escapeName,
			escapeParam: this.escapeParam,
			escapeString: this.escapeString,
			prepareTyping: this.prepareTyping,
			invokeSource
		});
	}
	/** @deprecated */
	_buildRelationalQuery({ fullSchema, schema: schema$1, tableNamesMap, table, tableConfig, queryConfig: config, tableAlias, nestedQueryRelation, joinOn }) {
		let selection = [];
		let limit, offset, orderBy = [], where;
		const joins = [];
		if (config === true) selection = Object.entries(tableConfig.columns).map(([key, value]) => ({
			dbKey: value.name,
			tsKey: key,
			field: aliasedTableColumn(value, tableAlias),
			relationTableTsKey: void 0,
			isJson: false,
			selection: []
		}));
		else {
			const aliasedColumns = Object.fromEntries(Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]));
			if (config.where) {
				const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
				where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
			}
			const fieldsSelection = [];
			let selectedColumns = [];
			if (config.columns) {
				let isIncludeMode = false;
				for (const [field, value] of Object.entries(config.columns)) {
					if (value === void 0) continue;
					if (field in tableConfig.columns) {
						if (!isIncludeMode && value === true) isIncludeMode = true;
						selectedColumns.push(field);
					}
				}
				if (selectedColumns.length > 0) selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
			} else selectedColumns = Object.keys(tableConfig.columns);
			for (const field of selectedColumns) {
				const column = tableConfig.columns[field];
				fieldsSelection.push({
					tsKey: field,
					value: column
				});
			}
			let selectedRelations = [];
			if (config.with) selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({
				tsKey,
				queryConfig,
				relation: tableConfig.relations[tsKey]
			}));
			let extras;
			if (config.extras) {
				extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql: sql$1 }) : config.extras;
				for (const [tsKey, value] of Object.entries(extras)) fieldsSelection.push({
					tsKey,
					value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
				});
			}
			for (const { tsKey, value } of fieldsSelection) selection.push({
				dbKey: is$1(value, SQL$1.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
				tsKey,
				field: is$1(value, Column$1) ? aliasedTableColumn(value, tableAlias) : value,
				relationTableTsKey: void 0,
				isJson: false,
				selection: []
			});
			let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
			if (!Array.isArray(orderByOrig)) orderByOrig = [orderByOrig];
			orderBy = orderByOrig.map((orderByValue) => {
				if (is$1(orderByValue, Column$1)) return aliasedTableColumn(orderByValue, tableAlias);
				return mapColumnsInSQLToAlias(orderByValue, tableAlias);
			});
			limit = config.limit;
			offset = config.offset;
			for (const { tsKey: selectedRelationTsKey, queryConfig: selectedRelationConfigValue, relation } of selectedRelations) {
				const normalizedRelation = normalizeRelation(schema$1, tableNamesMap, relation);
				const relationTableName = getTableUniqueName(relation.referencedTable);
				const relationTableTsName = tableNamesMap[relationTableName];
				const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
				const joinOn2 = and(...normalizedRelation.fields.map((field2, i) => eq(aliasedTableColumn(normalizedRelation.references[i], relationTableAlias), aliasedTableColumn(field2, tableAlias))));
				const builtRelation = this._buildRelationalQuery({
					fullSchema,
					schema: schema$1,
					tableNamesMap,
					table: fullSchema[relationTableTsName],
					tableConfig: schema$1[relationTableTsName],
					queryConfig: is$1(relation, One$1) ? selectedRelationConfigValue === true ? { limit: 1 } : {
						...selectedRelationConfigValue,
						limit: 1
					} : selectedRelationConfigValue,
					tableAlias: relationTableAlias,
					joinOn: joinOn2,
					nestedQueryRelation: relation
				});
				const field = sql$1`${sql$1.identifier(relationTableAlias)}.${sql$1.identifier("data")}`.as(selectedRelationTsKey);
				joins.push({
					on: sql$1`true`,
					table: new Subquery(builtRelation.sql, {}, relationTableAlias),
					alias: relationTableAlias,
					joinType: "left",
					lateral: true
				});
				selection.push({
					dbKey: selectedRelationTsKey,
					tsKey: selectedRelationTsKey,
					field,
					relationTableTsKey: relationTableTsName,
					isJson: true,
					selection: builtRelation.selection
				});
			}
		}
		if (selection.length === 0) throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
		let result;
		where = and(joinOn, where);
		if (nestedQueryRelation) {
			let field = sql$1`json_build_array(${sql$1.join(selection.map(({ field: field2, tsKey, isJson }) => isJson ? sql$1`${sql$1.identifier(`${tableAlias}_${tsKey}`)}.${sql$1.identifier("data")}` : is$1(field2, SQL$1.Aliased) ? field2.sql : field2), sql$1`, `)})`;
			if (is$1(nestedQueryRelation, Many$1)) field = sql$1`coalesce(json_agg(${field}${orderBy.length > 0 ? sql$1` order by ${sql$1.join(orderBy, sql$1`, `)}` : void 0}), '[]'::json)`;
			const nestedSelection = [{
				dbKey: "data",
				tsKey: "data",
				field: field.as("data"),
				isJson: true,
				relationTableTsKey: tableConfig.tsName,
				selection
			}];
			if (limit !== void 0 || offset !== void 0 || orderBy.length > 0) {
				result = this.buildSelectQuery({
					table: aliasedTable(table, tableAlias),
					fields: {},
					fieldsFlat: [{
						path: [],
						field: sql$1.raw("*")
					}],
					where,
					limit,
					offset,
					orderBy,
					setOperators: []
				});
				where = void 0;
				limit = void 0;
				offset = void 0;
				orderBy = [];
			} else result = aliasedTable(table, tableAlias);
			result = this.buildSelectQuery({
				table: is$1(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
				fields: {},
				fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
					path: [],
					field: is$1(field2, Column$1) ? aliasedTableColumn(field2, tableAlias) : field2
				})),
				joins,
				where,
				limit,
				offset,
				orderBy,
				setOperators: []
			});
		} else result = this.buildSelectQuery({
			table: aliasedTable(table, tableAlias),
			fields: {},
			fieldsFlat: selection.map(({ field }) => ({
				path: [],
				field: is$1(field, Column$1) ? aliasedTableColumn(field, tableAlias) : field
			})),
			joins,
			where,
			limit,
			offset,
			orderBy,
			setOperators: []
		});
		return {
			tableTsKey: tableConfig.tsName,
			sql: result,
			selection
		};
	}
	nestedSelectionerror() {
		throw new DrizzleError({ message: `Views with nested selections are not supported by the relational query builder` });
	}
	buildRqbColumn(table, column, key) {
		if (is$1(column, Column$1)) {
			const name = sql$1`${table}.${sql$1.identifier(this.casing.getColumnCasing(column))}`;
			let targetType = column.columnType;
			let col = column;
			let dimensionCnt = 0;
			while (is$1(col, PgArray)) {
				col = col.baseColumn;
				targetType = col.columnType;
				++dimensionCnt;
			}
			switch (targetType) {
				case "PgNumeric":
				case "PgNumericNumber":
				case "PgNumericBigInt":
				case "PgBigInt64":
				case "PgBigSerial64":
				case "PgTimestampString":
				case "PgGeometry":
				case "PgGeometryObject":
				case "PgBytea": {
					const arrVal = "[]".repeat(dimensionCnt);
					return sql$1`${name}::text${sql$1.raw(arrVal).if(arrVal)} as ${sql$1.identifier(key)}`;
				}
				case "PgCustomColumn": return sql$1`${col.jsonSelectIdentifier(name, sql$1, dimensionCnt > 0 ? dimensionCnt : void 0)} as ${sql$1.identifier(key)}`;
				default: return sql$1`${name} as ${sql$1.identifier(key)}`;
			}
		}
		return sql$1`${table}.${is$1(column, SQL$1.Aliased) ? sql$1.identifier(column.fieldAlias) : isSQLWrapper(column) ? sql$1.identifier(key) : this.nestedSelectionerror()} as ${sql$1.identifier(key)}`;
	}
	unwrapAllColumns = (table, selection) => {
		return sql$1.join(Object.entries(table[TableColumns]).map(([k, v]) => {
			selection.push({
				key: k,
				field: v
			});
			return this.buildRqbColumn(table, v, k);
		}), sql$1`, `);
	};
	buildColumns = (table, selection, config) => config?.columns ? (() => {
		const entries = Object.entries(config.columns);
		const columnContainer = table[TableColumns];
		const columnIdentifiers = [];
		let colSelectionMode;
		for (const [k, v] of entries) {
			if (v === void 0) continue;
			colSelectionMode = colSelectionMode || v;
			if (v) {
				const column = columnContainer[k];
				columnIdentifiers.push(this.buildRqbColumn(table, column, k));
				selection.push({
					key: k,
					field: column
				});
			}
		}
		if (colSelectionMode === false) for (const [k, v] of Object.entries(columnContainer)) {
			if (config.columns[k] === false) continue;
			columnIdentifiers.push(this.buildRqbColumn(table, v, k));
			selection.push({
				key: k,
				field: v
			});
		}
		return columnIdentifiers.length ? sql$1.join(columnIdentifiers, sql$1`, `) : void 0;
	})() : this.unwrapAllColumns(table, selection);
	buildRelationalQuery({ schema: schema$1, table, tableConfig, queryConfig: config, relationWhere, mode, errorPath, depth, throughJoin }) {
		const selection = [];
		const isSingle = mode === "first";
		const params = config === true ? void 0 : config;
		const currentPath = errorPath ?? "";
		const currentDepth = depth ?? 0;
		if (!currentDepth) table = aliasedTable(table, `d${currentDepth}`);
		const limit = isSingle ? 1 : params?.limit;
		const offset = params?.offset;
		const where = params?.where && relationWhere ? and(relationsFilterToSQL(table, params.where, tableConfig.relations, schema$1, this.casing), relationWhere) : params?.where ? relationsFilterToSQL(table, params.where, tableConfig.relations, schema$1, this.casing) : relationWhere;
		const order = params?.orderBy ? relationsOrderToSQL(table, params.orderBy) : void 0;
		const columns = this.buildColumns(table, selection, params);
		const extras = params?.extras ? relationExtrasToSQL(table, params.extras) : void 0;
		if (extras) selection.push(...extras.selection);
		const selectionArr = columns ? [columns] : [];
		const joins = params ? (() => {
			const { with: joins2 } = params;
			if (!joins2) return;
			const withEntries = Object.entries(joins2).filter(([_, v]) => v);
			if (!withEntries.length) return;
			return sql$1.join(withEntries.map(([k, join]) => {
				const relation = tableConfig.relations[k];
				const isSingle2 = is$1(relation, One);
				const targetTable = aliasedTable(relation.targetTable, `d${currentDepth + 1}`);
				const throughTable = relation.throughTable ? aliasedTable(relation.throughTable, `tr${currentDepth}`) : void 0;
				const { filter, joinCondition } = relationToSQL(this.casing, relation, table, targetTable, throughTable);
				selectionArr.push(sql$1`${sql$1.identifier(k)}.${sql$1.identifier("r")} as ${sql$1.identifier(k)}`);
				const throughJoin2 = throughTable ? sql$1` inner join ${getTableAsAliasSQL(throughTable)} on ${joinCondition}` : void 0;
				const innerQuery = this.buildRelationalQuery({
					table: targetTable,
					mode: isSingle2 ? "first" : "many",
					schema: schema$1,
					queryConfig: join,
					tableConfig: schema$1[relation.targetTableName],
					relationWhere: filter,
					errorPath: `${currentPath.length ? `${currentPath}.` : ""}${k}`,
					depth: currentDepth + 1,
					throughJoin: throughJoin2
				});
				selection.push({
					field: targetTable,
					key: k,
					selection: innerQuery.selection,
					isArray: !isSingle2,
					isOptional: (relation.optional ?? false) || join !== true && !!join.where
				});
				return sql$1`left join lateral(select ${isSingle2 ? sql$1`row_to_json(${sql$1.identifier("t")}.*) ${sql$1.identifier("r")}` : sql$1`coalesce(json_agg(row_to_json(${sql$1.identifier("t")}.*)), '[]') as ${sql$1.identifier("r")}`} from (${innerQuery.sql}) as ${sql$1.identifier("t")}) as ${sql$1.identifier(k)} on true`;
			}), sql$1` `);
		})() : void 0;
		if (extras?.sql) selectionArr.push(extras.sql);
		if (!selectionArr.length) throw new DrizzleError({ message: `No fields selected for table "${tableConfig.name}"${currentPath ? ` ("${currentPath}")` : ""}` });
		const selectionSet = sql$1.join(selectionArr.filter((e) => e !== void 0), sql$1`, `);
		return {
			sql: sql$1`select ${selectionSet} from ${getTableAsAliasSQL(table)}${throughJoin}${sql$1` ${joins}`.if(joins)}${sql$1` where ${where}`.if(where)}${sql$1` order by ${order}`.if(order)}${sql$1` limit ${limit}`.if(limit !== void 0)}${sql$1` offset ${offset}`.if(offset !== void 0)}`,
			selection
		};
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
	static [entityKind] = "TypedQueryBuilder";
	/** @internal */
	getSelectedFields() {
		return this._.selectedFields;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
	static [entityKind] = "PgSelectBuilder";
	fields;
	session;
	dialect;
	withList = [];
	distinct;
	constructor(config) {
		this.fields = config.fields;
		this.session = config.session;
		this.dialect = config.dialect;
		if (config.withList) this.withList = config.withList;
		this.distinct = config.distinct;
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	/**
	* Specify the table, subquery, or other target that you're
	* building a select query against.
	*
	* {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
	*/
	from(source) {
		const isPartialSelect = !!this.fields;
		const src = source;
		let fields;
		if (this.fields) fields = this.fields;
		else if (is$1(src, Subquery)) fields = Object.fromEntries(Object.keys(src._.selectedFields).map((key) => [key, src[key]]));
		else if (is$1(src, PgViewBase)) fields = src[ViewBaseConfig].selectedFields;
		else if (is$1(src, SQL$1)) fields = {};
		else fields = getTableColumns$1(src);
		return new PgSelectBase({
			table: src,
			fields,
			isPartialSelect,
			session: this.session,
			dialect: this.dialect,
			withList: this.withList,
			distinct: this.distinct
		}).setToken(this.authToken);
	}
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
	static [entityKind] = "PgSelectQueryBuilder";
	_;
	config;
	joinsNotNullableMap;
	tableName;
	isPartialSelect;
	session;
	dialect;
	cacheConfig = void 0;
	usedTables = /* @__PURE__ */ new Set();
	constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
		super();
		this.config = {
			withList,
			table,
			fields: { ...fields },
			distinct,
			setOperators: []
		};
		this.isPartialSelect = isPartialSelect;
		this.session = session;
		this.dialect = dialect;
		this._ = {
			selectedFields: fields,
			config: this.config
		};
		this.tableName = getTableLikeName(table);
		this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
		for (const item of extractUsedTable(table)) this.usedTables.add(item);
	}
	/** @internal */
	getUsedTables() {
		return [...this.usedTables];
	}
	createJoin(joinType, lateral) {
		return (table, on) => {
			const baseTableName = this.tableName;
			const tableName = getTableLikeName(table);
			for (const item of extractUsedTable(table)) this.usedTables.add(item);
			if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) throw new Error(`Alias "${tableName}" is already used in this query`);
			if (!this.isPartialSelect) {
				if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") this.config.fields = { [baseTableName]: this.config.fields };
				if (typeof tableName === "string" && !is$1(table, SQL$1)) {
					const selection = is$1(table, Subquery) ? table._.selectedFields : is$1(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
					this.config.fields[tableName] = selection;
				}
			}
			if (typeof on === "function") on = on(new Proxy(this.config.fields, new SelectionProxyHandler({
				sqlAliasedBehavior: "sql",
				sqlBehavior: "sql"
			})));
			if (!this.config.joins) this.config.joins = [];
			this.config.joins.push({
				on,
				table,
				joinType,
				alias: tableName,
				lateral
			});
			if (typeof tableName === "string") switch (joinType) {
				case "left":
					this.joinsNotNullableMap[tableName] = false;
					break;
				case "right":
					this.joinsNotNullableMap = Object.fromEntries(Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false]));
					this.joinsNotNullableMap[tableName] = true;
					break;
				case "cross":
				case "inner":
					this.joinsNotNullableMap[tableName] = true;
					break;
				case "full":
					this.joinsNotNullableMap = Object.fromEntries(Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false]));
					this.joinsNotNullableMap[tableName] = false;
					break;
			}
			return this;
		};
	}
	/**
	* Executes a `left join` operation by adding another table to the current query.
	*
	* Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
	*
	* @param table the table to join.
	* @param on the `on` clause.
	*
	* @example
	*
	* ```ts
	* // Select all users and their pets
	* const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
	*   .from(users)
	*   .leftJoin(pets, eq(users.id, pets.ownerId))
	*
	* // Select userId and petId
	* const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
	*   userId: users.id,
	*   petId: pets.id,
	* })
	*   .from(users)
	*   .leftJoin(pets, eq(users.id, pets.ownerId))
	* ```
	*/
	leftJoin = this.createJoin("left", false);
	/**
	* Executes a `left join lateral` operation by adding subquery to the current query.
	*
	* A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
	*
	* Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
	*
	* @param table the subquery to join.
	* @param on the `on` clause.
	*/
	leftJoinLateral = this.createJoin("left", true);
	/**
	* Executes a `right join` operation by adding another table to the current query.
	*
	* Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
	*
	* @param table the table to join.
	* @param on the `on` clause.
	*
	* @example
	*
	* ```ts
	* // Select all users and their pets
	* const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
	*   .from(users)
	*   .rightJoin(pets, eq(users.id, pets.ownerId))
	*
	* // Select userId and petId
	* const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
	*   userId: users.id,
	*   petId: pets.id,
	* })
	*   .from(users)
	*   .rightJoin(pets, eq(users.id, pets.ownerId))
	* ```
	*/
	rightJoin = this.createJoin("right", false);
	/**
	* Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
	*
	* Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
	*
	* @param table the table to join.
	* @param on the `on` clause.
	*
	* @example
	*
	* ```ts
	* // Select all users and their pets
	* const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
	*   .from(users)
	*   .innerJoin(pets, eq(users.id, pets.ownerId))
	*
	* // Select userId and petId
	* const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
	*   userId: users.id,
	*   petId: pets.id,
	* })
	*   .from(users)
	*   .innerJoin(pets, eq(users.id, pets.ownerId))
	* ```
	*/
	innerJoin = this.createJoin("inner", false);
	/**
	* Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
	*
	* A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
	*
	* Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
	*
	* @param table the subquery to join.
	* @param on the `on` clause.
	*/
	innerJoinLateral = this.createJoin("inner", true);
	/**
	* Executes a `full join` operation by combining rows from two tables into a new table.
	*
	* Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
	*
	* @param table the table to join.
	* @param on the `on` clause.
	*
	* @example
	*
	* ```ts
	* // Select all users and their pets
	* const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
	*   .from(users)
	*   .fullJoin(pets, eq(users.id, pets.ownerId))
	*
	* // Select userId and petId
	* const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
	*   userId: users.id,
	*   petId: pets.id,
	* })
	*   .from(users)
	*   .fullJoin(pets, eq(users.id, pets.ownerId))
	* ```
	*/
	fullJoin = this.createJoin("full", false);
	/**
	* Executes a `cross join` operation by combining rows from two tables into a new table.
	*
	* Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
	*
	* @param table the table to join.
	*
	* @example
	*
	* ```ts
	* // Select all users, each user with every pet
	* const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
	*   .from(users)
	*   .crossJoin(pets)
	*
	* // Select userId and petId
	* const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
	*   userId: users.id,
	*   petId: pets.id,
	* })
	*   .from(users)
	*   .crossJoin(pets)
	* ```
	*/
	crossJoin = this.createJoin("cross", false);
	/**
	* Executes a `cross join lateral` operation by combining rows from two queries into a new table.
	*
	* A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
	*
	* Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
	*
	* @param table the query to join.
	*/
	crossJoinLateral = this.createJoin("cross", true);
	createSetOperator(type, isAll) {
		return (rightSelection) => {
			const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
			if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) throw new Error("Set operator error (union / intersect / except): selected fields are not the same or are in a different order");
			this.config.setOperators.push({
				type,
				isAll,
				rightSelect
			});
			return this;
		};
	}
	/**
	* Adds `union` set operator to the query.
	*
	* Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
	*
	* @example
	*
	* ```ts
	* // Select all unique names from customers and users tables
	* await db.select({ name: users.name })
	*   .from(users)
	*   .union(
	*     db.select({ name: customers.name }).from(customers)
	*   );
	* // or
	* import { union } from 'drizzle-orm/pg-core'
	*
	* await union(
	*   db.select({ name: users.name }).from(users),
	*   db.select({ name: customers.name }).from(customers)
	* );
	* ```
	*/
	union = this.createSetOperator("union", false);
	/**
	* Adds `union all` set operator to the query.
	*
	* Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
	*
	* @example
	*
	* ```ts
	* // Select all transaction ids from both online and in-store sales
	* await db.select({ transaction: onlineSales.transactionId })
	*   .from(onlineSales)
	*   .unionAll(
	*     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
	*   );
	* // or
	* import { unionAll } from 'drizzle-orm/pg-core'
	*
	* await unionAll(
	*   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
	*   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
	* );
	* ```
	*/
	unionAll = this.createSetOperator("union", true);
	/**
	* Adds `intersect` set operator to the query.
	*
	* Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
	*
	* @example
	*
	* ```ts
	* // Select course names that are offered in both departments A and B
	* await db.select({ courseName: depA.courseName })
	*   .from(depA)
	*   .intersect(
	*     db.select({ courseName: depB.courseName }).from(depB)
	*   );
	* // or
	* import { intersect } from 'drizzle-orm/pg-core'
	*
	* await intersect(
	*   db.select({ courseName: depA.courseName }).from(depA),
	*   db.select({ courseName: depB.courseName }).from(depB)
	* );
	* ```
	*/
	intersect = this.createSetOperator("intersect", false);
	/**
	* Adds `intersect all` set operator to the query.
	*
	* Calling this method will retain only the rows that are present in both result sets including all duplicates.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
	*
	* @example
	*
	* ```ts
	* // Select all products and quantities that are ordered by both regular and VIP customers
	* await db.select({
	*   productId: regularCustomerOrders.productId,
	*   quantityOrdered: regularCustomerOrders.quantityOrdered
	* })
	* .from(regularCustomerOrders)
	* .intersectAll(
	*   db.select({
	*     productId: vipCustomerOrders.productId,
	*     quantityOrdered: vipCustomerOrders.quantityOrdered
	*   })
	*   .from(vipCustomerOrders)
	* );
	* // or
	* import { intersectAll } from 'drizzle-orm/pg-core'
	*
	* await intersectAll(
	*   db.select({
	*     productId: regularCustomerOrders.productId,
	*     quantityOrdered: regularCustomerOrders.quantityOrdered
	*   })
	*   .from(regularCustomerOrders),
	*   db.select({
	*     productId: vipCustomerOrders.productId,
	*     quantityOrdered: vipCustomerOrders.quantityOrdered
	*   })
	*   .from(vipCustomerOrders)
	* );
	* ```
	*/
	intersectAll = this.createSetOperator("intersect", true);
	/**
	* Adds `except` set operator to the query.
	*
	* Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
	*
	* @example
	*
	* ```ts
	* // Select all courses offered in department A but not in department B
	* await db.select({ courseName: depA.courseName })
	*   .from(depA)
	*   .except(
	*     db.select({ courseName: depB.courseName }).from(depB)
	*   );
	* // or
	* import { except } from 'drizzle-orm/pg-core'
	*
	* await except(
	*   db.select({ courseName: depA.courseName }).from(depA),
	*   db.select({ courseName: depB.courseName }).from(depB)
	* );
	* ```
	*/
	except = this.createSetOperator("except", false);
	/**
	* Adds `except all` set operator to the query.
	*
	* Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
	*
	* @example
	*
	* ```ts
	* // Select all products that are ordered by regular customers but not by VIP customers
	* await db.select({
	*   productId: regularCustomerOrders.productId,
	*   quantityOrdered: regularCustomerOrders.quantityOrdered,
	* })
	* .from(regularCustomerOrders)
	* .exceptAll(
	*   db.select({
	*     productId: vipCustomerOrders.productId,
	*     quantityOrdered: vipCustomerOrders.quantityOrdered,
	*   })
	*   .from(vipCustomerOrders)
	* );
	* // or
	* import { exceptAll } from 'drizzle-orm/pg-core'
	*
	* await exceptAll(
	*   db.select({
	*     productId: regularCustomerOrders.productId,
	*     quantityOrdered: regularCustomerOrders.quantityOrdered
	*   })
	*   .from(regularCustomerOrders),
	*   db.select({
	*     productId: vipCustomerOrders.productId,
	*     quantityOrdered: vipCustomerOrders.quantityOrdered
	*   })
	*   .from(vipCustomerOrders)
	* );
	* ```
	*/
	exceptAll = this.createSetOperator("except", true);
	/** @internal */
	addSetOperators(setOperators) {
		this.config.setOperators.push(...setOperators);
		return this;
	}
	/**
	* Adds a `where` clause to the query.
	*
	* Calling this method will select only those rows that fulfill a specified condition.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#filtering}
	*
	* @param where the `where` clause.
	*
	* @example
	* You can use conditional operators and `sql function` to filter the rows to be selected.
	*
	* ```ts
	* // Select all cars with green color
	* await db.select().from(cars).where(eq(cars.color, 'green'));
	* // or
	* await db.select().from(cars).where(sql`${cars.color} = 'green'`)
	* ```
	*
	* You can logically combine conditional operators with `and()` and `or()` operators:
	*
	* ```ts
	* // Select all BMW cars with a green color
	* await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
	*
	* // Select all cars with the green or blue color
	* await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
	* ```
	*/
	where(where) {
		if (typeof where === "function") where = where(new Proxy(this.config.fields, new SelectionProxyHandler({
			sqlAliasedBehavior: "sql",
			sqlBehavior: "sql"
		})));
		this.config.where = where;
		return this;
	}
	/**
	* Adds a `having` clause to the query.
	*
	* Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
	*
	* @param having the `having` clause.
	*
	* @example
	*
	* ```ts
	* // Select all brands with more than one car
	* await db.select({
	* 	brand: cars.brand,
	* 	count: sql<number>`cast(count(${cars.id}) as int)`,
	* })
	*   .from(cars)
	*   .groupBy(cars.brand)
	*   .having(({ count }) => gt(count, 1));
	* ```
	*/
	having(having) {
		if (typeof having === "function") having = having(new Proxy(this.config.fields, new SelectionProxyHandler({
			sqlAliasedBehavior: "sql",
			sqlBehavior: "sql"
		})));
		this.config.having = having;
		return this;
	}
	groupBy(...columns) {
		if (typeof columns[0] === "function") {
			const groupBy = columns[0](new Proxy(this.config.fields, new SelectionProxyHandler({
				sqlAliasedBehavior: "alias",
				sqlBehavior: "sql"
			})));
			this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
		} else this.config.groupBy = columns;
		return this;
	}
	orderBy(...columns) {
		if (typeof columns[0] === "function") {
			const orderBy = columns[0](new Proxy(this.config.fields, new SelectionProxyHandler({
				sqlAliasedBehavior: "alias",
				sqlBehavior: "sql"
			})));
			const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
			if (this.config.setOperators.length > 0) this.config.setOperators.at(-1).orderBy = orderByArray;
			else this.config.orderBy = orderByArray;
		} else {
			const orderByArray = columns;
			if (this.config.setOperators.length > 0) this.config.setOperators.at(-1).orderBy = orderByArray;
			else this.config.orderBy = orderByArray;
		}
		return this;
	}
	/**
	* Adds a `limit` clause to the query.
	*
	* Calling this method will set the maximum number of rows that will be returned by this query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
	*
	* @param limit the `limit` clause.
	*
	* @example
	*
	* ```ts
	* // Get the first 10 people from this query.
	* await db.select().from(people).limit(10);
	* ```
	*/
	limit(limit) {
		if (this.config.setOperators.length > 0) this.config.setOperators.at(-1).limit = limit;
		else this.config.limit = limit;
		return this;
	}
	/**
	* Adds an `offset` clause to the query.
	*
	* Calling this method will skip a number of rows when returning results from this query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
	*
	* @param offset the `offset` clause.
	*
	* @example
	*
	* ```ts
	* // Get the 10th-20th people from this query.
	* await db.select().from(people).offset(10).limit(10);
	* ```
	*/
	offset(offset) {
		if (this.config.setOperators.length > 0) this.config.setOperators.at(-1).offset = offset;
		else this.config.offset = offset;
		return this;
	}
	/**
	* Adds a `for` clause to the query.
	*
	* Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
	*
	* See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
	*
	* @param strength the lock strength.
	* @param config the lock configuration.
	*/
	for(strength, config = {}) {
		this.config.lockingClause = {
			strength,
			config
		};
		return this;
	}
	/** @internal */
	getSQL() {
		return this.dialect.buildSelectQuery(this.config);
	}
	toSQL() {
		const { typings: _typings,...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}
	as(alias) {
		const usedTables = [];
		usedTables.push(...extractUsedTable(this.config.table));
		if (this.config.joins) for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
		return new Proxy(new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]), new SelectionProxyHandler({
			alias,
			sqlAliasedBehavior: "alias",
			sqlBehavior: "error"
		}));
	}
	/** @internal */
	getSelectedFields() {
		return new Proxy(this.config.fields, new SelectionProxyHandler({
			alias: this.tableName,
			sqlAliasedBehavior: "alias",
			sqlBehavior: "error"
		}));
	}
	$dynamic() {
		return this;
	}
	$withCache(config) {
		this.cacheConfig = config === void 0 ? {
			config: {},
			enable: true,
			autoInvalidate: true
		} : config === false ? { enable: false } : {
			enable: true,
			autoInvalidate: true,
			...config
		};
		return this;
	}
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
	static [entityKind] = "PgSelect";
	/** @internal */
	_prepare(name) {
		const { session, config, dialect, joinsNotNullableMap, authToken, cacheConfig, usedTables } = this;
		if (!session) throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
		const { fields } = config;
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			const fieldsList = orderSelectedFields(fields);
			const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true, void 0, {
				type: "select",
				tables: [...usedTables]
			}, cacheConfig);
			query.joinsNotNullableMap = joinsNotNullableMap;
			return query.setToken(authToken);
		});
	}
	/**
	* Create a prepared statement for this query. This allows
	* the database to remember this query for the given session
	* and call it by name, rather than specifying the full query.
	*
	* {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
	*/
	prepare(name) {
		return this._prepare(name);
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute = (placeholderValues) => {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(placeholderValues, this.authToken);
		});
	};
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
	return (leftSelect, rightSelect, ...restSelects) => {
		const setOperators = [rightSelect, ...restSelects].map((select) => ({
			type,
			isAll,
			rightSelect: select
		}));
		for (const setOperator of setOperators) if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) throw new Error("Set operator error (union / intersect / except): selected fields are not the same or are in a different order");
		return leftSelect.addSetOperators(setOperators);
	};
}
const getPgSetOperators = () => ({
	union,
	unionAll,
	intersect,
	intersectAll,
	except,
	exceptAll
});
const union = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const intersectAll = createSetOperator("intersect", true);
const except = createSetOperator("except", false);
const exceptAll = createSetOperator("except", true);

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
	static [entityKind] = "PgQueryBuilder";
	dialect;
	dialectConfig;
	constructor(dialect) {
		this.dialect = is$1(dialect, PgDialect) ? dialect : void 0;
		this.dialectConfig = is$1(dialect, PgDialect) ? void 0 : dialect;
	}
	$with = (alias, selection) => {
		const queryBuilder = this;
		const as = (qb) => {
			if (typeof qb === "function") qb = qb(queryBuilder);
			return new Proxy(new WithSubquery(qb.getSQL(), selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}), alias, true), new SelectionProxyHandler({
				alias,
				sqlAliasedBehavior: "alias",
				sqlBehavior: "error"
			}));
		};
		return { as };
	};
	with(...queries) {
		const self = this;
		function select(fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: void 0,
				dialect: self.getDialect(),
				withList: queries
			});
		}
		function selectDistinct(fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: void 0,
				dialect: self.getDialect(),
				distinct: true
			});
		}
		function selectDistinctOn(on, fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: void 0,
				dialect: self.getDialect(),
				distinct: { on }
			});
		}
		return {
			select,
			selectDistinct,
			selectDistinctOn
		};
	}
	select(fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: void 0,
			dialect: this.getDialect()
		});
	}
	selectDistinct(fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: void 0,
			dialect: this.getDialect(),
			distinct: true
		});
	}
	selectDistinctOn(on, fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: void 0,
			dialect: this.getDialect(),
			distinct: { on }
		});
	}
	getDialect() {
		if (!this.dialect) this.dialect = new PgDialect(this.dialectConfig);
		return this.dialect;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/utils.js
function extractUsedTable(table) {
	if (is$1(table, PgTable)) return [table[TableSchema] ? `${table[TableSchema]}.${table[Table.Symbol.BaseName]}` : table[Table.Symbol.BaseName]];
	if (is$1(table, Subquery)) return table._.usedTables ?? [];
	if (is$1(table, SQL$1)) return table.usedTables ?? [];
	return [];
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
	constructor(table, session, dialect, withList) {
		super();
		this.session = session;
		this.dialect = dialect;
		this.config = {
			table,
			withList
		};
	}
	static [entityKind] = "PgDelete";
	config;
	cacheConfig;
	/**
	* Adds a `where` clause to the query.
	*
	* Calling this method will delete only those rows that fulfill a specified condition.
	*
	* See docs: {@link https://orm.drizzle.team/docs/delete}
	*
	* @param where the `where` clause.
	*
	* @example
	* You can use conditional operators and `sql function` to filter the rows to be deleted.
	*
	* ```ts
	* // Delete all cars with green color
	* await db.delete(cars).where(eq(cars.color, 'green'));
	* // or
	* await db.delete(cars).where(sql`${cars.color} = 'green'`)
	* ```
	*
	* You can logically combine conditional operators with `and()` and `or()` operators:
	*
	* ```ts
	* // Delete all BMW cars with a green color
	* await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
	*
	* // Delete all cars with the green or blue color
	* await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
	* ```
	*/
	where(where) {
		this.config.where = where;
		return this;
	}
	returning(fields = this.config.table[Table.Symbol.Columns]) {
		this.config.returningFields = fields;
		this.config.returning = orderSelectedFields(fields);
		return this;
	}
	/** @internal */
	getSQL() {
		return this.dialect.buildDeleteQuery(this.config);
	}
	toSQL() {
		const { typings: _typings,...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}
	/** @internal */
	_prepare(name) {
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
				type: "delete",
				tables: extractUsedTable(this.config.table)
			}, this.cacheConfig);
		});
	}
	prepare(name) {
		return this._prepare(name);
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute = (placeholderValues) => {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(placeholderValues, this.authToken);
		});
	};
	/** @internal */
	getSelectedFields() {
		return this.config.returningFields ? new Proxy(this.config.returningFields, new SelectionProxyHandler({
			alias: getTableName(this.config.table),
			sqlAliasedBehavior: "alias",
			sqlBehavior: "error"
		})) : void 0;
	}
	$dynamic() {
		return this;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
	constructor(table, session, dialect, withList, overridingSystemValue_) {
		this.table = table;
		this.session = session;
		this.dialect = dialect;
		this.withList = withList;
		this.overridingSystemValue_ = overridingSystemValue_;
	}
	static [entityKind] = "PgInsertBuilder";
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	overridingSystemValue() {
		this.overridingSystemValue_ = true;
		return this;
	}
	values(values) {
		values = Array.isArray(values) ? values : [values];
		if (values.length === 0) throw new Error("values() must be called with at least one value");
		const mappedValues = values.map((entry) => {
			const result = {};
			const cols = this.table[Table.Symbol.Columns];
			for (const colKey of Object.keys(entry)) {
				const colValue = entry[colKey];
				result[colKey] = is$1(colValue, SQL$1) ? colValue : new Param(colValue, cols[colKey]);
			}
			return result;
		});
		return new PgInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList, false, this.overridingSystemValue_).setToken(this.authToken);
	}
	select(selectQuery) {
		const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
		if (!is$1(select, SQL$1) && !haveSameKeys(this.table[TableColumns], select._.selectedFields)) throw new Error("Insert select error: selected fields are not the same or are in a different order compared to the table definition");
		return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
	}
};
var PgInsertBase = class extends QueryPromise {
	constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
		super();
		this.session = session;
		this.dialect = dialect;
		this.config = {
			table,
			values,
			withList,
			select,
			overridingSystemValue_
		};
	}
	static [entityKind] = "PgInsert";
	config;
	cacheConfig;
	returning(fields = this.config.table[Table.Symbol.Columns]) {
		this.config.returningFields = fields;
		this.config.returning = orderSelectedFields(fields);
		return this;
	}
	/**
	* Adds an `on conflict do nothing` clause to the query.
	*
	* Calling this method simply avoids inserting a row as its alternative action.
	*
	* See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
	*
	* @param config The `target` and `where` clauses.
	*
	* @example
	* ```ts
	* // Insert one row and cancel the insert if there's a conflict
	* await db.insert(cars)
	*   .values({ id: 1, brand: 'BMW' })
	*   .onConflictDoNothing();
	*
	* // Explicitly specify conflict target
	* await db.insert(cars)
	*   .values({ id: 1, brand: 'BMW' })
	*   .onConflictDoNothing({ target: cars.id });
	* ```
	*/
	onConflictDoNothing(config = {}) {
		if (config.target === void 0) this.config.onConflict = sql$1`do nothing`;
		else {
			let targetColumn = "";
			targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
			const whereSql = config.where ? sql$1` where ${config.where}` : void 0;
			this.config.onConflict = sql$1`(${sql$1.raw(targetColumn)})${whereSql} do nothing`;
		}
		return this;
	}
	/**
	* Adds an `on conflict do update` clause to the query.
	*
	* Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
	*
	* See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
	*
	* @param config The `target`, `set` and `where` clauses.
	*
	* @example
	* ```ts
	* // Update the row if there's a conflict
	* await db.insert(cars)
	*   .values({ id: 1, brand: 'BMW' })
	*   .onConflictDoUpdate({
	*     target: cars.id,
	*     set: { brand: 'Porsche' }
	*   });
	*
	* // Upsert with 'where' clause
	* await db.insert(cars)
	*   .values({ id: 1, brand: 'BMW' })
	*   .onConflictDoUpdate({
	*     target: cars.id,
	*     set: { brand: 'newBMW' },
	*     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
	*   });
	* ```
	*/
	onConflictDoUpdate(config) {
		if (config.where && (config.targetWhere || config.setWhere)) throw new Error("You cannot use both \"where\" and \"targetWhere\"/\"setWhere\" at the same time - \"where\" is deprecated, use \"targetWhere\" or \"setWhere\" instead.");
		const whereSql = config.where ? sql$1` where ${config.where}` : void 0;
		const targetWhereSql = config.targetWhere ? sql$1` where ${config.targetWhere}` : void 0;
		const setWhereSql = config.setWhere ? sql$1` where ${config.setWhere}` : void 0;
		const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
		let targetColumn = "";
		targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
		this.config.onConflict = sql$1`(${sql$1.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
		return this;
	}
	/** @internal */
	getSQL() {
		return this.dialect.buildInsertQuery(this.config);
	}
	toSQL() {
		const { typings: _typings,...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}
	/** @internal */
	_prepare(name) {
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
				type: "insert",
				tables: extractUsedTable(this.config.table)
			}, this.cacheConfig);
		});
	}
	prepare(name) {
		return this._prepare(name);
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute = (placeholderValues) => {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(placeholderValues, this.authToken);
		});
	};
	/** @internal */
	getSelectedFields() {
		return this.config.returningFields ? new Proxy(this.config.returningFields, new SelectionProxyHandler({
			alias: getTableName(this.config.table),
			sqlAliasedBehavior: "alias",
			sqlBehavior: "error"
		})) : void 0;
	}
	$dynamic() {
		return this;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
	constructor(view, session, dialect) {
		super();
		this.session = session;
		this.dialect = dialect;
		this.config = { view };
	}
	static [entityKind] = "PgRefreshMaterializedView";
	config;
	concurrently() {
		if (this.config.withNoData !== void 0) throw new Error("Cannot use concurrently and withNoData together");
		this.config.concurrently = true;
		return this;
	}
	withNoData() {
		if (this.config.concurrently !== void 0) throw new Error("Cannot use concurrently and withNoData together");
		this.config.withNoData = true;
		return this;
	}
	/** @internal */
	getSQL() {
		return this.dialect.buildRefreshMaterializedViewQuery(this.config);
	}
	toSQL() {
		const { typings: _typings,...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}
	/** @internal */
	_prepare(name) {
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
		});
	}
	prepare(name) {
		return this._prepare(name);
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute = (placeholderValues) => {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(placeholderValues, this.authToken);
		});
	};
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
	constructor(table, session, dialect, withList) {
		this.table = table;
		this.session = session;
		this.dialect = dialect;
		this.withList = withList;
	}
	static [entityKind] = "PgUpdateBuilder";
	authToken;
	setToken(token) {
		this.authToken = token;
		return this;
	}
	set(values) {
		return new PgUpdateBase(this.table, mapUpdateSet(this.table, values), this.session, this.dialect, this.withList).setToken(this.authToken);
	}
};
var PgUpdateBase = class extends QueryPromise {
	constructor(table, set, session, dialect, withList) {
		super();
		this.session = session;
		this.dialect = dialect;
		this.config = {
			set,
			table,
			withList,
			joins: []
		};
		this.tableName = getTableLikeName(table);
		this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
	}
	static [entityKind] = "PgUpdate";
	config;
	tableName;
	joinsNotNullableMap;
	cacheConfig;
	from(source) {
		const src = source;
		const tableName = getTableLikeName(src);
		if (typeof tableName === "string") this.joinsNotNullableMap[tableName] = true;
		this.config.from = src;
		return this;
	}
	getTableLikeFields(table) {
		if (is$1(table, PgTable)) return table[Table.Symbol.Columns];
		else if (is$1(table, Subquery)) return table._.selectedFields;
		return table[ViewBaseConfig].selectedFields;
	}
	createJoin(joinType) {
		return (table, on) => {
			const tableName = getTableLikeName(table);
			if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) throw new Error(`Alias "${tableName}" is already used in this query`);
			if (typeof on === "function") {
				const from = this.config.from && !is$1(this.config.from, SQL$1) ? this.getTableLikeFields(this.config.from) : void 0;
				on = on(new Proxy(this.config.table[Table.Symbol.Columns], new SelectionProxyHandler({
					sqlAliasedBehavior: "sql",
					sqlBehavior: "sql"
				})), from && new Proxy(from, new SelectionProxyHandler({
					sqlAliasedBehavior: "sql",
					sqlBehavior: "sql"
				})));
			}
			this.config.joins.push({
				on,
				table,
				joinType,
				alias: tableName
			});
			if (typeof tableName === "string") switch (joinType) {
				case "left":
					this.joinsNotNullableMap[tableName] = false;
					break;
				case "right":
					this.joinsNotNullableMap = Object.fromEntries(Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false]));
					this.joinsNotNullableMap[tableName] = true;
					break;
				case "inner":
					this.joinsNotNullableMap[tableName] = true;
					break;
				case "full":
					this.joinsNotNullableMap = Object.fromEntries(Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false]));
					this.joinsNotNullableMap[tableName] = false;
					break;
			}
			return this;
		};
	}
	leftJoin = this.createJoin("left");
	rightJoin = this.createJoin("right");
	innerJoin = this.createJoin("inner");
	fullJoin = this.createJoin("full");
	/**
	* Adds a 'where' clause to the query.
	*
	* Calling this method will update only those rows that fulfill a specified condition.
	*
	* See docs: {@link https://orm.drizzle.team/docs/update}
	*
	* @param where the 'where' clause.
	*
	* @example
	* You can use conditional operators and `sql function` to filter the rows to be updated.
	*
	* ```ts
	* // Update all cars with green color
	* await db.update(cars).set({ color: 'red' })
	*   .where(eq(cars.color, 'green'));
	* // or
	* await db.update(cars).set({ color: 'red' })
	*   .where(sql`${cars.color} = 'green'`)
	* ```
	*
	* You can logically combine conditional operators with `and()` and `or()` operators:
	*
	* ```ts
	* // Update all BMW cars with a green color
	* await db.update(cars).set({ color: 'red' })
	*   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
	*
	* // Update all cars with the green or blue color
	* await db.update(cars).set({ color: 'red' })
	*   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
	* ```
	*/
	where(where) {
		this.config.where = where;
		return this;
	}
	returning(fields) {
		if (!fields) {
			fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
			if (this.config.from) {
				const tableName = getTableLikeName(this.config.from);
				if (typeof tableName === "string" && this.config.from && !is$1(this.config.from, SQL$1)) fields[tableName] = this.getTableLikeFields(this.config.from);
				for (const join of this.config.joins) {
					const tableName2 = getTableLikeName(join.table);
					if (typeof tableName2 === "string" && !is$1(join.table, SQL$1)) fields[tableName2] = this.getTableLikeFields(join.table);
				}
			}
		}
		this.config.returningFields = fields;
		this.config.returning = orderSelectedFields(fields);
		return this;
	}
	/** @internal */
	getSQL() {
		return this.dialect.buildUpdateQuery(this.config);
	}
	toSQL() {
		const { typings: _typings,...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}
	/** @internal */
	_prepare(name) {
		const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
			type: "insert",
			tables: extractUsedTable(this.config.table)
		}, this.cacheConfig);
		query.joinsNotNullableMap = this.joinsNotNullableMap;
		return query;
	}
	prepare(name) {
		return this._prepare(name);
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute = (placeholderValues) => {
		return this._prepare().execute(placeholderValues, this.authToken);
	};
	/** @internal */
	getSelectedFields() {
		return this.config.returningFields ? new Proxy(this.config.returningFields, new SelectionProxyHandler({
			alias: getTableName(this.config.table),
			sqlAliasedBehavior: "alias",
			sqlBehavior: "error"
		})) : void 0;
	}
	$dynamic() {
		return this;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/_query.js
var _RelationalQueryBuilder = class {
	constructor(fullSchema, schema$1, tableNamesMap, table, tableConfig, dialect, session) {
		this.fullSchema = fullSchema;
		this.schema = schema$1;
		this.tableNamesMap = tableNamesMap;
		this.table = table;
		this.tableConfig = tableConfig;
		this.dialect = dialect;
		this.session = session;
	}
	static [entityKind] = "PgRelationalQueryBuilder";
	findMany(config) {
		return new _PgRelationalQuery(this.fullSchema, this.schema, this.tableNamesMap, this.table, this.tableConfig, this.dialect, this.session, config ? config : {}, "many");
	}
	findFirst(config) {
		return new _PgRelationalQuery(this.fullSchema, this.schema, this.tableNamesMap, this.table, this.tableConfig, this.dialect, this.session, config ? {
			...config,
			limit: 1
		} : { limit: 1 }, "first");
	}
};
var _PgRelationalQuery = class extends QueryPromise {
	constructor(fullSchema, schema$1, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
		super();
		this.fullSchema = fullSchema;
		this.schema = schema$1;
		this.tableNamesMap = tableNamesMap;
		this.table = table;
		this.tableConfig = tableConfig;
		this.dialect = dialect;
		this.session = session;
		this.config = config;
		this.mode = mode;
	}
	static [entityKind] = "PgRelationalQuery";
	/** @internal */
	_prepare(name) {
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			const { query, builtQuery } = this._toSQL();
			return this.session.prepareQuery(builtQuery, void 0, name, true, (rawRows, mapColumnValue) => {
				const rows = rawRows.map((row) => mapRelationalRow$1(this.schema, this.tableConfig, row, query.selection, mapColumnValue));
				if (this.mode === "first") return rows[0];
				return rows;
			});
		});
	}
	prepare(name) {
		return this._prepare(name);
	}
	_getQuery() {
		return this.dialect._buildRelationalQuery({
			fullSchema: this.fullSchema,
			schema: this.schema,
			tableNamesMap: this.tableNamesMap,
			table: this.table,
			tableConfig: this.tableConfig,
			queryConfig: this.config,
			tableAlias: this.tableConfig.tsName
		});
	}
	/** @internal */
	getSQL() {
		return this._getQuery().sql;
	}
	_toSQL() {
		const query = this._getQuery();
		const builtQuery = this.dialect.sqlToQuery(query.sql);
		return {
			query,
			builtQuery
		};
	}
	toSQL() {
		return this._toSQL().builtQuery;
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute() {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(void 0, this.authToken);
		});
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class PgCountBuilder extends SQL$1 {
	constructor(params) {
		super(PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
		this.params = params;
		this.mapWith(Number);
		this.session = params.session;
		this.sql = PgCountBuilder.buildCount(params.source, params.filters);
	}
	sql;
	token;
	static [entityKind] = "PgCountBuilder";
	[Symbol.toStringTag] = "PgCountBuilder";
	session;
	static buildEmbeddedCount(source, filters) {
		return sql$1`(select count(*) from ${source}${sql$1.raw(" where ").if(filters)}${filters})`;
	}
	static buildCount(source, filters) {
		return sql$1`select count(*) as count from ${source}${sql$1.raw(" where ").if(filters)}${filters};`;
	}
	/** @intrnal */
	setToken(token) {
		this.token = token;
		return this;
	}
	then(onfulfilled, onrejected) {
		return Promise.resolve(this.session.count(this.sql, this.token)).then(onfulfilled, onrejected);
	}
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
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
	constructor(schema$1, table, tableConfig, dialect, session) {
		this.schema = schema$1;
		this.table = table;
		this.tableConfig = tableConfig;
		this.dialect = dialect;
		this.session = session;
	}
	static [entityKind] = "PgRelationalQueryBuilderV2";
	findMany(config) {
		return new PgRelationalQuery(this.schema, this.table, this.tableConfig, this.dialect, this.session, config ?? true, "many");
	}
	findFirst(config) {
		return new PgRelationalQuery(this.schema, this.table, this.tableConfig, this.dialect, this.session, config ?? true, "first");
	}
};
var PgRelationalQuery = class extends QueryPromise {
	constructor(schema$1, table, tableConfig, dialect, session, config, mode) {
		super();
		this.schema = schema$1;
		this.table = table;
		this.tableConfig = tableConfig;
		this.dialect = dialect;
		this.session = session;
		this.config = config;
		this.mode = mode;
	}
	static [entityKind] = "PgRelationalQueryV2";
	/** @internal */
	_prepare(name) {
		return tracer.startActiveSpan("drizzle.prepareQuery", () => {
			const { query, builtQuery } = this._toSQL();
			return this.session.prepareRelationalQuery(builtQuery, void 0, name, (rawRows, mapColumnValue) => {
				const rows = rawRows.map((row) => mapRelationalRow(row, query.selection, mapColumnValue));
				if (this.mode === "first") return rows[0];
				return rows;
			});
		});
	}
	prepare(name) {
		return this._prepare(name);
	}
	_getQuery() {
		return this.dialect.buildRelationalQuery({
			schema: this.schema,
			table: this.table,
			tableConfig: this.tableConfig,
			queryConfig: this.config,
			mode: this.mode
		});
	}
	/** @internal */
	getSQL() {
		return this._getQuery().sql;
	}
	_toSQL() {
		const query = this._getQuery();
		const builtQuery = this.dialect.sqlToQuery(query.sql);
		return {
			query,
			builtQuery
		};
	}
	toSQL() {
		return this._toSQL().builtQuery;
	}
	authToken;
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	execute() {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return this._prepare().execute(void 0, this.authToken);
		});
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
	constructor(execute, sql$2, query, mapBatchResult) {
		super();
		this.execute = execute;
		this.sql = sql$2;
		this.query = query;
		this.mapBatchResult = mapBatchResult;
	}
	static [entityKind] = "PgRaw";
	/** @internal */
	getSQL() {
		return this.sql;
	}
	getQuery() {
		return this.query;
	}
	mapResult(result, isFromBatch) {
		return isFromBatch ? this.mapBatchResult(result) : result;
	}
	_prepare() {
		return this;
	}
	/** @internal */
	isResponseInArrayMode() {
		return false;
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
	constructor(dialect, session, relations$1, schema$1) {
		this.dialect = dialect;
		this.session = session;
		this._ = schema$1 ? {
			schema: schema$1.schema,
			fullSchema: schema$1.fullSchema,
			tableNamesMap: schema$1.tableNamesMap,
			relations: relations$1,
			session
		} : {
			schema: void 0,
			fullSchema: {},
			tableNamesMap: {},
			relations: relations$1,
			session
		};
		this._query = {};
		if (this._.schema) for (const [tableName, columns] of Object.entries(this._.schema)) this._query[tableName] = new _RelationalQueryBuilder(schema$1.fullSchema, this._.schema, this._.tableNamesMap, schema$1.fullSchema[tableName], columns, dialect, session);
		this.query = {};
		for (const [tableName, relation] of Object.entries(relations$1)) this.query[tableName] = new RelationalQueryBuilder(relations$1, relations$1[relation.name].table, relation, dialect, session);
		this.$cache = { invalidate: async (_params) => {} };
	}
	static [entityKind] = "PgDatabase";
	/** @deprecated */
	_query;
	query;
	/**
	* Creates a subquery that defines a temporary named result set as a CTE.
	*
	* It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
	*
	* @param alias The alias for the subquery.
	*
	* Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
	*
	* @example
	*
	* ```ts
	* // Create a subquery with alias 'sq' and use it in the select query
	* const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
	*
	* const result = await db.with(sq).select().from(sq);
	* ```
	*
	* To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
	*
	* ```ts
	* // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
	* const sq = db.$with('sq').as(db.select({
	*   name: sql<string>`upper(${users.name})`.as('name'),
	* })
	* .from(users));
	*
	* const result = await db.with(sq).select({ name: sq.name }).from(sq);
	* ```
	*/
	$with = (alias, selection) => {
		const self = this;
		const as = (qb) => {
			if (typeof qb === "function") qb = qb(new QueryBuilder(self.dialect));
			return new Proxy(new WithSubquery(qb.getSQL(), selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}), alias, true), new SelectionProxyHandler({
				alias,
				sqlAliasedBehavior: "alias",
				sqlBehavior: "error"
			}));
		};
		return { as };
	};
	$count(source, filters) {
		return new PgCountBuilder({
			source,
			filters,
			session: this.session
		});
	}
	$cache;
	/**
	* Incorporates a previously defined CTE (using `$with`) into the main query.
	*
	* This method allows the main query to reference a temporary named result set.
	*
	* See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
	*
	* @param queries The CTEs to incorporate into the main query.
	*
	* @example
	*
	* ```ts
	* // Define a subquery 'sq' as a CTE using $with
	* const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
	*
	* // Incorporate the CTE 'sq' into the main query and select from it
	* const result = await db.with(sq).select().from(sq);
	* ```
	*/
	with(...queries) {
		const self = this;
		function select(fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: self.session,
				dialect: self.dialect,
				withList: queries
			});
		}
		function selectDistinct(fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: self.session,
				dialect: self.dialect,
				withList: queries,
				distinct: true
			});
		}
		function selectDistinctOn(on, fields) {
			return new PgSelectBuilder({
				fields: fields ?? void 0,
				session: self.session,
				dialect: self.dialect,
				withList: queries,
				distinct: { on }
			});
		}
		function update(table) {
			return new PgUpdateBuilder(table, self.session, self.dialect, queries);
		}
		function insert(table) {
			return new PgInsertBuilder(table, self.session, self.dialect, queries);
		}
		function delete_(table) {
			return new PgDeleteBase(table, self.session, self.dialect, queries);
		}
		return {
			select,
			selectDistinct,
			selectDistinctOn,
			update,
			insert,
			delete: delete_
		};
	}
	select(fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: this.session,
			dialect: this.dialect
		});
	}
	selectDistinct(fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: this.session,
			dialect: this.dialect,
			distinct: true
		});
	}
	selectDistinctOn(on, fields) {
		return new PgSelectBuilder({
			fields: fields ?? void 0,
			session: this.session,
			dialect: this.dialect,
			distinct: { on }
		});
	}
	/**
	* Creates an update query.
	*
	* Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
	*
	* Use `.set()` method to specify which values to update.
	*
	* See docs: {@link https://orm.drizzle.team/docs/update}
	*
	* @param table The table to update.
	*
	* @example
	*
	* ```ts
	* // Update all rows in the 'cars' table
	* await db.update(cars).set({ color: 'red' });
	*
	* // Update rows with filters and conditions
	* await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
	*
	* // Update with returning clause
	* const updatedCar: Car[] = await db.update(cars)
	*   .set({ color: 'red' })
	*   .where(eq(cars.id, 1))
	*   .returning();
	* ```
	*/
	update(table) {
		return new PgUpdateBuilder(table, this.session, this.dialect);
	}
	/**
	* Creates an insert query.
	*
	* Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
	*
	* See docs: {@link https://orm.drizzle.team/docs/insert}
	*
	* @param table The table to insert into.
	*
	* @example
	*
	* ```ts
	* // Insert one row
	* await db.insert(cars).values({ brand: 'BMW' });
	*
	* // Insert multiple rows
	* await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
	*
	* // Insert with returning clause
	* const insertedCar: Car[] = await db.insert(cars)
	*   .values({ brand: 'BMW' })
	*   .returning();
	* ```
	*/
	insert(table) {
		return new PgInsertBuilder(table, this.session, this.dialect);
	}
	/**
	* Creates a delete query.
	*
	* Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
	*
	* See docs: {@link https://orm.drizzle.team/docs/delete}
	*
	* @param table The table to delete from.
	*
	* @example
	*
	* ```ts
	* // Delete all rows in the 'cars' table
	* await db.delete(cars);
	*
	* // Delete rows with filters and conditions
	* await db.delete(cars).where(eq(cars.color, 'green'));
	*
	* // Delete with returning clause
	* const deletedCar: Car[] = await db.delete(cars)
	*   .where(eq(cars.id, 1))
	*   .returning();
	* ```
	*/
	delete(table) {
		return new PgDeleteBase(table, this.session, this.dialect);
	}
	refreshMaterializedView(view) {
		return new PgRefreshMaterializedView(view, this.session, this.dialect);
	}
	authToken;
	execute(query) {
		const sequel = typeof query === "string" ? sql$1.raw(query) : query.getSQL();
		const builtQuery = this.dialect.sqlToQuery(sequel);
		const prepared = this.session.prepareQuery(builtQuery, void 0, void 0, false);
		return new PgRaw(() => prepared.execute(void 0, this.authToken), sequel, builtQuery, (result) => prepared.mapResult(result, true));
	}
	transaction(transaction, config) {
		return this.session.transaction(transaction, config);
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
	static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
	strategy() {
		return "all";
	}
	static [entityKind] = "NoopCache";
	async get(_key) {}
	async put(_hashedQuery, _response, _tables, _config) {}
	async onMutate(_params) {}
};
async function hashQuery(sql$2, params) {
	const dataToHash = `${sql$2}-${JSON.stringify(params)}`;
	const data = new TextEncoder().encode(dataToHash);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
	constructor(query, cache, queryMetadata, cacheConfig) {
		this.query = query;
		this.cache = cache;
		this.queryMetadata = queryMetadata;
		this.cacheConfig = cacheConfig;
		if (cache && cache.strategy() === "all" && cacheConfig === void 0) this.cacheConfig = {
			enable: true,
			autoInvalidate: true
		};
		if (!this.cacheConfig?.enable) this.cacheConfig = void 0;
	}
	authToken;
	getQuery() {
		return this.query;
	}
	mapResult(response, _isFromBatch) {
		return response;
	}
	/** @internal */
	setToken(token) {
		this.authToken = token;
		return this;
	}
	static [entityKind] = "PgPreparedQuery";
	/** @internal */
	joinsNotNullableMap;
	/** @internal */
	async queryWithCache(queryString, params, query) {
		if (this.cache === void 0 || is$1(this.cache, NoopCache) || this.queryMetadata === void 0) try {
			return await query();
		} catch (e) {
			throw new DrizzleQueryError(queryString, params, e);
		}
		if (this.cacheConfig && !this.cacheConfig.enable) try {
			return await query();
		} catch (e) {
			throw new DrizzleQueryError(queryString, params, e);
		}
		if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) try {
			const [res] = await Promise.all([query(), this.cache.onMutate({ tables: this.queryMetadata.tables })]);
			return res;
		} catch (e) {
			throw new DrizzleQueryError(queryString, params, e);
		}
		if (!this.cacheConfig) try {
			return await query();
		} catch (e) {
			throw new DrizzleQueryError(queryString, params, e);
		}
		if (this.queryMetadata.type === "select") {
			const fromCache = await this.cache.get(this.cacheConfig.tag ?? await hashQuery(queryString, params), this.queryMetadata.tables, this.cacheConfig.tag !== void 0, this.cacheConfig.autoInvalidate);
			if (fromCache === void 0) {
				let result;
				try {
					result = await query();
				} catch (e) {
					throw new DrizzleQueryError(queryString, params, e);
				}
				await this.cache.put(this.cacheConfig.tag ?? await hashQuery(queryString, params), result, this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [], this.cacheConfig.tag !== void 0, this.cacheConfig.config);
				return result;
			}
			return fromCache;
		}
		try {
			return await query();
		} catch (e) {
			throw new DrizzleQueryError(queryString, params, e);
		}
	}
};
var PgSession = class {
	constructor(dialect) {
		this.dialect = dialect;
	}
	static [entityKind] = "PgSession";
	/** @internal */
	execute(query, token) {
		return tracer.startActiveSpan("drizzle.operation", () => {
			return tracer.startActiveSpan("drizzle.prepareQuery", () => {
				return this.prepareQuery(this.dialect.sqlToQuery(query), void 0, void 0, false);
			}).setToken(token).execute(void 0, token);
		});
	}
	all(query) {
		return this.prepareQuery(this.dialect.sqlToQuery(query), void 0, void 0, false).all();
	}
	/** @internal */
	async count(sql2, token) {
		const res = await this.execute(sql2, token);
		return Number(res[0]["count"]);
	}
};
var PgTransaction = class extends PgDatabase {
	constructor(dialect, session, relations$1, schema$1, nestedIndex = 0) {
		super(dialect, session, relations$1, schema$1);
		this.relations = relations$1;
		this.schema = schema$1;
		this.nestedIndex = nestedIndex;
	}
	static [entityKind] = "PgTransaction";
	rollback() {
		throw new TransactionRollbackError();
	}
	/** @internal */
	getTransactionConfigSQL(config) {
		const chunks = [];
		if (config.isolationLevel) chunks.push(`isolation level ${config.isolationLevel}`);
		if (config.accessMode) chunks.push(config.accessMode);
		if (typeof config.deferrable === "boolean") chunks.push(config.deferrable ? "deferrable" : "not deferrable");
		return sql$1.raw(chunks.join(" "));
	}
	setTransaction(config) {
		return this.session.execute(sql$1`set transaction ${this.getTransactionConfigSQL(config)}`);
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
	static [entityKind] = "ConsoleLogWriter";
	write(message) {
		console.log(message);
	}
};
var DefaultLogger = class {
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
var NoopLogger = class {
	static [entityKind] = "NoopLogger";
	logQuery() {}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/neon-serverless/session.js
var NeonPreparedQuery = class extends PgPreparedQuery {
	constructor(client$1, queryString, params, logger, cache, queryMetadata, cacheConfig, fields, name, _isResponseInArrayMode, customResultMapper, isRqbV2Query) {
		super({
			sql: queryString,
			params
		}, cache, queryMetadata, cacheConfig);
		this.client = client$1;
		this.params = params;
		this.logger = logger;
		this.fields = fields;
		this._isResponseInArrayMode = _isResponseInArrayMode;
		this.customResultMapper = customResultMapper;
		this.isRqbV2Query = isRqbV2Query;
		this.rawQueryConfig = {
			name,
			text: queryString,
			types: { getTypeParser: (typeId, format) => {
				if (typeId === types.builtins.TIMESTAMPTZ) return (val) => val;
				if (typeId === types.builtins.TIMESTAMP) return (val) => val;
				if (typeId === types.builtins.DATE) return (val) => val;
				if (typeId === types.builtins.INTERVAL) return (val) => val;
				if (typeId === 1231) return (val) => val;
				if (typeId === 1115) return (val) => val;
				if (typeId === 1185) return (val) => val;
				if (typeId === 1187) return (val) => val;
				if (typeId === 1182) return (val) => val;
				return types.getTypeParser(typeId, format);
			} }
		};
		this.queryConfig = {
			name,
			text: queryString,
			rowMode: "array",
			types: { getTypeParser: (typeId, format) => {
				if (typeId === types.builtins.TIMESTAMPTZ) return (val) => val;
				if (typeId === types.builtins.TIMESTAMP) return (val) => val;
				if (typeId === types.builtins.DATE) return (val) => val;
				if (typeId === types.builtins.INTERVAL) return (val) => val;
				if (typeId === 1231) return (val) => val;
				if (typeId === 1115) return (val) => val;
				if (typeId === 1185) return (val) => val;
				if (typeId === 1187) return (val) => val;
				if (typeId === 1182) return (val) => val;
				return types.getTypeParser(typeId, format);
			} }
		};
	}
	static [entityKind] = "NeonPreparedQuery";
	rawQueryConfig;
	queryConfig;
	async execute(placeholderValues = {}) {
		if (this.isRqbV2Query) return this.executeRqbV2(placeholderValues);
		const params = fillPlaceholders(this.params, placeholderValues);
		this.logger.logQuery(this.rawQueryConfig.text, params);
		const { fields, client: client$1, rawQueryConfig: rawQuery, queryConfig: query, joinsNotNullableMap, customResultMapper } = this;
		if (!fields && !customResultMapper) return await this.queryWithCache(rawQuery.text, params, async () => {
			return await client$1.query(rawQuery, params);
		});
		const result = await this.queryWithCache(query.text, params, async () => {
			return await client$1.query(query, params);
		});
		return customResultMapper ? customResultMapper(result.rows) : result.rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
	}
	async executeRqbV2(placeholderValues = {}) {
		const params = fillPlaceholders(this.params, placeholderValues);
		this.logger.logQuery(this.rawQueryConfig.text, params);
		const { client: client$1, rawQueryConfig: rawQuery, customResultMapper } = this;
		const result = await client$1.query(rawQuery, params);
		return customResultMapper(result.rows);
	}
	all(placeholderValues = {}) {
		const params = fillPlaceholders(this.params, placeholderValues);
		this.logger.logQuery(this.rawQueryConfig.text, params);
		return this.queryWithCache(this.rawQueryConfig.text, params, async () => {
			return await this.client.query(this.rawQueryConfig, params);
		}).then((result) => result.rows);
	}
	values(placeholderValues = {}) {
		const params = fillPlaceholders(this.params, placeholderValues);
		this.logger.logQuery(this.rawQueryConfig.text, params);
		return this.queryWithCache(this.queryConfig.text, params, async () => {
			return await this.client.query(this.queryConfig, params);
		}).then((result) => result.rows);
	}
	/** @internal */
	isResponseInArrayMode() {
		return this._isResponseInArrayMode;
	}
};
var NeonSession = class NeonSession extends PgSession {
	constructor(client$1, dialect, relations$1, schema$1, options = {}) {
		super(dialect);
		this.client = client$1;
		this.relations = relations$1;
		this.schema = schema$1;
		this.options = options;
		this.logger = options.logger ?? new NoopLogger();
		this.cache = options.cache ?? new NoopCache();
	}
	static [entityKind] = "NeonSession";
	logger;
	cache;
	prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
		return new NeonPreparedQuery(this.client, query.sql, query.params, this.logger, this.cache, queryMetadata, cacheConfig, fields, name, isResponseInArrayMode, customResultMapper);
	}
	prepareRelationalQuery(query, fields, name, customResultMapper) {
		return new NeonPreparedQuery(this.client, query.sql, query.params, this.logger, this.cache, void 0, void 0, fields, name, false, customResultMapper, true);
	}
	async query(query, params) {
		this.logger.logQuery(query, params);
		return await this.client.query({
			rowMode: "array",
			text: query,
			values: params
		});
	}
	async queryObjects(query, params) {
		return this.client.query(query, params);
	}
	async count(sql2) {
		const res = await this.execute(sql2);
		return Number(res["rows"][0]["count"]);
	}
	async transaction(transaction, config = {}) {
		const session = this.client instanceof Pool ? new NeonSession(await this.client.connect(), this.dialect, this.relations, this.schema, this.options) : this;
		const tx = new NeonTransaction(this.dialect, session, this.relations, this.schema);
		await tx.execute(sql$1`begin ${tx.getTransactionConfigSQL(config)}`);
		try {
			const result = await transaction(tx);
			await tx.execute(sql$1`commit`);
			return result;
		} catch (error) {
			await tx.execute(sql$1`rollback`);
			throw error;
		} finally {
			if (this.client instanceof Pool) session.client.release();
		}
	}
};
var NeonTransaction = class NeonTransaction extends PgTransaction {
	static [entityKind] = "NeonTransaction";
	async transaction(transaction) {
		const savepointName = `sp${this.nestedIndex + 1}`;
		const tx = new NeonTransaction(this.dialect, this.session, this.relations, this.schema, this.nestedIndex + 1);
		await tx.execute(sql$1.raw(`savepoint ${savepointName}`));
		try {
			const result = await transaction(tx);
			await tx.execute(sql$1.raw(`release savepoint ${savepointName}`));
			return result;
		} catch (e) {
			await tx.execute(sql$1.raw(`rollback to savepoint ${savepointName}`));
			throw e;
		}
	}
};

//#endregion
//#region ../../node_modules/.bun/drizzle-orm@1.0.0-beta.1-c569775+70306ffd88d51545/node_modules/drizzle-orm/neon-serverless/driver.js
var NeonDriver = class {
	constructor(client$1, dialect, options = {}) {
		this.client = client$1;
		this.dialect = dialect;
		this.options = options;
	}
	static [entityKind] = "NeonDriver";
	createSession(relations$1, schema$1) {
		return new NeonSession(this.client, this.dialect, relations$1, schema$1, {
			logger: this.options.logger,
			cache: this.options.cache
		});
	}
};
var NeonDatabase = class extends PgDatabase {
	static [entityKind] = "NeonServerlessDatabase";
};
function construct(client$1, config = {}) {
	const dialect = new PgDialect({ casing: config.casing });
	let logger;
	if (config.logger === true) logger = new DefaultLogger();
	else if (config.logger !== false) logger = config.logger;
	let schema$1;
	if (config.schema) {
		const tablesConfig = extractTablesRelationalConfig(config.schema, createTableRelationsHelpers);
		schema$1 = {
			fullSchema: config.schema,
			schema: tablesConfig.tables,
			tableNamesMap: tablesConfig.tableNamesMap
		};
	}
	const relations$1 = config.relations ?? {};
	const session = new NeonDriver(client$1, dialect, {
		logger,
		cache: config.cache
	}).createSession(relations$1, schema$1);
	const db$1 = new NeonDatabase(dialect, session, relations$1, schema$1);
	db$1.$client = client$1;
	db$1.$cache = config.cache;
	if (db$1.$cache) db$1.$cache["invalidate"] = config.cache?.onMutate;
	return db$1;
}
function drizzle(...params) {
	if (typeof params[0] === "string") {
		const instance = new Pool({ connectionString: params[0] });
		return construct(instance, params[1]);
	}
	if (isConfig(params[0])) {
		const { connection, client: client$1, ws,...drizzleConfig } = params[0];
		if (ws) neonConfig.webSocketConstructor = ws;
		if (client$1) return construct(client$1, drizzleConfig);
		const instance = typeof connection === "string" ? new Pool({ connectionString: connection }) : new Pool(connection);
		return construct(instance, drizzleConfig);
	}
	return construct(params[0], params[1]);
}
((drizzle2) => {
	function mock(config) {
		return construct({}, config);
	}
	drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

//#endregion
//#region schema/relations.ts
const schemaTables = {
	walletPass,
	walletPassType,
	walletPassContent,
	walletRegistration,
	walletDevice,
	walletCert,
	walletApnsKey,
	region,
	regionCountry,
	locationType,
	location,
	address,
	organization,
	currency
};
const relations = defineRelations(schemaTables, (r) => ({
	walletPass: {
		passType: r.one.walletPassType({
			from: r.walletPass.passTypeIdentifier,
			to: r.walletPassType.passTypeIdentifier
		}),
		content: r.one.walletPassContent({
			from: r.walletPass.id,
			to: r.walletPassContent.passId
		}),
		registrations: r.many.walletRegistration({
			from: r.walletPass.id,
			to: r.walletRegistration.passId
		})
	},
	walletRegistration: {
		device: r.one.walletDevice({
			from: r.walletRegistration.deviceLibraryIdentifier,
			to: r.walletDevice.deviceLibraryIdentifier
		}),
		pass: r.one.walletPass({
			from: r.walletRegistration.passId,
			to: r.walletPass.id
		})
	},
	walletPassType: {
		cert: r.one.walletCert({
			from: r.walletPassType.certRef,
			to: r.walletCert.certRef
		}),
		passes: r.many.walletPass({
			from: r.walletPassType.passTypeIdentifier,
			to: r.walletPass.passTypeIdentifier
		})
	},
	walletDevice: { registrations: r.many.walletRegistration({
		from: r.walletDevice.deviceLibraryIdentifier,
		to: r.walletRegistration.deviceLibraryIdentifier
	}) },
	walletApnsKey: { certByTeam: r.one.walletCert({
		from: r.walletApnsKey.teamId,
		to: r.walletCert.teamId
	}) },
	walletCert: {
		passTypes: r.many.walletPassType({
			from: r.walletCert.certRef,
			to: r.walletPassType.certRef
		}),
		apnsKeys: r.many.walletApnsKey({
			from: r.walletCert.teamId,
			to: r.walletApnsKey.teamId
		})
	},
	walletPassContent: { pass: r.one.walletPass({
		from: r.walletPassContent.passId,
		to: r.walletPass.id
	}) },
	region: { countries: r.many.regionCountry({
		from: r.region.id,
		to: r.regionCountry.regionId
	}) },
	regionCountry: {
		region: r.one.region({
			from: r.regionCountry.regionId,
			to: r.region.id
		}),
		addresses: r.many.address({
			from: r.regionCountry.iso2,
			to: r.address.countryCode
		})
	},
	locationType: { locations: r.many.location({
		from: r.locationType.id,
		to: r.location.locationTypeId
	}) },
	location: {
		type: r.one.locationType({
			from: r.location.locationTypeId,
			to: r.locationType.id
		}),
		parent: r.one.location({
			from: r.location.locationParentId,
			to: r.location.id
		}),
		children: r.many.location({
			from: r.location.id,
			to: r.location.locationParentId
		})
	},
	address: { country: r.one.regionCountry({
		from: r.address.countryCode,
		to: r.regionCountry.iso2
	}) }
}));

//#endregion
//#region db/index.ts
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? "";
if (!DATABASE_URL) throw new Error("DATABASE_URL (or NEON_DATABASE_URL) is not set in the environment");
neonConfig.webSocketConstructor = globalThis.WebSocket ?? WebSocket;
const client = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(client, {
	schema,
	relations
});

//#endregion
export { db };