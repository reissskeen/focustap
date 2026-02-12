import { saveAs } from "file-saver";

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, any>;
  marks?: { type: string; attrs?: Record<string, any> }[];
}

/** Extract plain text lines from TipTap JSON */
const extractTextLines = (node: TipTapNode): string[] => {
  const lines: string[] = [];
  const walk = (n: TipTapNode, depth = 0) => {
    if (n.type === "text") {
      lines.push(n.text || "");
      return;
    }
    if (n.type === "paragraph" || n.type === "heading") {
      const texts: string[] = [];
      n.content?.forEach((c) => { if (c.text) texts.push(c.text); });
      const prefix = n.type === "heading" ? "#".repeat(n.attrs?.level || 1) + " " : "";
      lines.push(prefix + texts.join(""));
    } else if (n.type === "bulletList" || n.type === "orderedList" || n.type === "taskList") {
      n.content?.forEach((item, i) => {
        const texts: string[] = [];
        const walkItem = (it: TipTapNode) => {
          if (it.text) texts.push(it.text);
          it.content?.forEach(walkItem);
        };
        walkItem(item);
        const bullet = n.type === "orderedList" ? `${i + 1}. ` : n.type === "taskList" ? "☐ " : "• ";
        lines.push(bullet + texts.join(""));
      });
    } else if (n.type === "table") {
      n.content?.forEach((row) => {
        const cells: string[] = [];
        row.content?.forEach((cell) => {
          const texts: string[] = [];
          const walkCell = (c: TipTapNode) => { if (c.text) texts.push(c.text); c.content?.forEach(walkCell); };
          walkCell(cell);
          cells.push(texts.join(""));
        });
        lines.push(cells.join("\t"));
      });
    } else {
      n.content?.forEach((c) => walk(c, depth + 1));
    }
  };
  walk(node);
  return lines;
};

export const exportToDocx = async (json: object, filename: string) => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const paragraphs: any[] = [];
  const node = json as TipTapNode;

  const processNode = (n: TipTapNode) => {
    if (n.type === "heading") {
      const texts: string[] = [];
      n.content?.forEach((c) => { if (c.text) texts.push(c.text); });
      const level = n.attrs?.level === 1 ? HeadingLevel.HEADING_1 : n.attrs?.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      paragraphs.push(new Paragraph({ heading: level, children: [new TextRun({ text: texts.join(""), bold: true })] }));
    } else if (n.type === "paragraph") {
      const runs: any[] = [];
      n.content?.forEach((c) => {
        if (c.text) {
          const bold = c.marks?.some((m) => m.type === "bold");
          const italic = c.marks?.some((m) => m.type === "italic");
          const underline = c.marks?.some((m) => m.type === "underline");
          runs.push(new TextRun({ text: c.text, bold, italics: italic, underline: underline ? {} : undefined }));
        }
      });
      paragraphs.push(new Paragraph({ children: runs.length ? runs : [new TextRun("")] }));
    } else if (n.type === "bulletList" || n.type === "orderedList") {
      n.content?.forEach((item, i) => {
        const texts: string[] = [];
        const walkItem = (it: TipTapNode) => { if (it.text) texts.push(it.text); it.content?.forEach(walkItem); };
        walkItem(item);
        const bullet = n.type === "orderedList" ? `${i + 1}. ` : "• ";
        paragraphs.push(new Paragraph({ children: [new TextRun(bullet + texts.join(""))] }));
      });
    } else {
      n.content?.forEach(processNode);
    }
  };

  processNode(node);

  const doc = new Document({ sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun("")] })] }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};

export const exportToXlsx = async (json: object, filename: string) => {
  const XLSX = await import("xlsx");
  const lines = extractTextLines(json as TipTapNode);
  const data = lines.map((line) => line.split("\t"));
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Notes");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${filename}.xlsx`);
};

export const exportToPptx = async (json: object, filename: string) => {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new pptxgen();

  const lines = extractTextLines(json as TipTapNode);

  // Group lines into slides (~10 lines per slide)
  const LINES_PER_SLIDE = 10;
  for (let i = 0; i < Math.max(lines.length, 1); i += LINES_PER_SLIDE) {
    const slide = pres.addSlide();
    const chunk = lines.slice(i, i + LINES_PER_SLIDE).join("\n");
    slide.addText(chunk || " ", { x: 0.5, y: 0.5, w: 9, h: 5, fontSize: 14, valign: "top" });
  }

  const out = (await pres.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  saveAs(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }), `${filename}.pptx`);
};
