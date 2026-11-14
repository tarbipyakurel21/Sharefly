# Sale Comps and Pricing

What a commercial sale comp is, how sale price and its reliability are described, how comparable sales are chosen, and how buyers, sellers and owners are identified. The fields are on [models/commercial-sale-comp.md](../models/commercial-sale-comp.md).

## What a sale comp is

A sale comp is a completed sale of commercial property used as a comparable when valuing other properties. It records the price and also the story behind the deal: who bought and sold, the type of buyer, and the conditions of sale. It is different from an active for-sale listing, which is a property offered but not yet sold.

## One sale, several properties

A comp is one transaction. Its `entities[]` list the properties in it, one entry each with its `propertyId`. In this kit:

- 6,120 comps have 17,339 entities. 5,436 comps have one entity, and 684 have more than one.
- 6,621 entities are properties in the kit. The other 10,718 are properties outside it that sold in the same portfolio deals.
- `portfolioType` says what kind of sale it was: Individual (5,344), MultipleProperty (357), BulkPortfolio (327), PartOfBulkPortfolio (73), MultipleCondo (10) and PartOfMultipleProperty (9).
- `entities[].assetType` is 1 (Property) or 2 (Condo, 98 entities).

Decide the grain before counting. Count comps to count deals; count entities to count properties sold. A portfolio of ten buildings is one deal and ten properties.

## Sale type

`saleType` gives the buyer's purpose:

- **Investment (3,997 comps)**: the buyer plans to lease the property for income. The relevant facts are tenants, rents, lease expirations, operating expenses, NOI and cap rate.
- **Owner/user (109)**: the buyer plans to occupy it. The relevant facts are allowed use, operating costs and fit.
- **Investment or owner/user (6)**: either buyer type is plausible.
- **Unknown (2,008).**

## What was sold

"What sold" is not always one building. A sale may be a building only, a building with land, a portfolio, a condo unit, a leasehold or a ground lease, or may include the value of a business (typical for hotels). `isLandValueSale` marks the 6 sales where the price was for the land, not the building. Check the number of properties and the type of interest before computing price per SF.

## Sale conditions

Conditions of sale change comparability. `saleConditions[]` lists them on 1,676 comps. The most common in this kit:

| Condition | Comps |
| --- | --- |
| BulkPortfolioSale | 411 |
| TenThreeOneExchange (1031 exchange) | 371 |
| DistressSale | 241 |
| HighVacancyProperty (price below normal because the buyer must lease up the space) | 148 |
| DeferredMaintenance | 142 |
| AuctionSale | 142 |
| DebtAssumption (the buyer takes over the seller's loan) | 124 |
| PartialInterestTransfer (only part of the ownership sold) | 118 |
| RealEstateOwnedSale (a lender selling a foreclosed property) | 90 |

Sales that are not arm's length, partial interests, portfolios, condos, 1031 exchanges, land-value sales and sales with unusual financing are generally excluded when selecting comps for valuation. Sales that only move title (a correction deed, a refinance, a change in how title is held) are not market sales.

## Price and how reliable it is

`soldForPrice` is the price, filled on 3,216 comps. `salePriceStatus` says how the price was established. Always carry the status with the price.

| Status | Meaning | Comps | With a price |
| --- | --- | --- | --- |
| Confirmed (3) | Confirmed by a party to the sale | 2,476 | 2,472 |
| FullValue (5) | Not confirmed; calculated from the transfer tax | 387 | 309 |
| Approximate (2) | Reported approximately, by the buyer or in a news article | 322 | 321 |
| Unconfirmed (7) | A regional form of FullValue: derived from public records, not confirmed | 40 | 31 |
| Affidavit (1) | Taken from the affidavit of value recorded with the deed | 6 | 5 |
| Declaration (4) | Taken from the declaration of value recorded with the deed | 2 | 2 |
| Mini (6) | Only one of the sale price and the building size is public | 0 | 0 |
| Unknown (0) | No status recorded | 2,887 | 76 |

- **Texas does not publish sale prices.** It is a non-disclosure state, so prices there come from the parties or the press. 1,308 of the 3,363 comps on Houston properties carry a price, against 1,916 of the 2,767 on Los Angeles properties.
- **Allocated price.** In a portfolio sale where no individual price is known, `entities[].allocatedPrice` is an estimated share of the total for one property. `entities[].allocatedPriceStatus` is 8 (Allocated) on 2,516 entities. Treat an allocated price as an estimate.
- **A price from the transfer tax can be wrong** when the county rounded the tax or when only part of the consideration was taxed.
- **Cap rate and income** can be actual (`capitalizationRateActual`, from the property's operations at sale) or pro forma (`capitalizationRateProForma`, a projection). Label them.

## Price measures

- **Price per SF**: sale price divided by rentable building area for improved property, or gross building area for apartments. Take the area from the property record.
- **Price per unit** (apartments, `pricePerUnit`) and **price per room** (hotels, `pricePerRoom`).
- **Price per acre** and **price per SF of land** for land.
- **Cap rate** and **GIM** (`grossIncomeMultiplier`): see [metrics and formulas](metrics-and-formulas.md#4-income-value-and-returns).

For a portfolio sale, divide only a per-property price (actual or allocated) by that property's size, never the portfolio total.

## Choosing comparable sales

Dimensions an appraiser looks at:

1. **Property rights conveyed**: prefer fee simple; exclude partial interests.
2. **Financing terms**: below-market seller financing skews price (`saleFinancingType`, `downPayment`).
3. **Conditions of sale**: distressed versus arm's length.
4. **Market conditions**: when the sale happened (`soldDate`). A two-year window is common, and more recent is better.
5. **Location**: macro (same metro, within a few miles) and micro (access, walkability, transit; a few blocks can change price).
6. **Property type and functional use**: a gas station and a clothing store are both retail but not comparable.
7. **Size and scale**: area or units, floor plate, average unit size.
8. **Quality and condition**: building rating, recent capital expenditure, deferred maintenance.
9. **Effective age**: year built and year renovated.
10. **Occupancy and leasing profile**: `entities[].percentLeased` at sale, number of tenants (single tenant carries more risk), tenant credit.
11. **Income characteristics**: rents and expense structure. NNN income is not comparable to gross income.
12. **Zoning and legal constraints**: conversion or higher-density potential.

A simple screen uses the same property type, existing status, a size of 50% to 200% of the subject, a star rating within one, and a sale date within two years. It ignores subtype, age and unflagged non-market sales, so treat it as a starting set, not an answer.

## Buyers, sellers and brokers

`contacts[]` on a comp names the parties, each with a `contactRole`:

- **RecordedBuyer and RecordedSeller**: the party named on the deed, often a limited liability company (about 6,300 each).
- **TrueBuyer and TrueSeller**: the real entity behind the recorded party, such as the sponsor or fund (about 4,200 each).
- **ListingBroker and BuyerBroker**: the brokers on each side (5,947 and 2,117).

For questions about who owns, bought or sold, prefer the true party, and fall back to the recorded party when no true party is known. Rankings of brokers or brokerages are built by counting comps (deals) and summing prices (volume) for each broker in a place and period.
