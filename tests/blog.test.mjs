import test from 'node:test';
import assert from 'node:assert/strict';
import { blogSlug, validateBlog, readingTime, blogDate } from '../lib/blog.ts';

const valid = {
  title: 'Choosing a machine', slug: 'choosing-a-machine', excerpt: 'A practical buying guide.',
  content: 'Check the specifications before buying.', category: 'Guides', author_name: 'Sanatkar',
  cover_image_url: '', status: 'draft',
};

test('slugs support English and Urdu while removing URL punctuation', () => {
  assert.equal(blogSlug('  A Buyer’s Guide: 2026!  '), 'a-buyer-s-guide-2026');
  assert.equal(blogSlug('مشین خریدنے کی گائیڈ'), 'مشین-خریدنے-کی-گائیڈ');
  assert.ok(blogSlug('Long title '.repeat(40)).length <= 160);
  assert.ok(!blogSlug('Long title '.repeat(40)).endsWith('-'));
});

test('valid drafts and published articles pass validation', () => {
  assert.equal(validateBlog(valid), null);
  assert.equal(validateBlog({ ...valid, status: 'published', cover_image_url: 'https://example.com/cover.jpg' }), null);
  assert.equal(validateBlog({ ...valid, cover_image_url: '/uploads/blogs/cover-image.png' }), null);
});

test('rejects missing required content and excessive lengths', () => {
  for (const key of ['title', 'slug', 'excerpt', 'content', 'category', 'author_name']) {
    assert.ok(validateBlog({ ...valid, [key]: '  ' }), key);
  }
  assert.ok(validateBlog({ ...valid, title: 'a'.repeat(181) }));
  assert.ok(validateBlog({ ...valid, content: 'a'.repeat(60001) }));
});

test('rejects unsafe image URLs, invalid slugs, and invalid visibility', () => {
  for (const cover_image_url of ['javascript:alert(1)', 'data:image/svg+xml,test', 'http://example.com/a.jpg', 'not-a-url', '/uploads/../private.jpg']) {
    assert.ok(validateBlog({ ...valid, cover_image_url }));
  }
  assert.ok(validateBlog({ ...valid, slug: '../private' }));
  assert.ok(validateBlog({ ...valid, status: 'unknown' }));
});

test('reading time has a one minute minimum and dates are stable across time zones', () => {
  assert.equal(readingTime(''), 1);
  assert.equal(readingTime('word '.repeat(201)), 2);
  assert.equal(blogDate('2026-10-01T00:00:00Z'), 'Oct 1, 2026');
});
