# Strawberry Aviation commerce block

Add an `Aviation Catalog` block to an AEM document. Configuration rows are removed when the block decorates.

| Aviation Catalog |  |  |  |  |
|---|---|---|---|---|
| Commerce origin | https://store.ajayk.xyz |  |  |  |
| Aircraft variant | SAR-90-200 |  |  |  |
| Storefront | https://store.ajayk.xyz |  |  |  |
| Product | AeroFlow Hydraulic Pump | SAS-HYD-1001 | $8,750 demo list price | https://store.ajayk.xyz/catalogsearch/result/?q=SAS-HYD-1001 |
| Product | SkySpark Starter Generator | SAS-ELC-1002 | $6,450 demo list price | https://store.ajayk.xyz/catalogsearch/result/?q=SAS-ELC-1002 |

The product rows are resilient authored fallbacks. At runtime, the block first requests the enriched anonymous contract:

`GET /rest/V1/strawberry/catalog/variant/{variantCode}`

Until that contract is deployed, it falls back to the existing compatibility endpoint, which returns native product IDs. Both calls omit credentials. The Mage-OS edge must allow only the AEM preview/live/custom-domain origins through CORS; authenticated carts, purchase requests, approvals, orders, and customer data are outside this public block.

The block states that compatibility and fulfillment projections are fictional simulations and links commerce actions back to the Mage-OS storefront.
