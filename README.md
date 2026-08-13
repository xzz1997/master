# 🎣 摸鱼快乐屋 · 60s 娱乐聚合站

> 打工人快乐基地 —— 聚合「60秒读懂世界」资讯、全网热搜榜单、摸鱼进度、随机娱乐与实用工具箱，数据实时来自开源免费的 [60s API](https://60s.viki.moe)（[GitHub](https://github.com/vikiboss/60s)）。

纯静态站点：**HTML + CSS + 原生 JS，零构建、零依赖、双击即可运行**，部署到任意静态托管平台即可公开访问。

---

## ✨ 功能特性

| 板块 | 说明 | 数据接口 |
|---|---|---|
| 📅 今日摸鱼日报 | 公历/农历、假期标签、周/月/年进度条动画、倒计时、摸鱼语录 | `/moyu` |
| 📰 每天60秒 | 15 条新闻速览 + 顶部跑马灯 + 每日寄语 | `/60s` |
| 🖼️ 今日壁纸 | 必应每日精选（支持 4K） | `/bing` |
| 🔥 全网热搜 | 微博 / B站 / 知乎 / 抖音 / 百度 / 小红书 / 网易云（含飙升/新歌/热歌/原创子榜单） | `/weibo` `/bili` `/zhihu` `/douyin` `/baidu/hot` `/rednote` `/ncm-rank/*` |
| 🎮 娱乐百宝箱 | 一言、段子、冷笑话、疯狂星期四、答案之书、发病文学（可定制名字）、今日运势、随机唱歌 | `/hitokoto` `/duanzi` `/dad-joke` `/kfc` `/answer` `/fabing` `/luck` `/changya` |
| 🧰 打工人工具箱 | 金价（贵金属/品牌金店/银行金条/回收价）、实时天气（空气/生活指数/预警）、翻译（109 种语言带音标）、实时汇率 | `/gold-price` `/weather` `/fanyi` `/fanyi/langs` `/exchange-rate` |
| 🎵 网易云 BGM | 右下角外链播放器，内置 6 首精选曲目 | music.163.com |
| 🍀 开屏欢迎弹窗 | 每日运势 + 一言，支持「换一条」 | `/luck` `/hitokoto` |

**其他亮点**：得意黑 Smiley Sans 标题字体（本地托管）、暗/亮双主题一键切换、毛玻璃拟态 + 霓虹渐变、全响应式（手机/桌面）、接口限流自动降级为示例数据（页面永不白屏）。

---

## 🚀 在线预览

<!-- 部署完成后，把链接替换成你自己的地址 -->
**https://你的用户名.github.io/60s-entertainment/**

---

## 📂 目录结构

```
entertainment-site/
├── index.html          # 首页（资讯/榜单/娱乐/壁纸）
├── toolbox.html        # 工具箱（金价/天气/翻译/汇率）
├── style.css           # 共享样式（含得意黑字体声明）
├── common.js           # 公共层：API 请求/缓存/限流降级/音乐面板/欢迎弹窗
├── index.js            # 首页逻辑
├── toolbox.js          # 工具箱逻辑
└── fonts/
    └── smiley-sans.woff2   # 得意黑 Smiley Sans 字体（本地托管，离线可用）
```

---

## 🖥️ 本地运行

```bash
# 方式一：直接双击 index.html 即可（推荐用方式二体验更完整）
# 方式二：本地静态服务器（音乐外链更稳定）
cd entertainment-site
npx serve .
# 然后浏览器打开 http://localhost:3000
```

---

## 📤 部署到 GitHub Pages（推荐 · 免费）

本项目已内置 **GitHub Actions 自动部署工作流**（`.github/workflows/deploy.yml`），以后每次 `push` 到 `main` 分支都会**自动构建并发布**，无需手动操作。

### 第 1 步：创建仓库并推送

```bash
# 在 GitHub 网页上新建一个仓库（例如取名 60s-entertainment，公开仓库）
# 然后在本地执行：
cd entertainment-site
git init
git add .
git commit -m "🎣 摸鱼快乐屋 v1.0"
git branch -M main
git remote add origin https://github.com/你的用户名/60s-entertainment.git
git push -u origin main
```

> 如果本地没装 Git，也可以直接在 GitHub 网页上传：仓库页 → **Add file → Upload files**，把 `entertainment-site` 文件夹里的**所有文件**（包括隐藏的 `.github` 文件夹和 `.nojekyll` 文件）拖进去。

### 第 2 步：开启 Pages 并选择 Actions 部署

1. 打开仓库 → **Settings**（设置）
2. 左侧菜单找到 **Pages**（GitHub Pages）
3. **Source** 选择 **`GitHub Actions`**（不是 Deploy from a branch）
4. 完成，之后每次 push 都会自动部署

> ⚠️ 注意：因为用了 Actions 自动部署，这里要选 **GitHub Actions**，而不是传统的 `Deploy from a branch`。

### 第 3 步：触发部署

- **自动**：`git push` 到 `main` 分支后自动触发
- **手动**：仓库 → **Actions** 页 → 左侧选中 `Deploy to GitHub Pages` → 右侧 **Run workflow** 按钮

在 **Actions** 页可以看到部署进度，绿色 ✅ 表示成功。首次部署大约需要 1~2 分钟。

### 第 4 步：访问

```
https://你的用户名.github.io/60s-entertainment/
```

> 💡 把该链接填到本文件上方「🚀 在线预览」处，README 就更完整啦。

---
## 🎯 其他免费部署方式

### Netlify（拖拽即用，最快）
1. 打开 <https://app.netlify.com/drop>
2. 把整个 `entertainment-site` 文件夹拖进去
3. 几秒后获得 `https://项目名.netlify.app` 公网链接

### Vercel（连接 GitHub 自动部署）
1. 打开 <https://vercel.com> 并用 GitHub 登录
2. **New Project** → Import 你的 `60s-entertainment` 仓库
3. Framework Preset 选 **Other**，直接 Deploy
4. 之后每次 push 到 main 都会自动更新

> ⚠️ 三家公司服务器均在海外，国内访问可能偏慢；若主要给国内用户使用，可考虑 Gitee Pages 或国内对象存储 + CDN。

---

## 📡 数据来源

- 全部数据来自开源免费的 [**60s API**](https://60s.viki.moe)：基础地址 `https://60s.viki.moe/v2`，GET 请求、无需 Key，返回 `{ code, message, data }`
- 接口带 Cloudflare 限流，本站已内置 **30 分钟缓存 + 串行请求 + 限流自动降级**，正常使用完全够用；高流量场景建议自行加服务端缓存
- 标题字体：[得意黑 Smiley Sans](https://github.com/atelier-anchor/smiley-sans)（OFL 开源协议，本地托管）

---

## ⚠️ 免责声明

本项目仅供学习与娱乐，数据版权归原平台所有；请合理使用接口，勿高频调用。