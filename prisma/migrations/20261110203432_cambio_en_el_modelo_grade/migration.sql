/*
  Warnings:

  - The primary key for the `grades` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_student` on the `grades` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tuition_number,id_evaluation]` on the table `grades` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `grades` DROP FOREIGN KEY `grades_id_student_fkey`;

-- DropIndex
DROP INDEX `grades_id_student_id_evaluation_key` ON `grades`;

-- AlterTable
ALTER TABLE `grades` DROP PRIMARY KEY,
    DROP COLUMN `id_student`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `students` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teachers` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX `grades_tuition_number_id_evaluation_key` ON `grades`(`tuition_number`, `id_evaluation`);

-- AddForeignKey
ALTER TABLE `grades` ADD CONSTRAINT `grades_tuition_number_fkey` FOREIGN KEY (`tuition_number`) REFERENCES `students`(`tuition_number`) ON DELETE RESTRICT ON UPDATE CASCADE;
