import { h } from 'vue'
import { defaultSlot } from '@/vue-utils'
import { uniqBy, get } from 'lodash'
import Keys from '@/components/keyboard'
import { search } from '@/services/utils'

const Context = Symbol('FilterBox')

const Focus = {
  Next: 'next-suggestion',
  NextList: 'next-suggestion-list',
  FirstList: 'first-suggestion-list',
  Previous: 'previous-suggestion',
  PreviousList: 'previous-suggestion-list',
  Specific: 'specific'
}

const Ops = {
  Equality: '=',
  NotEquality: '!=',
  Contains: '~',
  GreaterThanEqualTo: '>=',
  LessThanEqualTo: '<=',
}

function values(items, field) {
  if (items.length === 0) {
    return []
  }

  if (Array.isArray(items[0][field])) {
    let temp = items.reduce((acc, i) => {
      acc.push(i[field])
      return acc
    }, [])
    return [...new Set(temp.flat())].sort()
  }
  return uniqBy(items, field).map(item => get(item, field))
}

export const FilterBox = {
  name: 'FilterBox',

  props: {
    as: {
      default: 'template'
    },

    items: {
      type: Array,
      required: true
    },

    filterable: {
      type: Array,
      required: true
    },

    filters: {
      type: Array,
      required: true
    }
  },

  watch: {
    value(value, oldValue) {
      if (value.length > 0 && value !== oldValue) {
        this.generateSuggestions()
      } else {
        this.clearSuggestions()
      }
    }
  },

  data() {
    return {
      value: '',
      suggestionLists: [],
      activeSuggestionListIndex: -1,
      activeSuggestionIndex: -1,

      // Refs
      filterQueryRef: null,
      suggestionListRef: null
    }
  },

  provide() {
    const context = this.$data

    // Methods
    context.go = this.go
    context.isActive = this.isActive
    context.select = this.select
    context.removeFilter = this.removeFilter
    context.removeAllFilters = this.removeAllFilters
    context.removeLastFilter = this.removeLastFilter
    context.clearSuggestions = this.clearSuggestions
    context.clearActiveSuggestion = this.clearActiveSuggestion
    context.clearSearchQuery = this.clearSearchQuery

    // DOM references
    context.filterQueryRef = this.filterQueryRef
    context.suggestionListRef = this.suggestionListRef

    return {
      [Context]: context
    }
  },

  computed: {
    results() {
      let results = this.items

      this.filters.forEach(filter => {
        results = results.filter(item => {
          const value = get(item, filter.field)

          if (value === undefined) {
            return false
          }

          if (filter.op === Ops.Equality) {
            if (Array.isArray(value)) {
              return value.filter(f => {
                return f.toString().toLowerCase().indexOf(filter.value.toString().toLowerCase()) >= 0
              }).length > 0
            }
            return value.toString().toLowerCase() == filter.value.toString().toLowerCase()
          }

          if (filter.op === Ops.NotEquality) {
            if (Array.isArray(value)) {
              return value.filter(f => {
                return f.toString().toLowerCase().indexOf(filter.value.toString().toLowerCase()) < 0
              }).length == 0
            }
            return value.toString().toLowerCase() != filter.value.toString().toLowerCase()
          }

          if (filter.op === Ops.Contains) {
            if (Array.isArray(value)) {
              if (value === null) {
                return false
              }

              return value.filter(f => {
                return f.toString().toLowerCase().indexOf(filter.value.toString().toLowerCase()) >= 0
              }).length > 0
            }
            return value.toString().toLowerCase().indexOf(filter.value.toString().toLowerCase()) >= 0
          }

          if (filter.op === Ops.GreaterThanEqualTo) {
            return value >= filter.value
          }

          if (filter.op === Ops.LessThanEqualTo) {
            return value <= filter.value
          }

          if (typeof filter.op == 'function') {
            if (filter.op(item, filter.value)) {
              return item
            }
          }
        })
      })

      if (this.value.length === 0) {
        return results
      }

      return search(this.value, results, this.filterable.filter(filter => filter.field).map(filter => filter.field), 9999)
    }
  },

  methods: {
    clearSearchQuery() {
      this.value = ''
      this.filterQueryRef.value = ''
    },

    clearSuggestions() {
      this.clearActiveSuggestion()

      this.suggestionLists = []
    },

    clearActiveSuggestion() {
      this.activeSuggestionIndex = -1
      this.activeSuggestionListIndex = -1
    },

    generateSuggestions() {
      /**
       * Let's go with super-simple to start...
       *
       * 1. Look at all filterable fields
       * 2. Generate static suggestions for every operation we support
       * 3. Push suggestion onto this.suggestionLists
       */
      const suggestionLists = []

      // 1. Look at all filterable fields (in order)
      this.filterable.forEach(filterable => {
        const suggestionList = {
          label: filterable.label,
          suggestions: []
        }

        // 2. For every operation we support...
        if (filterable.mode === 'enum' && filterable.label.toLowerCase().includes(this.value.toLowerCase())) {
          values(this.items, filterable.field).forEach(hit => {
            suggestionList.suggestions.push({
              label: `${hit}`,
              filter: {
                label: {
                  value: hit,
                  field: filterable.label,
                  color: "blue"
                },
                mode: filterable.mode,
                field: filterable.field,
                op: "=",
                value: hit
              }
            })
          })

          suggestionList.suggestions.push({
            label: `Contains "${this.value}"`,
            filter: {
              label: {
                value: `Contains "${this.value}"`,
                field: filterable.field,
                color: "blue"
              },
              mode: filterable.mode,
              field: filterable.field,
              op: "~",
              value: this.value
            }
          })
        } else {
          if (filterable.mode == undefined || filterable.mode === 'simple') {
            Object.values(Ops).forEach(op => {
              let filter

              // If operation is unsupported, skip it...
              if (filterable.ops && filterable.ops.includes(op) === false) {
                return
              }

              // Do not apply math operations to strings
              if ([Ops.GreaterThanEqualTo, Ops.LessThanEqualTo].includes(op) && isNaN(this.value)) {
                return
              }

              switch(op) {
                case Ops.Equality: {
                  filter = {
                    suggestionLabel: `Equals "${this.value}"`,
                    label: {
                      field: filterable.label,
                      value: `${filterable.label} equals "${this.value}"`,
                      color: "blue"
                    },
                    mode: filterable.mode,
                    field: filterable.field,
                    op: "=",
                    value: this.value
                  }
                  break
                }
                case Ops.NotEquality: {
                  filter = {
                    suggestionLabel: `Not Equals "${this.value}"`,
                    label: {
                      field: filterable.label,
                      value: `${filterable.label} not equals "${this.value}"`,
                      color: "red"
                    },
                    mode: filterable.mode,
                    field: filterable.field,
                    op: "!=",
                    value: this.value
                  }
                  break
                }
                case Ops.Contains: {
                  filter = {
                    suggestionLabel: `Contains "${this.value}"`,
                    label: {
                      field: filterable.label,
                      value: `${filterable.label} contains "${this.value}"`,
                      color: "blue"
                    },
                    mode: filterable.mode,
                    field: filterable.field,
                    op: "~",
                    value: this.value
                  }
                  break
                }
                case Ops.GreaterThanEqualTo: {
                  filter = {
                    suggestionLabel: `≥ ${this.value}`,
                    label: {
                      field: filterable.label,
                      value: `${filterable.label} ≥ ${this.value}`,
                      color: "blue"
                    },
                    mode: filterable.mode,
                    field: filterable.field,
                    op: ">=",
                    value: this.value
                  }
                  break
                }
                case Ops.LessThanEqualTo: {
                  filter = {
                    suggestionLabel: `≤ ${this.value}`,
                    label: {
                      field: filterable.label,
                      value: `${filterable.label} ≤ ${this.value}`,
                      color: "blue"
                    },
                    mode: filterable.mode,
                    field: filterable.field,
                    op: "<=",
                    value: this.value
                  }
                  break
                }
                default: {
                  console.error('FilterBox: Unsupported operation while generating suggestions.')
                }
              }

              suggestionList.suggestions.push({
                label: filter.suggestionLabel,
                filter
              })
            })
          } else if (filterable.mode === 'enum') {
            const hits = search(this.value, values(this.items, filterable.field), [], 20)

            hits.forEach(hit => {
              suggestionList.suggestions.push({
                label: hit,
                filter: {
                  label: {
                    value: `${filterable.label} = ${hit}`,
                    field: filterable.label,
                    color: "blue"
                  },
                  mode: filterable.mode,
                  field: filterable.field,
                  op: "=",
                  value: hit
                }
              })

              suggestionList.suggestions.push({
                label: `Not ${hit}`,
                filter: {
                  label: {
                    value: `${filterable.label} not equals "${hit}"`,
                    field: filterable.label,
                    color: "red"
                  },
                  mode: filterable.mode,
                  field: filterable.field,
                  op: "!=",
                  value: hit
                }
             })
            })

            suggestionList.suggestions.push({
              label: `Contains "${this.value}"`,
              filter: {
                label: {
                  value: `${filterable.label} contains "${this.value}"`,
                  field: filterable.label,
                  color: "blue"
                },
                mode: filterable.mode,
                field: filterable.field,
                op: "~",
                value: this.value
              }
            })
          } else if (filterable.mode === 'custom') {
            if (!Array.isArray(filterable.filters)) {
              console.error(`FilterBox: Custom filterable ${filterable.label} should provide an array of filter objects that each contain a function which return true or false.`)
              return
            }
            filterable.filters.forEach(f => {
              suggestionList.suggestions.push({
                label: f.suggestionLabel || f.label,
                filter: {
                  label: {
                    value: f.label,
                    field: filterable.label,
                    color: "blue"
                  },
                  mode: filterable.mode,
                  field: f.field,
                  op: f.function,
                  value: this.value
                }
              })
            })
          }
        }

        if (suggestionList.suggestions.length > 0) {
          suggestionLists.push(suggestionList)
        }
      })

      this.suggestionLists = suggestionLists
    },

    /**
     * Navigate to a specific <SuggestionList, Suggestion>
     *
     * This method is used as a low-level interface in mouse and
     * key-binding code. It is primarily resopnsible for maintenance of
     * the "active" suggestion state. Active does not mean "Selected". Imagine the
     * "active" suggestion as "hovered" and can be `select()`-ed.
     *
     * @param {string} focus an enumeration of supported Focus operations
     * @param {number} suggestionListIndex
     * @param {number} suggestionIndex
     */
    go(focus, suggestionListIndex = null, suggestionIndex = null) {
      if (Object.values(Focus).includes(focus) === false) {
        return
      }

      switch(focus) {
        case Focus.Next: {
          if (++this.activeSuggestionIndex > this.suggestionLists[this.activeSuggestionListIndex].suggestions.length - 1) {
            this.go(Focus.NextList)
            this.activeSuggestionIndex = 0
          }
          break
        }
        case Focus.Previous: {
          if (--this.activeSuggestionIndex < 0) {
            this.go(Focus.PreviousList)
            this.activeSuggestionIndex = this.suggestionLists[this.activeSuggestionListIndex].suggestions.length - 1
          }
          break
        }
        case Focus.FirstList: {
          this.activeSuggestionListIndex = 0
          this.activeSuggestionIndex = 0
          break
        }
        case Focus.NextList: {
          this.activeSuggestionIndex = 0

          if (++this.activeSuggestionListIndex > this.suggestionLists.length - 1) {
            this.activeSuggestionListIndex = 0
          }
          break
        }
        case Focus.LastList: {
          this.activeSuggestionListIndex = this.suggestionLists.length - 1
          this.activeSuggestionIndex = this.suggestionLists[this.activeSuggestionListIndex].suggestions.length - 1
          break
        }
        case Focus.PreviousList: {
          this.activeSuggestionIndex = 0

          if (--this.activeSuggestionListIndex < 0) {
            this.activeSuggestionListIndex = this.suggestionLists.length - 1
          }
          break
        }
        case Focus.Specific: {
          if (suggestionListIndex === null || suggestionIndex === null) break
          this.activeSuggestionListIndex = suggestionListIndex
          this.activeSuggestionIndex = suggestionIndex
          break
        }
      }
    },

    isActive(suggestionListIndex, suggestionIndex) {
      return this.activeSuggestionListIndex === suggestionListIndex && this.activeSuggestionIndex === suggestionIndex
    },

    select() {
      const filter = this.suggestionLists[this.activeSuggestionListIndex]?.suggestions[this.activeSuggestionIndex]?.filter

      if (!filter) {
        return
      }

      // This makes a copy of the prop so that we aren't mutating directly
      let tempFilters = [...this.filters]
      tempFilters.push(filter)
      this.$emit('update:filters', tempFilters)

      this.clearSearchQuery()
      this.clearActiveSuggestion()
      this.filterQueryRef.focus()
    },

    removeFilter(index) {
      if (!this.filters[index]) {
        return
      }
      // This makes a copy of the prop so that we aren't mutating directly
      let temp = [...this.filters]
      temp.splice(index, 1)
      this.$emit('update:filters',temp)
    },

    removeAllFilters() {
      this.$emit('update:filters', [])
    },

    removeLastFilter() {
      this.removeFilter(this.filters.length - 1)
    }
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {
      results: this.results,
      filters: this.filters,
      suggestions: this.suggestionLists,
    })

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return h('div', {
        directives: [
          {
            name: 'click-outside',
            value: this.clearSuggestions
          }
        ],
      }, children)
    }

    return h(
      this.as, {
        directives: [
          {
            name: 'click-outside',
            value: this.clearSuggestions
          }
        ],
      },
      children
    )
  }
}

