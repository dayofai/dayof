DO $$ BEGIN
 CREATE TYPE "public"."ticket_style_enum" AS ENUM('coupon', 'event', 'storeCard', 'generic');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apns_keys" (
	"key_ref" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"key_id" text NOT NULL,
	"encrypted_p8_key" text NOT NULL,
	"iv" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certs" (
	"cert_ref" text PRIMARY KEY NOT NULL,
	"description" text,
	"is_enhanced" boolean DEFAULT false NOT NULL,
	"team_id" text NOT NULL,
	"encrypted_bundle" text NOT NULL,
	"iv" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"device_library_identifier" text PRIMARY KEY NOT NULL,
	"push_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pass_types" (
	"pass_type_identifier" text PRIMARY KEY NOT NULL,
	"cert_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passes" (
	"serial_number" text NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"authentication_token" text NOT NULL,
	"ticket_style" "ticket_style_enum",
	"poster" boolean DEFAULT false NOT NULL,
	"etag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passes_pass_type_identifier_serial_number_pk" PRIMARY KEY("pass_type_identifier","serial_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registrations" (
	"device_library_identifier" text NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"serial_number" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_device_library_identifier_pass_type_identifier_serial_number_pk" PRIMARY KEY("device_library_identifier","pass_type_identifier","serial_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pass_types" ADD CONSTRAINT "pass_types_cert_ref_certs_cert_ref_fk" FOREIGN KEY ("cert_ref") REFERENCES "public"."certs"("cert_ref") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passes" ADD CONSTRAINT "passes_pass_type_identifier_pass_types_pass_type_identifier_fk" FOREIGN KEY ("pass_type_identifier") REFERENCES "public"."pass_types"("pass_type_identifier") ON DELETE no action ON UPDATE restrict;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_device_library_identifier_devices_device_library_identifier_fk" FOREIGN KEY ("device_library_identifier") REFERENCES "public"."devices"("device_library_identifier") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_pass_type_identifier_serial_number_passes_pass_type_identifier_serial_number_fk" FOREIGN KEY ("pass_type_identifier","serial_number") REFERENCES "public"."passes"("pass_type_identifier","serial_number") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_apns_keys_team_id" ON "apns_keys" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_certs_enhanced" ON "certs" USING btree ("is_enhanced");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pass_types_cert_ref" ON "pass_types" USING btree ("cert_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_passes_last_updated" ON "passes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_registrations_pass_ref" ON "registrations" USING btree ("pass_type_identifier","serial_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_registrations_device_active" ON "registrations" USING btree ("device_library_identifier","active");