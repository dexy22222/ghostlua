# Handling secrets

Do **not** commit any of the following to GitHub (or any public repo):

- **Steam Web API key** — use `npx wrangler secret put STEAM_API_KEY` for production, and `.dev.vars` locally (see `.dev.vars.example`).
- **Cloudflare API token** — set `CLOUDFLARE_API_TOKEN` only in your shell, CI secrets, or the Cloudflare dashboard; never in tracked files.
- **Any third-party API keys**, database URLs with passwords, or private upstream URLs you consider sensitive.

`wrangler.toml` **`[vars]`** are embedded in deployment metadata and can appear in logs or dashboards; treat them as **non-secret** configuration only. For Steam, **always** use Wrangler **secrets**, not `[vars]`.

If a key was ever committed, **rotate it** in the provider’s dashboard (Steam / Cloudflare) and use the new value only via secrets or `.dev.vars`.
