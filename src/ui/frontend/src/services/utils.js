import Fuse from 'fuse.js'

/**
 * Perform a fuzzy search across an array of objects.
 *
 * See: https://fusejs.io/api/options.html
 *
 * @param {*} needle term you're searching with
 * @param {*} haystack list of items to search through
 * @param {*} keys object keys to perform matching on
 * @param {*} options additional fuse.js options
 */
export function search(needle, haystack, keys = [], results, options = {}) {
  const fuse = new Fuse(haystack, {
    keys,
    threshold: 0.2,
    ...options
  })

  const hits = fuse.search(needle).map(hit => hit.item)

  if (!results) {
    return hits
  } else {
    return hits.slice(0, results)
  }
}

/**
 * A functional approach to "match expressions". It uses syntax similar to
 * a switch statement, but allows for return values to perform assignments
 * conditionally.
 *
 * Example:
 *
 * const isFruit = match('apple', {
 *   apple: true,         // isFruit === true
 *   orange: true,
 *   potato: false,
 *   onion: () => false   // You can use functions!
 * })
 *
 * @param {*} value
 * @param {*} lookup
 * @param  {...any} args
 */
export function match(value, lookup, ...args) {
  if (value in lookup) {
    const ret = lookup[value]
    return typeof ret === 'function' ? ret(...args) : ret
  }

  if (lookup.default) {
    return typeof lookup.default === 'function' ? lookup.default(...args) : lookup.default
  }

  const error = new Error(
    `Tried to handle "${value}" but there is no handler defined. Only defined handlers are: ${Object.keys(lookup).map(key => `"${key}"`).join(', ')}`
  )

  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, match)
  }

  throw error
}

export function formatMoney(amount) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  })

  return formatter.format(amount)
}

/**
 * This function takes text with special characters, spaces and
 * what-not and makes it appropriate for use as a slug.
 *
 * Credit: https://medium.com/@mhagemann/the-ultimate-way-to-slugify-a-url-string-in-javascript-b8e4a0d849e1
 */
export function slugify(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
    .replace(/[()]/g,'') // Trim () from text
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    //
  }
}

export function versionCompare(v1, v2, options) {
  var lexicographical = options && options.lexicographical,
      zeroExtend = options && options.zeroExtend,
      v1parts = v1.split('.'),
      v2parts = v2.split('.');

  function isValidPart(x) {
      return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN;
  }

  if (zeroExtend) {
      while (v1parts.length < v2parts.length) v1parts.push("0");
      while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  if (!lexicographical) {
      v1parts = v1parts.map(Number);
      v2parts = v2parts.map(Number);
  }

  for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length == i) {
          return 1;
      }

      if (v1parts[i] == v2parts[i]) {
          continue;
      }
      else if (v1parts[i] > v2parts[i]) {
          return 1;
      }
      else {
          return -1;
      }
  }

  if (v1parts.length != v2parts.length) {
      return -1;
  }

  return 0;
}

export const browser = {
  timezone: {
    name: Intl.DateTimeFormat().resolvedOptions().timeZone,
    abbr: new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2]
  }
}

export function getCookie(name) {
  const match = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
  return match ? match[2] : null
}

export const versionCheck = (v) => {
  if (v) {
    return v.match(/^(\d{1,2}\.?){2,4}/) !== null
  }
  return false
}

export const fqdnCheck = (f) => {
  if (f) {
    return f.match(/^([A-Za-z0-9_-]{2,20}\.){2}([A-Za-z0-9_-]{2,20}\.?){1,5}/) !== null
  }
  return false
}

export const ipCheck = (i) => {
  if (i) {
    return i.match(/^([0-9]{1,3}\.){3}([0-9]{1,3}){1}/) !== null
  }
  return false
}

export const urlCheck = (u) => {
  let url

  try {
    url = new URL(u)
  } catch (error) {
    return false
  }

  return url.protocol === "http:" || url.protocol === "https:"
}

export const emailCheck = (e) => {
  let emailRegEx = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/

  if (e) {
    return e.match(emailRegEx) !== null
  }

  return false
}

export async function confirm(options = {}) {
  const { message } = Object.assign({
    message: 'Are you sure?'
  }, options)

  return window.confirm(message)
}
