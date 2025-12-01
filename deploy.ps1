# 汽修商品出入库系统 - 自动部署脚本

# 设置执行策略
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 检查并安装Git
Write-Host "Checking for Git installation..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not found. Installing Git..."
    # 使用winget安装Git（Windows 10 1709+或Windows 11）
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Git.Git --source winget
        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "Error: winget is not available. Please install Git manually from https://git-scm.com/"
        exit 1
    }
} else {
    Write-Host "Git is already installed."
}

# 配置Git用户名和邮箱 - 使用默认值避免交互式输入
Write-Host "Configuring Git user with default values..."
git config --global user.name "auto-parts-inventory"
git config --global user.email "inventory@example.com"
Write-Host "Git user configured successfully."

# 检查是否存在.git目录
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..."
    git init
} else {
    Write-Host "Git repository already exists."
}

# 创建.gitignore文件
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore file..."
    $gitignoreContent = @"
# 依赖目录
node_modules/
.pnp/
.pnp.js

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# 编辑器目录和文件
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# 生产构建目录
build/
dist/

# 测试覆盖率
coverage/
.nyc_output/

# 临时文件
*.tmp
*.temp
.cache/

# 操作系统文件
Thumbs.db
Desktop.ini
"@
    Set-Content -Path ".gitignore" -Value $gitignoreContent
    Write-Host ".gitignore file created successfully."
} else {
    Write-Host ".gitignore file already exists."
}

# 检查项目文件结构
Write-Host "Checking project file structure..."
if (Test-Path "server.js" -and Test-Path "package.json" -and Test-Path "public") {
    Write-Host "✅ Project structure looks good."
} else {
    Write-Host "⚠️  Warning: Some key project files may be missing."
}

# 添加文件到Git
Write-Host "Adding files to Git..."
git add .

# 提交更改
try {
    Write-Host "Committing changes..."
    git commit -m "Initial commit: Auto parts inventory system"
    Write-Host "✅ Commit successful."
} catch {
    Write-Host "ℹ️  Nothing to commit or commit already exists."
}

# GitHub Pages 部署说明
Write-Host "====================================="
Write-Host "GitHub Pages Deployment Instructions"
Write-Host "====================================="
Write-Host "1. Create a new repository on GitHub"
Write-Host "2. Run the following commands to connect and push:"
Write-Host "   git remote add origin https://github.com/[YOUR_USERNAME]/[REPOSITORY_NAME].git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "For GitHub Pages setup:"
Write-Host "1. Go to repository Settings > Pages"
Write-Host "2. Under 'Source', select 'Deploy from a branch'"
Write-Host "3. Select 'main' branch and '/ (root)' directory"
Write-Host "4. Click 'Save'"
Write-Host ""
Write-Host "Note: For a Node.js application, you may need to:"
Write-Host "- Use Vercel, Netlify, or Heroku for full backend deployment"
Write-Host "- Or build a static version for GitHub Pages"
Write-Host "====================================="

Write-Host ""
Write-Host "✅ Deployment script completed! Please follow the GitHub Pages setup instructions above."