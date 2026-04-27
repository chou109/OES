/*
Navicat MySQL Data Transfer

Source Server         : localhost_3306
Source Server Version : 80013
Source Host           : localhost:3306
Source Database       : exam_pro

Target Server Type    : MYSQL
Target Server Version : 80013
File Encoding         : 65001

Date: 2026-04-27 20:12:50
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for exam_answer
-- ----------------------------
DROP TABLE IF EXISTS `exam_answer`;
CREATE TABLE `exam_answer` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '答题ID',
  `record_id` bigint(20) NOT NULL COMMENT '考试记录ID',
  `question_id` bigint(20) NOT NULL COMMENT '题目ID',
  `student_id` bigint(20) NOT NULL COMMENT '学生ID',
  `answer` text COMMENT '学生答案',
  `is_correct` tinyint(4) DEFAULT NULL COMMENT '是否正确: 0-错 1-对 null-未改卷',
  `score` int(11) DEFAULT NULL COMMENT '得分',
  `auto_score` int(11) DEFAULT NULL COMMENT '客观题自动得分',
  `manual_score` int(11) DEFAULT NULL COMMENT '主观题人工得分',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_record_id` (`record_id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='答题表';

-- ----------------------------
-- Records of exam_answer
-- ----------------------------

-- ----------------------------
-- Table structure for exam_exam
-- ----------------------------
DROP TABLE IF EXISTS `exam_exam`;
CREATE TABLE `exam_exam` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `title` varchar(200) NOT NULL COMMENT '考试标题',
  `paper_id` bigint(20) NOT NULL COMMENT '关联试卷ID',
  `subject_id` bigint(20) DEFAULT NULL COMMENT '所属科目',
  `exam_type` varchar(20) DEFAULT 'ONLINE' COMMENT '考试类型: ONLINE/RECORD',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `duration` int(11) DEFAULT '120' COMMENT '考试时长(分钟)',
  `total_score` int(11) DEFAULT '100' COMMENT '总分',
  `pass_score` int(11) DEFAULT '60' COMMENT '及格分数',
  `class_ids` varchar(255) DEFAULT NULL COMMENT '参考班级IDs',
  `student_ids` varchar(255) DEFAULT NULL COMMENT '参考学生IDs',
  `status` varchar(20) DEFAULT 'PENDING' COMMENT '状态: PENDING/ONGOING/FINISHED',
  `anti_cheat_config` text COMMENT '防作弊配置JSON',
  `auto_submit` tinyint(4) DEFAULT '1' COMMENT '是否自动提交: 0-否 1-是',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_paper_id` (`paper_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考试表';

-- ----------------------------
-- Records of exam_exam
-- ----------------------------

-- ----------------------------
-- Table structure for exam_exam_record
-- ----------------------------
DROP TABLE IF EXISTS `exam_exam_record`;
CREATE TABLE `exam_exam_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '考试记录ID',
  `exam_id` bigint(20) NOT NULL COMMENT '考试ID',
  `student_id` bigint(20) NOT NULL COMMENT '学生ID',
  `paper_id` bigint(20) NOT NULL COMMENT '试卷ID',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
  `score` int(11) DEFAULT NULL COMMENT '得分',
  `score_status` varchar(20) DEFAULT 'PENDING' COMMENT '评分状态: PENDING/MARKED/AUTO_MARKED',
  `answer_data` text COMMENT '答题数据JSON',
  `question_order` text COMMENT '题目顺序JSON (该学生专属)',
  `option_order` text COMMENT '选项顺序JSON (该学生专属)',
  `screen_switch_count` int(11) DEFAULT '0' COMMENT '切屏次数',
  `is_suspicious` tinyint(4) DEFAULT '0' COMMENT '是否可疑: 0-正常 1-可疑',
  `is_auto_submit` tinyint(4) DEFAULT '0' COMMENT '是否自动提交: 0-否 1-是',
  `status` varchar(20) DEFAULT 'NOT_STARTED' COMMENT '状态: NOT_STARTED/ONGOING/SUBMITTED/TIMEOUT',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_student` (`exam_id`,`student_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考试记录表';

-- ----------------------------
-- Records of exam_exam_record
-- ----------------------------

-- ----------------------------
-- Table structure for exam_knowledge_point
-- ----------------------------
DROP TABLE IF EXISTS `exam_knowledge_point`;
CREATE TABLE `exam_knowledge_point` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '知识点ID',
  `name` varchar(100) NOT NULL COMMENT '知识点名称',
  `subject_id` bigint(20) NOT NULL COMMENT '所属科目',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '上级知识点',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_subject_id` (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='知识点表';

-- ----------------------------
-- Records of exam_knowledge_point
-- ----------------------------
INSERT INTO `exam_knowledge_point` VALUES ('1', '数组', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('2', '链表', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('3', '栈', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('4', '队列', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('5', '树', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('6', '图', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('7', '排序算法', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_knowledge_point` VALUES ('8', '查找算法', '1', null, '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');

-- ----------------------------
-- Table structure for exam_paper
-- ----------------------------
DROP TABLE IF EXISTS `exam_paper`;
CREATE TABLE `exam_paper` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `title` varchar(200) NOT NULL COMMENT '试卷标题',
  `subject_id` bigint(20) DEFAULT NULL COMMENT '所属科目',
  `total_score` int(11) DEFAULT '100' COMMENT '总分',
  `pass_score` int(11) DEFAULT '60' COMMENT '及格分数',
  `duration` int(11) DEFAULT '120' COMMENT '考试时长(分钟)',
  `question_count` int(11) DEFAULT '0' COMMENT '题目数量',
  `creator_id` bigint(20) DEFAULT NULL COMMENT '创建人ID',
  `question_ids` text COMMENT '题目IDs JSON',
  `question_order` text COMMENT '题目顺序JSON (打乱后)',
  `config` text COMMENT '试卷配置JSON',
  `status` varchar(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT/PUBLISHED',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷表';

-- ----------------------------
-- Records of exam_paper
-- ----------------------------

-- ----------------------------
-- Table structure for exam_question
-- ----------------------------
DROP TABLE IF EXISTS `exam_question`;
CREATE TABLE `exam_question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `subject_id` bigint(20) NOT NULL COMMENT '所属科目',
  `type` varchar(20) NOT NULL COMMENT '题目类型: SINGLE_MULTIPLE/CHOICE/MULTIPLE_CHOICE/JUDGMENT/FILL_BLANK/ESSAY/PROGRAMMING',
  `content` text NOT NULL COMMENT '题目内容',
  `options` text COMMENT '选项JSON (用于选择/判断题)',
  `answer` text COMMENT '正确答案',
  `analysis` text COMMENT '答案解析',
  `difficulty` varchar(20) DEFAULT 'MEDIUM' COMMENT '难度: EASY/MEDIUM/HARD',
  `score` int(11) DEFAULT '5' COMMENT '分值',
  `knowledge_point_ids` varchar(255) DEFAULT NULL COMMENT '关联知识点IDs',
  `creator_id` bigint(20) DEFAULT NULL COMMENT '创建人ID',
  `used_count` int(11) DEFAULT '0' COMMENT '使用次数',
  `correct_count` int(11) DEFAULT '0' COMMENT '正确次数',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_type` (`type`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题目表';

-- ----------------------------
-- Records of exam_question
-- ----------------------------

-- ----------------------------
-- Table structure for exam_statistics
-- ----------------------------
DROP TABLE IF EXISTS `exam_statistics`;
CREATE TABLE `exam_statistics` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `exam_id` bigint(20) NOT NULL COMMENT '考试ID',
  `total_students` int(11) DEFAULT '0' COMMENT '总考生数',
  `submitted_count` int(11) DEFAULT '0' COMMENT '已交卷人数',
  `avg_score` decimal(5,2) DEFAULT NULL COMMENT '平均分',
  `max_score` int(11) DEFAULT NULL COMMENT '最高分',
  `min_score` int(11) DEFAULT NULL COMMENT '最低分',
  `pass_rate` decimal(5,2) DEFAULT NULL COMMENT '及格率',
  `suspicious_count` int(11) DEFAULT '0' COMMENT '可疑试卷数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_id` (`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考试成绩统计表';

-- ----------------------------
-- Records of exam_statistics
-- ----------------------------

-- ----------------------------
-- Table structure for exam_subject
-- ----------------------------
DROP TABLE IF EXISTS `exam_subject`;
CREATE TABLE `exam_subject` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '科目ID',
  `name` varchar(100) NOT NULL COMMENT '科目名称',
  `code` varchar(50) DEFAULT NULL COMMENT '科目代码',
  `department_id` bigint(20) DEFAULT NULL COMMENT '所属院系',
  `description` text COMMENT '科目描述',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考试科目表';

-- ----------------------------
-- Records of exam_subject
-- ----------------------------
INSERT INTO `exam_subject` VALUES ('1', '数据结构与算法', 'DSA', '1', '数据结构与算法设计', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_subject` VALUES ('2', '操作系统原理', 'OS', '1', '操作系统原理与应用', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `exam_subject` VALUES ('3', '计算机网络', 'CN', '1', '计算机网络基础', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');

-- ----------------------------
-- Table structure for exam_wrong_question
-- ----------------------------
DROP TABLE IF EXISTS `exam_wrong_question`;
CREATE TABLE `exam_wrong_question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '错题ID',
  `student_id` bigint(20) NOT NULL COMMENT '学生ID',
  `question_id` bigint(20) NOT NULL COMMENT '题目ID',
  `exam_id` bigint(20) DEFAULT NULL COMMENT '所属考试ID',
  `wrong_answer` text COMMENT '错误答案',
  `correct_answer` text COMMENT '正确答案',
  `practiced_count` int(11) DEFAULT '0' COMMENT '练习次数',
  `last_practice_time` datetime DEFAULT NULL COMMENT '最后练习时间',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_question` (`student_id`,`question_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='错题本表';

-- ----------------------------
-- Records of exam_wrong_question
-- ----------------------------

-- ----------------------------
-- Table structure for sys_class
-- ----------------------------
DROP TABLE IF EXISTS `sys_class`;
CREATE TABLE `sys_class` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `name` varchar(100) NOT NULL COMMENT '班级名称',
  `code` varchar(50) DEFAULT NULL COMMENT '班级代码',
  `department_id` bigint(20) DEFAULT NULL COMMENT '所属院系ID',
  `grade` varchar(20) DEFAULT NULL COMMENT '年级',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_department_id` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班级表';

-- ----------------------------
-- Records of sys_class
-- ----------------------------
INSERT INTO `sys_class` VALUES ('1', '计算机21级1班', 'CS2021-1', '1', '2021', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_class` VALUES ('2', '计算机21级2班', 'CS2021-2', '1', '2021', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_class` VALUES ('3', '软件21级1班', 'SE2021-1', '3', '2021', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_class` VALUES ('4', '信息21级1班', 'IE2021-1', '2', '2021', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');

-- ----------------------------
-- Table structure for sys_department
-- ----------------------------
DROP TABLE IF EXISTS `sys_department`;
CREATE TABLE `sys_department` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '院系ID',
  `name` varchar(100) NOT NULL COMMENT '院系名称',
  `code` varchar(50) DEFAULT NULL COMMENT '院系代码',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '上级院系ID',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='院系表';

-- ----------------------------
-- Records of sys_department
-- ----------------------------
INSERT INTO `sys_department` VALUES ('1', '计算机科学学院', 'CS', null, '1', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_department` VALUES ('2', '信息工程学院', 'IE', null, '2', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_department` VALUES ('3', '软件工程学院', 'SE', null, '3', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `username` varchar(50) DEFAULT NULL COMMENT '操作用户',
  `operation` varchar(100) DEFAULT NULL COMMENT '操作描述',
  `method` varchar(200) DEFAULT NULL COMMENT '请求方法',
  `params` text COMMENT '请求参数',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统日志表';

-- ----------------------------
-- Records of sys_log
-- ----------------------------

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `role` varchar(20) NOT NULL COMMENT '角色: ADMIN/TEACHER/STUDENT',
  `status` tinyint(4) DEFAULT '1' COMMENT '状态: 0-禁用 1-正常',
  `deleted` tinyint(4) DEFAULT '0' COMMENT '删除标记: 0-未删 1-已删',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统用户表';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
INSERT INTO `sys_user` VALUES ('1', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt7lCPO', '系统管理员', 'admin@oes.com', null, null, 'ADMIN', '1', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_user` VALUES ('2', 'teacher1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt7lCPO', '张教授', 'teacher1@oes.com', null, null, 'TEACHER', '1', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_user` VALUES ('4', 'student1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt7lCPO', '王小明', 'student1@oes.com', null, null, 'STUDENT', '1', '0', '2026-04-23 12:34:35', '2026-04-23 12:34:35');
INSERT INTO `sys_user` VALUES ('7', 's', '$2a$10$dJe2H25mue3bYssjH5G0MOwyJmP3FrGMSL7bJeJs9IaE0zIKHU5ui', '丁真珍珠', '111@ex.com', '1145141919810', null, 'STUDENT', '1', '0', '2026-04-23 22:45:05', '2026-04-23 22:45:05');
INSERT INTO `sys_user` VALUES ('8', 't', '$2a$10$ISZAOF.J5BydJ/jzjcDPX.6Vxs8AIjU/imCA8UKL7TjpcQFaAnBCi', '范教授', '222@ex.com', '1919810', null, 'TEACHER', '1', '0', '2026-04-27 19:14:11', '2026-04-27 19:14:11');
INSERT INTO `sys_user` VALUES ('9', 'a', '$2a$10$LCoumND.3G44LOletcd08OnGdm7I3mfPybtoxa9L4C0aNr5PH8zKG', 'Administrator', '333@ex.com', '123456789', null, 'ADMIN', '1', '0', '2026-04-27 19:15:02', '2026-04-27 19:15:02');
