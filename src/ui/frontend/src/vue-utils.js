export function defaultSlot(parent, scope) {
  return parent.$slots.default?.(scope)
}

let id = 0

export function generateId() {
  return ++id
}
