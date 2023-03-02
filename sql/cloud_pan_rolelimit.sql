-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: cloud
-- ------------------------------------------------------
-- Server version	8.0.19

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pan_rolelimit`
--

DROP TABLE IF EXISTS `pan_rolelimit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pan_rolelimit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime(6) NOT NULL,
  `update_time` datetime(6) NOT NULL,
  `remark` longtext NOT NULL,
  `value` bigint NOT NULL,
  `create_by_id` int DEFAULT NULL,
  `limit_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `update_by_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pan_rolelimit_create_by_id_f7391961_fk_auth_user_id` (`create_by_id`),
  KEY `pan_rolelimit_limit_id_f8b193ad_fk_pan_limit_id` (`limit_id`),
  KEY `pan_rolelimit_role_id_6f78abcf_fk_pan_role_id` (`role_id`),
  KEY `pan_rolelimit_update_by_id_6710b13d_fk_auth_user_id` (`update_by_id`),
  CONSTRAINT `pan_rolelimit_create_by_id_f7391961_fk_auth_user_id` FOREIGN KEY (`create_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `pan_rolelimit_limit_id_f8b193ad_fk_pan_limit_id` FOREIGN KEY (`limit_id`) REFERENCES `pan_limit` (`id`),
  CONSTRAINT `pan_rolelimit_role_id_6f78abcf_fk_pan_role_id` FOREIGN KEY (`role_id`) REFERENCES `pan_role` (`id`),
  CONSTRAINT `pan_rolelimit_update_by_id_6710b13d_fk_auth_user_id` FOREIGN KEY (`update_by_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pan_rolelimit`
--

LOCK TABLES `pan_rolelimit` WRITE;
/*!40000 ALTER TABLE `pan_rolelimit` DISABLE KEYS */;
INSERT INTO `pan_rolelimit` VALUES (1,'2021-12-07 10:24:51.424723','2023-01-19 06:05:18.544467','',8589934592,1,1,1,1),(4,'2021-12-07 10:26:38.768117','2021-12-07 10:26:38.768117','',8589934592,1,1,2,1),(7,'2021-12-07 10:27:48.051268','2021-12-07 10:27:48.051268','',5368709120,1,1,3,1),(13,'2023-01-19 06:02:36.161304','2023-01-19 06:02:36.161304','',20971520,1,5,3,1),(14,'2023-01-19 06:02:57.683110','2023-01-19 06:02:57.683110','',41943040,1,5,2,1),(15,'2023-01-19 06:03:11.998826','2023-01-19 06:03:11.998826','',41943040,1,5,1,1);
/*!40000 ALTER TABLE `pan_rolelimit` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-01-28 10:52:19
