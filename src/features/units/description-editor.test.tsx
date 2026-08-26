import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DescriptionEditor, DESCRIPTION_TEMPLATE } from "@/features/units/components/description-editor";
import { MAX_DESCRIPTION_LENGTH, MIN_DESCRIPTION_LENGTH } from "@/lib/constants";
import { dict } from "@/lib/i18n";

const w = dict.ar.wiz;

afterEach(cleanup);

/** The field is controlled, so the tests drive it through the state its parent holds. */
function Harness({ initial = "", disabled }: { initial?: string; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <DescriptionEditor value={value} onChange={setValue} disabled={disabled} />;
}

const box = () => screen.getByPlaceholderText(w.descriptionPh) as HTMLTextAreaElement;
const tab = (name: string) => screen.getByRole("tab", { name }) as HTMLButtonElement;
const type = (value: string) => fireEvent.change(box(), { target: { value } });

describe("DescriptionEditor — the value it hands back", () => {
  /**
   * The one that matters most. Every marker is a line-opener, so a field that quietly
   * folds newlines does not degrade the formatting — it deletes it, while showing the
   * partner text that still looks right.
   */
  it("hands back newlines exactly as typed", () => {
    render(<Harness />);
    const written = "سطر أول\nسطر ثانٍ\n\n## عنوان\n- نقطة";
    type(written);

    expect(box().value).toBe(written);
    expect(box().value.split("\n")).toHaveLength(5);
    expect(box().value.includes("\n\n")).toBe(true);
  });

  it("does not trim the edges either, while the partner is still typing", () => {
    render(<Harness />);
    type("  \nنص\n  ");
    expect(box().value).toBe("  \nنص\n  ");
  });

  it("keeps the text byte-identical across a trip to the preview and back", () => {
    render(<Harness />);
    const written = "## عنوان\n- نقطة\n\n> ملاحظة";
    type(written);

    fireEvent.click(tab(w.descriptionPreview));
    fireEvent.click(tab(w.descriptionWrite));

    expect(box().value).toBe(written);
  });
});

describe("DescriptionEditor — the length cap", () => {
  it("accepts 2000 characters, not the 500 this field shipped with", () => {
    render(<Harness />);
    type("ا".repeat(600));
    expect(box().value).toHaveLength(600);

    type("ا".repeat(MAX_DESCRIPTION_LENGTH + 500));
    expect(box().value).toHaveLength(MAX_DESCRIPTION_LENGTH);
    expect(MAX_DESCRIPTION_LENGTH).toBe(2000);
  });

  it("counts the text as stored, with a newline worth one character", () => {
    render(<Harness />);
    type("ا\nب");
    expect(screen.getByText(`3/${MAX_DESCRIPTION_LENGTH}`)).toBeTruthy();
  });

  it("counts leading and trailing whitespace too, because the cap does", () => {
    render(<Harness />);
    type("  ا  ");
    expect(screen.getByText(`5/${MAX_DESCRIPTION_LENGTH}`)).toBeTruthy();
  });
});

describe("DescriptionEditor — the preview", () => {
  it("renders the markers as the guest will see them", () => {
    const { container } = render(<Harness />);
    type("## المساحات\n- غرفة النوم\n- الصالة\n\n1. اخرج\n\n> ملاحظة\n\n*ميزة*");
    fireEvent.click(tab(w.descriptionPreview));

    expect(container.querySelector("h3")?.textContent).toBe("المساحات");
    expect(container.querySelectorAll("ul > li")).toHaveLength(3); // 2 bullets + 1 feature
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(screen.getByText("ملاحظة")).toBeTruthy();
  });

  it("marks bold and highlighted spans distinctly", () => {
    const { container } = render(<Harness />);
    type("**غرفة النوم:** جلسة *عائلية*");
    fireEvent.click(tab(w.descriptionPreview));

    expect(container.querySelector("strong")?.textContent).toBe("غرفة النوم:");
    expect(container.querySelector("mark")?.textContent).toBe("عائلية");
  });

  it("shows a description with no markers exactly as it always read", () => {
    const legacy = "استوديو أنيق في قلب حي العليا، قريب من الخدمات.";
    const { container } = render(<Harness initial={legacy} />);
    fireEvent.click(tab(w.descriptionPreview));

    // Scoped to the rendered paragraphs: both panes stay mounted, so the same string is
    // also sitting in the (hidden) textarea and a bare getByText would match twice.
    expect(container.querySelectorAll("h3, ul, ol")).toHaveLength(0);
    const paragraphs = Array.from(container.querySelectorAll("p")).map((p) => p.textContent);
    expect(paragraphs).toContain(legacy);
  });

  it("says so rather than showing an empty panel", () => {
    render(<Harness />);
    fireEvent.click(tab(w.descriptionPreview));
    expect(screen.getByText(w.descriptionPreviewEmpty)).toBeTruthy();
  });

  /**
   * The description is plain text the partner controls. This is the test that fails the
   * day someone reaches for `dangerouslySetInnerHTML` to "make the preview nicer".
   */
  it("renders HTML in the description as literal text and executes nothing", () => {
    const hostile = '<img src=x onerror="alert(1)"> و <script>alert(2)</script>';
    const { container } = render(<Harness />);
    type(hostile);
    fireEvent.click(tab(w.descriptionPreview));

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent?.includes("<img src=x")).toBe(true);
    expect(container.textContent?.includes("<script>alert(2)</script>")).toBe(true);
  });

  it("keeps real markers working alongside the escaped tags", () => {
    const { container } = render(<Harness />);
    type("<b>ليس عريضًا</b> لكن **هذا عريض**");
    fireEvent.click(tab(w.descriptionPreview));

    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("هذا عريض");
  });
});

