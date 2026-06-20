import { easeCubicOut } from 'd3-ease'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX as createForceX,
  forceY as createForceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import { quadtree } from 'd3-quadtree'
import { scaleOrdinal } from 'd3-scale'
import { zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config'
import { getPostGraph } from '../lib/posts'
import type { GraphEdge, GraphNode } from '../lib/types'

const maxCanvasEdges = 4200
const denseGraphThreshold = 600
const massiveGraphThreshold = 6000
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
const categoryPalette = [
  '#2563eb',
  '#0f766e',
  '#c2410c',
  '#7c3aed',
  '#be123c',
  '#4d7c0f',
  '#0369a1',
  '#a16207',
  '#db2777',
  '#0891b2',
]

type CanvasGraphNode = GraphNode &
  SimulationNodeDatum & {
    color: string
    degree: number
    radius: number
  }

type CanvasGraphLink = SimulationLinkDatum<CanvasGraphNode> & {
  sourceSlug: string
  targetSlug: string
}

interface CanvasGraphCluster {
  name: string
  color: string
  totalCount: number
  visibleCount: number
  x: number
  y: number
}

interface PointerState {
  mode: 'drag-node' | 'pan'
  pointerId: number
  node?: CanvasGraphNode
  startClientX: number
  startClientY: number
  startTransform: ZoomTransform
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized,
    16
  )
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLinkNode(endpoint: CanvasGraphLink['source']) {
  return typeof endpoint === 'object' ? endpoint : undefined
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent | WheelEvent) {
  const rect = canvas.getBoundingClientRect()
  return [event.clientX - rect.left, event.clientY - rect.top] as [number, number]
}

function truncateTitle(title: string, limit = 18) {
  return title.length > limit ? `${title.slice(0, limit - 1)}...` : title
}

function getCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend: number
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const normalX = -dy / length
  const normalY = dx / length
  const cx = (x1 + x2) / 2 + normalX * bend
  const cy = (y1 + y2) / 2 + normalY * bend

  return { cx, cy }
}

function getQuadraticPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number
) {
  const oneMinusT = 1 - t
  return {
    x: oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cx + t * t * x2,
    y: oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cy + t * t * y2,
  }
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const chars = Array.from(text)
  const lines: string[] = []
  let line = ''

  for (const char of chars) {
    const next = `${line}${char}`
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line)
      line = char
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }

  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && lines.join('').length < chars.length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, lines[maxLines - 1].length - 1))}...`
  }

  return lines
}

function getCanvasNodeLimit(totalNodes: number) {
  if (totalNodes > 10000) return 1200
  if (totalNodes > massiveGraphThreshold) return 1400
  if (totalNodes > 2500) return 1600
  return 2200
}

function getCanvasEdgeLimit(totalEdges: number, totalNodes: number) {
  if (totalNodes > 10000) return Math.min(totalEdges, 3200)
  if (totalNodes > massiveGraphThreshold) return Math.min(totalEdges, 3600)
  return Math.min(totalEdges, maxCanvasEdges)
}

function formatCount(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function Graph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const resetViewRef = useRef<() => void>(() => undefined)
  const focusSelectedRef = useRef<() => void>(() => undefined)
  const selectedSlugRef = useRef('')
  const connectedSlugsRef = useRef<Set<string>>(new Set())

  const graph = useMemo(() => getPostGraph(), [])
  const [selectedSlug, setSelectedSlug] = useState<string>(() => graph.nodes[0]?.slug ?? '')
  const [graphQuery, setGraphQuery] = useState('')

  useEffect(() => {
    document.title = `图谱 · ${siteConfig.title}`
    return () => {
      document.title = siteConfig.title
    }
  }, [])

  const degreeBySlug = useMemo(() => {
    const map = new Map(graph.nodes.map((node) => [node.slug, 0]))
    for (const edge of graph.edges) {
      map.set(edge.source, (map.get(edge.source) ?? 0) + 1)
      map.set(edge.target, (map.get(edge.target) ?? 0) + 1)
    }
    return map
  }, [graph.edges, graph.nodes])

  const selected = graph.nodes.find((node) => node.slug === selectedSlug) ?? graph.nodes[0]
  const connectedSlugs = useMemo(() => {
    const slugs = new Set<string>()
    if (!selected) return slugs

    for (const edge of graph.edges) {
      if (edge.source === selected.slug) slugs.add(edge.target)
      if (edge.target === selected.slug) slugs.add(edge.source)
    }
    return slugs
  }, [graph.edges, selected])

  useEffect(() => {
    selectedSlugRef.current = selected?.slug ?? ''
    connectedSlugsRef.current = connectedSlugs
  }, [connectedSlugs, selected])

  const canvasNodeLimit = getCanvasNodeLimit(graph.nodes.length)
  const canvasEdgeLimit = getCanvasEdgeLimit(graph.edges.length, graph.nodes.length)
  const clusterCount = useMemo(
    () => new Set(graph.nodes.map((node) => node.category ?? '未分类')).size,
    [graph.nodes]
  )
  const visibilityAnchor = graph.nodes.length > canvasNodeLimit ? selectedSlug : ''
  const renderGraph = useMemo(() => {
    const publicSlugs = new Set(graph.nodes.map((node) => node.slug))
    const edgeScore = (edge: GraphEdge) =>
      (degreeBySlug.get(edge.source) ?? 0) * 1.5 + (degreeBySlug.get(edge.target) ?? 0)

    if (graph.nodes.length <= canvasNodeLimit) {
      const edges =
        graph.edges.length <= canvasEdgeLimit
          ? graph.edges
          : [...graph.edges].sort((a, b) => edgeScore(b) - edgeScore(a)).slice(0, canvasEdgeLimit)
      return {
        nodes: graph.nodes,
        edges,
        hiddenNodeCount: 0,
        hiddenEdgeCount: graph.edges.length - edges.length,
      }
    }

    const anchorSlugs = new Set<string>()
    if (visibilityAnchor) anchorSlugs.add(visibilityAnchor)
    for (const edge of graph.edges) {
      if (edge.source === visibilityAnchor) anchorSlugs.add(edge.target)
      if (edge.target === visibilityAnchor) anchorSlugs.add(edge.source)
    }

    const visibleNodes = [...graph.nodes]
      .sort((a, b) => {
        const aAnchor = anchorSlugs.has(a.slug) ? 1 : 0
        const bAnchor = anchorSlugs.has(b.slug) ? 1 : 0
        if (aAnchor !== bAnchor) return bAnchor - aAnchor
        return (degreeBySlug.get(b.slug) ?? 0) - (degreeBySlug.get(a.slug) ?? 0)
      })
      .slice(0, canvasNodeLimit)
    const visibleSlugs = new Set(visibleNodes.map((node) => node.slug))
    const visibleEdges = graph.edges
      .filter((edge) => visibleSlugs.has(edge.source) && visibleSlugs.has(edge.target))
      .sort((a, b) => {
        const aAnchor = Number(anchorSlugs.has(a.source) || anchorSlugs.has(a.target))
        const bAnchor = Number(anchorSlugs.has(b.source) || anchorSlugs.has(b.target))
        if (aAnchor !== bAnchor) return bAnchor - aAnchor
        return edgeScore(b) - edgeScore(a)
      })
      .slice(0, canvasEdgeLimit)

    return {
      nodes: visibleNodes.filter((node) => publicSlugs.has(node.slug)),
      edges: visibleEdges,
      hiddenNodeCount: graph.nodes.length - visibleNodes.length,
      hiddenEdgeCount: graph.edges.length - visibleEdges.length,
    }
  }, [canvasEdgeLimit, canvasNodeLimit, degreeBySlug, graph.edges, graph.nodes, visibilityAnchor])

  const searchResults = useMemo(() => {
    const query = graphQuery.trim().toLowerCase()
    if (!query) return []

    return graph.nodes
      .filter((node) => {
        const haystack = [node.title, node.slug, node.category, ...(node.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => (degreeBySlug.get(b.slug) ?? 0) - (degreeBySlug.get(a.slug) ?? 0))
      .slice(0, 8)
  }, [degreeBySlug, graph.nodes, graphQuery])

  const outgoing = selected
    ? graph.edges
        .filter((edge) => edge.source === selected.slug)
        .map((edge) => graph.nodes.find((node) => node.slug === edge.target))
        .filter((node): node is NonNullable<typeof node> => Boolean(node))
    : []
  const incoming = selected
    ? graph.edges
        .filter((edge) => edge.target === selected.slug)
        .map((edge) => graph.nodes.find((node) => node.slug === edge.source))
        .filter((node): node is NonNullable<typeof node> => Boolean(node))
    : []

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || renderGraph.nodes.length === 0) return

    const context = canvas.getContext('2d')
    if (!context) return

    const computedStyle = getComputedStyle(canvas)
    const textColor = computedStyle.getPropertyValue('--text').trim() || '#172033'
    const textSoftColor = computedStyle.getPropertyValue('--text-soft').trim() || '#526074'
    const accentColor = computedStyle.getPropertyValue('--accent').trim() || '#0f766e'
    const panelColor = computedStyle.getPropertyValue('--panel-strong').trim() || '#ffffff'
    const totalCategoryCounts = new Map<string, number>()
    for (const node of graph.nodes) {
      const category = node.category ?? '未分类'
      totalCategoryCounts.set(category, (totalCategoryCounts.get(category) ?? 0) + 1)
    }
    const visibleCategoryCounts = new Map<string, number>()
    for (const node of renderGraph.nodes) {
      const category = node.category ?? '未分类'
      visibleCategoryCounts.set(category, (visibleCategoryCounts.get(category) ?? 0) + 1)
    }
    const categories = [...totalCategoryCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .map(([category]) => category)
    const categoryIndexByName = new Map(categories.map((category, index) => [category, index]))
    const colorByCategory = scaleOrdinal<string, string>()
      .domain(categories)
      .range(categoryPalette)

    let width = Math.max(320, canvas.clientWidth || 760)
    let height = Math.max(320, canvas.clientHeight || 460)
    let transform = zoomIdentity
    let spatialIndex = quadtree<CanvasGraphNode>()
      .x((item) => item.x ?? width / 2)
      .y((item) => item.y ?? height / 2)
    let pointerState: PointerState | null = null
    let animationFrame = 0
    let hoveredNode: CanvasGraphNode | undefined
    const denseGraph = renderGraph.nodes.length > denseGraphThreshold
    const massiveGraph = graph.nodes.length > massiveGraphThreshold

    const getCategoryCenterByName = (category: string) => {
      if (categories.length <= 1) return { x: width / 2, y: height / 2 }
      const index = categoryIndexByName.get(category) ?? 0
      if (index === 0 && categories.length > 4) return { x: width / 2, y: height / 2 }

      const adjustedIndex = categories.length > 4 ? index - 1 : index
      const adjustedTotal = Math.max(1, categories.length > 4 ? categories.length - 1 : categories.length)
      const angle = -Math.PI / 2 + adjustedIndex * goldenAngle
      const radiusRatio = Math.sqrt((adjustedIndex + 1) / adjustedTotal)
      const radius = Math.min(width, height) * (denseGraph ? 0.12 + radiusRatio * 0.24 : 0.1 + radiusRatio * 0.18)
      return {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      }
    }

    const getCategoryCenter = (node: GraphNode) => getCategoryCenterByName(node.category ?? '未分类')

    const getClusters = (): CanvasGraphCluster[] => {
      return categories
        .map((category) => {
          const center = getCategoryCenterByName(category)
          const totalCount = totalCategoryCounts.get(category) ?? 0
          const visibleCount = visibleCategoryCounts.get(category) ?? 0
          return {
            name: category,
            color: colorByCategory(category),
            totalCount,
            visibleCount,
            x: center.x,
            y: center.y,
          }
        })
        .filter((cluster) => cluster.visibleCount > 0)
    }

    const visibleCategoryIndexes = new Map<string, number>()
    const nodes: CanvasGraphNode[] = renderGraph.nodes.map((node) => {
      const degree = degreeBySlug.get(node.slug) ?? 0
      const category = node.category ?? '未分类'
      const categoryIndex = visibleCategoryIndexes.get(category) ?? 0
      const categoryTotal = visibleCategoryCounts.get(category) ?? 1
      visibleCategoryIndexes.set(category, categoryIndex + 1)
      const center = getCategoryCenterByName(category)
      const angle = categoryIndex * goldenAngle
      const spread = Math.min(width, height) * (denseGraph ? 0.025 : 0.04)
        + Math.sqrt(categoryIndex + 1) * Math.min(denseGraph ? 4.2 : 8.2, Math.max(3, 48 / Math.sqrt(categoryTotal)))
      const radius = massiveGraph
        ? Math.min(3.1, 1.05 + Math.sqrt(degree + 1) * 0.34)
        : denseGraph
          ? Math.min(4.1, 1.25 + Math.sqrt(degree + 1) * 0.52)
          : Math.min(5.8, 1.7 + Math.sqrt(degree + 1) * 0.82)

      return {
        ...node,
        color: colorByCategory(node.category ?? '未分类'),
        degree,
        radius,
        x: center.x + Math.cos(angle) * spread,
        y: center.y + Math.sin(angle) * spread,
      }
    })
    const nodeBySlug = new Map(nodes.map((node) => [node.slug, node]))
    const links: CanvasGraphLink[] = renderGraph.edges
      .filter((edge) => nodeBySlug.has(edge.source) && nodeBySlug.has(edge.target))
      .map((edge) => ({ source: edge.source, target: edge.target, sourceSlug: edge.source, targetSlug: edge.target }))

    const forceX = createForceX<CanvasGraphNode>((item) => getCategoryCenter(item).x)
      .strength(denseGraph ? 0.13 : 0.08)
    const forceY = createForceY<CanvasGraphNode>((item) => getCategoryCenter(item).y)
      .strength(denseGraph ? 0.13 : 0.08)
    const simulation = forceSimulation<CanvasGraphNode>(nodes)
      .force(
        'link',
        forceLink<CanvasGraphNode, CanvasGraphLink>(links)
          .id((item) => item.slug)
          .distance((item) => {
            const sourceDegree = getLinkNode(item.source)?.degree ?? 0
            const targetDegree = getLinkNode(item.target)?.degree ?? 0
            return denseGraph ? Math.max(18, 46 - (sourceDegree + targetDegree) * 0.58) : 76
          })
          .strength(denseGraph ? 0.16 : 0.32)
      )
      .force('charge', forceManyBody<CanvasGraphNode>().strength(denseGraph ? -10 : -52))
      .force('center', forceCenter<CanvasGraphNode>(width / 2, height / 2))
      .force('cluster-x', forceX)
      .force('cluster-y', forceY)
      .force(
        'collide',
        forceCollide<CanvasGraphNode>().radius((item) => item.radius + (denseGraph ? 1.4 : 7))
      )
      .alphaDecay(denseGraph ? 0.06 : 0.028)
      .velocityDecay(denseGraph ? 0.48 : 0.42)
      .on('tick', () => {
        for (const item of nodes) {
          item.x = clamp(item.x ?? width / 2, item.radius + 2, width - item.radius - 2)
          item.y = clamp(item.y ?? height / 2, item.radius + 2, height - item.radius - 2)
        }
        spatialIndex = quadtree<CanvasGraphNode>()
          .x((item) => item.x ?? width / 2)
          .y((item) => item.y ?? height / 2)
          .addAll(nodes)
      })

    const findNode = (screenX: number, screenY: number) => {
      const [worldX, worldY] = transform.invert([screenX, screenY])
      const hitRadius = Math.max(9 / transform.k, denseGraph ? 4.5 : 7)
      const node = spatialIndex.find(worldX, worldY, hitRadius)
      if (!node) return undefined

      const dx = worldX - (node.x ?? 0)
      const dy = worldY - (node.y ?? 0)
      return Math.hypot(dx, dy) <= node.radius + hitRadius ? node : undefined
    }

    const resizeCanvas = () => {
      const nextWidth = Math.max(320, canvas.clientWidth || 760)
      const nextHeight = Math.max(320, canvas.clientHeight || 460)
      const pixelRatio = window.devicePixelRatio || 1
      width = nextWidth
      height = nextHeight
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      simulation.force('center', forceCenter<CanvasGraphNode>(width / 2, height / 2))
      forceX.x((item) => getCategoryCenter(item).x)
      forceY.y((item) => getCategoryCenter(item).y)
      simulation.alpha(0.22).restart()
    }

    const fitToGraph = (animated = false) => {
      const bounds = nodes.reduce(
        (box, node) => ({
          minX: Math.min(box.minX, node.x ?? width / 2),
          minY: Math.min(box.minY, node.y ?? height / 2),
          maxX: Math.max(box.maxX, node.x ?? width / 2),
          maxY: Math.max(box.maxY, node.y ?? height / 2),
        }),
        { minX: width, minY: height, maxX: 0, maxY: 0 }
      )
      for (const cluster of getClusters()) {
        const labelPadding = denseGraph ? 46 : 58
        bounds.minX = Math.min(bounds.minX, cluster.x - labelPadding)
        bounds.minY = Math.min(bounds.minY, cluster.y - labelPadding)
        bounds.maxX = Math.max(bounds.maxX, cluster.x + labelPadding)
        bounds.maxY = Math.max(bounds.maxY, cluster.y + labelPadding)
      }
      const graphWidth = Math.max(1, bounds.maxX - bounds.minX)
      const graphHeight = Math.max(1, bounds.maxY - bounds.minY)
      const scale = clamp(Math.min(width / graphWidth, height / graphHeight) * 0.78, 0.58, 1.9)
      const next = zoomIdentity
        .translate(width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale, height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale)
        .scale(scale)

      if (!animated) {
        transform = next
        return
      }

      const from = transform
      const startedAt = performance.now()
      const duration = 360
      const animate = () => {
        const progress = clamp((performance.now() - startedAt) / duration, 0, 1)
        const eased = easeCubicOut(progress)
        transform = zoomIdentity
          .translate(from.x + (next.x - from.x) * eased, from.y + (next.y - from.y) * eased)
          .scale(from.k + (next.k - from.k) * eased)
        if (progress < 1) requestAnimationFrame(animate)
      }
      animate()
    }

    resetViewRef.current = () => fitToGraph(true)
    focusSelectedRef.current = () => {
      const node = selectedSlugRef.current ? nodeBySlug.get(selectedSlugRef.current) : undefined
      if (!node) {
        fitToGraph(true)
        return
      }
      const scale = clamp(Math.max(transform.k, denseGraph ? 2.05 : 1.45), 0.8, 4.2)
      const next = zoomIdentity
        .translate(width / 2 - (node.x ?? width / 2) * scale, height / 2 - (node.y ?? height / 2) * scale)
        .scale(scale)
      const from = transform
      const startedAt = performance.now()
      const duration = 360
      const animate = () => {
        const progress = clamp((performance.now() - startedAt) / duration, 0, 1)
        const eased = easeCubicOut(progress)
        transform = zoomIdentity
          .translate(from.x + (next.x - from.x) * eased, from.y + (next.y - from.y) * eased)
          .scale(from.k + (next.k - from.k) * eased)
        if (progress < 1) requestAnimationFrame(animate)
      }
      animate()
    }

    const getLinkPosition = (link: CanvasGraphLink) => {
      const source = getLinkNode(link.source)
      const target = getLinkNode(link.target)
      const sourceX = source?.x ?? width / 2
      const sourceY = source?.y ?? height / 2
      const targetX = target?.x ?? width / 2
      const targetY = target?.y ?? height / 2
      const dx = targetX - sourceX
      const dy = targetY - sourceY
      const length = Math.hypot(dx, dy) || 1
      const sourceOffset = (source?.radius ?? 0) + 1.5
      const targetOffset = (target?.radius ?? 0) + 2.5

      return {
        x1: sourceX + (dx / length) * sourceOffset,
        y1: sourceY + (dy / length) * sourceOffset,
        x2: targetX - (dx / length) * targetOffset,
        y2: targetY - (dy / length) * targetOffset,
      }
    }

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, alpha: number) => {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const size = denseGraph ? 3.6 : 4.8
      context.save()
      context.translate(x2, y2)
      context.rotate(angle)
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(-size, -size * 0.5)
      context.lineTo(-size, size * 0.5)
      context.closePath()
      context.fillStyle = color.startsWith('#') ? hexToRgba(color, alpha) : color
      context.fill()
      context.restore()
    }

    const drawCategoryGuides = (
      clusters: CanvasGraphCluster[],
      selectedCategory: string | undefined,
      time: number
    ) => {
      const clusterByName = new Map(clusters.map((cluster) => [cluster.name, cluster]))

      context.save()
      context.lineCap = 'round'

      for (const node of nodes) {
        const category = node.category ?? '未分类'
        const cluster = clusterByName.get(category)
        if (!cluster) continue

        const active = selectedCategory === category
        const selectedSlug = selectedSlugRef.current
        const locallyRelevant =
          !selectedSlug ||
          node.slug === selectedSlug ||
          connectedSlugsRef.current.has(node.slug) ||
          active
        const alpha = denseGraph
          ? locallyRelevant ? 0.28 : 0.1
          : locallyRelevant ? 0.36 : 0.18
        const startX = cluster.x
        const startY = cluster.y
        const endX = node.x ?? cluster.x
        const endY = node.y ?? cluster.y
        const curveBend = (active ? 18 : 12) / transform.k
        const { cx, cy } = getCurvedPath(startX, startY, endX, endY, curveBend)

        context.beginPath()
        context.moveTo(startX, startY)
        context.quadraticCurveTo(cx, cy, endX, endY)
        context.strokeStyle = hexToRgba(cluster.color, alpha)
        context.lineWidth = Math.max(0.85, (active ? 1.45 : 1.05) / transform.k)
        context.stroke()

        if (locallyRelevant || !denseGraph) {
          const t = (time / 1800 + (node.index ?? 0) * 0.19) % 1
          const point = getQuadraticPoint(startX, startY, cx, cy, endX, endY, t)
          context.beginPath()
          context.arc(
            point.x,
            point.y,
            Math.max(1.1, 1.8 / transform.k),
            0,
            Math.PI * 2
          )
          context.fillStyle = hexToRgba(cluster.color, active ? 0.72 : 0.48)
          context.fill()
        }
      }

      context.restore()
    }

    const drawClusters = (clusters: CanvasGraphCluster[], selectedCategory?: string) => {
      const labelVisible = !denseGraph || transform.k > 0.72 || clusters.length <= 6

      for (const cluster of clusters) {
        const active = selectedCategory === cluster.name
        const hubRadius = active ? 7.2 : 5.2

        context.save()
        context.beginPath()
        context.arc(cluster.x, cluster.y, hubRadius + 8 / transform.k, 0, Math.PI * 2)
        context.strokeStyle = hexToRgba(cluster.color, active ? 0.42 : 0.22)
        context.lineWidth = Math.max(0.8, 1 / transform.k)
        context.stroke()

        context.beginPath()
        context.arc(cluster.x, cluster.y, hubRadius, 0, Math.PI * 2)
        context.fillStyle = hexToRgba(cluster.color, active ? 0.92 : 0.68)
        context.fill()

        if (labelVisible) {
          const label = `${truncateTitle(cluster.name, 12)} · ${formatCount(cluster.totalCount)}`
          const labelWidth = Math.min(
            128 / transform.k,
            context.measureText(label).width + 16 / transform.k
          )
          const labelHeight = 22 / transform.k
          const x = cluster.x - labelWidth / 2
          const y = cluster.y - hubRadius - 30 / transform.k

          context.fillStyle = panelColor
          context.strokeStyle = hexToRgba(cluster.color, active ? 0.46 : 0.26)
          context.lineWidth = Math.max(0.7, 0.85 / transform.k)
          context.beginPath()
          context.roundRect(x, y, labelWidth, labelHeight, 6 / transform.k)
          context.fill()
          context.stroke()

          context.font = `700 ${(active ? 10.5 : 9) / transform.k}px var(--font-sans)`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.lineJoin = 'round'
          context.fillStyle = active ? textColor : textSoftColor
          context.fillText(label, cluster.x, y + labelHeight / 2)
        }
        context.restore()
      }
    }

    const drawNodeTooltip = (node?: CanvasGraphNode) => {
      if (!node) return

      const [screenX, screenY] = transform.apply([node.x ?? width / 2, node.y ?? height / 2])
      const maxWidth = Math.min(240, width - 28)
      const paddingX = 10
      const paddingY = 8
      const lineHeight = 16

      context.save()
      context.font = '700 12px var(--font-sans)'
      const lines = wrapCanvasText(context, node.title, maxWidth - paddingX * 2, 2)
      const labelWidth = Math.min(
        maxWidth,
        Math.max(...lines.map((line) => context.measureText(line).width), 42) + paddingX * 2
      )
      const labelHeight = lines.length * lineHeight + paddingY * 2
      const pointerGap = 13
      let x = screenX + pointerGap
      let y = screenY - labelHeight - pointerGap

      if (x + labelWidth > width - 10) x = screenX - labelWidth - pointerGap
      if (x < 10) x = 10
      if (y < 10) y = screenY + pointerGap
      if (y + labelHeight > height - 10) y = height - labelHeight - 10

      context.shadowBlur = 18
      context.shadowColor = hexToRgba(node.color, 0.24)
      context.fillStyle = panelColor
      context.strokeStyle = hexToRgba(node.color, 0.48)
      context.lineWidth = 1
      context.beginPath()
      context.roundRect(x, y, labelWidth, labelHeight, 7)
      context.fill()
      context.shadowBlur = 0
      context.stroke()

      context.fillStyle = textColor
      context.textAlign = 'left'
      context.textBaseline = 'top'
      lines.forEach((line, index) => {
        context.fillText(line, x + paddingX, y + paddingY + index * lineHeight)
      })
      context.restore()
    }

    const draw = (time: number) => {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.restore()

      const selectedSlug = selectedSlugRef.current
      const connected = connectedSlugsRef.current

      context.save()
      context.translate(transform.x, transform.y)
      context.scale(transform.k, transform.k)
      context.lineCap = 'round'
      context.lineJoin = 'round'

      const selectedNode = selectedSlug ? nodeBySlug.get(selectedSlug) : undefined
      const clusters = getClusters()
      const selectedCategory = selectedNode ? selectedNode.category ?? '未分类' : undefined
      drawCategoryGuides(clusters, selectedCategory, time)
      drawClusters(clusters, selectedCategory)

      for (const link of links) {
        const source = getLinkNode(link.source)
        const target = getLinkNode(link.target)
        if (!source || !target) continue

        const active = Boolean(
          selectedSlug && (link.sourceSlug === selectedSlug || link.targetSlug === selectedSlug)
        )
        const adjacent = connected.has(link.sourceSlug) || connected.has(link.targetSlug)
        const { x1, y1, x2, y2 } = getLinkPosition(link)
        const bendDirection = link.sourceSlug < link.targetSlug ? 1 : -1
        const bend = (denseGraph ? 9 : 14) * bendDirection
        const { cx, cy } = getCurvedPath(x1, y1, x2, y2, bend)

        context.beginPath()
        context.moveTo(x1, y1)
        context.quadraticCurveTo(cx, cy, x2, y2)
        context.strokeStyle = active
          ? hexToRgba(target.color, 0.95)
          : hexToRgba(source.color, selectedSlug ? (adjacent ? 0.2 : 0.04) : 0.14)
        context.lineWidth = active ? 1.45 / transform.k : denseGraph ? 0.42 / transform.k : 0.72 / transform.k
        context.shadowBlur = active ? 10 / transform.k : 0
        context.shadowColor = active ? target.color : 'transparent'
        if (active) {
          context.setLineDash([6 / transform.k, 8 / transform.k])
          context.lineDashOffset = -time / 80 / transform.k
        }
        context.stroke()
        context.setLineDash([])

        if (active || (!denseGraph && links.length < 120)) {
          const arrowBase = getQuadraticPoint(x1, y1, cx, cy, x2, y2, 0.92)
          drawArrow(arrowBase.x, arrowBase.y, x2, y2, active ? target.color : source.color, active ? 0.9 : 0.38)
        }

        if (active) {
          const t = (time / 1050 + links.indexOf(link) * 0.11) % 1
          const pulse = getQuadraticPoint(x1, y1, cx, cy, x2, y2, t)
          context.beginPath()
          context.arc(pulse.x, pulse.y, Math.max(1.4, 2.6 / transform.k), 0, Math.PI * 2)
          context.fillStyle = hexToRgba(target.color, 0.95)
          context.shadowBlur = 10 / transform.k
          context.shadowColor = target.color
          context.fill()
        }
      }

      context.shadowBlur = 0
      for (const node of nodes) {
        const active = node.slug === selectedSlug
        const connected = connectedSlugsRef.current.has(node.slug)
        const dimmed = Boolean(selectedSlug && !active && !connected)
        const x = node.x ?? width / 2
        const y = node.y ?? height / 2
        const pulse = active ? Math.sin(time / 240) * 0.5 : 0
        const radius = node.radius + (active ? 1.35 + pulse : connected ? 0.7 : 0)

        if (active || connected || node === hoveredNode) {
          context.beginPath()
          context.arc(x, y, radius + (active ? 6 : 3.5), 0, Math.PI * 2)
          context.fillStyle = hexToRgba(node.color, active ? 0.14 : 0.08)
          context.fill()

          if (active) {
            const orbitRadius = radius + 8
            const orbitAngle = time / 620
            context.beginPath()
            context.arc(x, y, orbitRadius, 0, Math.PI * 2)
            context.strokeStyle = hexToRgba(node.color, 0.34)
            context.lineWidth = Math.max(0.7, 0.9 / transform.k)
            context.stroke()

            context.beginPath()
            context.arc(
              x + Math.cos(orbitAngle) * orbitRadius,
              y + Math.sin(orbitAngle) * orbitRadius,
              Math.max(1, 1.6 / transform.k),
              0,
              Math.PI * 2
            )
            context.fillStyle = hexToRgba(node.color, 0.9)
            context.fill()
          }
        }

        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fillStyle = hexToRgba(node.color, dimmed ? 0.22 : active ? 0.95 : 0.7)
        context.shadowBlur = active ? 13 / transform.k : connected ? 5 / transform.k : 0
        context.shadowColor = node.color
        context.fill()

        if (!denseGraph || active || connected || transform.k > 2.2) {
          context.beginPath()
          context.arc(x, y, Math.max(0.8, radius * 0.32), 0, Math.PI * 2)
          context.fillStyle = dimmed ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.62)'
          context.fill()
        }

        context.beginPath()
        context.arc(x, y, radius + 2.4, 0, Math.PI * 2)
        context.strokeStyle = hexToRgba(node.color, dimmed ? 0.24 : active ? 0.86 : 0.58)
        context.lineWidth = Math.max(0.9, (active ? 1.5 : 1.1) / transform.k)
        context.stroke()

        if (active || connected || node === hoveredNode) {
          context.beginPath()
          context.arc(x, y, radius + 4.2, 0, Math.PI * 2)
          context.strokeStyle = active ? accentColor : hexToRgba(node.color, 0.72)
          context.lineWidth = Math.max(0.8, 1 / transform.k)
          context.stroke()
        }

      }

      context.restore()
      drawNodeTooltip(hoveredNode)
      animationFrame = requestAnimationFrame(draw)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const [screenX, screenY] = getCanvasPoint(canvas, event)
      const [worldX, worldY] = transform.invert([screenX, screenY])
      const nextScale = clamp(transform.k * Math.exp(-event.deltaY * 0.0012), 0.32, 5.6)
      transform = zoomIdentity
        .translate(screenX - worldX * nextScale, screenY - worldY * nextScale)
        .scale(nextScale)
    }

    const handlePointerDown = (event: PointerEvent) => {
      const [screenX, screenY] = getCanvasPoint(canvas, event)
      const node = findNode(screenX, screenY)
      canvas.setPointerCapture(event.pointerId)

      if (node) {
        setSelectedSlug(node.slug)
        const [worldX, worldY] = transform.invert([screenX, screenY])
        node.fx = worldX
        node.fy = worldY
        pointerState = {
          mode: 'drag-node',
          pointerId: event.pointerId,
          node,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startTransform: transform,
        }
        simulation.alphaTarget(0.18).restart()
        return
      }

      pointerState = {
        mode: 'pan',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTransform: transform,
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const [screenX, screenY] = getCanvasPoint(canvas, event)

      if (pointerState?.pointerId === event.pointerId && pointerState.mode === 'drag-node') {
        const [worldX, worldY] = transform.invert([screenX, screenY])
        pointerState.node!.fx = clamp(worldX, 0, width)
        pointerState.node!.fy = clamp(worldY, 0, height)
        return
      }

      if (pointerState?.pointerId === event.pointerId && pointerState.mode === 'pan') {
        const dx = event.clientX - pointerState.startClientX
        const dy = event.clientY - pointerState.startClientY
        transform = zoomIdentity
          .translate(pointerState.startTransform.x + dx, pointerState.startTransform.y + dy)
          .scale(pointerState.startTransform.k)
        return
      }

      hoveredNode = findNode(screenX, screenY)
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab'
    }

    const finishPointer = (event: PointerEvent) => {
      if (pointerState?.pointerId !== event.pointerId) return
      if (pointerState.mode === 'drag-node' && pointerState.node) {
        pointerState.node.fx = null
        pointerState.node.fy = null
        simulation.alphaTarget(0)
      }
      pointerState = null
      canvas.style.cursor = 'grab'
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', finishPointer)
    canvas.addEventListener('pointercancel', finishPointer)

    resizeCanvas()
    spatialIndex.addAll(nodes)
    window.setTimeout(() => fitToGraph(false), 120)
    animationFrame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationFrame)
      simulation.stop()
      resizeObserver.disconnect()
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', finishPointer)
      canvas.removeEventListener('pointercancel', finishPointer)
      resetViewRef.current = () => undefined
      focusSelectedRef.current = () => undefined
    }
  }, [degreeBySlug, graph.nodes.length, renderGraph])

  return (
    <div className="page graph-page">
      <h1 className="page__title">知识图谱</h1>
      <p className="page__subtitle">
        共 {graph.nodes.length} 篇笔记，{graph.edges.length} 条双链关系
      </p>

      {graph.nodes.length === 0 ? (
        <p className="empty">还没有文章。</p>
      ) : (
        <div className="graph-layout">
          <section className="graph-canvas" aria-label="笔记关系图">
            <div className="graph-canvas__bar">
              <span>分类聚簇图</span>
              <div className="graph-canvas__status">
                <strong>
                  {formatCount(clusterCount)} 个分类 · {formatCount(renderGraph.nodes.length)}/{formatCount(graph.nodes.length)} 篇 ·{' '}
                  {formatCount(renderGraph.edges.length)} 条关系
                </strong>
                <button type="button" onClick={() => resetViewRef.current()}>
                  重置
                </button>
                <button type="button" onClick={() => focusSelectedRef.current()}>
                  聚焦
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} role="img" aria-label="笔记关系图">
              笔记关系图
            </canvas>
            {(renderGraph.hiddenNodeCount > 0 || renderGraph.hiddenEdgeCount > 0) && (
              <div className="graph-canvas__limit">
                已隐藏 {formatCount(renderGraph.hiddenNodeCount)} 篇低关联文章、{formatCount(renderGraph.hiddenEdgeCount)} 条弱关系
              </div>
            )}
          </section>

          <aside className="graph-panel">
            <div className="graph-panel__search">
              <input
                type="search"
                value={graphQuery}
                onChange={(event) => setGraphQuery(event.target.value)}
                placeholder="搜索图谱节点"
                aria-label="搜索图谱节点"
              />
              {graphQuery.trim() && (
                <ul>
                  {searchResults.length > 0 ? (
                    searchResults.map((node) => (
                      <li key={node.slug}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlug(node.slug)
                            setGraphQuery('')
                            window.setTimeout(() => focusSelectedRef.current(), 80)
                          }}
                        >
                          <span>{node.title}</span>
                          <strong>{degreeBySlug.get(node.slug) ?? 0}</strong>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="graph-panel__empty">没有匹配节点</li>
                  )}
                </ul>
              )}
            </div>

            {selected && (
              <>
                <div className="graph-panel__head">
                  <span>{selected.category ?? '未分类'}</span>
                  <h2>{selected.title}</h2>
                  <Link to={`/posts/${selected.slug}`}>打开笔记</Link>
                </div>

                <div className="graph-panel__section">
                  <h3>指向的笔记</h3>
                  {outgoing.length > 0 ? (
                    <ul>
                      {outgoing.map((node) => (
                        <li key={node.slug}>
                          <Link to={`/posts/${node.slug}`}>{node.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>暂无出链。</p>
                  )}
                </div>

                <div className="graph-panel__section">
                  <h3>引用它的笔记</h3>
                  {incoming.length > 0 ? (
                    <ul>
                      {incoming.map((node) => (
                        <li key={node.slug}>
                          <Link to={`/posts/${node.slug}`}>{node.title}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>暂无反链。</p>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
