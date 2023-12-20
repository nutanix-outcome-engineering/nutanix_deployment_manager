import { Upload } from 'tus-js-client'
import { ref, computed, readonly } from 'vue'
import useAPI from '@/composables/useAPI.js'
import useToasts from '@/composables/useToasts.js'

const endpoint = useAPI().axios.getUri()
const { show } = useToasts()
const uploads = ref([])

async function uploadAos(file, uuid) {
  const tus = new Upload(file, {
    endpoint: `${endpoint}/uploads`,
    removeFingerprintOnSuccess: true,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      'ndm-upload-type': 'aos'
    },
    metadata: {
      filename: file.name,
      filetype: file.type,
      type: 'aos',
      refId: uuid
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      let percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
    },
    onError: (error) => {
      show(`Error during upload: ${error.causingError}`, 'Error', 'error')
    },
    onShouldRetry: (error, retryAttempt, options) => {
      options.headers['ndm-auto-retry'] = retryAttempt + 1
      return true
    }
  })

  const previousUploads = await tus.findPreviousUploads()
  if (previousUploads.length) {
    tus.resumeFromPreviousUpload(previousUploads[0])
  }
  tus.start()
  uploads.value.push(tus)
}

async function uploadHypervisor(file, uuid) {
  const tus = new Upload(file, {
    endpoint: `${endpoint}/uploads`,
    removeFingerprintOnSuccess: true,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: {
      'ndm-upload-type': 'hypervisor'
    },
    metadata: {
      filename: file.name,
      filetype: file.type,
      type: 'hypervisor',
      refId: uuid
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      let percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
    },
    onError: (error) => {
      show(`Error during upload: ${error.causingError}`, 'Error', 'error')
    },
    onShouldRetry: (error, retryAttempt, options) => {
      options.headers['ndm-auto-retry'] = retryAttempt + 1
      return true
    }
  })

  const previousUploads = await tus.findPreviousUploads()
  if (previousUploads.length) {
    tus.resumeFromPreviousUpload(previousUploads[0])
  }
  tus.start()
  uploads.value.push(tus)
}

export default function useTus() {
  return {
    uploads: readonly(uploads),
    uploadAos,
    uploadHypervisor
  }
}
