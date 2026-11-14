# Property Types and Building Measurement

How commercial properties are grouped by type and subtype, how buildings are graded, how their lifecycle status is described, and how building area is measured. The fields are on [models/commercial-property.md](../models/commercial-property.md).

## Primary property types

`propertyType` is the primary type. The last column counts the properties of each type in this kit.

| Type | What it covers | In this kit |
| --- | --- | --- |
| Multifamily | Apartments, dormitories, manufactured housing parks. Five or more units is the usual investor threshold. See [apartments.md](apartments.md) | 2,765 |
| Office | Buildings whose main use is housing company employees. Includes medical office, business parks, loft and creative space | 289 |
| Industrial | Warehouses, distribution, manufacturing, cold storage, truck terminals, light industrial | 122 |
| General Retail | Stores, restaurants, banks, service stations, supermarkets and shopping centers | 65 |
| Hospitality | Hotels, motels and similar. See [hotels-and-land.md](hotels-and-land.md) | 55 |
| Flex | Buildings combining office or showroom space with warehouse or light industrial space, such as R&D and light manufacturing | 31 |
| Land | Land without significant improvements | 5 |
| Specialty | Purpose-built property such as self-storage, parking, schools, religious facilities and utility facilities | 5 |
| Health Care | Assisted living, senior housing, hospitals, rehabilitation and skilled nursing | 2 |
| Mixed use, Sports and Entertainment | More than one space type in one building; amusement, golf, theaters and similar | 0 |

`propertySubtype` refines the type, for example Industrial_Warehouse (93 properties), Office_Medical (44), Office_LoftOrCreativeSpace (33) or GeneralRetail_Freestanding (13). When someone says "retail" or "apartments", map the word to the primary type first, then look at the subtype if it matters. `propertyGroupSubtype` places a property in a park or center, such as IndustrialPark (72), OfficePark (43), StripCenter (14) or NeighborhoodCenter (11).

## Attributes that matter by type

- **Office**: floor plate size, number of stories, class, finishes and amenities, parking, transit access, age or renovation. In this kit: `propertyOffice.tenancyType` (single or multi-tenant) and `rentableBuildingAreaSquareFeet`.
- **Industrial and flex**: clear height, loading docks and drive-in doors, column spacing, power, rail service, truck court and trailer parking, percentage of office build-out, sprinklers. In this kit: `numExternalLoadingDocks`, `driveInBays`, `hasCrossDocks`, `electric` and `utilities` in `propertyIndustrial` and `propertyFlex`, and `hasSprinklers` on the property. Clear height is not in the kit.
- **Retail**: position in the center (end cap, in-line, outparcel or pad, anchor), anchor and co-tenancy, frontage, visibility, traffic counts, drive-through, demographics. In this kit: `propertyRetail.grossLeasableAreaSquareFeet` and `frontage`, and `spaces[].spacePosition` on tenancies.
- **Multifamily**: unit mix and count, vacancy, amenities, year built, senior or student designation. See [apartments.md](apartments.md).
- **Hospitality**: rooms, brand, operator, chain scale, average daily rate. See [hotels-and-land.md](hotels-and-land.md).
- **Land**: zoning, utilities, road access, frontage, topography, acreage.

## Building class and building rating

Building class (`buildingClass`: A, B, C, and F for functionally obsolete) is market-relative and partly subjective. The 1 to 5 star building rating (`buildingRating`) is a national, peer-group measure. They are related but not the same, and the usual pairings are:

- Class A: rating 3, 4 or 5
- Class B: rating 2, 3 or 4
- Class C: rating 1, 2 or 3
- Class F: rating 1

Every rated building in this kit follows these pairings. The kit has 690 Class A, 1,441 Class B and 1,198 Class C buildings, and ratings of 1 star (5), 2 (903), 3 (1,380), 4 (953) and 5 (93).

## Lifecycle (construction status)

`constructionStatus` gives the lifecycle stage.

| Status | Meaning | In this kit |
| --- | --- | --- |
| Proposed | Announced, not expected to start within 12 months; permits usually not issued | 0 |
| Final planning | Will start within 12 months; contracts signed or permits issued | 0 |
| Deferred | Activity stopped but may resume within 12 months | 0 |
| Abandoned | Terminated; all work has stopped and no permits are active | 1 |
| Under construction | Being built. A concrete foundation must be in place. Ends when the certificate of occupancy is issued | 6 |
| Under renovation | Unoccupied and being renovated | 6 |
| Existing | Completed with a certificate of occupancy and ready for occupancy | 3,308 |
| Demolished | Torn down or destroyed | 11 |
| Converted | Changed from one property type to another, for example office to multifamily | 7 |
| Under redevelopment / Redeveloped | Major alteration of a building that keeps part of the original structure and changes use, area or number of stories | 0 |

Existing inventory excludes everything before "existing". Redevelopment comes in three forms: adaptive reuse (keeps key, often historic, parts and always changes use), repositioning (a major upgrade with no change of use) and conversion (a fundamental change of use).

Dates are in `constructionEvents[]`, each an `eventType` and a `year`. The year built is the event with `eventType` 2 (ConstructionComplete), on 3,329 properties. Renovations are events 3 to 5 and the `renovations[]` list (170 properties).

## Construction type

Construction type describes the structural system. In this kit `buildingConstructionMaterial` is WoodFrame on 999 properties, Masonry on 905, Steel on 266, ReinforcedConcrete on 244 and Metal on 49. It is Unknown on 875, and an unknown value does not mean "none".

## Area measurement

| Measure | Where measured | Includes shafts | Includes common areas | Used for | In this kit |
| --- | --- | --- | --- | --- | --- |
| GBA | Outside face of exterior walls | Yes | Yes | Construction, zoning, tax, FAR | `grossBuildingAreaSquareFeet`, 3,334 properties |
| RBA | Inside the walls, excluding vertical penetrations | No | Yes (tenant share) | Leasing, revenue, vacancy denominators | `rentableBuildingAreaSquareFeet`, 550 properties, and in the office, industrial and flex blocks |
| GLA | As RBA, for retail | No | Yes (tenant share) | Retail leasing | `propertyRetail.grossLeasableAreaSquareFeet`, 65 properties |

- Areas are in square feet. Land is in acres or square feet, as `lotSizeMeasurementType` says; 1 acre = 43,560 SF.
- RBA must not exceed GBA, and a typical floor must not exceed GBA.
- Apartment buildings record GBA, not RBA. Use GBA for their price per SF.
- Leases for space can be quoted on usable area, so use the load factor to convert.
- `grossTypicalFloorSquareFeet` is the typical floor (2,853 properties), `numStoriesAboveGrade` the number of stories (3,327) and `buildingHeightInFeet` the height (361).

## Green certifications

Buildings may carry LEED, BREEAM, Energy Star or NABERS certification. In this kit 60 properties have LEED records in `environmental.leedCertifications[]`, each with a level (`propertyLeedType`: Certified, Silver, Gold, Platinum, Pre-certified or Registered) and begin and end dates. A certification can lapse, so check the end date.
