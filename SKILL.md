---
name: pm-prototype-prd
description: >
  高保真交互式HTML原型 + 墨刀式页面内嵌注释标注系统。输入文字需求或参考截图，输出可直接运行和点击交互的HTML原型页面，所有功能注释、业务逻辑、边界说明直接标注在页面组件上（类似墨刀/Axure的批注样式）。支持框选工具实现局部迭代修改、参考图UI样式1:1复刻、多端自适应原型（PC/APP/小程序/H5）。
  基于原型及其注释，可一键输出完整的需求规格说明书（PRD），模板参考腾讯、阿里、京东等大厂格式，注释自动映射为功能需求条目。
  This skill should be used when the user requests prototype design, HTML prototype, page mockup, interactive prototype, UI mockup, product design iteration, requirements annotation, or any product management visualization deliverable. Triggers: 原型, HTML原型, 交互原型, 页面设计, 高保真原型, 注释标注, 框选修改, 墨刀样式, 新功能设计, 页面迭代, 需求文档, PRD, 需求规格说明书, 需求文档输出.
agent_created: true
---

# High-Fidelity Interactive Prototype + In-Page Annotation System

## Purpose

Generate a single, self-contained, interactive HTML prototype page that:
1. **Renders as a real clickable UI** — buttons respond, tabs switch, modals open, data renders
2. **Has a 墨刀-style annotation overlay** — each functional area has a numbered badge, clicking opens a tooltip with the interaction/business/edge-case/permission description
3. **Includes a right-side annotation panel** — grouped by type, clickable to navigate and highlight
4. **Provides a marquee selection tool** — toggle selection mode, drag-select any region, describe the modification, and trigger iterative updates
5. **Supports lightweight output for small features** — for minor iterations, skip the long PRD; just annotate on the prototype what changed and why

## When to Use

Invoke when the user's request contains:
- "画原型" / "原型" / "prototype" / "mockup"
- "HTML原型" / "交互原型" / "可点击"
- "设计个页面" / "帮我画个页面" / "设计个界面"
- "注释" / "标注" / "批注" / "annotate"
- "迭代" / "修改" 某个页面的某个区域
- "参考这个" / "仿照这个" / "复刻"
- "需求文档" / "PRD" / "需求规格说明书" / "输出需求文档" / "需求文档导出"
- "基于原型输出文档" / "根据这个原型写文档" / "出个需求文档"
- Any request describing a new page, feature, or UI change

## Workflow

### Step 0: 检查参考图 (REFERENCE CHECK — 必须最先执行)

在开始任何分析之前，**第一步必须检查用户是否上传或提及了参考截图**。

#### 0.1 参考图检测规则

| 用户输入形式 | 如何处理 |
|-------------|---------|
| 消息中直接附带了截图文件（如 @image, 或上传的 PNG/JPG） | **必须使用 Read 工具读取该图片**，从中提取 UI 设计规范 |
| 消息中提到了"参考图/参照图/原来系统/类似"等字眼，但没看到图片文件 | 用 conversation_search 搜索历史会话中是否有关联的截图；如果找不到，**必须主动询问用户"能否把参考截图发一下？"**，不跳过此步骤 |
| 消息中有 `@image#` 标记但图片路径不可访问 | **坦诚告知用户图片已无法访问，请重新上传**，然后等待用户重新发送 |
| 用户明确说"没有参考图"或"你自己设计" | 使用默认 Ant Design 5.x 样式，跳过 Step 0.2 |

**禁止行为**：用户明确提供了参考图但不读取就直接用默认样式生成。**有图就必须读图。**

#### 0.2 参考图设计提取清单

用 Read 工具打开图片后，用眼睛逐项提取以下视觉规格，**必须输出为结构化的 CSS 变量表**：

