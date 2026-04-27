# 在线考试系统 (ExamPro - Online Exam System)

一个基于 Vue + Spring Boot 的在线考试系统，支持多种题型、防作弊机制和成绩分析。

## 项目结构

```
OES/
├── oes-backend/          # Spring Boot 后端项目
│   ├── src/main/java/com/oes/
│   │   ├── config/      # 配置类
│   │   ├── controller/  # 控制器
│   │   ├── entity/      # 实体类
│   │   ├── interceptor/ # 拦截器
│   │   ├── mapper/      # MyBatis Mapper
│   │   └── service/     # 服务层
│   └── src/main/resources/
│       └── application.yml
├── oes-frontend/        # Vue 前端项目
│   └── src/
│       ├── layout/      # 布局组件
│       ├── router/      # 路由配置
│       ├── store/       # 状态管理
│       ├── utils/       # 工具函数
│       ├── views/       # 页面组件
│       └── styles/      # 样式文件
└── sql/
    └── ExamPro.sql # 数据库脚本
```

## 技术栈

### 后端
- Spring Boot 3.2.0
- MyBatis Plus 3.5.5
- JWT (jjwt 0.12.3)
- MySQL 8.0
- Redis
- Lombok

### 前端
- Vue 3.4
- Vue Router 4
- Pinia 2.1.7
- Element Plus 2.4.4
- Axios
- ECharts 5.4.3

## 环境要求

- JDK 17+
- MySQL 8.0+
- Redis (可选)
- Node.js 18+
- Maven 3.8+

## 快速启动

### 1. 数据库配置

```bash
# 登录 MySQL
mysql -u root -p

# 执行数据库脚本
source sql/ExamPro.sql
```

### 2. 后端启动

```bash
cd oes-backend

# 修改 application.yml 中的数据库配置
# spring.datasource.username 和 password

# 启动后端
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 3. 前端启动

```bash
cd oes-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:3000 启动

## 测试账号

| 角色   | 用户名    | 密码      |
|--------|-----------|-----------|
| 管理员 | admin     | admin123  |
| 教师   | teacher1  | admin123  |
| 学生   | student1  | admin123  |

## 功能模块

### 管理员端
- 用户管理（学生、教师、管理员）
- 院系管理
- 班级管理
- 系统日志查看

### 教师端
- 科目管理
- 题库管理（单选、多选、判断、填空、简答、编程）
- 试卷管理（手动组卷）
- 考试管理（发布、监控、延时）
- 成绩查询与导出

### 学生端
- 查看待参加考试
- 在线考试（实时计时、自动保存）
- 考试历史查看
- 错题本练习

## 核心功能

### 防作弊机制
- 题目乱序（不同考生题目顺序不同）
- 选项乱序（客观题选项随机排列）
- 切屏检测（超过3次切屏自动交卷）

### 自动评分
- 客观题（单选、多选、判断）自动判分
- 主观题需教师手动评分

### 数据分析
- 班级成绩统计
- 知识点掌握度分析
- 试题质量分析

## API 文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/info` - 获取用户信息
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/changePassword` - 修改密码

### 用户管理
- `GET /api/users/page` - 分页查询用户
- `POST /api/users` - 创建用户
- `PUT /api/users` - 更新用户
- `DELETE /api/users/{id}` - 删除用户

### 题库管理
- `GET /api/questions/page` - 分页查询题目
- `POST /api/questions` - 创建题目
- `PUT /api/questions` - 更新题目
- `DELETE /api/questions/{id}` - 删除题目

### 考试记录
- `POST /api/exam-records/start` - 开始考试
- `POST /api/exam-records/auto-save` - 自动保存答案
- `POST /api/exam-records/submit/{id}` - 交卷
- `POST /api/exam-records/screen-switch` - 切屏记录

## License

MIT License
