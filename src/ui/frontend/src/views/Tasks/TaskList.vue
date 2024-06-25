<script setup>
import { startCase } from 'lodash'
import AppLink from '../../components/Core/AppLink.vue'
import ProgressCircle from '../../components/Core/ProgressCircle.vue'
import useTasks from '@/composables/useTasks.js'

const { tasks } = useTasks()

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
  <div v-for="task in tasks" :key="task.id">
    <AppLink :to="{path: `/tasks/${task.id}`}">
      <div class="flex items-center px-4 py-2">
        <div class="pr-2">
          <ProgressCircle :model-value="task.progress.progress" :color="color(task.status)"/>
        </div>
        <div class="block px-4 py-2 text-sm text-gray-700">
          <div class="flex-nowrap">{{ startCase(task.type) }}</div>
          <div> Step {{ Math.min(task.statistics.completedTasks + 1, task.statistics.totalTasks) }} of {{ task.statistics.totalTasks }}</div>
        </div>
      </div>
    </AppLink>
  </div>

</template>
