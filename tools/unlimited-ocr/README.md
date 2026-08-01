# 本地Unlimited-OCRSkill

Herdown不在Cloudflare服务器运行OCR。截图、扫描件、发票和扫描PDF使用现有的本地Unlimited-OCRSkill处理。

当前Skill位置：

```text
/Volumes/Samsung T7/antigravity/unlimited-ocr-skill
```

使用方式：

```bash
/Volumes/Samsung\ T7/antigravity/unlimited-ocr-skill/venv/bin/python3 \
  /Volumes/Samsung\ T7/antigravity/unlimited-ocr-skill/ocr_runner.py \
  -i screenshot.png -o screenshot.md --mode local
```

图片和扫描件不会经过Herdown在线服务器。首次本地运行可能需要准备模型文件和Python依赖。
