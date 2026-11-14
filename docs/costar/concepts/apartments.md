# Apartments

Most commercial properties in this kit are apartment communities: 2,765 of the 3,339, with 489,467 units between them. This page explains how an apartment community is described and where each part of that description is in the data. The field reference is the `propertyApartment` block on [models/commercial-property.md](../models/commercial-property.md).

## Communities, floor plans and units

- **A community** is one property rented out unit by unit. It can be one building or several (`propertyApartment.numBuildings`). Investors and lenders treat buildings of five or more units as commercial real estate, and smaller buildings trade more like houses. In this kit 2,291 communities have five or more units and 1,506 have fifty or more.
- **Community size differs by city.** The median Houston community has 279 units. The median Los Angeles community has 20.
- **A floor plan** is one layout offered in the community, such as a one-bedroom, one-bath of about 730 SF. Each floor plan is an entry in `propertyApartment.models[]` with `numBeds`, `numBaths`, `minSquareFeet`, `maxSquareFeet` and `numUnits`. A studio has `numBeds` 0, and `nonstandardApartmentRoomType` marks studios, lofts and convertibles.
- **A unit** is one apartment. Units are listed under their floor plan in `models[].units[]`, with `unitNumber` and size. `totalNumUnits` is the count of units across a community's floor plans.
- **Unit mix** is the share of units by number of bedrooms. It says who a community is built for and which communities compete with it.

| Bedrooms | Units | Share | Median floor-plan size (SF) |
|---|---|---|---|
| Studio (0) | 37,118 | 7.8% | 515 |
| 1 | 243,510 | 51.2% | 731 |
| 2 | 167,842 | 35.3% | 1,085 |
| 3 | 24,045 | 5.1% | 1,366 |
| 4 or more | 2,907 | 0.6% | |

Units are counted from `models[].numUnits`, and sizes are the median `minSquareFeet` of the floor plans.

## Building style

`apartmentStyleType` describes the buildings. Story counts are the median `numStoriesAboveGrade` in this kit.

| Style | What it is | Communities | Median stories |
|---|---|---|---|
| Garden | Low buildings set among landscaped grounds and surface parking. 748 of the 869 are walk-ups (`isWalkup`) | 869 | 2 |
| Low-rise | One to three stories on a more compact site than a garden community. 172 are walk-ups | 761 | 2 |
| Mid-rise | Four to about seven stories in this kit, almost all with elevators (47 are walk-ups) | 997 | 5 |
| High-rise | Towers: 17 to 40 stories for most high-rises in this kit | 79 | 24 |
| Townhome | Attached two-story homes rented as apartments | 29 | 2 |

## Who a community is for

`apartmentLifestyleType` names the residents a community is built for.

| Lifestyle | Meaning | Communities |
|---|---|---|
| All | The general rental market | 2,659 |
| Senior | Age-restricted housing, usually for residents 55 or 62 and older | 44 |
| Student | Housing near a campus, often leased by the bed. Its beds are its units times bedrooms per unit, and rents can be per bed | 30 |
| Corporate | Furnished units let for short stays | 21 |

`residentialProfile.colleges[]` names the colleges near 1,157 communities, with `feetToCampusBoundary`.

## Rent type and affordability

`apartmentRentType` says how rents are set.

| Rent type | Meaning | Communities |
|---|---|---|
| Market | Rents set by the market | 2,304 |
| MarketAffordable | A mix of market-rate units and affordable units | 309 |
| Affordable | Rents held below market for tenants who qualify by income | 148 |

`affordableRentSubtype` says how the affordability works.

| Subtype | Meaning | Communities |
|---|---|---|
| AffordableUnits | Some units are set aside as affordable | 214 |
| RentRestricted | A program caps the rents for income-qualified tenants, such as the federal Low-Income Housing Tax Credit | 200 |
| RentSubsidized | A government program pays part of each tenant's rent | 26 |
| RentControlled | A local law caps the rent and its increases | 10 |
| RentStabilized | A local law limits how much the rent can rise each year | 7 |

Only 17 communities carry a rent-law flag. Los Angeles has a city rent stabilization law that covers many older apartment buildings, so a missing flag does not mean a building is unregulated.

