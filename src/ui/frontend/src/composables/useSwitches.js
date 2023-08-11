import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data } = useAPI()

const switches = ref([])

async function getSwitches() {
  await axios.get('/switches')
  switches.value = data.value
}

async function addSwitch(sw) {
    await axios.post('/switches', sw)
    switches.value.push(data.value)
}

async function editSwitch(sw) {
  await axios.patch(`/switches/${sw.id}`, sw)
  await fetchAll()
}

async function fetchAll() {
  await getSwitches()
}

async function setupPoll(interval='30s') {
  let pollInterval = null

  onMounted(() => {
    if (!pollInterval) {
      pollInterval = setInterval(() => fetchAll(), ms(interval))
    }
  })

  onBeforeUnmount(() => {
    clearInterval(pollInterval)
  })
}

fetchAll()

export default function useSwitches() {
  return {
    switches: readonly(switches),
    isLoading: readonly(isLoading),
    getSwitches,
    addSwitch,
    editSwitch,
    fetchAll,
    setupPoll
  }
}
