CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" serial NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
