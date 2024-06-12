import { ref, computed, readonly, unref , onMounted, onBeforeUnmount} from 'vue'
import ms from 'ms'
import useAPI from '@/composables/useAPI.js'

const { axios, isLoading, data } = useAPI()
async function addFoundationServer(site, foundation) {
  await axios.post(`/foundation`, {...foundation, site})
  return unref(data)
}

async function getAllFVMs() {
  await axios.get(`/foundation`)

  return unref(data)
}

export default function useFoundation() {
  return {
    addFoundationServer,
    getAllFVMs
  }
}
