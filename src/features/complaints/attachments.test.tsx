import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { AttachmentGrid } from "@/features/complaints/components/attachment-grid";
import { classifyAttachmentFailure, probeAttachment, EXPIRY_GRACE_MS } from "@/features/complaints/lib/attachment-status";
import { dict } from "@/lib/i18n";

const c = dict.ar.complaints;

afterEach(cleanup);

/**
 * FE-1 — signed attachment URLs die after 15 minutes, so a `403` is routine
 * on a page left open. It must read as "the link expired", never as a server
 * error, and it must not be confused with a `404` — a missing file is a
 * different thing to the partner.
 */
describe("classifyAttachmentFailure", () => {
  it("reads 403 as an expired link regardless of age", () => {
    expect(classifyAttachmentFailure({ status: 403, ageMs: 0 })).toBe("expired");
    expect(classifyAttachmentFailure({ status: 403, ageMs: 20 * 60_000 })).toBe("expired");
  });

  it("reads 404 as a missing attachment, not an expired one", () => {
    expect(classifyAttachmentFailure({ status: 404, ageMs: 20 * 60_000 })).toBe("missing");
  });

  it("keeps every other status on the generic failure", () => {
    expect(classifyAttachmentFailure({ status: 500, ageMs: 0 })).toBe("broken");
    expect(classifyAttachmentFailure({ status: 502, ageMs: 20 * 60_000 })).toBe("broken");
  });

  it("falls back to the age heuristic only when no status could be read", () => {
    expect(classifyAttachmentFailure({ status: null, ageMs: EXPIRY_GRACE_MS + 1 })).toBe("expired");
    expect(classifyAttachmentFailure({ status: null, ageMs: EXPIRY_GRACE_MS - 1 })).toBe("broken");
  });
});

describe("probeAttachment", () => {
  it("returns the response status", async () => {
    const fetchImpl = vi.fn(async () => ({ status: 403 }) as Response);
    expect(await probeAttachment("https://x/a", fetchImpl)).toBe(403);
    expect(fetchImpl).toHaveBeenCalledWith("https://x/a", { cache: "no-store" });
  });

  it("returns null when the request itself fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await probeAttachment("https://x/a", fetchImpl)).toBeNull();
  });
});

describe("AttachmentGrid", () => {
  const images = [
    { url: "https://api/complaints/attachments/1?sig=a", mime: "image/jpeg" },
    { url: "https://api/complaints/attachments/2?sig=b", mime: "image/jpeg" },
  ];

  it("shows the calm expiry message and a reload on 403, and reports expiry once", async () => {
    const onExpired = vi.fn();
    const onReload = vi.fn();
    render(
      <AttachmentGrid
        images={images}
        fetchedAt={Date.now()}
        onExpired={onExpired}
        onReload={onReload}
        probe={async () => 403}
      />,
    );
    fireEvent.error(screen.getByAltText(c.attachmentAlt(1)));
    fireEvent.error(screen.getByAltText(c.attachmentAlt(2)));

    await waitFor(() => expect(screen.getAllByText(c.attachmentExpired)).toHaveLength(2));
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(dict.ar.states.errorTitle)).toBeNull();

    fireEvent.click(screen.getAllByText(c.refreshAttachments)[0]);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("says the attachment is unavailable on 404, with no reload and no expiry report", async () => {
    const onExpired = vi.fn();
    render(
      <AttachmentGrid images={images} fetchedAt={Date.now()} onExpired={onExpired} onReload={() => {}} probe={async () => 404} />,
    );
    fireEvent.error(screen.getByAltText(c.attachmentAlt(1)));

    await waitFor(() => expect(screen.getByText(c.attachmentMissing)).toBeTruthy());
    expect(screen.queryByText(c.attachmentExpired)).toBeNull();
    expect(screen.queryByText(c.refreshAttachments)).toBeNull();
    expect(onExpired).not.toHaveBeenCalled();
    // The other attachment is untouched.
    expect(screen.getByAltText(c.attachmentAlt(2))).toBeTruthy();
  });

  it("uses the generic wording for any other failure", async () => {
    render(<AttachmentGrid images={images} fetchedAt={Date.now()} onReload={() => {}} probe={async () => 500} />);
    fireEvent.error(screen.getByAltText(c.attachmentAlt(1)));
    await waitFor(() => expect(screen.getByText(c.attachmentBroken)).toBeTruthy());
  });

  it("probes the exact signed URL the image failed on, and only once", async () => {
    // The route sits behind signed middleware: a URL rebuilt from the id has no
    // signature and reads 403 forever, so every missing file would look expired.
    const probe = vi.fn(async () => 403);
    render(<AttachmentGrid images={images} fetchedAt={Date.now()} onReload={() => {}} probe={probe} />);
    fireEvent.error(screen.getByAltText(c.attachmentAlt(1)));
    await waitFor(() => expect(screen.getByText(c.attachmentExpired)).toBeTruthy());
    expect(probe).toHaveBeenCalledTimes(1);
    expect(probe).toHaveBeenCalledWith(images[0].url);
  });
});
