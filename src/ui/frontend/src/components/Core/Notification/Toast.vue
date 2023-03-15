<template>
  <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto">
    <div class="rounded-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="icon[type]" class="h-6 w-6" :class="[iconClass[type]]" />
          </div>
          <div class="ml-3 w-0 flex-1">
            <p v-if="heading" class="text-sm leading-5 font-medium text-gray-900">
              {{ heading }}
            </p>
            <p class="mt-1 text-sm leading-5 text-gray-500">
              <slot></slot>
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button @click="$emit('dismiss')" class="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid'

export default {
  name: 'Toast',
  components: { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon },

  props: {
    heading: String,
    type: {
      type: String,
      validator: (val) => ['success', 'error', 'info'].includes(val),
      default: 'info'
    }
  },

  data() {
    return {
      icon: {
        success: CheckCircleIcon,
        error: ExclamationTriangleIcon,
        info: InformationCircleIcon
      },
      iconClass: {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400',
      }
    }
  }
}
</script>
