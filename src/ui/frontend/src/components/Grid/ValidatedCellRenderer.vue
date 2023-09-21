<script setup>
import { XCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  params: {
    type: Object
  }
})
</script>

<template>
    <div v-if="Boolean(params.value == 'pendingReview')" class="flex w-full h-full justify-center items-center">
      <CheckCircleIcon class="w-8 h-8 text-green-700 "/>
    </div>
    <div v-else class="flex w-full h-full justify-center items-center">
      <XCircleIcon class="w-8 h-8 text-red-600"/>
    </div>
</template>
