<template>
  <div class="flex items-center space-x-1 text-sm">
    <button @click="page.prev" class="focus:outline-none hover:bg-gray-100 rounded p-1" :class="page.hasPrev ? 'text-gray-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'">
      <ChevronLeftIcon name="chevron-left" class="w-5 h-5" />
    </button>

    <!-- First -->
    <button
      @click="page.go(1)"
      class="py-1 px-2.5 rounded-full focus:outline-none"
      :class="page.current === 1 ? 'text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'"
    >
      1
    </button>

    <!-- Low Summarized -->
    <Dropdown center v-if="pageNumbers.low.length > 0">
      <template #trigger>
        <span class="py-1 px-2.5 rounded-full focus:outline-none text-gray-600 hover:bg-gray-100">
          ...
        </span>
      </template>

      <template #dropdown>
        <div class="bg-white rounded shadow-lg">
          <div class="p-2 w-32 shadow-sm grid grid-cols-3">
            <button
              v-for="pageNumber in pageNumbers.low"
              :key="`low-${pageNumber}`"
              @click="page.go(pageNumber)"
              class="py-1.5 px-2.5 rounded-full focus:outline-none"
              :class="pageNumber === page.current ? 'text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'"
            >
              {{ pageNumber }}
            </button>
          </div>
        </div>
      </template>
    </Dropdown>

    <!-- Visible Page Numbers -->
    <button
      v-for="pageNumber in pageNumbers.visible"
      :key="`visible-${pageNumber}`"
      @click="page.go(pageNumber)"
      class="py-1 px-2.5 rounded-full focus:outline-none"
      :class="pageNumber === page.current ? 'text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'"
    >
      {{ pageNumber }}
    </button>

    <!-- High Summarized -->
    <Dropdown center v-if="pageNumbers.high.length > 0">
      <template #trigger>
        <span class="py-1 px-2.5 rounded-full focus:outline-none text-gray-600 hover:bg-gray-100">
          ...
        </span>
      </template>

      <template #dropdown>
        <div class="p-1 w-32 grid grid-cols-3">
          <button
            v-for="pageNumber in pageNumbers.high"
            :key="`high-${pageNumber}`"
            @click="page.go(pageNumber)"
            class="py-1.5 px-2.5 rounded-full focus:outline-none"
            :class="pageNumber === page.current ? 'text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'"
          >
            {{ pageNumber }}
          </button>
        </div>
      </template>
    </Dropdown>

    <!-- Last -->
    <button v-if="page.total > 1"
      @click="page.go(page.total)"
      class="py-1 px-2.5 rounded-full focus:outline-none"
      :class="page.current === page.total ? 'text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'"
    >
      {{ page.total }}
    </button>

    <button @click="page.next" class="focus:outline-none hover:bg-gray-100 rounded p-1" :class="page.hasNext ? 'text-gray-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'">
      <ChevronRightIcon  class="w-5 h-5" />
    </button>
  </div>
</template>

<script>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { chunk } from 'lodash'

import Dropdown from '@/components/Core/Dropdown.vue'

export default {
  name: 'AdvancedPagination',
  components: { Dropdown, ChevronLeftIcon, ChevronRightIcon },
  props: ['page'],

  computed: {
    pageNumbers() {
      const withoutFirstLast = [...Array(this.page.total).keys()].slice(2)
      let low, visible, high = []

      if (this.page.current <= 4) {
        visible = withoutFirstLast.slice(0, 4)
      } else if (this.page.total - this.page.current < 3) {
        visible = withoutFirstLast.slice(this.page.total - 6)
      } else {
        visible = withoutFirstLast.slice(this.page.current - 4, this.page.current)
      }

      low = withoutFirstLast.slice(0, withoutFirstLast.indexOf(visible[0]))
      high = withoutFirstLast.slice(withoutFirstLast.indexOf(visible[visible.length - 1]) + 1)

      return {
        low: low.length > 9 ? chunk(low, 9).map(chunk => chunk[0]) : low,
        visible,
        high: high.length > 9 ? chunk(high, 9).map(chunk => chunk[0]) : high
      }
    }
  }
}
</script>
