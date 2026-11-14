# Listings and Leasing

What a commercial listing is, the kinds of listing, how marketed space is described, and how lease terms and lease comps work. The fields are on [models/commercial-listing-summary.md](../models/commercial-listing-summary.md) and, for signed leases, [models/location-occupancy.md](../models/location-occupancy.md).

## What a listing is

A listing is a property, or part of one, marketed by an owner or broker for lease, for sale, or at auction. Marketing for lease and for sale can both be true of the same property at the same time.

An active listing is not a completed deal. A for-lease listing describes space that is being offered; a lease comp describes a lease that has been signed. A for-sale listing describes a property on offer; a sale comp describes a completed sale.

`listingStatus` says where a listing stands: 1 (Active) on 741 listings and 3 (OffMarket, taken off the market but not ended) on 281. All 3,955 spaces in `forLeaseSummary.spaces[]` belong to active listings.

## Listing types

`listingType` names the kind of listing. The last column counts them in this kit.

| Group | Listing type | Notes | In this kit |
| --- | --- | --- | --- |
| Lease | PropertyDirectSpaceForLease (14) | Space offered by the landlord, one entry per available space | 2,375 |
| Lease | CommercialSublease (19) | Space offered by a tenant | 1,554 |
| Lease | PropertyCoworking (21) | Flexible office space, treated as sublet-type space | 153 |
| Lease | BuildingParkDirectSpaceLease (16) | Direct space across the buildings of a park; `forLeaseSummary.properties[]` lists them | 122 |
| Lease | ShoppingCenterDirectSpaceForLease (17) | Direct space across the buildings of a shopping center | 56 |
| Sale | PropertyForSale (9) | One property for sale | 1,483 |
| Sale | CommercialPortfolioForSale (13) | Several properties sold together | 103 |
| Sale | ConsolidatedCondoForSaleListing (15) | Condo units in one building, each with its own sale record | 23 |
| Sale | LandForSale (12) | One record can cover several lots, each with its own price and size | 8 |
| Auction | PropertyForAuction (22), LandForAuction (23), CommercialPortfolioForAuction (26), CondoForAuction (24) | Sale at auction, described in `auctionForSaleSummary` | 94 |

## Space types

`spaceType` on a space says how it comes to the market:

- **Relet (1)**: previously occupied space offered by the landlord. 3,394 spaces.
- **New (2)**: never-occupied space. 49 spaces.
- **Sublet (3)**: space offered by the current tenant. 793 spaces.
- **Assignment (4)**: transfer of the full lease. None in this kit.

Listings and reports often say "Direct" where the underlying value is Relet plus New. Direct lease activity combines relet and new space.

## Space use

The use of a space can differ from the building's primary type. A multi-use building such as an office building with ground-floor retail has spaces of different uses. `spaceUse` on the kit's spaces is Office (3,017), Retail (441), OfficeMedical (252), Industrial (205), Flex (135), OfficeRetail (112) and Medical (74).

## Describing a space

| What | Field on `forLeaseSummary.spaces[]` |
| --- | --- |
| Floor and suite | `floorName`, `suite` |
| Area available, a range if the space is divisible | `squareFeetMin`, `squareFeetMax` |
| Contiguous area, the largest combinable block (not the sum of all spaces) | `squareFeetMaxContiguous` |
| Full floor | `isFullFloor` (388 spaces) |
| Executive suite, a small furnished office | `isExecutiveSuite` (588 spaces) |
| When it is available | `availableOnDate`, or `availabilityType` such as 1 (ThirtyDays) or 5 (ToBeDetermined) |
| When it came on the market | `dateOnMarket` |
| Lease term offered | `leaseTermType` |

## Availability versus vacancy

| State | Lease obligation | Physically occupied | Marketed |
| --- | --- | --- | --- |
| Vacant and available | None, or expiring | No | Yes |
| Leased but vacant | Yes | No | Possibly |
| Leased and occupied | Yes | Yes | No, unless sublet |
| Available but occupied | Current tenant moving out | Yes, for now | Yes |

Available means marketed. Vacant means empty. A question about "how much space is on the market" and a question about "how empty is the market" have different answers.

## Rent on a listing

An asking rent is stated with a rent basis (annual or monthly), an area basis (per SF, or total), and a service type (who pays what).

- **Rate.** `rateLow` and `rateHigh` on each space, and `askingRateLow` and `askingRateHigh` for the listing as a whole. A rate of 0 means no rate was given, which is true of 1,759 of the 3,955 spaces.
- **Basis.** `rateBasis` is 1 (Monthly) or 2 (Yearly). Houston spaces are quoted yearly and Los Angeles spaces monthly, so convert before comparing (see [metrics and formulas](metrics-and-formulas.md#normalize-rent-to-dollars-per-square-foot-per-year)).
- **Service type.** `serviceType` says who pays the building's expenses: FullService (1,058 spaces), TripleNet (1,048), PlusElectric (259), ModifiedGross (254) and others. Negotiable (736) and ToBeDetermined (807) mean no service type was quoted.

## Lease comps

A lease comp records an executed lease: the tenant, space, dates, term, rent and concessions. In this kit lease deals are the `leaseDeal` of a location-occupancy record (41,781 of them).

Key dates:

| Date | Meaning | Field |
| --- | --- | --- |
| Sign date | When the lease was executed | `leaseDeal.signDate` (26,326 deals) |
| Commencement date | When the lease term begins | `leaseDeal.commencementDate` (32,148) |
| Expiration date | When the lease term ends | `leaseDeal.expirationDate` (15,547) |
| Move-in date | When the tenant actually occupies. This is what drives absorption | `moveInDate` on the occupancy (37,392) |

Key terms:

- **Deal type**: new lease (`leaseDealType` NewLease, 34,547) or renewal (2,906).
- **Term**: `leaseTerm` with `leaseTermType` (years or months).
- **Rent**: asking (`askingRate`), contract (`rateActual`) and effective (`effectiveRate`), each with a `rateBasis`, and the `serviceType`.
- **Concessions**: free rent (`freeMonths`, `freeRentSchedule[]`) and the improvement allowance (`tenantImprovementAllowancePerSquareFeet`).
- **Escalations**: `rateEscalations[]`.
- **Options**: renewal, expansion, termination, purchase and right of first refusal, in the `*OptionState` and `rightOf*State` fields. They are filled on few deals.

### Net lease investment sales

A net-leased property for sale is marketed on its lease. The offering usually gives the asking price, the cap rate and annual NOI, the type of ownership (fee simple or ground lease), and for each tenant the lease term, renewal options and rent schedule. For an absolute NNN lease the landlord pays no expenses, so NOI is about equal to rent. Escalations in net leases tend to be periodic, for example 10% every five years or 3% a year. In this kit the price, NOI and cap rate are in `forSaleSummary` (see [valuation and income](valuation-and-income.md)).
