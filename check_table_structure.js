const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
    let connection;
    try {
        console.log('开始检查数据库表结构...\n');

        // 创建数据库连接
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'auto_parts_inventory'
        });

        // 检查products表结构
        console.log('=== products表结构 ===');
        const [productColumns] = await connection.execute('DESCRIBE products');
        console.log('字段列表:');
        productColumns.forEach(col => {
            console.log(`  ${col.Field} (${col.Type})`);
        });

        // 检查stock_out表结构
        console.log('\n=== stock_out表结构 ===');
        const [stockOutColumns] = await connection.execute('DESCRIBE stock_out');
        console.log('字段列表:');
        stockOutColumns.forEach(col => {
            console.log(`  ${col.Field} (${col.Type})`);
        });

        // 检查stock_out表中的数据
        console.log('\n=== stock_out表数据 ===');
        const [stockOutData] = await connection.execute('SELECT * FROM stock_out');
        console.log('记录数量:', stockOutData.length);
        if (stockOutData.length > 0) {
            console.log('第一条记录:', JSON.stringify(stockOutData[0], null, 2));
        }

        console.log('\n✅ 表结构检查完成');
        
    } catch (error) {
        console.error('❌ 检查表结构失败:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTableStructure().then(() => {
    console.log('检查脚本执行完成');
    process.exit(0);
}).catch(error => {
    console.error('检查脚本执行失败:', error);
    process.exit(1);
});