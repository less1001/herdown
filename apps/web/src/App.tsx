import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Sparkles,
  Zap,
  Key,
  Terminal,
  Cpu,
  Globe,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Camera,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

interface ParseResponse {
  success: boolean;
  title: string;
  markdown: string;
  images: string[];
  platform: 'wechat' | 'xiaohongshu' | 'zhihu' | 'twitter' | 'wikipedia' | 'general';
  elapsed_ms: number;
  message?: string;
}

interface ApiKeyItem {
  key: string;
  name: string;
  status: string;
  created_at: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'crawl' | 'keys' | 'mcp' | 'cli' | 'extension'>('converter');
  const [inputUrl, setInputUrl] = useState('');
  const [inputHtml, setInputHtml] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [zhihuLimit, setZhihuLimit] = useState<number>(5);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [outputTab, setOutputTab] = useState<'preview' | 'source' | 'images'>('preview');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  // Usage stats state
  const [stats, setStats] = useState({ today_requests: 0, daily_quota: 100000, active_keys: 0 });

  useEffect(() => {
    fetchKeys();
    fetchStats();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/v1/keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/v1/usage');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadZip = async () => {
    if (!crawlResult || !crawlResult.results || !crawlResult.results.length) {
      alert('无可打包的页面内容！');
      return;
    }
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      crawlResult.results.forEach((item: any, idx: number) => {
        // Create safe file name
        const safeTitle = (item.title || `Page_${idx + 1}`)
          .replace(/[/\\?%*:|"<>]/g, '_')
          .trim();
        
        // Combine frontmatter + title + markdown body
        const content = `---\ntitle: "${(item.title || '').replace(/"/g, '\\"')}"\nsource_url: "${item.url}"\n---\n\n# ${item.title}\n\n${item.markdown}`;
        
        zip.file(`${safeTitle}.md`, content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanDomain = crawlResult.domain.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Herdown_Crawl_${cleanDomain}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      alert('打包压缩 ZIP 失败，请稍后重试！');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleParse = async () => {
    if (inputMode === 'url' && !inputUrl.trim()) return;
    if (inputMode === 'html' && !inputHtml.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const activeUserKey = apiKeys.find(k => k.status === 'active')?.key;

      const res = await fetch('/v1/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeUserKey ? { 'Authorization': `Bearer ${activeUserKey}` } : {}),
        },
        body: JSON.stringify({
          url: inputMode === 'url' ? inputUrl.trim() : undefined,
          html: inputMode === 'html' ? inputHtml : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '转换失败，请检查网址或频控限制');
      } else {
        setResult(data);
        fetchStats();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '网络请求异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawlLoading(true);
    setCrawlResult(null);
    try {
      const res = await fetch('/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl.trim(), limit: 5 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrawlResult(data);
      }
    } catch {
      // ignore
    } finally {
      setCrawlLoading(false);
    }
  };

  const handleStripeCheckout = async (plan: 'pro' | 'team' | 'onetime') => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('Stripe 订阅链接生成失败');
      }
    } catch {
      alert('Stripe 订阅通道初始化失败');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await fetch('/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        setNewKeyName('');
        await fetchKeys();
        await fetchStats();
      }
    } catch {
      // ignore
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (key: string) => {
    try {
      const res = await fetch(`/v1/keys/${key}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      }
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = () => {
    if (!result?.markdown) return;
    navigator.clipboard.writeText(result.markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result?.markdown) return;
    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(result.title || 'article').replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fillPreset = (url: string) => {
    setInputMode('url');
    setInputUrl(url);
  };

  const activeApiKeySample = apiKeys.find(k => k.status === 'active')?.key || 'sk_live_YOUR_API_KEY';

  return (
    <div className="min-h-screen bg-[#070a0e] text-[#e2e8f0] font-sans antialiased selection:bg-[#0f6b4f] selection:text-white flex flex-col">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070a0e]/80 border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0f6b4f] to-[#10b981] p-[1px] shadow-lg shadow-[#0f6b4f]/20">
              <div className="w-full h-full bg-[#090d12] rounded-[11px] flex items-center justify-center font-bold text-emerald-400 font-mono text-base">
                HD
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                Herdown
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111823] p-1 rounded-xl border border-[#1e293b]">
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'converter'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              单页转换
            </button>
            <button
              onClick={() => setActiveTab('crawl')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'crawl'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              全站爬取
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'keys'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              API
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'mcp'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              MCP
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'cli'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              CLI
            </button>
            <button
              onClick={() => setActiveTab('extension')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'extension'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              🧩 浏览器插件
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              升级 Stripe Pro
            </button>
            <a
              href="https://github.com/less1001/herdown"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-[#111823] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="GitHub 源码"
            >
              <Code2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* TAB 1: Single Page Converter */}
        {activeTab === 'converter' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                支持微信/小红书/知乎全网提取 + 全站 Sitemap 递归爬取
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-normal">
                给 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">AI Agent</span> 用的干净 <span className="inline-block">Markdown 入口</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                微信公众号、小红书笔记、知乎专栏/回答、X/Twitter 及通用网页。
                <br className="hidden sm:block" />
                2ms 极速解析，零存储隐私安全。
              </p>
              
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-xs text-slate-500 font-medium">快速体验示例：</span>
                <button
                  onClick={() => fillPreset('https://mp.weixin.qq.com/s/sample_article')}
                  className="px-2.5 py-1 rounded-md bg-[#111823] border border-[#1e293b] text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                >
                  🟢 微信贴图长文
                </button>
                <button
                  onClick={() => fillPreset('https://www.xiaohongshu.com/explore/sample_note')}
                  className="px-2.5 py-1 rounded-md bg-[#111823] border border-[#1e293b] text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                >
                  🔴 小红书图文笔记
                </button>
                <button
                  onClick={() => fillPreset('https://zhuanlan.zhihu.com/p/sample_zhihu')}
                  className="px-2.5 py-1 rounded-md bg-[#111823] border border-[#1e293b] text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                >
                  🔵 知乎 问答
                </button>
              </div>
            </div>

            {/* Input Card */}
            <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInputMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      inputMode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    网页 URL 链接转换
                  </button>
                  <button
                    onClick={() => setInputMode('html')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      inputMode === 'html' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    直接粘贴 HTML 源码
                  </button>
                </div>
              </div>

              {inputMode === 'url' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="粘贴网页 URL..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <button
                    onClick={handleParse}
                    disabled={loading || !inputUrl.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                    {loading ? '正在解析中...' : '转换为 Markdown'}
                  </button>
                  {inputUrl.includes('zhihu.com/question/') && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 animate-fadeIn">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Layers className="w-3.5 h-3.5" /> 检测到知乎问答
                      </span>
                      <span className="text-slate-400">选择提取回答数：</span>
                      <select
                        value={zhihuLimit}
                        onChange={(e) => setZhihuLimit(Number(e.target.value))}
                        className="bg-[#090d12] border border-[#1e293b] text-emerald-300 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                      >
                        <option value={5}>默认精选 Top 5 高赞回答</option>
                        <option value={10}>Top 10 高赞回答</option>
                        <option value={20}>Top 20 高赞回答</option>
                        <option value={50}>Top 50 详细回答</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={inputHtml}
                    onChange={(e) => setInputHtml(e.target.value)}
                    placeholder="在此粘贴包含 HTML 源码的文本..."
                    className="w-full p-4 rounded-xl bg-[#090d12] border border-[#1e293b] text-xs font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleParse}
                      disabled={loading || !inputHtml.trim()}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-sm text-white shadow-lg flex items-center gap-2 transition"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      解析 HTML 源码
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Result Area */}
            {result && (
              <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl space-y-0">
                <div className="bg-[#111823] px-6 py-4 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {result.platform}
                    </span>
                    <h2 className="text-base font-bold text-white max-w-xl truncate" title={result.title}>
                      {result.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono mr-2">
                      ⚡ {result.elapsed_ms}ms
                    </span>
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                    >
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMd ? '已复制' : '复制结果'}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载 .md
                    </button>
                  </div>
                </div>

                <div className="px-6 py-2 bg-[#0d131c] border-b border-[#1e293b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOutputTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'preview' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      渲染预览
                    </button>
                    <button
                      onClick={() => setOutputTab('source')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'source' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Markdown 源码
                    </button>
                    <button
                      onClick={() => setOutputTab('images')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'images' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      提取图片 ({result.images.length})
                    </button>
                  </div>
                </div>

                <div className="p-6 min-h-[320px] max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#090d12]">
                  {outputTab === 'source' && (
                    <textarea
                      readOnly
                      value={result.markdown}
                      className="w-full h-[400px] bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  )}

                  {outputTab === 'preview' && (
                    <div className="prose prose-invert prose-emerald max-w-none font-sans text-sm space-y-4">
                      {result.markdown.split('\n\n').map((block, idx) => {
                        if (block.startsWith('# ')) {
                          return <h1 key={idx} className="text-xl font-bold text-white">{block.slice(2)}</h1>;
                        }
                        if (block.startsWith('## ')) {
                          return <h2 key={idx} className="text-lg font-bold text-white border-b border-[#1e293b] pb-1">{block.slice(3)}</h2>;
                        }
                        if (block.startsWith('![')) {
                          const urlMatch = /\]\((.*?)\)/.exec(block);
                          if (urlMatch?.[1]) {
                            return (
                              <div key={idx} className="my-3 rounded-xl overflow-hidden border border-[#1e293b] bg-[#111823] p-2 inline-block max-w-md">
                                <img src={urlMatch[1]} alt="Extracted" className="rounded-lg max-h-80 object-cover" />
                              </div>
                            );
                          }
                        }
                        return <p key={idx} className="text-slate-300 leading-relaxed">{block}</p>;
                      })}
                    </div>
                  )}

                  {outputTab === 'images' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {result.images.length === 0 ? (
                        <p className="col-span-full text-slate-500 text-center py-8">本文未提取到独立图片</p>
                      ) : (
                        result.images.map((imgUrl, idx) => (
                          <div key={idx} className="group relative bg-[#111823] border border-[#1e293b] rounded-xl overflow-hidden p-2">
                            <img src={imgUrl} alt={`Img ${idx}`} className="w-full h-36 object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-600 text-white"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Full Site Crawl */}
        {activeTab === 'crawl' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-emerald-400" />
                全站 Sitemap 递归 Crawl 引擎
              </h2>
              <p className="text-slate-400 text-xs mt-1">输入域名或 sitemap.xml 链接，自动递归并发提取全站子页面 Markdown 列表</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="输入目标域名（如 https://docs.example.com 或 https://example.com/sitemap.xml）"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCrawl}
                  disabled={crawlLoading || !crawlUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold text-white flex items-center gap-2 transition"
                >
                  {crawlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  {crawlLoading ? '递归抓取中...' : '开始全站 Crawl'}
                </button>
              </div>

              {crawlResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#1e293b] pb-2">
                    <span>域名: <strong className="text-white">{crawlResult.domain}</strong></span>
                    <div className="flex items-center gap-3">
                      <span>批量抓取页面: <strong className="text-emerald-400">{crawlResult.total_pages} 页</strong> (耗时 {crawlResult.elapsed_ms}ms)</span>
                      <button
                        onClick={handleDownloadZip}
                        disabled={downloadingZip}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                      >
                        {downloadingZip ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {downloadingZip ? '正在打包...' : '💾 一键打包下载全站 Markdown (.zip)'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {crawlResult.results.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate max-w-md">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{item.url}</span>
                        </div>
                        <pre className="p-2 rounded bg-[#111823] font-mono text-[11px] text-slate-400 max-h-24 overflow-hidden">
                          {item.markdown.slice(0, 200)}...
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: API Keys & Pricing Modal trigger */}
        {activeTab === 'keys' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">API 密钥控制台</h2>
                <p className="text-slate-400 text-xs mt-1">生成与管理专属 API Key (突破匿名 IP 限制)</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <CreditCard className="w-4 h-4" />
                Stripe 一键升级配额
              </button>
            </div>

            {/* Usage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">今日解析请求</span>
                <p className="text-2xl font-extrabold text-white mt-1">{stats.today_requests} 次</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">每日可用配额 (Quota)</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.daily_quota.toLocaleString()} 次</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">已生效 API Key</span>
                <p className="text-2xl font-extrabold text-white mt-1">{apiKeys.filter(k => k.status === 'active').length} 个</p>
              </div>
            </div>

            {/* Key Creator */}
            <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b] flex items-center gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="输入 Key 名称 (如: Claude Agent / Cursor Pro)"
                className="flex-1 px-4 py-2 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCreateKey}
                disabled={creatingKey || !newKeyName.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                生成新 Key
              </button>
            </div>

            {/* Keys Table */}
            <div className="bg-[#0f1722] border border-[#1e293b] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111823] border-b border-[#1e293b] text-[11px] font-semibold text-slate-400 uppercase">
                    <th className="p-4">Key 名称</th>
                    <th className="p-4">API 密钥 Token</th>
                    <th className="p-4">创建时间</th>
                    <th className="p-4">状态</th>
                    <th className="p-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-xs">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        尚无活跃 API Key，点击上方“生成新 Key”创建专属密钥
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#111823]/50 transition">
                        <td className="p-4 font-semibold text-white">{item.name}</td>
                        <td className="p-4 font-mono text-emerald-400">
                          {item.key.slice(0, 10)}****************
                        </td>
                        <td className="p-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.key);
                              setCopiedKeyIndex(idx);
                              setTimeout(() => setCopiedKeyIndex(null), 2000);
                            }}
                            className="px-2 py-1 rounded bg-[#1e293b] text-slate-300 hover:text-white"
                          >
                            {copiedKeyIndex === idx ? '已复制' : '复制 Token'}
                          </button>
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleRevokeKey(item.key)}
                              className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            >
                              撤销
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MCP & Advanced REST API Documentation */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">远程 MCP & REST 高级 API 指南</h2>
              <p className="text-slate-400 text-xs mt-1">支持全站 Crawl、网页截图 Screenshot、RAG Vector 分块及 MCP 协议</p>
            </div>

            {/* MCP Integration Card */}
            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">1. 远程 MCP 端点配置 (Anthropic MCP Standard)</h3>
              </div>
              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "herdown": {
      "command": "npx",
      "args": ["-y", "@herdown/mcp", "https://api.herdown.com/mcp"],
      "env": {
        "HERDOWN_API_KEY": "${activeApiKeySample}"
      }
    }
  }
}`}
              </pre>
            </div>

            {/* Advanced Endpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b] space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  全站 Crawl API (<code className="text-emerald-400">POST /v1/crawl</code>)
                </h4>
                <pre className="p-3 rounded-lg bg-[#090d12] font-mono text-[11px] text-slate-300 overflow-x-auto">
{`curl -X POST "https://api.herdown.com/v1/crawl" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/sitemap.xml"}'`}
                </pre>
              </div>

              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b] space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  网页截图 API (<code className="text-emerald-400">POST /v1/screenshot</code>)
                </h4>
                <pre className="p-3 rounded-lg bg-[#090d12] font-mono text-[11px] text-slate-300 overflow-x-auto">
{`curl -X POST "https://api.herdown.com/v1/screenshot" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://mp.weixin.qq.com/s/xxx"}'`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">npx @herdown/cli 命令行工具</h2>
              <p className="text-slate-400 text-xs mt-1">无需全局安装，在终端一键抓取并生成干净 Markdown</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto">
{`# 在终端直接打印 Markdown
npx @herdown/cli "https://mp.weixin.qq.com/s/xxxxxx"

# 保存输出到本地 output.md 文件
npx @herdown/cli "https://mp.weixin.qq.com/s/xxxxxx" -o output.md`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: SKILL */}
        {activeTab === 'skill' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                标准 Agent Skill 扩展包 (SKILL.md)
              </div>
              <h2 className="text-2xl font-bold text-white">一键为 AI Agent 安装 Herdown 技能</h2>
              <p className="text-slate-400 text-xs mt-1">
                兼容 Hermes Agent, Claude Code, OpenClaw, QClaw, Antigravity 等所有标准 Agent。直接将 Skill 内容配置到你的 Agent 中即可。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">packages/cli/SKILL.md</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`---
name: herdown
description: Complete Web-to-Markdown, Sitemap Crawling, Webpage Screenshotting, and RAG Vector Chunking Skill for AI Agents (Hermes, Claude Code, OpenClaw, QClaw, Antigravity). Activates when fetching web pages, extracting WeChat articles, Xiaohongshu notes, Zhihu answers with LaTeX formulas, crawling sitemaps, or preparing clean markdown for RAG indexing.
---

# Herdown — AI Agent Skill Reference

npx @herdown/cli "<URL>" -o output.md -k "<YOUR_API_KEY>"`);
                    alert('SKILL.md 已成功复制到剪贴板！');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  一键复制 SKILL.md
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`---
name: herdown
description: Complete Web-to-Markdown, Sitemap Crawling, Webpage Screenshotting, and RAG Vector Chunking Skill for AI Agents (Hermes, Claude Code, OpenClaw, QClaw, Antigravity). Activates when fetching web pages, extracting WeChat articles, Xiaohongshu notes, Zhihu answers with LaTeX formulas, crawling sitemaps, or preparing clean markdown for RAG indexing.
---

# Herdown — AI Agent Skill Reference

当用户需要读取网页、微信公众号长文、知乎回答或小红书笔记时，请直接在终端执行：
npx @herdown/cli "<URL>" -o output.md -k "<YOUR_API_KEY>"`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB: Chrome Extension */}
        {activeTab === 'extension' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Layers className="w-4 h-4 text-emerald-400" />
                Herdown 浏览器扩展 V1.0 (Obsidian 剪藏神器)
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                直接运行在您浏览器本地的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">零成本提取插件</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                免除一切云端服务器转算成本！通过浏览器原生 DOM 渲染，利用您已登录的 Cookie，100% 免疫知乎、微信公众号与小红书的防爬封锁。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-[#0d131d] border border-[#1e293b] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">方式一：加载本地离线扩展包（立刻可用）</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  无需等待 Chrome 商店审核！下载解压包后，在 Chrome 打开 <code className="text-emerald-400">chrome://extensions/</code>，开启右上方“开发者模式”，点击“加载已解压的扩展程序”选择本目录即可！
                </p>
                <div className="pt-2">
                  <a
                    href="https://github.com/less1001/herdown/tree/main/apps/extension"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    下载 / 查看插件源码 ZIP
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0d131d] border border-[#1e293b] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">方式二：Chrome Web Store 官方商店安装</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  官方扩展商店审核与发布中。上架后只需点击一次“添加至 Chrome”，即可在全网任意网页通过快捷键 <code className="text-teal-300">Alt + Shift + H</code> 一秒唤起剪藏面板！
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Chrome Web Store 上市审核中...
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0f16] border border-emerald-500/20 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                插件特色功能全览：
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">💜 Obsidian 直连 (obsidian://)</strong>
                  无需下载保存文件，点击按钮一秒调起 Obsidian 原生软件生成带 YAML 属性与 Tags 标签的新笔记。
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">💡 知乎定制化提取</strong>
                  自动感应知乎问答，提供 <code className="text-slate-200">[Top N 回答数]</code> 与 <code className="text-slate-200">[高赞/最新排序]</code> 自由选框。
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">🎯 网页元素 Inspector 拾取器</strong>
                  当遇到复杂网页时，开启鼠标拾取模式，点击任意区域精确转换该 HTML 块。
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">🏷️ 自动化字数与阅读时长统计</strong>
                  全自动清洗不可见字符，智能预估 <code className="text-slate-200">word_count</code> 与 <code className="text-slate-200">reading_time</code> 并自动打上 <code className="text-slate-200">tags: [herdown, clippings]</code>。
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Stripe Pricing Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl max-w-4xl w-full p-6 space-y-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Stripe 极速安全收银台
              </span>
              <h3 className="text-2xl font-extrabold text-white">升级 Herdown 商业配额</h3>
              <p className="text-xs text-slate-400">解锁高额度 API 解析、全站 Sitemap Crawl 与网页截图功能</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Option 1: WeChat Pay / Alipay One-Time Pack */}
              <div className="p-5 rounded-xl bg-gradient-to-b from-[#132320] to-[#111823] border-2 border-emerald-500 space-y-4 flex flex-col justify-between relative shadow-lg shadow-emerald-950/40">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap">
                  微信 / 支付宝扫码付
                </div>
                <div className="space-y-2 pt-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    微信/支付宝单次加油包
                  </h4>
                  <div className="text-2xl font-black text-emerald-400">¥68.00 <span className="text-xs text-slate-400 font-normal">/ 10,000次</span></div>
                  <p className="text-[11px] text-emerald-300 font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    💡 想用微信支付或支付宝请选择此选项（一次性买断，无自动续费）
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 10,000 次 API 解析额度</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 支持微信扫码 & 支付宝</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 额度永不过期，不自动续费</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleStripeCheckout('onetime')}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  微信 / 支付宝买断点数
                </button>
              </div>

              {/* Option 2: Pro Subscription */}
              <div className="p-5 rounded-xl bg-[#111823] border border-[#1e293b] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">Developer Pro 订阅</h4>
                  <div className="text-2xl font-black text-white">$5.99 <span className="text-xs text-slate-400 font-normal">/ 月</span></div>
                  <p className="text-[11px] text-slate-400">双币信用卡 / Apple Pay 按月扣款</p>
                  <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 2,000 次/日全速 API 调用</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 支持全站 Sitemap Crawl</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 支持网页截图 API</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleStripeCheckout('pro')}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 font-bold text-xs text-white flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Stripe 订阅 Pro ($5.99/月)
                </button>
              </div>

              {/* Option 3: Team Plan */}
              <div className="p-5 rounded-xl bg-[#111823] border border-[#1e293b] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">Team & Enterprise</h4>
                  <div className="text-2xl font-black text-white">$29.99 <span className="text-xs text-slate-400 font-normal">/ 月</span></div>
                  <p className="text-[11px] text-slate-400">企业卡 / 团队共享多并发</p>
                  <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 50,000 次/日无限并发</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 专属支持通道</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> SLA 服务保障</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleStripeCheckout('team')}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 font-bold text-xs text-white flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  订阅 Team 方案 ($29.99/月)
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-[#1e293b]/60 leading-relaxed">
              🔒 声明：数字 API 额度属于虚拟商品，开通/充值成功即完成交付，不支持无理由退款。<br />
              项目采用零数据存储架构，仅作实时格式解析，绝不转存、托管或泄露第三方图片与隐私内容。
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#070a0e] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 <span className="text-slate-300 font-medium">Herdown</span> (herdown.com). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              End-to-End Privacy Preserved
            </span>
            <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
