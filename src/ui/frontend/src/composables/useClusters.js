import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'
import useToasts from '@/composables/useToasts.js'

const { axios, isLoading, data, response } = useAPI()
const { show } = useToasts()
const clusters = ref([])

async function getClusters() {
  await axios.get('/cluster')
  clusters.value = data.value
}

async function addCluster(cluster) {
  try {
    await axios.post('/cluster', cluster)
    const newCluster = data.value
    show(`Cluster ${cluster.name} added`, '', 'success')
    return newCluster
  } catch(error) {
    throw error
  }
}


export default function useClusters() {
  return {
    clusters,
    isLoading: readonly(isLoading),
    getClusters,
    addCluster
  }
}
