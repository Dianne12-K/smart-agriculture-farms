const LAYER_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

function hashCode(str) {
    return String(str).split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0)
}

export function getLayerColor(uuid) {
    return LAYER_COLORS[Math.abs(hashCode(uuid)) % LAYER_COLORS.length]
}
