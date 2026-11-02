# Decisions

## 2026-11-02 — isolated staged project
Existing /workspace/Vistara is Theme World and remains untouched. New project is /workspace/vistara-ai. PDF sessions establish M0/M1 first; M2 may begin only after M1 is verified.

## Initial dependency and permission baseline
The user requested implementation of both supplied specifications. Their explicitly named stack and initial M0 permissions are the authorized baseline, including necessary build/test transitive dependencies. No paid dependencies or services. Further expansion requires discussion per AGENTS.md.

## Verified official API patterns
- WXT entrypoints/runtime content registration: https://wxt.dev/guide/essentials/entrypoints.html
- React versions https://react.dev/versions
- Tailwind Vite plugin https://tailwindcss.com/docs/installation/using-vite
- Side panel requires sidePanel permission; open on user gesture: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Storage access levels and session: https://developer.chrome.com/docs/extensions/reference/api/storage
- Gemini runtime model discovery: https://ai.google.dev/api/models
- Gemini generateContent/function calls/streaming: https://ai.google.dev/api/generate-content
- Gemini x-goog-api-key header avoids keys in URLs: https://ai.google.dev/gemini-api/docs/api-key
- Groq compatibility/models: https://console.groq.com/docs/openai and https://console.groq.com/docs/models

## Dependencies
Versions queried directly from npm official registry on 2026-11-02. TypeScript latest 7.0.2 is outside typescript-eslint supported <6.1 range; pin compatible 6.0 patch. WXT/React/TS: extension build and accessible typed UI. Tailwind/Vite: build-time utilities and design tokens. Zustand: small UI preferences state. Zod: runtime trust boundaries. Lucide: original composition of accessible local SVG icons. Vitest/jsdom: deterministic unit/DOM tests. Playwright: fixture UI and native-extension attempts. ESLint/typescript-eslint: actual lint, separate from typecheck. @types packages: compile-time browser and UI declarations. No Google/Groq SDK: direct documented REST avoids large runtime SDKs and permits explicit cancellation/headers. Native IndexedDB avoids storage dependency. Packaging uses Python standard library; no extra ZIP library.

## Network
Package-manager access needs sandbox network permission and inherited HTTP proxy. No credentials configured in environment. Live provider runs require a user key and provider-host network authorization; NOT RUN here.

