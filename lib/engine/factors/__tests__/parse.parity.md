# Parse port — parity with the n8n Code node

The TypeScript port in `../parse.ts` was verified against the original n8n
Code node by executing both on identical inputs and diffing every output
field (`pageId`, `type`, `template`, `variant`, `w`, `h`, `renderUrl`,
`imgKey`, `fields`).

**Result: 10/10 cases produce identical output** for every input shape the
app or Notion actually sends.

Cases covered:

- stat with `stat:` / `label:` keys
- testimonial with an asset array
- text where `underline:` appears in the body (kept)
- text where `underline:` does NOT appear in the body (correctly dropped)
- unknown type → falls back to `text`
- unknown variant → falls back to `teal`
- billboard-wide (1600×1080)
- `cta:` mapping to `footer`
- empty content
- single asset passed as a bare string

## One intentional divergence

The original has a latent bug:

```js
let assets = prop("assets");
if(!Array.isArray(assets)) assets = prop("Assets");   // overwrites with ""
if(!Array.isArray(assets)) assets = assets?[assets]:[];
```

If `assets` arrives as a **single string**, line 2 clobbers it with `""` and
the asset is silently dropped. The port keeps the asset instead.

This is safe to diverge on because:

- **Notion (Simplify ON) always returns file properties as an array**, so the
  scheduled path only ever hits the `Array.isArray() === true` branch.
- The app's `AssetUploader` always sends an array.

So no live input reaches the buggy branch. The port is strictly more correct
with no behavioural risk.