```css
/* ===== 从参考图提取的设计规范 ===== */
--ref-primary-color: /* 主色，如 #1677ff */
--ref-primary-hover: /* 主色悬浮态，如 #4096ff */
--ref-success-color: /* 成功色，如 #52c41a */
--ref-warning-color: /* 警告色，如 #faad14 */
--ref-danger-color: /* 危险色，如 #ff4d4f */
--ref-bg-color:      /* 页面背景色，如 #f5f5f5 */
--ref-card-bg:       /* 卡片/容器背景色，如 #ffffff */
--ref-text-primary:  /* 主文字色，如 #262626 */
--ref-text-secondary:/* 次要文字色，如 #595959 */
--ref-text-muted:    /* 辅助文字色，如 #8c8c8c */
--ref-border-color:  /* 边框色，如 #d9d9d9 */
--ref-border-light:  /* 浅边框色，如 #f0f0f0 */
--ref-font-family:   /* 字体族，如 '-apple-system, PingFang SC, ...' */
--ref-font-size-sm:  /* 小字号(辅助)，如 12px */
--ref-font-size:     /* 正文字号，如 14px */
--ref-font-size-lg:  /* 大字号(副标题)，如 16px */
--ref-font-size-xl:  /* 标题字号，如 18px */
--ref-radius:        /* 组件圆角，如 6px */
--ref-radius-lg:     /* 卡片圆角，如 8px */
--ref-shadow:        /* 卡片阴影，如 0 1px 2px rgba(0,0,0,0.06) */
--ref-shadow-hover:  /* 悬浮阴影，如 0 4px 12px rgba(0,0,0,0.08) */
--ref-nav-height:    /* 导航栏高度，如 56px */
--ref-nav-bg:        /* 导航栏背景色 */
--ref-nav-text:      /* 导航栏文字色 */
--ref-table-header-bg:  /* 表格表头背景色 */
--ref-table-hover-bg:   /* 表格行悬浮背景色 */
--ref-btn-padding:   /* 按钮 padding，如 4px 16px */
--ref-btn-radius:    /* 按钮圆角 */
--ref-input-height:  /* 输入框高度，如 32px */
--ref-sidebar-width: /* 侧边栏宽度，如 220px */
```

**逐项检查要求**：
- 截图里有什么就提取什么，**不要凭空编造不存在的值**
- 颜色值用取色器逻辑近似匹配：从截图肉眼判断主色 → 对照常见色值表给出最接近的标准色值
- 如果截图中某些样式看不清楚或不存在（如没有表格），提取表中对应项标注为 `N/A（参考图中未出现）`
- 按钮、表格、弹窗、导航、输入框等组件，**逐个截图比对**

#### 0.3 提取后的输出格式

提取完成后，必须以如下格式输出一份**可执行规范摘要**，作为后续原型生成的直接依据：

```
📐 从参考图提取的设计规范摘要

主色: #1677ff | 背景: #f0f2f5 | 文字: #262626
字体: PingFang SC 14px | 圆角: 6px | 阴影: 0 2px 8px rgba(0,0,0,0.08)

组件样式:
- 导航栏: 高度56px, 白色背景, 底部1px边框
- 筛选区: 白色卡片, 圆角8px, padding 20px
- 按钮: 蓝色填充(主色) / 白色边框(次), 圆角6px, 高度32px
- 表格: 表头灰底#fafafa, 行悬浮变灰, 条纹行交替
- 输入框: 高度32px, 边框#d9d9d9, focus蓝色边框+阴影
- 分页: 白色按钮+边框, active蓝色填充

样式复刻标注:
- 注释 #①: "搜索框样式复刻自参考图（圆角6px，高度32px，focus蓝色阴影框）"
- 注释 #⑤: "表格样式复刻自参考图（表头灰底#fafafa，行悬浮变色，12px表头字号）"
```

这个摘要必须**在图片读取完成后立即输出**，供用户确认是否符合预期。用户确认后再进入 Step 1。如果用户说"不对"或"有些颜色不对"，按用户反馈修正。

#### 0.4 无参考图时的默认设计系统

当没有参考图时，使用以下 Ant Design 5.x 默认值（作为 `:root` CSS 变量注入）：
- 主色: #1677ff | 成功: #52c41a | 警告: #faad14 | 危险: #ff4d4f
- 背景: #f5f5f5 | 卡片背景: #ffffff
- 文字主色: #262626 | 次要: #595959 | 辅助: #8c8c8c
- 边框: #d9d9d9 / #f0f0f0
- 圆角: 6px (组件) / 8px (卡片)
- 字号: 12px(辅助) / 14px(正文) / 16px(副标题) / 18px(标题)
- 阴影: 0 1px 2px rgba(0,0,0,0.06) (默认) / 0 4px 12px rgba(0,0,0,0.08) (hover)

### 输出模式选择
| Input Type | Mode | Output |
|-----------|------|--------|
| **全新需求 (0→1)** | 完整模式 | HTML原型 + 完整注释 + 右侧注释面板 + 框选工具 |
| **小功能迭代** | 轻量模式 | HTML原型 + 精简注释（只标注变更点）+ 版本标注栏 |
| **参考图+复刻** | 复刻模式 | CSS变量注入 → 严格对齐样式 → HTML原型(已对齐参考图) + 复刻标注注释(type:note,标注样式来源) |
| **局部修改** | 修改模式 | 定位框选区域 → 更新对应组件 + 更新/新增注释 → 版本号升级 |
| **原型→输出PRD** | PRD输出模式 | 读取原型HTML → 提取注释数据 → 分类映射 → 输出完整需求规格说明书(.md) |
| **原型→输出精简PRD** | 精简PRD模式 | 读取原型HTML → 提取注释数据 → 输出变更需求说明(.md) |

