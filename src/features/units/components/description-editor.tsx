"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useLocale } from "@/stores/locale-store";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/constants";
import { RichText } from "@/components/shared/rich-text";
import { cn } from "@/lib/cn";

/**
 * The skeleton the "قالب وصف" button drops into an empty field.
 *
 * Arabic in both locales on purpose. Everything else in `@/lib/i18n` is dashboard chrome
 * the partner reads; this is guest-facing content that ends up on an Arabic listing page,
 * so the button's *label* is translated and its *output* is not.
 *
 * The shape is the one the reference example uses — a lead, what stands out, the rooms,
 * how to get there, and the one condition worth calling out.
 */
export const DESCRIPTION_TEMPLATE = [
  "وصف مختصر للمكان وموقعه في سطرين.",
  "",
  "## ما يميّز المكان",
  "*ميزة أولى*",
  "*ميزة ثانية*",
  "",
  "## المساحات",
  "- **غرفة النوم:** ...",
  "- **الصالة:** ...",
  "",
  "## طريقة الوصول",
  "1. ...",
  "2. ...",
  "",
  "> ملاحظة عن تسجيل الدخول أو أي شرط مهم.",
].join("\n");

/**
 * The unit description field: the textarea, a live preview of it, and the two affordances
 * that make the markers discoverable.
 *
 * The value reaches the parent untouched apart from the length cap — no trim, no newline
 * normalising, no `\s+` collapse. The markers only mean anything at the start of a line,
 * so whitespace here is data and the only safe edit is none.
 *
 * The preview is not decoration. The partner is writing text a guest reads through a
 * parser they cannot see; without a preview the first time they learn that `##` makes a
 * heading is after the unit is approved and live.
 */
