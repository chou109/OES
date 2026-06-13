package com.oes.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

@Component
public class InitDatabaseConfig implements CommandLineRunner {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    private final DataSource dataSource;

    public InitDatabaseConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        createDatabaseIfNotExists();
        
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            
            executeSqlScript("/sql/ExamPro.sql", statement);
            
            System.out.println("Database initialized successfully from SQL script");
        }
    }

    private void createDatabaseIfNotExists() {
        String databaseName = extractDatabaseName(datasourceUrl);
        
        try {
            String connectionUrl = datasourceUrl.substring(0, datasourceUrl.indexOf("/", 14)) + "/";
            try (Connection connection = DriverManager.getConnection(connectionUrl, username, password);
                 Statement statement = connection.createStatement()) {
                
                statement.executeUpdate("CREATE DATABASE IF NOT EXISTS `" + databaseName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                System.out.println("Database '" + databaseName + "' ensured");
            }
        } catch (Exception e) {
            System.err.println("Error creating database: " + e.getMessage());
        }
    }

    private void executeSqlScript(String resourcePath, Statement statement) {
        try (InputStream is = getClass().getResourceAsStream(resourcePath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
            
            if (is == null) {
                System.err.println("SQL script not found: " + resourcePath);
                createTablesManually(statement);
                return;
            }
            
            StringBuilder sql = new StringBuilder();
            String line;
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                if (line.isEmpty() || line.startsWith("--")) {
                    continue;
                }
                
                sql.append(line);
                
                if (line.endsWith(";")) {
                    try {
                        statement.execute(sql.toString());
                    } catch (Exception e) {
                        if (!e.getMessage().contains("Duplicate") && !e.getMessage().contains("already exists")) {
                            System.err.println("Error executing SQL: " + e.getMessage());
                        }
                    }
                    sql = new StringBuilder();
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading SQL file: " + e.getMessage());
            System.err.println("Falling back to creating tables manually");
            createTablesManually(statement);
        }
    }

    private void createTablesManually(Statement statement) {
        try {
            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_user` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`username` varchar(50) NOT NULL," +
                    "`password` varchar(100) NOT NULL," +
                    "`real_name` varchar(50) DEFAULT NULL," +
                    "`email` varchar(100) DEFAULT NULL," +
                    "`phone` varchar(20) DEFAULT NULL," +
                    "`avatar` varchar(255) DEFAULT NULL," +
                    "`role` varchar(20) NOT NULL DEFAULT 'STUDENT'," +
                    "`status` tinyint(4) DEFAULT '1'," +
                    "`department_id` bigint(20) DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "UNIQUE KEY `uk_username` (`username`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_department` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`name` varchar(100) NOT NULL," +
                    "`code` varchar(50) DEFAULT NULL," +
                    "`parent_id` bigint(20) DEFAULT NULL," +
                    "`sort_order` int(11) DEFAULT '0'," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_class` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`name` varchar(100) NOT NULL," +
                    "`code` varchar(50) DEFAULT NULL," +
                    "`department_id` bigint(20) DEFAULT NULL," +
                    "`grade` varchar(20) DEFAULT NULL," +
                    "`invite_code` varchar(20) DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_class_member` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`class_id` bigint(20) NOT NULL," +
                    "`user_id` bigint(20) NOT NULL," +
                    "`role` varchar(20) NOT NULL DEFAULT 'MEMBER'," +
                    "`mute_until` datetime DEFAULT NULL," +
                    "`joined_at` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "UNIQUE KEY `uk_class_user` (`class_id`, `user_id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_class_message` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`class_id` bigint(20) NOT NULL," +
                    "`sender_id` bigint(20) NOT NULL," +
                    "`content` text NOT NULL," +
                    "`type` varchar(20) DEFAULT 'TEXT'," +
                    "`file_url` varchar(255) DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_subject` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`name` varchar(100) NOT NULL," +
                    "`code` varchar(50) DEFAULT NULL," +
                    "`department_id` bigint(20) DEFAULT NULL," +
                    "`description` text," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_knowledge_point` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`name` varchar(100) NOT NULL," +
                    "`subject_id` bigint(20) NOT NULL," +
                    "`parent_id` bigint(20) DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_question` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`subject_id` bigint(20) NOT NULL," +
                    "`type` varchar(20) NOT NULL," +
                    "`content` text NOT NULL," +
                    "`options` text," +
                    "`answer` text," +
                    "`analysis` text," +
                    "`difficulty` varchar(20) DEFAULT 'MEDIUM'," +
                    "`score` int(11) DEFAULT '5'," +
                    "`knowledge_point_ids` varchar(255) DEFAULT NULL," +
                    "`creator_id` bigint(20) DEFAULT NULL," +
                    "`used_count` int(11) DEFAULT '0'," +
                    "`correct_count` int(11) DEFAULT '0'," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_paper` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`title` varchar(200) NOT NULL," +
                    "`subject_id` bigint(20) DEFAULT NULL," +
                    "`total_score` int(11) DEFAULT '100'," +
                    "`pass_score` int(11) DEFAULT '60'," +
                    "`duration` int(11) DEFAULT '120'," +
                    "`question_count` int(11) DEFAULT '0'," +
                    "`creator_id` bigint(20) DEFAULT NULL," +
                    "`question_ids` text," +
                    "`question_order` text," +
                    "`config` text," +
                    "`status` varchar(20) DEFAULT 'DRAFT'," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_exam` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`title` varchar(200) NOT NULL," +
                    "`paper_id` bigint(20) NOT NULL," +
                    "`subject_id` bigint(20) DEFAULT NULL," +
                    "`exam_type` varchar(20) DEFAULT 'ONLINE'," +
                    "`start_time` datetime DEFAULT NULL," +
                    "`end_time` datetime DEFAULT NULL," +
                    "`duration` int(11) DEFAULT '120'," +
                    "`total_score` int(11) DEFAULT '100'," +
                    "`pass_score` int(11) DEFAULT '60'," +
                    "`class_ids` varchar(255) DEFAULT NULL," +
                    "`student_ids` varchar(255) DEFAULT NULL," +
                    "`status` varchar(20) DEFAULT 'PENDING'," +
                    "`anti_cheat_config` text," +
                    "`auto_submit` tinyint(4) DEFAULT '1'," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_exam_record` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`exam_id` bigint(20) NOT NULL," +
                    "`student_id` bigint(20) NOT NULL," +
                    "`paper_id` bigint(20) NOT NULL," +
                    "`start_time` datetime DEFAULT NULL," +
                    "`submit_time` datetime DEFAULT NULL," +
                    "`score` int(11) DEFAULT NULL," +
                    "`score_status` varchar(20) DEFAULT 'PENDING'," +
                    "`answer_data` text," +
                    "`question_order` text," +
                    "`option_order` text," +
                    "`screen_switch_count` int(11) DEFAULT '0'," +
                    "`is_suspicious` tinyint(4) DEFAULT '0'," +
                    "`is_auto_submit` tinyint(4) DEFAULT '0'," +
                    "`status` varchar(20) DEFAULT 'NOT_STARTED'," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "UNIQUE KEY `uk_exam_student` (`exam_id`,`student_id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_answer` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`record_id` bigint(20) NOT NULL," +
                    "`question_id` bigint(20) NOT NULL," +
                    "`student_id` bigint(20) NOT NULL," +
                    "`answer` text," +
                    "`is_correct` tinyint(4) DEFAULT NULL," +
                    "`score` int(11) DEFAULT NULL," +
                    "`auto_score` int(11) DEFAULT NULL," +
                    "`manual_score` int(11) DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_wrong_question` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`student_id` bigint(20) NOT NULL," +
                    "`question_id` bigint(20) NOT NULL," +
                    "`exam_id` bigint(20) DEFAULT NULL," +
                    "`wrong_answer` text," +
                    "`correct_answer` text," +
                    "`practiced_count` int(11) DEFAULT '0'," +
                    "`last_practice_time` datetime DEFAULT NULL," +
                    "`deleted` tinyint(4) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "UNIQUE KEY `uk_student_question` (`student_id`,`question_id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `exam_statistics` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`exam_id` bigint(20) NOT NULL," +
                    "`total_students` int(11) DEFAULT '0'," +
                    "`submitted_count` int(11) DEFAULT '0'," +
                    "`avg_score` decimal(5,2) DEFAULT NULL," +
                    "`max_score` int(11) DEFAULT NULL," +
                    "`min_score` int(11) DEFAULT NULL," +
                    "`pass_rate` decimal(5,2) DEFAULT NULL," +
                    "`suspicious_count` int(11) DEFAULT '0'," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "`update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)," +
                    "UNIQUE KEY `uk_exam_id` (`exam_id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            statement.executeUpdate("CREATE TABLE IF NOT EXISTS `sys_log` (" +
                    "`id` bigint(20) NOT NULL AUTO_INCREMENT," +
                    "`username` varchar(50) DEFAULT NULL," +
                    "`operation` varchar(100) DEFAULT NULL," +
                    "`method` varchar(200) DEFAULT NULL," +
                    "`params` text," +
                    "`ip` varchar(50) DEFAULT NULL," +
                    "`create_time` datetime DEFAULT CURRENT_TIMESTAMP," +
                    "PRIMARY KEY (`id`)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            System.out.println("Tables created manually");
        } catch (Exception e) {
            System.err.println("Error creating tables: " + e.getMessage());
        }
    }

    private String extractDatabaseName(String url) {
        String dbPart = url.substring(url.indexOf("/", 14) + 1);
        if (dbPart.contains("?")) {
            return dbPart.substring(0, dbPart.indexOf("?"));
        }
        return dbPart;
    }
}
