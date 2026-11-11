CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suggestions_body_check" CHECK (char_length("suggestions"."body") between 1 and 2000),
	CONSTRAINT "suggestions_email_check" CHECK (char_length("suggestions"."email") between 1 and 254)
);
