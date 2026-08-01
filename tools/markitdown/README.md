# 本地MarkItDown工具

这个工具用于在本地把PDF、Word、PPT、Excel等文件转换为Markdown。文件不会上传到Herdown，也不需要额外VPS。

## 安装

```bash
python -m pip install markitdown
```

## 使用

```bash
python -m markitdown "input.pdf" > output.md
python -m markitdown "input.docx" > output.md
python -m markitdown "input.pptx" > output.md
python -m markitdown "input.xlsx" > output.md
```

## 说明

MarkItDown适合可提取文字的电子文档。扫描件、发票、截图和图片请使用本地Unlimited-OCRSkill。
