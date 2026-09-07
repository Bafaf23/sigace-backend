/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `schools_subdomain_key` ON `schools`(`subdomain`);
