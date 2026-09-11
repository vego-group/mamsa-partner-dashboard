import { configure } from "@testing-library/react";

// The mock flag is parsed strictly (src/lib/env.ts) and refuses an unset
// variable. Tests run against the in-memory mock unless a file says otherwise,
// so give it the explicit value the app itself would insist on.
process.env.NEXT_PUBLIC_USE_MOCK ??= "true";

// The mock API sleeps 350ms per call, and a page that loads a card which loads
// its own data waits on two of those hops before the first assertable text
// exists — already past RTL's 1s default before jsdom does any work. Tests were
// passing on margin and failing on a cold run. Give the async helpers room so a
// test fails on behaviour, never on the mock's latency.
configure({ asyncUtilTimeout: 5000 });
