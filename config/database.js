const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'auto_parts_inventory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL数据库连接失败:', error.message);
        return false;
    }
}

// 执行SQL查询
async function query(sql, params = []) {
    try {
        const [rows, fields] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('SQL执行错误:', error.message);
        throw error;
    }
}

// 执行事务
async function transaction(operations) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const result = await operations({
            execute: async (sql, params) => {
                const [rows] = await connection.execute(sql, params);
                return rows;
            }
        });
        
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    query,
    transaction,
    testConnection
};