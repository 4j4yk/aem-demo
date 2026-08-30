# Analytics event taxonomy

The demo uses a vendor-neutral event contract that can be mapped to Adobe Client
Data Layer and Adobe Analytics without coupling UI blocks to a licensed tenant.
Events remain in a local diagnostic buffer until consent is granted.

| Event | Trigger | Useful fields |
| --- | --- | --- |
| `newsroom.index-ready` | Story index or authored fallback becomes available | `source`, `stories` |
| `newsroom.search` | A visitor changes the search query | `query`, `results` |
| `newsroom.filter` | A visitor changes the category | `category`, `results` |
| `newsroom.sort` | A visitor changes date order | `sort`, `results` |
| `newsroom.load-more` | A visitor reveals another result page | `visible`, `results` |
| `article.related-click` | A related story is selected | `href`, `title` |
| `page.scroll-depth` | The page first crosses 25%, 50%, 75%, or 100% | `depth` |
| `experiment.view` | A control or challenger variant is shown | `experiment`, `variant` |
| `experiment.conversion` | A link inside the selected variant is activated | `experiment`, `variant`, `href` |

Each record includes a timestamp and page path. Production mapping should add
the approved organization schema, identity strategy, consent categories, and
data-retention rules before forwarding events to Adobe Experience Platform.
