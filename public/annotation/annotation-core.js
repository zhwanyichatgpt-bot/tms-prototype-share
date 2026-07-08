/* =========================================================================
 * 原型标注 · 核心运行时
 *
 * 能力：
 *   1. 从 spec.yaml 加载结构化数据
 *   2. 渲染右侧标注抽屉（作用 / 规则分层 / 状态动作矩阵 / 状态流转 / 字段表）
 *   3. 切换标注模式（开关显示页面标号）
 *   4. URL `?edit=1` 时解锁编辑按钮，通过 File System Access API 写回 spec.yaml
 *
 * 公开 API：window.AnnotationCore
 *   .init(options)            — 初始化，加载 spec.yaml，绑定事件
 *   .enable() / .disable()    — 切换标注模式
 *   .toggle()                 — 翻转标注模式
 *   .isEnabled()              — 当前是否开启
 *   .open(unitId)             — 打开某个标注单元的抽屉
 *   .close()                  — 关闭抽屉
 *   .refresh()                — 按当前状态重算标号显隐
 *   .setUnitGate(id, fn)      — 为特定单元注册自定义显隐条件（返回 boolean）
 *   .setGlobalGate(fn)        — 设置全局显隐前置条件（返回 boolean）
 *   .getSpec()                — 只读访问 spec
 *
 * 页面接入约定：
 *   - 外层工具条放开关按钮（默认用 id="toolbarAnnotationToggleBtn"）
 *   - 标号 DOM 结构：<button class="annotation-node {modifier} hidden"
 *                          data-annotation-id="unit_id" aria-label="...">N</button>
 *   - 标号必须挂在带 `.annotation-anchor-host` 或 `position:relative` 的父容器里
 *   - 抽屉 DOM 由 AnnotationCore.init 时自动注入（若页面已有则沿用）
 * ========================================================================= */

