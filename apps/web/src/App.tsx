import React, { useState, useEffect } from 'react';
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
  Trash2,
  RefreshCw,
  Layers,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'converter' | 'keys' | 'mcp' | 'cli'>('converter');
  const [inputUrl, setInputUrl] = useState('');
  const [inputHtml, setInputHtml] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [outputTab, setOutputTab] = useState<'preview' | 'source' | 'images'>('preview');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  // Usage stats state
  const [stats, setStats] = useState({ today_requests: 0, daily_quota: 50000, active_keys: 1 });

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
      // Fallback local initial key
      setApiKeys([
        { key: 'sk_live_demo88888888', name: 'Default Production Key', status: 'active', created_at: new Date().toISOString() }
      ]);
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

  const handleParse = async () => {
    if (inputMode === 'url' && !inputUrl.trim()) return;
    if (inputMode === 'html' && !inputHtml.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setResult(null);

    const startTime = Date.now();

    try {
      const res = await fetch('/v1/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_live_demo88888888',
        },
        body: JSON.stringify({
          url: inputMode === 'url' ? inputUrl.trim() : undefined,
          html: inputMode === 'html' ? inputHtml : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '转换失败，请检查网址或 HTML 结构');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '网络请求异常，请稍后重试');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#070a0e] text-[#e2e8f0] font-sans antialiased selection:bg-[#0f6b4f] selection:text-white flex flex-col">
      {/* Background Subtle Gradient & Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070a0e]/80 border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0f6b4f] to-[#10b981] p-[1px] shadow-lg shadow-[#0f6b4f]/20">
              <div className="w-full h-full bg-[#090d12] rounded-[11px] flex items-center justify-center font-bold text-emerald-400 font-mono text-lg">
                MD
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white font-['Outfit']">
                MD <span className="text-emerald-400">for Agents</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                v2.4.0 Live
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
              在线转换器
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
              API 密钥
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
              远程 MCP / API
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
              CLI 工具
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Ready
            </div>
            <a
              href="https://github.com/less1001/mdforagents"
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
        {/* TAB 1: Converter Playground */}
        {activeTab === 'converter' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                专为 AI Agent、RAG 与知识库打造的全网 Markdown 提取引擎
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                给 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">AI Agent</span> 用的干净 Markdown 入口
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                微信公众号（包含贴图无水去重）、小红书笔记、知乎专栏/回答（Preserve LaTeX）、X/Twitter 及通用网页。
                <br className="hidden sm:block" />
                2ms 极速解析，零存储隐私安全，提供 REST API、远程 MCP 端点及 CLI 工具。
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
                  🔵 知乎 LaTeX 专栏
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
                <span className="text-[11px] text-slate-500">POST /v1/parse</span>
              </div>

              {inputMode === 'url' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="粘贴网页 URL（如 https://mp.weixin.qq.com/s/... 或 https://xiaohongshu.com/...）"
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
                {/* Result Header Bar */}
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

                {/* View Switcher Bar */}
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

                {/* Content Output */}
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
                        if (block.startsWith('![') && block.includes('](')) {
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

        {/* TAB 2: API Keys Management */}
        {activeTab === 'keys' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">API 密钥控制台</h2>
              <p className="text-slate-400 text-xs mt-1">创建与管理用于 REST API 及远程 MCP 调用的 Bearer Token</p>
            </div>

            {/* Usage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">今日解析请求</span>
                <p className="text-2xl font-extrabold text-white mt-1">{stats.today_requests} 次</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">每日配额 (Quota)</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.daily_quota.toLocaleString()} 次</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">活跃 API Key</span>
                <p className="text-2xl font-extrabold text-white mt-1">{apiKeys.filter(k => k.status === 'active').length} 个</p>
              </div>
            </div>

            {/* Key Creator */}
            <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b] flex items-center gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="输入 Key 名称 (如: Claude Agent / Cursor)"
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
                  {apiKeys.map((item, idx) => (
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
                          {copiedKeyIndex === idx ? '已复制' : '复制'}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MCP & REST API Guide */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">远程 MCP & REST API 接入指南</h2>
              <p className="text-slate-400 text-xs mt-1">支持 Anthropic MCP 标准 HTTP/SSE 协议，直接集成至 Claude Desktop, Cursor, Windsurf 与 Hermes Agent</p>
            </div>

            {/* MCP Integration Card */}
            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">1. 远程 MCP 端点配置 (Anthropic MCP Standard)</h3>
              </div>
              <p className="text-xs text-slate-400">
                将以下 JSON 片段添加至你的 <code className="text-emerald-400">claude_desktop_config.json</code> 或 Cursor / Windsurf MCP 配置文件中：
              </p>

              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "mdforagents": {
      "command": "npx",
      "args": ["-y", "@mdforagents/mcp", "https://allto.agentok.top/mcp"],
      "env": {
        "MDFORAGENTS_API_KEY": "sk_live_demo88888888"
      }
    }
  }
}`}
              </pre>
            </div>

            {/* REST API Card */}
            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">2. REST API 接口规范 (<code className="text-emerald-400">POST /v1/parse</code>)</h3>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">cURL 示例：</h4>
                <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X POST "https://allto.agentok.top/v1/parse" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_demo88888888" \\
  -d '{
    "url": "https://mp.weixin.qq.com/s/xxxxxx"
  }'`}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Python 客户端示例：</h4>
                <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto">
{`import requests

response = requests.post(
    "https://allto.agentok.top/v1/parse",
    headers={"Authorization": "Bearer sk_live_demo88888888"},
    json={"url": "https://mp.weixin.qq.com/s/xxxxxx"}
)
data = response.json()
print("Markdown Result:\n", data["markdown"])`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLI Guide */}
        {activeTab === 'cli' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">npx mdforagents 命令行工具</h2>
              <p className="text-slate-400 text-xs mt-1">无需全局安装，在终端一键抓取并生成干净 Markdown</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                终端快速使用命令：
              </h3>

              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto">
{`# 直接在终端打印转换后的 Markdown
npx mdforagents "https://mp.weixin.qq.com/s/xxxxxx"

# 保存输出到本地 output.md 文件
npx mdforagents "https://mp.weixin.qq.com/s/xxxxxx" -o output.md

# 使用自定义 API Key
npx mdforagents "https://mp.weixin.qq.com/s/xxxxxx" --key "sk_live_xxxx"`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-[#1e293b] bg-[#070a0e] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 <span className="text-slate-300 font-medium">MD for Agents</span> (mdforagents.com). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Powered by Cloudflare Workers & D1
            </span>
            <a href="https://github.com/less1001/mdforagents" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