export const FilterQuery = {
  name: 'FilterQuery',

  props: {
    as: {
      type: [Object, String],
      default: 'template',
    },

    modelValue: {
      type: String,
    }
  },

  inject: {
    api: Context
  },

  watch: {
    modelValue(val) {
      this.api.value = val
    }
  },

  mounted() {
    if (this.api.filterQueryRef) {
      console.warn(`You should not use two FilterQuery components in the same FilterBox`)
    }

    this.api.filterQueryRef = this.$el
  },

  methods: {
    handleKeyDown(event) {
      if (event.key === Keys.Tab) {
        event.preventDefault()

        if (!event.shift) {
          this.api.go(Focus.FirstList)
        } else {
          this.api.go(Focus.LastList)
        }
      }

      switch(event.key) {
        case Keys.Escape: {
          this.api.clearSuggestions()
          break
        }

        case Keys.Backspace: {
          if (this.$el.selectionStart === 0 && this.$el.selectionEnd === 0) {
            event.preventDefault()
            this.api.removeLastFilter()
          }
          break
        }

        case Keys.ArrowRight:
        case Keys.ArrowDown: {
          if (this.$el.selectionStart === this.modelValue.length && this.modelValue.length > 0) {
            this.api.go(Focus.FirstList)
            event.preventDefault()
          }
          break
        }
      }
    }
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {})

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return children
    }

    return h(
      this.as, {
        value: this.modelValue,
        onInput: (event) =>  {
          this.$emit('update:modelValue', event.target.value)
        },
        onKeydown: this.handleKeyDown,
        onFocus: this.api.clearActiveSuggestion,
      },
      children
    )
  }
}

