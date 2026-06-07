# 🚀 Go & Web3 后端高级研发面试精华静态网页

这是一个用于展示和学习 Go & Web3 面试题的高颜值、交互式静态页面。采用纯原生 HTML/CSS/JS (Vanilla) 编写，界面极具科技感（暗黑空间主题、磨砂玻璃拟态、霓虹渐变），并内置了“背题/刷题”和“代码一键复制”等实用学习交互。

## 📂 项目结构

```plaintext
webpage/
├── index.html       # 网页主结构与布局
├── style.css        # 极致设计的 Vanilla CSS 样式表 (包含深/浅色主题)
├── app.js           # 网页核心交互逻辑 (搜索、分类过滤、背题状态存储)
├── build_data.py    # Python 数据编译提取脚本 (扫描解析上级 MD 文件)
└── data.js          # 编译后的面试题数据库 (由 build_data.py 自动生成)
```

## 🛠️ 本地预览与数据更新

### 1. 本地运行预览
在 `webpage` 目录下启动一个轻量级的本地 HTTP 服务：

```bash
# 使用 Python3 启动
python3 -m http.server 8888
```

启动后，在浏览器中访问：[http://localhost:8888](http://localhost:8888) 即可预览。

### 2. 更新面试题数据
如果您对上层目录中的任何 `.md` 文件（如 `并发编程.md`、`数据结构01.md` 等）进行了修改或扩充，只需在 `webpage` 目录下重新运行解析脚本，网页上的数据就会实时同步更新：

```bash
python3 build_data.py
```

---

## 🌐 部署至 GitHub Pages

要将此高颜值面试网页发布到公网并建立您个人的面试刷题库，请按照以下步骤操作：

### 步骤 1：在 GitHub 上创建一个新的仓库
登录您的 GitHub 账号，创建一个名为 `go-interview-hub` (或任何您喜欢的名字) 的 **Public** 仓库（不要勾选初始化 README）。

### 步骤 2：添加远程仓库并推送
在本地 `webpage` 目录下的终端运行以下命令：

```bash
# 添加您的 GitHub 仓库作为远程源 (请替换 USERNAME 和 REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 将本地代码推送到 GitHub
git push -u origin main
```

### 步骤 3：开启 GitHub Pages 服务
1. 进入 GitHub 上的仓库页面，点击右上角的 **Settings** (设置)。
2. 在左侧导航栏中找到 **Pages** 选项。
3. 在 **Build and deployment** 下，选择 **Deploy from a branch**。
4. 在 **Branch** 栏选择 `main` 分支，目录选择 `/ (root)`，然后点击 **Save** (保存)。

稍等 1-2 分钟，GitHub 会自动为您构建并发布静态网站，您可以通过 GitHub 提供的专属 URL（例如：`https://USERNAME.github.io/REPO_NAME/`）在手机、平板或电脑上随时随地开始备考！
