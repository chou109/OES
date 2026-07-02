# 在线考试系统 (ExamPro)

一个基于 Vue + Spring Boot 的在线考试系统，支持多种题型、自动组卷、防作弊机制和成绩分析。

## ✨ 系统特性

### 🎯 全平台覆盖
- **Web端** (oes-frontend)：基于Vue 3的PC端管理系统，功能完整
- **移动端** (oes-uniapp)：基于uni-app的跨平台移动应用，支持Android/iOS/H5
- **后端服务** (oes-backend)：Spring Boot统一API接口，前后端分离架构

### 🚀 核心亮点
- 📱 **移动优先设计**：完整的移动端体验，随时随地参与考试
- 🔒 **多重防作弊**：切屏检测、题目乱序、选项乱序、离开检测
- ⚡ **智能组卷**：支持手动组卷和AI自动组卷，灵活配置题型分值
- 💾 **实时保存**：30秒自动保存答题进度，防止意外丢失
- 📊 **数据分析**：成绩统计、错题分析、知识点掌握度可视化
- 👥 **多角色支持**：管理员、教师、学生三种角色，权限精细控制

## 项目结构

```
exam_pro/
├── oes-backend/          # Spring Boot 后端项目
│   ├── src/main/java/com/oes/
│   │   ├── common/      # 公共类（响应封装、基础实体）
│   │   ├── config/      # 配置类（跨域、拦截器）
│   │   ├── controller/   # 控制器
│   │   ├── entity/       # 实体类
│   │   ├── interceptor/ # 拦截器
│   │   ├── mapper/       # MyBatis Mapper
│   │   ├── service/      # 服务层
│   │   └── utils/        # 工具类
│   └── src/main/resources/
│       ├── application.yml
│       └── sql/ExamPro.sql
├── oes-frontend/        # Vue PC端前端项目
│   └── src/
│       ├── layout/      # 布局组件
│       ├── router/      # 路由配置
│       ├── store/       # Pinia状态管理
│       ├── utils/       # 工具函数
│       ├── views/       # 页面组件
│       └── styles/      # 样式文件
├── oes-uniapp/          # uni-app 移动端项目
│   ├── pages/           # 页面目录
│   │   └── common/      # 公共页面
│   │       ├── login.vue      # 登录页
│   │       ├── register.vue   # 注册页
│   │       ├── dashboard.vue  # 首页仪表盘
│   │       └── account.vue    # 个人中心
│   ├── utils/           # 工具函数
│   │   ├── api.js       # API接口定义
│   │   └── request.js   # 请求封装
│   ├── static/          # 静态资源
│   ├── pages.json       # 页面路由配置
│   └── manifest.json    # 应用配置
└── README.md
```

## 技术栈

### 后端 (oes-backend)
- Spring Boot 3.2.0
- MyBatis Plus 3.5.5
- JWT (jjwt 0.12.3)
- MySQL 8.0
- Lombok

### PC端前端 (oes-frontend)
- Vue 3.4
- Vue Router 4
- Pinia 2.1.7
- Element Plus 2.4.4
- Axios
- ECharts 5.4.3

### 移动端 (oes-uniapp)
- **框架**：uni-app (基于Vue 3 Composition API)
- **构建工具**：Vite / HBuilderX
- **UI方案**：原生组件 + Emoji图标（无第三方UI库依赖）
- **状态管理**：uni.getStorageSync 本地存储（轻量级）
- **网络请求**：uni.request 封装（支持拦截器）
- **目标平台**：
  - 🤖 Android App
  - 🍎 iOS App
  - 🌐 H5网页
  - 📱 微信小程序（可扩展）

## 环境要求

- JDK 17+
- MySQL 8.0+
- Node.js 18+
- Maven 3.8+
- HBuilderX（移动端开发推荐）或 VS Code + uni-app插件

## 快速启动

### 1. 数据库配置

```bash
# 登录 MySQL
mysql -u root -p

# 执行数据库脚本
source oes-backend/src/main/resources/sql/ExamPro.sql
```

### 2. 后端启动

```bash
cd oes-backend

# 修改 application.yml 中的数据库配置
# spring.datasource.username 和 password

# 启动后端
mvn spring-boot:run
```

后端服务将在 **http://localhost:8081** 启动

> ⚠️ **重要**：后端需要监听 `0.0.0.0:8081` 以支持移动设备访问

### 3. PC端前端启动 (oes-frontend)

