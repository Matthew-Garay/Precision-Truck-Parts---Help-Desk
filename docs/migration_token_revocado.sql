USE `precision_helpdesk`;

CREATE TABLE IF NOT EXISTS `token_revocado` (
  `id_revocado` int NOT NULL AUTO_INCREMENT,
  `jti` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_empleado` int NOT NULL,
  `expira_en` timestamp NOT NULL,
  PRIMARY KEY (`id_revocado`),
  UNIQUE KEY `uq_jti` (`jti`),
  KEY `idx_expira_en` (`expira_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
