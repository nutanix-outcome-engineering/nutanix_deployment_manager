<script setup>
import { onMounted, onBeforeUnmount, inject, useSlots } from 'vue'

const props = defineProps({
  value: [String, Object]
})

const slots = useSlots()

const api = inject('select')

onMounted(() => {
  const label = slots.default()[0].children

  if (api.register) {
    api.register({ label, value: props.value })
  }
})

onBeforeUnmount(() => {
  if (api.unregister) {
    api.unregister(props.value)
  }
})

</script>

<template>

</template>
