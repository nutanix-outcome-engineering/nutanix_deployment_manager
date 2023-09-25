<script setup>
import { XCircleIcon, FingerPrintIcon, TagIcon, MapPinIcon, ChevronDownIcon, ServerIcon, ComputerDesktopIcon } from '@heroicons/vue/24/solid'
import { Cog6ToothIcon, PaperAirplaneIcon, PencilSquareIcon, BoltIcon, BoltSlashIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import { startCase, range, orderBy } from 'lodash'

import Badge from '@/components/Core/Badge.vue'

const props = defineProps({
  params: {
    type: Object
  }
})
const node = props.params.data
</script>

<template>
  <div class="flex flex-1 items-center justify-between">
    <div class="flex-1">
      <div class="flex flex-row font-medium text-gray-800">
        <h3 class="text-lg pr-1">BMC IP: {{ node.ipmi.ip }}</h3>
      </div>
      <div class="mt-2 flex space-x-3 text-sm overflow-hidden">
        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="Node Serial">
          <FingerPrintIcon class="w-4 h-4" />
          <span class="truncate">{{ node.serial }}</span>
        </div>
        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="Host Hostname">
          <ServerIcon class="w-4 h-4" />
          <span class="truncate">{{ node.host.hostname }}</span>
        </div>
        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="CVM IP">
          <ComputerDesktopIcon class="w-4 h-4" />
          <span class="truncate">{{ node.cvm.ip }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
