ALTER TABLE "wallet_pass" ADD COLUMN "event_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_wallet_pass_event_id" ON "wallet_pass" USING btree ("event_id");