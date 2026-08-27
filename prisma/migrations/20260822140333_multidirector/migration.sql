/*
  Warnings:

  - You are about to drop the column `director_id` on the `schools` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `schools` DROP FOREIGN KEY `schools_director_id_fkey`;

-- DropIndex
DROP INDEX `schools_director_id_key` ON `schools`;

-- AlterTable
ALTER TABLE `schools` DROP COLUMN `director_id`;