## Version snapshot
{
  "wxt": {
    "version": "0.21.5",
    "size": 358958,
    "engines": {
      "bun": ">=1.2.0",
      "node": ">=22"
    },
    "peers": {
      "vite": "^6.3.4 || ^7.0.0 || ^8.0.0-0",
      "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
      "web-ext": ">=9.2.0",
      "typescript": ">=5.4"
    }
  },
  "@wxt-dev/module-react": {
    "version": "1.2.2",
    "size": 6986,
    "engines": null,
    "peers": {
      "wxt": ">=0.19.16",
      "vite": "^5.4.19 || ^6.3.4 || ^7.0.0 || ^8.0.0-0"
    }
  },
  "react": {
    "version": "19.3.1",
    "size": 178663,
    "engines": {
      "node": ">=0.10.0"
    },
    "peers": null
  },
  "react-dom": {
    "version": "19.3.1",
    "size": 8067632,
    "engines": null,
    "peers": {
      "react": "^19.3.1"
    }
  },
  "typescript": {
    "version": "7.0.2",
    "size": 2497498,
    "engines": {
      "node": ">=16.20.0"
    },
    "peers": null
  },
  "tailwindcss": {
    "version": "4.3.3",
    "size": 772893,
    "engines": null,
    "peers": null
  },
  "@tailwindcss/vite": {
    "version": "4.3.3",
    "size": 13509,
    "engines": null,
    "peers": {
      "vite": "^5.2.0 || ^6 || ^7 || ^8"
    }
  },
  "zustand": {
    "version": "5.0.16",
    "size": 95961,
    "engines": {
      "node": ">=12.20.0"
    },
    "peers": {
      "immer": ">=9.0.6",
      "react": ">=18.0.0",
      "@types/react": ">=18.0.0",
      "use-sync-external-store": ">=1.2.0"
    }
  },
  "zod": {
    "version": "4.6.7",
    "size": 6148944,
    "engines": null,
    "peers": null
  },
  "lucide-react": {
    "version": "1.66.0",
    "size": 38230524,
    "engines": null,
    "peers": {
      "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0",
      "@types/react": "*"
    }
  },
  "vitest": {
    "version": "5.0.5",
    "size": 2817789,
    "engines": {
      "node": "^22.12.0 || ^24.0.0 || >=26.0.0"
    },
    "peers": {
      "vite": "^6.4.0 || ^7.0.0 || ^8.0.0",
      "jsdom": "*",
      "happy-dom": "*",
      "@vitest/ui": "5.0.5",
      "@types/node": "^22.0.0 || >=24.0.0",
      "@edge-runtime/vm": "*",
      "@opentelemetry/api": "^1.9.0",
      "@vitest/coverage-v8": "5.0.5",
      "@vitest/browser-preview": "5.0.5",
      "@vitest/coverage-istanbul": "5.0.5",
      "@vitest/browser-playwright": "5.0.5",
      "@vitest/browser-webdriverio": "^5.0.0-beta.5 || >=5.0.0"
    }
  },
  "playwright": {
    "version": "1.64.1",
    "size": 5033957,
    "engines": {
      "node": ">=20"
    },
    "peers": null
  },
  "eslint": {
    "version": "10.14.0",
    "size": 2954291,
    "engines": {
      "node": "^20.19.0 || ^22.13.0 || >=24"
    },
    "peers": {
      "jiti": "*"
    }
  },
  "@eslint/js": {
    "version": "10.0.1",
    "size": 15687,
    "engines": {
      "node": "^20.19.0 || ^22.13.0 || >=24"
    },
    "peers": {
      "eslint": "^10.0.0"
    }
  },
  "typescript-eslint": {
    "version": "8.72.1",
    "size": 42686,
    "engines": {
      "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
    },
    "peers": {
      "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
      "typescript": ">=4.8.4 <6.1.0"
    }
  },
  "@types/react": {
    "version": "19.3.0",
    "size": 408108,
    "engines": null,
    "peers": {}
  },
  "@types/react-dom": {
    "version": "19.3.0",
    "size": 32862,
    "engines": null,
    "peers": {
      "@types/react": "^19.3.0"
    }
  },
  "@types/chrome": {
    "version": "0.3.7",
    "size": 831662,
    "engines": null,
    "peers": {}
  },
  "@types/node": {
    "version": "26.6.6",
    "size": 2586357,
    "engines": null,
    "peers": {}
  },
  "jsdom": {
    "version": "30.1.3",
    "size": 5540685,
    "engines": {
      "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
    },
    "peers": {
      "canvas": "^3.2.3"
    }
  },
  "fflate": {
    "version": "0.8.3",
    "size": 796742,
    "engines": null,
    "peers": null
  }
}
Compatible TypeScript pinned: 6.0.3

## Permission regression caught during build
WXT runtime content-script registration still inferred broad host_permissions from matches. Removed that entry and use a packaged unlisted reader.js injected only via activeTab+scripting. Production manifest must have neither content_scripts nor host_permissions. Test this invariant in packaging/unit checks. This reduces privileges, never widens them.

## Final M0/M1 review
- Privileged RPC checks exact extension ID and packaged popup/sidepanel URL; extension pages opened in tabs are allowed, web content scripts are denied.
- Streaming redaction withholds configured-key prefixes across deltas; terminal flush redacts incomplete secret suffixes. Background keeps raw temporary buffer only, never emits/logs/persists it.
- Register pending-start cancellation before async page/history reads; block settings/history mutations until request settles. Persistence failures still produce terminal UI events.
- Source packaging uses Python standard library (Python 3 required for npm run zip); extension runtime only needs Chrome.
- Native administrative block is preserved. Complete independent read-only modules/tests/docs/package only; obey PDF predecessor gate before M2.
