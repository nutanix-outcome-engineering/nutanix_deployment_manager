import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data } = useAPI()

const racks = ref([])

async function getRacks() {
  await axios.get('/racks')
  racks.value = data.value
}

async function addRack(rack) {
    await axios.post('/racks', rack)
    racks.value.push(data.value)
}

async function editRack(rack) {
  await axios.patch(`/racks/${rack.id}`, rack)
  await fetchAll()
}

async function fetchAll() {
  await getRacks()
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

export default function useRacks() {
  return {
    racks: readonly(racks),
    isLoading: readonly(isLoading),
    getRacks,
    addRack,
    editRack,
    fetchAll,
    setupPoll
  }
}
