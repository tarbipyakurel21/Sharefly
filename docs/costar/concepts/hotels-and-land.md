# Hotels and Land

Short guides to two property types with their own terms and measures. Apartments, the largest property type in the kit, have their own page: [apartments.md](apartments.md).

## Hotels

The kit has 55 hotels, all subtype Hospitality_Hotel. Their attributes are in `propertyHospitality` on [models/commercial-property.md](../models/commercial-property.md).

- **Size.** A hotel is measured in rooms, not square feet. `numUnits` is the room count (median 92), and `rooms[]` breaks the rooms down by `roomType` with `numRooms`, `averageDailyRate`, `dailyRateLow` and `dailyRateHigh`.
- **Price.** ADR (average daily rate) is room revenue divided by rooms sold, the average price of an occupied room for one night. `averageDailyPricePerRoom` is the hotel's ADR (median $107.63).
- **Class.** `hotelClass` is the chain scale: UpperMidscale (21), Upscale (16), Economy (8), Midscale (6) and UpperUpscale (3). `hotelTier` groups the scales into upper, middle and lower tiers.
- **Brand and operation.** `hotelBrandName` names the brand (49 hotels). `hotelOperationType` is Franchise (49) or Independent (5).
- **Facilities.** Meeting space (`totalMeetingSpaceSquareFeet`, `largestMeetingSpaceSquareFeet`, `numMeetingRooms`), pools, corridor type, and `operatingStatus` (open or closed).
- **Occupancy and RevPAR are not in the kit.** RevPAR (revenue per available room) is ADR times occupancy, so it cannot be computed here.
- **Sales.** `pricePerRoom` on 69 sale comps is the hotel price measure, and `entities[].hotelClass` gives the class at sale. Hotel sales can include the value of the business (`saleConditions` BusinessValueIncluded, 19 comps), so check the conditions before comparing prices.

## Land

The kit has 5 land properties (`propertyType` 3), with their attributes in the `land` block, and 8 land-for-sale and 4 land-auction listings.

- Land is described by acreage, zoning, utilities, road access, frontage, topography and best use. `lotSize` gives the area in the unit `lotSizeMeasurementType` names, and `zoningDescription` the zoning (filled on 2,309 properties of all types).
- **Price measures**: price per acre, and price per SF of land (1 acre = 43,560 SF).
- **FAR** (floor area ratio) states how much can be built on a lot, and higher allowable FAR generally raises land value. Land records have no building area, so FAR does not apply to them.
- **Ground lease**: a long lease of land, typically 20 to 99 years; at the end, what was built on the land returns to the landowner.

## Health care and specialty

The kit has 2 health care properties and 5 specialty properties (special-purpose buildings such as self-storage, parking or schools). Neither type has its own attribute block; they are valued mostly on their use and income.