(function () {
  'use strict';

  // 本地 js-yaml 默认路径：自安装时渲染器随附的 vendor 副本（相对页面 URL）。
  // 可在 AnnotationCore.init({ jsYamlSrc }) 时覆盖以适配项目实际部署路径。
  const JS_YAML_LOCAL_DEFAULT = './annotation/vendor/js-yaml.min.js';
  const JS_YAML_CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
  const DRAWER_ID = 'annotationDrawerMask';
  const EDITOR_ID = 'annotationEditorMask';
  const DRAWER_WIDTH_STORAGE_KEY = 'annotation.drawer.width.v1';
  const DRAWER_MIN_WIDTH = 420;
  const DRAWER_MAX_WIDTH = 980;
  const POSITIONING_TIP_ID = 'annotationPositioningTip';

  const state = {
    spec: null,
    specText: '',         // 原始 YAML 文本，用于编辑时保留注释结构的 best-effort
    activeUnitId: null,
    enabled: false,
    editorOpen: false,
    bindingMode: false,
    positioningMode: false,
    positioningScope: 'single',
    positioningUnitId: '',
    selectedPositioningUnitId: '',
    positioningDraft: null,
    positioningReturnDraft: null,
    positioningContext: null,
    positioningRestoreEnabled: false,
    previewBadgePositions: {},
    pendingUnitDraft: null,
    pendingBindReason: '',
    drawerWidth: 620,
    dirHandle: null,      // FSA 目录句柄（指向 current/）
    fileHandle: null,     // FSA spec.yaml 文件句柄
  };

  const config = {
    specUrl: './spec.yaml',
    jsYamlSrc: null,      // 本地 js-yaml 路径覆盖；为空则用 JS_YAML_LOCAL_DEFAULT，再退回 CDN
    toggleBtnId: 'toolbarAnnotationToggleBtn',
    toggleWrapSelector: '.prototype-annotation-toggle',
    badgeSelector: '.prototype-annotation-toggle .annotation-badge',
    // 页面标识符，用于服务端保存接口。
    // 格式：目录名，如 "运输通道管理"。可由页面自行在 AnnotationCore.init() 前设置。
    pageId: null,
    globalGate: null,
    unitGates: {},        // { unitId: () => boolean }
    readOnly: false,      // 只读发布模式：隐藏编辑/新增/调整角标按钮，禁用保存
    onBeforeOpen: null,
    onAfterOpen: null,
    onToggle: null,
  };

  const els = {};
  let bindingModeHandlerAttached = false;
  let positioningModeHandlerAttached = false;
  let editorSurfaceEventsBound = false;

  /* ---------- 工具函数 -------------------------------------------------- */

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`load script failed: ${src}`));
      document.head.appendChild(s);
    });
  }

  async function ensureYamlRuntime() {
    if (window.jsyaml) return true;
    const sources = [config.jsYamlSrc || JS_YAML_LOCAL_DEFAULT, JS_YAML_CDN];
    for (const src of sources) {
      try {
        await loadScript(src);
        if (window.jsyaml) return true;
      } catch (e) {
        console.warn('[AnnotationCore] YAML runtime load failed:', src, e);
      }
    }
    return !!window.jsyaml;
  }

  function isEditModeUrl() {
    if (config.readOnly) return false;
    try {
      const usp = new URLSearchParams(window.location.search);
      if (usp.has('edit')) {
        const v = usp.get('edit');
        if (v === '0' || v === 'false') return false;
        return v === '' || v === '1' || v === 'true';
      }
      return window.location.hash === '#edit';
    } catch (_) {
      return false;
    }
  }

  function isAnnotationAutoOpenUrl() {
    try {
      const usp = new URLSearchParams(window.location.search);
      if (!usp.has('annotation')) return false;
      const v = usp.get('annotation');
      return v === '' || v === '1' || v === 'true';
    } catch (_) {
      return false;
    }
  }

  function hasFSA() {
    return typeof window.showDirectoryPicker === 'function';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setLoadError(message) {
    if (!els.drawerBody) return;
    els.drawerBody.innerHTML = `
      <div class="annotation-note" style="color:#bb3f3f">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function unitById(id) {
    if (!state.spec || !Array.isArray(state.spec.units)) return null;
    return state.spec.units.find((u) => u.id === id) || null;
  }

  function parseOptionalNumber(value) {
    if (value === '' || value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function getDrawerMaxWidth() {
    const viewport = Math.max(window.innerWidth || 0, 0);
    return Math.max(DRAWER_MIN_WIDTH, Math.min(DRAWER_MAX_WIDTH, viewport - 48));
  }

  function clampDrawerWidth(width) {
    const raw = Number(width || state.drawerWidth || 620);
    const safe = Number.isFinite(raw) ? raw : 620;
    return Math.max(DRAWER_MIN_WIDTH, Math.min(getDrawerMaxWidth(), safe));
  }

  function saveDrawerWidth(width) {
    try {
      window.localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, String(clampDrawerWidth(width)));
    } catch (_) {}
  }

  function restoreDrawerWidth() {
    try {
      const raw = window.localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY);
      if (!raw) return 620;
      return clampDrawerWidth(Number(raw));
    } catch (_) {
      return 620;
    }
  }

  function applyDrawerWidth(width) {
    state.drawerWidth = clampDrawerWidth(width);
    if (!els.drawer) return;
    if (window.innerWidth <= 760) {
      els.drawer.style.removeProperty('--annotation-drawer-width');
      return;
    }
    els.drawer.style.setProperty('--annotation-drawer-width', `${state.drawerWidth}px`);
  }

  function syncDrawerWidthToViewport() {
    applyDrawerWidth(state.drawerWidth || restoreDrawerWidth());
  }

  function ensureDrawerResizeHandle() {
    if (!els.drawer || !els.drawerResizer || els.drawerResizer.dataset.bound === '1') return;
    els.drawerResizer.dataset.bound = '1';

    const startResize = (startClientX, pointerId) => {
      if (window.innerWidth <= 760) return;
      const startWidth = clampDrawerWidth(state.drawerWidth || els.drawer.offsetWidth || 620);
      document.body.classList.add('annotation-drawer-resizing');
      if (pointerId != null && els.drawerResizer.setPointerCapture) {
        try { els.drawerResizer.setPointerCapture(pointerId); } catch (_) {}
      }

      const updateWidth = (clientX) => {
        const delta = startClientX - clientX;
        applyDrawerWidth(startWidth + delta);
      };

      const stopResize = () => {
        document.body.classList.remove('annotation-drawer-resizing');
        saveDrawerWidth(state.drawerWidth);
        if (pointerId != null && els.drawerResizer.releasePointerCapture) {
          try { els.drawerResizer.releasePointerCapture(pointerId); } catch (_) {}
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      const onPointerMove = (event) => {
        updateWidth(event.clientX);
      };
      const onPointerUp = () => {
        stopResize();
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    els.drawerResizer.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      startResize(event.clientX, event.pointerId);
    });
  }

  function getPreviewBadgePosition(unitId) {
    return unitId ? (state.previewBadgePositions[unitId] || null) : null;
  }

  function setPreviewBadgePosition(unitId, x, y) {
    if (!unitId) return;
    state.previewBadgePositions[unitId] = {
      unitId,
      x: parseOptionalNumber(x),
      y: parseOptionalNumber(y),
    };
  }

  function resolveBadgePosition(unit) {
    const preview = getPreviewBadgePosition(unit.id);
    if (preview) {
      return {
        x: parseOptionalNumber(preview.x),
        y: parseOptionalNumber(preview.y),
      };
    }
    return {
      x: parseOptionalNumber(unit.badge_offset_x),
      y: parseOptionalNumber(unit.badge_offset_y),
    };
  }

  function measureBadgePosition(node) {
    if (!node || !node.parentElement) return { x: 0, y: 0 };
    const hostRect = node.parentElement.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(rect.left - hostRect.left)),
      y: Math.max(0, Math.round(rect.top - hostRect.top)),
    };
  }

  function applyBadgePositionToNode(node, unit) {
    const position = resolveBadgePosition(unit);
    if (position.x == null || position.y == null) {
      node.classList.remove('annotation-node-custom-position');
      node.style.removeProperty('left');
      node.style.removeProperty('top');
      node.style.removeProperty('right');
      node.style.removeProperty('bottom');
      return;
    }
    node.classList.add('annotation-node-custom-position');
    node.style.left = `${position.x}px`;
    node.style.top = `${position.y}px`;
    node.style.right = 'auto';
    node.style.bottom = 'auto';
  }

  function clearPreviewBadgePosition(unitId) {
    if (!unitId) {
      state.previewBadgePositions = {};
      return;
    }
    delete state.previewBadgePositions[unitId];
  }

  function buildDefaultBadgePreview(unit, liveNode) {
    if (!unit || !liveNode) return null;
    liveNode.classList.remove('annotation-node-custom-position');
    liveNode.style.removeProperty('left');
    liveNode.style.removeProperty('top');
    liveNode.style.removeProperty('right');
    liveNode.style.removeProperty('bottom');
    applyBadgePositionToNode(liveNode, { ...unit, badge_offset_x: null, badge_offset_y: null });
    const fallback = measureBadgePosition(liveNode);
    return {
      unitId: unit.id,
      x: fallback.x,
      y: fallback.y,
    };
  }

  function ensurePositioningTip() {
    let tip = document.getElementById(POSITIONING_TIP_ID);
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = POSITIONING_TIP_ID;
    tip.className = 'annotation-positioning-tip';
    tip.innerHTML = `
      <div class="annotation-positioning-tip-title" id="annotationPositioningTipTitle">正在调整角标位置</div>
      <div class="annotation-positioning-tip-text" id="annotationPositioningTipText">直接拖动页面上的角标圆点到更顺眼的位置。拖完以后点击“完成位置调整”，不想保留就点“取消此次调整”。</div>
      <div class="annotation-positioning-tip-actions">
        <button type="button" class="annotation-editor-btn" id="annotationPositioningResetBtn">恢复默认位置</button>
        <button type="button" class="annotation-editor-btn primary" id="annotationPositioningDoneBtn">完成位置调整</button>
        <button type="button" class="annotation-editor-btn" id="annotationPositioningCancelBtn">取消此次调整</button>
      </div>
    `;
    document.body.appendChild(tip);
    return tip;
  }

  function syncPositioningTipContent() {
    const title = document.getElementById('annotationPositioningTipTitle');
    const text = document.getElementById('annotationPositioningTipText');
    const resetBtn = document.getElementById('annotationPositioningResetBtn');
    if (!title || !text || !resetBtn) return;
    if (state.positioningScope === 'global') {
      title.textContent = '正在调整全部角标位置';
      text.textContent = '现在可以直接拖动页面上的任意角标；点一下角标后，也可以用方向键微调，按住 Shift 时每次移动 10 像素。全部调好后点击“完成位置调整并保存”；如果这次不想保留，就点击“取消此次调整”。';
      resetBtn.textContent = '全部恢复默认位置';
      const doneBtn = document.getElementById('annotationPositioningDoneBtn');
      if (doneBtn) doneBtn.textContent = '完成位置调整并保存';
      return;
    }
    title.textContent = '正在调整角标位置';
    text.textContent = '直接拖动页面上的角标圆点到更顺眼的位置；点一下角标后，也可以用方向键微调，按住 Shift 时每次移动 10 像素。拖完以后点击“完成位置调整”，不想保留就点“取消此次调整”。';
    resetBtn.textContent = '恢复默认位置';
    const doneBtn = document.getElementById('annotationPositioningDoneBtn');
    if (doneBtn) doneBtn.textContent = '完成位置调整';
  }

  function selectPositioningUnit(unitId = '') {
    state.selectedPositioningUnitId = unitId ? String(unitId) : '';
    document.querySelectorAll('.annotation-node[data-annotation-id]').forEach((node) => {
      node.classList.toggle('positioning-selected', !!state.positioningMode && node.dataset.annotationId === state.selectedPositioningUnitId);
    });
  }

  function setPositioningMode(active, unitId = '') {
    state.positioningMode = !!active;
    state.positioningUnitId = active ? String(unitId || '') : '';
    if (!state.positioningMode) {
      state.selectedPositioningUnitId = '';
    } else if (state.positioningScope === 'global') {
      state.selectedPositioningUnitId = state.selectedPositioningUnitId || String(unitId || '');
    } else {
      state.selectedPositioningUnitId = state.positioningUnitId;
    }
    document.body.classList.toggle('annotation-positioning-mode', state.positioningMode);
    const tip = ensurePositioningTip();
    if (tip) tip.classList.toggle('show', state.positioningMode);
    syncPositioningTipContent();
    document.querySelectorAll('.annotation-node[data-annotation-id]').forEach((node) => {
      const draggable = state.positioningMode
        && (state.positioningScope === 'global' || node.dataset.annotationId === state.positioningUnitId);
      const dimmed = state.positioningMode && state.positioningScope !== 'global' && node.dataset.annotationId !== state.positioningUnitId;
      node.classList.toggle('positioning-draggable', draggable);
      node.classList.toggle('positioning-dimmed', dimmed);
    });
    selectPositioningUnit(state.selectedPositioningUnitId);
  }

  function ensurePositioningModeHandler() {
    if (positioningModeHandlerAttached) return;
    positioningModeHandlerAttached = true;

    let draggingNode = null;
    let draggingHost = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragPointerId = null;

    const moveNodeByDelta = (node, deltaX, deltaY) => {
      if (!node || !node.parentElement) return;
      const hostRect = node.parentElement.getBoundingClientRect();
      const maxX = Math.max(0, hostRect.width - node.offsetWidth);
      const maxY = Math.max(0, hostRect.height - node.offsetHeight);
      const current = measureBadgePosition(node);
      const nextX = Math.max(0, Math.min(maxX, current.x + deltaX));
      const nextY = Math.max(0, Math.min(maxY, current.y + deltaY));
      node.classList.add('annotation-node-custom-position');
      node.style.left = `${nextX}px`;
      node.style.top = `${nextY}px`;
      node.style.right = 'auto';
      node.style.bottom = 'auto';
      setPreviewBadgePosition(node.dataset.annotationId || state.positioningUnitId, Math.round(nextX), Math.round(nextY));
    };

    const moveToClientPoint = (clientX, clientY) => {
      if (!draggingNode || !draggingHost) return;
      const hostRect = draggingHost.getBoundingClientRect();
      const rawX = clientX - hostRect.left - dragOffsetX;
      const rawY = clientY - hostRect.top - dragOffsetY;
      const maxX = Math.max(0, hostRect.width - draggingNode.offsetWidth);
      const maxY = Math.max(0, hostRect.height - draggingNode.offsetHeight);
      const nextX = Math.max(0, Math.min(maxX, rawX));
      const nextY = Math.max(0, Math.min(maxY, rawY));
      draggingNode.classList.add('annotation-node-custom-position');
      draggingNode.style.left = `${nextX}px`;
      draggingNode.style.top = `${nextY}px`;
      draggingNode.style.right = 'auto';
      draggingNode.style.bottom = 'auto';
      setPreviewBadgePosition(draggingNode.dataset.annotationId || state.positioningUnitId, Math.round(nextX), Math.round(nextY));
    };

    const stopDragging = () => {
      if (!draggingNode) return;
      document.body.classList.remove('annotation-badge-dragging');
      if (dragPointerId != null && draggingNode.releasePointerCapture) {
        try { draggingNode.releasePointerCapture(dragPointerId); } catch (_) {}
      }
      draggingNode.classList.remove('dragging');
      draggingNode = null;
      draggingHost = null;
      dragPointerId = null;
    };

    document.addEventListener('pointerdown', (event) => {
      if (!state.positioningMode) return;
      const node = event.target.closest('.annotation-node.positioning-draggable');
      if (!node) return;
      if (state.positioningScope !== 'global' && node.dataset.annotationId !== state.positioningUnitId) return;
      event.preventDefault();
      event.stopPropagation();
      selectPositioningUnit(node.dataset.annotationId || '');
      draggingNode = node;
      draggingHost = node.parentElement;
      dragPointerId = event.pointerId;
      const rect = node.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      document.body.classList.add('annotation-badge-dragging');
      node.classList.add('dragging');
      if (node.setPointerCapture) {
        try { node.setPointerCapture(event.pointerId); } catch (_) {}
      }
    }, true);

    window.addEventListener('pointermove', (event) => {
      if (!state.positioningMode || !draggingNode) return;
      moveToClientPoint(event.clientX, event.clientY);
    });

    window.addEventListener('pointerup', () => {
      stopDragging();
    });

    document.addEventListener('click', (event) => {
      if (!state.positioningMode) return;
      if (event.target.closest('#annotationPositioningDoneBtn')) {
        event.preventDefault();
        finishBadgePositionAdjustment(false);
        return;
      }
      if (event.target.closest('#annotationPositioningResetBtn')) {
        event.preventDefault();
        if (draggingNode) stopDragging();
        if (state.positioningScope === 'global') {
          (state.spec?.units || []).forEach((unit) => {
            const liveNode = document.querySelector(`.annotation-node[data-annotation-id="${escapeSelectorValue(unit.id)}"]`);
            const fallback = buildDefaultBadgePreview(unit, liveNode);
            if (fallback) setPreviewBadgePosition(unit.id, fallback.x, fallback.y);
          });
          syncAnnotationNodes();
          refresh();
          return;
        }
        const unit = unitById(state.positioningUnitId) || state.positioningDraft || state.positioningReturnDraft;
        const liveNode = document.querySelector(`.annotation-node[data-annotation-id="${escapeSelectorValue(state.positioningUnitId)}"]`);
        const fallback = buildDefaultBadgePreview(unit, liveNode);
        if (fallback) setPreviewBadgePosition(state.positioningUnitId, fallback.x, fallback.y);
        return;
      }
      if (event.target.closest('#annotationPositioningCancelBtn')) {
        event.preventDefault();
        finishBadgePositionAdjustment(true);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!state.positioningMode) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const unitId = state.selectedPositioningUnitId || state.positioningUnitId;
      if (!unitId) return;
      const node = document.querySelector(`.annotation-node[data-annotation-id="${escapeSelectorValue(unitId)}"]`);
      if (!node) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') moveNodeByDelta(node, -step, 0);
      if (event.key === 'ArrowRight') moveNodeByDelta(node, step, 0);
      if (event.key === 'ArrowUp') moveNodeByDelta(node, 0, -step);
      if (event.key === 'ArrowDown') moveNodeByDelta(node, 0, step);
    });
  }

  /* ---------- 抽屉 DOM ------------------------------------------------- */

  function ensureDrawer() {
    let mask = document.getElementById(DRAWER_ID);
    if (mask) {
      els.drawerMask = mask;
      els.drawer = mask.querySelector('.annotation-drawer');
      els.drawerResizer = mask.querySelector('#annotationDrawerResizer');
      els.drawerBadge = mask.querySelector('#annotationDrawerBadge');
      els.drawerTitle = mask.querySelector('#annotationDrawerTitle');
      els.drawerSubtitle = mask.querySelector('#annotationDrawerSubtitle');
      els.drawerBody = mask.querySelector('.annotation-drawer-body');
      els.drawerClose = mask.querySelector('#annotationDrawerClose');
      els.drawerEditBtn = mask.querySelector('#annotationDrawerEditBtn');
      ensureDrawerResizeHandle();
      applyDrawerWidth(state.drawerWidth || restoreDrawerWidth());
      return;
    }

    mask = document.createElement('div');
    mask.className = 'annotation-mask';
    mask.id = DRAWER_ID;
    mask.innerHTML = `
      <aside class="annotation-drawer" aria-label="原型标注说明抽屉">
        <div class="annotation-drawer-resizer" id="annotationDrawerResizer" title="拖动调整抽屉宽度" aria-hidden="true"></div>
        <div class="annotation-drawer-header">
          <div class="annotation-drawer-header-main">
            <div class="annotation-drawer-kicker">
              <span class="annotation-badge" id="annotationDrawerBadge">①</span>
              <span>原型标注</span>
            </div>
            <h3 class="annotation-drawer-title" id="annotationDrawerTitle"></h3>
            <div class="annotation-drawer-subtitle" id="annotationDrawerSubtitle"></div>
          </div>
          <div class="annotation-drawer-header-actions">
            <!-- annotation:edit-only start -->
            <button class="annotation-edit-btn" id="annotationDrawerEditBtn" type="button" title="编辑该单元">
              <span>编辑</span>
            </button>
            <!-- annotation:edit-only end -->
            <button class="annotation-close" id="annotationDrawerClose" type="button" title="关闭">×</button>
          </div>
        </div>
        <div class="annotation-drawer-body"></div>
      </aside>
    `;
    document.body.appendChild(mask);
    ensureDrawer();
  }

  /* annotation:edit-only start */
  function ensureEditor() {
    if (document.getElementById(EDITOR_ID)) {
      els.editorMask = document.getElementById(EDITOR_ID);
      els.editorTitle = els.editorMask.querySelector('#annotationEditorTitle');
      els.editorSubtitle = els.editorMask.querySelector('#annotationEditorSubtitle');
      els.editorForm = els.editorMask.querySelector('#annotationEditorForm');
      els.editorStatus = els.editorMask.querySelector('#annotationEditorStatus');
      els.editorSave = els.editorMask.querySelector('#annotationEditorSave');
      els.editorCancel = els.editorMask.querySelector('#annotationEditorCancel');
      els.editorFooterNote = els.editorMask.querySelector('#annotationEditorFooterNote');
      bindEditorSurfaceEvents();
      return;
    }

    const mask = document.createElement('div');
    mask.className = 'annotation-editor-mask';
    mask.id = EDITOR_ID;
    mask.innerHTML = `
      <div class="annotation-editor" role="dialog" aria-modal="true" aria-labelledby="annotationEditorTitle">
        <div class="annotation-editor-header">
          <div class="annotation-editor-header-main">
            <h3 class="annotation-editor-title" id="annotationEditorTitle">编辑标注单元</h3>
            <div class="annotation-editor-subtitle" id="annotationEditorSubtitle"></div>
            <div class="annotation-editor-meta" id="annotationEditorUnitMeta"></div>
          </div>
          <div class="annotation-editor-header-actions">
            <button class="annotation-editor-btn" id="annotationEditorNewUnit" type="button">新增单元</button>
            <button class="annotation-editor-btn" id="annotationEditorMoveUp" type="button">上移</button>
            <button class="annotation-editor-btn" id="annotationEditorMoveDown" type="button">下移</button>
            <button class="annotation-editor-btn" id="annotationEditorAdjustBadge" type="button">调整角标位置</button>
            <button class="annotation-editor-btn danger" id="annotationEditorDelete" type="button">删除</button>
            <button class="annotation-close" id="annotationEditorCancel" type="button" title="取消">×</button>
          </div>
        </div>
        <div class="annotation-editor-body">
          <form id="annotationEditorForm" class="annotation-editor-form">
            <div class="annotation-form-section annotation-form-section-primary">
              <div class="annotation-form-group">
                <div class="annotation-form-section-title">🧭 基础信息区</div>
	                <div class="annotation-form-row">
	                  <div class="annotation-form-group annotation-form-group-half">
	                    <label class="annotation-form-label">单元 ID <span class="annotation-form-required">*</span></label>
	                    <input type="text" name="id" class="annotation-form-input annotation-form-input-readonly" placeholder="如：channel_list_main" readonly />
	                    <div class="annotation-form-hint">系统会自动生成，无需手填。</div>
	                  </div>
                  <div class="annotation-form-group annotation-form-group-half">
                    <label class="annotation-form-label">无障碍标签</label>
                    <input type="text" name="aria_label" class="annotation-form-input" placeholder="如：② 通道列表主信息" />
                  </div>
                </div>
                <div class="annotation-form-row">
                  <div class="annotation-form-group annotation-form-group-half">
                    <label class="annotation-form-label">编号索引 <span class="annotation-form-required">*</span></label>
                    <input type="text" name="index" class="annotation-form-input" placeholder="如：②" />
                  </div>
                  <div class="annotation-form-group annotation-form-group-half">
                    <label class="annotation-form-label">短编号 <span class="annotation-form-required">*</span></label>
                    <input type="text" name="short_index" class="annotation-form-input" placeholder="如：2" />
                  </div>
                </div>
                <div class="annotation-form-group">
                  <label class="annotation-form-label">标题 <span class="annotation-form-required">*</span></label>
                  <input type="text" name="title" class="annotation-form-input" placeholder="请输入标题" required />
                </div>
                <div class="annotation-form-group">
                  <label class="annotation-form-label">副标题</label>
                  <input type="text" name="subtitle" class="annotation-form-input" placeholder="请输入副标题" />
                </div>
              </div>
            </div>

	            <div class="annotation-form-section">
	              <div class="annotation-form-section-title">🔗 绑定与显隐区</div>
	              <div class="annotation-form-row">
	                <div class="annotation-form-group annotation-form-group-half">
	                  <label class="annotation-form-label">绑定到页面哪个区域 <span class="annotation-form-required">*</span></label>
	                  <input type="text" name="binding_target_label" class="annotation-form-input annotation-form-input-readonly" placeholder="还未绑定，请点按钮后直接点页面区域" readonly />
	                  <input type="hidden" name="anchor_selector" />
	                  <input type="hidden" name="node_class" />
	                  <input type="hidden" name="badge_offset_x" />
	                  <input type="hidden" name="badge_offset_y" />
	                  <div class="annotation-section-actions">
	                    <button type="button" class="annotation-editor-btn primary" id="annotationStartBindingBtn">去页面上点选绑定</button>
	                    <button type="button" class="annotation-editor-btn" id="annotationEditorCancelBindingBtn">取消绑定</button>
	                  </div>
	                  <div class="annotation-form-hint">推荐方式：点击“去页面上点选绑定”，然后直接在页面上点你想挂角标的区域。</div>
	                </div>
	                <div class="annotation-form-group annotation-form-group-half">
	                  <label class="annotation-form-label">显隐条件码</label>
	                  <input type="text" name="visibility_condition" class="annotation-form-input" placeholder="如：drawer_open" />
	                  <div class="annotation-form-hint">大多数新增标注可以先留空，只有需要特殊显示条件时再填。</div>
	                </div>
	              </div>
	              <div class="annotation-form-row">
	                <div class="annotation-form-group annotation-form-group-half">
	                  <label class="annotation-form-label">显隐条件说明</label>
	                  <input type="text" name="visibility_condition_desc" class="annotation-form-input" placeholder="如：仅当运输方案抽屉打开时可见" />
	                </div>
	                <div class="annotation-form-group annotation-form-group-half">
	                  <label class="annotation-form-label">绑定结果预览</label>
	                  <div class="annotation-form-hint">绑定后，这个标注会自动显示在你点选的页面区域附近。</div>
	                </div>
	              </div>
	            </div>

            <div class="annotation-form-section">
              <div class="annotation-form-section-title">📝 作用说明区</div>
              <textarea name="purpose" class="annotation-form-textarea" placeholder="请输入作用说明" rows="5"></textarea>
            </div>

            <div class="annotation-form-section">
              <div class="annotation-form-section-title">📋 核心规则区</div>
              <div class="annotation-form-hint">这里只写最关键的业务规则。每条规则一行，优先级越高越重要。</div>
              <div id="annotationRulesList" class="annotation-rules-list"></div>
              <button type="button" class="annotation-add-rule-btn" data-action="rule-add">+ 添加一条新规则</button>
            </div>

            <details class="annotation-form-section annotation-form-section-collapse" open>
              <summary class="annotation-form-collapse-summary">📑 字段规则表区</summary>
              <div class="annotation-form-collapse-body">
                <div class="annotation-form-hint">这一块用来描述“页面上有哪些字段、每个字段起什么作用”。大多数时候，你只需要改表格里的文字。</div>
                <div class="annotation-section-actions">
                  <button type="button" class="annotation-editor-btn" data-action="field-column-add">新增列</button>
                  <button type="button" class="annotation-editor-btn" data-action="field-row-add">新增行</button>
                </div>
                <div id="annotationFieldsEditor"></div>
              </div>
            </details>

            <details class="annotation-form-section annotation-form-section-collapse">
              <summary class="annotation-form-collapse-summary">🧩 状态矩阵区（进阶）</summary>
              <div class="annotation-form-collapse-body">
                <div class="annotation-form-hint">只有当这个标注单元确实需要“状态 + 动作”的关系说明时，才需要编辑这里。比如“状态与页面动作”这一块会用到。</div>
                <div class="annotation-subsection">
                  <div class="annotation-subsection-title">有哪些状态</div>
                  <div class="annotation-section-actions">
                    <button type="button" class="annotation-editor-btn" data-action="matrix-add-state">新增状态</button>
                  </div>
                  <div id="annotationMatrixStates" class="annotation-chip-list"></div>
                </div>
                <div class="annotation-subsection">
                  <div class="annotation-subsection-title">有哪些动作</div>
                  <div class="annotation-section-actions">
                    <button type="button" class="annotation-editor-btn" data-action="matrix-add-action">新增动作</button>
                  </div>
                  <div id="annotationMatrixActions" class="annotation-chip-list"></div>
                </div>
                <div class="annotation-subsection">
                  <div class="annotation-subsection-title">矩阵单元格（cells）</div>
                  <div class="annotation-form-hint">单元格通常填：可点 / 禁用 / 不展示。</div>
                  <div id="annotationMatrixTable"></div>
                  <datalist id="annotationMatrixCellOptions">
                    <option value="可点"></option>
                    <option value="禁用"></option>
                    <option value="不展示"></option>
                  </datalist>
                </div>
                <div class="annotation-subsection" id="annotationMatrixLegend"></div>
                <div class="annotation-section-actions">
                  <button type="button" class="annotation-editor-btn" data-action="legend-add">新增说明项</button>
                </div>
              </div>
            </details>

            <details class="annotation-form-section annotation-form-section-collapse">
              <summary class="annotation-form-collapse-summary">🔄 状态流转区（进阶）</summary>
              <div class="annotation-form-collapse-body">
                <div class="annotation-form-hint">只有当这个标注单元需要说明“从什么状态，做了什么动作，会变成什么结果”时才填写这里。</div>
                <div class="annotation-form-hint">填写方式：当前状态 → 触发动作 → 结果状态；如果还有额外联动，就写在“联动说明”里。</div>
                <div class="annotation-form-hint">示例：当前状态=草稿，触发动作=编辑保存并启用，结果状态=启用·未发布，联动说明=发布状态仍为未发布。</div>
                <div id="annotationTransitionsList" class="annotation-transition-card-list"></div>
                <button type="button" class="annotation-add-rule-btn" data-action="transition-add">+ 添加一条状态流转</button>
              </div>
            </details>

            <details class="annotation-form-section annotation-form-section-collapse">
              <summary class="annotation-form-collapse-summary">🗒️ 备注区</summary>
              <div class="annotation-form-collapse-body">
                <div class="annotation-form-hint">这一块一般用来补一句收口提醒，比如“这一块只回答什么问题，不混入其他内容”。</div>
                <textarea name="footnote" class="annotation-form-textarea" placeholder="请输入 footnote / 备注信息" rows="4"></textarea>
              </div>
            </details>

            <details class="annotation-form-section annotation-form-section-collapse">
              <summary class="annotation-form-collapse-summary">⚙️ 高级 JSON 兜底区</summary>
              <div class="annotation-form-collapse-body">
                <div class="annotation-form-hint">这里用于承接当前可视化编辑器未显式覆盖的额外字段。请填写 JSON 对象，显式表单字段优先。</div>
                <textarea id="annotationAdvancedJson" class="annotation-form-textarea annotation-form-codearea" rows="12" placeholder="{\n  \"extra_key\": \"extra_value\"\n}"></textarea>
              </div>
            </details>
          </form>
          <div class="annotation-editor-status" id="annotationEditorStatus" data-tone="muted"></div>
        </div>
        <div class="annotation-editor-footer">
          <div class="annotation-editor-footer-note" id="annotationEditorFooterNote"></div>
          <button class="annotation-editor-btn primary" id="annotationEditorSave" type="button">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(mask);
    ensureEditor();
  }

  function bindEditorSurfaceEvents() {
    if (!els.editorMask || editorSurfaceEventsBound) return;
    editorSurfaceEventsBound = true;

    if (els.editorCancel) els.editorCancel.onclick = closeEditor;
    if (els.editorSave) els.editorSave.onclick = saveCurrentUnit;

    const newUnitBtn = document.getElementById('annotationEditorNewUnit');
    if (newUnitBtn) newUnitBtn.onclick = openCreateUnitEditor;

    const adjustBadgeBtn = document.getElementById('annotationEditorAdjustBadge');
    if (adjustBadgeBtn) {
      adjustBadgeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startBadgePositionAdjustment();
      };
    }

    const startBindingBtn = document.getElementById('annotationStartBindingBtn');
    if (startBindingBtn) {
      startBindingBtn.onclick = () => {
        stashCurrentDraftForRebinding();
      };
    }

    const cancelBindingBtn = document.getElementById('annotationEditorCancelBindingBtn');
    if (cancelBindingBtn) {
      cancelBindingBtn.onclick = () => {
        setBindingMode(false);
        setEditorStatus('muted', '已取消绑定模式。');
      };
    }

    const moveUpBtn = document.getElementById('annotationEditorMoveUp');
    if (moveUpBtn) moveUpBtn.onclick = () => moveCurrentUnit(-1);

    const moveDownBtn = document.getElementById('annotationEditorMoveDown');
    if (moveDownBtn) moveDownBtn.onclick = () => moveCurrentUnit(1);

    const deleteBtn = document.getElementById('annotationEditorDelete');
    if (deleteBtn) deleteBtn.onclick = deleteCurrentUnit;

    els.editorMask.addEventListener('click', (e) => {
      if (e.target === els.editorMask) closeEditor();
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const index = Number(actionBtn.dataset.index || 0);
        handleEditorClick(action, index);
      }
    });
    els.editorMask.addEventListener('input', (e) => handleEditorInput(e.target));
    els.editorMask.addEventListener('change', (e) => handleEditorInput(e.target));
  }
  /* annotation:edit-only end */

  /* ---------- 渲染：抽屉主体 ------------------------------------------- */

  function renderUnitBody(unit) {
    const parts = [];

    // 作用
    if (unit.purpose) {
      parts.push(`
        <div class="annotation-summary-card">
          <strong>作用</strong>
          <p>${escapeHtml(unit.purpose).replace(/\n/g, '<br>')}</p>
        </div>
      `);
    }

    // 规则（P0/P1/P2 分层排序）
    if (Array.isArray(unit.rules) && unit.rules.length) {
      const priorityRank = { P0: 0, P1: 1, P2: 2 };
      const sorted = [...unit.rules].sort((a, b) => {
        const ra = priorityRank[a.priority] ?? 9;
        const rb = priorityRank[b.priority] ?? 9;
        return ra - rb;
      });
      const rows = sorted.map((r) => {
        const pr = r.priority || 'P1';
        return `
          <li class="annotation-rule-item" data-priority="${escapeHtml(pr)}">
            <span class="annotation-rule-priority">${escapeHtml(pr)}</span>
            <span class="annotation-rule-text">${escapeHtml(r.text || '')}</span>
          </li>
        `;
      }).join('');
      parts.push(`
        <section class="annotation-section">
          <h4>核心规则</h4>
          <ul class="annotation-rule-list">${rows}</ul>
        </section>
      `);
    }

    // 状态 × 动作 矩阵（可选）
    if (unit.status_action_matrix) {
      parts.push(renderMatrix(unit.status_action_matrix));
    } else if (unit.matrix) {
      parts.push(renderCsvMatrix(unit.matrix));
    }

    // 状态流转（可选）
    if (Array.isArray(unit.state_transitions) && unit.state_transitions.length) {
      parts.push(renderTransitions(unit.state_transitions));
    } else if (Array.isArray(unit.keyTransitions) && unit.keyTransitions.length) {
      parts.push(renderKeyTransitions(unit.keyTransitions));
    }

    // 字段规则表（动态列）
    if (Array.isArray(unit.fields) && unit.fields.length) {
      parts.push(renderFields(unit.field_columns, unit.fields));
    }

    // 底注
    if (unit.footnote) {
      parts.push(`<div class="annotation-note">${escapeHtml(unit.footnote).replace(/\n/g, '<br>')}</div>`);
    } else if (Array.isArray(unit.footnotes) && unit.footnotes.length) {
      parts.push(`
        <div class="annotation-note">
          ${unit.footnotes.map((item) => `- ${escapeHtml(item)}`).join('<br>')}
        </div>
      `);
    }

    return parts.join('');
  }

  /**
   * 渲染"状态 × 动作"矩阵。
   *
   * 策略：只展示每个状态下"可点"的动作（研发最需要看的），
   * 禁用/不可见的不展示以减少干扰。
   *
   * 兼容两种数据格式：
   * 1. 结构化格式（status_action_matrix.states / actions / cells）
   * 2. CSV 格式（matrix: | ...）—— 降级走 renderCsvMatrix
   */
  function renderMatrix(matrix) {
    // 降级：如果是不支持的格式，尝试 CSV 渲染
    if (!matrix || !Array.isArray(matrix.states) || !Array.isArray(matrix.actions)) {
      if (typeof matrix === 'string' || typeof matrix === 'number') {
        return renderCsvMatrix(String(matrix));
      }
      return '';
    }

    const cells = matrix.cells || {};

    const rows = matrix.states.map((st) => {
      const row = cells[st] || [];
      // 只取"可点"的动作
      const available = matrix.actions
        .filter((_, i) => row[i] === '可点')
        .map((action) => `<span class="annotation-state-action-tag">${escapeHtml(action)}</span>`)
        .join('');

      const noActions = !available
        ? `<span class="annotation-state-empty">无操作动作</span>`
        : available;

      return `
        <div class="annotation-state-row">
          <div class="annotation-state-name">${escapeHtml(st)}</div>
          <div class="annotation-state-actions">${noActions}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="annotation-section">
        <h4>可用动作</h4>
        <div class="annotation-state-list">
          ${rows}
        </div>
        ${matrix.legend ? `<p class="annotation-matrix-note">说明：${Object.entries(matrix.legend).map(([k, v]) => `${k}=${v}`).join('；')}</p>` : ''}
      </section>
    `;
  }

  function renderCsvMatrix(csvText) {
    const lines = String(csvText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return '';
    const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));
    const head = rows[0];
    const body = rows.slice(1);
    const thead = `
      <thead>
        <tr>
          ${head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}
        </tr>
      </thead>
    `;
    const tbody = body.map((row) => `
      <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>
    `).join('');

    return `
      <section class="annotation-section">
        <h4>状态 × 动作 矩阵</h4>
        <div class="annotation-matrix-wrap">
          <table class="annotation-matrix">${thead}<tbody>${tbody}</tbody></table>
        </div>
      </section>
    `;
  }

  function renderTransitions(transitions) {
    const items = transitions.map((t) => `
      <div class="annotation-transition-item">
        <div class="annotation-transition-side">
          <span class="annotation-transition-label">当前</span>
          <span class="annotation-transition-value">${escapeHtml(t.from || '—')}</span>
        </div>
        <div>
          <div class="annotation-transition-arrow">→</div>
          <div class="annotation-transition-trigger">${escapeHtml(t.trigger || '—')}</div>
        </div>
        <div class="annotation-transition-side">
          <span class="annotation-transition-label">结果</span>
          <span class="annotation-transition-value">${escapeHtml(t.to || '—')}</span>
        </div>
        ${t.effect && t.effect !== '—' ? `<div class="annotation-transition-effect">${escapeHtml(t.effect)}</div>` : ''}
      </div>
    `).join('');

    return `
      <section class="annotation-section">
        <h4>状态流转</h4>
        <div class="annotation-transitions">${items}</div>
      </section>
    `;
  }

  function renderKeyTransitions(transitions) {
    const items = transitions.map((t) => `
      <div class="annotation-transition-item">
        <div class="annotation-transition-side">
          <span class="annotation-transition-label">条件</span>
          <span class="annotation-transition-value">${escapeHtml(t.condition || '—')}</span>
        </div>
        <div>
          <div class="annotation-transition-arrow">→</div>
          <div class="annotation-transition-trigger">${escapeHtml(t.action || '—')}</div>
        </div>
        <div class="annotation-transition-side">
          <span class="annotation-transition-label">结果</span>
          <span class="annotation-transition-value">${escapeHtml(t.result || '—')}</span>
        </div>
      </div>
    `).join('');

    return `
      <section class="annotation-section">
        <h4>关键流转</h4>
        <div class="annotation-transitions">${items}</div>
      </section>
    `;
  }

  function renderFields(columns, fields) {
    const cols = Array.isArray(columns) && columns.length
      ? columns
      : Object.keys(fields[0] || {});
    const labels = cols.map((c) => fieldLabel(c));
    const thead = `<thead><tr>${labels.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
    const tbody = fields.map((f) => {
      const cells = cols.map((c) => `<td>${escapeHtml(renderFieldValue(f[c]))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <section class="annotation-section">
        <h4>字段规则表</h4>
        <div class="annotation-fields-wrap">
          <table class="annotation-fields-table">${thead}<tbody>${tbody}</tbody></table>
        </div>
      </section>
    `;
  }

  function fieldLabel(key) {
    const map = {
      name: '字段',
      role: '作用',
      source: '来源',
      required: '必填',
      default: '默认值',
      validation: '校验',
      options: '可选值',
      display: '展示/显隐'
    };
    return map[key] || key;
  }

  function renderFieldValue(value) {
    if (Array.isArray(value)) return value.join(' / ');
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? '是' : '否';
    return String(value);
  }

  function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function findAnnotationNodes(unitId) {
    return document.querySelectorAll(`[data-annotation-id="${escapeSelectorValue(unitId)}"]`);
  }

  function syncAnnotationNodes() {
    document.querySelectorAll('.annotation-node[data-generated="true"]').forEach((node) => node.remove());
    if (!state.spec || !Array.isArray(state.spec.units)) return;
    const validIds = new Set(state.spec.units.map((unit) => unit.id));

    state.spec.units.forEach((unit) => {
      const existing = Array.from(findAnnotationNodes(unit.id));
      if (!existing.length && unit.anchor_selector) {
        let host = null;
        try {
          host = document.querySelector(unit.anchor_selector);
        } catch (e) {
          console.warn('[AnnotationCore] 锚点选择器无效：', unit.anchor_selector, e);
        }
        if (host) {
          host.classList.add('annotation-anchor-host');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `annotation-node ${unit.node_class || 'annotation-node-generic'} hidden`;
          button.dataset.annotationId = unit.id;
          button.dataset.generated = 'true';
          button.setAttribute('aria-label', unit.aria_label || unit.title || unit.id);
          button.textContent = unit.short_index || unit.index || '•';
          host.appendChild(button);
        }
      }

      findAnnotationNodes(unit.id).forEach((node) => {
        node.classList.add('annotation-node');
        const prevClass = node.dataset.annotationNodeClass;
        if (prevClass && prevClass !== unit.node_class) {
          node.classList.remove(prevClass);
        }
        if (unit.node_class) {
          node.classList.add(unit.node_class);
          node.dataset.annotationNodeClass = unit.node_class;
        } else {
          delete node.dataset.annotationNodeClass;
        }
        node.setAttribute('aria-label', unit.aria_label || unit.title || unit.id);
        node.textContent = unit.short_index || unit.index || node.textContent || '•';
        applyBadgePositionToNode(node, unit);
      });
    });

    document.querySelectorAll('.annotation-node[data-annotation-id]').forEach((node) => {
      if (!validIds.has(node.dataset.annotationId)) {
        node.classList.add('hidden');
        node.classList.remove('active');
      }
    });
  }

  function ensureEditorEntryButton() {
    if (!isEditModeUrl()) return;
    if (document.getElementById('toolbarAnnotationEditorBtn')) return;
    const wrap = document.querySelector(config.toggleWrapSelector);
    if (!wrap) return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'toolbarAnnotationEditorBtn';
    btn.type = 'button';
    btn.textContent = '新增标注';
    wrap.appendChild(btn);

    const positionBtn = document.createElement('button');
    positionBtn.className = 'btn';
    positionBtn.id = 'toolbarAnnotationPositionBtn';
    positionBtn.type = 'button';
    positionBtn.textContent = '调整角标';
    wrap.appendChild(positionBtn);
  }

  function slugifyUnitId(text) {
    const base = String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[\s\W]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || `annotation-unit-${Date.now()}`;
  }

  function autoGenerateUnitId(title) {
    const used = new Set(((state.spec && state.spec.units) || []).map((item) => item.id));
    const base = slugifyUnitId(title || 'annotation-unit');
    let candidate = base;
    let count = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${count}`;
      count += 1;
    }
    return candidate;
  }

  function suggestNodeClass(anchorSelector) {
    const selector = String(anchorSelector || '');
    if (!selector) return '';
    if (selector.includes('channel_entry_filter') || selector.includes('filters')) return 'entry-filter';
    if (selector.includes('channel_status_actions')) return 'status-actions';
    if (selector.includes('channel_list_main') || selector.includes('table-card')) return 'main-info';
    if (selector.includes('channel_scheme_entry') || selector.includes('schemeDrawer')) return 'scheme-entry';
    if (selector.includes('channel_create_form') || selector.includes('form-section')) return 'form-entry';
    return '';
  }

  function getBindingTargetLabel(element) {
    if (!element) return '';
    const titleNode = element.querySelector('h1, h2, h3, .section-head h3, .table-head h3, .drawer-title, label');
    if (titleNode && titleNode.textContent) return titleNode.textContent.trim();
    const target = element.getAttribute('data-annotation-target');
    if (target) return target;
    if (element.id) return `#${element.id}`;
    return '当前页面区域';
  }

  function buildSelectorForElement(element) {
    if (!element) return '';
    const target = element.getAttribute('data-annotation-target');
    if (target) return `[data-annotation-target="${target}"]`;
    if (element.id) return `#${element.id}`;
    const classes = Array.from(element.classList || [])
      .filter((name) => !/^annotation-/.test(name))
      .slice(0, 2);
    if (classes.length) return `.${classes.join('.')}`;
    return '';
  }

  const BINDING_UI_IGNORE_SELECTOR = [
    '#annotationDrawerMask',
    '#annotationEditorMask',
    '#annotationBindingTip',
    '.annotation-node',
    '.prototype-annotation-toggle',
  ].join(', ');

  const BINDING_PREFERRED_SELECTOR = [
    '[data-annotation-target]',
    '.card',
    '.table-card',
    '.table-wrapper',
    '.table-head',
    '.form-section',
    '.drawer',
    '.drawer-panel',
    '.section-head',
    '.filters',
    '.filter-bar',
    '.filter-grid',
    '.toolbar',
    '.panel',
    '.block',
    '.content-card',
    '.scheme-card',
    '.list-card',
    'table',
  ].join(', ');

  function isBindingCandidateVisible(element) {
    if (!element || !(element instanceof Element)) return false;
    if (element.matches(BINDING_UI_IGNORE_SELECTOR)) return false;
    if (element.closest(BINDING_UI_IGNORE_SELECTOR)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width < 28 || rect.height < 20) return false;
    return !!(rect.width || rect.height);
  }

  function scoreBindingCandidate(element, depth) {
    if (!isBindingCandidateVisible(element)) return -Infinity;
    const rect = element.getBoundingClientRect();
    const text = `${element.id || ''} ${element.className || ''}`.toLowerCase();
    let score = 0;

    if (element.matches('[data-annotation-target]')) score += 120;
    if (element.matches(BINDING_PREFERRED_SELECTOR)) score += 90;
    if (/(table|list|form|filter|drawer|panel|section|content|main|header|toolbar|card|scheme)/.test(text)) score += 32;
    if (rect.width >= 180) score += 16;
    if (rect.width >= 320) score += 14;
    if (rect.height >= 44) score += 12;
    if (rect.height >= 96) score += 10;
    if (element.id) score += 8;
    if (element.children && element.children.length >= 2) score += 8;
    if (/^(button|a|span|label|strong|em|b|i|small)$/i.test(element.tagName)) score -= 42;
    if (/^(td|th|tr)$/i.test(element.tagName)) score -= 12;
    score -= depth * 3;

    return score;
  }

  function findBindingTargetElement(node) {
    if (!node || !(node instanceof Element)) return null;
    if (node.matches(BINDING_UI_IGNORE_SELECTOR) || node.closest(BINDING_UI_IGNORE_SELECTOR)) return null;

    const explicit = node.closest('[data-annotation-target]');
    if (explicit && isBindingCandidateVisible(explicit)) return explicit;

    let best = null;
    let bestScore = -Infinity;
    let current = node;
    let depth = 0;
    while (current && current instanceof Element && current !== document.body && depth <= 8) {
      const score = scoreBindingCandidate(current, depth);
      if (score > bestScore) {
        best = current;
        bestScore = score;
      }
      current = current.parentElement;
      depth += 1;
    }
    return best;
  }

  function clearBindingHighlights() {
    document.querySelectorAll('.annotation-binding-highlight').forEach((node) => {
      node.classList.remove('annotation-binding-highlight');
    });
  }

  function ensureBindingTip() {
    let tip = document.getElementById('annotationBindingTip');
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'annotationBindingTip';
    tip.className = 'annotation-binding-tip';
    tip.innerHTML = `
      <div class="annotation-binding-tip-title">请选择页面区域</div>
      <div class="annotation-binding-tip-text">直接点击页面上你想挂标注的位置。选完后会自动弹出填写内容的窗口。</div>
      <div class="annotation-binding-tip-target" id="annotationBindingTipTarget">当前还没有选中区域</div>
    `;
    document.body.appendChild(tip);
    return tip;
  }

  function setBindingMode(active) {
    state.bindingMode = !!active;
    document.body.classList.toggle('annotation-binding-mode', state.bindingMode);
    const tip = ensureBindingTip();
    if (tip) tip.classList.toggle('show', state.bindingMode);
    const targetText = document.getElementById('annotationBindingTipTarget');
    if (targetText && !state.bindingMode) {
      targetText.textContent = '当前还没有选中区域';
    }
    if (!state.bindingMode) clearBindingHighlights();
  }

  function ensureBindingModeHandler() {
    if (bindingModeHandlerAttached) return;
    bindingModeHandlerAttached = true;

    document.addEventListener('mousemove', (e) => {
      if (!state.bindingMode) return;
      const target = findBindingTargetElement(e.target);
      clearBindingHighlights();
      if (target) target.classList.add('annotation-binding-highlight');
      const targetText = document.getElementById('annotationBindingTipTarget');
      if (targetText) {
        targetText.textContent = target
          ? `当前准备绑定到：${getBindingTargetLabel(target)}`
          : '当前还没有识别到可绑定区域';
      }
    });

    document.addEventListener('click', (e) => {
      if (!state.bindingMode) return;
      if (e.target.closest('#annotationStartBindingBtn, #annotationEditorCancelBindingBtn')) return;
      const target = findBindingTargetElement(e.target);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      const selector = buildSelectorForElement(target);
      const label = getBindingTargetLabel(target);
      const anchorInput = getEditorInput('anchor_selector');
      const labelInput = getEditorInput('binding_target_label');
      const nodeClassInput = getEditorInput('node_class');
      if (anchorInput) anchorInput.value = selector;
      if (labelInput) labelInput.value = label;
      if (nodeClassInput && !nodeClassInput.value.trim()) {
        nodeClassInput.value = suggestNodeClass(selector);
      }
      setBindingMode(false);
      if (state.pendingUnitDraft) {
        state.pendingUnitDraft.anchor_selector = selector;
        state.pendingUnitDraft.binding_target_label = label;
        if (!state.pendingUnitDraft.node_class) {
          state.pendingUnitDraft.node_class = suggestNodeClass(selector);
        }
        const draft = deepClone(state.pendingUnitDraft);
        const reason = state.pendingBindReason || '已完成页面区域绑定。';
        state.pendingUnitDraft = null;
        state.pendingBindReason = '';
        openEditorByUnit(draft, {
          isNew: true,
          originalId: '',
          originalIndex: -1,
        }, reason);
        return;
      }
      setEditorStatus('ok', `已绑定到页面区域：${label}`);
    }, true);
  }

  /* ---------- 显隐控制 ------------------------------------------------- */

  function syncToggleUi() {
    const wrap = document.querySelector(config.toggleWrapSelector);
    if (wrap) wrap.classList.toggle('active', state.enabled);
    const btn = document.getElementById(config.toggleBtnId);
    const editorBtn = document.getElementById('toolbarAnnotationEditorBtn');
    const positionBtn = document.getElementById('toolbarAnnotationPositionBtn');
    if (btn) {
      const hasSpec = !!state.spec;
      btn.textContent = state.enabled ? '关闭原型标注' : '原型标注';
      btn.disabled = !hasSpec;
      btn.title = hasSpec ? '' : '原型标注资源未加载完成';
    }
    if (editorBtn) editorBtn.disabled = !state.spec;
    if (positionBtn) {
      positionBtn.disabled = !state.spec;
      positionBtn.textContent = state.positioningMode && state.positioningScope === 'global' ? '正在调整角标' : '调整角标';
      positionBtn.classList.toggle('primary', state.positioningMode && state.positioningScope === 'global');
    }
  }

  function gatesAllow(unit) {
    if (typeof config.globalGate === 'function' && !config.globalGate()) return false;
    const gate = unit && config.unitGates[unit.id];
    if (typeof gate === 'function' && !gate()) return false;
    return true;
  }

  function refresh() {
    if (!state.spec) {
      if (els.drawerMask) {
        els.drawerMask.classList.remove('show');
      }
      syncToggleUi();
      return;
    }
    syncAnnotationNodes();
    const globalOk = typeof config.globalGate !== 'function' || config.globalGate();

    state.spec.units.forEach((unit) => {
      const nodes = findAnnotationNodes(unit.id);
      nodes.forEach((node) => {
        const show = state.enabled && globalOk && gatesAllow(unit);
        node.classList.toggle('hidden', !show);
        node.classList.toggle('active', state.activeUnitId === unit.id);
      });
    });

    if (els.drawerMask) {
      const shouldShowDrawer = state.enabled && globalOk && !!state.activeUnitId;
      els.drawerMask.classList.toggle('show', shouldShowDrawer);
    }
    syncToggleUi();
  }

  /* ---------- 公共 API：打开/关闭/开关 ---------------------------------- */

  function open(unitId) {
    const unit = unitById(unitId);
    if (!unit) return;
    if (!state.enabled) return;
    if (!gatesAllow(unit)) return;

    if (typeof config.onBeforeOpen === 'function') config.onBeforeOpen(unit);

    state.activeUnitId = unitId;
    if (els.drawerBadge) els.drawerBadge.textContent = unit.index || unit.short_index || '';
    if (els.drawerTitle) els.drawerTitle.textContent = unit.title || '';
    if (els.drawerSubtitle) els.drawerSubtitle.textContent = unit.subtitle || '';
    if (els.drawerBody) els.drawerBody.innerHTML = renderUnitBody(unit);
    refresh();

    if (typeof config.onAfterOpen === 'function') config.onAfterOpen(unit);
  }

  function close() {
    state.activeUnitId = null;
    refresh();
  }

  function enable() {
    state.enabled = true;
    refresh();
    if (typeof config.onToggle === 'function') config.onToggle(true);
  }

  function disable() {
    state.enabled = false;
    state.activeUnitId = null;
    refresh();
    if (typeof config.onToggle === 'function') config.onToggle(false);
  }

  function toggle() {
    if (state.enabled) disable(); else enable();
  }

  /* ---------- 编辑能力 ------------------------------------------------- */
  /* annotation:edit-only start */

  const EXPLICIT_UNIT_KEYS = [
    'id', 'index', 'short_index', 'title', 'subtitle',
    'anchor_selector', 'node_class', 'aria_label',
    'visibility_condition', 'visibility_condition_desc',
    'purpose', 'rules', 'status_action_matrix',
    'badge_offset_x', 'badge_offset_y',
    'state_transitions', 'field_columns', 'fields', 'footnote'
  ];
  const OPTIONAL_STRING_KEYS = [
    'subtitle', 'node_class', 'aria_label', 'visibility_condition',
    'visibility_condition_desc', 'purpose', 'footnote'
  ];
  const MATRIX_CELL_OPTIONS = ['可点', '禁用', '不展示'];

  let editorRules = [];
  let editorFieldColumns = [];
  let editorFieldRows = [];
  let editorMatrix = { states: [], actions: [], cells: [], legend: [] };
  let editorTransitions = [];
  let editorExtraJson = {};
  let editorContext = {
    isNew: false,
    originalId: '',
    originalIndex: -1,
  };

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function compactObject(obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value === '' || value == null) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }

  function normalizeRule(rule) {
    return {
      priority: rule && rule.priority ? String(rule.priority) : 'P1',
      text: rule && rule.text ? String(rule.text) : '',
    };
  }

  function normalizeFieldTable(unit) {
    const rows = Array.isArray(unit.fields) ? unit.fields : [];
    const columns = Array.isArray(unit.field_columns) && unit.field_columns.length
      ? [...unit.field_columns]
      : Array.from(rows.reduce((set, row) => {
        Object.keys(row || {}).forEach((key) => set.add(key));
        return set;
      }, new Set()));

    return {
      columns,
      rows: rows.map((row) => columns.map((col) => row && row[col] != null ? String(row[col]) : '')),
    };
  }

  function normalizeMatrix(unit) {
    const matrix = unit.status_action_matrix || {};
    const states = Array.isArray(matrix.states) ? [...matrix.states] : [];
    const actions = Array.isArray(matrix.actions) ? [...matrix.actions] : [];
    const cellsObj = matrix.cells || {};
    const cells = states.map((stateName) => {
      const row = Array.isArray(cellsObj[stateName]) ? cellsObj[stateName] : [];
      return actions.map((_, idx) => row[idx] != null ? String(row[idx]) : '');
    });
    const legend = Object.entries(matrix.legend || {}).map(([key, value]) => ({
      key: String(key),
      value: value != null ? String(value) : '',
    }));
    return { states, actions, cells, legend };
  }

  function normalizeTransitions(unit) {
    return Array.isArray(unit.state_transitions)
      ? unit.state_transitions.map((item) => ({
        from: item && item.from ? String(item.from) : '',
        trigger: item && item.trigger ? String(item.trigger) : '',
        to: item && item.to ? String(item.to) : '',
        effect: item && item.effect ? String(item.effect) : '',
      }))
      : [];
  }

  function extractExtraJson(unit) {
    const extras = {};
    Object.keys(unit || {}).forEach((key) => {
      if (!EXPLICIT_UNIT_KEYS.includes(key)) {
        extras[key] = deepClone(unit[key]);
      }
    });
    return extras;
  }

  function toCircledNumber(num) {
    const map = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
    return map[num] || `#${num}`;
  }

  function createEmptyUnitTemplate() {
    const nextIndex = Array.isArray(state.spec && state.spec.units) ? state.spec.units.length + 1 : 1;
    const defaultTitle = `新标注单元${nextIndex}`;
    return {
      id: autoGenerateUnitId(defaultTitle),
      index: toCircledNumber(nextIndex),
      short_index: String(nextIndex),
      title: defaultTitle,
      subtitle: '',
      anchor_selector: '',
      binding_target_label: '',
      node_class: '',
      aria_label: '',
      badge_offset_x: null,
      badge_offset_y: null,
      visibility_condition: '',
      visibility_condition_desc: '',
      purpose: '',
      rules: [],
      field_columns: [],
      fields: [],
      footnote: '',
    };
  }

  function ensureMatrixShape() {
    while (editorMatrix.cells.length < editorMatrix.states.length) {
      editorMatrix.cells.push(Array(editorMatrix.actions.length).fill(''));
    }
    editorMatrix.cells = editorMatrix.cells.slice(0, editorMatrix.states.length);
    editorMatrix.cells = editorMatrix.cells.map((row) => {
      const next = Array.isArray(row) ? [...row] : [];
      while (next.length < editorMatrix.actions.length) next.push('');
      return next.slice(0, editorMatrix.actions.length);
    });
  }

  function getEditorInput(name) {
    return els.editorForm ? els.editorForm.querySelector(`[name="${name}"]`) : null;
  }

  function populateBasicFields(unit) {
    ['id', 'index', 'short_index', 'title', 'subtitle', 'anchor_selector', 'node_class', 'aria_label', 'badge_offset_x', 'badge_offset_y', 'visibility_condition', 'visibility_condition_desc', 'purpose', 'footnote']
      .forEach((key) => {
        const input = getEditorInput(key);
        if (input) input.value = unit[key] == null ? '' : unit[key];
      });
    const bindingTargetInput = getEditorInput('binding_target_label');
    if (bindingTargetInput) {
      bindingTargetInput.value = unit.binding_target_label || unit.anchor_selector || '';
    }

    const idInput = getEditorInput('id');
    if (idInput) {
      idInput.disabled = true;
      idInput.readOnly = true;
      idInput.classList.add('annotation-form-input-readonly');
    }
  }

  function renderRulesList() {
    const container = document.getElementById('annotationRulesList');
    if (!container) return;
    if (!editorRules.length) {
      container.innerHTML = '<div class="annotation-empty-state">当前还没有规则，点击下方按钮新增。</div>';
      return;
    }

    container.innerHTML = editorRules.map((rule, index) => `
      <div class="annotation-rule-card" data-priority="${escapeHtml(rule.priority || 'P1')}">
        <div class="annotation-rule-card-left">
          <select class="annotation-rule-priority-select" data-role="rule-priority" data-index="${index}">
            <option value="P0" ${rule.priority === 'P0' ? 'selected' : ''}>P0（核心必做）</option>
            <option value="P1" ${rule.priority === 'P1' ? 'selected' : ''}>P1（重要推荐）</option>
            <option value="P2" ${rule.priority === 'P2' ? 'selected' : ''}>P2（可选优化）</option>
          </select>
        </div>
        <div class="annotation-rule-card-right">
          <textarea class="annotation-rule-textarea" data-role="rule-text" data-index="${index}" rows="2" placeholder="请输入规则内容">${escapeHtml(rule.text || '')}</textarea>
        </div>
        <div class="annotation-inline-actions">
          <button type="button" class="annotation-icon-btn" data-action="rule-up" data-index="${index}" title="上移">↑</button>
          <button type="button" class="annotation-icon-btn" data-action="rule-down" data-index="${index}" title="下移">↓</button>
          <button type="button" class="annotation-icon-btn danger" data-action="rule-delete" data-index="${index}" title="删除">×</button>
        </div>
      </div>
    `).join('');
  }

  function renderFieldsEditor() {
    const container = document.getElementById('annotationFieldsEditor');
    if (!container) return;
    if (!editorFieldColumns.length) {
      container.innerHTML = '<div class="annotation-empty-state">当前没有字段规则表。如果这个标注单元只是讲概念或规则，可以先不填；只有需要列出字段时再新增列和行。</div>';
      return;
    }

    const thead = `
      <thead>
        <tr>
          <th style="width:64px">#</th>
          ${editorFieldColumns.map((col, index) => `
            <th>
              <div class="annotation-table-header-editor">
                <input class="annotation-table-input annotation-table-input-header" data-role="field-column-name" data-index="${index}" value="${escapeHtml(col)}" placeholder="列名" />
                <div class="annotation-inline-actions">
                  <button type="button" class="annotation-icon-btn" data-action="field-column-left" data-index="${index}" title="左移">←</button>
                  <button type="button" class="annotation-icon-btn" data-action="field-column-right" data-index="${index}" title="右移">→</button>
                  <button type="button" class="annotation-icon-btn danger" data-action="field-column-delete" data-index="${index}" title="删除列">×</button>
                </div>
              </div>
            </th>
          `).join('')}
          <th style="width:120px">行操作</th>
        </tr>
      </thead>
    `;

    const tbody = editorFieldRows.map((row, rowIndex) => `
      <tr>
        <td class="annotation-table-index">${rowIndex + 1}</td>
        ${editorFieldColumns.map((_, colIndex) => `
          <td>
            <textarea class="annotation-table-textarea" data-role="field-cell" data-row-index="${rowIndex}" data-col-index="${colIndex}" rows="2">${escapeHtml(row[colIndex] || '')}</textarea>
          </td>
        `).join('')}
        <td>
          <div class="annotation-inline-actions">
            <button type="button" class="annotation-icon-btn" data-action="field-row-up" data-index="${rowIndex}" title="上移">↑</button>
            <button type="button" class="annotation-icon-btn" data-action="field-row-down" data-index="${rowIndex}" title="下移">↓</button>
            <button type="button" class="annotation-icon-btn danger" data-action="field-row-delete" data-index="${rowIndex}" title="删除行">×</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="annotation-table-wrap">
        <table class="annotation-edit-table">${thead}<tbody>${tbody}</tbody></table>
      </div>
    `;
  }

  function renderMatrixEditor() {
    const statesContainer = document.getElementById('annotationMatrixStates');
    const actionsContainer = document.getElementById('annotationMatrixActions');
    const tableContainer = document.getElementById('annotationMatrixTable');
    const legendContainer = document.getElementById('annotationMatrixLegend');
    if (!statesContainer || !actionsContainer || !tableContainer || !legendContainer) return;

    statesContainer.innerHTML = editorMatrix.states.length
      ? editorMatrix.states.map((stateName, index) => `
        <div class="annotation-chip-editor">
          <input class="annotation-chip-input" data-role="matrix-state-name" data-index="${index}" value="${escapeHtml(stateName)}" placeholder="状态名" />
          <div class="annotation-inline-actions">
            <button type="button" class="annotation-icon-btn" data-action="matrix-state-left" data-index="${index}" title="左移">←</button>
            <button type="button" class="annotation-icon-btn" data-action="matrix-state-right" data-index="${index}" title="右移">→</button>
            <button type="button" class="annotation-icon-btn danger" data-action="matrix-state-delete" data-index="${index}" title="删除状态">×</button>
          </div>
        </div>
      `).join('')
      : '<div class="annotation-empty-state inline">当前没有状态。只有需要描述“状态和动作关系”时才需要新增。</div>';

    actionsContainer.innerHTML = editorMatrix.actions.length
      ? editorMatrix.actions.map((actionName, index) => `
        <div class="annotation-chip-editor">
          <input class="annotation-chip-input" data-role="matrix-action-name" data-index="${index}" value="${escapeHtml(actionName)}" placeholder="动作名" />
          <div class="annotation-inline-actions">
            <button type="button" class="annotation-icon-btn" data-action="matrix-action-left" data-index="${index}" title="左移">←</button>
            <button type="button" class="annotation-icon-btn" data-action="matrix-action-right" data-index="${index}" title="右移">→</button>
            <button type="button" class="annotation-icon-btn danger" data-action="matrix-action-delete" data-index="${index}" title="删除动作">×</button>
          </div>
        </div>
      `).join('')
      : '<div class="annotation-empty-state inline">当前没有动作。只有需要描述“状态和动作关系”时才需要新增。</div>';

    if (editorMatrix.states.length && editorMatrix.actions.length) {
      const thead = `
        <thead>
          <tr>
            <th style="width:180px">状态 \\ 动作</th>
            ${editorMatrix.actions.map((actionName) => `<th>${escapeHtml(actionName || '未命名动作')}</th>`).join('')}
          </tr>
        </thead>
      `;
      const tbody = editorMatrix.states.map((stateName, rowIndex) => `
        <tr>
          <th>${escapeHtml(stateName || '未命名状态')}</th>
          ${editorMatrix.actions.map((_, colIndex) => `
            <td>
              <input class="annotation-table-input" list="annotationMatrixCellOptions" data-role="matrix-cell" data-row-index="${rowIndex}" data-col-index="${colIndex}" value="${escapeHtml((editorMatrix.cells[rowIndex] || [])[colIndex] || '')}" placeholder="可点 / 禁用 / 不展示" />
            </td>
          `).join('')}
        </tr>
      `).join('');
      tableContainer.innerHTML = `<div class="annotation-table-wrap"><table class="annotation-edit-table annotation-matrix-edit-table">${thead}<tbody>${tbody}</tbody></table></div>`;
    } else {
      tableContainer.innerHTML = '<div class="annotation-empty-state">这块当前为空，说明这个标注单元暂时不需要状态矩阵。只有补了状态和动作后，才会出现可编辑的矩阵表格。</div>';
    }

    legendContainer.innerHTML = `
      <div class="annotation-subsection-title">矩阵说明（legend）</div>
      <div class="annotation-kv-list">
        ${editorMatrix.legend.length ? editorMatrix.legend.map((item, index) => `
          <div class="annotation-kv-row">
            <input class="annotation-form-input" data-role="legend-key" data-index="${index}" value="${escapeHtml(item.key || '')}" placeholder="键，如：可点" />
            <input class="annotation-form-input" data-role="legend-value" data-index="${index}" value="${escapeHtml(item.value || '')}" placeholder="说明，如：按钮展示且可点击" />
            <button type="button" class="annotation-icon-btn danger" data-action="legend-delete" data-index="${index}" title="删除">×</button>
          </div>
        `).join('') : '<div class="annotation-empty-state inline">当前没有说明项。需要补充“可点/禁用/不展示”这类解释时再新增即可。</div>'}
      </div>
    `;
  }

  function renderTransitionsEditor() {
    const container = document.getElementById('annotationTransitionsList');
    if (!container) return;
    if (!editorTransitions.length) {
      container.innerHTML = '<div class="annotation-empty-state">当前没有状态流转。这并不代表有问题，只是说明这个标注单元暂时不需要讲“状态怎么变化”。只有需要时再新增。</div>';
      return;
    }

    container.innerHTML = editorTransitions.map((item, index) => `
      <div class="annotation-transition-card">
        <div class="annotation-form-row">
          <div class="annotation-form-group annotation-form-group-half">
            <label class="annotation-form-label">当前状态</label>
            <input class="annotation-form-input" data-role="transition-from" data-index="${index}" value="${escapeHtml(item.from || '')}" placeholder="当前状态" />
          </div>
          <div class="annotation-form-group annotation-form-group-half">
            <label class="annotation-form-label">触发动作</label>
            <input class="annotation-form-input" data-role="transition-trigger" data-index="${index}" value="${escapeHtml(item.trigger || '')}" placeholder="触发动作" />
          </div>
        </div>
        <div class="annotation-form-row">
          <div class="annotation-form-group annotation-form-group-half">
            <label class="annotation-form-label">结果状态</label>
            <input class="annotation-form-input" data-role="transition-to" data-index="${index}" value="${escapeHtml(item.to || '')}" placeholder="结果状态" />
          </div>
          <div class="annotation-form-group annotation-form-group-half">
            <label class="annotation-form-label">联动说明</label>
            <input class="annotation-form-input" data-role="transition-effect" data-index="${index}" value="${escapeHtml(item.effect || '')}" placeholder="联动说明" />
          </div>
        </div>
        <div class="annotation-inline-actions align-end">
          <button type="button" class="annotation-icon-btn" data-action="transition-up" data-index="${index}" title="上移">↑</button>
          <button type="button" class="annotation-icon-btn" data-action="transition-down" data-index="${index}" title="下移">↓</button>
          <button type="button" class="annotation-icon-btn danger" data-action="transition-delete" data-index="${index}" title="删除">×</button>
        </div>
      </div>
    `).join('');
  }

  function renderAdvancedJsonEditor() {
    const textarea = document.getElementById('annotationAdvancedJson');
    if (!textarea) return;
    textarea.value = Object.keys(editorExtraJson).length ? JSON.stringify(editorExtraJson, null, 2) : '{}';
  }

  function renderEditorMeta() {
    const meta = document.getElementById('annotationEditorUnitMeta');
    if (!meta) return;
    const total = state.spec && Array.isArray(state.spec.units) ? state.spec.units.length : 0;
    if (editorContext.isNew) {
      meta.textContent = `新建模式 · 保存后会插入标注单元列表末尾。当前已存在 ${total} 个单元。`;
      return;
    }
    meta.textContent = `当前编辑第 ${editorContext.originalIndex + 1} / ${total} 个标注单元。保存会直接写回 spec.yaml。`;
  }

  function renderAllEditorSections() {
    renderEditorMeta();
    renderRulesList();
    renderFieldsEditor();
    renderMatrixEditor();
    renderTransitionsEditor();
    renderAdvancedJsonEditor();
    updateEditorActionState();
  }

  function populateForm(unit) {
    const normalized = deepClone(unit || {});
    const fieldTable = normalizeFieldTable(normalized);

    populateBasicFields(normalized);
    editorRules = Array.isArray(normalized.rules) ? normalized.rules.map(normalizeRule) : [];
    editorFieldColumns = fieldTable.columns;
    editorFieldRows = fieldTable.rows;
    editorMatrix = normalizeMatrix(normalized);
    ensureMatrixShape();
    editorTransitions = normalizeTransitions(normalized);
    editorExtraJson = extractExtraJson(normalized);
    renderAllEditorSections();
  }

  function collectBasicUnitFromForm() {
    const getValue = (name) => {
      const input = getEditorInput(name);
      return input ? input.value.trim() : '';
    };
    const title = getValue('title');
    return {
      id: getValue('id') || autoGenerateUnitId(title),
      index: getValue('index'),
      short_index: getValue('short_index'),
      title,
      subtitle: getValue('subtitle'),
      anchor_selector: getValue('anchor_selector'),
      node_class: getValue('node_class'),
      aria_label: getValue('aria_label'),
      badge_offset_x: parseOptionalNumber(getValue('badge_offset_x')),
      badge_offset_y: parseOptionalNumber(getValue('badge_offset_y')),
      binding_target_label: getValue('binding_target_label'),
      visibility_condition: getValue('visibility_condition'),
      visibility_condition_desc: getValue('visibility_condition_desc'),
      purpose: getValue('purpose'),
      footnote: getValue('footnote'),
    };
  }

  function collectFieldsTable() {
    const columns = editorFieldColumns.map((item) => item.trim()).filter(Boolean);
    if (!columns.length) return { field_columns: [], fields: [] };
    const fields = editorFieldRows.map((row) => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index] != null ? String(row[index]).trim() : '';
      });
      return obj;
    });
    return { field_columns: columns, fields };
  }

  function collectStatusMatrix() {
    const states = editorMatrix.states.map((item) => item.trim()).filter(Boolean);
    const actions = editorMatrix.actions.map((item) => item.trim()).filter(Boolean);
    const legend = editorMatrix.legend
      .map((item) => ({ key: (item.key || '').trim(), value: (item.value || '').trim() }))
      .filter((item) => item.key && item.value);

    const hasContent = states.length || actions.length || legend.length || editorMatrix.cells.some((row) => row.some((cell) => String(cell || '').trim()));
    if (!hasContent) return null;

    const cells = {};
    states.forEach((stateName, rowIndex) => {
      cells[stateName] = actions.map((_, colIndex) => {
        const raw = ((editorMatrix.cells[rowIndex] || [])[colIndex] || '').trim();
        return raw;
      });
    });

    const matrix = { states, actions, cells };
    if (legend.length) {
      matrix.legend = legend.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    }
    return matrix;
  }

  function collectTransitions() {
    return editorTransitions
      .map((item) => compactObject({
        from: (item.from || '').trim(),
        trigger: (item.trigger || '').trim(),
        to: (item.to || '').trim(),
        effect: (item.effect || '').trim(),
      }))
      .filter((item) => Object.keys(item).length);
  }

  function collectAdvancedJsonExtras() {
    const textarea = document.getElementById('annotationAdvancedJson');
    const raw = textarea ? textarea.value.trim() : '';
    if (!raw) return { ok: true, value: {} };
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, error: '高级 JSON 兜底区必须填写 JSON 对象。' };
      }
      EXPLICIT_UNIT_KEYS.forEach((key) => {
        if (key in parsed) delete parsed[key];
      });
      return { ok: true, value: parsed };
    } catch (e) {
      return { ok: false, error: `高级 JSON 兜底区不是合法 JSON：${e.message}` };
    }
  }

  function validateUnitDraft(unit) {
    if (!unit.id) return '单元 ID 为必填项。';
    if (!unit.title) return '标题为必填项。';
    if (!unit.anchor_selector) return '请先点击“去页面上点选绑定”，再到页面上点一个要挂标注的区域。';

    const duplicate = (state.spec.units || []).find((item, index) => {
      if (editorContext.isNew) return item.id === unit.id;
      return index !== editorContext.originalIndex && item.id === unit.id;
    });
    if (duplicate) return `单元 ID "${unit.id}" 已存在，请改成唯一值。`;

    const trimmedColumns = editorFieldColumns.map((item) => item.trim()).filter(Boolean);
    const duplicateColumn = trimmedColumns.find((item, index) => trimmedColumns.indexOf(item) !== index);
    if (duplicateColumn) return `字段规则表的列名 "${duplicateColumn}" 重复，请调整。`;

    const matrix = collectStatusMatrix();
    if (matrix) {
      if (!matrix.states.length || !matrix.actions.length) {
        return '状态矩阵已启用时，状态和动作都至少要有一项。';
      }
      const dupState = matrix.states.find((item, index) => matrix.states.indexOf(item) !== index);
      if (dupState) return `状态矩阵里的状态 "${dupState}" 重复，请调整。`;
      const dupAction = matrix.actions.find((item, index) => matrix.actions.indexOf(item) !== index);
      if (dupAction) return `状态矩阵里的动作 "${dupAction}" 重复，请调整。`;
    }

    return '';
  }

  function cleanupUnit(unit) {
    const result = {};
    const orderedKeys = [
      'id', 'index', 'short_index', 'title', 'subtitle',
      'anchor_selector', 'node_class', 'aria_label', 'badge_offset_x', 'badge_offset_y',
      'visibility_condition', 'visibility_condition_desc',
      'purpose', 'rules', 'status_action_matrix',
      'state_transitions', 'field_columns', 'fields', 'footnote'
    ];

    orderedKeys.forEach((key) => {
      const value = unit[key];
      if (OPTIONAL_STRING_KEYS.includes(key) && !value) return;
      if ((key === 'badge_offset_x' || key === 'badge_offset_y') && (value == null || value === 0)) return;
      if ((key === 'rules' || key === 'state_transitions' || key === 'field_columns' || key === 'fields') && (!Array.isArray(value) || !value.length)) return;
      if (key === 'status_action_matrix' && (!value || !Array.isArray(value.states) || !value.states.length || !Array.isArray(value.actions) || !value.actions.length)) return;
      if (key === 'footnote' && !value) return;
      result[key] = value;
    });

    Object.entries(unit).forEach(([key, value]) => {
      if (!(key in result) && !EXPLICIT_UNIT_KEYS.includes(key)) {
        result[key] = value;
      }
    });

    return result;
  }

  function collectFormData() {
    const basic = collectBasicUnitFromForm();
    const extraJson = collectAdvancedJsonExtras();
    if (!extraJson.ok) return extraJson;

    const fieldTable = collectFieldsTable();
    const matrix = collectStatusMatrix();
    const transitions = collectTransitions();
    const validationError = validateUnitDraft(basic);
    if (validationError) return { ok: false, error: validationError };

    const nextUnit = {
      ...extraJson.value,
      ...basic,
    };
    delete nextUnit.binding_target_label;

    const rules = editorRules
      .map((rule) => ({
        priority: (rule.priority || 'P1').trim() || 'P1',
        text: (rule.text || '').trim(),
      }))
      .filter((rule) => rule.text);
    if (rules.length) nextUnit.rules = rules;

    if (matrix) nextUnit.status_action_matrix = matrix;
    if (transitions.length) nextUnit.state_transitions = transitions;
    if (fieldTable.field_columns.length) {
      nextUnit.field_columns = fieldTable.field_columns;
      nextUnit.fields = fieldTable.fields;
    }

    return { ok: true, value: cleanupUnit(nextUnit) };
  }

  function updateEditorActionState() {
    const moveUpBtn = document.getElementById('annotationEditorMoveUp');
    const moveDownBtn = document.getElementById('annotationEditorMoveDown');
    const deleteBtn = document.getElementById('annotationEditorDelete');
    const total = state.spec && Array.isArray(state.spec.units) ? state.spec.units.length : 0;
    const disabled = editorContext.isNew || editorContext.originalIndex < 0;
    if (moveUpBtn) moveUpBtn.disabled = disabled || editorContext.originalIndex <= 0;
    if (moveDownBtn) moveDownBtn.disabled = disabled || editorContext.originalIndex >= total - 1;
    if (deleteBtn) deleteBtn.disabled = disabled;
  }

  function openEditorByUnit(unit, context, statusText) {
    ensureEditor();
    ensureBindingModeHandler();
    ensurePositioningModeHandler();
    setBindingMode(false);
    setPositioningMode(false);
    editorContext = { ...editorContext, ...context };
    els.editorTitle.textContent = context.isNew ? '新建标注单元' : `编辑：${unit.title || unit.id}`;
    els.editorSubtitle.textContent = context.isNew
      ? '请先点页面区域完成绑定，再补充标题、规则等业务内容。'
      : `单元 ID：${unit.id}　·　保存后直接写回 spec.yaml`;
    populateForm(unit);
    setEditorStatus('muted', statusText || (context.isNew ? '请继续补充标题、规则等业务内容。' : '修改后点击保存，抽屉渲染会立即同步。'));
    setEditorFooterNote(getEditorFooterNote());
    state.editorOpen = true;
    els.editorMask.classList.add('show');
  }

  function openEditor() {
    if (!state.activeUnitId) {
      openCreateUnitEditor();
      return;
    }
    const unit = unitById(state.activeUnitId);
    if (!unit) return;
    const originalIndex = state.spec.units.findIndex((item) => item.id === unit.id);
    openEditorByUnit(deepClone(unit), {
      isNew: false,
      originalId: unit.id,
      originalIndex,
    });
  }

  function openCreateUnitEditor() {
    ensureBindingModeHandler();
    ensurePositioningModeHandler();
    if (els.editorMask) els.editorMask.classList.remove('show');
    state.editorOpen = false;
    const draft = createEmptyUnitTemplate();
    state.pendingUnitDraft = draft;
    state.pendingBindReason = '已选中页面区域，请继续填写这个新标注的内容。';
    setBindingMode(false);
    setBindingMode(true);
    if (els.drawerBody) {
      els.drawerBody.innerHTML = `
        <div class="annotation-summary-card">
          <strong>新增标注</strong>
          <p>请先回到页面上，直接点选你想挂角标的区域。选完后会自动弹出填写内容的窗口。</p>
        </div>
      `;
    }
  }

  function closeEditor() {
    setBindingMode(false);
    state.editorOpen = false;
    if (els.editorMask) els.editorMask.classList.remove('show');
  }

  function startToolbarBadgePositionAdjustment() {
    if (!state.spec || !Array.isArray(state.spec.units) || !state.spec.units.length) return false;
    ensurePositioningModeHandler();
    state.positioningScope = 'global';
    state.positioningRestoreEnabled = !!state.enabled;
    closeEditor();
    close();
    setBindingMode(false);
    clearPreviewBadgePosition();
    if (!state.enabled) enable();
    state.spec.units.forEach((unit) => {
      const liveNode = document.querySelector(`.annotation-node[data-annotation-id="${escapeSelectorValue(unit.id)}"]`);
      if (!liveNode) return;
      const current = resolveBadgePosition(unit);
      const livePosition = measureBadgePosition(liveNode);
      setPreviewBadgePosition(unit.id, current.x == null ? livePosition.x : current.x, current.y == null ? livePosition.y : current.y);
    });
    state.selectedPositioningUnitId = state.activeUnitId || ((state.spec.units[0] && state.spec.units[0].id) || '');
    setPositioningMode(true);
    syncAnnotationNodes();
    refresh();
    return true;
  }

  function startBadgePositionAdjustment() {
    console.log('[AnnotationCore] startBadgePositionAdjustment');
    if (editorContext.isNew) {
      console.log('[AnnotationCore] positioning blocked: isNew');
      setEditorStatus('warn', '新建标注请先保存一次，再调整角标位置。');
      return false;
    }
    const collected = collectFormData();
    if (!collected.ok) {
      console.log('[AnnotationCore] positioning blocked: collectFormData failed', collected.error);
      setEditorStatus('error', collected.error);
      return false;
    }
    const draft = deepClone(collected.value);
    draft.binding_target_label = getEditorInput('binding_target_label')?.value || '';
    const unitId = draft.id;
    const liveNode = document.querySelector(`.annotation-node[data-annotation-id="${escapeSelectorValue(unitId)}"]`);
    if (!liveNode) {
      console.log('[AnnotationCore] positioning blocked: live node missing', unitId);
      setEditorStatus('error', '当前还没有找到这个角标，请先确认页面里已经显示这个角标。');
      return false;
    }
    const livePosition = measureBadgePosition(liveNode);
    state.positioningScope = 'single';
    state.positioningRestoreEnabled = !!state.enabled;
    state.positioningDraft = draft;
    state.positioningReturnDraft = deepClone(draft);
    state.positioningContext = { ...editorContext };
    setPreviewBadgePosition(unitId, draft.badge_offset_x == null ? livePosition.x : draft.badge_offset_x, draft.badge_offset_y == null ? livePosition.y : draft.badge_offset_y);
    state.selectedPositioningUnitId = unitId;
    closeEditor();
    close();
    setBindingMode(false);
    setPositioningMode(true, unitId);
    console.log('[AnnotationCore] positioning mode entered', unitId);
    syncAnnotationNodes();
    refresh();
    if (els.drawerBody) {
      els.drawerBody.innerHTML = `
        <div class="annotation-summary-card">
          <strong>正在调整角标位置</strong>
          <p>请直接拖动页面上的角标圆点，到你觉得更顺眼的位置。拖完后点击顶部提示里的“完成位置调整”，会自动回到编辑窗口。</p>
        </div>
      `;
    }
    return true;
  }

  function finishBadgePositionAdjustment(cancelled = false) {
    if (!state.positioningMode) return;
    if (state.positioningScope === 'global') {
      finishToolbarBadgePositionAdjustment(cancelled);
      return;
    }
    const baseDraft = deepClone(state.positioningReturnDraft || state.positioningDraft || {});
    if (cancelled) {
      clearPreviewBadgePosition(state.positioningUnitId);
    } else {
      const preview = getPreviewBadgePosition(state.positioningUnitId);
      if (preview) {
        baseDraft.badge_offset_x = preview.x;
        baseDraft.badge_offset_y = preview.y;
      }
    }

    const nextContext = state.positioningContext || { ...editorContext };
    const statusText = cancelled
      ? '已取消本次角标位置调整。'
      : '角标位置已更新，请确认内容后保存。';

    setPositioningMode(false);
    state.positioningDraft = null;
    state.positioningReturnDraft = null;
    state.positioningContext = null;
    clearPreviewBadgePosition();
    syncAnnotationNodes();
    refresh();

    if (baseDraft && baseDraft.id) {
      openEditorByUnit(baseDraft, nextContext, statusText);
    }
  }

  async function finishToolbarBadgePositionAdjustment(cancelled = false) {
    const restoreEnabled = state.positioningRestoreEnabled;
    if (cancelled) {
      setPositioningMode(false);
      state.positioningScope = 'single';
      clearPreviewBadgePosition();
      syncAnnotationNodes();
      if (!restoreEnabled) disable(); else refresh();
      return;
    }

    if (!state.spec || !Array.isArray(state.spec.units)) {
      setPositioningMode(false);
      state.positioningScope = 'single';
      clearPreviewBadgePosition();
      refresh();
      return;
    }

    const nextSpec = deepClone(state.spec);
    nextSpec.meta = { ...(nextSpec.meta || {}), updated_at: todayIso() };
    nextSpec.units = (nextSpec.units || []).map((unit) => {
      const preview = getPreviewBadgePosition(unit.id);
      if (!preview) return unit;
      const nextUnit = { ...unit, badge_offset_x: preview.x, badge_offset_y: preview.y };
      return cleanupUnit(nextUnit);
    });

    const doneBtn = document.getElementById('annotationPositioningDoneBtn');
    if (doneBtn) doneBtn.disabled = true;
    try {
      await persistSpec(nextSpec);
      setPositioningMode(false);
      state.positioningScope = 'single';
      clearPreviewBadgePosition();
      syncAnnotationNodes();
      if (!restoreEnabled) disable(); else refresh();
    } catch (e) {
      console.error('[AnnotationCore] 角标位置保存失败：', e);
      const text = document.getElementById('annotationPositioningTipText');
      if (text) text.textContent = `保存失败：${e.message || '请稍后重试。'}`;
      return;
    } finally {
      if (doneBtn) doneBtn.disabled = false;
    }
  }

  function stashCurrentDraftForRebinding() {
    ensureBindingModeHandler();
    const collected = collectFormData();
    if (!collected.ok) {
      setEditorStatus('error', collected.error);
      return false;
    }
    state.pendingUnitDraft = deepClone(collected.value);
    state.pendingUnitDraft.binding_target_label = getEditorInput('binding_target_label')?.value || '';
    state.pendingBindReason = '已重新选择页面区域，请继续完成标注内容。';
    closeEditor();
    setBindingMode(true);
    if (els.drawerBody) {
      els.drawerBody.innerHTML = `
        <div class="annotation-summary-card">
          <strong>重新绑定页面区域</strong>
          <p>请直接在页面上点一个新的区域。选完后会自动回到填写窗口。</p>
        </div>
      `;
    }
    return true;
  }

  function setEditorStatus(tone, text) {
    if (!els.editorStatus) return;
    els.editorStatus.dataset.tone = tone || 'muted';
    els.editorStatus.textContent = text || '';
  }

  function setEditorFooterNote(text) {
    if (!els.editorFooterNote) return;
    els.editorFooterNote.textContent = text || '';
  }

  function getEditorFooterNote() {
    return editorContext.isNew
      ? '新建单元保存后会自动更新 spec.yaml，并尝试挂载新的页面标号。'
      : `已连接本地服务，可直接保存到 spec.yaml（单元：${editorContext.originalId || '—'}）。`;
  }

  async function persistSpec(nextSpec) {
    // 从 config.pageId 或当前 URL 路径推断页面目录名
    const pageId = config.pageId || detectPageIdFromUrl();
    const response = await fetch('/api/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pageId, spec: nextSpec }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.error || `保存失败（HTTP ${response.status}）`);
    }
    state.spec = nextSpec;
    state.specText = '';
  }

  /**
   * 从当前 URL 路径推断页面路径
   * 例如：
   * - http://localhost:3456/运输通道管理/current/page.html → "运输通道管理"
   * - http://localhost:3456/联运计划/管理页/current/page.html → "联运计划/管理页"
   */
  function detectPageIdFromUrl() {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const currentIndex = parts.lastIndexOf('current');
      if (currentIndex > 0) {
        return decodeURIComponent(parts.slice(0, currentIndex).join('/'));
      }
    } catch (_) {}
    return null;
  }

  async function saveCurrentUnit() {
    if (!state.spec || !Array.isArray(state.spec.units)) return;
    const collected = collectFormData();
    if (!collected.ok) {
      setEditorStatus('error', collected.error);
      return;
    }

    const nextSpec = deepClone(state.spec);
    nextSpec.meta = { ...(nextSpec.meta || {}), updated_at: todayIso() };
    if (!Array.isArray(nextSpec.units)) nextSpec.units = [];

    const unit = collected.value;
    if (editorContext.isNew) {
      nextSpec.units.push(unit);
    } else if (editorContext.originalIndex >= 0) {
      nextSpec.units[editorContext.originalIndex] = unit;
    } else {
      nextSpec.units.push(unit);
    }

    els.editorSave.disabled = true;
    setEditorStatus('muted', '正在保存到 spec.yaml ...');
    try {
      await persistSpec(nextSpec);
      state.activeUnitId = unit.id;
      editorContext = {
        isNew: false,
        originalId: unit.id,
        originalIndex: nextSpec.units.findIndex((item) => item.id === unit.id),
      };
      els.editorTitle.textContent = `编辑：${unit.title || unit.id}`;
      els.editorSubtitle.textContent = `单元 ID：${unit.id}　·　保存后直接写回 spec.yaml`;
      setEditorFooterNote(getEditorFooterNote());
      renderEditorMeta();
      if (state.enabled) open(unit.id);
      refresh();
      setEditorStatus('ok', '保存成功。');
      closeEditor();
    } catch (e) {
      console.error('[AnnotationCore] 保存失败：', e);
      setEditorStatus('error', e.message || '保存失败，请稍后重试。');
    } finally {
      els.editorSave.disabled = false;
    }
  }

  async function moveCurrentUnit(direction) {
    if (editorContext.isNew || editorContext.originalIndex < 0) return;
    const collected = collectFormData();
    if (!collected.ok) {
      setEditorStatus('error', collected.error);
      return;
    }
    const nextIndex = editorContext.originalIndex + direction;
    if (nextIndex < 0 || nextIndex >= state.spec.units.length) return;

    const nextSpec = deepClone(state.spec);
    nextSpec.meta = { ...(nextSpec.meta || {}), updated_at: todayIso() };
    nextSpec.units[editorContext.originalIndex] = collected.value;
    const [current] = nextSpec.units.splice(editorContext.originalIndex, 1);
    nextSpec.units.splice(nextIndex, 0, current);

    setEditorStatus('muted', '正在调整单元顺序 ...');
    try {
      await persistSpec(nextSpec);
      editorContext.originalIndex = nextIndex;
      state.activeUnitId = current.id;
      refresh();
      renderEditorMeta();
      updateEditorActionState();
      if (state.enabled) open(current.id);
      setEditorStatus('ok', '顺序调整成功。');
    } catch (e) {
      console.error('[AnnotationCore] 调整顺序失败：', e);
      setEditorStatus('error', e.message || '顺序调整失败。');
    }
  }

  async function deleteCurrentUnit() {
    if (editorContext.isNew) {
      closeEditor();
      return;
    }
    if (editorContext.originalIndex < 0) return;
    const unit = state.spec.units[editorContext.originalIndex];
    const confirmed = window.confirm(`确认删除标注单元“${unit.title || unit.id}”吗？删除后会立即写回 spec.yaml。`);
    if (!confirmed) return;

    const nextSpec = deepClone(state.spec);
    nextSpec.meta = { ...(nextSpec.meta || {}), updated_at: todayIso() };
    nextSpec.units.splice(editorContext.originalIndex, 1);

    setEditorStatus('muted', '正在删除标注单元 ...');
    try {
      await persistSpec(nextSpec);
      state.activeUnitId = null;
      closeEditor();
      close();
      refresh();
    } catch (e) {
      console.error('[AnnotationCore] 删除失败：', e);
      setEditorStatus('error', e.message || '删除失败。');
    }
  }

  function swapItems(list, from, to) {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function handleEditorClick(action, index) {
    switch (action) {
      case 'rule-add':
        editorRules.push({ priority: 'P1', text: '' });
        renderRulesList();
        return;
      case 'rule-delete':
        editorRules.splice(index, 1);
        renderRulesList();
        return;
      case 'rule-up':
        editorRules = swapItems(editorRules, index, index - 1);
        renderRulesList();
        return;
      case 'rule-down':
        editorRules = swapItems(editorRules, index, index + 1);
        renderRulesList();
        return;
      case 'field-column-add':
        editorFieldColumns.push(`新列${editorFieldColumns.length + 1}`);
        editorFieldRows = editorFieldRows.map((row) => [...row, '']);
        renderFieldsEditor();
        return;
      case 'field-column-delete':
        editorFieldColumns.splice(index, 1);
        editorFieldRows = editorFieldRows.map((row) => row.filter((_, colIndex) => colIndex !== index));
        renderFieldsEditor();
        return;
      case 'field-column-left':
        if (index <= 0) return;
        editorFieldColumns = swapItems(editorFieldColumns, index, index - 1);
        editorFieldRows = editorFieldRows.map((row) => swapItems(row, index, index - 1));
        renderFieldsEditor();
        return;
      case 'field-column-right':
        if (index >= editorFieldColumns.length - 1) return;
        editorFieldColumns = swapItems(editorFieldColumns, index, index + 1);
        editorFieldRows = editorFieldRows.map((row) => swapItems(row, index, index + 1));
        renderFieldsEditor();
        return;
      case 'field-row-add':
        editorFieldRows.push(Array(editorFieldColumns.length).fill(''));
        renderFieldsEditor();
        return;
      case 'field-row-delete':
        editorFieldRows.splice(index, 1);
        renderFieldsEditor();
        return;
      case 'field-row-up':
        editorFieldRows = swapItems(editorFieldRows, index, index - 1);
        renderFieldsEditor();
        return;
      case 'field-row-down':
        editorFieldRows = swapItems(editorFieldRows, index, index + 1);
        renderFieldsEditor();
        return;
      case 'matrix-add-state':
        editorMatrix.states.push(`状态${editorMatrix.states.length + 1}`);
        ensureMatrixShape();
        renderMatrixEditor();
        return;
      case 'matrix-add-action':
        editorMatrix.actions.push(`动作${editorMatrix.actions.length + 1}`);
        ensureMatrixShape();
        renderMatrixEditor();
        return;
      case 'matrix-state-delete':
        editorMatrix.states.splice(index, 1);
        editorMatrix.cells.splice(index, 1);
        renderMatrixEditor();
        return;
      case 'matrix-state-left':
        editorMatrix.states = swapItems(editorMatrix.states, index, index - 1);
        editorMatrix.cells = swapItems(editorMatrix.cells, index, index - 1);
        renderMatrixEditor();
        return;
      case 'matrix-state-right':
        editorMatrix.states = swapItems(editorMatrix.states, index, index + 1);
        editorMatrix.cells = swapItems(editorMatrix.cells, index, index + 1);
        renderMatrixEditor();
        return;
      case 'matrix-action-delete':
        editorMatrix.actions.splice(index, 1);
        editorMatrix.cells = editorMatrix.cells.map((row) => row.filter((_, colIndex) => colIndex !== index));
        renderMatrixEditor();
        return;
      case 'matrix-action-left':
        editorMatrix.actions = swapItems(editorMatrix.actions, index, index - 1);
        editorMatrix.cells = editorMatrix.cells.map((row) => swapItems(row, index, index - 1));
        renderMatrixEditor();
        return;
      case 'matrix-action-right':
        editorMatrix.actions = swapItems(editorMatrix.actions, index, index + 1);
        editorMatrix.cells = editorMatrix.cells.map((row) => swapItems(row, index, index + 1));
        renderMatrixEditor();
        return;
      case 'legend-add':
        editorMatrix.legend.push({ key: '', value: '' });
        renderMatrixEditor();
        return;
      case 'legend-delete':
        editorMatrix.legend.splice(index, 1);
        renderMatrixEditor();
        return;
      case 'transition-add':
        editorTransitions.push({ from: '', trigger: '', to: '', effect: '' });
        renderTransitionsEditor();
        return;
      case 'transition-delete':
        editorTransitions.splice(index, 1);
        renderTransitionsEditor();
        return;
      case 'transition-up':
        editorTransitions = swapItems(editorTransitions, index, index - 1);
        renderTransitionsEditor();
        return;
      case 'transition-down':
        editorTransitions = swapItems(editorTransitions, index, index + 1);
        renderTransitionsEditor();
        return;
      default:
        break;
    }
  }

  function handleEditorInput(target) {
    if (!target || !target.dataset) return;
    const index = Number(target.dataset.index);
    const rowIndex = Number(target.dataset.rowIndex);
    const colIndex = Number(target.dataset.colIndex);
    switch (target.dataset.role) {
      case 'rule-priority':
        editorRules[index].priority = target.value;
        renderRulesList();
        return;
      case 'rule-text':
        editorRules[index].text = target.value;
        return;
      case 'field-column-name':
        editorFieldColumns[index] = target.value;
        return;
      case 'field-cell':
        if (!editorFieldRows[rowIndex]) editorFieldRows[rowIndex] = Array(editorFieldColumns.length).fill('');
        editorFieldRows[rowIndex][colIndex] = target.value;
        return;
      case 'matrix-state-name':
        editorMatrix.states[index] = target.value;
        return;
      case 'matrix-action-name':
        editorMatrix.actions[index] = target.value;
        return;
      case 'matrix-cell':
        ensureMatrixShape();
        editorMatrix.cells[rowIndex][colIndex] = target.value;
        return;
      case 'legend-key':
        editorMatrix.legend[index].key = target.value;
        return;
      case 'legend-value':
        editorMatrix.legend[index].value = target.value;
        return;
      case 'transition-from':
        editorTransitions[index].from = target.value;
        return;
      case 'transition-trigger':
        editorTransitions[index].trigger = target.value;
        return;
      case 'transition-to':
        editorTransitions[index].to = target.value;
        return;
      case 'transition-effect':
        editorTransitions[index].effect = target.value;
        return;
      case 'title': {
        if (!editorContext.isNew) return;
        const idInput = getEditorInput('id');
        if (idInput) idInput.value = autoGenerateUnitId(target.value);
        return;
      }
      default:
        break;
    }
  }

  function todayIso() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  /* annotation:edit-only end */

  /* ---------- 事件绑定 ------------------------------------------------- */

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const adjustBtn = e.target.closest('#annotationEditorAdjustBadge');
      if (!adjustBtn) return;
      console.log('[AnnotationCore] adjust badge button clicked');
      e.preventDefault();
      e.stopPropagation();
      startBadgePositionAdjustment();
    }, true);

    // 标号点击（全局委托）
    document.addEventListener('click', (e) => {
      if (state.bindingMode || state.positioningMode) return;
      const node = e.target.closest('[data-annotation-id]');
      if (!node) return;
      if (node.classList.contains('annotation-node') && node.classList.contains('hidden')) return;
      // 排除标号/DOM 上有 data-annotation-id 但不希望可点的
      if (!node.classList.contains('annotation-node')) return;
      e.stopPropagation();
      open(node.dataset.annotationId);
    });

    // 抽屉关闭
    if (els.drawerClose) els.drawerClose.onclick = close;
    if (els.drawerMask) {
      els.drawerMask.addEventListener('click', (e) => {
        if (e.target === els.drawerMask) close();
      });
    }

    // 工具条开关
    const toggleBtn = document.getElementById(config.toggleBtnId);
    if (toggleBtn) toggleBtn.onclick = toggle;

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (state.positioningMode) {
        finishBadgePositionAdjustment(true);
      } else if (state.editorOpen) {
        closeEditor();
      } else if (state.activeUnitId) {
        close();
      }
    });

    window.addEventListener('resize', syncDrawerWidthToViewport);

    /* annotation:edit-only start */
    // 只读模式下移除抽屉编辑按钮
    if (config.readOnly && els.drawerEditBtn) {
      els.drawerEditBtn.remove();
      els.drawerEditBtn = null;
    }
    // 编辑按钮
    if (els.drawerEditBtn) els.drawerEditBtn.onclick = openEditor;
    const editorEntryBtn = document.getElementById('toolbarAnnotationEditorBtn');
    if (editorEntryBtn) editorEntryBtn.onclick = openCreateUnitEditor;
    const toolbarPositionBtn = document.getElementById('toolbarAnnotationPositionBtn');
    if (toolbarPositionBtn) {
      toolbarPositionBtn.onclick = () => {
        if (state.positioningMode && state.positioningScope === 'global') {
          finishBadgePositionAdjustment(false);
          return;
        }
        startToolbarBadgePositionAdjustment();
      };
    }
    bindEditorSurfaceEvents();
    /* annotation:edit-only end */
  }

  /* ---------- 初始化 ---------------------------------------------------- */

  async function init(options = {}) {
    // 只读发布模式自动检测
    if (window.__PROTOTYPE_READ_ONLY__ && !options.hasOwnProperty('readOnly')) {
      config.readOnly = true;
    }
    Object.assign(config, options || {});
    state.drawerWidth = restoreDrawerWidth();

    // 挂抽屉 DOM
    ensureDrawer();

    // 编辑模式
    if (isEditModeUrl()) {
      document.body.classList.add('annotation-edit-enabled');
      try { ensureEditor(); } catch (_) {}
      ensureEditorEntryButton();
    }

    // 加载 js-yaml
    const yamlReady = await ensureYamlRuntime();
    if (!yamlReady) {
      console.error('[AnnotationCore] js-yaml 加载失败');
      setLoadError('原型标注加载失败：YAML 解析器未能加载。请使用 localhost 打开页面，或检查本地 annotation 资源是否完整。');
    }

    // 加载 spec.yaml
    try {
      const resp = await fetch(config.specUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      state.specText = await resp.text();
      if (!window.jsyaml) {
        throw new Error('YAML 解析器未就绪');
      }
      state.spec = window.jsyaml.load(state.specText);
      if (!state.spec || !Array.isArray(state.spec.units)) {
        throw new Error('spec.yaml 缺少 units 配置');
      }
    } catch (e) {
      console.error('[AnnotationCore] 加载 spec.yaml 失败：', e);
      setLoadError(`加载 spec.yaml 失败：${e.message || String(e)}。请确认页面通过 http(s) 服务器打开，并检查 spec.yaml 与 annotation 资源是否可访问。`);
    }

    bindEvents();
    if (config.readOnly && state.spec) {
      state.enabled = true;
    } else if ((isEditModeUrl() || isAnnotationAutoOpenUrl()) && state.spec) {
      state.enabled = true;
    }
    refresh();
    return state.spec;
  }

  window.AnnotationCore = {
    init,
    enable,
    disable,
    toggle,
    isEnabled: () => state.enabled,
    open,
    close,
    refresh,
    setUnitGate: (id, fn) => { config.unitGates[id] = fn; refresh(); },
    setGlobalGate: (fn) => { config.globalGate = fn; refresh(); },
    getSpec: () => state.spec,
  };
})();
