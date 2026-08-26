"use client";

import { Fragment } from "react";
import { Check, Info } from "lucide-react";
import { parseRichText, type InlineNode, type RichBlock } from "@/lib/rich-text";
import { cn } from "@/lib/cn";

/**
 * Renders a partner-written description with its line markers — the vocabulary lives in
 * `@/lib/rich-text`, which is a byte-identical copy of the parser the public site runs.
 *
 * This is the component that makes the preview honest. The partner writes plain text; the
 * guest sees headings, feature cards and lists. Anywhere the dashboard shows the raw
 * string instead, HTML's own whitespace collapsing folds every `\n` into a space and the
 * partner is shown a listing the guest will never see — with the data perfectly intact.
 *
 * No HTML is ever passed through. The parser emits text nodes and we build React elements
 * from them, so a description containing `<script>` renders as the eight characters
 * `<script>`. There is no `dangerouslySetInnerHTML` here and there must never be one.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text ?? "");
  if (!blocks.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: RichBlock }) {
  switch (block.type) {
    case "heading":
      // border-s / ps flip with the page direction, so the green rail sits on the right
      // in Arabic and the left in English without a second rule.
      return (
        <h3 className="border-s-[3px] border-brand ps-3 pt-1 text-base font-bold text-ink">
          <Inline nodes={block.content} />
        </h3>
      );

    case "paragraph":
      // whitespace-pre-line: the partner's own line breaks inside a paragraph survive.
      return (
        <p className="whitespace-pre-line leading-[1.95] text-ink-muted">
          <Inline nodes={block.content} />
        </p>
      );

    case "note":
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-cream/60 p-4 text-sm leading-relaxed text-ink">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span className="min-w-0 whitespace-pre-line">
            <Inline nodes={block.content} />
          </span>
        </div>
      );

    case "bullets":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 leading-[1.95] text-ink-muted">
              {/* A dot inside a cream halo — the default marker is too faint to read
                  against Arabic text at this size. mt aligns it to the first line. */}
              <span className="mt-[7px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-cream">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              <span className="min-w-0">
                <Inline nodes={item} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 leading-[1.95] text-ink-muted">
              {/* Latin numerals on purpose — the same display decision as formatCurrency
                  and formatDate make in @/lib/format. */}
              <span className="mt-[3px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold tabular-nums text-brand">
                {i + 1}
              </span>
              <span className="min-w-0">
                <Inline nodes={item} />
              </span>
            </li>
          ))}
        </ol>
      );

    case "features":
      return (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-cream/60 px-3.5 py-2.5 text-sm font-semibold text-ink"
            >
              <Check className="h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <Inline nodes={item} />
              </span>
            </li>
          ))}
        </ul>
      );
  }
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "strong") {
          return (
            <strong key={i} className="font-bold text-ink">
              {node.value}
            </strong>
          );
        }
        if (node.type === "mark") {
          return (
            // box-decoration-break keeps the cream background whole when a highlight
            // wraps onto a second line, instead of leaving a sliced edge.
            <mark
              key={i}
              className="rounded-md bg-cream px-1.5 py-0.5 font-semibold text-ink [-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
            >
              {node.value}
            </mark>
          );
        }
        return <Fragment key={i}>{node.value}</Fragment>;
      })}
    </>
  );
}
