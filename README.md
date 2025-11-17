# 汽修商品出入库管理系统

## 项目介绍

汽修商品出入库管理系统是一个专为汽车维修店或汽车配件商店设计的库存管理应用，提供商品管理、入库管理、出库管理、库存查询和统计报表等功能，帮助企业高效管理汽车配件的库存流转。

## 技术栈

- **后端**：Node.js + Express.js
- **数据库**：MySQL
- **前端**：HTML + CSS + JavaScript
- **依赖包**：
  - express: Web服务器框架
  - mysql2: MySQL数据库连接
  - cors: 跨域资源共享
  - body-parser: 请求体解析
  - dotenv: 环境变量管理

## 系统功能

### 1. 仪表盘
- 显示商品总数、总入库量、总出库量、库存总价值等统计信息
- 库存预警提醒

### 2. 商品管理
- 添加、编辑、删除商品信息
- 商品分类管理
- 商品搜索功能

### 3. 入库管理
- 商品入库登记
- 入库记录查询
- 供应商信息管理

### 4. 出库管理
- 商品出库登记
- 出库记录查询
- 客户信息记录

### 5. 库存查询
- 实时库存状态查询
- 库存预警设置

### 6. 统计报表
- 出入库统计分析
- 销售数据分析

## 项目结构

```
├── .env                    # 环境变量配置
├── check_table_structure.js # 检查表结构脚本
├── config/                 # 配置文件夹
│   └── database.js         # 数据库连接配置
├── package.json           # 项目依赖配置
├── public/                # 前端静态文件
│   ├── app.js            # 前端JavaScript
│   ├── index.html        # 前端主页面
│   └── styles.css        # 前端样式
├── scripts/              # 脚本文件夹
│   └── init-db.js        # 数据库初始化脚本
├── server.js             # 后端服务器入口
├── test-server.js        # 测试服务器
└── test_*.js             # 各种测试文件
```

## 安装与部署

### 1. 环境要求

- Node.js 14.x 或更高版本
- MySQL 5.7 或更高版本

### 2. 安装步骤

#### 2.1 克隆项目

```bash
git clone [项目仓库地址]
cd 汽修商品出入库管理系统
```

#### 2.2 安装依赖

```bash
npm install
```

#### 2.3 配置环境变量

复制或编辑 `.env` 文件，设置数据库连接信息：

```
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_DATABASE=auto_parts_inventory
# 服务器配置
PORT=3000
```

#### 2.4 初始化数据库

```bash
npm run init-db
```

### 3. 启动服务

#### 3.1 开发模式

```bash
npm run dev
```

#### 3.2 生产模式

```bash
npm start
```

服务器将在 http://localhost:3000 启动

## 数据库表结构

### 1. categories（商品分类表）
- id: INT (主键)
- name: VARCHAR(255) (分类名称)
- description: TEXT (分类描述)
- created_at: TIMESTAMP (创建时间)
- updated_at: TIMESTAMP (更新时间)

### 2. products（商品表）
- id: INT (主键)
- name: VARCHAR(255) (商品名称)
- category_id: INT (分类ID，外键)
- part_number: VARCHAR(100) (零件号)
- brand: VARCHAR(100) (品牌)
- model: VARCHAR(100) (型号)
- specification: TEXT (规格)
- unit: VARCHAR(20) (单位)
- purchase_price: DECIMAL(10,2) (进货价)
- sale_price: DECIMAL(10,2) (销售价)
- min_stock: INT (最低库存)
- max_stock: INT (最高库存)
- description: TEXT (描述)
- created_at: TIMESTAMP (创建时间)
- updated_at: TIMESTAMP (更新时间)

### 3. suppliers（供应商表）
- id: INT (主键)
- name: VARCHAR(255) (供应商名称)
- contact_person: VARCHAR(100) (联系人)
- phone: VARCHAR(20) (电话)
- address: TEXT (地址)
- email: VARCHAR(100) (邮箱)
- created_at: TIMESTAMP (创建时间)
- updated_at: TIMESTAMP (更新时间)

### 4. stock_in（入库记录表）
- id: INT (主键)
- product_id: INT (商品ID，外键)
- supplier_id: INT (供应商ID，外键)
- quantity: INT (数量)
- unit_price: DECIMAL(10,2) (单价)
- total_amount: DECIMAL(10,2) (总金额)
- batch_number: VARCHAR(100) (批次号)
- in_date: TIMESTAMP (入库时间)
- operator: VARCHAR(100) (操作员)
- notes: TEXT (备注)
- created_at: TIMESTAMP (创建时间)

### 5. stock_out（出库记录表）
- id: INT (主键)
- product_id: INT (商品ID，外键)
- quantity: INT (数量)
- sale_price: DECIMAL(10,2) (销售价)
- total_amount: DECIMAL(10,2) (总金额)
- out_date: TIMESTAMP (出库时间)
- customer_name: VARCHAR(255) (客户名称)
- vehicle_info: TEXT (车辆信息)
- operator: VARCHAR(100) (操作员)

### 6. inventory（库存表）
- id: INT (主键)
- product_id: INT (商品ID，外键)
- current_stock: INT (当前库存)

## API接口说明

### 商品管理
- `GET /api/products`: 获取所有商品
- `POST /api/products`: 添加新商品
- `PUT /api/products/:id`: 更新商品信息
- `DELETE /api/products/:id`: 删除商品

### 入库管理
- `GET /api/stock-in`: 获取入库记录
- `POST /api/stock-in`: 添加入库记录

### 出库管理
- `GET /api/stock-out`: 获取出库记录
- `POST /api/stock-out`: 添加出库记录

### 分类管理
- `GET /api/categories`: 获取所有分类

### 供应商管理
- `GET /api/suppliers`: 获取所有供应商

### 库存管理
- `GET /api/inventory`: 获取库存信息
- `GET /api/inventory/alerts`: 获取库存预警信息

## 使用说明

1. 启动系统后，打开浏览器访问 http://localhost:3000
2. 在仪表盘查看系统概览和库存预警
3. 通过左侧菜单访问各个功能模块
4. 按照界面提示进行商品、出入库等操作

## 注意事项

1. 确保MySQL服务正常运行，并且数据库配置正确
2. 首次使用需要运行数据库初始化脚本
3. 建议定期备份数据库
4. 如需修改端口，可在.env文件中调整PORT配置

## 许可证

MIT License

## 联系我们

如有问题或建议，请联系开发团队。