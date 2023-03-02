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
-- Table structure for table `pan_limit`
--

DROP TABLE IF EXISTS `pan_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pan_limit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime(6) NOT NULL,
  `update_time` datetime(6) NOT NULL,
  `remark` longtext NOT NULL,
  `limit_name` varchar(50) NOT NULL,
  `limit_key` varchar(50) NOT NULL,
  `create_by_id` int DEFAULT NULL,
  `update_by_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `limit_key` (`limit_key`),
  KEY `pan_limit_create_by_id_1658fc3e_fk_auth_user_id` (`create_by_id`),
  KEY `pan_limit_update_by_id_7c9d389d_fk_auth_user_id` (`update_by_id`),
  CONSTRAINT `pan_limit_create_by_id_1658fc3e_fk_auth_user_id` FOREIGN KEY (`create_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `pan_limit_update_by_id_7c9d389d_fk_auth_user_id` FOREIGN KEY (`update_by_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pan_limit`
--

LOCK TABLES `pan_limit` WRITE;
/*!40000 ALTER TABLE `pan_limit` DISABLE KEYS */;
INSERT INTO `pan_limit` VALUES (1,'2021-12-07 10:23:48.512287','2021-12-07 10:43:45.430604','','云盘容量','storage',1,1),(5,'2023-01-19 06:01:23.714546','2023-01-19 06:01:23.714546','','预览限制','preview',1,1);
/*!40000 ALTER TABLE `pan_limit` ENABLE KEYS */;
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
