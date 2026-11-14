# Metrics and Formulas

The standard commercial real estate calculations: rent normalization, weighted averages, building-area ratios, vacancy and absorption, and income and value, with worked examples and the fields in this kit that feed them. Apartment measures are on [apartments.md](apartments.md#measures) and residential measures on [residential-listings-and-sales.md](residential-listings-and-sales.md#common-measures).

## 1. Rent

### Normalize rent to dollars per square foot per year

Rents arrive in different units. Convert everything to $/SF/year before comparing or averaging.

```
rent_psf_yr = rent_psf_month * 12
rent_psf_yr = (monthly_rent_total / square_feet) * 12
monthly_rent_total = rent_psf_yr * square_feet / 12
```

Example: $1,200 per month for 1,500 SF is (1,200 / 1,500) * 12 = $9.60 per SF per year. Going the other way, $5.84/SF/year on 38,014 SF is $18,500 per month.

In this kit the period is in `rateBasis` (1 Monthly, 2 Yearly). Houston spaces are almost all quoted yearly and Los Angeles spaces almost all monthly. The median quoted asking rate is $18.00/SF/year on yearly spaces and $2.50/SF/month on monthly ones, which is $30.00/SF/year.

### Compare like with like

Two things must match before rents are compared or averaged:

- **Rent type (who pays expenses).** A $24 NNN rent and a $47.50 full service gross rent are not comparable without adjusting for expenses. If a group of rents mixes lease types, label the result "all service types". If all rents share one type, name it (for example "modified gross"). The type is in `serviceType`.
- **Rent flavor.** Asking, contract and effective rent are different measures. State which one a number is.

### Square-foot-weighted average rent

A market or submarket rent is a weighted average, not a simple mean, so that large spaces count more.

```
weighted_rent = SUM(rent_psf_yr * SF) / SUM(SF)
```

Example: one space of 50,000 SF at $35.00 and one of 2,500 SF at $17.50.

```
simple average   = (35.00 + 17.50) / 2 = $26.25
weighted average = 35.00 * (50,000 / 52,500) + 17.50 * (2,500 / 52,500) = $34.17
```

Asking-rent averages are typically weighted by available square feet. Do not mix estimated rents into an average of quoted asking rents.

### Effective rent and net effective rent

Effective rent is the average rent over the lease term after concessions.

Straight-line net effective rent per SF per year:

```
NER = (total base rent over term - TI allowance - other concessions) / term_months * 12 / square_feet
```

NER can be negative when concessions exceed rent. For a triple-net lease with no allowance and no free rent, NER reduces to total rent divided by term months and square feet; with scheduled step-ups it ends up above the starting rent (a 15-year lease with 10% steps every five years has an NER about 10% above starting rent).

Free-rent discounting, simple form: effective rent = (term - free months) / term * contract rent.

### Escalations

- Escalation percent = (current rent - previous rent) / previous rent * 100.
- Example: $5,000 per month for 58 months, then $5,175 per month. The step is (5,175 - 5,000) / 5,000 = 3.5%.

### In this dataset

| What | Where | Records |
|---|---|---|
| Asking rent on a marketed space | `forLeaseSummary.spaces[].rateLow` and `rateHigh` in commercial-listing-summary, with `rateBasis` and `serviceType`. 0 means no rate was given | 2,196 of 3,955 spaces have a rate |
| Asking rent on a listing | `forLeaseSummary.askingRateLow` and `askingRateHigh`, with `askingRateBasis` | 335 listings |
| Asking rent on an apartment floor plan | `apartmentModels[].minRent` and `maxRent` in apartment-listing, with `rentPricingType`; `minRent` and `maxRent` on the record cover the community. 0 means no rent was given | 18,936 of 23,806 floor plans have a rent |
| Asking rent on a lease deal | `leaseDeal.askingRate` in location-occupancy | 15,647 deals |
| Contract rent | `leaseDeal.rateActual`, with `leaseDeal.rateBasis` | 2,008 deals |
| Effective rent | `leaseDeal.effectiveRate` | 868 deals |
| Free rent | `leaseDeal.freeMonths` and `freeRentSchedule[]` | 1,473 deals |
| Escalations | `leaseDeal.rateEscalations[]` | 1,188 deals |
| TI allowance | `leaseDeal.tenantImprovementAllowancePerSquareFeet` | 151 deals |

See [models/commercial-listing-summary.md](../models/commercial-listing-summary.md) and [models/location-occupancy.md](../models/location-occupancy.md).

## 2. Size and density

```
RBA = GBA - vertical_penetrations
FAR = GBA / land_area                  (same units for both; 1 acre = 43,560 SF)
parking_ratio = parking_spaces / RBA * 1,000    (spaces per 1,000 SF)
efficiency_ratio = RBA / GBA
rentable_area = usable_area * load_factor
```

- FAR example: a 40,000 SF building on a 10,000 SF lot has FAR 4.0. On a 10,000 SF lot with FAR 1.0 you could build one 10,000 SF story, two 5,000 SF stories, or four 2,500 SF stories.
- FAR is based on gross area (GBA), not rentable area. Basements, parking structures and shafts may be excluded depending on local code.
- Parking example: 500 spaces on 150,000 SF is 3.33 spaces per 1,000 SF. Use the ratio rather than the raw count when comparing buildings of different sizes.
- Per-unit and per-room measures replace per-SF for apartments and hotels.

In this kit, `grossBuildingAreaSquareFeet` is filled on 3,334 properties and `rentableBuildingAreaSquareFeet` on 550, plus the RBA in the `propertyOffice`, `propertyIndustrial` and `propertyFlex` blocks and the GLA in `propertyRetail`. `lotSize` is in the unit `lotSizeMeasurementType` names: 2 (Acres) on 2,917 properties and 1 (SquareFeet) on 409. `parkingRatio` is filled on 2,186.

## 3. Vacancy, availability, leasing and absorption

For one building or a set of buildings:

```
vacancy_rate      = vacant SF / existing RBA
availability_rate = available SF / existing RBA
vacant_available  = vacant SF that is also marketed
percent_leased    = leased SF / RBA
```

Worked example: a set of buildings with 95,172,189 SF of RBA and 1,568,934 SF of new, 8,988,038 SF of relet and 970,468 SF of sublet vacant space has a vacancy rate of (1,568,934 + 8,988,038 + 970,468) / 95,172,189 = 12.11%.

Rules:

- The denominator is existing rentable area only. Leave proposed, under construction, under renovation and demolished buildings out of both numerator and denominator (`constructionStatus`).
- Do not use available square feet in the vacancy numerator. Vacant means physically empty regardless of lease obligation, so "leased but vacant" space counts as vacant, and occupied space marketed for sublease is available but not vacant.
- Percent leased does not apply to hotels, land or apartments. Apartments use the share of units vacant instead.

Absorption:

```
net_absorption   = SF moved in - SF moved out        (can be negative)
gross_absorption = SF moved in
```

Absorption changes only when occupancy changes. A lease signed without a move-in does not move absorption, and a renewal does not count unless it adds space. Leasing activity is the total area of lease deals signed in a period; direct activity is relet plus new space, sublet activity is sublet plus assignment space.

### In this dataset

- **Occupancy over time.** Each location-occupancy record has `fromDate`, a `toDate` when the tenancy has ended (11,179 have none and are current), `moveInDate` (37,392 records) and the area in `spaces[].squareFeetOccupied`. Space moved into and out of a building by quarter gives its gross and net absorption.
- **Marketed space.** `forLeaseSummary.spaces[]` gives each space's `squareFeetMin`, `squareFeetMax` and `spaceType` (1 Relet, 2 New, 3 Sublet). Listings with `listingStatus` 1 (Active) are on the market now.
- **Leasing at sale.** `entities[].percentLeased` on sale comps gives the share leased when the property sold (5,171 entities).
- **Apartments.** `propertyApartment.vacancyPercent` (1,682 communities).
- The kit has no published market or submarket totals. Build them from these records and say which buildings you included.

## 4. Income, value and returns

Work top down.

```
EGI = potential rent (or base rent) + expense reimbursements + other income - vacancy and collection loss
NOI = EGI - operating expenses            (taxes are an operating expense)
OER = operating expenses / EGI * 100
NCF = NOI - capital items                 (leasing commissions, TI, capital expenditures)
```

Operating expenses typically include real estate taxes, insurance, utilities, repairs, janitorial, management fees, payroll, marketing, professional fees and ground rent.

```
cap_rate = NOI / price (or value)
price    = NOI / cap_rate
NOI      = cap_rate * price
```

- A lower cap rate means a higher price for the same income and usually lower perceived risk (strong tenants, new construction, long leases, strong location). A higher cap rate usually means more risk and a lower price.
- Cap rates differ widely by property type, submarket and metro.
- Actual and pro forma cap rates are different: pro forma uses projected income.
- For a true triple-net lease where the landlord has no expense obligations, NOI is approximately base rent, so annual rent can be estimated as cap rate * asking price when no rent is stated. Mark such figures as derived.

Worked example from the data: a for-sale listing asks $3,491,136 with an NOI of $384,024.96. Its cap rate is 384,024.96 / 3,491,136 = 11.0%, which is the `capitalizationRate` the listing states.

### Multipliers

```
GIM = sale_price / (gross scheduled income + other income)
GRM = sale_price / gross rental income        (typically apartments)
```

Both ignore expenses, so they are rough screens, not valuations.

### Price per unit of area

- Improved property: sale price / rentable building area. For apartments use gross building area, which is the area recorded on nearly all of them.
- Land: sale price / acres, or sale price / land SF.
- Apartments: sale price / units. Hotels: sale price / rooms.

### In this dataset

Cap rates are stored as percentages (6.54 means 6.54%).

| What | Where | Records |
|---|---|---|
| Asking price, NOI and cap rate of a for-sale listing | `forSaleSummary.askingPriceLow` and `askingPriceHigh`, `netOperatingIncome`, `capitalizationRate` in commercial-listing-summary. Where all three are given, the cap rate is NOI / asking price | 1,003 prices, 423 NOIs, 606 cap rates |
| Sale price | `soldForPrice` on commercial-sale-comp, with `salePriceStatus` | 3,216 comps |
| Cap rate at sale | `capitalizationRateActual` (in-place income) and `capitalizationRateProForma` (projected) | 1,736 and 248 comps |
| Gross income multiplier | `grossIncomeMultiplier` | 695 comps |
| Price per unit and per room | `pricePerUnit`, `pricePerRoom` | 2,355 and 69 comps |

The median actual cap rate is 6.4% on sales that include an apartment community, 7.0% on retail, 8.1% on office and 8.2% on industrial. See [valuation and income](valuation-and-income.md) and [sale comps and pricing](sale-comps-and-pricing.md).
