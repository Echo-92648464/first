const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { query, transaction, testConnection } = require('./config/database');
const { initializeDatabase } = require('./scripts/init-db');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 商品管理API

// 获取所有商品
app.get('/api/products', async (req, res) => {
    try {
        const products = await query('SELECT * FROM products');
        const categories = await query('SELECT * FROM categories');
        const inventory = await query('SELECT * FROM inventory');
        
        // 手动关联数据
        const result = products.map(product => {
            const category = categories.find(c => c.id === product.category_id);
            const inventoryItem = inventory.find(i => i.product_id === product.id);
            
            return {
                ...product,
                category_name: category ? category.name : '未分类',
                current_stock: inventoryItem ? inventoryItem.current_stock : 0
            };
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加新商品
app.post('/api/products', async (req, res) => {
    try {
        const { name, category_id, part_number, brand, model, specification, unit, purchase_price, sale_price, min_stock, max_stock, description } = req.body;
        
        // 将undefined值转换为null，避免数据库参数绑定错误
        const params = [
            name || null,
            category_id || null,
            part_number || null,
            brand || null,
            model || null,
            specification || null,
            unit || '个',
            purchase_price || null,
            sale_price || null,
            min_stock || 0,
            max_stock || 100,
            description || null
        ];
        
        const sql = `INSERT INTO products (name, category_id, part_number, brand, model, specification, unit, purchase_price, sale_price, min_stock, max_stock, description) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const result = await query(sql, params);
        
        // 获取插入的ID
        const productId = result.insertId;
        
        // 初始化库存
        await query('INSERT IGNORE INTO inventory (product_id, current_stock) VALUES (?, 0)', [productId]);
        
        res.json({ id: productId, message: '商品添加成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 更新商品信息
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, category_id, part_number, brand, model, specification, unit, purchase_price, sale_price, min_stock, max_stock, description } = req.body;
        
        // 将undefined值转换为null，避免数据库参数绑定错误
        const params = [
            name || null,
            category_id || null,
            part_number || null,
            brand || null,
            model || null,
            specification || null,
            unit || '个',
            purchase_price || null,
            sale_price || null,
            min_stock || 0,
            max_stock || 100,
            description || null,
            req.params.id
        ];
        
        const sql = `UPDATE products SET name=?, category_id=?, part_number=?, brand=?, model=?, specification=?, unit=?, purchase_price=?, sale_price=?, min_stock=?, max_stock=?, description=? 
                     WHERE id=?`;
        
        await query(sql, params);
        
        res.json({ message: '商品更新成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除商品
app.delete('/api/products/:id', async (req, res) => {
    try {
        await query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: '商品删除成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 入库管理API

// 获取入库记录
app.get('/api/stock-in', async (req, res) => {
    try {
        const stockInRecords = await query('SELECT * FROM stock_in');
        const products = await query('SELECT * FROM products');
        const suppliers = await query('SELECT * FROM suppliers');
        
        // 手动关联数据
        const result = stockInRecords.map(record => {
            const product = products.find(p => p.id === record.product_id);
            const supplier = suppliers.find(s => s.id === record.supplier_id);
            
            return {
                ...record,
                product_name: product ? product.name : '未知商品',
                supplier_name: supplier ? supplier.name : '未知供应商'
            };
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加入库记录
app.post('/api/stock-in', async (req, res) => {
    try {
        const { product_id, supplier_id, quantity, unit_price, batch_number, operator, notes } = req.body;
        
        // 将undefined值转换为null或默认值，避免数据库参数绑定错误
        const params = [
            product_id || null,
            supplier_id || null,
            quantity || 0,
            unit_price || 0,
            (quantity || 0) * (unit_price || 0), // total_amount
            batch_number || null,
            operator || '未知操作员',
            notes || null
        ];
        
        const sql = `INSERT INTO stock_in (product_id, supplier_id, quantity, unit_price, total_amount, batch_number, operator, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const result = await query(sql, params);
        
        // 更新库存
        await query('UPDATE inventory SET current_stock = current_stock + ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?', 
                   [quantity || 0, product_id || null]);
        
        res.json({ id: result.insertId, message: '入库记录添加成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 出库管理API

// 获取出库记录
app.get('/api/stock-out', async (req, res) => {
    try {
        const stockOutRecords = await query('SELECT * FROM stock_out');
        const products = await query('SELECT * FROM products');
        
        // 手动关联数据
        const result = stockOutRecords.map(record => {
            const product = products.find(p => p.id === record.product_id);
            
            return {
                ...record,
                product_name: product ? product.name : '未知商品',
                sale_price: record.unit_price // 将unit_price映射为sale_price
            };
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加出库记录
app.post('/api/stock-out', async (req, res) => {
    try {
        const { product_id, quantity, sale_price, customer_name, operator, notes } = req.body;
        const total_amount = quantity * sale_price;
        
        // 检查库存是否足够
        const inventory = await query('SELECT * FROM inventory');
        const inventoryItem = inventory.find(item => item.product_id === product_id);
        
        if (!inventoryItem || inventoryItem.current_stock < quantity) {
            res.status(400).json({ error: '库存不足' });
            return;
        }
        
        const sql = `INSERT INTO stock_out (product_id, quantity, unit_price, total_amount, customer_name, operator, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const result = await query(sql, [product_id, quantity, sale_price, total_amount, customer_name, operator, notes]);
        
        // 更新库存
        await query('UPDATE inventory SET current_stock = current_stock - ? WHERE product_id = ?', 
                   [quantity, product_id]);
        
        res.json({ id: result.insertId, message: '出库记录添加成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 分类管理API

// 获取所有分类
app.get('/api/categories', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM categories ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 供应商管理API

// 获取所有供应商
app.get('/api/suppliers', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM suppliers ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 库存管理API

// 获取库存状态
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await query('SELECT * FROM inventory');
        const products = await query('SELECT * FROM products');
        
        // 手动关联数据
        const result = inventory.map(item => {
            const product = products.find(p => p.id === item.product_id);
            
            return {
                ...item,
                product_name: product ? product.name : '未知商品',
                part_number: product ? product.part_number : '',
                brand: product ? product.brand : '',
                model: product ? product.model : '',
                min_stock: product ? product.min_stock : 0,
                max_stock: product ? product.max_stock : 0
            };
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取库存预警（低于最小库存的商品）
app.get('/api/inventory/alerts', async (req, res) => {
    try {
        const inventory = await query('SELECT * FROM inventory');
        const products = await query('SELECT * FROM products');
        
        // 手动关联数据并筛选预警
        const result = inventory
            .map(item => {
                const product = products.find(p => p.id === item.product_id);
                
                return {
                    ...item,
                    product_name: product ? product.name : '未知商品',
                    part_number: product ? product.part_number : '',
                    brand: product ? product.brand : '',
                    model: product ? product.model : '',
                    min_stock: product ? product.min_stock : 0,
                    max_stock: product ? product.max_stock : 0
                };
            })
            .filter(item => item.current_stock <= item.min_stock)
            .sort((a, b) => a.current_stock - b.current_stock);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await testConnection();
        console.log('MySQL数据库连接成功');
        
        // 初始化数据库结构
        await initializeDatabase();
        console.log('数据库初始化完成');
        
        // 启动服务器
        const server = app.listen(PORT, () => {
            console.log(`汽修商品出入库系统服务器运行在端口 ${PORT}`);
            console.log(`访问地址: http://localhost:${PORT}`);
        });
        
        // 保持服务器运行
        process.on('uncaughtException', (error) => {
            console.error('未捕获的异常:', error);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('未处理的Promise拒绝:', reason);
        });
        
        // 返回server对象，保持进程运行
        return server;
        
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器并保持运行
startServer().then(server => {
    console.log('服务器已成功启动并正在运行...');
    
    // 保持进程运行
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        server.close(() => {
            console.log('服务器已关闭');
            process.exit(0);
        });
    });
    
    process.on('SIGTERM', () => {
        console.log('\n正在关闭服务器...');
        server.close(() => {
            console.log('服务器已关闭');
            process.exit(0);
        });
    });
    
    // 防止进程在没有活跃连接时退出
    const keepAlive = setInterval(() => {
        // 空函数，只是为了保持事件循环活跃
    }, 1000);
    
    // 清理定时器
    server.on('close', () => {
        clearInterval(keepAlive);
    });
    
}).catch(error => {
    console.error('服务器启动失败:', error);
    process.exit(1);
});