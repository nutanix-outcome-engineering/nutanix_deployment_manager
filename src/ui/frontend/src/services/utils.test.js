import * as utils from './utils'

describe('Match Expression', () => {
  describe('Simple values', () => {
    it.each([
      ['apple', true],
      ['onion', false],
      ['orange', true],
      ['potato', false]
    ])('%s is a fruit? %s', (subject, expected) => {
      const isFruit = utils.match(subject, {
        'apple': true,
        'onion': false,
        'orange': true,
        'potato': false
      })

      expect(isFruit).toBe(expected)
    })
  })

  describe('Function values', () => {
    it.each([
      ['apple', true],
      ['onion', false],
      ['orange', true],
      ['potato', false]
    ])('%s is a fruit? %s', (subject, expected) => {
      const isFruit = utils.match(subject, {
        'apple': () => true,
        'onion': () => false,
        'orange': () => true,
        'potato': () => false
      })

      expect(isFruit).toBe(expected)
    })
  })
})
