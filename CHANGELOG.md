# Changelog

## v1.2.0 (2026-07-08)

### ✨ 新增功能
- **多屏并排展示模式（Multi-Screen Mode）**：当原型包含多个页面时，支持将多个手机/页面并排同时展示（如登录+注册并排），而非传统的单页面切换
  - 新增 `__setMultiScreenMode(enabled, pageLabels)` API，一行调用即可启用
  - 注释面板自动渲染页面筛选 Tab（全部 / 📱 登录页 / 📲 注册页），切换 Tab 时标记和面板列表同步过滤
  - 注释面板支持「页面 → 类型」二级分组：先按页面分节，再按注释类型（交互说明/业务逻辑/边界异常）分组
  - 跨页面注释定位：点击面板中任意注释项，自动 `scrollIntoView` 滚动到对应屏幕并高亮目标元素
  - 向后兼容：不调用 `__setMultiScreenMode` 时，行为与 v1.1 完全一致（传统单页切换模式不受影响）
- **SKILL.md 多屏模式编码规范**：新增完整的多屏并排模式代码模板和 API 使用说明
- **prototype-guide.md 多屏指南**：新增「多屏并排展示模式」章节，含使用场景判断、布局模板、滚动定位、注释注册示例、面板行为对比表、API 速查表

### 🐛 Bug 修复
- **多页原型注册页空白问题**：多页面原型中，非首个页面（如注册页）的 `<div class="page-section">` 缺少 `active` class，被 CSS `.page-section { display: none !important; }` 隐藏。修复方案：多屏模式下所有页面均添加 `active` class，始终可见
- **页面切换导致对方消失**：传统 `switchToRegister/switchToLogin` 通过移除/添加 `active` class 来切换页面，在并排展示时会导致一个页面消失。修复方案：多屏模式下切换逻辑改为 `scrollIntoView` 滚动定位，不再隐藏/显示页面
- **注释面板只显示单页注释**：`renderPanel` 按 `_activePage` 过滤注释，导致并排展示时面板只显示一半注释且无法区分归属。修复方案：多屏模式下面板按「页面 → 类型」二级分组，默认「全部」模式显示所有注释

### 🔧 优化
- **`__focusAnnotation` 滚动定位**：多屏模式下点击面板注释项时，直接 `scrollIntoView` 滚动到目标元素并高亮，不再触发页面切换
- **`updateAnnotationVisibility` 支持 `_pageFilter`**：新增页面筛选逻辑，支持「全部 / 指定页面」两种过滤模式
- **注释注册默认不再切回登录页**：多屏模式下注释注册完毕后不再调用 `setActivePage('pageLogin')`，避免面板被过滤到单页

## v1.1.0 (2026-06-25)

### ✨ 新增功能
- **注释质量标准体系**：新增完整的 Annotation Quality Standards 章节
  - 「三个问题」原则：数据从哪来、按什么排序、字段有哪些
  - 数据逻辑检查清单（4项）、交互行为检查清单（4项）、边界情况检查清单（4项）
  - 结构化注释内容格式规范（【数据逻辑】【排序规则】【字段组成】【业务规则】【边界异常】）
- **Annotation Coverage Rules 增强**：每种组件类型新增"补充要求"列
  - 审批流/Timeline 必须说明数据来源（完整预定义节点 vs 仅已流转）、排序规则、字段组成
  - 数据表格/列表必须包含【数据来源】【排序规则】【字段字典】
- **工具栏「🔵 注释标记」按钮**：支持一键隐藏/显示所有注释标记和卡片

### 🐛 Bug 修复
- **注释注册时序竞争**：将 `__onAnnotationsReady` 回调方式改为轮询等待模式（setTimeout 50ms），彻底解决注释标记不显示的问题
- **标记位置偏移**：注册代码外层包裹 `requestAnimationFrame`，确保布局渲染完毕后再计算元素位置
- **选择器匹配多个元素**：`.tl-content` 改为具体选择器，避免匹配多个元素导致定位错误
- **`preview_url` → `present_files`**：Step 4 中工具名修正

### 🎨 样式调整
- 注释标记配色对齐：interaction 改回 #1677ff，edgecase 改回 #ff4d4f

## v1.0.1 (2026-06-22)

### 🐛 Bug 修复
- **注释编号不复位问题**：删除注释后新增，编号不再从最大编号递增，改为自动扫描并复用已删除的编号
  - 移除了全局 `_nextId` 计数器
  - 新增 `getNextAnnotationId()` 函数，使用 `Set` 收集现有编号，返回最小未使用值
  - 同步清理 `clearAnnotations()` 中已废弃的 `_nextId = 1` 重置逻辑

### 🔧 优化
- **项目结构调整**：文件从 `pm-prototype-prd/` 子目录移至仓库根目录，`git clone` 后直接可见
