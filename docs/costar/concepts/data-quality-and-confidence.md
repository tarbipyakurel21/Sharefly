# Data Quality and Confidence

Why values in the kit differ in reliability, and how to qualify an answer that depends on estimated, undisclosed, missing or inconsistent values.

Commercial values are researched building by building, so each value is as of the last time it was researched, not today. Residential listings are what the MLS reported to Homes.com.

## Things to qualify in an answer

| Situation | Where it shows | What to say |
| --- | --- | --- |
| Sale price is estimated | `salePriceStatus` FullValue, Unconfirmed or Approximate | The price was calculated or reported, not confirmed |
| Sale price is not public | No `soldForPrice`; common in Houston, because Texas does not disclose sale prices | The price is unknown, not zero |
| Portfolio per-property price | `entities[].allocatedPriceStatus` 8 (Allocated) | The price is an estimated share of the portfolio total |
| Cap rate or income is pro forma | `capitalizationRateProForma`; a listing's `capitalizationRate` can be either | It is a projection, not actual operating results |
| Sale below market | `saleConditions[]` such as DistressSale or DeferredMaintenance | The conditions affect comparability |
| Rent is asking, contract or effective | `askingRate`, `rateActual`, `effectiveRate` | State which one; they are different |
| Rents mix service types | `serviceType` | Label the result "all service types" or filter to one |
| Tenant list is out of date | Current tenancies have no `toDate` | A tenancy may have ended after it was last researched |
| Residential sold price in Texas | No `closePrice` on Houston sales | Only the asking price is known |
| Residential listing not public | `permissionLevels.homes` other than 10 | Homes.com visitors do not see this listing |

## Missing values

- A blank, zero or null is not always the same thing. A rate of 0 on a listing space means no rate was given, so exclude zeros before averaging and say how many you dropped.
- Fields differ in how fully they are filled. `rentableBuildingAreaSquareFeet` is on 550 of 3,339 properties, while `grossBuildingAreaSquareFeet` is on 3,334. Look at the number of non-null values before drawing conclusions.
- An unknown enum value (usually `0`) means the value was not recorded, not that the answer is "none". Construction material is Unknown on 875 properties.
- A missing value can mean "not collected", "not applicable" or "unknown". Do not assume.

## Consistency checks

| Check | Rule | In this kit |
| --- | --- | --- |
| Class versus rating | Class A pairs with ratings 3 to 5, Class B with 2 to 4, Class C with 1 to 3, Class F with 1 | Every rated building passes |
| Sizes | RBA and the typical floor must not exceed GBA | 2 properties have RBA above GBA and 1 a typical floor above GBA |
| Lease dates | Signing comes before commencement, and commencement before expiration | 5 deals are signed after commencement and 1 commences after it expires |
| Apartment vacancy | `vacancyPercent` is between 0 and 100 | 1 community is above 100 |
| Duplicates | The same sale can arrive from several sources | Check comps on the same property and date |
| Units | Apartment and hotel sales below five units are usually not tracked as investment comps | |
| Lease deals | A net effective rent that differs from the starting rent by more than about 50% is worth checking, though long leases with large step-ups can legitimately do so | |

Report records that fail a check rather than silently dropping them.

## Samples, not markets

- The properties and homes are the ones on CoStar's Matterport 3D capture list, not a random sample. They are not a fair sample of either city's buildings or homes.
- 2,765 of the 3,339 commercial properties are apartment communities, so totals over "all properties" are mostly about apartments. Split by `propertyType` first.
- A portfolio sale can include properties outside the kit (10,718 of the 17,339 sale entities), whose details are not here.
