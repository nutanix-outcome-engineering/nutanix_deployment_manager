<script setup>
import Button from '@/components/Core/Button.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
</script>

<template>
    <div class="absolute inset-0 bg-gray-900 flex items-center justify-center">
    <div class="relative text-white text-6xl font-bold flex items-center">
      <div>
      404 <div class="leading-none text-2xl ml-1">Not Found</div>
      </div>
      <div class="ml-10 -mt-3">
        <Button kind="primary" size="xl" @click="$router.back()">
          <ArrowLeftIcon class="w-5 h-5 -ml-1 mr-2" />
          Back
        </Button>
      </div>
    </div>
  </div>
</template>
