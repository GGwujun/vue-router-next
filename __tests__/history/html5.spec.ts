import { JSDOM } from 'jsdom'
import { createWebHistory } from '../../src/history/html5'
import { createDom } from '../utils'

// override the value of isBrowser because the variable is created before JSDOM
// is created
jest.mock('../../src/utils/env', () => ({
  isBrowser: true,
}))

// These unit tests are supposed to tests very specific scenarios that are easier to setup
// on a unit test than an e2e tests
describe('History HTMl5', () => {
  let dom: JSDOM
  beforeAll(() => {
    dom = createDom()
  })

  afterAll(() => {
    dom.window.close()
  })

  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (let element of Array.from(document.getElementsByTagName('base')))
      element.remove()
  })

  it('handles a basic base', () => {
    expect(createWebHistory().base).toBe('')
    expect(createWebHistory('/').base).toBe('')
    expect(createWebHistory('/#').base).toBe('/#')
    expect(createWebHistory('#!').base).toBe('#!')
    expect(createWebHistory('#other').base).toBe('#other')
  })

  it('handles a base tag', () => {
    const baseEl = document.createElement('base')
    baseEl.href = '/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/foo')
  })

  it('handles a base tag with origin', () => {
    const baseEl = document.createElement('base')
    baseEl.href = 'https://example.com/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/foo')
  })

  it('handles a base tag with origin without trailing slash', () => {
    const baseEl = document.createElement('base')
    baseEl.href = 'https://example.com/bar'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/bar')
  })

  it('ignores base tag if base is provided', () => {
    const baseEl = document.createElement('base')
    baseEl.href = '/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory('/bar/').base).toBe('/bar')
  })

  it('handles a non-empty base', () => {
    expect(createWebHistory('/foo/').base).toBe('/foo')
    expect(createWebHistory('/foo').base).toBe('/foo')
  })

  it('handles a single hash base', () => {
    expect(createWebHistory('#').base).toBe('#')
    expect(createWebHistory('#/').base).toBe('#')
    expect(createWebHistory('#!/').base).toBe('#!')
    expect(createWebHistory('#other/').base).toBe('#other')
  })

  it('handles a non-empty hash base', () => {
    expect(createWebHistory('#/bar').base).toBe('#/bar')
    expect(createWebHistory('#/bar/').base).toBe('#/bar')
    expect(createWebHistory('#!/bar/').base).toBe('#!/bar')
    expect(createWebHistory('#other/bar/').base).toBe('#other/bar')
  })

  it('prepends the host to support // urls', () => {
    let history = createWebHistory()
    let spy = jest.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'https://example.com/foo'
    )
    history.push('//foo')
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(String),
      'https://example.com//foo'
    )
    spy.mockRestore()
  })

  it('calls push with hash part of the url with a base', () => {
    dom.reconfigure({ url: 'file:///usr/etc/index.html' })
    let history = createWebHistory('#')
    let spy = jest.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      '#/foo'
    )
    spy.mockRestore()
  })

  it('works with something after the hash in the base', () => {
    dom.reconfigure({ url: 'file:///usr/etc/index.html' })
    let history = createWebHistory('#something')
    let spy = jest.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      '#something/foo'
    )
    spy.mockRestore()
  })

  it('works with ! or others after the hash in the base', () => {
    dom.reconfigure({ url: 'file:///usr/etc/index.html' })
    let history = createWebHistory('#!')
    let spy = jest.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      '#!/foo'
    )
    spy.mockRestore()
  })

  it('works with  other excepting ! after the hash in the base', () => {
    dom.reconfigure({ url: 'file:///usr/etc/index.html' })
    let history = createWebHistory('#other')
    let spy = jest.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      '#other/foo'
    )
    spy.mockRestore()
  })
})