## Utilities

`apartmentMeteringType` says who pays for utilities.

- **IndividuallyMetered (1,679):** each unit has its own meters, and residents pay their own utility bills.
- **MasterMetered (132):** the building has one meter and the owner pays the bill, recovering it through the rent or separate charges.
- **Unknown (954).**

Compare rents and operating costs only between communities with the same metering.

## Vacancy

`vacancyPercent` is the share of a community's units that were empty when it was last researched. It is filled on 1,682 communities, with a median of 7%. 182 communities report 0, and one value is above 100, which is an error. It measures physical vacancy, not units on the market. The kit has no citywide apartment vacancy figure: build one by weighting each community's `vacancyPercent` by its `totalNumUnits` (see [weighted averages](metrics-and-formulas.md#square-foot-weighted-average-rent)).

`numUnitsAvailable` in apartment-listing is a different measure: the units a community is offering for rent today, by floor plan.

## Rents, fees and policies

Asking rents are in apartment-listing, the active Apartments.com listing of 1,747 of the communities: `minRent` and `maxRent` for the community and for each floor plan in `apartmentModels[]`, with `numUnitsAvailable`. 0 means no rent was given. The property record has:

- **Pet policies** in `residentialProfile.petPolicies[]` on 2,231 communities: `petType`, `numPets` allowed, `weight` limit, monthly pet `rent`, and `minFee` and `maxFee`.
- **Parking policies** in `residentialProfile.parkingPolicies[]` on 2,055 communities: the kind of parking offered (`parkingType`), such as garage, surface lot, covered lot, carport or street.
- **Concessions** recorded on sale comps (see below).

## Schools and amenities

- `residentialProfile.schools[]` lists nearby schools for 2,750 communities, a median of 8 each. Each school has `schoolName`, `schoolType` (public, private or charter), `gradeLevel` (elementary, middle or high) and `distanceMile`. `assignmentType` 1 (AttendanceZone) means the community is in the school's attendance zone; 2 (Nearby) means it is only close by.
- `amenities[]` on the property and `models[].amenities[].amenityId` on floor plans are amenity ids. The kit does not include their names.

## Apartments in the other datasets

- **Sales.** 4,850 sale comps include an apartment community in this kit. `apartments[]` on a comp records the unit mix at the time of sale: `numBeds`, `numBaths`, `numUnits`, `avgUnitSizeSqFt`, `numUnitsVacant`, `numUnitsAvailable`, and concessions (`monthlyDiscount`, `totalConcessionValue`). `pricePerUnit` is filled on 2,355 comps, with a median of $93,444. See [sale comps and pricing](sale-comps-and-pricing.md).
- **Rental listings.** 1,747 communities have an active rental listing in apartment-listing, with asking rents and units available by floor plan, the management company and the main photo. Its `apartmentModels[].id` is `propertyApartment.models[].id` here.
- **Commercial listings.** 46 property-for-sale listings and 5 portfolio listings are on apartment communities. The 213 direct lease listings on them market commercial space in the buildings, mostly ground-floor retail.
- **Tenants.** The 12,418 occupancies on apartment communities are commercial tenants, not residents: shops, offices and on-site management. 2,916 of them are companies whose `officeType` is 8 (OnSitePropertyManagement).
- **Area.** Use `grossBuildingAreaSquareFeet` for the size of an apartment building. It is filled on all 2,765 communities, and `rentableBuildingAreaSquareFeet` on 43.

## Measures

| Measure | Formula | Notes |
|---|---|---|
| Price per unit | sale price / number of units | `pricePerUnit` on the comp |
| Average unit size | SUM(`numUnits` * floor-plan size) / SUM(`numUnits`) | Take the floor-plan size as the midpoint of `minSquareFeet` and `maxSquareFeet` |
| Density | `totalNumUnits` / lot acres | `lotSize` when `lotSizeMeasurementType` is 2 (Acres). The median is 36 units per acre in Houston and 52 in Los Angeles |
| Beds | units * bedrooms per unit | For student communities |
| Vacant units | `vacancyPercent` / 100 * `totalNumUnits` | An estimate for one community |
