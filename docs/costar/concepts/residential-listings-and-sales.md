# Residential listings and sales

This page explains how homes are listed and sold in the US, and how that shows up in the residential listings dataset. Read it before working with `data/residential-listings.jsonl`. The field-by-field reference is [models/residential-listings.md](../models/residential-listings.md).

## How a home gets listed

- **The MLS.** A multiple listing service is a database that local real estate brokers share, so that any agent can find homes listed by another agent. There are more than 500 MLSs in the US, each with its own rules and status codes ([NAR](https://www.nar.realtor/mls-online-listings/multiple-listing-service-mls-what-is-it)). Each MLS gives a listing its own number, which this dataset holds in `sourceNumber`.
- **One home, several listings.** MLS coverage areas overlap, and a broker can belong to more than one MLS, so the same home can be listed in several MLSs at once. A home can also be withdrawn and relisted, which creates a new listing. Each record in this dataset is one of those MLS listings (`id`), `residentialListingId` groups the listings of one attempt to sell or rent the home, and `propertyId` is the home. The 2,120 listings are 1,908 attempts on 1,867 homes. 41 homes have two attempts, 35 of them a sale and a rental. The listing's MLS is `mls.id`.
- **Homes.com.** Homes.com is CoStar Group's home search site. It shows MLS listings, and only the listing agent appears as the contact on a listing ([Homes.com for agents](https://www.homes.com/advertise/agents/)). Agents can buy a membership, and listings can buy a paid display tier.
- **3D tours.** CoStar offers Matterport 3D tours and floor plans to Homes.com members in some markets ([Homes.com Boost](https://www.homes.com/solutions/boost/agents)). This dataset was chosen from homes on CoStar's Matterport list, so nearly every listing has CoStar media (`media[].source` 2).
- **Pre-MLS listings.** Before a home reaches the MLS, CoStar can create a placeholder listing so that its media team can schedule a shoot. These placeholders have `mls.id` 800000 and, on 90 of the 93, permission level 215. They never appear on Homes.com and never sell.
- **Listings Homes.com does not show.** The 128 listings from `mls.id` 2099 are real Los Angeles-area MLS listings, 81 of them sold, but 127 have permission level 255, so Homes.com shows them to no one. They have no residential-listing-features record.

## The life of a listing

| Stage | What it means | In this dataset |
|---|---|---|
| Coming soon | The seller has signed with an agent, but the home is not yet on the market | `forSaleStatus` 2; `listDate` can be in the future. None in this dataset |
| Active | On the market, with no accepted offer | `listingStatus` 1, `forSaleStatus` 1 |
| Contingent | An offer is accepted, but the home stays on the market until conditions are met | `listingStatus` 1, `forSaleStatus` 3 |
| Under contract (pending) | An offer is accepted and the home is off the market | `listingStatus` 2, `forSaleStatus` 4 |
| Sold (closed) | The sale closed, or the rental was leased | `listingStatus` 4, with `closeDate`; sales also have `forSaleStatus` 5. 1,202 sales and 119 rentals. `closePrice` is missing on Texas sales |
| Off market, withdrawn, expired | The listing ended without a sale | `listingStatus` 8 (Inactive, 2 listings) or 16 (Removed, 4 listings). The inactive ones have `forSaleStatus` 6 (RecentlyOffMarket) |

These stages follow the RESO standard status list ([RESO Data Dictionary](https://dd.reso.org/DD1.7/lookups/StandardStatus/)), which most MLSs map their own codes to.

## Prices and dates

- **List price** (`currentPrice`) is what the seller asks today. **Original list price** (`originalPrice`) is what they first asked. **Sold price** (`closePrice`) is what the buyer paid at closing.
- **Rentals** use the same fields for monthly rent. Always split on `transactionType` first.
- **List date** (`listDate`) is when the listing went on the market, **contract date** (`contractDate`) when an offer was accepted, and **close date** (`closeDate`) when it closed. `history` lists every event in between, with the price at each.
- **Texas does not publish sale prices in public records** (it is a non-disclosure state), but agents report the closing price to the MLS ([Redfin](https://www.redfin.com/blog/non-disclosure-states-real-estate/)). Homes.com does not show those prices to the public, so this dataset leaves them out: Houston sold sale listings have no `currentPrice` or `closePrice`. Their asking prices are kept: `resoValues.listPrice` is the last asking price, which Homes.com shows as "Last List Price", and `originalPrice` the first. Use the Los Angeles sales for sale-price work.

## Common measures

| Measure | Formula | Notes |
|---|---|---|
| Price per square foot | `closePrice / property.sqftMin` (or `currentPrice / property.sqftMin`) | Use medians. Skip records without a living area. Compare like property types |
| Sale-to-list ratio | `closePrice / resoValues.listPrice` | Above 1 means the home sold for more than its last asking price. `currentPrice` equals `closePrice` on a closed listing, so do not divide by it. `closePrice / originalPrice` measures against the first price instead ([Redfin](https://www.redfin.com/definition/saleto-list-ratio)) |
| Days on market | `dom`, or `closeDate - listDate` in days | Counts only this listing. A relist starts the clock again, so this can undercount ([Wikipedia](https://en.wikipedia.org/wiki/Days_on_market)) |
| Price change | `currentPrice / originalPrice - 1` | Negative means the price was cut |
| Absorption rate | sold records per month / current records | Share of the current inventory that sells each month. Months of supply is the inverse, current records / sold records per month. This dataset is a sample of homes, not the whole market, so treat it as illustrative only |

## Comparable sales (comps)

A comp is a recently sold home similar to the one being valued. Appraisers pick comps that are close by (preferably the same subdivision or condo building), sold recently (ideally within 12 months), and similar in type, size, beds, baths, age and condition. They then adjust each comp's price for the differences ([Fannie Mae Selling Guide](https://selling-guide.fanniemae.com/sel/b4-1.3-08/comparable-sales)).

With this dataset:

1. Take the home to value, with its `property.address.latitude`, `property.address.longitude`, `property.propertyType`, `property.sqftMin`, `property.bedsMin` and `property.bathsFull`.
2. Pick sold records (`listingStatus` 4, `transactionType` 1) of the same `property.propertyType`, within a short distance and a similar living area. In Houston the sold prices are not in the data, so comps work only in Los Angeles.
3. Compare the comps' sold price per square foot, and apply it to the subject's `property.sqftMin`. `displayPrice.latestAVM` gives Homes.com's own estimate to compare against.

## Agents

- **Listing agent** (seller's agent) markets the home. **Buyer's agent** represents the buyer. **Dual agency** is one agent on both sides. **Co-listing** and **co-buyer** agents share a side.
- `agents[].role` is a bit flag: 1 listing agent, 2 buyer's agent, 4 co-listing agent, 8 showing contact, 16 co-buyer's agent. Codes add up, so 3 is dual agency and 9 is a listing agent who is also the showing contact.
- One person has one agent id per MLS. `userId` links an agent's records across MLSs.
- Since August 2024, MLSs no longer carry offers of commission to buyer's agents ([NAR](https://www.nar.realtor/about-nar/policies/summary-of-2024-mls-changes)), so there are no commission fields.

## Property types

`property.propertyType` is the kind of home. The last column counts the listings of each type in this dataset.

| Code | Type | Notes | Listings |
|---|---|---|---|
| 1 | Detached | A single-family house on its own lot | 1,631 |
| 4 | Condo | Owns a unit in a building; the building is shared | 274 |
| 2 | Townhouse | Shares walls with neighbors, usually owns its lot | 144 |
| 16 | Multi-family | A building with two to four units sold as one | 64 |
| 64 | Mobile or manufactured | Factory-built home | 2 |
| 128 | Commercial | A commercial building listed on the MLS | 1 |
| 0 | None | Not recorded | 4 |

The type list also has Other (8), Lots and land (32), Co-op (256), and Duplex, Triplex and Quadruplex (512, 1024, 2048). None of these occur here.

`propertyId` is the home itself (a house, or one condo unit) and `property.address.id` the parcel or building. In a condo building, many homes share one building address.

## Data-quality checks

- **Duplicates.** 232 homes (`propertyId`) have more than one listing here, and 195 attempts (`residentialListingId`) have more than one listing, almost all because the home was listed in two MLSs at once. Group by `propertyId` to count homes and by `residentialListingId` to count attempts.
- **Placeholders.** Drop `mls.id` 800000 when counting real inventory.
- **Visibility.** Filter to `permissionLevels.homes` 10 for listings the public can see.
- **Relists.** `originalPrice` and `listDate` reset when a home is relisted, which hides earlier price cuts and time on the market.
- **Missing values.** 4 listings lack `property.sqftMin`, 8 lack `property.bedsMin` and 119 lack `property.yearBuilt`. Say how many you dropped.
- **Sample, not market.** The homes were chosen from CoStar's Matterport list, not at random, so they are not a fair sample of either city's market.
