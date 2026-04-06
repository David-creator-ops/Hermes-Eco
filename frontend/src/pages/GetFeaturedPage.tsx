import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, ExternalLink, Copy, Check, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function GetFeaturedPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ resource_name: '', github_url: '', email: '', message: '' });
  const [wallet, setWallet] = useState(localStorage.getItem('featured_wallet') || '');
  const [price, setPrice] = useState(localStorage.getItem('featured_price') || '0');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/submit/featured')
      .then(r => r.json())
      .then(d => {
        if (d.data?.wallet) { setWallet(d.data.wallet); localStorage.setItem('featured_wallet', d.data.wallet); }
        if (d.data?.price) { setPrice(d.data.price); localStorage.setItem('featured_price', d.data.price); }
      });
  }, []);

  const copyWallet = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.resource_name || !form.github_url || !form.email) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/submit/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080808] pt-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-emerald-400">✓</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Request Received</h1>
          <p className="text-[14px] text-[#888] leading-relaxed mb-8">
            We&apos;ll review your {form.resource_name} and get back to you at {form.email}.
            Once payment is confirmed, your resource will be featured with a gold highlight across the registry.
          </p>
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-white text-[#0a0a0a] text-[13px] font-medium hover:bg-[#e8e8e8] transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-[#666] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-3 h-3" /> Back to registry
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Get Featured</h1>
          </div>
          <p className="text-[14px] text-[#666] leading-relaxed">
            Stand out from the crowd. Featured resources get a gold outline,
            a &quot;Featured&quot; badge, and premium placement across the registry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-medium text-white mb-5">Your Resource</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Resource Name</label>
                <input value={form.resource_name} onChange={e => setForm(f => ({ ...f, resource_name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors"
                  placeholder="My Awesome Agent" />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">GitHub URL</label>
                <input value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors"
                  placeholder="https://github.com/user/repo" />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors"
                  placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Message (optional)</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors resize-none"
                  placeholder="Tell us about your project..." />
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <span className="text-[12px] text-red-400">{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-10 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-amber-400">💳</span>
              <h3 className="text-[14px] font-medium text-white">Payment</h3>
            </div>

            <p className="text-[13px] text-[#888] mb-4 leading-relaxed">
              Send the featured fee via Solana USDC to the wallet below.
              After submitting, include your transaction hash in the message or email us.
            </p>

            {/* Featured benefits */}
            <div className="mb-6 space-y-2">
              {[
                'Gold outline badge on your resource card',
                'Featured tag visible in browse & search',
                'Stays in your normal category - still discoverable',
                'Permanent until you choose to remove it'
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs">✓</span>
                  <span className="text-[12px] text-[#999]">{b}</span>
                </div>
              ))}
            </div>

            {/* Wallet */}
            <div className="rounded-lg bg-[#111] border border-[#1a1a1a] p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#555]">Solana USDC · {price ? `${price} USDC` : ''}</span>
                <button onClick={copyWallet} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <code className="text-[11px] text-[#CCC] break-all font-mono">{wallet || 'Wallet not configured yet'}</code>
            </div>

            <a href="https://portalbridge.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-[12px] text-[#888] hover:text-amber-400 transition-colors">
              Send USDC on Solana <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
