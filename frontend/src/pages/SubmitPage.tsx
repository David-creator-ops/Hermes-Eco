import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Github, FileCode, ExternalLink } from 'lucide-react';

const TYPES = [
  { value: 'agent', label: 'Agent', icon: '🤖' },
  { value: 'skill', label: 'Skill', icon: '🛠️' },
  { value: 'tool', label: 'Tool', icon: '🔧' },
  { value: 'integration', label: 'Integration', icon: '🔌' },
  { value: 'workflow', label: 'Workflow', icon: '⚙️' },
  { value: 'memory-system', label: 'Memory System', icon: '🧠' },
  { value: 'model-config', label: 'Model Config', icon: '🎯' },
  { value: 'router', label: 'Router', icon: '🔄' },
];

const CATEGORIES = [
  { value: 'data_analysis', label: '📊 Data & Analysis' },
  { value: 'automation', label: '⚡ Automation' },
  { value: 'code_development', label: '💻 Code & Development' },
  { value: 'web_browser', label: '🌐 Web & Browser' },
  { value: 'content_writing', label: '✍️ Content & Writing' },
  { value: 'devops', label: '🔧 DevOps' },
  { value: 'communication', label: '💬 Communication' },
  { value: 'security', label: '🔐 Security' },
  { value: 'ai_ml', label: '🧪 AI & ML' },
  { value: 'research', label: '🔍 Research' },
  { value: 'enterprise', label: '🏢 Enterprise' },
  { value: 'creative', label: '🎨 Creative' },
];

export function SubmitPage() {
  const [tab, setTab] = useState<'json' | 'form'>('json');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-20">
      <Link to="/" className="text-[12px] text-[#555] hover:text-white flex items-center gap-1 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Add Your Resource</h1>
        <p className="text-[13px] text-[#707070]">Pick the method that works best for you.</p>
      </div>

      <div className="flex bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-1 mb-8">
        <button onClick={() => setTab('json')}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all ${
            tab === 'json' ? 'bg-[#151515] text-white' : 'text-[#666] hover:text-[#999]'
          }`}>
          <Github className="w-4 h-4" /> Add via GitHub
        </button>
        <button onClick={() => setTab('form')}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-medium transition-all ${
            tab === 'form' ? 'bg-[#151515] text-white' : 'text-[#666] hover:text-[#999]'
          }`}>
          <FileCode className="w-4 h-4" /> Web Form
        </button>
      </div>

      {tab === 'json' ? <GitHubMethod /> : <WebFormMethod />}
    </div>
  );
}