#### 轻量模式规则 (小功能迭代)
1. 页面顶部显示"版本标注栏"：`[v1.1 - 2026-06-12] 新增/修改/删除`
2. 只用注释标注变更部分，未改区域不添加注释
3. 每个注释只写：**改了啥** + **为什么改**，3行以内
4. 不输出任何文档，不输出流程图
5. 版本号递增（V1.0 → V1.1 → V1.2...）

#### 完整模式规则 (0→1)
- 每个功能区域至少覆盖：交互说明 + 业务逻辑 + 边界异常
- 有权限拆解的，额外添加权限规则注释
- 复杂业务逻辑（≥3步流程）在页面底部生成 Mermaid 流程图

### Step 1: Requirement Analysis

Before building the prototype, analyze:

1. **用户角色 & 权限**：区分管理员/运营/用户/访客 → 后续转为权限注释
2. **使用场景**：用户在什么情况下访问此页面，要达到什么目的
3. **页面结构**：导航/侧边栏/内容区/弹窗/底部
4. **功能模块**：列表/筛选/表单/操作按钮/详情弹窗
5. **操作链路**：用户从进入到完成的核心路径
6. **边界场景**：空数据/加载态/错误态/权限不足 → 后续转为边界异常注释

### Step 2: 参考图样式已在前序提取

执行到这一步时，参考图提取已在 **Step 0** 完成。如果 Step 0 判定有参考图并完成了提取：
- 本步骤跳过（提取的 CSS 变量已在 Step 0 输出并确认）
- 转到 **Step 3** 直接用提取的样式构建原型

如果 Step 0 判定无参考图：
- 本步骤也跳过，使用 Step 0.4 中的默认 Ant Design 样式
- 转到 Step 3

### Step 3: Build the Interactive HTML Prototype

Follow the template pattern in `references/prototype-guide.md`. The output is a single self-contained HTML file.

#### Build Sequence

**Phase 0 — 框架嵌入**：
1. 读取 `assets/prototype-framework.js` 文件内容
2. 将内容直接内联到 HTML 的 `<script>` 标签中（不使用 data URI）
3. 框架脚本必须放在**所有其他脚本之前**，且在 `</body>` 之前

**Phase A — Layout & UI**:
1. **CSS 变量注入（关键）**：
   - 如果 Step 0 提取了参考图样式 → 在 HTML 的 `:root` 中注入 `--ref-*` CSS 变量，**所有组件样式使用这些变量值，而非 Ant Design 默认值**
   - 如果没有参考图 → 使用 Step 0.4 的 Ant Design 5.x 默认值注入 `:root`
   - **禁止做法**：有参考图但不使用提取的值，仍然用 Ant Design 默认样式
2. Build the visual layout (navigation, sidebar, content area, footer) using the injected CSS variables
3. Implement all UI components with proper CSS based on the design system (extracted reference styles OR Ant Design defaults)
4. Add interactivity: tab switching, modal open/close, pagination, form interactions
5. For PC prototypes, use fixed 1440px width container or full-width responsive

**Phase B — Annotations**:
1. Review every functional area on the page
2. For each area decide what types of annotations are needed (interaction/business/edgecase/permission)
3. Register annotations using **`window.__onAnnotationsReady`** 回调函数（**禁止使用 DOMContentLoaded**，因为框架初始化顺序存在竞争关系）：
   - **`__addAnnotation({ x, y, ... })`** — 手动指定视口坐标 (通用模式)
   - **`__addAnnotationOn(selector, position, opts)`** — 相对目标元素自动定位 (推荐模式)
4. 注释注册代码推荐使用**轮询等待模式**（替代原 `__onAnnotationsReady` 回调方式，避免 DOMContentLoaded 时序竞争）：
```js
(function() {
  function register() {
    if (typeof window.__addAnnotationOn !== 'function') {
      setTimeout(register, 50);  // 每50ms重试，直到框架就绪
      return;
    }
    // 框架就绪，开始注册注释
    window.__addAnnotationOn('#target-selector', 'right', {
      title: '注释标题',
      description: '注释内容',
      type: 'business'
    });
  }
  register();
})();
```
   - **拖拽标记**：按住注释标记（圆形徽章）拖拽即可重新定位
   - **删除注释**：在右侧注释面板中，每项注释末尾的✕按钮可删除注释（卡片上不提供删除按钮以避免事件冲突）
   - **展开卡片**：注释卡片标题栏⛶按钮可展开/缩小卡片（180px↔600px）
   - **双击编辑**：双击注释描述区域可编辑内容
   - **添加注释**：工具栏"➕添加注释"模式，点击页面任意位置创建新注释

