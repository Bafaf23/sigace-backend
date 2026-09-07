-- CreateTable
CREATE TABLE `user_schools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `SIG` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_schools` ADD CONSTRAINT `user_schools_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_schools` ADD CONSTRAINT `user_schools_SIG_fkey` FOREIGN KEY (`SIG`) REFERENCES `schools`(`SIG`) ON DELETE CASCADE ON UPDATE CASCADE;
