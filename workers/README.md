# STEMSeeds edge worker

`stemseeds-worker.mjs` is the content-negotiation layer for the custom domain. GitHub Pages remains the static origin; the worker changes only requests that advertise Markdown.

## Deployment

The current GitHub Pages origin is `https://stemseeds-nj.github.io/stemseeds/`. Deploy the worker with `ORIGIN_URL` pointing to that origin (not the custom domain, to avoid a proxy loop), then route `stemseeds.org/*` and `www.stemseeds.org/*` to the worker. Keep the existing GitHub Pages custom-domain configuration until DNS has been cut over.

The worker proxies the GitHub Pages origin, including its `/stemseeds/` path prefix. Deploy from the `workers` directory with the included `wrangler.toml`:

```sh
npx wrangler deploy
```

The Cloudflare account must have the `stemseeds.org` zone, and the deployer needs a Wrangler login or `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID`. Add the custom-domain route in Cloudflare only after the worker responds successfully at its `workers.dev` URL. The `index.md` and `404.md` files must be deployed with the rest of the site at the Pages origin. After DNS propagation, verify:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://stemseeds.org/
curl -sS -L -i -H 'Accept: text/html' https://stemseeds.org/
curl -sS -L -i -H 'Accept: text/markdown' https://stemseeds.org/a-path-that-does-not-exist
```

The first response must be nonempty Markdown with `Content-Type: text/markdown` and `Vary: Accept`; the second must remain HTML; the third must be Markdown with HTTP 404.

## Cloudflare DNS cutover

1. In Cloudflare, add `stemseeds.org` as a zone and import the existing DNS records.
2. Keep the GitHub Pages record available during the cutover, but proxy the apex and `www` traffic through the Worker route rather than pointing the Worker back to the custom domain.
3. Deploy the worker from `workers/`.
4. Test the `workers.dev` hostname with the three commands above by temporarily replacing `stemseeds.org`.
5. Add the `stemseeds.org/*` route to this worker and enable proxying for the domain's DNS record.
6. Run the same commands against `https://stemseeds.org`.
7. Keep the GitHub Pages custom-domain setting until the live checks pass. Then remove only obsolete duplicate DNS records; do not delete the Pages site.

The repository cannot perform the DNS change or create Cloudflare secrets. Those steps require access to the Cloudflare account and domain registrar.
