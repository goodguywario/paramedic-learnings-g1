CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_type" text NOT NULL,
	"submitted_by" text DEFAULT 'system' NOT NULL,
	"topic_id" integer,
	"ai_summary" text,
	"suggested_topic_id" integer,
	"conflict_flag" boolean,
	"conflict_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_suggested_topic_id_topics_id_fk" FOREIGN KEY ("suggested_topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;