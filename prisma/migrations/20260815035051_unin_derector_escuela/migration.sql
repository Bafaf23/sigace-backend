/*
  Warnings:

  - A unique constraint covering the columns `[director_id]` on the table `school` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `school` ADD COLUMN `director_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `school_director_id_key` ON `school`(`director_id`);

-- AddForeignKey
ALTER TABLE `school` ADD CONSTRAINT `school_director_id_fkey` FOREIGN KEY (`director_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
