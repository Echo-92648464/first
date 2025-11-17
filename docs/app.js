// 汽修商品出入库系统前端JavaScript
class AutoPartsInventorySystem {
    constructor() {
        // 优先使用页面中配置的 window.API_BASE（部署时在 index.html 设置），
        // 若未设置则使用空字符串，表示使用相对路径（同域后端或本地）
        this.apiBase = (typeof window !== 'undefined' && window.API_BASE !== undefined) ? window.API_BASE : '';
        this.currentTab = 'dashboard';
        this.categories = [];
        this.suppliers = [];
        this.products = [];
        this.inventory = [];
        this.stockInRecords = [];
        this.stockOutRecords = [];
        
        this.init();
    }
    
    // 初始化应用
    async init() {
        try {
            this.showLoading('正在加载数据...');
            await this.loadInitialData();
            this.setupEventListeners();
            this.setupRealTimeValidation();
            this.showTab('dashboard');
            this.updateDashboard();
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('初始化失败: ' + error.message);
        }
    }
    
    // 加载初始数据
    async loadInitialData() {
        try {
            this.categories = await this.fetchData('/api/categories');
        this.suppliers = await this.fetchData('/api/suppliers');
        this.products = await this.fetchData('/api/products');
        this.inventory = await this.fetchData('/api/inventory');
        this.stockInRecords = await this.fetchData('/api/stock-in');
        this.stockOutRecords = await this.fetchData('/api/stock-out');
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('数据加载失败，请检查服务器连接');
        }
    }
    
