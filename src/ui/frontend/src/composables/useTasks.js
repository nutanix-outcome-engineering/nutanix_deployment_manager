import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'
import useToasts from '@/composables/useToasts.js'

const { axios, isLoading, data, response } = useAPI()
const { show } = useToasts()
const tasks = ref([])

async function getTasks() {
  await axios.get('/tasks')
  tasks.value = data.value
}

async function getTask(id) {
  await axios.get(`/tasks/${id}`)

  return data.value
}

async function setupPoll(interval='30s') {
  let pollInterval = null
  getTasks()

  onMounted(() => {
    if (!pollInterval) {
      pollInterval = setInterval(() => getTasks(), ms(interval))
    }
  })

  onBeforeUnmount(() => {
    clearInterval(pollInterval)
  })
}


export default function useTasks() {
  return {
    tasks,
    isLoading: readonly(isLoading),
    getTasks,
    getTask,
    setupPoll
  }
}
