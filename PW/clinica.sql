CREATE DATABASE IF NOT EXISTS clinica;
USE clinica;



-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: clinica
-- ------------------------------------------------------
-- Server version	8.0.12

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
-- Table structure for table `anotacion_historia`
--

DROP TABLE IF EXISTS `anotacion_historia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anotacion_historia` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `historia_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `descripcion` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anotacion_historia`
--

LOCK TABLES `anotacion_historia` WRITE;
/*!40000 ALTER TABLE `anotacion_historia` DISABLE KEYS */;
/*!40000 ALTER TABLE `anotacion_historia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cita`
--

DROP TABLE IF EXISTS `cita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `mascota_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `estado` varchar(20) NOT NULL,
  `motivo` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cita`
--

LOCK TABLES `cita` WRITE;
/*!40000 ALTER TABLE `cita` DISABLE KEYS */;
INSERT INTO `cita` VALUES (1,1,1,3,'2025-10-16 21:30:00','programada','Consulta general'),(2,2,11,3,'2024-06-21 14:30:00','programada','Consulta odontologica'),(3,3,3,2,'2024-06-20 18:30:00','programada','Consulta general');
/*!40000 ALTER TABLE `cita` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `cliente_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo_documento` varchar(10) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` char(1) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `activo` tinyint(1) NOT NULL,
  PRIMARY KEY (`cliente_id`),
  UNIQUE KEY `id` (`cliente_id`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `idx_paciente_documento` (`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (1,1,'CC','100000001','Juan','Pérez López','1990-05-12','M','3001112233','Calle 10 #12-34',1),(2,2,'CC','100000002','María','Gómez Rodríguez','1985-08-22','F','3012223344','Carrera 15 #20-10',1),(3,3,'TI','900000003','Andrés','Martínez Díaz','2005-03-18','M','3023334455','Av. Boyacá #45-67',1),(4,4,'CC','100000004','Laura','Hernández Ruiz','1992-12-01','F','3034445566','Calle 5 #7-89',1),(5,5,'CC','100000005','Carlos','Ramírez Torres','1980-07-30','M','3045556677','Carrera 8 #15-20',1),(6,6,'CE','200000006','Ana','Castro Moreno','1998-01-25','F','3056667788','Diagonal 12 #25-50',1),(7,7,'CC','100000007','Santiago','Moreno Vargas','1995-09-14','M','3067778899','Transversal 20 #40-22',1),(8,8,'CC','100000008','Paula','Ríos Fernández','1987-11-10','F','3078889900','Calle 22 #18-45',1),(9,9,'TI','900000009','Felipe','Gutiérrez Méndez','2006-06-06','M','3089990011','Carrera 50 #60-12',1),(10,10,'CC','100000010','Diana','Salazar Peña','1993-04-21','F','3090001122','Av. Caracas #100-50',1);
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especializacion`
--

DROP TABLE IF EXISTS `especializacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especializacion` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `codigo_especializacion` varchar(10) NOT NULL DEFAULT '""',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `codigo_especializacion_UNIQUE` (`codigo_especializacion`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especializacion`
--

LOCK TABLES `especializacion` WRITE;
/*!40000 ALTER TABLE `especializacion` DISABLE KEYS */;
INSERT INTO `especializacion` VALUES (1,'Cardiología 2','Especialización médica centrada en el diagnóstico y tratamiento de enfermedades del corazón y otras enfermedades asociadas.','COD_100'),(2,'Neurología','Se ocupa de los trastornos del sistema nervioso central y periférico.','COD_02'),(3,'Pediatría','Atención médica especializada en niños y adolescentes.','COD_03'),(4,'Oncología','Estudio y tratamiento de diferentes tipos de cáncer.','COD_04'),(5,'Dermatología','Diagnóstico y tratamiento de enfermedades de la piel.','COD_05'),(6,'Ginecología','Enfocada en el sistema reproductor femenino.','COD_06'),(7,'Urología','Tratamiento del sistema urinario y el sistema reproductor masculino.','COD_07'),(8,'Psiquiatría','Estudio y tratamiento de enfermedades mentales y emocionales.','COD_08'),(9,'Oftalmología','Especialización en la salud ocular y la visión.','COD_09'),(10,'Otorrinolaringología','Se encarga de enfermedades de oído, nariz y garganta.','COD_10'),(11,'Traumatología','Tratamiento de lesiones y enfermedades del sistema musculoesquelético.','COD_11'),(12,'Anestesiología','Responsable de la anestesia y control del dolor durante procedimientos quirúrgicos.','COD_12'),(13,'Reumatología','Estudia enfermedades autoinmunes y musculoesqueléticas.','COD_13'),(14,'Endocrinología','Especialización en glándulas y trastornos hormonales.','COD_14'),(15,'Gastroenterología','Diagnóstico y tratamiento de enfermedades del aparato digestivo.','COD_15');
/*!40000 ALTER TABLE `especializacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_medica`
--

DROP TABLE IF EXISTS `formula_medica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_medica` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cita_id` int(11) NOT NULL,
  `medicamento_id` int(11) NOT NULL,
  `dosis` text NOT NULL,
  `indicaciones` text,
  `fecha_creacion_registro` datetime NOT NULL,
  `fecha_actualizacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_medica`
--

LOCK TABLES `formula_medica` WRITE;
/*!40000 ALTER TABLE `formula_medica` DISABLE KEYS */;
INSERT INTO `formula_medica` VALUES (1,1,5,'800 mg cada 12 horas','Tomar después de las comidas durante 7 días','2025-09-17 15:17:32',NULL),(2,2,6,'500 mg cada 8 horas','Tomar después de las comidas durante 7 días','2025-09-20 11:52:42',NULL),(4,1,5,'Una pastilla cada 12 horas.','Cambiando Cualquier cosa','2025-10-30 21:09:02','2025-10-30 21:21:51'),(5,3,2,'Una pastilla cada 12 horas.','Tomar despues del almuerzo y con abundante liquido','2025-11-01 10:21:04',NULL);
/*!40000 ALTER TABLE `formula_medica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historia_medica`
--

DROP TABLE IF EXISTS `historia_medica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historia_medica` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `paciente_id` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historia_medica`
--

LOCK TABLES `historia_medica` WRITE;
/*!40000 ALTER TABLE `historia_medica` DISABLE KEYS */;
/*!40000 ALTER TABLE `historia_medica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascota`
--

DROP TABLE IF EXISTS `mascota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascota` (
  `mascota_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_mascota` varchar(100) NOT NULL,
  `edad` int(11) NOT NULL,
  `raza_id` int(11) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  PRIMARY KEY (`mascota_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascota`
--

LOCK TABLES `mascota` WRITE;
/*!40000 ALTER TABLE `mascota` DISABLE KEYS */;
INSERT INTO `mascota` VALUES (1,'Max',3,1,'2026-08-01 08:15:00','2026-08-15 10:20:00',1),(2,'Luna',2,2,'2026-08-01 09:30:00','2026-08-16 11:00:00',2),(3,'Rocky',5,1,'2026-08-02 10:00:00',NULL,3),(4,'Bella',4,2,'2026-08-02 11:20:00','2026-08-17 09:15:00',4),(5,'Toby',1,1,'2026-08-03 08:45:00',NULL,5),(6,'Nala',6,2,'2026-08-03 14:10:00','2026-08-18 14:30:00',6),(7,'Coco',3,1,'2026-08-04 09:00:00',NULL,7),(8,'Simba',2,2,'2026-08-04 15:30:00','2026-08-19 16:00:00',8),(9,'Milo',7,1,'2026-08-05 10:15:00',NULL,9),(10,'Maya',4,2,'2026-08-05 16:00:00','2026-08-20 10:00:00',10),(11,'Thor',5,1,'2026-08-06 08:30:00',NULL,1),(12,'Kira',2,2,'2026-08-06 13:45:00','2026-08-21 13:20:00',2),(13,'Bruno',8,1,'2026-08-07 09:20:00',NULL,3),(14,'Canela',3,2,'2026-08-07 14:30:00','2026-08-22 15:10:00',4),(15,'Zeus',6,1,'2026-08-08 10:45:00',NULL,5),(16,'Sasha',1,2,'2026-08-08 16:15:00','2026-08-23 11:45:00',6),(17,'Duke',4,1,'2026-08-09 08:00:00',NULL,7),(18,'Mia',5,2,'2026-08-09 11:30:00','2026-08-24 09:30:00',8),(19,'Oliver',2,1,'2026-08-10 13:00:00',NULL,9),(20,'Lola',7,2,'2026-08-10 15:45:00','2026-08-25 14:00:00',10);
/*!40000 ALTER TABLE `mascota` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicamento`
--

DROP TABLE IF EXISTS `medicamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicamento` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `presentacion` varchar(100) DEFAULT NULL,
  `fecha_compra` date NOT NULL,
  `fecha_vence` date NOT NULL,
  `fecha_creacion_registro` datetime NOT NULL,
  `fecha_modificacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicamento`
--

LOCK TABLES `medicamento` WRITE;
/*!40000 ALTER TABLE `medicamento` DISABLE KEYS */;
INSERT INTO `medicamento` VALUES (2,'Paracetamol','Analgésico y antipirético','Tabletas 500mg','2024-06-01','2026-06-01','2025-09-11 20:56:13','2025-09-13 12:49:23'),(5,'Paracetamol Inyectable','Analgésico y antipirético','Tabletas 1200mg','2024-06-01','2026-06-01','2025-09-13 10:58:40','2025-09-13 12:49:23'),(6,'Paracetamol Solución','Analgésico y antipirético','Tabletas 800mg','2024-06-01','2026-06-01','2025-09-13 12:27:12','2025-09-13 12:49:23');
/*!40000 ALTER TABLE `medicamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medico`
--

DROP TABLE IF EXISTS `medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medico` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(10) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `registro_profesional` varchar(50) NOT NULL,
  `especializacion_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `registro_profesional` (`registro_profesional`),
  KEY `idx_medico_documento` (`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medico`
--

LOCK TABLES `medico` WRITE;
/*!40000 ALTER TABLE `medico` DISABLE KEYS */;
INSERT INTO `medico` VALUES (1,'CC','1001001001','Juan','Pérez Gómez','3001112233','RP-1001',13),(2,'CC','1001001002','María','Rodríguez López','3001112234','RP-1002',2),(3,'CC','1001001003','Carlos','Martínez Ruiz','3001112235','RP-1003',3),(4,'CC','1001001004','Laura','Fernández Díaz','3001112236','RP-1004',4),(5,'CC','1001001005','Andrés','Ramírez Soto','3001112237','RP-1005',5),(6,'CC','1001001006','Diana','Gómez Torres','3001112238','RP-1006',6),(7,'CC','1001001007','Ricardo','Jiménez Vargas','3001112239','RP-1007',7),(8,'CC','1001001008','Patricia','Hernández Ríos','3001112240','RP-1008',8),(9,'CC','1001001009','Santiago','Morales Castro','3001112241','RP-1009',9),(10,'CC','1001001010','Natalia','García Mendoza','3001112242','RP-1010',9),(11,'CC','88274388','Giovanni','Mora','5711322','1234656789100',8),(12,'CC','12345678','Edson Arantes','Do nascimento','3207729661','RP-10011',12),(13,'CC','12345123','Giovanni','Mora Jaimes','3207729661','001RP1234',12);
/*!40000 ALTER TABLE `medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raza`
--

DROP TABLE IF EXISTS `raza`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raza` (
  `raza_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `especie` varchar(100) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`raza_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raza`
--

LOCK TABLES `raza` WRITE;
/*!40000 ALTER TABLE `raza` DISABLE KEYS */;
INSERT INTO `raza` VALUES (1,'Gato','Felino','2026-01-01 00:00:00','2026-01-01 00:00:00'),(2,'Perro','Canino','2026-01-01 00:00:00','2026-01-01 00:00:00');
/*!40000 ALTER TABLE `raza` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `fecha_ini_sesion` datetime DEFAULT NULL,
  `fecha_expiracion` datetime DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES (6,29,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJnbW9yYSIsImNvcnJlbyI6Imdpb3Zhbmltb3JhMDUyN0BnbWFpbC5jb20iLCJmZWNoYV9maW5fc2VzaW9uIjoxNzYzOTEwMjUzLCJmZWNoYV9pbmljaW9fc2VzaW9uIjoxNzYzODIzODUzfQ.phdDn1TyWaT7LZjkzuh5Naz6uDOzMPHGqVS1Ka8jRGg','2025-11-22 15:04:13','2025-11-23 15:04:13');
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` text,
  `rol` varchar(30) NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (29,'gmora','8f8439bd01556aace5fd2b93ea927958','ADMIN','2025-11-06 20:59:54',1,'giovanimora0527@gmail.com');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-04  9:19:44