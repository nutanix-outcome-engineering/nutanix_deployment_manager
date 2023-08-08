<script>
import { h } from 'vue'

export default {
  name: 'Paginate',

  props: {
    items: {
      type: Array,
      default: () => [],
      required: true,
    },

    perPage: {
      type: Number,
      required: false,
      default: 50,
    }
  },

  data() {
    return {
      currentPage: 1
    }
  },

  watch: {
    items() {
      this.currentPage = 1
    }
  },

  computed: {
    numPages() {
      return Math.ceil(this.items.length / this.perPage)
    },

    hasNext() {
      return this.currentPage < this.numPages
    },

    hasPrev() {
      return this.currentPage > 1
    },

    paginatedItems() {
      return this.items.slice(this.currentPage * this.perPage - this.perPage, this.currentPage * this.perPage)
    }
  },

  methods: {
    /**
     * Go to an arbitrary page.
     *
     * If value of :page is outside the range of 1 - numPages, it's
     * clamped to the appropriate min/max value.
     */
    go(page) {
      // Clamp value between 1 and numPages.
      this.currentPage = Math.min(Math.max(page, 1), this.numPages);
    },

    /**
     * Go to the next page.
     *
     * If on the last page, stay on the last page.
     */
    next() {
      this.currentPage = Math.min(this.currentPage + 1, this.numPages)
    },

    /**
     * Go to the previous page.
     *
     * If on the first page, stay on the first page.
     */
    prev() {
      this.currentPage = Math.max(this.currentPage - 1, 1)
    },

    /**
     * Go to the first page.
     */
    first() {
      this.currentPage = 1
    },

    /**
     * Go to the last page.
     */
    last() {
      this.currentPage = this.numPages
    }
  },

  /**
   * This component has no real template. It's expected to wrap other components
   * or markup to provide transparent pagination behaviour.
   *
   * What follows is equivalent to <slot :page="..." :items="..."></slot> if this
   * component needed a template. Using render functions in this way isn't something
   * you do everyday, but can be useful from time to time.
   */
  render() {
    return h('div', [
      this.$slots.default({
        page: {
          current: this.currentPage,
          total: this.numPages,
          size: this.perPage,
          hasNext: this.hasNext,
          hasPrev: this.hasPrev,
          go: this.go,
          next: this.next,
          prev: this.prev,
          first: this.first,
          last: this.last
        },
        items: this.paginatedItems
      })
    ])
  }
}
</script>
