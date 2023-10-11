import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data } = useAPI()

const sites = ref([])

async function getSites() {
  await axios.get('/sites')
  sites.value = data.value
}

async function addSite(site) {
    await axios.post('/sites', site)
    sites.value.push(data.value)
}

async function editSite(site) {
  await axios.patch(`/sites/${site.id}`, site)
  await fetchAll()
}

async function fetchAll() {
  await getSites()
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

export default function useSites() {
  return {
    sites: sites,
    isLoading: readonly(isLoading),
    getSites,
    addSite,
    editSite,
    fetchAll,
    setupPoll
  }
}
