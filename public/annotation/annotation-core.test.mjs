import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

async function loadAnnotationCore() {
  const source = await readFile(new URL('./annotation-core.js', import.meta.url), 'utf8')
  const window = {
    getComputedStyle(element) {
      return element.computedStyle || { display: 'block', visibility: 'visible' }
    },
  }

  vm.runInNewContext(source, { window })
  return window.AnnotationCore
}

function createClassList(initialClasses) {
  const classes = new Set(initialClasses)
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    contains: (name) => classes.has(name),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
  }
}

function readZIndex(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))
  const value = rule?.[1].match(/z-index:\s*(\d+)/)?.[1]
  return value ? Number(value) : null
}

function createAnchor({
  connected = true,
  display = 'block',
  visibility = 'visible',
  rect = { width: 120, height: 40 },
  clientRectCount = 1,
} = {}) {
  return {
    isConnected: connected,
    computedStyle: { display, visibility },
    getBoundingClientRect: () => ({ top: 20, right: 140, bottom: 60, left: 20, ...rect }),
    getClientRects: () => ({ length: clientRectCount }),
  }
}

test('只有真正显示的页面区域才能承载角标', async () => {
  const core = await loadAnnotationCore()

  assert.equal(core.isAnchorRenderable(createAnchor()), true)
  assert.equal(core.isAnchorRenderable(createAnchor({ display: 'none', clientRectCount: 0 })), false)
  assert.equal(core.isAnchorRenderable(createAnchor({ visibility: 'hidden' })), false)
  assert.equal(core.isAnchorRenderable(createAnchor({ rect: { width: 0, height: 0 }, clientRectCount: 0 })), false)
  assert.equal(core.isAnchorRenderable(createAnchor({ connected: false })), false)
})

test('当前页面只对可见标注连续编号', async () => {
  const core = await loadAnnotationCore()
  const units = [{ id: 'entry' }, { id: 'bulk' }, { id: 'container' }, { id: 'publish' }]
  const visibleIds = new Set(['bulk', 'publish'])
  const result = core.buildVisibleIndexMap(units, unit => visibleIds.has(unit.id))

  assert.equal(JSON.stringify(result), JSON.stringify({ bulk: 1, publish: 2 }))
})

test('标注角标和工作区必须显示在业务抽屉之上', async () => {
  const css = await readFile(new URL('./annotation-core.css', import.meta.url), 'utf8')
  const overlayZIndex = readZIndex(css, '.annotation-overlay-root')
  const panelZIndex = readZIndex(css, '.annotation-overview-panel')

  assert.ok(overlayZIndex > 2000)
  assert.ok(panelZIndex > overlayZIndex)
})

test('单条标注可以一步关闭并收起工作区', async () => {
  const core = await loadAnnotationCore()
  const collapseButton = { textContent: '收起' }
  const panel = {
    classList: createClassList(['show', 'detail-mode']),
    querySelector: (selector) => selector === '#annotationOverviewCollapse' ? collapseButton : null,
  }

  core.collapseDetailPanel(panel)

  assert.equal(panel.classList.contains('detail-mode'), false)
  assert.equal(panel.classList.contains('collapsed'), true)
  assert.equal(collapseButton.textContent, '展开')
})
