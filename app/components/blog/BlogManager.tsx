'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Eye, FileText, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { blogDate, blogSlug, validateBlog, type BlogInput, type BlogPost } from '@/lib/blog';
import BlogContent from './BlogContent';
import BlogCover from './BlogCover';

const blankPost: BlogInput = { title: '', slug: '', excerpt: '', content: '', category: 'Guides', author_name: 'Sanatkar Editorial', cover_image_url: '', status: 'draft' };
const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-600';

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<BlogInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blogs?drafts=true', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setPosts([]);
        setError(result.message || 'Could not load blogs. Check your connection and try again.');
        return;
      }
      setPosts((result.posts || []) as BlogPost[]);
      setError('');
    } catch { setError('Could not load blogs. Check your connection and try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function open(post?: BlogPost) {
    setEditing(post?.id ?? null);
    setForm(post ? { title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, category: post.category, author_name: post.author_name, cover_image_url: post.cover_image_url, status: post.status } : { ...blankPost });
    setPreview(false);
    setNotice('');
    setError('');
  }

  function close() {
    if (saving || uploading) return;
    if (!window.confirm('Close the editor? Unsaved changes will be lost.')) return;
    setForm(null);
    setPreview(false);
  }

  function update<K extends keyof BlogInput>(key: K, value: BlogInput[K]) {
    setForm(current => current ? { ...current, [key]: value } : current);
  }

  async function uploadCover(file: File) {
    if (uploading || saving) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setNotice('');
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'blogs');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.urls) || !result.urls.length) {
        throw new Error(result.message || 'Upload failed');
      }
      update('cover_image_url', result.urls[0]);
      setNotice('Cover uploaded. Save the article to use this image.');
    } catch {
      setError('Could not upload the cover. Check your admin access and try again.');
    } finally { setUploading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form || saving || uploading) return;
    const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as BlogInput;
    const validation = validateBlog(input);
    if (validation) { setError(validation); return; }
    setSaving(true);
    setError('');
    try {
      const endpoint = editing ? `/api/blogs/${editing}` : '/api/blogs';
      const response = await fetch(endpoint, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, ...(editing ? { id: editing } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || 'Could not save the article. Check your admin access and try again.');
        return;
      }
      setForm(null);
      setNotice(input.status === 'published' ? 'Article published. It is now available on the blog page.' : 'Draft saved. Only administrators can see it.');
      await load();
    } catch { setError('Could not save the article. Please try again.'); }
    finally { setSaving(false); }
  }

  async function remove(post: BlogPost) {
    if (deleting || !window.confirm(`Permanently delete “${post.title}”?`)) return;
    setDeleting(post.id);
    setError('');
    try {
      const response = await fetch(`/api/blogs/${post.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Delete failed');
      setPosts(current => current.filter(item => item.id !== post.id));
      setNotice('Article deleted.');
    } catch { setError('Could not delete the article. Please try again.'); }
    finally { setDeleting(null); }
  }

  const visible = posts.filter(post => `${post.title} ${post.category} ${post.status}`.toLowerCase().includes(query.toLowerCase()));

  return <section>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Manage blogs</h2><p className="mt-1 text-sm text-slate-500">Create stories, save drafts, and publish to the Sanatkar journal.</p></div><div className="flex gap-3"><Link href="/blogs" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-teal-700">View blogs</Link>{!form && <button onClick={() => open()} className="inline-flex items-center gap-2 rounded-xl bg-[#12343a] px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> New article</button>}</div></div>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{!form && <button onClick={() => void load()} className="ml-3 underline">Retry</button>}</div>}
    {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
    {form ? <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between"><h3 className="text-lg font-bold">{editing ? 'Edit article' : 'Create an article'}</h3><button type="button" onClick={close} disabled={saving || uploading} aria-label="Close editor" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>
      <fieldset disabled={saving || uploading} className="space-y-5 disabled:opacity-60">
        <label className="block text-sm font-bold">Title<input required maxLength={180} value={form.title} onChange={event => { const title = event.target.value; setForm(current => current ? { ...current, title, slug: !editing && (!current.slug || current.slug === blogSlug(current.title)) ? blogSlug(title) : current.slug } : current); }} className={fieldClass} placeholder="Give your story a great headline" /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">URL slug<input required maxLength={160} value={form.slug} onChange={event => update('slug', event.target.value)} className={fieldClass} /><span className="mt-1 block break-all text-xs font-normal text-slate-400">/blogs/{form.slug || 'your-article'}{editing ? ' — Changing this changes the article link.' : ''}</span></label><label className="block text-sm font-bold">Author<input required maxLength={100} value={form.author_name} onChange={event => update('author_name', event.target.value)} className={fieldClass} /></label></div>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">Category<input required maxLength={60} list="blog-categories" value={form.category} onChange={event => update('category', event.target.value)} className={fieldClass} /><datalist id="blog-categories">{['Guides', 'Maintenance', 'Industry insights', 'Stories'].map(item => <option key={item} value={item} />)}</datalist></label><label className="block text-sm font-bold">Visibility<select value={form.status} onChange={event => update('status', event.target.value as BlogInput['status'])} className={fieldClass}><option value="draft">Draft — only administrators</option><option value="published">Published — visible to everyone</option></select></label></div>
        <label className="block text-sm font-bold">Short description<textarea required maxLength={320} rows={3} value={form.excerpt} onChange={event => update('excerpt', event.target.value)} className={fieldClass} placeholder="A short introduction for the blog cards and search results." /><span className="text-xs font-normal text-slate-400">{form.excerpt.length}/320 characters</span></label>
        <div className="space-y-3">
          <label className="block text-sm font-bold">Cover image <span className="font-normal text-slate-400">(optional)</span>
            <span className="mt-2 flex items-center gap-2 text-xs font-normal text-slate-500"><Upload size={16} /> {uploading ? 'Uploading cover...' : 'Upload a JPEG, PNG, or WebP image, up to 5 MB.'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadCover(file); }} className={fieldClass} />
          </label>
          <label className="block text-sm font-bold" htmlFor="blog-cover-url">Or use an image URL or local uploads path</label>
          <input id="blog-cover-url" type="text" value={form.cover_image_url} onChange={event => update('cover_image_url', event.target.value)} className={fieldClass} placeholder="https://example.com/image.jpg or /uploads/blogs/image.jpg" />
          <p className="text-xs text-slate-400">Use a public HTTPS image URL or a local /uploads/ path. A branded cover appears when no image is provided.</p>
          {form.cover_image_url && <div className="max-w-sm"><BlogCover src={form.cover_image_url} title={form.title} className="aspect-[16/9] rounded-xl" /><button type="button" onClick={() => update('cover_image_url', '')} className="mt-2 text-xs font-bold text-red-500">Remove cover from article</button></div>}
        </div>
        <div><div className="flex items-center justify-between"><label htmlFor="blog-content" className="text-sm font-bold">Article content</label><button type="button" onClick={() => setPreview(current => !current)} className="inline-flex items-center gap-1 text-sm font-bold text-teal-700"><Eye size={16} /> {preview ? 'Hide preview' : 'Preview article'}</button></div><p id="blog-content-help" className="mt-2 text-xs leading-5 text-slate-500">Separate paragraphs with a blank line. Use ## for section headings, ### for subheadings, and - for bullet points. Put a blank line before and after headings and lists.</p><textarea id="blog-content" aria-describedby="blog-content-help" required maxLength={60000} rows={16} value={form.content} onChange={event => update('content', event.target.value)} className={`${fieldClass} leading-7`} placeholder={'Start your story here…\n\n## A useful heading\n\nShare your advice.'} /></div>
        {preview && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8"><p className="mb-5 text-xs font-bold uppercase tracking-widest text-teal-700">Article preview</p><BlogCover src={form.cover_image_url} title={form.title} className="mb-6 aspect-[16/9] max-h-72 rounded-xl" /><h2 className="mb-3 text-3xl font-bold">{form.title || 'Your article title'}</h2><p className="mb-7 text-lg text-slate-500">{form.excerpt}</p><BlogContent content={form.content} /></div>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={close} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={17} />{uploading ? 'Uploading...' : saving ? 'Saving…' : form.status === 'published' ? 'Publish article' : 'Save draft'}</button></div>
      </fieldset>
    </form> : <>
      <label className="mb-5 block max-w-md"><span className="sr-only">Search blog posts</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles, categories, or status…" className={fieldClass} /></label>
      {loading ? <p role="status" className="py-12 text-center text-slate-500">Loading articles…</p> : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><FileText className="mx-auto mb-4 text-teal-700" size={32} /><p className="font-bold">{query ? 'No matching articles' : 'Your journal starts here'}</p><p className="mt-2 text-sm text-slate-500">{query ? 'Try a different search.' : 'Create your first article and share it with the community.'}</p></div> : <div className="space-y-3">{visible.map(post => <div key={post.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{post.status}</span><h3 className="mt-3 truncate font-bold">{post.title}</h3><p className="mt-1 text-xs text-slate-500">{post.category} · {post.author_name} · {blogDate(post.created_at)}</p></div><div className="flex shrink-0 items-center gap-2">{post.status === 'published' && <Link href={`/blogs/${post.slug}`} className="rounded-lg px-3 py-2 text-sm font-bold text-teal-700">View</Link>}<button onClick={() => open(post)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold">Edit</button><button disabled={Boolean(deleting)} onClick={() => void remove(post)} aria-label={`Delete ${post.title}`} className="rounded-lg p-2 text-red-500 disabled:opacity-40"><Trash2 size={18} /></button></div></div>)}</div>}
    </>}
  </section>;
}