```bash
cd oes-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

PC端前端服务将在 **http://localhost:3000** 启动

### 4. 移动端启动 (oes-uniapp) 📱

#### 方式一：使用 HBuilderX（推荐）

1. 打开 **HBuilderX**
2. 文件 → 打开目录 → 选择 `oes-uniapp` 文件夹
3. 运行 → 运行到浏览器/模拟器/真机
   - 🌐 **运行到浏览器**：选择 Chrome 或其他浏览器
   - 🤖 **运行到Android模拟器**：需要安装 Android SDK
   - 📱 **运行到真机**：USB连接手机，开启开发者模式

#### 方式二：使用命令行

```bash
cd oes-uniapp

# 安装依赖
npm install

# 开发模式（H5）
npm run dev:h5

# 开发模式（微信小程序）
npm run dev:mp-weixin

# 开发模式（Android App）
npm run dev:app-android
```

#### 移动端网络配置 ⚙️

移动端访问后端需要修改IP地址：

```javascript
// oes-uniapp/utils/request.js
const BASE_URL = 'http://你的电脑IP:8081/api'
// 例如：http://192.168.34.49:8081/api
```

查看电脑IP地址：
- Windows: `ipconfig | findstr "IPv4"`
- Mac/Linux: `ifconfig | grep inet`

## 测试账号

| 角色   | 用户名    | 密码      |
|--------|-----------|-----------|
| 管理员 | a    | admin     |
| 教师   | t   | tchr   |
| 学生   | s   | stu   |

## 功能模块

### 🖥️ PC端 (oes-frontend)

#### 管理员端
- 用户管理（学生、教师、管理员CRUD）
- 院系管理（树形结构展示）
- 班级管理（创建、编辑、删除、邀请码）
- 数据统计（考试统计、错题统计）

#### 教师端
- 科目管理（创建、编辑、删除科目）
- 题库管理（单选、多选、判断、填空、简答多种题型）
- 试卷管理
  - 手动组卷（勾选题目、支持按题型筛选）
  - 自动组卷（设置题型数量和分值，总分自动计算）
  - 试卷编辑（勾选区分已选/未选题目）
  - 试卷预览（学生视角预览）
- 考试管理
  - 发布考试（设置时间、时长、班级、权限）
  - 允许考后查看试卷设置
  - 监控考试（切屏次数、离开次数）
  - 延时功能
- 成绩管理（查询、导出）

#### 学生端
- 考试列表（待参加、进行中、已结束）
- 在线考试
  - 实时计时
  - 题目导航（左侧题目状态显示）
  - 自动保存答案（每30秒自动保存）
  - 手动保存按钮
  - 切屏检测（超过次数自动交卷）
- 考试历史（查看成绩、查看试卷）
- 错题本（按科目筛选、练习功能）

---

### 📱 移动端 (oes-uniapp)

#### 🔐 认证模块
- **登录功能**
  - 用户名密码登录
  - JWT Token认证
  - 自动跳转首页
  - 登录状态持久化

- **注册功能**
  - 身份选择（学生/教师）
  - 表单验证（用户名3-20字符，密码6-20字符）
  - 学院选择器
  - 注册成功后跳转登录页

#### 📊 首页仪表盘 (Dashboard)
- **个性化欢迎**
  - 显示用户真实姓名
  - 显示角色标识（管理员/教师/学生）
  - 显示当前日期和时间

- **统计卡片**（根据角色动态显示）
  - 👨🎓 **学生视图**：待考考试、已完成考试、错题数、平均分
  - 👨‍🏫 **教师视图**：班级数、试卷数、题目数、考试数
  - 👤 **管理员视图**：总用户数、学生数、教师数、院系数

- **快捷入口**
  - 点击卡片快速跳转到对应功能页面
  - 右侧箭头指示可点击

- **信息卡片**
  - 📝 **最近操作日志**（管理员）：显示最新系统操作记录
  - 📅 **最近考试**（教师）：显示待管理的考试列表及状态
  - ⏰ **待考考试**（学生）：显示即将参加的考试，可直接进入
  - ℹ️ **考试须知**（学生）：4条重要提示信息

#### 👤 个人中心 (Account)
- **用户信息展示**
  - 头像显示
  - 用户名和真实姓名
  - 角色标签

- **基本资料管理** ✨
  - 编辑真实姓名、邮箱、手机号
  - 实时调用后端API更新
  - 本地缓存同步刷新
  - 表单验证和错误处理

- **修改密码** ✨
  - 当前密码验证
  - 新密码输入和确认
  - 密码强度校验
  - 调用后端API修改

- **关于系统**
  - 应用Logo展示
  - 版本号显示（v1.0.0）
  - 应用简介
  - 版权信息

- **工具功能**
  - 清除本地缓存（带确认对话框）
  - 退出登录（清除Token和用户信息）

#### 🎨 UI/UX特性
- **原生组件方案**
  - 使用Emoji图标替代第三方图标库（无依赖）
  - 使用原生View组件实现弹窗（无需uni-popup）
  - 完全自定义样式控制

- **响应式设计**
  - 适配不同屏幕尺寸
  - 支持横竖屏切换
  - 触摸友好的交互设计

- **用户体验优化**
  - 加载状态提示
  - 操作成功/失败反馈
  - 平滑的页面过渡动画
  - 底部弹窗式表单（符合移动端习惯）

## 核心功能

### 🎯 自动组卷 (PC端)
- 支持设置每种题型的题目数量
- 支持设置每种题型的分值
- 总分自动计算（题目数量 × 每题分值）
- 及格分支持百分比设置

### 📝 试卷编辑 (PC端)
- 勾选区分已选和未选题目
- 支持按题型筛选题目
- 筛选后保持勾选状态
- 单题分值显示和设置

### 🔒 防作弊机制 (PC端 + 移动端)
- 题目乱序（不同考生题目顺序不同）
- 选项乱序（客观题选项随机排列）
- 切屏检测（超过3次切屏自动交卷）
- 考中离开检测
- 可疑行为标记

### ✅ 自动评分
- 客观题（单选、多选、判断）自动判分
- 主观题（填空、简答）需教师手动评分
- 交卷时自动保存错题记录

### 👑 权限控制
- 考后查看试卷权限（教师端控制）
- 主观题未评分时不允许查看详细答案

### 💾 自动保存 (PC端)
- 每30秒自动保存答题进度
- 手动保存按钮
- 退出或刷新页面后答案可恢复

### 📱 移动端特色功能
- **离线优先**：本地存储用户信息，减少网络请求
- **轻量级架构**：无第三方UI库依赖，包体积小
- **原生体验**：底部弹窗、触摸反馈、手势操作
- **多平台适配**：一套代码，多端运行
- **实时同步**：修改信息后立即更新本地缓存

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

### 班级管理
- `GET /api/classes/page` - 分页查询班级（管理员）
- `POST /api/class/create` - 创建班级（教师）
- `PUT /api/classes` - 更新班级
- `DELETE /api/classes/{id}` - 删除班级
- `GET /api/class/my-classes` - 获取我的班级
- `POST /api/class/join-by-code` - 通过邀请码加入班级

### 题库管理
- `GET /api/questions/page` - 分页查询题目
- `POST /api/questions` - 创建题目
- `PUT /api/questions` - 更新题目
- `DELETE /api/questions/{id}` - 删除题目

### 试卷管理
- `GET /api/papers/page` - 分页查询试卷
- `GET /api/papers/{id}` - 获取试卷详情
- `POST /api/papers` - 创建试卷
- `PUT /api/papers` - 更新试卷
- `DELETE /api/papers/{id}` - 删除试卷
- `POST /api/papers/auto-generate` - 自动组卷

### 考试管理
- `GET /api/exams/page` - 分页查询考试
- `POST /api/exams` - 创建考试
- `PUT /api/exams` - 更新考试
- `DELETE /api/exams/{id}` - 删除考试
- `POST /api/exams/{id}/extend` - 延时考试

### 考试记录
- `POST /api/exam-records/start` - 开始考试
- `POST /api/exam-records/auto-save` - 自动保存答案
- `POST /api/exam-records/submit/{id}` - 交卷
- `POST /api/exam-records/screen-switch` - 切屏记录
- `GET /api/exam-records/history` - 考试历史

### 错题本
- `GET /api/wrong-questions/page` - 分页查询错题
- `POST /api/wrong-questions/practice` - 练习错题

---

## 🏗️ 移动端架构说明 (oes-uniapp)

### 目录结构详解
```
oes-uniapp/
├── pages/                    # 页面目录
│   └── common/              # 公共页面（所有角色共用）
│       ├── login.vue        # 登录页（认证入口）
│       ├── register.vue     # 注册页（新用户注册）
│       ├── dashboard.vue    # 首页仪表盘（数据展示）
│       └── account.vue      # 个人中心（用户设置）
├── utils/                   # 工具模块
│   ├── api.js               # API接口定义（RESTful风格）
│   └── request.js           # 请求封装（拦截器、Token管理）
├── static/                  # 静态资源
│   ├── logo.png             # 应用Logo
│   └── avatar.png           # 默认头像
├── pages.json               # 页面路由配置（类似Vue Router）
├── manifest.json            # 应用配置（AppID、权限等）
└── App.vue                  # 应用根组件（全局样式、生命周期）
```

### 技术选型理由

#### ✅ 为什么选择原生组件而非第三方UI库？
1. **减少依赖**：避免版本冲突和兼容性问题
2. **包体积优化**：移除不必要的组件库代码
3. **完全控制**：自定义样式不受限制
4. **性能提升**：原生渲染性能更好

#### ✅ 为什么使用本地存储而非Pinia/Vuex？
1. **轻量级**：移动端不需要复杂的状态管理
2. **持久化**：Storage自动持久化，无需额外处理
3. **简单易用**：API简洁，学习成本低
4. **离线支持**：断网时仍可读取缓存数据

#### ✅ 为什么使用Emoji图标？
1. **零依赖**：无需引入图标库或字体文件
2. **跨平台**：所有平台统一显示效果
3. **可定制**：支持调整大小和颜色
4. **国际化**：天然支持多语言环境

### 代码规范

#### Vue 3 Composition API 风格
```javascript
// ✅ 推荐写法
export default {
  setup() {
    const userInfo = ref(uni.getStorageSync('userInfo') || {})

    const displayName = computed(() => {
      return userInfo.value.realName || '用户'
    })

    const handleLogin = async () => {
      try {
        const res = await authApi.login(form)
        // 处理响应
      } catch (e) {
        // 错误处理
      }
    }

    return { userInfo, displayName, handleLogin }
  }
}
```

#### API调用规范
```javascript
// utils/api.js - 统一接口定义
export const userApi = {
  update: (data) => put('/users', data),
  getById: (id) => get(`/users/${id}`)
}

