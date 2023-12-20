import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data } = useAPI()

const sites = ref([])
const currentSite = ref(null)

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
  await getSite(site.id)
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

async function getSite(id) {
  await axios.get(`/sites/${id}`)
  currentSite.value =  data.value
}

async function addAOS(site, aos) {
  await axios.post(`/sites/${site.id}/aos`, aos)
  const newAOS = unref(data)
  await getSite(site.id)
  return newAOS
}
async function updateAOS(site, aos) {
  await axios.patch(`/sites/${site.id}/aos/${aos.uuid}`, aos)
  const updatedAOS = unref(data)
  await getSite(site.id)
  return updatedAOS
}

fetchAll()

export default function useSites() {
  return {
    sites: sites,
    site: currentSite,
    isLoading: readonly(isLoading),
    getSites,
    addSite,
    editSite,
    fetchAll,
    setupPoll,
    getSite,
    addAOS, updateAOS
  }
}
