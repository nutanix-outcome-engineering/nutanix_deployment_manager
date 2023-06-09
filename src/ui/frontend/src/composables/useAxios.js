import { ref, computed, readonly } from 'vue'
import axios from 'axios'
import useToasts from '@/composables/useToasts.js'

const { show } = useToasts()

export default function useAxios() {
  const client = axios.create({
    baseURL: `${location.origin}/`,
    withCredentials: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })

  const isLoading = ref(false)
  const error = ref(null)
  const response = ref(null)
  const data = computed(() => response.value && response.value.data)

  client.interceptors.request.use(config => {
    isLoading.value = true
    error.value = null
    return config
  }, err => {
    isLoading.value = true
    error.value = err.response.data
    return Promise.reject(err)
  })

  client.interceptors.response.use(res => {
    isLoading.value = false
    response.value = res
    error.value = null
    return response
  }, err => {
    isLoading.value = false
    error.value = err.response && err.response.data
    show(error?.value?.message, 'Error', 'error')
    response.value = null
    return Promise.reject(err)
  })

  return {
    axios: client,
    isLoading: readonly(isLoading),
    error: readonly(error),
    response: readonly(response),
    data: readonly(data),
  }
}