export function DescriptionEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  /** A unit locked for review. The field goes read-only; the preview does not. */
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const w = t.wiz;

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [hintOpen, setHintOpen] = useState(false);

  const boxRef = useRef<HTMLTextAreaElement>(null);
  /** Where the caret and the scroll were when the partner left the write tab. */
  const restoreRef = useRef({ start: 0, end: 0, scrollTop: 0 });
  /** Set only by a tab switch, so a first mount does not steal focus into the field. */
  const returningRef = useRef(false);

  /*
    Both panes stay mounted and are hidden with CSS rather than swapped by a ternary.
    Unmounting the textarea throws away the caret, the scroll position and any height the
    partner dragged it to — on a 2000-character description, glancing at the preview twice
    means finding your place twice.

    The position is captured in the click handler, NOT in an effect. A layout effect runs
    after React has committed the DOM, by which point the write pane is already
    `display:none` — and an element with no layout box reports `scrollTop` as 0, so an
    effect can only ever record 0 and then scroll the partner back to the top on the way
    in. The click handler still runs while the pane is on screen.
  */
  function switchTab(next: "write" | "preview") {
    const box = boxRef.current;
    if (box && tab === "write" && next === "preview") {
      restoreRef.current = {
        start: box.selectionStart,
        end: box.selectionEnd,
        scrollTop: box.scrollTop,
      };
    }
    if (next === "write") returningRef.current = true;
    setTab(next);
  }

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || tab !== "write" || !returningRef.current) return;
    returningRef.current = false;

    // Focus first: hiding the pane moved focus off the textarea, and a restored caret in
    // an unfocused field is invisible and un-typeable — the next keystroke goes nowhere
    // and the click that fixes it puts the caret wherever the pointer landed.
    const { start, end, scrollTop } = restoreRef.current;
    box.focus();
    box.selectionStart = start;
    box.selectionEnd = end;
    box.scrollTop = scrollTop;
  }, [tab]);

  const empty = value.trim().length === 0;

  /*
    A locked unit stacks both panes instead of offering the switch.

    `<fieldset disabled>` reaches every control inside it and HTML gives no per-control
    exemption, so a tab strip inside a read-only step would be dead — on the one screen
    where the partner most wants to see how their description will read. Stacking needs no
    button to work, so it survives whatever the form wraps it in.
  */
  const stacked = Boolean(disabled);
  const showWrite = stacked || tab === "write";
  const showPreview = stacked || tab === "preview";

  function applyTemplate() {
    // Guarded twice — the button is disabled and the handler refuses. The one thing this
    // button must never do is overwrite a description the partner has already written.
    if (!empty) return;
    onChange(DESCRIPTION_TEMPLATE);
    setTab("write");
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabelRow label={w.propertyDescription} />
        {/* Counts the string as stored: a newline is one character here and one there. */}
        <span className="text-xs tabular-nums text-ink-faint">
          {value.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      {/*
        Read-only shows both panes at once; otherwise the switch. Either way the preview is
        reachable — a partner waiting on review can still see exactly what the guest will.
      */}
      {stacked ? (
        <p className="mb-3 mt-1 text-xs text-ink-faint">{w.descriptionPreviewNote}</p>
      ) : (
        <div role="tablist" className="mb-3 mt-1 inline-flex rounded-full bg-cream p-1">
          {(["write", "preview"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                tab === key ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {key === "write" ? w.descriptionWrite : w.descriptionPreview}
            </button>
          ))}
        </div>
      )}

      <div className={cn(!showWrite && "hidden")}>
        <textarea
          ref={boxRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
          rows={10}
          disabled={disabled}
          aria-label={w.propertyDescription}
          placeholder={w.descriptionPh}
          // inputCls from property-wizard.tsx, plus the height and the drag handle.
          className="w-full resize-y rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-ink-faint focus:border-brand focus:bg-white disabled:opacity-60"
        />
      </div>

      <div className={cn(!showPreview && "hidden", stacked && "mt-3")}>
        <div className="min-h-[15rem] rounded-2xl border border-line bg-white px-4 py-3">
          {empty ? (
            <p className="text-sm text-ink-faint">{w.descriptionPreviewEmpty}</p>
          ) : (
            <RichText text={value} className="text-sm" />
          )}
        </div>
        <p className="mt-2 text-xs text-ink-faint">{w.descriptionPreviewNote}</p>
      </div>

      {/* Empty field only — a starting point, never an overwrite. */}
      {empty && !disabled && (
        <button
          type="button"
          onClick={applyTemplate}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          {w.descriptionTemplate}
          <span className="font-normal text-ink-faint">{w.descriptionTemplateHint}</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setHintOpen((v) => !v)}
        aria-expanded={hintOpen}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink"
      >
        {w.descriptionFormatToggle}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", hintOpen && "rotate-180")} />
      </button>

      {hintOpen && (
        <div className="mt-2 rounded-2xl border border-line bg-cream/40 p-4">
          <FormatHint hint={w.descriptionFormatHint} />
        </div>
      )}
    </>
  );
}

/** Mirrors the wizard's own FieldLabel so the field reads like its neighbours in step 2. */
function FieldLabelRow({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
      {label}
      <span className="text-status-rejected">*</span>
    </span>
  );
}

/**
 * Every character of the hint, with the markers set as literal code.
 *
 * The split is presentational — nothing is added or dropped. It exists because `>` is a
 * *mirrored* character: dropped unmarked into an Arabic sentence the bidi algorithm draws
 * it as `<`, so the one line telling a partner how to open a note would be telling them to
 * type the wrong character.
 */
function FormatHint({ hint }: { hint: string }) {
  // `**bold**` is listed before `*mark*` so the longer marker wins; `-(?=\s)` cannot fire
  // inside a hyphenated word, and needs no lookbehind (which older Safari lacks).
  const MARKER = /(\*\*[^*]+\*\*|\*[^*]+\*|##|>|\d+\.|-(?=\s))/g;

  return (
    <p className="text-xs leading-loose text-ink-muted">
      {hint.split(MARKER).map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            dir="ltr"
            className="mx-0.5 inline-block rounded bg-white px-1 font-mono text-[0.7rem] text-ink"
          >
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
