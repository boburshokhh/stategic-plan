-- CreateTable
CREATE TABLE "report_items" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "ReportStatus" NOT NULL DEFAULT 'not_started',
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_item_assignees" (
    "id" TEXT NOT NULL,
    "report_item_id" TEXT NOT NULL,
    "user_id" TEXT,
    "external_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_item_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_attachments" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "report_item_id" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_items_report_id_sort_order_idx" ON "report_items"("report_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "report_item_assignees_report_item_id_user_id_key" ON "report_item_assignees"("report_item_id", "user_id");

-- CreateIndex
CREATE INDEX "report_attachments_report_id_idx" ON "report_attachments"("report_id");

-- CreateIndex
CREATE INDEX "report_attachments_report_item_id_idx" ON "report_attachments"("report_item_id");

-- AddForeignKey
ALTER TABLE "report_items" ADD CONSTRAINT "report_items_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "quarterly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_item_assignees" ADD CONSTRAINT "report_item_assignees_report_item_id_fkey" FOREIGN KEY ("report_item_id") REFERENCES "report_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_item_assignees" ADD CONSTRAINT "report_item_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "quarterly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_report_item_id_fkey" FOREIGN KEY ("report_item_id") REFERENCES "report_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
