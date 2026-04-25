# 有道柯林斯划词翻译扩展

查询英文单词的柯林斯释义，支持网页划词翻译、弹窗搜索、长文本翻译和扇贝生词本。数据主要来自有道词典，AI 翻译通过用户自行配置的 OpenRouter API Key 提供。

本仓库是个人维护分支，基于原项目继续维护。MIT 许可和原版权信息保留在 [LICENSE.md](./LICENSE.md)。

## ✨ 特性

- 🔍 **柯林斯词典释义** - 提供英文语境、释义、例句和词频，帮助更准确地理解单词意思
- 📝 **智能翻译** - 单词和短语使用有道词典，长文本自动使用有道机翻
- 🤖 **AI 流式翻译** - 配置 OpenRouter API Key 后，长文本实时逐字显示 AI 翻译结果
- 🎛️ **自定义 AI 模型** - 支持在设置页填写 OpenRouter 模型名称
- 🎯 **划词翻译** - 支持多种模式：划词即翻、按键加划词、双击划词和禁用划词
- 📚 **扇贝生词本** - 快速记录新单词，方便日后复习
- 🔊 **英美发音切换** - 支持英音和美音两种发音类型
- ⌨️ **快捷键支持** - `Ctrl+Q` 快速打开搜索弹窗
- ↩️ **搜索历史回退** - 弹窗内可回到上一个搜索结果

## 📦 安装

### Chrome Web Store

商店版本发布中。发布完成后会在这里更新安装地址。

### 手动安装

1. 在 Release 页面下载扩展压缩包，或在本地运行 `pnpm package` 生成压缩包。
2. 解压得到 Chrome 扩展目录。
3. 打开 `chrome://extensions/`。
4. 开启右上角的开发者模式。
5. 选择加载已解压的扩展程序。
6. 选择解压后的扩展目录。

### 本地开发安装

```bash
git clone https://github.com/silence/youdao-collins-chrome-extension.git
cd youdao-collins-chrome-extension
pnpm install
pnpm dev
```

在 Chrome 扩展管理页加载 `build/chrome-mv3-dev` 目录。开发服务运行期间，页面刷新后即可看到最新效果。

## 🚀 使用说明

### 单词和短语

选中英文单词或短语后，扩展会查询有道词典页面并解析柯林斯内容。弹窗和网页浮层使用同一套结果展示。

### 长文本翻译

超过 3 个单词或 50 个字符的文本会进入长文本翻译流程。默认使用有道机翻。配置 AI 后，有道翻译和 AI 翻译会同时展示，AI 结果通过流式方式逐步显示。

### AI 增强翻译

1. 访问 [OpenRouter Keys](https://openrouter.ai/keys) 获取 API Key。
2. 打开扩展设置页。
3. 在 AI 增强翻译区域填写 API Key。
4. 按需填写模型名称，例如 `xiaomi/mimo-v2-flash:free`。
5. 保存设置并刷新当前网页。

未填写 API Key 时，扩展保持有道翻译流程。

### 划词翻译模式

设置页可选择以下模式：

- 划词即翻译：选中文本后显示翻译浮层
- 按住 meta 或 ctrl 后划词：按下修饰键时选中文本才触发翻译
- 双击单词后翻译：双击英文单词后触发翻译
- 禁用划词翻译：保留弹窗搜索，网页划词功能关闭

弹窗右侧的状态按钮可临时关闭或恢复划词翻译。

### 快捷键

- Windows 和 Linux：`Ctrl+Q`
- macOS：`Control+Q`

快捷键会打开扩展弹窗，便于直接输入单词或文本。

### 扇贝生词本

搜索结果中的生词本按钮会调用扇贝接口。首次使用需要登录扇贝账号。设置页提供清除扇贝登录信息的入口。

## 🔐 隐私和数据

扩展会在 `chrome.storage.sync` 中保存设置项、OpenRouter API Key、扇贝登录状态和本地单词记录。翻译时，选中文本会发送到有道词典。启用 AI 增强翻译后，长文本会发送到 OpenRouter。使用扇贝生词本时，单词会发送到扇贝服务。

扩展不包含开发者自建的分析、广告或追踪服务。

## 🛠️ 技术栈

- **Framework**: [Plasmo](https://www.plasmo.com/) - 现代化 Chrome 扩展开发框架
- **UI**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Manifest**: Chrome Extension Manifest V3

## 🧰 开发环境

- Node.js 18 或更新版本
- pnpm
- Chrome 或 Chromium 浏览器

## 📁 项目结构

```text
src/
├── background.ts          # Service Worker 后台脚本
├── popup.tsx              # 弹窗页面
├── options.tsx            # 配置页面
├── contents/
│   └── plasmo-overlay.tsx # 划词翻译内容脚本
├── components/            # React 组件
│   └── WordDetail.tsx     # 单词详情共用组件
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
# 运行测试
pnpm test

# 运行一次测试
pnpm test:run

# 类型检查
pnpm typecheck
```

## 📝 开发命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Plasmo 开发服务 |
| `pnpm build` | 构建生产版本 |
| `pnpm package` | 生成 Chrome Web Store 可上传的 zip |
| `pnpm test` | 运行 Vitest 监听模式 |
| `pnpm test:run` | 运行一次测试 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |

## 🚢 构建和发布

```bash
pnpm install
pnpm test:run
pnpm typecheck
pnpm build
pnpm package
```

`pnpm package` 会在 `build/` 目录生成 zip 文件，可上传到 Chrome Web Store。

发布前建议完成以下检查：

- `package.json` 中的版本号、名称和简介已更新。
- `pnpm test:run`、`pnpm typecheck`、`pnpm build` 均通过。
- 在 `chrome://extensions/` 加载 `build/chrome-mv3-prod` 并验证核心流程。
- 商店说明覆盖权限用途和数据流向。
- 反馈入口指向当前维护仓库。

## 🔧 已知问题

- 对 iframe 中的内容暂不生效。
- 有道词典页面结构变化时，释义解析可能需要同步维护。

## 💬 意见反馈

问题反馈请提交到 [GitHub Issues](https://github.com/silence/youdao-collins-chrome-extension/issues)。

## 📄 License

[MIT](./LICENSE.md)
