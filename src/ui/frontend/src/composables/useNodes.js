import { ref, computed, readonly, unref } from 'vue'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data, response } = useAPI()

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
  } catch (error) {

  }
}

async function addNodes(nodes) {
  try {
    await axios.post('/nodes', nodes)
    await Promise.all([getIngestingNodes(), getNodes()])
  } catch(error) {

  }
}

export default function useNodes() {
  return {
    ingestingNodes: readonly(ingestingNodes),
    nodes: readonly(nodes),
    isLoading: readonly(isLoading),
    getIngestingNodes,
    getNodes,
    ingestIPRange,
    addNodes
  }
}
