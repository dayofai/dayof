-- Migration: add event_id to wallet_pass and backfill with '1'
-- Up
ALTER TABLE "wallet_pass" ADD COLUMN "event_id" text;
UPDATE "wallet_pass" SET "event_id" = '1' WHERE "event_id" IS NULL;
ALTER TABLE "wallet_pass" ALTER COLUMN "event_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_wallet_pass_event_id" ON "wallet_pass" ("event_id");
-- (No Down migration provided for dev rapid iteration)
