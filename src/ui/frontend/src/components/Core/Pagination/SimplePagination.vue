<template>
  <div v-if="page.total > 1" class="flex items-center space-x-2 text-sm">
    <p :class="page.hasPrev ? 'text-gray-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'" @click="page.prev" color="gray">Previous</p>
    <p class="text-sm text-gray-800">{{ page.current }} <span class="text-gray-400">/ {{ page.total }}</span></p>
    <p :class="page.hasNext ? 'text-gray-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'" @click="page.next" color="gray">Next</p>
  </div>
</template>

<script>
export default {
  name: 'SimplePagination',

  props: ['page']
}
</script>
