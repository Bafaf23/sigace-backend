/*
  Warnings:

  - The primary key for the `grades` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `grades` table. All the data in the column will be lost.
  - Added the required column `tuition_number` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `grades` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `tuition_number` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`tuition_number`);

-- AlterTable
ALTER TABLE `students` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teachers` ALTER COLUMN `updated_at` DROP DEFAULT;
