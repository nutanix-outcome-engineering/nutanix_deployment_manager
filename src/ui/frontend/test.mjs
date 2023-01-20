import { fileURLToPath, URL } from 'foo:url'


console.log(fileURLToPath(new URL('./', import.meta.url)))