export const FilterButton = {
  name: 'FilterButton',

  props: {
    as: {
      type: [Object, String],
      default: 'button'
    }
  },

  inject: {
    api: Context
  },

  methods: {
    handleMouseClick(event) {
      event.stopPropagation()
      this.api.removeFilter(this._.vnode.key)
    }
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {})

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return children
    }

    return h(
      this.as, {
        onClick: this.handleMouseClick
      },
      children
    )
  }
}

export const ClearQueryButton = {
  name: 'ClearQueryButton',

  props: {
    as: {
      type: [Object, String],
      default: 'button',
    }
  },

  inject: {
    api: Context
  },

  methods: {
    handleMouseClick(event) {
      event.preventDefault()
      event.stopPropagation()

      this.api.clearSearchQuery()
      this.api.removeAllFilters()
    }
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {})

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return children
    }

    return h(
      this.as, {
        onClick: this.handleMouseClick
      },
      children
    )
  }
}

const SuggestionListContext = Symbol('SuggestionListContext')

export const SuggestionList = {
  name: 'SuggestionList',

  props: {
    as: {
      type: [Object, String],
      default: 'template'
    }
  },

  inject: {
    api: Context
  },

  provide() {
    return {
      [SuggestionListContext]: {
        index: this._.vnode.key
      }
    }
  },

  methods: {
    handleMouseEnter(event) {
      this.api.go(Focus.Specific, this._.vnode.key, -1)
    },

    handleKeyDown(event) {
      event.stopPropagation()

      switch(event.key) {
        case Keys.ArrowRight: {
          event.preventDefault()
          this.api.go(Focus.Next)
          break
        }
        case Keys.ArrowLeft: {
          event.preventDefault()
          this.api.go(Focus.Previous)
          break
        }
        case Keys.ArrowDown: {
          event.preventDefault()
          this.api.go(Focus.NextList)
          break
        }
        case Keys.ArrowUp: {
          event.preventDefault()
          this.api.go(Focus.PreviousList)
          break
        }
        case Keys.Tab: {
          event.preventDefault()
          break
        }
      }
    }
  },

  mounted() {
    this.api.suggestionListRef = this.$el
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {})

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return children
    }

    return h(
      this.as, {
        onMouseenter: this.handleMouseEnter,
        onKeydown: this.handleKeyDown
      },
      children
    )
  }
}

