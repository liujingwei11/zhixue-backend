# WLearn智学后端

这是按照 Group 3 PPT 技术方案搭建的后端骨架：

- NestJS + REST API
- MySQL + TypeORM
- JWT 登录认证
- Bcrypt 密码哈希
- Swagger API 文档
- 课程目录、课程搜索、课程报名、重复报名校验、学习进度
- 教师 / 管理员课程管理接口
- Postman API 测试集合

当前阶段对应“前端原型 + 后端第一版 API”。页面原型使用的课程数据和本服务的 seed 数据一致，后续可以把前端 Mock 逻辑替换成 API 请求。

## 1. 启动 MySQL

Docker 不是必须的。电脑安装 Docker Desktop 后，可以在本目录运行：

~~~bash
docker compose up -d
~~~

如果没有 Docker，请直接启动本机 MySQL，并创建 zhixue 数据库；用户名、密码按 .env 中的 DB_USERNAME 和 DB_PASSWORD 设置。

## 2. 安装和启动

~~~bash
copy .env.example .env
npm install
npm run start:dev
~~~

服务地址：

- API：http://localhost:3000/api
- Swagger：http://localhost:3000/docs
- 健康检查：http://localhost:3000/api/health

首次启动且 DB_SYNCHRONIZE=true 时，TypeORM 会创建表并生成演示数据。

## 3. 演示账号

| 角色 | 账号 | 密码 |
|---|---|---|
| 学生 | student@zhixue.local | Student123! |
| 教师 | teacher@zhixue.local | Teacher123! |
| 管理员 | admin@zhixue.local | Admin123! |

登录后，把返回的 accessToken 放到 Swagger 的 Authorize 中，或者放到 Postman 集合的 token 变量。

## 4. 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| POST | /api/auth/register | 学生注册 |
| POST | /api/auth/login | 登录并获取 JWT |
| GET | /api/courses?search=HTML | 浏览和搜索课程 |
| GET | /api/courses/:id | 查看课程详情 |
| POST | /api/enrollments/courses/:courseId | 报名课程 |
| GET | /api/enrollments/me | 查看我的课程 |
| PATCH | /api/enrollments/:id/progress | 更新学习进度 |
| GET | /api/progress/me | 查看进度汇总 |

教师和管理员可以使用 POST /api/courses、PATCH /api/courses/:id、POST /api/courses/:id/publish 和 POST /api/courses/:id/lessons 管理课程。
