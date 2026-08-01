#!/usr/bin/env python3
"""Small local wrapper around Microsoft's MarkItDown command."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a local document to Markdown with MarkItDown")
    parser.add_argument("input", type=Path)
    parser.add_argument("-o", "--output", type=Path)
    args = parser.parse_args()

    if not args.input.is_file():
        parser.error(f"input file does not exist: {args.input}")

    command = [sys.executable, "-m", "markitdown", str(args.input)]
    result = subprocess.run(command, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        return result.returncode

    if args.output:
        args.output.write_text(result.stdout, encoding="utf-8")
    else:
        sys.stdout.write(result.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
