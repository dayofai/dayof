CREATE TYPE "public"."actor_type_enum" AS ENUM('user', 'system', 'api_token');--> statement-breakpoint
CREATE TYPE "public"."wallet_ticket_style_enum" AS ENUM('event', 'coupon', 'generic');--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"address_name" text,
	"is_default_shipping" boolean DEFAULT false NOT NULL,
	"is_default_billing" boolean DEFAULT false NOT NULL,
	"company" text,
	"first_name" text,
	"last_name" text,
	"address_1" text NOT NULL,
	"address_2" text,
	"city" text NOT NULL,
	"country_code" text NOT NULL,
	"province" text,
	"postal_code" text NOT NULL,
	"longitude" double precision,
	"latitude" double precision,
	"original_phone_number" text NOT NULL,
	"e164_phone_number" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" "actor_type_enum" DEFAULT 'user' NOT NULL,
	"user_id" text,
	"org_id" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean,
	"is_anonymous" boolean,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency" (
	"code" text PRIMARY KEY NOT NULL,
	"base" integer DEFAULT 10 NOT NULL,
	"exponent" integer DEFAULT 2 NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"location_parent_id" text,
	"name" text NOT NULL,
	"handle" text NOT NULL,
	"description" text,
	"location_type_id" text NOT NULL,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" "actor_type_enum" DEFAULT 'user' NOT NULL,
	"user_id" text,
	"org_id" text,
	CONSTRAINT "location_handle_org_unique" UNIQUE("handle","org_id")
);
--> statement-breakpoint
CREATE TABLE "location_type" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "region" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"name" text NOT NULL,
	"currency_code" text NOT NULL,
	"automatic_taxes" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "region_country" (
	"iso_2" text PRIMARY KEY NOT NULL,
	"iso_3" text,
	"num_code" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"region_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_apns_key" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"key_ref" text NOT NULL,
	"team_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"key_id" text NOT NULL,
	"encrypted_p8_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_cert" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"cert_ref" text NOT NULL,
	"description" text,
	"is_enhanced" boolean DEFAULT false NOT NULL,
	"team_id" text NOT NULL,
	"encrypted_bundle" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uq_wallet_cert_cert_ref" UNIQUE("cert_ref")
);
--> statement-breakpoint
CREATE TABLE "wallet_device" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"device_library_identifier" text NOT NULL,
	"push_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uq_wallet_device_library_identifier" UNIQUE("device_library_identifier")
);
--> statement-breakpoint
CREATE TABLE "wallet_pass" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"serial_number" text NOT NULL,
	"authentication_token" text NOT NULL,
	"ticket_style" "wallet_ticket_style_enum",
	"poster" boolean DEFAULT false NOT NULL,
	"etag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" "actor_type_enum" DEFAULT 'user' NOT NULL,
	"user_id" text,
	"org_id" text
);
--> statement-breakpoint
CREATE TABLE "wallet_pass_content" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"pass_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" "actor_type_enum" DEFAULT 'user' NOT NULL,
	"user_id" text,
	"org_id" text
);
--> statement-breakpoint
CREATE TABLE "wallet_pass_type" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"cert_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_registration" (
	"id" text PRIMARY KEY DEFAULT nanoid() NOT NULL,
	"pass_id" text NOT NULL,
	"device_library_identifier" text NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"serial_number" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"actor_type" "actor_type_enum" DEFAULT 'user' NOT NULL,
	"user_id" text,
	"org_id" text
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_country_code_region_country_iso_2_fk" FOREIGN KEY ("country_code") REFERENCES "public"."region_country"("iso_2") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_location_parent_id_location_id_fk" FOREIGN KEY ("location_parent_id") REFERENCES "public"."location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_location_type_id_location_type_id_fk" FOREIGN KEY ("location_type_id") REFERENCES "public"."location_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region" ADD CONSTRAINT "region_currency_code_currency_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_country" ADD CONSTRAINT "region_country_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_pass" ADD CONSTRAINT "wallet_pass_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_pass" ADD CONSTRAINT "wallet_pass_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_pass_content" ADD CONSTRAINT "wallet_pass_content_pass_id_wallet_pass_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."wallet_pass"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wallet_pass_content" ADD CONSTRAINT "wallet_pass_content_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_pass_content" ADD CONSTRAINT "wallet_pass_content_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_pass_type" ADD CONSTRAINT "wallet_pass_type_cert_ref_wallet_cert_cert_ref_fk" FOREIGN KEY ("cert_ref") REFERENCES "public"."wallet_cert"("cert_ref") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_registration" ADD CONSTRAINT "wallet_registration_pass_id_wallet_pass_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."wallet_pass"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wallet_registration" ADD CONSTRAINT "wallet_registration_device_library_identifier_wallet_device_device_library_identifier_fk" FOREIGN KEY ("device_library_identifier") REFERENCES "public"."wallet_device"("device_library_identifier") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_registration" ADD CONSTRAINT "wallet_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_registration" ADD CONSTRAINT "wallet_registration_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_country_code_idx" ON "address" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "location_location_parent_id_idx" ON "location" USING btree ("location_parent_id");--> statement-breakpoint
CREATE INDEX "location_location_type_id_idx" ON "location" USING btree ("location_type_id");--> statement-breakpoint
CREATE INDEX "region_currency_code_idx" ON "region" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "region_country_region_id_idx" ON "region_country" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_apns_key_team_active" ON "wallet_apns_key" USING btree ("team_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_apns_key_team_key" ON "wallet_apns_key" USING btree ("team_id","key_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_apns_key_key_ref" ON "wallet_apns_key" USING btree ("key_ref");--> statement-breakpoint
CREATE INDEX "idx_wallet_certs_enhanced" ON "wallet_cert" USING btree ("is_enhanced");--> statement-breakpoint
CREATE INDEX "idx_wallet_certs_team_id" ON "wallet_cert" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_pass_updated_at" ON "wallet_pass" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_wallet_pass_auth_token" ON "wallet_pass" USING btree ("authentication_token");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_pass_type_serial" ON "wallet_pass" USING btree ("pass_type_identifier","serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_pass_content_pass_id" ON "wallet_pass_content" USING btree ("pass_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_pass_type_cert_ref" ON "wallet_pass_type" USING btree ("cert_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_pass_type_identifier" ON "wallet_pass_type" USING btree ("pass_type_identifier");--> statement-breakpoint
CREATE INDEX "idx_wallet_registration_pass_ref" ON "wallet_registration" USING btree ("pass_type_identifier","serial_number");--> statement-breakpoint
CREATE INDEX "idx_wallet_registration_device_active" ON "wallet_registration" USING btree ("device_library_identifier","active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_wallet_registration_device_pass" ON "wallet_registration" USING btree ("device_library_identifier","pass_id");--> statement-breakpoint
CREATE INDEX "wallet_registration_pass_id_idx" ON "wallet_registration" USING btree ("pass_id");