# 本地Unlimited-OCRSkill

Herdown不在Cloudflare服务器运行OCR。截图、扫描件、发票和扫描PDF使用现有的本地Unlimited-OCRSkill处理。

将Skill放在本机任意目录，例如：

```text
/path/to/unlimited-ocr-skill
```

使用方式：

```bash
<path-to-unlimited-ocr-skill>/venv/bin/python3 \
  <path-to-unlimited-ocr-skill>/ocr_runner.py \
  -i screenshot.png -o screenshot.md --mode local
```

图片和扫描件不会经过Herdown在线服务器。首次本地运行可能需要准备模型文件和Python依赖。
