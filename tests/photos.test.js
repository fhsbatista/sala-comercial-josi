import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractPhotoUrlsFromHtml } from '../server/photos/extract.js'

describe('extractPhotoUrlsFromHtml', () => {
  it('extracts Redentora OCI gallery URLs from HTML', () => {
    const html = `
      <img src="https://axvliw1bcpyx.objectstorage.sa-vinhedo-1.oci.customer-oci.com/n/a/b/foto_/2021/12733/teste-0.jpg">
      <img data-src="https://axvliw1bcpyx.objectstorage.sa-vinhedo-1.oci.customer-oci.com/n/a/b/foto_/2021/12733/teste-1.jpg">
      <img src="/images/logo.png">
    `

    const urls = extractPhotoUrlsFromHtml(html)
    assert.equal(urls.length, 2)
    assert.match(urls[0], /teste-0\.jpg$/)
    assert.match(urls[1], /teste-1\.jpg$/)
  })

  it('ignores Cloudflare challenge pages', () => {
    const urls = extractPhotoUrlsFromHtml('<html>Just a moment...</html>')
    assert.deepEqual(urls, [])
  })
})