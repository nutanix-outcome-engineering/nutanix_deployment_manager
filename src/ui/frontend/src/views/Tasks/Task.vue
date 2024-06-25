<script setup>
import { useRouter, useRoute, onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'
import { startCase } from 'lodash'
import ms from 'ms'
import { onMounted, ref, watch } from 'vue';
import useTasks from '@/composables/useTasks.js'
import ProgressCircle from '../../components/Core/ProgressCircle.vue'

const route = useRoute()
const { getTask } = useTasks()
const task = ref(null)
let poll = null

watch(() => route.params.id, async () => {
  if (route.params.id) {
    task.value = await getTask(route.params.id)
    if (!poll) {
      poll = setInterval(async () => task.value = await getTask(route.params.id), ms('10s'))
    }
  }
}, {immediate: true})

onBeforeRouteLeave(async (to, from) => {
  clearInterval(poll)
  poll = null
})
onBeforeRouteUpdate(async (to, from) => {
  clearInterval(poll)
  poll = null
})

function color(status) {
  switch (status) {
    case 'failed':
        return 'red'
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
  <div class="p-2">
    <h3 class="text-xl font-medium"> {{ startCase(task?.type) }}</h3>
    <div class="flex items-center" v-for="step of task?.progress.subTasks" :key="step.name">
        <div class="pr-2">
          <ProgressCircle :model-value="step.progress" :color="color(step.state)"/>
        </div>
      {{ startCase(step.name)  }}
    </div>
  </div>
</template>
