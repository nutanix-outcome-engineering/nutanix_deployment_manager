import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'
import useToasts from '@/composables/useToasts.js'

const { axios, isLoading, data, response } = useAPI()
const { show } = useToasts()

const ingestingNodes = ref([])
const nodes = ref([])

async function getIngestingNodes() {
  await axios.get('/nodes/ingesting')
  ingestingNodes.value = data.value
}

async function getNodes() {
  await axios.get('/nodes')
  nodes.value = data.value
}

async function ingestIPRange({start, stop}) {
  try {
    await axios.post('/import/ip/range', {start, stop})
    await getIngestingNodes()
    show('Range ingesting', '', 'success')
  } catch (error) {

  }
}

async function addNodes(nodes) {
  try {
    await axios.post('/nodes', nodes)
    await Promise.all([getIngestingNodes(), getNodes()])
    show('Node(s) added', '', 'success')
  } catch(error) {

  }
}

async function retryDiscovery(ids) {
  try {
    await axios.post('/nodes/ingesting/retry', { ingestionIDs: ids })
    await getIngestingNodes()
    show('Retrying discovery', '', 'success')
  } catch (error) {

  }
}

async function fetchAll() {
  await Promise.all([getNodes(), getIngestingNodes()])
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

export default function useNodes() {
  return {
    ingestingNodes: readonly(ingestingNodes),
    nodes: readonly(nodes),
    isLoading: readonly(isLoading),
    getIngestingNodes,
    getNodes,
    ingestIPRange,
    addNodes,
    retryDiscovery,
    fetchAll,
    setupPoll
  }
}