    // API请求封装
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }
    }
    
    async postData(endpoint, data) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this.handleNetworkError(error);
            throw error;
        }
    }
    
    async putData(endpoint, data) {
        const response = await fetch(`${this.apiBase}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    
    async deleteData(endpoint) {
        const response = await fetch(`${this.apiBase}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.nav-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab || e.target.closest('.nav-item').dataset.tab;
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
        
        // 模态框关闭
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        });
        
        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
        
        // 表单提交
        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
        
        document.getElementById('stockInForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStockIn();
        });
        
        document.getElementById('stockOutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStockOut();
        });
        
        // 搜索功能
        document.getElementById('productSearch').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });
        
        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            this.searchInventory(e.target.value);
        });
    }
    
    // 显示标签页
    showTab(tabName) {
        // 隐藏所有标签页内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 移除所有标签页按钮的激活状态
        document.querySelectorAll('.nav-item').forEach(button => {
            button.classList.remove('active');
        });
        
        // 显示选中的标签页
        let tabId = `${tabName}Tab`;
        // 特殊处理：stock-in 对应 stockInTab，stock-out 对应 stockOutTab
        if (tabName === 'stock-in') {
            tabId = 'stockInTab';
        } else if (tabName === 'stock-out') {
            tabId = 'stockOutTab';
        }
        
        const tabElement = document.getElementById(tabId);
        const navElement = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (tabElement) {
            tabElement.classList.add('active');
        }
        if (navElement) {
            navElement.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // 根据标签页加载数据
        switch(tabName) {
            case 'products':
                this.loadProducts();
                break;
            case 'stock-in':
                this.loadStockInRecords();
                break;
            case 'stock-out':
                this.loadStockOutRecords();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'dashboard':
                this.updateDashboard();
                break;
        }
    }
    
    // 更新仪表盘
    async updateDashboard() {
        try {
            // 获取库存预警
            const alerts = await this.fetchData('/api/inventory/alerts');
            
            // 更新统计信息
            const totalProducts = this.products.length;
            const totalStockIn = this.stockInRecords.reduce((sum, record) => sum + record.quantity, 0);
            const totalStockOut = this.stockOutRecords.reduce((sum, record) => sum + record.quantity, 0);
            const totalValue = this.inventory.reduce((sum, item) => {
                const product = this.products.find(p => p.id === item.product_id);
                return sum + (item.current_stock * (product ? product.purchase_price : 0));
            }, 0);
            
            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('totalStockIn').textContent = totalStockIn;
            document.getElementById('totalStockOut').textContent = totalStockOut;
            document.getElementById('totalValue').textContent = totalValue.toFixed(2);
            document.getElementById('alertsCount').textContent = alerts.length;
            
            // 显示库存预警
            this.displayAlerts(alerts);
        } catch (error) {
            console.error('更新仪表盘失败:', error);
        }
    }
    
    // 显示库存预警
    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsList');
        alertsContainer.innerHTML = '';
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="no-data">暂无库存预警</div>';
            return;
        }
        
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div class="alert-product">${alert.product_name}</div>
                <div class="alert-stock">当前库存: ${alert.current_stock}</div>
                <div class="alert-min">最低库存: ${alert.min_stock}</div>
                <div class="alert-status">库存不足</div>
            `;
            alertsContainer.appendChild(alertItem);
        });
    }
    
    // 商品管理功能
    async loadProducts() {
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="no-data">暂无商品数据</td></tr>';
            return;
        }
        
        this.products.forEach(product => {
            const category = this.categories.find(c => c.id === product.category_id);
            // 使用商品数据中的current_stock字段，确保与库存查询页面数据一致
            const currentStock = product.current_stock || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${category ? category.name : '未分类'}</td>
                <td>${product.part_number || '-'}</td>
                <td>${product.brand || '-'}</td>
                <td>${product.model || '-'}</td>
                <td>${product.unit || '-'}</td>
                <td>¥${product.purchase_price || '0.00'}</td>
                <td>¥${product.sale_price || '0.00'}</td>
                <td>${currentStock}</td>
                <td>
                    <button class="btn btn-edit" onclick="editProduct(${product.id})">编辑</button>
                <button class="btn btn-delete" onclick="deleteProduct(${product.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // 添加商品
    async addProduct() {
        const form = document.getElementById('addProductForm');
        
        // 表单验证
        const productName = document.getElementById('productName').value.trim();
        const productCategory = document.getElementById('productCategory').value.trim();
        const purchasePrice = parseFloat(document.getElementById('productCostPrice').value);
        const salePrice = parseFloat(document.getElementById('productSalePrice').value);
        const minStock = parseInt(document.getElementById('productMinStock').value);
        const maxStock = parseInt(document.getElementById('productMaxStock').value);
        
        if (!productName) {
            this.showError('请输入商品名称');
            return;
        }
        
        if (!productCategory) {
            this.showError('请输入商品分类');
            return;
        }
        
        if (purchasePrice <= 0) {
            this.showError('进货价必须大于0');
            return;
        }
        
        if (salePrice <= 0) {
            this.showError('销售价必须大于0');
            return;
        }
        
        if (salePrice < purchasePrice) {
            this.showError('销售价不能低于进货价');
            return;
        }
        
        if (minStock < 0) {
            this.showError('最低库存不能为负数');
            return;
        }
        
        if (maxStock <= minStock) {
            this.showError('最高库存必须大于最低库存');
            return;
        }
        
        const productData = {
            name: productName,
            category_id: 1, // 简化处理，使用默认分类
            part_number: document.getElementById('productPartNumber').value.trim(),
            brand: document.getElementById('productBrand').value.trim(),
            model: document.getElementById('productModel').value.trim(),
            specification: '',
            unit: document.getElementById('productUnit').value.trim(),
            purchase_price: purchasePrice,
            sale_price: salePrice,
            min_stock: minStock,
            max_stock: maxStock,
            description: ''
        };
        
        try {
            await this.postData('/api/products', productData);
            this.showSuccess('商品添加成功');
            this.hideModal('addProductModal');
            form.reset();
            await this.loadInitialData();
            this.loadProducts();
            this.updateDashboard();
        } catch (error) {
            this.showError('添加商品失败: ' + error.message);
        }
    }

    // 绑定添加商品表单提交事件
    bindAddProductForm() {
        const form = document.getElementById('addProductForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.addProduct();
            };
        }
    }
    
    // 编辑商品
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // 填充表单数据
        Object.keys(product).forEach(key => {
            const input = document.querySelector(`#editProductForm [name="${key}"]`);
            if (input) {
                input.value = product[key] || '';
            }
        });
        
        // 显示编辑模态框
        this.showModal('editProductModal');
        
        // 设置表单提交事件
        document.getElementById('editProductForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.updateProduct(productId);
        };
    }
    
    async updateProduct(productId) {
        const form = document.getElementById('editProductForm');
        const formData = new FormData(form);
        
        const productData = {
            name: formData.get('name'),
            category_id: parseInt(formData.get('category_id')),
            part_number: formData.get('part_number'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            specification: formData.get('specification'),
            unit: formData.get('unit'),
            purchase_price: parseFloat(formData.get('purchase_price')),
            sale_price: parseFloat(formData.get('sale_price')),
            min_stock: parseInt(formData.get('min_stock')),
            max_stock: parseInt(formData.get('max_stock')),
            description: formData.get('description')
        };
        
        try {
            await this.putData(`/api/products/${productId}`, productData);
            this.showSuccess('商品更新成功');
            this.closeModal();
            await this.loadInitialData();
            this.loadProducts();
            this.updateDashboard();
        } catch (error) {
            this.showError('更新商品失败: ' + error.message);
        }
    }
    
    async deleteProduct(productId) {
        if (!confirm('确定要删除这个商品吗？此操作不可撤销。')) {
            return;
        }
        
        try {
            await this.deleteData(`/api/products/${productId}`);
            this.showSuccess('商品删除成功');
            await this.loadInitialData();
            this.loadProducts();
            this.updateDashboard();
        } catch (error) {
            this.showError('删除商品失败: ' + error.message);
        }
    }
    
    // 搜索商品
    searchProducts(query) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            (product.part_number && product.part_number.toLowerCase().includes(query.toLowerCase())) ||
            (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
        );
        
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="no-data">未找到匹配的商品</td></tr>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const category = this.categories.find(c => c.id === product.category_id);
            // 使用商品数据中的current_stock字段，确保与库存查询页面数据一致
            const currentStock = product.current_stock || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${category ? category.name : '未分类'}</td>
                <td>${product.part_number || '-'}</td>
                <td>${product.brand || '-'}</td>
                <td>${product.model || '-'}</td>
                <td>${product.unit || '-'}</td>
                <td>¥${product.purchase_price || '0.00'}</td>
                <td>¥${product.sale_price || '0.00'}</td>
                <td>${currentStock}</td>
                <td>
                    <button class="btn btn-edit" onclick="editProduct(${product.id})">编辑</button>
                <button class="btn btn-delete" onclick="deleteProduct(${product.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // 入库管理功能
    async loadStockInRecords() {
        const tbody = document.querySelector('#stockInTable tbody');
        tbody.innerHTML = '';
        
        if (this.stockInRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">暂无入库记录</td></tr>';
            return;
        }
        
        this.stockInRecords.forEach(record => {
            const product = this.products.find(p => p.id === record.product_id);
            const supplier = this.suppliers.find(s => s.id === record.supplier_id);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product ? product.name : '未知商品'}</td>
                <td>${supplier ? supplier.name : '未知供应商'}</td>
                <td>${record.quantity}</td>
                <td>¥${record.unit_price}</td>
                <td>¥${record.total_amount}</td>
                <td>${record.batch_number || '-'}</td>
                <td>${record.operator || '-'}</td>
                <td>${new Date(record.in_date).toLocaleString()}</td>
                <td>${record.notes || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async addStockIn() {
        const form = document.getElementById('stockInForm');
        
        const productName = document.getElementById('stockInProductName').value.trim();
        const quantity = parseInt(document.getElementById('stockInQuantity').value);
        const unitPrice = parseFloat(document.getElementById('stockInPrice').value);
        
        // 表单验证
        if (!productName) {
            this.showError('请输入商品名称');
            return;
        }
        
        // 根据商品名称查找商品ID
        const product = this.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
        if (!product) {
            this.showError('商品不存在，请检查商品名称');
            return;
        }
        const productId = product.id;
        
        if (!quantity || quantity <= 0) {
            this.showError('入库数量必须大于0');
            return;
        }
        
        if (!unitPrice || unitPrice <= 0) {
            this.showError('入库单价必须大于0');
            return;
        }
        
        const stockInData = {
            product_id: productId,
            supplier_id: null, // 不再需要供应商信息
            quantity: quantity,
            unit_price: unitPrice,
            batch_number: document.getElementById('stockInBatchNumber').value,
            operator: document.getElementById('stockInOperator').value,
            notes: document.getElementById('stockInRemark').value
        };
        
        try {
            await this.postData('/api/stock-in', stockInData);
            this.showSuccess('入库记录添加成功');
            this.hideModal('stockInModal');
            form.reset();
            await this.loadInitialData();
            this.loadStockInRecords();
            this.updateDashboard();
        } catch (error) {
            this.showError('添加入库记录失败: ' + error.message);
        }
    }
    
    // 出库管理功能
    async loadStockOutRecords() {
        const tbody = document.querySelector('#stockOutTable tbody');
        tbody.innerHTML = '';
        
        if (this.stockOutRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">暂无出库记录</td></tr>';
            return;
        }
        
        this.stockOutRecords.forEach(record => {
            const product = this.products.find(p => p.id === record.product_id);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product ? product.name : '未知商品'}</td>
                <td>${record.quantity}</td>
                <td>¥${record.sale_price}</td>
                <td>¥${record.total_amount}</td>
                <td>${record.customer_name || '-'}</td>
                <td>${record.operator || '-'}</td>
                <td>${new Date(record.out_date).toLocaleString()}</td>
                <td>${record.notes || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async addStockOut() {
        const form = document.getElementById('stockOutForm');
        
        const productName = document.getElementById('stockOutProductName').value.trim();
        const quantity = parseInt(document.getElementById('stockOutQuantity').value);
        const customer = document.getElementById('stockOutCustomer').value.trim();
        
        // 表单验证
        if (!productName) {
            this.showError('请输入商品名称');
            return;
        }
        
        // 根据商品名称查找商品ID
        const product = this.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
        if (!product) {
            this.showError('商品不存在，请检查商品名称');
            return;
        }
        const productId = product.id;
        
        if (!quantity || quantity <= 0) {
            this.showError('出库数量必须大于0');
            return;
        }
        
        if (!customer) {
            this.showError('请输入客户名称');
            return;
        }
        
        // 检查库存是否足够
        const inventoryItem = this.inventory.find(item => item.product_id === productId);
        if (!inventoryItem) {
            this.showError('该商品库存不存在');
            return;
        }
        
        if (inventoryItem.current_stock < quantity) {
            this.showError(`库存不足，当前库存：${inventoryItem.current_stock}`);
            return;
        }
        
        const stockOutData = {
            product_id: productId,
            quantity: quantity,
            sale_price: parseFloat(document.getElementById('stockOutPrice').value),
            customer_name: customer,
            operator: document.getElementById('stockOutOperator').value,
            notes: document.getElementById('stockOutRemark').value
        };
        
        try {
            await this.postData('/api/stock-out', stockOutData);
            this.showSuccess('出库记录添加成功');
            this.hideModal('stockOutModal');
            form.reset();
            await this.loadInitialData();
            this.loadStockOutRecords();
            this.updateDashboard();
        } catch (error) {
            this.showError('添加出库记录失败: ' + error.message);
        }
    }
    
    // 库存管理功能
    async loadInventory() {
        const tbody = document.querySelector('#inventoryTable tbody');
        tbody.innerHTML = '';
        
        if (this.inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">暂无库存数据</td></tr>';
            return;
        }
        
        this.inventory.forEach(item => {
            const product = this.products.find(p => p.id === item.product_id);
            if (!product) return;
            
            const stockStatus = item.current_stock <= product.min_stock ? 'low' : 
                              item.current_stock >= product.max_stock ? 'high' : 'normal';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.part_number || '-'}</td>
                <td>${product.brand || '-'}</td>
                <td>${product.model || '-'}</td>
                <td>${item.current_stock}</td>
                <td>${product.min_stock}</td>
                <td>${product.max_stock}</td>
                <td><span class="stock-status ${stockStatus}">${stockStatus === 'low' ? '库存不足' : stockStatus === 'high' ? '库存过高' : '正常'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    searchInventory(query) {
        const filteredInventory = this.inventory.filter(item => {
            const product = this.products.find(p => p.id === item.product_id);
            return product && (
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                (product.part_number && product.part_number.toLowerCase().includes(query.toLowerCase())) ||
                (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
            );
        });
        
        const tbody = document.querySelector('#inventoryTable tbody');
        tbody.innerHTML = '';
        
        if (filteredInventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">未找到匹配的库存记录</td></tr>';
            return;
        }
        
        filteredInventory.forEach(item => {
            const product = this.products.find(p => p.id === item.product_id);
            const stockStatus = item.current_stock <= product.min_stock ? 'low' : 
                              item.current_stock >= product.max_stock ? 'high' : 'normal';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.part_number || '-'}</td>
                <td>${product.brand || '-'}</td>
                <td>${product.model || '-'}</td>
                <td>${item.current_stock}</td>
                <td>${product.min_stock}</td>
                <td>${product.max_stock}</td>
                <td><span class="stock-status ${stockStatus}">${stockStatus === 'low' ? '库存不足' : stockStatus === 'high' ? '库存过高' : '正常'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // 模态框控制
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // 消息提示
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 处理网络请求错误
    handleNetworkError(error) {
        console.error('Network error:', error);
        if (error.message.includes('Failed to fetch')) {
            this.showError('网络连接失败，请检查服务器状态');
        } else if (error.message.includes('404')) {
            this.showError('请求的资源不存在');
        } else if (error.message.includes('500')) {
            this.showError('服务器内部错误，请稍后重试');
        } else {
            this.showError('操作失败: ' + error.message);
        }
    }

    // 安全的JSON解析
    safeJsonParse(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON解析错误:', error);
            return null;
        }
    }

    // 验证数字输入
    validateNumberInput(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            return false;
        }
        return num >= min && num <= max;
    }

    // 验证必填字段
    validateRequiredFields(fields) {
        for (const field of fields) {
            if (!field.value || field.value.trim() === '') {
                this.showError(`${field.name}不能为空`);
                field.element.focus();
                return false;
            }
        }
        return true;
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div>
                <div class="loading"></div>
                <span class="loading-text">${message}</span>
            </div>
        `;
        overlay.id = 'loading-overlay';
        document.body.appendChild(overlay);
    }

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // 设置按钮加载状态
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> 处理中...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || button.textContent;
        }
    }

    // 表单字段验证样式
    setFieldError(field, hasError, message = '') {
        if (hasError) {
            field.classList.add('input-error');
            if (message) {
                let errorElement = field.nextElementSibling;
                if (!errorElement || !errorElement.classList.contains('error-message')) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    field.parentNode.insertBefore(errorElement, field.nextSibling);
                }
                errorElement.textContent = message;
            }
        } else {
            field.classList.remove('input-error');
            const errorElement = field.nextElementSibling;
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.remove();
            }
        }
    }

    // 实时表单验证
    setupRealTimeValidation() {
        // 数字输入验证
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('blur', () => {
                const value = parseFloat(input.value);
                if (isNaN(value) || value < 0) {
                    this.setFieldError(input, true, '请输入有效的数字');
                } else {
                    this.setFieldError(input, false);
                }
            });
        });

        // 必填字段验证
        const requiredInputs = document.querySelectorAll('input[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    this.setFieldError(input, true, '此字段为必填项');
                } else {
                    this.setFieldError(input, false);
                }
            });
        });
    }
}

// 初始化应用
const app = new AutoPartsInventorySystem();

// 全局函数供HTML调用
window.showAddProductModal = function() {
    app.showModal('addProductModal');
};

window.showStockInModal = function() {
    app.showModal('stockInModal');
};

window.showStockOutModal = function() {
    app.showModal('stockOutModal');
};

// 退出登录功能
window.logout = function() {
    if (confirm('确定要退出系统吗？')) {
        // 清除本地存储的数据（如果有）
        localStorage.clear();
        sessionStorage.clear();
        
        // 显示退出消息
        app.showSuccess('已成功退出系统');
        
        // 刷新页面回到初始状态
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
};

// 商品管理功能
window.editProduct = function(productId) {
    app.editProduct(productId);
};

window.deleteProduct = function(productId) {
    app.deleteProduct(productId);
};

// 模态框功能
window.showModal = function(modalId) {
    app.showModal(modalId);
};

window.hideModal = function(modalId) {
    app.hideModal(modalId);
};

// 报表功能
window.generateReport = function() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        app.showError('请选择开始日期和结束日期');
        return;
    }
    
    app.generateReport(startDate, endDate);
};

// 在AutoPartsInventorySystem类中添加报表方法
AutoPartsInventorySystem.prototype.generateReport = function(startDate, endDate) {
    // 这里可以添加报表生成逻辑
    // 由于没有Chart.js库，暂时显示简单的统计信息
    
    const filteredStockIn = this.stockInRecords.filter(record => {
        const recordDate = new Date(record.in_date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
    
    const filteredStockOut = this.stockOutRecords.filter(record => {
        const recordDate = new Date(record.out_date);
        return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
    
    const totalStockIn = filteredStockIn.reduce((sum, record) => sum + record.quantity, 0);
    const totalStockOut = filteredStockOut.reduce((sum, record) => sum + record.quantity, 0);
    const totalStockInValue = filteredStockIn.reduce((sum, record) => sum + record.total_amount, 0);
    const totalStockOutValue = filteredStockOut.reduce((sum, record) => sum + record.total_amount, 0);
    
    const reportContent = `
        <h3>统计报表 (${startDate} 至 ${endDate})</h3>
        <div class="report-summary">
            <div class="summary-item">
                <h4>入库统计</h4>
                <p>入库数量: ${totalStockIn}</p>
                <p>入库金额: ¥${totalStockInValue.toFixed(2)}</p>
                <p>入库记录数: ${filteredStockIn.length}</p>
            </div>
            <div class="summary-item">
                <h4>出库统计</h4>
                <p>出库数量: ${totalStockOut}</p>
                <p>出库金额: ¥${totalStockOutValue.toFixed(2)}</p>
                <p>出库记录数: ${filteredStockOut.length}</p>
            </div>
        </div>
        <div class="report-details">
            <h4>详细记录</h4>
            <div class="details-section">
                <h5>入库记录</h5>
                ${filteredStockIn.length > 0 ? 
                    filteredStockIn.map(record => {
                        const product = this.products.find(p => p.id === record.product_id);
                        return `<p>${product ? product.name : '未知商品'} - 数量: ${record.quantity} - 金额: ¥${record.total_amount}</p>`;
                    }).join('') : 
                    '<p>无入库记录</p>'
                }
            </div>
            <div class="details-section">
                <h5>出库记录</h5>
                ${filteredStockOut.length > 0 ? 
                    filteredStockOut.map(record => {
                        const product = this.products.find(p => p.id === record.product_id);
                        return `<p>${product ? product.name : '未知商品'} - 数量: ${record.quantity} - 金额: ¥${record.total_amount}</p>`;
                    }).join('') : 
                    '<p>无出库记录</p>'
                }
            </div>
        </div>
    `;
    
    // 显示报表结果
    this.showMessage(reportContent, 'info');
};