**Phase C — Selection Tool**:
1. The framework automatically includes the marquee selection tool
2. It appears in the toolbar automatically — no extra code needed

#### Annotation Coverage Rules

| Component Type | Required Annotation Types | 补充要求 |
|---------------|--------------------------|---------|
| Search input | interaction, edgecase(empty result) | 说明搜索的数据范围和匹配规则 |
| Data table / List | interaction(pagination/sort), business(sorting logic), edgecase(empty/error) | 必须包含【数据来源】【排序规则】【字段字典】 |
| Form / Modal | interaction(fields/validation/submit), edgecase(error/duplicate/timeout) | 必须列出所有字段的名称、类型、格式、必填/选填 |
| Buttons (add/edit/delete) | interaction(click flow), business(data rules), permission(who can see/click) | 说明触发条件、后置影响、失败处理 |
| Navigation menu | interaction(route), permission(menu visibility per role) | — |
| Approval workflow / Timeline | business(flow), permission(approval role), edgecase(reject/recall) | 必须说明数据来源（完整预定义节点 vs 仅已流转）、排序规则（正序/倒序）、每个节点的字段组成 |
| Charts / Statistics | business(data source/calculation), edgecase(no data) | 说明数据计算逻辑和统计口径 |
| Upload component | interaction(drag/click), edgecase(file type/size/network) | — |
| Permission-restricted area | permission(role-based), edgecase(no access state) | — |
| Detail card / Form display | interaction, edgecase(empty/error) | 必须列出所有展示字段的字段清单 |

#### Annotation Quality Standards (注释质量标准)

每条注释必须遵循 **「三个问题」原则**：回答"数据从哪来"、"按什么排序"、"字段有哪些"。

**核心检查清单：**

1. **数据逻辑检查**（business/edgecase 类型）
   - [ ] 数据来源：静态预定义还是动态查询？是否支持分页？
   - [ ] 数据范围：展示全部数据还是按条件过滤？过滤条件是什么？
   - [ ] 排序规则：默认排序字段？升序还是降序？用户能否自定义？
   - [ ] 字段定义：每条数据包含哪些字段？各自的类型、格式、必填/选填？

2. **交互行为检查**（interaction 类型）
   - [ ] 触发条件：什么条件下可操作？是否需要权限？
   - [ ] 处理流程：点击后发生了什么？有无确认弹窗？
   - [ ] 后置影响：操作完成后数据/页面状态如何变化？
   - [ ] 失败处理：网络超时、权限不足、数据冲突时如何提示？

3. **边界情况检查**（edgecase 类型）
   - [ ] 空数据态：无数据时页面显示什么？
   - [ ] 加载态：数据加载中显示什么？
   - [ ] 错误态：接口报错时如何展示？
   - [ ] 异常流转：暂停、驳回、撤回等异常状态如何处理？

**注释内容格式规范：**

使用结构化段落，每条注释的 `description` 按以下模板组织：

```
【数据逻辑】数据来源 + 数据范围说明
【排序规则】排序依据 + 升序/降序
【字段组成】字段1 + 字段2 + ...（各字段的格式说明）
【业务规则】触发条件 → 处理流程 → 结果/输出
【边界异常】异常条件 → 系统行为 → 用户感知
```

**禁止行为：**
- ❌ 只写视觉表现不写逻辑（如"已完成绿色，当前蓝色"→ 缺少数据来源和排序规则）
- ❌ 字段说明模糊（如"展示审批记录" → 应明确列出所有字段）
- ❌ 遗漏 edgecase 注释（数据展示类组件必须有空数据/错误态注释）

#### Interaction Fidelity

| Interaction | Minimum Fidelity |
|-------------|-----------------|
| Tab switching | Content switches, active tab highlighted |
| Modal/Drawer | Opens/closes with animation, proper backdrop |
| Dropdown/Select | Options appear, clickable to select |
| Pagination | Page numbers clickable, "prev/next" works |
| Form validation | Required fields show red border + error on submit |
| Hover effects | Buttons, table rows, cards have hover states |
| Toast/notification | Appears briefly, dismissible |
| Expand/Collapse | Animates smoothly |

### Step 4: Handle Iteration / Selection-Based Modification

The selection tool captures user modifications and returns them via clipboard + visual panel. Here is the complete workflow:

