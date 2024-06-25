<script setup>
import { startCase } from 'lodash'
import AppLink from '../../components/Core/AppLink.vue'
import useTasks from '@/composables/useTasks.js'

const { tasks } = useTasks()
</script>

<template>
  <div class="flex flex-col">
    <div v-if="$route.matched.some(({name}) => name == 'tasks')" class="flex flex-col">
      <ol role="list" class="flex items-center rounded-md border border-gray-300">
        <li class="relative flex ">
          <AppLink :to="{name: 'task.list'}"
            exact-active-class="border-indigo-600 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
          >
            <span class="flex items-center pr-8 py-4 text-sm font-medium border-inherit">
              <span class="ml-4 text-sm font-medium">Task List</span>
            </span>
          </AppLink>

          <div v-if="$route.matched.some(({name}) => name == 'task.overview')" class="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
            <svg class="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
              <path d="M0 -2L20 40L0 82" vector-effect="non-scaling-stroke" stroke="currentcolor" stroke-linejoin="round" />
            </svg>
          </div>
        </li>
        <li v-if="$route.matched.some(({name}) => name == 'task.overview')" class="relative flex">
          <AppLink :to="{name: 'task.overview'}"
            exact-active-class="border-indigo-600 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
          >
            <span class="flex items-center py-4 text-sm font-medium border-inherit">
              <span class="ml-4 text-sm font-medium">{{ startCase(tasks.find(t => t.id == $route.params.id)?.type) }}</span>
            </span>
          </AppLink>
        </li>
      </ol>
    </div>
  </div>
  <router-view></router-view>
</template>
