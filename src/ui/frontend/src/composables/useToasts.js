import ms from 'ms'
import { ref, readonly } from 'vue'

const DEFAULT_DISMISS_AFTER = '5s'
let nextToastId = 0

const toasts = ref([])

function show(text, heading = null, type = 'info', dismissAfter = DEFAULT_DISMISS_AFTER) {
  const id = ++nextToastId

  toasts.value.push({ id, text, heading, type, dismissAfter })

  setTimeout(() => toasts.value = toasts.value.filter(toast => toast.id !== id), ms(dismissAfter))
}

function close(id) {
  toasts.value = toasts.value.filter(toast => toast.id !== id)
}

export default function useToasts() {
  return {
    toasts: readonly(toasts),
    show, close
  }
}