/* ── Method 2: GitHub JSON ── */
function GitHubMethod() {
  const [copied, setCopied] = useState(false);

  const jsonContent = `{
  "name": "Web Scraper Agent",
  "type": "agent",
  "primary_category": "web_browser",
  "description": "Scrapes websites and extracts data automatically",
  "author": "your_username",
  "repository": "https://github.com/your/repo",
  "license": "MIT",
  "complexity": "intermediate",
  "deployment": "local",
  "tags": ["web", "scraping", "data-extraction"],
  "hermes_version": ">=1.0.0"
}`;

  const commands = [
    { step: '1', label: 'Create .hermes-eco.json in your repo root', code: 'touch .hermes-eco.json' },
    { step: '2', label: 'Add the file to git and commit', code: 'git add .hermes-eco.json && git commit -m "Add to Hermes Eco"' },
    { step: '3', label: 'Push to GitHub — done!', code: 'git push' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5">
        <p className="text-[13px] text-[#c4b5fd] leading-relaxed">
          <strong className="text-white">Recommended for developers.</strong> Just add a single JSON file to your repository.
          Our crawler finds it automatically and lists your resource within 24 hours.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-medium text-white">Step 1 — Create <code className="text-[#a78bfa]">.hermes-eco.json</code></h3>
          <button onClick={() => { navigator.clipboard.writeText(jsonContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-white px-2.5 py-1 rounded-md bg-[#151515] border border-[#222] transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
        <pre className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-4 text-[12px] text-[#888] font-mono overflow-x-auto whitespace-pre leading-relaxed">{jsonContent}</pre>
      </div>

      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-white">Steps 2-3 — Commit & Push</h3>
        {commands.map(c => (
          <div key={c.step} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px] font-semibold text-[#7c3aed]">{c.step}</span>
            </div>
            <div className="pt-0.5">
              <p className="text-[12px] text-[#888] mb-1">{c.label}</p>
              <code className="text-[12px] text-[#a78bfa] bg-[#080808] border border-[#1a1a1a] px-2 py-1 rounded-md inline-block font-mono">{c.code}</code>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
        <h4 className="text-[12px] font-medium text-white mb-2">What happens next?</h4>
        <ul className="text-[12px] text-[#666] space-y-1.5">
          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> Our crawler scans new and updated repos daily</li>
          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> Your resource is auto-verified (8-point check)</li>
          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /> If valid, it&apos;s listed on Hermes Eco within 24h</li>
        </ul>
      </div>

      <a
        href="https://github.com/NousResearch/hermes-agent"
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors"
      >
        <Github className="w-4 h-4" /> View on GitHub <ExternalLink className="w-3 h-3 ml-1" />
      </a>
    </div>
  );
}

/* ── Method 3: Web Form ── */
function WebFormMethod() {
  const [form, setForm] = useState({
    name: '', type: 'agent', primary_category: '', description: '',
    author: '', repository: '', license: 'MIT', complexity: '', deployment: '', tags: '', hermes_version: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.repository || !form.description || form.description.length < 20) {
      setError('Please fill in all required fields. Description must be at least 20 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Submission Received!</h2>
        <p className="text-[13px] text-[#888] mb-6">Your resource will be verified and listed within 24 hours.</p>
        <button onClick={() => { setSubmitted(false); setError(''); setForm({ name: '', type: 'agent', primary_category: '', description: '', author: '', repository: '', license: 'MIT', complexity: '', deployment: '', tags: '', hermes_version: '' }); }}
          className="text-[#7c3aed] text-[13px] hover:text-[#a78bfa] transition-colors">
          Submit another resource →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
        <p className="text-[13px] text-[#888] leading-relaxed">
          Don&apos;t want to use Git? Fill out this form and we&apos;ll add your resource to the review queue.
        </p>
      </div>

      <Field label="Resource Name" required>
        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g., Web Scraper Agent"
          className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
      </Field>

      <Field label="Type" required>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => update('type', t.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-[11px] ${
                form.type === t.value ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-white' : 'bg-[#0d0d0d] border-[#1a1a1a] text-[#888] hover:border-[#333]'
              }`}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Category">
        <select value={form.primary_category} onChange={e => update('primary_category', e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white focus:outline-none focus:border-[#7c3aed]/40 transition-colors appearance-none">
          <option value="">Select a category...</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-[#111]">{c.label}</option>)}
        </select>
      </Field>

      <Field label="GitHub Repository" required>
        <input type="url" value={form.repository} onChange={e => update('repository', e.target.value)} placeholder="https://github.com/user/repo"
          className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
      </Field>

      <Field label="Description" required hint="At least 20 characters">
        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
          placeholder="What does your resource do?"
          className="w-full px-3 py-2.5 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors resize-none" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="GitHub Username">
          <input type="text" value={form.author} onChange={e => update('author', e.target.value)} placeholder="your_username"
            className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
        </Field>
        <Field label="License">
          <select value={form.license} onChange={e => update('license', e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-[#888] focus:outline-none focus:border-[#7c3aed]/40 transition-colors">
            <option value="MIT" className="bg-[#111]">MIT</option>
            <option value="Apache-2.0" className="bg-[#111]">Apache 2.0</option>
            <option value="GPL-3.0" className="bg-[#111]">GPL 3.0</option>
            <option value="BSD-3-Clause" className="bg-[#111]">BSD 3</option>
            <option value="Unlicense" className="bg-[#111]">Unlicense</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Complexity">
          <select value={form.complexity} onChange={e => update('complexity', e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-[#888] focus:outline-none focus:border-[#7c3aed]/40 transition-colors">
            <option value="">Select...</option>
            <option value="beginner" className="bg-[#111]">Beginner</option>
            <option value="intermediate" className="bg-[#111]">Intermediate</option>
            <option value="advanced" className="bg-[#111]">Advanced</option>
          </select>
        </Field>
        <Field label="Deployment">
          <select value={form.deployment} onChange={e => update('deployment', e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-[#888] focus:outline-none focus:border-[#7c3aed]/40 transition-colors">
            <option value="">Select...</option>
            <option value="local" className="bg-[#111]">Local</option>
            <option value="cloud" className="bg-[#111]">Cloud</option>
            <option value="hybrid" className="bg-[#111]">Hybrid</option>
            <option value="docker" className="bg-[#111]">Docker</option>
          </select>
        </Field>
      </div>

      <Field label="Tags" hint="Comma separated">
        <input type="text" value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="web, scraping, data-extraction"
          className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
      </Field>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
          <span className="text-[12px] text-red-400">{error}</span>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full h-10 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? 'Submitting...' : 'Submit Resource'}
      </button>
    </form>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[12px] font-medium text-[#CCC]">{label}</label>
        {required && <span className="text-red-400 text-[10px]">*</span>}
        {hint && <span className="text-[#555] text-[10px]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
