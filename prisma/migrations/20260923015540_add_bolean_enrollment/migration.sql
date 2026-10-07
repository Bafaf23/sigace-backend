-- AlterTable
ALTER TABLE `schools` ADD COLUMN `is_enrollment_open` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `students` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teachers` ALTER COLUMN `updated_at` DROP DEFAULT;