// 页面中使用
const saveInfo = async () => {
  const res = await userApi.update({
    id: userInfo.value.id,
    realName: editForm.realName
  })
}
```

#### 样式规范 (SCSS)
```scss
// 使用rpx单位适配不同屏幕
.container {
  padding: 24rpx;  // 响应式单位
  
  .title {
    font-size: 36rpx;
    color: #333;
  }
  
  .btn {
    height: 96rpx;  // 触摸友好的按钮高度
    
    &:active {
      opacity: 0.8;  // 点击反馈
    }
  }
}
```

### 性能优化建议

#### 🚀 图片优化
- 使用WebP格式图片
- 懒加载长列表图片
- 压缩图片质量至80%

#### 🚀 网络优化
- 启用Gzip压缩
- 合并小图标为Sprite图
- 合理设置缓存策略

#### 🚀 渲染优化
- 长列表使用虚拟滚动
- 避免深层嵌套组件
- 减少watch监听器数量

### 调试技巧

#### 🔍 HBuilderX调试
1. 运行到浏览器 → 打开DevTools
2. 控制台查看日志输出
3. Network面板监控网络请求
4. Vue Devtools调试组件状态

#### 🔍 真机调试
1. USB连接手机
2. 开启USB调试模式
3. HBuilderX运行到真机
4. 手机上查看vConsole日志

#### 🔍 常见问题排查
| 问题 | 解决方案 |
|------|---------|
| 白屏 | 检查路由配置、组件导入 |
| 样式异常 | 检查rpx单位、CSS兼容性 |
| API报错 | 检查网络配置、后端服务状态 |
| Token失效 | 清除本地存储，重新登录 |

---

## 📋 开发路线图

### v1.0.0 (当前版本) ✅
- [x] 用户认证系统（登录/注册）
- [x] 首页仪表盘（统计卡片、信息展示）
- [x] 个人中心（资料编辑、密码修改）
- [x] 多平台适配（Android/iOS/H5）

### v1.1.0 (计划中)
- [ ] 在线考试功能（移动端）
- [ ] 考试历史查看
- [ ] 错题本练习
- [ ] 消息通知推送

### v1.2.0 (规划中)
- [ ] 离线考试模式
- [ ] 语音朗读题目
- [ ] 手势操作快捷键
- [ ] 深色模式支持

### v2.0.0 (远期)
- [ ] AI智能组卷推荐
- [ ] 实时协作编辑试卷
- [ ] 视频监考集成
- [ ] 区块链成绩存证

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范
- 遵循ESLint配置
- 提交信息使用Conventional Commits
- 保持组件单一职责原则
- 编写必要的注释说明

## 📄 License

MIT License