describe("DescriptionEditor — the affordances", () => {
  it("offers the template only while the field is empty", () => {
    render(<Harness />);
    expect(screen.queryByText(w.descriptionTemplate)).toBeTruthy();

    type("نص كتبه الشريك");
    expect(screen.queryByText(w.descriptionTemplate)).toBeNull();
  });

  it("fills an empty field with a template that already clears the minimum", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(w.descriptionTemplate));

    expect(box().value).toBe(DESCRIPTION_TEMPLATE);
    expect(box().value.trim().length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
    expect(box().value.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    // A skeleton that does not itself parse would be teaching the wrong syntax.
    expect(box().value.includes("## ")).toBe(true);
  });

  it("keeps the cheatsheet collapsed until asked, then names every marker", () => {
    render(<Harness />);
    const toggle = screen.getByText(w.descriptionFormatToggle);
    expect(screen.queryByText(/نسّق الوصف/)).toBeNull();

    fireEvent.click(toggle);
    // The hint is split into text and <code> nodes, so it is matched on the container.
    const hint = document.body.textContent ?? "";
    for (const marker of ["##", "- ", "1.", "*ميزة*", "**كلمة**", ">"]) {
      expect(hint.includes(marker)).toBe(true);
    }
  });

  /**
   * A unit locked for review is exactly when the partner most wants to see how their
   * description will read.
   *
   * The switch is dropped rather than disabled: the wizard wraps a locked step in a
   * `<fieldset disabled>`, which reaches every button inside it and cannot be overridden
   * per control. Stacking both panes needs no button, so the preview survives the wrapper.
   */
  it("locks the field and shows the preview without needing a switch", () => {
    const written = "## عنوان\n- نقطة";
    const { container } = render(<Harness initial={written} disabled />);

    expect(box().disabled).toBe(true);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);

    // Both panes render at once — the raw text and the guest's view of it.
    expect(container.querySelector("h3")?.textContent).toBe("عنوان");
    expect(container.querySelectorAll("ul > li")).toHaveLength(1);
    expect(box().value).toBe(written);
  });

  it("keeps the write/preview switch while the unit is editable", () => {
    render(<Harness initial="نص" />);
    expect(screen.queryAllByRole("tab")).toHaveLength(2);
    expect(tab(w.descriptionPreview).disabled).toBe(false);
  });

  it("withholds the template button while the field is locked", () => {
    render(<Harness disabled />);
    expect(screen.queryByText(w.descriptionTemplate)).toBeNull();
  });

  it("puts the caret back where it was after a look at the preview", () => {
    render(<Harness initial="نص طويل بما يكفي للاختبار" />);
    box().selectionStart = 5;
    box().selectionEnd = 5;

    fireEvent.click(tab(w.descriptionPreview));
    fireEvent.click(tab(w.descriptionWrite));

    expect(box().selectionStart).toBe(5);
    expect(box().selectionEnd).toBe(5);
  });

  /**
   * A restored caret in an unfocused field is decoration: the next keystroke goes nowhere,
   * and the click that fixes it drops the caret wherever the pointer landed. Clicking the
   * tab moves focus to the button, and hiding the pane takes it off the textarea for good,
   * so the field has to be focused back explicitly.
   */
  it("returns focus to the field, not just the caret", () => {
    render(<Harness initial="نص طويل بما يكفي للاختبار" />);
    box().focus();

    fireEvent.click(tab(w.descriptionPreview));
    fireEvent.click(tab(w.descriptionWrite));

    expect(document.activeElement).toBe(box());
  });

  it("does not grab focus on first render", () => {
    // The same effect runs once on mount; without a guard it would pull the cursor into
    // the description the moment step 2 opens, past the fields above it.
    render(<Harness initial="نص" />);
    expect(document.activeElement).not.toBe(box());
  });

  /**
   * 🔴 REGRESSION GUARD — the scroll offset must be read while the pane is still on screen.
   *
   * This used to live in the same `useLayoutEffect` as the restore. Layout effects run
   * after React commits, by which point the write pane is already `display:none`, and an
   * element with no layout box reports `scrollTop` as 0 — so it recorded 0 every time and
   * then scrolled the partner back to the top on the way in.
   *
   * jsdom performs no layout, so a scrollTop assertion here would pass vacuously. What is
   * asserted instead is the thing that was actually wrong: that the offset is read during
   * the click, while the element still has a box.
   */
  it("reads the scroll offset before the pane is hidden", () => {
    render(<Harness initial="نص" />);

    let readWhileVisible: boolean | null = null;
    Object.defineProperty(box(), "scrollTop", {
      configurable: true,
      get() {
        readWhileVisible = !this.closest("div")?.className.includes("hidden");
        return 120;
      },
      set() {},
    });

    fireEvent.click(tab(w.descriptionPreview));

    expect(readWhileVisible).toBe(true);
  });
});
