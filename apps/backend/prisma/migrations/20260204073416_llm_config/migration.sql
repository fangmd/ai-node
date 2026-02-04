-- AlterTable
ALTER TABLE `session` ADD COLUMN `llm_config_id` BIGINT NULL;

-- CreateTable
CREATE TABLE `llm_config` (
    `id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `base_url` VARCHAR(191) NOT NULL,
    `model_id` VARCHAR(191) NOT NULL,
    `api_key_enc` VARCHAR(191) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    INDEX `llm_config_user_id_idx`(`user_id`),
    UNIQUE INDEX `llm_config_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