1. **用户操作**：用户点击工具栏"✂️ 框选模式"，在页面上拖拽框选要修改的区域，填写修改描述，点击"确认修改"
2. **框架处理**：框架自动将框选区域坐标 + 修改描述 + 时间戳格式化为结构化文本，尝试复制到剪贴板，同时在页面中央弹出一个"框选修改请求已就绪"面板
3. **用户回传**：用户将修改请求文本粘贴到对话框发送给 WorkBuddy AI（面板上有"复制修改请求并发送给AI"按钮）
4. **AI 接收处理**：当收到用户粘贴的框选修改请求后：
   - 解析请求中的区域坐标和修改描述
   - 根据坐标判断该区域包含哪些组件（导航栏/表单/表格/弹窗等）
   - 根据修改描述理解具体的修改意图
5. **AI 执行修改**：
   - 定位到目标 HTML 组件
   - 更新目标组件的 HTML/CSS/JS 内容
   - 新增或更新该区域对应的注释（更新注释内容，或新增注释）
   - 更新顶部版本标注栏，增加一条变更记录（版本号升版，如 V1.0→V1.1）
   - 框选区域用高亮边框标记修改后的区域
6. **重新交付**：通过 `present_files` 工具呈现更新后的 HTML 页面

**重要**：框选工具的输出是**结构化文本消息**，必须由用户粘贴回对话框才能让 AI 执行修改。这是前端 → AI 之间的数据桥接机制。

### Step 5: Multi-Platform Adaptation

Auto-detect target platform from user input. If not specified, default to PC Web.

| Platform | Layout | Interactions | Notes |
|----------|--------|-------------|-------|
| PC Web | 1440px container, sidebar+content | hover, click, pagination | Default |
| APP | 375-414px width, single column | tap, swipe, bottom sheet | Touch targets ≥44px |
| Mini Program | 375-414px, native navbar | tap, no hover | WeChat design rules |
| H5 | Responsive, safe-area | tap, no hover | Performance priority |

### Step 6: PRD 输出（按需触发）

当用户要求输出需求文档/PRD/需求规格说明书时，执行以下流程。

#### 6.1 注释→PRD 映射规则

原型中的每条注释按 type 映射到 PRD 的不同章节：

| 注释类型 | 映射到 PRD 章节 | 映射产物 |
|---------|----------------|---------|
| `interaction` | 功能需求详述 + 页面交互说明 | 功能条目 + 操作流程 + 交互规格表 |
| `business` | 业务流程 + 功能需求详述 | 业务规则 + 状态流转 + 数据逻辑 |
| `edgecase` | 功能需求详述(边界与异常) + 边界与异常处理 | 异常列表 + 处理策略 |
| `permission` | 用户角色与权限 | 权限矩阵条目 + 角色定义 |
| `note` | 附录 / 数据字典 | 备注说明 / 待确认事项 |

#### 6.2 PRD 生成执行流程

1. **定位原型文件**：
   - 如果用户指定了文件名 → 直接读取
   - 如果用户未指定 → 用 Glob 搜索最近生成的 `.html` 原型文件（按修改时间排序取最新的）

2. **提取注释数据**：从 HTML 中扫描所有 `__addAnnotationOn(` 和 `__addAnnotation(` 调用，提取每条注释的：
   - id（编号）
   - title（标题）
   - description（描述）
   - type（类型）
   - targetSelector（关联的页面元素/组件）

3. **分类整理**：按 type 分组，判断每个功能所属的业务模块

4. **补充需求分析**：结合 Step 1 中的需求分析结果（用户角色、使用场景、页面结构、操作链路、边界场景）

5. **选择模板**：
   - 用户要求"完整/详细/全面"PRD → 使用完整 PRD 模板
   - 用户要求"精简/简要/快速"PRD → 使用精简 PRD 模板

6. **输出文档**：按 `references/prd-template.md` 中的模板填充，生成 `.md` 格式文件

7. **保存并交付**：保存到项目目录，通过 `deliver_attachments` 工具交付给用户

## Bundled Resources

- `assets/prototype-framework.js` — The annotation engine + selection tool + panel. **嵌入方式：在生成的 HTML 中将该文件内容直接内联到 `<script>` 标签中，不使用 data URI（避免部分浏览器对 data URI 脚本的限制）**
- `references/prototype-guide.md` — Complete guide for building prototypes: template structure, annotation API, design system specs, interaction fidelity rules, multi-platform adaptation, and reference extraction guide.
- `references/prd-template.md` — Requirements Specification Document (PRD) template referencing Tencent, Alibaba, JD.com formats. Includes full PRD and lightweight PRD templates, annotation-to-PRD mapping rules, and generation workflow.
