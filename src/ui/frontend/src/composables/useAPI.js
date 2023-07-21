import { readonly } from 'vue'
import useAxios from '@/composables/useAxios.js'

const { axios, isLoading, error, response, data  } = useAxios()

const newBase = new URL('/api', axios.defaults.baseURL)
axios.defaults.baseURL = `${newBase.toString()}`

export default function useAPI() {
  return {
    axios,
    isLoading: readonly(isLoading),
    error: readonly(error),
    response: readonly(response),
    data: data
  }
}
