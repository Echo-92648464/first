const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL数据库初始化脚本
async function initializeDatabase() {
    let connection;
    try {
        console.log('开始初始化MySQL数据库...');

        // 创建连接（不指定数据库）
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // 创建数据库（如果不存在）
        await connection.execute(`CREATE DATABASE IF NOT EXISTS auto_parts_inventory 
                     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // 关闭当前连接，重新连接到指定数据库
        await connection.end();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'auto_parts_inventory'
        });

        // 创建商品分类表
        await connection.execute(`CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 创建商品表
        await connection.execute(`CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category_id INT,
            part_number VARCHAR(100) UNIQUE,
            brand VARCHAR(100),
            model VARCHAR(100),
            specification TEXT,
            unit VARCHAR(20) DEFAULT '个',
            purchase_price DECIMAL(10,2),
            sale_price DECIMAL(10,2),
            min_stock INT DEFAULT 0,
            max_stock INT DEFAULT 100,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 创建供应商表
        await connection.execute(`CREATE TABLE IF NOT EXISTS suppliers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(100),
            phone VARCHAR(20),
            address TEXT,
            email VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 创建入库记录表
        await connection.execute(`CREATE TABLE IF NOT EXISTS stock_in (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            supplier_id INT,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2),
            total_amount DECIMAL(10,2),
            batch_number VARCHAR(100),
            in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            operator VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 创建出库记录表
        await connection.execute(`CREATE TABLE IF NOT EXISTS stock_out (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            sale_price DECIMAL(10,2),
            total_amount DECIMAL(10,2),
            out_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            customer_name VARCHAR(255),
            vehicle_info TEXT,
            operator VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 创建库存表
        await connection.execute(`CREATE TABLE IF NOT EXISTS inventory (
            product_id INT PRIMARY KEY,
            current_stock INT DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        // 插入示例数据
        await connection.execute(`INSERT IGNORE INTO categories (name, description) VALUES 
            ('发动机配件', '发动机相关配件'),
            ('刹车系统', '刹车片、刹车盘等'),
            ('电气系统', '电瓶、发电机等'),
            ('滤清器', '机油滤清器、空气滤清器等')`);

        await connection.execute(`INSERT IGNORE INTO suppliers (name, contact_person, phone) VALUES 
            ('上海汽配有限公司', '张经理', '13800138000'),
            ('北京汽车配件厂', '李主任', '13900139000')`);

        // 插入示例商品数据 - 使用更安全的方式避免重复键错误
        await connection.execute(`INSERT INTO products (name, category_id, part_number, brand, model, unit, purchase_price, sale_price, min_stock, max_stock) VALUES 
            ('机油滤清器', 4, 'FILTER-001', '博世', 'BOSCH-001', '个', 25.00, 35.00, 10, 50),
            ('空气滤清器', 4, 'FILTER-002', '曼牌', 'MANN-001', '个', 35.00, 50.00, 5, 30),
            ('刹车片', 2, 'BRAKE-001', '菲罗多', 'FERODO-001', '套', 120.00, 180.00, 5, 20),
            ('火花塞', 1, 'SPARK-001', 'NGK', 'NGK-001', '个', 45.00, 65.00, 10, 40),
            ('汽车电瓶', 3, 'BATTERY-001', '瓦尔塔', 'VARTA-001', '个', 350.00, 480.00, 2, 10)
            ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            category_id = VALUES(category_id),
            brand = VALUES(brand),
            model = VALUES(model),
            unit = VALUES(unit),
            purchase_price = VALUES(purchase_price),
            sale_price = VALUES(sale_price),
            min_stock = VALUES(min_stock),
            max_stock = VALUES(max_stock)`);

        // 插入示例入库记录
        await connection.execute(`INSERT IGNORE INTO stock_in (product_id, supplier_id, quantity, unit_price, total_amount, batch_number, operator, notes) VALUES 
            (1, 1, 50, 25.00, 1250.00, 'BATCH-2024-001', '张三', '常规补货'),
            (2, 2, 30, 35.00, 1050.00, 'BATCH-2024-002', '李四', '新品入库'),
            (3, 1, 10, 120.00, 1200.00, 'BATCH-2024-003', '王五', '紧急采购'),
            (4, 2, 25, 45.00, 1125.00, 'BATCH-2024-004', '赵六', '促销备货'),
            (5, 1, 5, 350.00, 1750.00, 'BATCH-2024-005', '钱七', '大件商品入库')`);

        // 初始化库存数据
        await connection.execute(`INSERT IGNORE INTO inventory (product_id, current_stock) VALUES 
            (1, 50), (2, 30), (3, 10), (4, 25), (5, 5)`);

        console.log('✅ MySQL数据库初始化完成！');
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('数据库初始化完成，进程正常结束');
        })
        .catch((error) => {
            console.error('数据库初始化失败:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };