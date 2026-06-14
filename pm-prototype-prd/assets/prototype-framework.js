/**
 * 高保真原型注释引擎 (Annotated Prototype Engine)
 * 类似墨刀/Axure的页面标注系统 + 框选迭代工具
 * 
 * 用法: 在生成的 HTML 原型中引入本脚本，通过 window.__PrototypeAnnotations API 添加注释
 *
 * @version 1.0
 */

(function () {
  'use strict';

  // ============================================================
  // 核心数据结构
  // ============================================================
  const CONFIG = {
    annotationColor: {
      interaction: '#1677ff', // 交互说明
      business: '#fa8c16', // 业务逻辑
      edgecase: '#ff4d4f', // 边界条件/异常
      permission: '#52c41a', // 权限规则
      note: '#722ed1', // 通用备注
    },
    annotationLabel: {
      interaction: '交互说明',
      business: '业务逻辑',
      edgecase: '边界异常',
      permission: '权限规则',
      note: '备注',
    },
  };

  // 存储所有注释
  let _annotations = [];
  let _nextId = 1;
  let _selectionActive = false;
  let _addAnnotationActive = false;
  let _panelVisible = true;

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    injectStyles();
    createToolbar();
    createAnnotationPanel();

    // 允许外部通过 window 注册注释
    window.__addAnnotation = addAnnotation;
    window.__addAnnotationOn = addAnnotationOn;
    window.__deleteAnnotation = deleteAnnotation;
    window.__clearAnnotations = clearAnnotations;
    window.__toggleAnnotationPanel = togglePanel;
    window.__toggleSelectionTool = toggleSelectionTool;
    window.__setPanelVisible = function (v) { _panelVisible = v; };
    window.__showFloatingTip = showFloatingTip;

    // 触发就绪回调：确保注释注册在框架初始化完成后执行
    if (typeof window.__onAnnotationsReady === 'function') {
      try { window.__onAnnotationsReady(); } catch(e) { console.error('__onAnnotationsReady error:', e); }
      delete window.__onAnnotationsReady;
    }

    // 页面点击添加注释
    document.addEventListener('click', function(e) {
      if (!_addAnnotationActive) return;
      // 防止击中自身或弹窗
      if (e.target.closest('.apt-toolbar, .apt-card, .apt-panel, .apt-selector-overlay, .apt-selector-popup, #aptModifyPanel')) return;
      _addAnnotationActive = false;
      document.getElementById('aptAddAnnotation').classList.remove('active');
      document.body.style.cursor = '';
      showAnnotationEditor(e.clientX, e.clientY);
    });
  }

  // ============================================================
  // 注入样式 (全部内容不依赖外部CSS)
  // ============================================================
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* --- 原型工具按钮 --- */
      .apt-toolbar {
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 99999;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        user-select: none;
      }
      .apt-toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border: none;
        border-radius: 12px;
        background: transparent;
        color: #595959;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .apt-toolbar-btn:hover { background: #f0f0f0; color: #262626; }
      .apt-toolbar-btn.active { background: #e6f4ff; color: #1677ff; }
      .apt-toolbar-btn.danger.active { background: #fff1f0; color: #ff4d4f; }
      .apt-toolbar-divider {
        width: 1px;
        height: 20px;
        background: #e8e8e8;
        margin: 0 4px;
      }
      .apt-toolbar-label {
        color: #8c8c8c;
        font-size: 12px;
      }
      /* --- 工具栏折叠态 --- */
      .apt-toolbar .apt-tb-collapse-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; border: none; background: transparent;
        cursor: pointer; font-size: 14px; color: #8c8c8c; border-radius: 50%;
        transition: background .15s, transform .3s; flex-shrink: 0;
      }
      .apt-toolbar .apt-tb-collapse-btn:hover { background: #f0f0f0; color: #595959; }
      .apt-toolbar.collapsed .apt-tb-collapse-btn { transform: rotate(180deg); }
      .apt-toolbar.collapsed .apt-tb-hide { display: none !important; }
      /* --- 拖拽把手(三线点阵) --- */
      .apt-toolbar .apt-tb-drag {
        display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 2px; width: 16px; height: 24px; cursor: grab; flex-shrink: 0;
        opacity: 0.4; transition: opacity .15s;
      }
      .apt-toolbar .apt-tb-drag:hover { opacity: 0.8; }
      .apt-toolbar .apt-tb-drag span { display: block; width: 14px; height: 2px; background: #bfbfbf; border-radius: 1px; }

      /* --- 注释标记 (Badge) --- */
      .apt-marker {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
        user-select: none;
      }
      .apt-marker:hover {
        transform: scale(1.25);
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      }
      .apt-marker .apt-pulse {
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        animation: aptPulse 2s ease-in-out infinite;
        opacity: 0;
        pointer-events: none;
      }
      @keyframes aptPulse {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.8); opacity: 0; }
      }

      /* --- 注释连线 --- */
      .apt-connector {
        position: absolute;
        z-index: 9998;
        pointer-events: none;
      }

      /* --- 注释卡片 (Tooltip) --- */
      .apt-card {
        position: absolute;
        z-index: 10000;
        width: 320px;
        max-height: 280px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        border: 1px solid #e8e8e8;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s, visibility 0.25s, transform 0.25s;
        transform: translateY(8px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        overflow: hidden;
        pointer-events: auto;
      }
      .apt-card.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .apt-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-bottom: 1px solid #f0f0f0;
      }
      .apt-card-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .apt-card-title {
        font-size: 14px;
        font-weight: 600;
        color: #262626;
        flex: 1;
        line-height: 1.4;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .apt-card-header-btn {
        width: 24px; height: 24px; border: none; background: transparent;
        cursor: pointer; font-size: 13px; color: #8c8c8c; border-radius: 4px;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        transition: background .15s, color .15s;
      }
      .apt-card-header-btn:hover { background: #f5f5f5; color: #595959; }
      .apt-card-body {
        padding: 12px 14px;
        font-size: 13px;
        color: #595959;
        line-height: 1.6;
        max-height: 180px;
        overflow-y: auto;
      }
      /* --- 卡片展开态 --- */
      .apt-card.expanded .apt-card-body {
        max-height: 600px;
      }
      .apt-card.expanded {
        width: 480px;
        max-height: 700px;
      }
      .apt-card-tag {
        display: inline-block;
        padding: 1px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 6px;
      }

      /* --- 右侧注释面板 --- */
      .apt-panel {
        position: fixed;
        top: 64px;
        right: 0;
        width: 340px;
        height: calc(100vh - 64px);
        background: #fff;
        border-left: 1px solid #e8e8e8;
        box-shadow: -4px 0 16px rgba(0,0,0,0.06);
        z-index: 99990;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      }
      .apt-panel.hidden {
        transform: translateX(100%);
      }
      .apt-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }
      .apt-panel-title {
        font-size: 15px;
        font-weight: 600;
        color: #262626;
      }
      .apt-panel-count {
        font-size: 12px;
        color: #8c8c8c;
        margin-left: 8px;
      }
      .apt-panel-close {
        border: none;
        background: transparent;
        cursor: pointer;
        color: #8c8c8c;
        font-size: 18px;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .apt-panel-close:hover { background: #f5f5f5; }
      .apt-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }
      .apt-panel-group {
        margin-bottom: 4px;
      }
      .apt-panel-group-title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        color: #8c8c8c;
        cursor: pointer;
        user-select: none;
      }
      .apt-panel-group-title:hover { color: #595959; }
      .apt-panel-group-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .apt-panel-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 16px;
        cursor: pointer;
        transition: background 0.15s;
        border-left: 3px solid transparent;
      }
      .apt-panel-item:hover { background: #fafafa; }
      .apt-panel-item.active {
        background: #e6f4ff;
        border-left-color: #1677ff;
      }
      .apt-panel-item-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .apt-panel-item-content {
        flex: 1;
        min-width: 0;
      }
      .apt-panel-item-title {
        font-size: 13px;
        font-weight: 500;
        color: #262626;
        line-height: 1.4;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .apt-panel-item-desc {
        font-size: 12px;
        color: #8c8c8c;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .apt-panel-empty {
        padding: 40px 16px;
        text-align: center;
        color: #bfbfbf;
        font-size: 14px;
      }

      /* --- 框选工具 --- */
      .apt-selector {
        position: fixed;
        z-index: 99995;
        pointer-events: none;
        background: rgba(22, 119, 255, 0.08);
        border: 2px dashed #1677ff;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.1s;
      }
      .apt-selector.visible { opacity: 1; }
      .apt-selector-overlay {
        position: fixed;
        inset: 0;
        z-index: 99990;
        cursor: crosshair;
        display: none;
      }
      .apt-selector-overlay.active { display: block; }
      .apt-selector-popup {
        position: fixed;
        z-index: 99998;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.18);
        border: 1px solid #e8e8e8;
        padding: 16px 20px;
        min-width: 240px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
        display: none;
      }
      .apt-selector-popup.visible { display: block; }
      .apt-selector-popup h4 {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }
      .apt-selector-popup p {
        margin: 0 0 12px;
        font-size: 12px;
        color: #8c8c8c;
      }
      .apt-selector-popup textarea {
        width: 100%;
        height: 60px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        padding: 8px;
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
        margin-bottom: 10px;
      }
      .apt-selector-popup textarea:focus {
        border-color: #1677ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(22,119,255,0.1);
      }
      .apt-selector-popup-btns {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .apt-selector-popup-btns button {
        padding: 5px 16px;
        border-radius: 6px;
        border: 1px solid #d9d9d9;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        transition: all 0.2s;
      }
      .apt-selector-popup-btns .primary {
        background: #1677ff;
        color: #fff;
        border-color: #1677ff;
      }
      .apt-selector-popup-btns .primary:hover { background: #4096ff; }

      /* --- 辅助: 高亮目标元素 --- */
      .apt-highlight {
        outline: 2px solid #1677ff !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // 工具栏
  // ============================================================
  function createToolbar() {
    const bar = document.createElement('div');
    bar.className = 'apt-toolbar';
    bar.innerHTML = `
      <span class="apt-tb-drag" title="拖拽移动工具栏"><span></span><span></span><span></span></span>
      <button class="apt-tb-collapse-btn" id="aptToggleCollapse" title="收起/展开工具栏">◀</button>
      <span class="apt-toolbar-label apt-tb-hide">🛠 原型工具</span>
      <span class="apt-toolbar-divider apt-tb-hide"></span>
      <button class="apt-toolbar-btn active apt-tb-hide" id="aptTogglePanel" title="切换注释面板">
        📋 注释面板
      </button>
      <button class="apt-toolbar-btn apt-tb-hide" id="aptToggleMarkers" title="显示/隐藏全部注释标记">
        🔵 注释标记
      </button>
      <span class="apt-toolbar-divider apt-tb-hide"></span>
      <button class="apt-toolbar-btn danger apt-tb-hide" id="aptToggleSelector" title="框选模式 - 拖拽框选区域用于修改">
        ✂️ 框选模式
      </button>
      <span class="apt-toolbar-divider apt-tb-hide"></span>
      <button class="apt-toolbar-btn apt-tb-hide" id="aptAddAnnotation" title="添加注释 - 点击页面任意位置添加新注释">
        ➕ 添加注释
      </button>
      <span class="apt-toolbar-divider apt-tb-hide"></span>
      <span class="apt-toolbar-btn apt-tb-hide" id="aptVersion" style="cursor:default;color:#bfbfbf;font-size:12px;">
        原型 V1.0
      </span>
    `;
    document.body.appendChild(bar);

    let collapsed = false;
    document.getElementById('aptToggleCollapse').onclick = function () {
      collapsed = !collapsed;
      bar.classList.toggle('collapsed', collapsed);
      this.title = collapsed ? '展开工具栏' : '收起工具栏';
    };

    // 切换注释面板
    document.getElementById('aptTogglePanel').onclick = function () {
      togglePanel();
      this.classList.toggle('active');
    };
    // 切换注释标记可见性
    document.getElementById('aptToggleMarkers').onclick = function () {
      const markers = document.querySelectorAll('.apt-marker');
      const cards = document.querySelectorAll('.apt-card');
      const hidden = markers[0] && markers[0].style.display === 'none';
      markers.forEach(m => m.style.display = hidden ? '' : 'none');
      cards.forEach(c => c.classList.remove('visible'));
      this.classList.toggle('active');
    };
    document.getElementById('aptToggleMarkers').classList.add('active');
    // 框选工具
    document.getElementById('aptToggleSelector').onclick = function () {
      toggleSelectionTool();
      this.classList.toggle('active');
    };
    // 添加注释工具
    document.getElementById('aptAddAnnotation').onclick = function () {
      _addAnnotationActive = !_addAnnotationActive;
      this.classList.toggle('active');
      document.body.style.cursor = _addAnnotationActive ? 'cell' : '';
      // 添加提示
      if (_addAnnotationActive) {
        showFloatingTip('点击页面上任意位置添加新注释');
      }
    };

    // 工具栏拖拽 - 拖拽把手(三线区域)或工具栏边缘
    let dragStartX = 0, dragStartY = 0, dragOrigL = 0, dragOrigT = 0, dragging = false;
    bar.addEventListener('mousedown', function(e) {
      // 按钮/分隔线不触发拖动 (但允许从拖拽把手或空白区拖动)
      if (e.target.closest('.apt-toolbar-btn, .apt-toolbar-divider, .apt-toolbar-label')) return;
      // 从collapse按钮以外的任何空白/拖拽把手区域都可拖动
      // 初始化inline样式(首次拖拽时从CSS位置转为inline)
      if (!bar.style.left || bar.style.left === '' || bar.style.left === 'auto') {
        var r = bar.getBoundingClientRect();
        bar.style.left = r.left + 'px';
        bar.style.top = r.top + 'px';
        bar.style.transform = 'none';
      }
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOrigL = parseFloat(bar.style.left) || 0;
      dragOrigT = parseFloat(bar.style.top) || 0;
      dragging = true;
      bar.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      bar.style.left = (dragOrigL + e.clientX - dragStartX) + 'px';
      bar.style.top = (dragOrigT + e.clientY - dragStartY) + 'px';
    });
    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      dragging = false;
      bar.style.cursor = '';
    });
  }

  // ============================================================
  // 浮动提示
  // ============================================================
  let _tipTimer = null;
  function showFloatingTip(msg) {
    const existing = document.getElementById('aptFloatTip');
    if (existing) existing.remove();
    const tip = document.createElement('div');
    tip.id = 'aptFloatTip';
    tip.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#1677ff;color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;font-family:-apple-system,sans-serif;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s;pointer-events:none;white-space:nowrap;';
    tip.textContent = msg;
    document.body.appendChild(tip);
    clearTimeout(_tipTimer);
    _tipTimer = setTimeout(function() {
      tip.style.opacity = '0';
      setTimeout(function() { tip.remove(); }, 300);
    }, 3000);
  }

  // ============================================================
  // 注释面板 (右侧)
  // ============================================================
  function createAnnotationPanel() {
    const panel = document.createElement('div');
    panel.className = 'apt-panel';
    panel.id = 'aptPanel';
    panel.innerHTML = `
      <div class="apt-panel-header">
        <div>
          <span class="apt-panel-title">功能注释</span>
          <span class="apt-panel-count" id="aptCount">0 条</span>
        </div>
        <button class="apt-panel-close" id="aptPanelClose">✕</button>
      </div>
      <div class="apt-panel-body" id="aptPanelBody">
        <div class="apt-panel-empty">暂无注释</div>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('aptPanelClose').onclick = function () {
      togglePanel();
      const btn = document.getElementById('aptTogglePanel');
      if (btn) btn.classList.remove('active');
    };
  }

  function renderPanel() {
    const body = document.getElementById('aptPanelBody');
    if (!body) return;
    const count = document.getElementById('aptCount');
    if (count) count.textContent = _annotations.length + ' 条';

    if (_annotations.length === 0) {
      body.innerHTML = '<div class="apt-panel-empty">暂无注释</div>';
      return;
    }

    // 按类型分组
    const groups = {};
    _annotations.forEach(a => {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    });

    let html = '';
    const typeOrder = ['interaction', 'business', 'edgecase', 'permission', 'note'];
    typeOrder.forEach(type => {
      const items = groups[type];
      if (!items || items.length === 0) return;
      const color = CONFIG.annotationColor[type] || '#1677ff';
      html += `<div class="apt-panel-group">
        <div class="apt-panel-group-title">
          <span class="apt-panel-group-dot" style="background:${color}"></span>
          ${CONFIG.annotationLabel[type] || type} (${items.length})
        </div>`;
      items.forEach(a => {
        html += `<div class="apt-panel-item" data-aid="${a.id}" onclick="window.__focusAnnotation(${a.id})">
          <span class="apt-panel-item-badge" style="background:${color}">${a.id}</span>
          <div class="apt-panel-item-content">
            <div class="apt-panel-item-title">${escapeHtml(a.title)}</div>
            <div class="apt-panel-item-desc">${escapeHtml(a.description)}</div>
          </div>
          <span class="apt-panel-item-del" onclick="event.stopPropagation();window.__deleteAnnotation(${a.id})" title="删除注释" style="flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#bfbfbf;border-radius:4px;font-size:12px;transition:color .15s,background .15s;margin-left:4px;" onmouseover="this.style.color='#ff4d4f';this.style.background='#fff1f0'" onmouseout="this.style.color='#bfbfbf';this.style.background='transparent'">✕</span>
        </div>`;
      });
      html += '</div>';
    });
    body.innerHTML = html;
  }

  // ============================================================
  // 添加注释
  // ============================================================
  function addAnnotation(opts) {
    const id = _nextId++;
    const defaultOpts = {
      id: id,
      title: '未命名注释',
      description: '请补充说明',
      type: 'interaction', // interaction | business | edgecase | permission | note
      x: 100,
      y: 100,
      targetSelector: null,
    };
    const annotation = Object.assign({}, defaultOpts, opts);
    annotation.id = id;
    _annotations.push(annotation);
    renderMarker(annotation);
    renderPanel();
    return id;
  }

  /**
   * 在指定目标元素附近添加注释(自动计算位置)
   * @param {string|Element} target CSS选择器或DOM元素 — 注释标记将附着在此目标旁边
   * @param {string} position 位置: 'right'(默认)/'left'/'top'/'bottom'
   * @param {object} opts 注释配置: { title, description, type }
   * @returns {number} 注释ID
   */
  function addAnnotationOn(target, position, opts) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      console.warn('addAnnotationOn: target not found', target);
      return -1;
    }
    var rect = el.getBoundingClientRect();
    var padding = 10; // 标记与目标之间的间距
    var x, y;
    switch ((position || 'right')) {
      case 'right':  x = rect.right + padding; y = rect.top + (rect.height / 2) - 12; break;
      case 'left':   x = rect.left - padding - 24; y = rect.top + (rect.height / 2) - 12; break;
      case 'top':    x = rect.left + (rect.width / 2) - 12; y = rect.top - padding - 24; break;
      case 'bottom': x = rect.left + (rect.width / 2) - 12; y = rect.bottom + padding; break;
      default:       x = rect.right + padding; y = rect.top + (rect.height / 2) - 12;
    }
    // 边界约束
    x = Math.max(5, Math.min(x, window.innerWidth - 30));
    y = Math.max(5, Math.min(y, window.innerHeight - 30));
    return addAnnotation(Object.assign({}, opts, { x: x, y: y, targetSelector: typeof target === 'string' ? target : null }));
  }

  function renderMarker(a) {
    const color = CONFIG.annotationColor[a.type] || '#1677ff';
    const container = document.getElementById('aptMarkerContainer') || (function () {
      const c = document.createElement('div');
      c.id = 'aptMarkerContainer';
      c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
      document.body.appendChild(c);
      return c;
    })();

    // 标记
    const marker = document.createElement('div');
    marker.className = 'apt-marker';
    marker.style.cssText = `left:${a.x}px;top:${a.y}px;background:${color};pointer-events:auto;cursor:grab;`;
    marker.dataset.aid = a.id;
    marker.innerHTML = `<span>${a.id}</span><span class="apt-pulse" style="border:2px solid ${color}"></span>`;
    marker.onclick = function (e) {
      e.stopPropagation();
      toggleCard(a.id);
    };
    // 标记拖拽
    marker.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.stopPropagation();
      const startX = e.clientX, startY = e.clientY;
      const origX = a.x, origY = a.y;
      marker.style.cursor = 'grabbing';
      marker.style.transition = 'none';
      function onMove(ev) {
        a.x = origX + ev.clientX - startX;
        a.y = origY + ev.clientY - startY;
        marker.style.left = a.x + 'px';
        marker.style.top = a.y + 'px';
        const card = document.getElementById('aptCard_' + a.id);
        if (card) {
          card.style.left = (a.x + 30) + 'px';
          card.style.top = Math.max(10, a.y - 50) + 'px';
        }
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        marker.style.cursor = 'grab';
        renderPanel();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    container.appendChild(marker);

    // 卡片
    const card = document.createElement('div');
    card.className = 'apt-card';
    card.id = 'aptCard_' + a.id;
    card.style.cssText = 'position:absolute;z-index:10000;';
    // 构建header
    var header = document.createElement('div');
    header.className = 'apt-card-header';
    var badge = document.createElement('span');
    badge.className = 'apt-card-badge';
    badge.style.background = color;
    badge.textContent = a.id;
    header.appendChild(badge);
    var titleSpan = document.createElement('span');
    titleSpan.className = 'apt-card-title';
    titleSpan.textContent = a.title;
    header.appendChild(titleSpan);
    // 展开按钮
    var expandBtn = document.createElement('button');
    expandBtn.className = 'apt-card-header-btn';
    expandBtn.title = '展开/缩小';
    expandBtn.textContent = '⛶';
    expandBtn.onclick = function(e) { e.stopPropagation(); card.classList.toggle('expanded'); };
    header.appendChild(expandBtn);
    card.appendChild(header);
    // body
    var body = document.createElement('div');
    body.className = 'apt-card-body';
    body.id = 'aptCardBody_' + a.id;
    body.dataset.aid = a.id;
    var tag = document.createElement('span');
    tag.className = 'apt-card-tag';
    tag.style.cssText = 'background:' + color + '22;color:' + color + ';display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:500;margin-bottom:6px;';
    tag.textContent = CONFIG.annotationLabel[a.type];
    body.appendChild(tag);
    var descDiv = document.createElement('div');
    descDiv.className = 'apt-card-desc-text';
    descDiv.innerHTML = escapeHtml(a.description).replace(/\n/g, '<br>');
    body.appendChild(descDiv);
    card.appendChild(body);
    // 双击编辑注释内容
    body.addEventListener('dblclick', function (e) {
      e.stopPropagation();
      e.preventDefault();
      window.getSelection().removeAllRanges();
      enableEdit(a.id, this);
    });
    // 定位卡片
    card.style.left = (a.x + 30) + 'px';
    card.style.top = Math.max(10, a.y - 50) + 'px';
    // 如果超出右侧边界，放在左侧
    setTimeout(() => {
      const rect = card.getBoundingClientRect();
      if (rect.right > window.innerWidth - 20) {
        card.style.left = Math.max(10, a.x - 330) + 'px';
      }
    }, 0);
    container.appendChild(card);
  }

  // ============================================================
  // 注释卡片双击编辑
  // ============================================================
  function enableEdit(id, bodyEl) {
    const a = _annotations.find(x => x.id === id);
    if (!a) return;

    // 检出是否已在编辑中
    if (bodyEl.querySelector('.apt-card-edit-area')) return;

    const textDiv = bodyEl.querySelector('.apt-card-desc-text');
    const currentText = a.description;

    // 创建编辑区
    const editArea = document.createElement('div');
    editArea.className = 'apt-card-edit-area';
    editArea.style.cssText = 'margin-top:6px;';
    editArea.innerHTML = '<textarea style="width:100%;min-height:60px;border:1px solid #1677ff;border-radius:4px;padding:6px 8px;font-size:13px;font-family:inherit;color:#262626;resize:vertical;box-sizing:border-box;outline:none;line-height:1.5;">' + escapeHtml(currentText) + '</textarea>'
      + '<div style="display:flex;gap:6px;margin-top:6px;justify-content:flex-end;">'
      + '<button class="apt-card-edit-save" style="padding:3px 12px;background:#1677ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">保存</button>'
      + '<button class="apt-card-edit-cancel" style="padding:3px 12px;background:#fff;color:#595959;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">取消</button>'
      + '</div>';

    // 隐藏文字预览，插入编辑区
    textDiv.style.display = 'none';
    bodyEl.appendChild(editArea);

    const textarea = editArea.querySelector('textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    // 保存
    editArea.querySelector('.apt-card-edit-save').onclick = function () {
      saveEdit(id, textarea.value, bodyEl, textDiv);
    };
    // 取消
    editArea.querySelector('.apt-card-edit-cancel').onclick = function () {
      cancelEdit(bodyEl, textDiv, editArea);
    };
    // Ctrl+Enter 快捷保存
    textarea.onkeydown = function (e) {
      if (e.ctrlKey && e.key === 'Enter') {
        saveEdit(id, textarea.value, bodyEl, textDiv);
      }
      if (e.key === 'Escape') {
        cancelEdit(bodyEl, textDiv, editArea);
      }
    };
    // 点击外部取消编辑
    function outsideClick(e) {
      if (!bodyEl.contains(e.target)) {
        cancelEdit(bodyEl, textDiv, editArea);
        document.removeEventListener('mousedown', outsideClick);
      }
    }
    setTimeout(function () {
      document.addEventListener('mousedown', outsideClick);
    }, 100);
  }

  function saveEdit(id, newText, bodyEl, textDiv) {
    const a = _annotations.find(x => x.id === id);
    if (!a) return;
    const trimmed = newText.trim();
    a.description = trimmed || '(空)';
    textDiv.innerHTML = escapeHtml(a.description).replace(/\n/g, '<br>');
    textDiv.style.display = '';
    const editArea = bodyEl.querySelector('.apt-card-edit-area');
    if (editArea) editArea.remove();
    // 同步更新面板
    renderPanel();
    // 通知用户
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;padding:8px 16px;font-size:13px;color:#52c41a;z-index:99999;font-family:-apple-system,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.1);transition:opacity .3s;';
    toast.textContent = '✅ 注释 #' + id + ' 已更新';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  function cancelEdit(bodyEl, textDiv, editArea) {
    textDiv.style.display = '';
    if (editArea) editArea.remove();
  }

  // ============================================================
  // 注释卡片切换
  // ============================================================
  window.__focusAnnotation = function (id) {
    // 关闭其他卡片
    document.querySelectorAll('.apt-card.visible').forEach(c => c.classList.remove('visible'));
    document.querySelectorAll('.apt-panel-item.active').forEach(c => c.classList.remove('active'));
    // 打开目标卡片
    const card = document.getElementById('aptCard_' + id);
    if (card) card.classList.add('visible');
    // 高亮面板项
    const item = document.querySelector(`.apt-panel-item[data-aid="${id}"]`);
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // 高亮目标元素
    const a = _annotations.find(x => x.id === id);
    if (a && a.targetSelector) {
      const el = document.querySelector(a.targetSelector);
      if (el) {
        el.classList.add('apt-highlight');
        setTimeout(() => el.classList.remove('apt-highlight'), 3000);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  function toggleCard(id) {
    const card = document.getElementById('aptCard_' + id);
    if (!card) return;
    const visible = card.classList.contains('visible');
    // 关闭其他
    document.querySelectorAll('.apt-card.visible').forEach(c => c.classList.remove('visible'));
    if (!visible) {
      card.classList.add('visible');
      // 同步高亮面板项
      const item = document.querySelector(`.apt-panel-item[data-aid="${id}"]`);
      if (item) {
        document.querySelectorAll('.apt-panel-item.active').forEach(c => c.classList.remove('active'));
        item.classList.add('active');
      }
    }
  }

  window.hideCard = function (id) {
    const card = document.getElementById('aptCard_' + id);
    if (card) card.classList.remove('visible');
    const item = document.querySelector(`.apt-panel-item[data-aid="${id}"]`);
    if (item) item.classList.remove('active');
  };

  // ============================================================
  // 面板切换
  // ============================================================
  function togglePanel() {
    _panelVisible = !_panelVisible;
    const panel = document.getElementById('aptPanel');
    if (panel) panel.classList.toggle('hidden', !_panelVisible);
    // 调整页面内容
    document.body.style.marginRight = _panelVisible ? '340px' : '0';
  }

  // ============================================================
  // 框选工具
  // ============================================================
  let _selStartX = 0, _selStartY = 0;
  let _selEl = null, _selOverlay = null, _selPopup = null;

  function toggleSelectionTool() {
    _selectionActive = !_selectionActive;
    if (_selectionActive) {
      createSelectionElements();
      _selOverlay.classList.add('active');
      document.body.style.cursor = 'crosshair';
    } else {
      if (_selOverlay) _selOverlay.classList.remove('active');
      if (_selEl) _selEl.classList.remove('visible');
      if (_selPopup) _selPopup.classList.remove('visible');
      document.body.style.cursor = '';
    }
  }

  function createSelectionElements() {
    if (document.getElementById('aptSelectorOverlay')) return;

    _selOverlay = document.createElement('div');
    _selOverlay.className = 'apt-selector-overlay';
    _selOverlay.id = 'aptSelectorOverlay';

    _selEl = document.createElement('div');
    _selEl.className = 'apt-selector';
    _selEl.id = 'aptSelectorRect';
    _selOverlay.appendChild(_selEl);

    _selPopup = document.createElement('div');
    _selPopup.className = 'apt-selector-popup';
    _selPopup.id = 'aptSelectorPopup';
    _selPopup.innerHTML = `
      <h4>✂️ 框选区域</h4>
      <p>描述你要对此区域进行的修改：</p>
      <textarea id="aptModifyDesc" placeholder="例如：将此区域改为表格视图、调整按钮布局、添加筛选条件..."></textarea>
      <div class="apt-selector-popup-btns">
        <button id="aptSelCancel">取消</button>
        <button class="primary" id="aptSelConfirm">确认修改</button>
      </div>
    `;
    document.body.appendChild(_selOverlay);
    document.body.appendChild(_selPopup);

    // 鼠标事件
    _selOverlay.onmousedown = function (e) {
      _selStartX = e.clientX;
      _selStartY = e.clientY;
      _selEl.style.left = _selStartX + 'px';
      _selEl.style.top = _selStartY + 'px';
      _selEl.style.width = '0px';
      _selEl.style.height = '0px';
      _selEl.classList.add('visible');
      _selPopup.classList.remove('visible');
    };
    _selOverlay.onmousemove = function (e) {
      if (!_selEl.classList.contains('visible')) return;
      const x = Math.min(_selStartX, e.clientX);
      const y = Math.min(_selStartY, e.clientY);
      const w = Math.abs(e.clientX - _selStartX);
      const h = Math.abs(e.clientY - _selStartY);
      _selEl.style.left = x + 'px';
      _selEl.style.top = y + 'px';
      _selEl.style.width = w + 'px';
      _selEl.style.height = h + 'px';
    };
    _selOverlay.onmouseup = function (e) {
      if (!_selEl.classList.contains('visible')) return;
      const w = parseInt(_selEl.style.width);
      const h = parseInt(_selEl.style.height);
      if (w < 20 && h < 20) {
        _selEl.classList.remove('visible');
        return;
      }
      // 显示弹窗
      const left = Math.min(_selStartX, e.clientX) + 20;
      const top = Math.min(_selStartY, e.clientY) + 20;
      _selPopup.style.left = Math.min(left, window.innerWidth - 260) + 'px';
      _selPopup.style.top = Math.min(top, window.innerHeight - 200) + 'px';
      _selPopup.classList.add('visible');
      document.getElementById('aptModifyDesc').focus();
    };
    document.getElementById('aptSelCancel').onclick = function () {
      _selPopup.classList.remove('visible');
      _selEl.classList.remove('visible');
    };
    document.getElementById('aptSelConfirm').onclick = function () {
      const desc = document.getElementById('aptModifyDesc').value.trim();
      if (!desc) { alert('请描述修改内容'); return; }
      const rect = _selEl.getBoundingClientRect();
      const result = {
        version: '1.0',
        action: '框选修改请求',
        region: {
          left: Math.round(rect.left), top: Math.round(rect.top),
          width: Math.round(rect.width), height: Math.round(rect.height),
          xpath_center: Math.round(rect.left + rect.width / 2) + ',' + Math.round(rect.top + rect.height / 2)
        },
        description: desc,
        timestamp: new Date().toISOString(),
      };
      // 生成结构化修改请求文本
      const requestText = '【框选修改请求】\n'
        + '区域坐标: (' + result.region.left + ', ' + result.region.top + ') '
        + '尺寸: ' + result.region.width + 'x' + result.region.height + '\n'
        + '修改描述: ' + result.description + '\n'
        + '时间戳: ' + result.timestamp + '\n'
        + '---\n'
        + '请将此内容粘贴到对话框，AI 将根据框选区域和描述执行对应修改。';

      // 尝试自动复制到剪贴板
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(requestText).then(function() {
            showModifyPanel(result, requestText, true);
          }).catch(function() {
            showModifyPanel(result, requestText, false);
          });
        } else {
          showModifyPanel(result, requestText, false);
        }
      } catch(e) {
        showModifyPanel(result, requestText, false);
      }

      _selPopup.classList.remove('visible');
      _selEl.classList.remove('visible');
    };

    function showModifyPanel(result, text, copied) {
      var panel = document.getElementById('aptModifyPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'aptModifyPanel';
        panel.style.cssText = 'position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:99999;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid #e8e8e8;padding:16px 20px;width:520px;max-width:90vw;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;';
        document.body.appendChild(panel);
      }
      panel.innerHTML = ''
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">'
        + '<span style="font-size:18px;">✂️</span>'
        + '<span style="font-size:15px;font-weight:600;color:#262626;flex:1;">框选修改请求已就绪</span>'
        + '<button id="aptModifyClose" style="width:24px;height:24px;border:none;background:transparent;cursor:pointer;font-size:16px;color:#8c8c8c;display:flex;align-items:center;justify-content:center;">✕</button>'
        + '</div>'
        + '<div style="margin-bottom:10px;font-size:13px;color:#595959;line-height:1.6;">'
        + '<div style="margin-bottom:6px;"><strong>框选区域</strong>：(' + result.region.left + ', ' + result.region.top + ') ' + result.region.width + '×' + result.region.height + 'px</div>'
        + '<div style="margin-bottom:6px;"><strong>修改描述</strong>：' + escapeHtml(result.description) + '</div>'
        + '</div>'
        + '<div style="background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:10px 12px;margin-bottom:10px;font-size:12px;line-height:1.6;color:#595959;max-height:120px;overflow-y:auto;word-break:break-all;font-family:monospace;">'
        + escapeHtml(text)
        + '</div>'
        + (copied
          ? '<div style="margin-bottom:10px;font-size:12px;color:#52c41a;display:flex;align-items:center;gap:4px;">✅ 已自动复制到剪贴板 — 直接粘贴到对话框发送给AI即可</div>'
          : '<div style="margin-bottom:10px;font-size:12px;color:#fa8c16;display:flex;align-items:center;gap:4px;">📋 请手动复制上方内容，粘贴到对话框发送给AI</div>')
        + '<button id="aptModifyCopyBtn" style="width:100%;padding:8px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;font-family:inherit;color:#595959;transition:background .15s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'#fff\'">📋 复制修改请求并发送给AI</button>';

      // 关闭按钮
      document.getElementById('aptModifyClose').onclick = function() {
        panel.style.display = 'none';
      };
      // 复制按钮
      document.getElementById('aptModifyCopyBtn').onclick = function() {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
              document.getElementById('aptModifyCopyBtn').textContent = '✅ 已复制，请粘贴到对话框';
              document.getElementById('aptModifyCopyBtn').style.background = '#f6ffed';
              document.getElementById('aptModifyCopyBtn').style.borderColor = '#b7eb8f';
            });
          } else {
            // fallback: select the text area
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            document.getElementById('aptModifyCopyBtn').textContent = '✅ 已复制，请粘贴到对话框';
          }
        } catch(e) {
          alert('复制失败，请手动选择上方文本复制。');
        }
      };
    }

    function escapeHtml(t) {
      if (!t) return '';
      var d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }

    // 点击空白处取消
    _selOverlay.onclick = function (e) {
      if (e.target === _selOverlay && !_selPopup.classList.contains('visible')) {
        _selEl.classList.remove('visible');
      }
    };
  }

  // ============================================================
  // 清理注释
  // ============================================================
  function clearAnnotations() {
    _annotations = [];
    _nextId = 1;
    const container = document.getElementById('aptMarkerContainer');
    if (container) container.innerHTML = '';
    renderPanel();
  }

  // 删除单条注释
  function deleteAnnotation(id) {
    try {
      var idx = -1;
      for (var i = 0; i < _annotations.length; i++) {
        if (_annotations[i].id === id) { idx = i; break; }
      }
      if (idx === -1) return;
      _annotations.splice(idx, 1);
      // 移除DOM元素 - 使用 remove() API (比 removeChild 更安全)
      var marker = document.querySelector('.apt-marker[data-aid="' + id + '"]');
      if (marker) marker.remove();
      var card = document.getElementById('aptCard_' + id);
      if (card) card.remove();
      renderPanel();
    } catch(ex) { console.error('deleteAnnotation error:', ex); }
  }

  // ============================================================
  // 辅助
  // ============================================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // 添加注释编辑器弹窗
  // ============================================================
  function showAnnotationEditor(x, y) {
    var existing = document.getElementById('aptAnnotatePopup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.id = 'aptAnnotatePopup';
    popup.style.cssText = 'position:fixed;z-index:99999;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid #e8e8e8;padding:16px 20px;width:360px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;';

    var types = [
      { v: 'interaction', l: '交互说明', c: '#1677ff' },
      { v: 'business', l: '业务逻辑', c: '#fa8c16' },
      { v: 'edgecase', l: '边界异常', c: '#ff4d4f' },
      { v: 'permission', l: '权限规则', c: '#52c41a' },
      { v: 'note', l: '备注', c: '#722ed1' },
    ];
    var typeRadios = types.map(function(t) {
      return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;font-size:12px;cursor:pointer;"><input type="radio" name="aptNewType" value="' + t.v + '" style="accent-color:' + t.c + '"><span style="color:' + t.c + '">' + t.l + '</span></label>';
    }).join('');

    popup.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">'
      + '<span style="font-size:16px;">➕</span>'
      + '<span style="font-size:15px;font-weight:600;color:#262626;flex:1;">添加新注释</span>'
      + '<button id="aptAnnotateClose" style="width:24px;height:24px;border:none;background:transparent;cursor:pointer;font-size:16px;color:#8c8c8c;display:flex;align-items:center;justify-content:center;">✕</button>'
      + '</div>'
      + '<div style="margin-bottom:8px;font-size:12px;color:#8c8c8c;">点击位置：(' + x + ', ' + y + ')</div>'
      + '<div style="margin-bottom:10px;"><input id="aptAnnotateTitle" style="width:100%;height:32px;border:1px solid #d9d9d9;border-radius:6px;padding:0 10px;font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;" placeholder="注释标题（必填）"></div>'
      + '<div style="margin-bottom:10px;"><textarea id="aptAnnotateDesc" style="width:100%;height:60px;border:1px solid #d9d9d9;border-radius:6px;padding:6px 10px;font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none;" placeholder="注释说明"></textarea></div>'
      + '<div style="margin-bottom:12px;font-size:12px;color:#595959;">类型：<br>' + typeRadios + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid #f0f0f0;">'
      + '<button id="aptAnnotateCancel" style="padding:5px 16px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;font-family:inherit;color:#595959;">取消</button>'
      + '<button id="aptAnnotateSave" style="padding:5px 16px;background:#1677ff;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit;">添加注释</button>'
      + '</div>';

    // 定位
    var left = Math.min(x, window.innerWidth - 380);
    var top = Math.min(y + 20, window.innerHeight - 320);
    if (top < 10) top = y + 20;
    popup.style.left = Math.max(10, left) + 'px';
    popup.style.top = Math.max(10, top) + 'px';
    document.body.appendChild(popup);

    document.getElementById('aptAnnotateTitle').focus();

    document.getElementById('aptAnnotateClose').onclick = function() { popup.remove(); };
    document.getElementById('aptAnnotateCancel').onclick = function() { popup.remove(); };
    document.getElementById('aptAnnotateSave').onclick = function() {
      var title = document.getElementById('aptAnnotateTitle').value.trim();
      if (!title) { alert('请输入注释标题'); return; }
      var desc = document.getElementById('aptAnnotateDesc').value.trim();
      var typeEl = document.querySelector('input[name="aptNewType"]:checked');
      var type = typeEl ? typeEl.value : 'interaction';
      var id = addAnnotation({ title: title, description: desc || '无说明', type: type, x: x, y: y });
      popup.remove();
      showFloatingTip('已添加注释 #' + id);
    };
  }

  // ============================================================
  // 启动
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
