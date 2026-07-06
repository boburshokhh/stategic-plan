-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "SubtaskDepartmentRole" AS ENUM ('owner', 'participant');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('dept_user', 'direction_head', 'admin');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('draft', 'approved');

-- CreateTable
CREATE TABLE "strategic_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year_from" INTEGER NOT NULL,
    "year_to" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_year_themes" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "direction_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "theme_title" TEXT NOT NULL,

    CONSTRAINT "plan_year_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "direction_id" TEXT NOT NULL,
    "number" INTEGER,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "expected_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtask_departments" (
    "id" TEXT NOT NULL,
    "subtask_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role" "SubtaskDepartmentRole" NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subtask_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_periods" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "collection_start" TIMESTAMP(3) NOT NULL,
    "collection_end" TIMESTAMP(3) NOT NULL,
    "aggregation_start" TIMESTAMP(3) NOT NULL,
    "aggregation_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarterly_reports" (
    "id" TEXT NOT NULL,
    "subtask_id" TEXT NOT NULL,
    "reporting_period_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "ReportStatus" NOT NULL DEFAULT 'not_started',
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarterly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_revisions" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "department_id" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'dept_user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direction_summaries" (
    "id" TEXT NOT NULL,
    "direction_id" TEXT NOT NULL,
    "reporting_period_id" TEXT NOT NULL,
    "completed_items" TEXT NOT NULL,
    "deviations" TEXT,
    "risks" TEXT,
    "status" "SummaryStatus" NOT NULL DEFAULT 'draft',
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direction_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excel_import_runs" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "raw_cell" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "excel_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_year_themes_direction_id_year_key" ON "plan_year_themes"("direction_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "directions_plan_id_code_key" ON "directions"("plan_id", "code");

-- CreateIndex
CREATE INDEX "tasks_direction_id_sort_order_idx" ON "tasks"("direction_id", "sort_order");

-- CreateIndex
CREATE INDEX "subtasks_task_id_year_idx" ON "subtasks"("task_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subtask_departments_subtask_id_department_id_key" ON "subtask_departments"("subtask_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_periods_year_quarter_key" ON "reporting_periods"("year", "quarter");

-- CreateIndex
CREATE INDEX "quarterly_reports_department_id_reporting_period_id_idx" ON "quarterly_reports"("department_id", "reporting_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_reports_subtask_id_reporting_period_id_department_key" ON "quarterly_reports"("subtask_id", "reporting_period_id", "department_id");

-- CreateIndex
CREATE INDEX "report_revisions_report_id_idx" ON "report_revisions"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "direction_summaries_direction_id_reporting_period_id_key" ON "direction_summaries"("direction_id", "reporting_period_id");

-- CreateIndex
CREATE INDEX "excel_import_runs_entity_type_entity_id_idx" ON "excel_import_runs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "plan_year_themes" ADD CONSTRAINT "plan_year_themes_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_year_themes" ADD CONSTRAINT "plan_year_themes_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "directions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directions" ADD CONSTRAINT "directions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "directions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtask_departments" ADD CONSTRAINT "subtask_departments_subtask_id_fkey" FOREIGN KEY ("subtask_id") REFERENCES "subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtask_departments" ADD CONSTRAINT "subtask_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_subtask_id_fkey" FOREIGN KEY ("subtask_id") REFERENCES "subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "quarterly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_summaries" ADD CONSTRAINT "direction_summaries_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "directions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_summaries" ADD CONSTRAINT "direction_summaries_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "reporting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_summaries" ADD CONSTRAINT "direction_summaries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
