# Playwright MCP Humanized 🤖

A 100% drop-in replacement for Microsoft's [@playwright/mcp](https://github.com/microsoft/playwright-mcp) that adds **stealth anti-bot capabilities** to AI agents.

By default, AI agents utilizing Playwright MCP operate completely like bots: cursor movements instantly teleport to coordinates, scrolling happens abruptly via CDP, and typing fills inputs in `0ms`. This gets your agent immediately blocked by Cloudflare, DataDome, PerimeterX, and generic bot protection systems.

This project wraps Playwright's `browser` and `context` at runtime to automatically inject human-like behavior into the MCP layer:

✅ **Curved Mouse Movements:** Injects Bezier-curve cursor paths using `ghost-cursor-playwright`.
✅ **Humanized Typing (`fill()` override):** Types character-by-character with a log-normal distribution (30-150ms per keystroke) + longer pauses at word boundaries.
✅ **Randomized Clicks:** Clicks inside the element's bounding box are varied dynamically.
✅ **Auto-Scroll Fix:** Manual, chunked `mouse.wheel()` scroll-to-reveal overrides Playwright's instantaneous CDP leaps.
✅ **Dropdown Scanning:** `selectOption()` pauses for 150-350ms to simulate the user visually scanning options before clicking.
✅ **Complete Scope Penetration:** The humanized locators recursively propagate through `page.locator()`, `filter()`, `nth()`, and even penetrate `frameLocator()`.


> **Fork note (v1.1.0, 2026-09-05):** Ported to Playwright `1.63.0-alpha-2026-08-31` so `--extension` mode speaks
> MCP extension **protocol v2** (required by the current Playwright Chrome extension). Upstream `1.0.0` is pinned to
> `1.59.0-alpha` / protocol v1 and fails with "The client uses an unsupported protocol version." Changes: dependency
> bump; entry points now import `decorateMCPCommand` / `createConnection` from `playwright-core/lib/coreBundle`
> (Microsoft moved them out of `playwright/lib/mcp`). Humanizer (`patch.js`, `humanize.js`) unchanged.


## ⚡ Setup / Installation

Because this tool shares the same API as `@playwright/mcp`, all you have to do is change the `command` pointing to your MCP configuration in **Claude Desktop, OpenCode, or Cursor**.

### Install this fork from GitHub

```json
{
  "mcpServers": {
    "playwright-bridge": {
      "command": "npx",
      "args": [
        "-y",
        "-p", "github:nicholasjayantylearns/playwright-mcp-humanized",
        "playwright-mcp-humanized",
        "--extension"
      ],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "YOUR_EXTENSION_TOKEN"
      }
    }
  }
}
```

`-p <package> <bin>` is required for tarball or GitHub specs — the package ships two bins, so `npx` cannot infer which one to run and will otherwise try to execute the spec string itself. Get the token from the Playwright Extension's options page in the Chrome profile you automate with.

### With `npx` from npm (upstream 1.0.0 — protocol v1, does not work with the current extension)

Just change your config command to point to `playwright-mcp-humanized`:

```json
{
  "mcpServers": {
    "playwright-humanized": {
      "command": "npx",
      "args": ["-y", "playwright-mcp-humanized"]
    }
  }
}
```

### With Playwright Bridge Extension (Connect to your real browser session)

If you're using Microsoft's Playwright Chrome Extension to connect to your actively logged-in Chrome session, this works perfectly out-of-the-box! Just pass the `--extension` flag and your token as usual:

```json
{
  "mcpServers": {
    "playwright-extension": {
      "command": "npx",
      "args": [
        "-y",
        "playwright-mcp-humanized",
        "--extension"
      ],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "YOUR_EXTENSION_TOKEN"
      }
    }
  }
}
```

## How It Works

This project **does not** fork the internal protocol engine of Microsoft's MCP server. Doing so would mean missing out on upstream updates to the core MCP layer.

Instead, we **monkey-patch Playwright at runtime**. Before the MCP server initializes:
1. We intercept `playwright.chromium.launch()`, `connect()`, and `connectOverCDP()`.
2. We wrap new `Contexts` and `Pages`.
3. We override the raw `page.mouse` and `page.locator()` APIs with `humanize.js`.
4. The MCP protocol handles standard parsing, while our interceptors translate its final actions into stealthy ones.

## Credits & Dependencies

- Original MCP Protocol Architecture by [Microsoft / playwright-mcp](https://github.com/microsoft/playwright-mcp).
- Mouse humanization algorithms powered by [ghost-cursor-playwright](https://github.com/Xetera/ghost-cursor).

---
*Built out of necessity to stop our AI agents from getting instantly IP banned.*