export const Suggestion = {
  name: 'Suggestion',

  props: {
    as: {
      type: [Object, String],
      default: 'template'
    }
  },

  inject: {
    api: Context,
    list: SuggestionListContext,
  },

  watch: {
    'api.activeSuggestionListIndex'() {
      this.focus()
    },
    'api.activeSuggestionIndex'() {
      this.focus()
    }
  },

  methods: {
    focus() {
      if (this.api.activeSuggestionIndex === this._.vnode.key && this.api.activeSuggestionListIndex === this.list.index) {
        this.$el.focus()
      } else {
        this.$el.blur()
      }
    },

    handleMouseEnter(event) {
      this.$el.focus()
      this.api.go(Focus.Specific, this.list.index, this._.vnode.key)
    },

    handleMouseClick(event) {
      event.stopPropagation()
      this.api.select()
    }
  },

  render() {
    const { as, ...passThroughProps } = this.$props

    const children = defaultSlot(this, {
      isActive: this.api.isActive(this.list.index, this._.vnode.key)
    })

    if (this.as === 'template') {
      const [firstChild, ...other] = children ? children : []

      if (other.length > 0) {
        throw new Error('You should only render 1 child or use the `as="..."` prop')
      }

      return children
    }

    return h(
      this.as, {
        onMouseenter: this.handleMouseEnter,
        onClick: this.handleMouseClick
      },
      children
    )
  }
}
