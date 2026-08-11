declare module 'docx-merger' {
  type DocxMergerFile = ArrayBuffer | Uint8Array | Blob | string;
  type DocxMergerCallback = (data: Blob | ArrayBuffer | Uint8Array) => void;
  class DocxMerger {
    constructor(options: Record<string, unknown>, files: DocxMergerFile[]);
    save(type: 'blob' | 'arraybuffer' | 'uint8array' | string, callback: DocxMergerCallback): void;
  }
  export default DocxMerger;
}
