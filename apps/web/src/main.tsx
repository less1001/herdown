import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: function App() {
    const [input, setInput] = React.useState('https://mp.weixin.qq.com/');
    const [result, setResult] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const run = async () => {
      setBusy(true);
      try {
        const response = await fetch('/v1/parse', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: input }),
        });
        const data = await response.json();
        setResult(data.markdown ?? '');
      } finally {
        setBusy(false);
      }
    };

    return React.createElement('main', { className: 'shell' }, [
      React.createElement('section', { key: 'hero', className: 'hero' }, [
        React.createElement('p', { key: 'eyebrow', className: 'eyebrow' }, 'MD for Agents'),
        React.createElement('h1', { key: 'title' }, '网页转Markdown，面向AI Agent的极速管道'),
        React.createElement('p', { key: 'desc', className: 'desc' }, 'Cloudflare Workers + D1 + TanStack 的独立官网与API控制台。'),
      ]),
      React.createElement('section', { key: 'panel', className: 'panel' }, [
        React.createElement('input', {
          key: 'input',
          value: input,
          onChange: (event) => setInput(event.target.value),
          placeholder: '粘贴公开URL',
        }),
        React.createElement('button', { key: 'button', onClick: run, disabled: busy }, busy ? '转换中' : '开始转换'),
        React.createElement('pre', { key: 'output' }, result || '结果会显示在这里'),
      ]),
    ]);
  },
});

const router = createRouter({ routeTree: rootRoute });

ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(RouterProvider, { router }),
);
