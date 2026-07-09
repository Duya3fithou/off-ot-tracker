-- Replace the single `DONE` task status with three stage-specific done states.
-- Existing `DONE` rows are mapped to `DONE_PRODUCTION` (closest to "fully done").
BEGIN;

CREATE TYPE "TaskStatus_new" AS ENUM ('DONE_LOCAL', 'DONE_STAGING', 'DONE_PRODUCTION', 'IN_PROGRESS');

ALTER TABLE "OtRequest" ALTER COLUMN "taskStatus" TYPE "TaskStatus_new" USING (
  CASE "taskStatus"::text
    WHEN 'DONE' THEN 'DONE_PRODUCTION'
    ELSE "taskStatus"::text
  END::"TaskStatus_new"
);

ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";

COMMIT;
