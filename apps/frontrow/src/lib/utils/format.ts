import type { Dinero } from "dinero.js";
import { toDecimal } from "dinero.js";

const COMMA_SPACE_DIGIT = /, (\d)/;

export function formatMoney(
	amount: Dinero<number>,
	currency: string,
	locale = "en-US",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(Number.parseFloat(toDecimal(amount)));
}

export function getUserLocale(defaultLocale = "en-US"): string {
	if (
		typeof navigator !== "undefined" &&
		typeof navigator.language === "string" &&
		navigator.language
	) {
		return navigator.language;
	}
	return defaultLocale;
}

export function formatDate(
	isoString: string,
	timeZone: string,
	locale = "en-US",
	options?: Intl.DateTimeFormatOptions,
): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		dateStyle: "medium",
		timeStyle: "short",
		...options,
	}).format(new Date(isoString));
}

export function formatEventDate(
	isoString: string,
	timeZone: string,
	locale = "en-US",
): string {
	const formatted = new Intl.DateTimeFormat(locale, {
		timeZone,
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(new Date(isoString));

	return formatted.replace(COMMA_SPACE_DIGIT, " · $1");
}

export function pluralizeTickets(count: number): string {
	return count === 1 ? "ticket" : "tickets";
}

export function formatAvailabilityLabel(
	endsAt: string,
	timeZone: string,
	locale = "en-US",
): string {
	const formatted = new Intl.DateTimeFormat(locale, {
		timeZone,
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(new Date(endsAt));

	return `Available until ${formatted}`;
}

/**
 * Format date for unavailable reason messages
 * Used in .fn.select() callbacks
 */
export function formatUnavailableDate(
	isoString: string,
	timeZone: string,
	locale = "en-US",
): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(new Date(isoString));
}
