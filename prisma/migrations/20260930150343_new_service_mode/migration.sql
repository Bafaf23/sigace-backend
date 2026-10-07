/*
  Warnings:

  - You are about to drop the column `expires_at` on the `services` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `services` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `school_service` ADD COLUMN `expires_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `services` DROP COLUMN `expires_at`,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `price` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `students` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teachers` ALTER COLUMN `updated_at` DROP DEFAULT;
