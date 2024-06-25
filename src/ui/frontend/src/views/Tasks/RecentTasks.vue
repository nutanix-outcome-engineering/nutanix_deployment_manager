<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { Bars3Icon, QueueListIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { startCase } from 'lodash'
import AppLink from '../../components/Core/AppLink.vue'
import ProgressCircle from '../../components/Core/ProgressCircle.vue'
import useTasks from '@/composables/useTasks.js'

const { tasks, setupPoll } = useTasks()
const maxShow = 3
setupPoll('10s')

function color(status) {
  switch (status) {
    case 'failed':
        return 'red'
      break;
    case 'complete':
      return 'green'
    case 'progress':
      return 'yellow'

    default:
      break;
  }
}

</script>

<template>
  <Menu as="div" class="relative ml-3">
    <MenuButton class="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
      <span class="sr-only">View Tasks</span>
      <QueueListIcon class="h-6 w-6" aria-hidden="true" />
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <MenuItem v-for="task in tasks.slice(0, maxShow)" :key="task.id" v-slot="{ active }">

          <AppLink :to="{path: `/tasks/${task.id}`}">
            <div :class="[active ? 'bg-gray-100' : '', 'flex px-4 py-2 text-sm text-gray-700 items-center']">
              <div class="pr-2"><ProgressCircle :model-value="task.progress.progress" :color="color(task.status)"/></div>
              <div class="flex-nowrap">{{ startCase(task.type) }}</div>
            </div>
          </AppLink>
        </MenuItem>
        <MenuItem v-slot="{ active }">
          <AppLink :to="{name: 'task.list'}">
            <span :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">More...</span>
          </AppLink>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>

</template>
