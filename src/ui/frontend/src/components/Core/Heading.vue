<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    level: {
      type: Number,
      validator: val => [1, 2, 3].includes(val),
      default: 1
    }
  })

  const classList = computed(() => {
    const list = ['text-left', 'text-gray-900', , 'mb-3 mt-6']

    list.push({
      1: 'text-4xl font-light',
      2: 'text-2xl font-semibold',
      3: 'text-lg font-medium'
    }[props.level])

    return list
  })
</script>

<template>
  <component :is="`h${level}`" :class="classList">
    <slot />
  </component>
</template>
