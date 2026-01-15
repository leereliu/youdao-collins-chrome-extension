# youdao-collins-chrome-extension

查询英文单词的[柯林斯](https://www.collinsdictionary.com/)释义的 Chrome 扩展应用。支持划词翻译，数据来源于有道词典。接入扇贝生词本，快速记录新单词，方便未来复习。

![intro](https://oyyd.github.io/youdao-collins-chrome-extension/pics/intro.webp)

## ✨ 特性

- 🔍 **柯林斯词典释义** - 提供英文语境帮助更准确地理解单词意思
- 📝 **划词翻译** - 支持多种模式（划词即翻、按键+划词、双击划词）
- 📚 **扇贝生词本** - 快速记录新单词，方便日后复习
- ⌨️ **快捷键支持** - `Ctrl+Q` 快速打开搜索弹窗

## 📦 安装

### Chrome Web Store

去 Chrome Web Store 上[下载](https://chrome.google.com/webstore/detail/mkohdjbfagmlcaclajmadgkojelkbbfj/)

### 本地开发安装

1. 克隆仓库并安装依赖：

```bash
git clone https://github.com/oyyd/youdao-collins-chrome-extension.git
cd youdao-collins-chrome-extension
pnpm install
```

2. 启动开发服务器：

```bash
pnpm dev
```

3. 在 Chrome 浏览器中加载扩展：
   - 打开 `chrome://extensions/`
   - 开启右上角「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目目录下的 `build/chrome-mv3-dev` 文件夹

4. 开发时修改代码会自动热重载，刷新页面即可看到更新

### 构建生产版本

```bash
pnpm build
```

构建产物位于 `build/chrome-mv3-prod` 目录。

### 打包发布

```bash
pnpm package
```

打包后的 `.zip` 文件位于 `build/` 目录，可直接上传到 Chrome Web Store。

## 🚀 使用说明

### 划词翻译模式

在配置页面可以设置划词翻译的模式：

- **划词即翻译** - 选中文本后立即显示翻译
- **按住(meta/ctrl)键 + 划词** - 按住修饰键时选中文本才翻译
- **双击划词翻译** - 双击单词时翻译

### 快捷键

- `Ctrl+Q` (Mac: `MacCtrl+Q`) - 打开右上角弹窗搜索单词

### 扇贝生词本

搜索成功的单词可以快速加入扇贝生词本（需要扇贝账号），方便日后复习学习。

## 🛠️ 技术栈

- **Framework**: [Plasmo](https://www.plasmo.com/) - 现代化 Chrome 扩展开发框架
- **UI**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Manifest**: Chrome Extension Manifest V3

## 📁 项目结构

```
src/
├── background.ts          # Service Worker (后台脚本)
├── popup.tsx              # 弹窗页面
├── options.tsx            # 配置页面
├── contents/
│   └── plasmo-overlay.tsx # 划词翻译内容脚本
├── components/            # React 组件
│   └── WordDetail.tsx     # 单词详情（共用组件）
├── lib/                   # 工具库
│   ├── message.ts         # 消息通信
│   ├── parser.ts          # 有道页面解析器
│   ├── shanbay.ts         # 扇贝 API 封装
│   ├── storage.ts         # Chrome Storage 工具
│   └── types.ts           # 类型定义
├── styles/                # 样式文件
│   └── globals.css
└── __tests__/             # 测试文件
    ├── parser.test.ts
    └── fixtures/          # 测试数据
```

## 🧪 测试

```bash
# 运行测试（监听模式）
pnpm test

# 运行一次测试
pnpm test:run

# 类型检查
pnpm typecheck
```

## 📝 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm package` | 打包 zip 文件 |
| `pnpm test` | 运行测试 |
| `pnpm test:run` | 运行一次测试 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 代码检查 |

## 🔧 已知问题

- 对 iframe 中的内容不生效

## 💬 意见反馈

[issues](https://github.com/oyyd/youdao-collins-chrome-extension/issues)

## 📄 License

[MIT](./LICENSE.md)
