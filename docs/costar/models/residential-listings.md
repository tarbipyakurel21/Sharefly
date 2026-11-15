# Residential Listings

A residential listing is one MLS listing of a home for sale or for rent on Homes.com: the listing's prices, status and dates, the home's size, rooms and features, its address, agents and offices, photos and 3D tours, price history and estimated value. Each record is the listing as a visitor to the Homes.com listing page sees it.

## What this record is

A home reaches Homes.com through an MLS (multiple listing service), the system that local agents use to share listings. Each record here is one MLS listing, and `id` is its MLS listing id, the LISTING_ID of CoStar's Matterport list.

- **One attempt to sell or rent a home can have several listings.** The same home can be listed in more than one MLS, relisted, or carry a CoStar placeholder listing. `residentialListingId` groups the listings of one attempt, and `isPrimaryForThisListingInstance` marks the one Homes.com shows for it. 195 homes in this dataset have more than one listing here.
- **Status comes in two forms.** `listingStatus` is the MLS status: 1 Active, 2 Contract, 4 Sold (which also covers a leased rental), 8 Inactive, 16 Removed. `forSaleStatus` (for sales) and `forRentStatus` (for rentals) are the Homes.com statuses, such as ComingSoon, ContingentPending or RecentlyOffMarket.
- **Sales and rentals share the fields.** `transactionType` 1 is for sale and 2 is for rent. For a rental, `currentPrice`, `originalPrice` and `closePrice` are monthly rents.
- **Asking is not achieved.** `originalPrice` is the first asking price and `resoValues.listPrice` the last. `currentPrice` is the asking price while a listing is active and equals the sale price once it closes. `closePrice` is the closing price and is filled only on closed listings.
- **The home and its building are described in `property`.** `property` holds the address, beds, baths, square feet, lot size, year built, parking, stories, subdivision and taxes, plus `property.listings`, the other MLS listings of the same home. `propertyId` is the home (a house, or one condo unit) and `property.address.id` the parcel or building address.
- **Features come in three sets.** `resoValues` holds the MLS's structured features (heating, cooling, appliances, HOA fees, garage, pool and more), `costarFeatureValues` CoStar's own summary flags, and `specialFeatures` a few listing badges. Many of their codes are bit flags. The residential-listing-features dataset has the same listing's features as readable text, joined on `id`.
- **History and estimated value.** `history` lists the listing's events (new listing, price change, under contract, sold, off market) with the price at each. `displayPrice.latestAVM` is Homes.com's automated estimate of the home's value.

## Using this data

- **Split sales from rentals first.** In this dataset the median asking price of a current listing is $344,000 for a sale and $2,300 a month for a rental, so mixing them ruins any average.
- **Split current from closed.** Compare asking prices with asking prices and closing prices with closing prices. Filter on `listingStatus` or on `forSaleStatus` and `forRentStatus`.
- **Count homes, not listings, when the question is about homes.** Group by `residentialListingId` for one attempt to sell or rent, or by `propertyId` for the home across attempts. To keep one row per attempt, keep the record with `isPrimaryForThisListingInstance` true.
- **Texas sale prices are not in the data, but asking prices are.** Texas is a non-disclosure state, so Homes.com hides what a sold home sold for and shows its last asking price instead, as "Last List Price". On the 929 sold or recently off-market Texas sale listings, `currentPrice` (which holds the sale price on a sold listing), `closePrice` and the price on the sold event in `history` are null. `originalPrice` and `resoValues.listPrice`, `originalListPrice` and `previousListPrice` are the asking prices; `resoValues.listPrice` is the last one. Los Angeles sold listings carry their prices (275 sales, median close price $1,010,000).
- **Know which listings the public sees.** `permissionLevels.homes` 10 means anyone can see the listing on Homes.com. 210 and 215 are CoStar staff only, and 255 is hidden from everyone. 228 listings here are not public. 93 have `mls.id` 800000: placeholder listings that CoStar creates so its photographers can schedule a shoot before the home reaches an MLS. Filter to 10 when your question is about what the public sees.
- **Price per square foot.** Divide `currentPrice` (or `closePrice`) by `property.sqftMin`, and skip listings without a living area. Report medians rather than means, because a few large homes pull a mean up.
- **Sale-to-list ratio and days on market.** `closePrice / resoValues.listPrice` compares the closing price with the last asking price; `currentPrice` equals `closePrice` on a closed listing, so dividing by it always gives 1. `dom` is the days on market Homes.com reports. For a closed listing, `closeDate - listDate` counts only this listing, so a relisted home can show fewer days than it really spent on the market.
- **Lot size is in acres.** `property.lotSizeAcresMin` is the lot in acres. 0.15 acres is about 6,500 square feet. Condos often have a very small or zero lot size.
- **Agent roles are bit flags.** Test `agents[].role & 1` for the listing (seller's) agent and `role & 2` for the buyer's agent. 9 means listing agent and showing contact.
- **Opening images.** Photo, logo and profile image links point at `images.homes.com` or `imagescdn.homes.com` at image size 112, up to 1,600 pixels wide. Map links (`/m2/`) are 1800×1200. To get another size, replace the `/112/` path segment with another size id: 114 (1024×1024), 210 (2560×1440 for full width on a desktop), 102 (984×658), or 117, 214 and 215 (variable height). Add `?t=p` for a portrait image. Every `imagescdn` photo link ends in `p=1`, which returns a placeholder instead of a 404 when an image is missing.
- **3D tours.** `media` items of type 43 (Matterport 3D scan), and floor plans and aerials with `externalReferenceType` 36 or 234, carry a Matterport model id in `videoKey` and `uri`. The ids match the `MatterportModelId` rows of `residential-listings.csv` for the same `ListingId`.

## What is in this dataset

- **Which listings:** the 2,120 MLS listings on CoStar's Matterport list for Houston and Los Angeles, for 1,867 homes (`propertyId`) in 1,908 sales or rentals (`residentialListingId`). `residential-listings.csv` lists them with their Matterport model ids and addresses.
- **Status:** 787 Active, 6 Contract, 1,321 Sold, 2 Inactive and 4 Removed. By transaction, 1,975 are for sale and 145 for rent. Every sold listing closed between 2025-11-10 and 2026-11-09.
- **Places:** Houston and the Galveston and League City area in Texas (1,700 listings), and Los Angeles in California (420).
- **Public and non-public listings:** all 2,120 are included, including the 228 that Homes.com does not show the public. Use `permissionLevels.homes` to tell them apart.
- **Fake contact details:** agent, office, HOA and builder email addresses and phone numbers, including those in bios and `attributionContact`, are fake, the same fake for the same real value in every dataset.
- **Currency:** `monetaryUnit` is 1 (US dollars) on every listing.

## Joining to other models

Join on integer ids, never on names.

- `id` is the MLS listing id, the LISTING_ID of the source Matterport list and the `ListingId` key in `residential-listings.csv`. It is unique in the file.
- `residentialListingId` groups the MLS listings of one attempt to sell or rent one home (the `ResidentialListingId` column of `residential-listings.csv`). Several records can share it; `isPrimaryForThisListingInstance` marks the one Homes.com shows.
- `propertyId` identifies the home (a house, or one condo unit), and `property.address.id` the parcel or building address. Group by `propertyId` to follow one home across attempts.
- `property.listings[].id` are the MLS listing ids of the home's other listings, and `property.listings[].listingInstanceId` their `residentialListingId`.
- The commercial datasets have no link to residential listings. Compare them by location: `property.address.latitude` and `property.address.longitude`, or `property.address.zip`.
- `id` with the `videoKey` of a Matterport item in `media` (`externalReferenceType` 36 or 234) joins to `ListingId` and `MatterportModelId` in `residential-listings.csv`.
- `id` joins to `residential-listing-features` `id`, the listing's feature text. 221 listings have no features record.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### ResidentialListingDetail (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the MLS (multiple listing service) listing; each record in this file is one MLS listing. |  |
| `residentialListingId` | integer (nullable) | Id of one attempt to sell or rent one home, shared by every MLS listing of that home and attempt. Several records can have the same value. |  |
| `propertyId` | integer | Id of the home itself: a house, or one condo or apartment unit. |  |
| `transactionType` | integer (TransactionType) (nullable) | Whether the listing is for sale or for rent. Filter on this before comparing prices, because rentals carry monthly rent. | 0 = None, 1 = ForSale, 2 = ForRent, 3 = All |
| `listingStatus` | integer (ListingStatus2) (nullable) | MLS status of the listing: active, contract (under contract), sold (which also covers a leased rental), inactive or removed. | 0 = None, 1 = Active, 2 = Contract, 4 = Sold, 8 = Inactive, 16 = Removed |
| `forSaleStatus` | integer (ForSaleStatus) (nullable) | Homes.com for-sale status of the listing, such as for sale, under contract, sold or recently off market. Null on rentals. | 0 = Unknown, 1 = ForSale, 2 = ComingSoon, 3 = ContingentPending, 4 = UnderContract, 5 = Sold, 6 = RecentlyOffMarket |
| `forRentStatus` | integer (ForRentStatus) (nullable) | Homes.com for-rent status of the listing, such as for rent or rented. Filled only on rentals. | see `ForRentStatus` in Allowed values |
| `listDate` | date-time (nullable) | Date the listing was put on the market, as an ISO 8601 date-time. |  |
| `offMarketDate` | date-time (nullable) | Date the listing went off the market, as an ISO 8601 date-time. |  |
| `contractDate` | date-time (nullable) | Date the home went under contract, as an ISO 8601 date-time. |  |
| `closeDate` | date-time (nullable) | Closing date of the sale, or the lease date for a rental, as an ISO 8601 date-time. Filled mainly on sold listings. |  |
| `availabilityDate` | date-time (nullable) | Date a rental or new home becomes available, as an ISO 8601 date-time. Filled on few listings. |  |
| `certifiedDate` | date-time (nullable) | Date a new-home listing was last certified or updated by the builder, as an ISO 8601 date-time. Filled on few listings. |  |
| `closePrice` | decimal (nullable) | Final price at closing in US dollars: the sale price for a sale, or the agreed monthly rent for a rental. Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `currentPrice` | decimal (nullable) | Current asking price in US dollars: the list price for a sale or the monthly rent for a rental. On a sold listing it is the last asking price before the sale. Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `listPriceMax` | decimal (nullable) | Highest list price in US dollars across a new-home floor plan's listings. Filled on few listings. |  |
| `listPriceMin` | decimal (nullable) | Lowest list price in US dollars across a new-home floor plan's listings. Filled on few listings. |  |
| `rentMax` | integer (nullable) | Highest monthly rent in US dollars for the rental listing. Filled on rentals only. |  |
| `rentMin` | integer (nullable) | Lowest monthly rent in US dollars for the rental listing. Filled on rentals only. |  |
| `listingType` | integer (ListingType2) (nullable) | Kind of sale, such as resale, new home, short sale or foreclosure. Bit flags: a value can combine several codes. | 0 = None, 1 = Resale, 2 = NewHome, 4 = ShortSale, 8 = Foreclosure, 16 = Auction, 32 = RealEstateOwned, 64 = Preforeclosure |
| `dom` | integer (nullable) | Days on market: the number of days the listing has been on the market. |  |
| `domDate` | date-time (nullable) | Date on which `dom` was last counted, as an ISO 8601 date-time. |  |
| `virtualDateOnMarket` | date-time (nullable) | Date on market adjusted to account for time the home spent off the market, as an ISO 8601 date-time. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency of the prices on the listing; every listing in this kit uses US dollars. | see `MonetaryUnit` in Allowed values |
| `originalPrice` | decimal (nullable) | Asking price when the listing was first put on the market, in US dollars (monthly rent for a rental). Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `removedDate` | date-time (nullable) | Date the listing was removed from Homes.com, as an ISO 8601 date-time. Filled on few listings. |  |
| `remarks` | text (nullable) | The agent's public marketing description of the home, as free text. |  |
| `sourceNumber` | text (nullable) | The MLS number of the listing, the number agents use to find it in their MLS. |  |
| `altSourceNumber` | text (nullable) | A second MLS number for the listing, when the MLS uses one. Filled on few listings. |  |
| `specialFeatures` | integer (ListingSpecialFeatures) (nullable) | Marketing flags on the listing, such as new home, price reduction or virtual tour. Bit flags: a value can combine several codes. | see `ListingSpecialFeatures` in Allowed values |
| `resoValues` | ListingResoValues object (nullable) | Standardized listing features (RESO, the real estate data standard) such as heating, cooling, pool, HOA fees and parking. |  |
| `property` | Property object (nullable) | The home the listing is for: its address, type, size, beds and baths, and the other listings of the same home. |  |
| `media` | list of Media objects (nullable) | Photos, 3D tours, videos and floor plans of the listing. |  |
| `agents` | list of MlsAgent objects (nullable) | The agents on the listing, such as the listing agent, with their contact and brokerage details. |  |
| `openHouses` | list of ListingOpenHouse objects (nullable) | Open houses scheduled for the listing. Filled on few listings. |  |
| `permissionLevels` | ListingPermissionLevels object (nullable) | Access levels that control who may see parts of the listing on Homes.com. |  |
| `newHomesInfo` | NewHomesInfo object (nullable) | Extra details for new-construction listings, such as the community, builder and floor plan. Filled on few listings. |  |
| `offices` | list of MlsOffice objects (nullable) | The MLS offices (brokerages) on the listing, with their contact details. |  |
| `source` | Source object (nullable) | Where the listing information came from: the MLS listing id and kind of data. |  |
| `history` | list of ListingHistory objects (nullable) | Events in the life of the listing, such as new, price change, under contract and sold. |  |
| `isPrimaryForThisListingInstance` | true/false | Whether this is the primary MLS listing among those of the same sale or rent attempt. |  |
| `attributionContact` | text (nullable) | Contact for crediting the listing under IDX rules, such as a phone number or email. Filled on few listings. |  |
| `displayPrice` | DisplayPrice object (nullable) | Price information Homes.com shows to the public for a sold or recently off-market home: recent sale values and the latest automated value estimate. |  |
| `has3DTour` | true/false | Whether the listing has a 3D tour. |  |
| `hasOtherRecentlySoldOrOffMarketListings` | true/false | Whether the home has other recently sold or off-market listings. |  |
| `hasVideo` | true/false | Whether the listing has a video. |  |
| `costarFeatureValues` | CostarFeatureValues object (nullable) | Home features detected by CoStar from photos and listing text, as a counterpart to resoValues. |  |
| `isInCondoBuilding` | true/false | Whether the home is part of a condo building. |  |
| `mls` | Mls object (nullable) | The MLS (multiple listing service) that supplied the listing and its display rules. |  |

### ListingResoValues

Found at: `resoValues`

| Field | Type | Description | Values |
|---|---|---|---|
| `architecturalStyleType` | integer (ArchitecturalStyleType) | Architectural style of the home, such as traditional or contemporary. Bit flags: a value can combine several codes. | see `ArchitecturalStyleType` in Allowed values |
| `coolingType` | integer (CoolingType) | Cooling systems the home has, such as central air. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Central, 2 = Heatpump_Geothermal, 4 = Ductless_Wall_Window, 8 = Evaporative, 16 = Other |
| `hasBasement` | true/false | Whether the home has a basement. |  |
| `hasGarage` | true/false | Whether the home has a garage. |  |
| `hasFireplace` | true/false | Whether the home has a fireplace. |  |
| `hasHardwoodFloors` | true/false | Whether the home has hardwood floors. |  |
| `hasInLawSuite` | true/false | Whether the home has an in-law suite. |  |
| `hasSpa` | true/false | Whether the home has a spa or hot tub. |  |
| `hasDishwasher` | true/false | Whether the home has a dishwasher. |  |
| `hasElevator` | true/false | Whether the building has an elevator. |  |
| `hasGym` | true/false | Whether the home or building has a gym. |  |
| `hasGolfCourse` | true/false | Whether the home is on or next to a golf course. |  |
| `hasAccessibilityFeatures` | true/false | Whether the home has accessibility features. |  |
| `hasStorage` | true/false | Whether the home has extra storage space. |  |
| `hasWasherDryer` | true/false | Whether the home has a washer and dryer. |  |
| `heatingType` | integer (HeatingType) | Heating systems the home has, such as forced air or electric. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Central, 2 = ForcedAir, 4 = HotWater, 8 = HeatPump_Geo, 16 = Radiant, 32 = Ductless, 64 = Furnace, 128 = Other |
| `hoa` | ListingResoValuesHoa object (nullable) | Homeowners association (HOA) details for the home. |  |
| `isWaterfront` | true/false | Whether the home is on the waterfront. |  |
| `isNearPublicTransportation` | true/false | Whether the home is near public transportation. |  |
| `isPetFriendly` | true/false | Whether pets are allowed. |  |
| `lotType` | integer (LotType) | Features of the lot, such as corner lot or cul-de-sac. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Corner, 2 = CulDeSac, 4 = Interior, 8 = Private |
| `listingDatesPriceChangeTimestamp` | date-time (nullable) | Date and time of the latest price change, as an ISO 8601 date-time. |  |
| `listingStandardStatus` | integer (nullable) | Numeric code for the RESO standard listing status, such as active, pending or closed; the codes are not decoded in this kit. |  |
| `listingContractSpecialListingConditions` | integer (nullable) | Numeric code for special conditions of the listing contract, such as short sale or auction; the codes are not decoded in this kit. |  |
| `listPrice` | decimal (nullable) | List price in US dollars (monthly rent for a rental). Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `originalListPrice` | decimal (nullable) | First list price in US dollars (monthly rent for a rental). Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `outdoorSpaceType` | integer (OutdoorSpaceType) | Outdoor spaces the home has, such as patio, balcony or yard. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Balcony, 2 = Deck, 4 = PorchPatio, 8 = Fenced, 16 = Storage, 32 = Terrace |
| `previousListPrice` | decimal (nullable) | List price before the latest change, in US dollars. Null on Texas sold or recently-off-market for-sale listings, because Texas does not disclose sale prices. |  |
| `poolType` | integer (PoolType) | Kind of pool the home has, such as private or community. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Private, 2 = Association, 4 = Community |
| `propertyConditionType` | integer (PropertyConditionType) | Condition of the property, such as new construction or needs repair. | 0 = Unknown, 1 = Fixer, 2 = UpdatedOrRemodeled |
| `roomType` | integer (RoomType2) | Special rooms the home has, such as a den, office or game room. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Bonus, 2 = Den, 4 = Office, 8 = Dining, 16 = Family, 32 = Gym, 64 = Excercise, 128 = InlawSuite |
| `securityFeatureType` | integer (SecurityFeatureType) | Security features the home has, such as gated entry or alarm system. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = AllDay, 2 = Building, 4 = Gated, 8 = Service, 16 = System |
| `structure` | ListingResoValuesStructure object (nullable) | Building details such as stories, year built, parking and fireplaces. |  |
| `totalLandLeaseFeesPerMonth` | decimal (nullable) | Monthly land lease fee in US dollars, for homes on leased land. Filled on few listings. |  |
| `viewType` | integer (ViewType) | Views the home has, such as city, water or mountain. Bit flags: a value can combine several codes. | see `ViewType` in Allowed values |
| `washerDryerType` | integer (WasherDryerType) | Washer and dryer arrangement, such as in-unit, hookups only or shared. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Included, 2 = Hookups, 4 = Building, 8 = InUnit |

### ListingResoValuesHoa

Found at: `resoValues.hoa`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasAssociation` | true/false (nullable) | Whether the home belongs to a homeowners association. |  |
| `totalFeesPerMonth` | decimal (nullable) | Total HOA fees per month in US dollars. |  |
| `fee` | decimal (nullable) | The HOA fee in US dollars, charged at the frequency given by feeFrequency. |  |
| `feeFrequency` | integer (nullable) | Numeric code for how often the HOA fee is charged, such as monthly or annually; the codes are not decoded in this kit. |  |
| `fee2` | decimal (nullable) | A second HOA fee in US dollars, charged at the frequency given by fee2Frequency. Filled on few listings. |  |
| `fee2Frequency` | integer (nullable) | Numeric code for how often the second HOA fee is charged; the codes are not decoded in this kit. Filled on few listings. |  |
| `associationName` | text (nullable) | Name of the homeowners association or its management company. |  |
| `associationPhone` | text (nullable) | Phone number of the homeowners association. |  |

### ListingResoValuesStructure

Found at: `resoValues.structure`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasNewConstruction` | true/false (nullable) | Whether the home is new construction. |  |
| `hasFireplace` | true/false (nullable) | Whether the home has a fireplace. |  |
| `fireplacesTotal` | integer (nullable) | Number of fireplaces in the home. |  |
| `stories` | integer (nullable) | Number of stories (floors) of the home or unit. |  |
| `storiesTotal` | integer (nullable) | Total number of stories of the building. |  |
| `yearBuilt` | integer (nullable) | Year the home was built. |  |
| `parkingTotal` | decimal (nullable) | Total number of parking spaces. |  |
| `garageSpaces` | decimal (nullable) | Number of garage parking spaces. |  |
| `hasCarport` | true/false (nullable) | Whether the home has a carport. |  |
| `carportSpaces` | decimal (nullable) | Number of carport parking spaces. Filled on few listings. |  |
| `coveredSpaces` | decimal (nullable) | Number of covered parking spaces. Filled on few listings. |  |
| `openParkingSpaces` | decimal (nullable) | Number of open parking spaces. Filled on few listings. |  |
| `hasBasement` | true/false (nullable) | Whether the home has a basement. |  |
| `hasCooling` | true/false (nullable) | Whether the home has cooling. |  |
| `hasHeating` | true/false (nullable) | Whether the home has heating. |  |
| `architecturalStyle` | text (nullable) | Architectural style of the home as free text, such as Traditional or Contemporary. |  |

### Property

Found at: `property`

| Field | Type | Description | Values |
|---|---|---|---|
| `address` | Address object (nullable) | Location of the home: street address, city, ZIP, coordinates and the areas it falls in. |  |
| `propertyType` | integer (ListingPropertyType) (nullable) | Type of home, such as detached house, townhouse or condo. | see `ListingPropertyType` in Allowed values |
| `listingPropertyType` | integer (ListingPropertyType) (nullable) | Type of home as given on the listing, such as detached house, townhouse or condo. | see `ListingPropertyType` in Allowed values |
| `propertyTypeSource` | integer (AttributeSource) (nullable) | Where the property type came from, such as the listing, public records or CoStar features. | 0 = Unknown, 1 = ListingData, 2 = PropertyData, 3 = PublicRecord, 4 = CoStarFeatures, 5 = Enterprise |
| `mlsPropertyType` | text (nullable) | Property type text as the MLS reports it, such as Residential, Detached. |  |
| `bathsMin` | decimal (nullable) | Lowest number of bathrooms; a half bath counts as 0.5. Equal to bathsMax for a single home. |  |
| `bathsMax` | decimal (nullable) | Highest number of bathrooms; a half bath counts as 0.5. |  |
| `bathsFull` | integer (nullable) | Number of full bathrooms. |  |
| `bathsHalf` | integer (nullable) | Number of half bathrooms. |  |
| `bedsMin` | integer (nullable) | Lowest number of bedrooms. Equal to bedsMax for a single home. |  |
| `bedsMax` | integer (nullable) | Highest number of bedrooms. |  |
| `garageSpacesMax` | integer (nullable) | Highest number of garage spaces. Filled on few listings. |  |
| `garageSpacesMin` | integer (nullable) | Lowest number of garage spaces. Filled on few listings. |  |
| `lotSizeAcresMin` | decimal (nullable) | Lot size in acres. Equal to lotSizeAcresMax for a single home. |  |
| `lotSizeAcresMax` | decimal (nullable) | Largest lot size in acres. |  |
| `lotSizeSource` | integer (AttributeSource) (nullable) | Where the lot size came from, such as the listing or public records. | 0 = Unknown, 1 = ListingData, 2 = PropertyData, 3 = PublicRecord, 4 = CoStarFeatures, 5 = Enterprise |
| `model` | text (nullable) | Builder's floor plan name for a new home. Filled on few listings. |  |
| `ownership` | text (nullable) | Kind of ownership, such as Full Ownership or Fractional Ownership. |  |
| `sqftMin` | decimal (nullable) | Living area in square feet. Equal to sqftMax for a single home. |  |
| `sqftMax` | decimal (nullable) | Largest living area in square feet. |  |
| `sqftSource` | integer (AttributeSource) (nullable) | Where the square footage came from, such as the listing or public records. | 0 = Unknown, 1 = ListingData, 2 = PropertyData, 3 = PublicRecord, 4 = CoStarFeatures, 5 = Enterprise |
| `stories` | integer (nullable) | Number of stories of the home. |  |
| `subdivision` | text (nullable) | Name of the subdivision the home is in. |  |
| `taxes` | decimal (nullable) | Annual property tax in US dollars, as reported by the MLS. |  |
| `totalParkingSpaces` | integer (nullable) | Total number of parking spaces. |  |
| `unitsCount` | integer (nullable) | Number of units in the building, for condos and multi-unit homes. |  |
| `url` | text (nullable) | Path of the home's page on Homes.com, made of state, city and street. Null on the 4 listings whose address is hidden from the public. |  |
| `yearBuilt` | integer (nullable) | Year the home was built. |  |
| `yearBuiltSource` | integer (AttributeSource) (nullable) | Where the year built came from, such as the listing or public records. | 0 = Unknown, 1 = ListingData, 2 = PropertyData, 3 = PublicRecord, 4 = CoStarFeatures, 5 = Enterprise |
| `listings` | list of PropertyListing objects (nullable) | The MLS listings of the same home, usually including this one, with their status, dates and prices. |  |

### Address

Found at: `property.address`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the residential property (the parcel or building) that contains the home. A condo building has one property and many homes. |  |
| `buildingName` | text (nullable) | Name of the building, for condos and apartments. Filled on few listings. |  |
| `city` | text (nullable) | City of the home. |  |
| `countryCode` | text (nullable) | Three-letter country code; USA on every listing. |  |
| `streetNumber` | text (nullable) | House or building number. Null on the 4 listings whose address is hidden from the public. |  |
| `streetName` | text (nullable) | Street name without number, direction or type. Null on the 4 listings whose address is hidden from the public. |  |
| `streetDirPrefix` | text (nullable) | Direction before the street name, such as N or W. Filled on few listings. |  |
| `streetDirSuffix` | text (nullable) | Direction after the street name, such as N or S. Filled on few listings. |  |
| `streetSuffix` | text (nullable) | Street type, such as St, Ave or Dr. |  |
| `fullStreetAddress` | text (nullable) | Full street address on one line. Null on the 4 listings whose address is hidden from the public. |  |
| `floorNumber` | text (nullable) | Floor the unit is on, for condos and apartments. Filled on few listings. |  |
| `unitNumber` | text (nullable) | Unit or apartment number, for condos, townhomes and apartments. |  |
| `latitude` | decimal (nullable) | Latitude of the home in decimal degrees. Null on the 4 listings whose address is hidden from the public. |  |
| `longitude` | decimal (nullable) | Longitude of the home in decimal degrees. Null on the 4 listings whose address is hidden from the public. |  |
| `modelName` | text (nullable) | Builder's floor plan name for a new home, such as Plan 1925. Filled on few listings. |  |
| `state` | text (nullable) | Two-letter US state of the home: TX for Houston or CA for Los Angeles. |  |
| `zip` | text (nullable) | Five-digit ZIP code. |  |
| `areas` | list of Area objects (nullable) | List of geographic areas the home falls in, such as state, county, city, neighborhood and school district. |  |
| `cityMetadata` | CityMetadata object (nullable) | Display information about the city of the home. |  |
| `communityId` | integer (nullable) | Id of the new-home community the address belongs to. Filled on few listings. |  |

### Area

Found at: `property.address.areas[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `enterpriseEntityType` | integer (EnterpriseEntityType) (nullable) | Kind of area, such as state, county, city or neighborhood. | see `EnterpriseEntityType` in Allowed values |
| `enterpriseEntitySubType` | integer (EnterpriseEntitySubType) (nullable) | More specific kind of the area when there is one. | 0 = Unknown, 1 = Hospitality, 2 = Industrial, 5 = Office, 6 = Retail, 11 = MultiFamily, 15 = Residential, 16 = Homes |
| `enterpriseEntityId` | integer (nullable) | Id of the area, to be read together with its type. |  |
| `name` | text (nullable) | Name of the area, such as Texas or Houston. |  |
| `isPreferred` | true/false (nullable) | Whether this is the preferred area of its kind for the home. |  |
| `associatedCityId` | integer (nullable) | Id of the city the area is associated with. |  |
| `neighborhoodId` | integer (nullable) | Id of the neighborhood, when the area is a neighborhood. |  |
| `isCommunityProjectSchool` | true/false (nullable) | Whether the area is marked as a community project school. Filled on few listings. |  |
| `naturalFeatureType` | integer (NaturalFeatureType) (nullable) | Kind of natural feature the area is, such as a park or water body; 0 means none. | see `NaturalFeatureType` in Allowed values |
| `neighborhoodType` | integer (NeighborhoodType) (nullable) | Kind of neighborhood the area is. | 0 = Unknown, 1 = Cluster, 2 = Submarket, 3 = Subdivision |

### CityMetadata

Found at: `property.address.cityMetadata`

| Field | Type | Description | Values |
|---|---|---|---|
| `cityDisplayName` | text (nullable) | City name as Homes.com displays it. |  |

### PropertyListing

Found at: `property.listings[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of that MLS listing; the entry for this record has the record's own `id`. |  |
| `listingInstanceId` | integer | Id of the sale or rent attempt the listing belongs to; matches residentialListingId. |  |
| `listingStatus` | integer (ListingStatus2) (nullable) | MLS status of that listing, such as active, under contract or sold. | 0 = None, 1 = Active, 2 = Contract, 4 = Sold, 8 = Inactive, 16 = Removed |
| `transactionType` | integer (TransactionType) (nullable) | Whether that listing is for sale or for rent. | 0 = None, 1 = ForSale, 2 = ForRent, 3 = All |
| `closeDate` | date-time (nullable) | Closing date of that listing, as an ISO 8601 date-time. |  |
| `listDate` | date-time (nullable) | List date of that listing, as an ISO 8601 date-time. |  |
| `mlsId` | integer (nullable) | Id of the MLS that supplied that listing. |  |
| `permissionLevels` | ListingPermissionLevels object (nullable) | Access levels that control who may see parts of that listing on Homes.com. |  |
| `forSaleListingStatus` | integer (ForSaleStatus) (nullable) | Homes.com for-sale status of that listing. Null on rentals. | 0 = Unknown, 1 = ForSale, 2 = ComingSoon, 3 = ContingentPending, 4 = UnderContract, 5 = Sold, 6 = RecentlyOffMarket |
| `forRentListingStatus` | integer (ForRentStatus) (nullable) | Homes.com for-rent status of that listing. Filled only on rentals. | see `ForRentStatus` in Allowed values |
| `isPrimary` | true/false (nullable) | Whether this is the primary listing of the home. |  |
| `isPrimaryForThisListingInstance` | true/false (nullable) | Whether this is the primary listing of its sale or rent attempt. |  |
| `closePrice` | decimal (nullable) | Closing price of that listing in US dollars. Null on Texas sale listings that are sold or recently off market, because Texas does not disclose sale prices. |  |
| `currentPrice` | decimal (nullable) | Current asking price of that listing in US dollars (monthly rent for a rental). Null on Texas sale listings that are sold or recently off market, because Texas does not disclose sale prices. |  |
| `originalPrice` | decimal (nullable) | First asking price of that listing in US dollars (monthly rent for a rental). Null on Texas sale listings that are sold or recently off market, because Texas does not disclose sale prices. |  |

### ListingPermissionLevels

Found at: `property.listings[].permissionLevels`, `permissionLevels`

| Field | Type | Description | Values |
|---|---|---|---|
| `homes` | integer (nullable) | Minimum Homes.com user level allowed to see the listing on Homes.com of that listing; 10 is public and higher values are restricted. |  |

### Media

Found at: `media[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer (nullable) | Id of the media item. |  |
| `caption` | text (nullable) | Caption of the media item. |  |
| `description` | text (nullable) | Description of the media item, such as the room shown. MLS media only. |  |
| `displayOrder` | integer (nullable) | Position of the item in the MLS photo order. MLS media only. |  |
| `type` | integer (MediaType) (nullable) | Kind of media item, such as photo, 3D tour, floor plan or map. | see `MediaType` in Allowed values |
| `uri` | text (nullable) | Link to the media item: a photo or map at homes.com, a Matterport tour at my.matterport.com, or a video or tour on another site. Photo links use image size 112; replace the /112/ path segment for another size. Map links are 1800x1200. Matterport links use the ids of the copies made for this kit, the same ids as in residential-listings.csv. |  |
| `videoKey` | text (nullable) | Key that identifies a video or 3D tour, for example the id after m= in a Matterport tour link. |  |
| `height` | integer (nullable) | Height of the image in pixels. |  |
| `width` | integer (nullable) | Width of the image in pixels. |  |
| `fileExtension` | text (nullable) | File extension of the item, such as Jpg. Filled on few listings. |  |
| `entityId` | integer (nullable) | Id of the listing, unit or floor plan the item belongs to. Filled on few listings. |  |
| `threeDimensionalScanType` | integer (ThreeDimensionalScanType) (nullable) | Vendor of the 3D tour, such as Matterport. Filled on 3D tour items. | see `ThreeDimensionalScanType` in Allowed values |
| `videoType` | integer (VideoType) (nullable) | Hosting service of the video, such as YouTube or Vimeo. | 0 = None, 1 = YouTube, 2 = Vimeo, 3 = Vidly, 4 = Other |
| `source` | integer (MediaSource) (nullable) | Who supplied the media item: the MLS, CoStar or a builder. | 0 = Unknown, 1 = Mls, 2 = CoStar, 3 = Builder |
| `thumbnailUri` | text (nullable) | Link to a small preview image of the item. Replace the /112/ segment of the path to get another image size (114 is 1024x1024, 210 is 2560x1440, 102 is 984x658). |  |
| `externalReferenceType` | integer (ExternalReferenceType4) (nullable) | Numeric code for the outside system that supplied the item; mostly useful to tell CoStar scans from MLS items. | see `ExternalReferenceType4` in Allowed values |
| `scenes` | list of SceneInfo objects (nullable) | Labels from automatic image analysis of the photo, such as the kind of room or amenity shown. |  |
| `altText` | text (nullable) | Alternative text describing the image, generated automatically. |  |
| `computerVisionKeywords` | list of text values (nullable) | Names of the home features detected in the image by automatic image analysis, such as Hardwood Floor. |  |

### SceneInfo

Found at: `media[].scenes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `imageId` | integer | Id of the image the scene label belongs to. |  |
| `type` | integer (SceneClassificationType) | Kind of room or amenity detected in the image, such as kitchen, balcony or swimming pool. | see `SceneClassificationType` in Allowed values |

### MlsAgent

Found at: `agents[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the agent in the MLS. |  |
| `userId` | integer (nullable) | Id of the agent's Homes.com user account. |  |
| `companyName` | text (nullable) | Name of the brokerage company the agent works for. |  |
| `email` | text (nullable) | Agent's email address, as shown publicly on Homes.com. |  |
| `firstName` | text (nullable) | Agent's first name. |  |
| `lastName` | text (nullable) | Agent's last name. |  |
| `bio` | text (nullable) | Agent's biography, as shown publicly on Homes.com. |  |
| `role` | integer (ListingAgentRole) (nullable) | Role of the agent on the listing, such as listing agent or selling agent. Bit flags: a value can combine several codes. | 0 = None, 1 = ListingAgent, 2 = SellingAgent, 3 = BothSides, 4 = AltListingAgent, 5 = BothListing, 8 = ShowingContact, 16 = AltSellingAgent, 18 = BothSelling, 23 = AllExceptShowingContact |
| `mlsId` | integer (nullable) | Id of the MLS the agent belongs to. |  |
| `mlsOfficeId` | integer (nullable) | Id of the MLS office the agent works from; matches an id in offices. |  |
| `isActive` | true/false (nullable) | Whether the MLS agent record is active. |  |
| `profileImage` | text (nullable) | Link to the agent's profile photo. Replace the /112/ segment of the path to get another size. |  |
| `website` | text (nullable) | Agent's website. Filled on few listings. |  |
| `phoneNumber` | text (nullable) | Agent's phone number, as shown publicly on Homes.com. |  |
| `phoneType` | integer (EnterprisePhoneType) (nullable) | Kind of the agent's phone number, such as mobile or office. | 0 = Unknown, 1 = Phone, 2 = Mobile, 3 = Fax, 4 = Other, 5 = Override |
| `licenseState` | text (nullable) | US state of the agent's license. |  |
| `brokerageName` | text (nullable) | Name of the brokerage brand, such as RE/MAX. Filled on few listings. |  |
| `brokerageId` | integer (nullable) | Id of the brokerage brand. Filled on few listings. |  |
| `officePhoneNumber` | text (nullable) | Phone number of the agent's office. |  |
| `officeEmailAddress` | text (nullable) | Email address of the agent's office. |  |
| `locationId` | integer (nullable) | Id of the brokerage location the agent is attached to. |  |

### ListingOpenHouse

Found at: `openHouses[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `openHouseDate` | date-time | Date of the open house, as an ISO 8601 date-time. |  |
| `openHouseBegins` | date-time (nullable) | Start of the open house in the home's local time, written as an ISO 8601 date-time. |  |
| `openHouseBeginsUtc` | date-time (nullable) | Start of the open house in UTC, as an ISO 8601 date-time. |  |
| `openHouseClose` | date-time (nullable) | End of the open house in the home's local time, written as an ISO 8601 date-time. |  |
| `openHouseCloseUtc` | date-time (nullable) | End of the open house in UTC, as an ISO 8601 date-time. |  |
| `remarks` | text (nullable) | Agent's remarks about the open house, as free text. |  |
| `refreshments` | text (nullable) | Refreshments offered at the open house, as free text. |  |
| `timeZoneId` | integer (nullable) | Id of the time zone of the local start and end times. |  |

### NewHomesInfo

Found at: `newHomesInfo`

| Field | Type | Description | Values |
|---|---|---|---|
| `listingId` | integer | Id of the new-home listing as Homes.com search uses it. |  |
| `newHomesType` | integer (NewHomesListingType) (nullable) | Kind of new-home listing, such as floor plan or move-in ready home. | 0 = Unknown, 1 = CommunityProject, 2 = Building, 3 = Community, 4 = FloorPlan, 5 = CustomHomeLot, 6 = MoveInReady |
| `community` | Community object (nullable) | The new-home community the listing belongs to. |  |
| `communityProject` | CommunityProject object (nullable) | The new-home project (a group of homes being built together) the listing belongs to. |  |
| `floorPlan` | FloorPlan object (nullable) | The builder's floor plan of the home. Filled on few listings. |  |
| `moveInReady` | MoveInReady object (nullable) | Details for a move-in ready new home. Filled on few listings. |  |

### Community

Found at: `newHomesInfo.community`

| Field | Type | Description | Values |
|---|---|---|---|
| `name` | text (nullable) | Name of the community. |  |
| `primaryNeigborhoodId` | integer (nullable) | Id of the neighborhood the community is mainly in. |  |
| `developerInfo` | DeveloperInfo object (nullable) | The developer of the community. |  |

### DeveloperInfo

Found at: `newHomesInfo.community.developerInfo`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the developer. |  |
| `description` | text (nullable) | Description of the developer, as free text. |  |
| `logoUrl` | text (nullable) | Link to the developer's logo. Replace the /112/ segment of the path to get another size. |  |
| `name` | text (nullable) | Name of the developer. |  |
| `phoneNumber` | text (nullable) | Phone number of the developer. |  |
| `websiteUrl` | text (nullable) | Website of the developer. |  |
| `address` | Address2 object (nullable) | Business address of the developer. |  |

### Address2

Found at: `newHomesInfo.community.developerInfo.address`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the developer's address. |  |
| `city` | text (nullable) | City of the developer's address. |  |
| `countryCode` | text (nullable) | Three-letter country code of the developer's address. |  |
| `streetNumber` | text (nullable) | Street number of the developer's address. |  |
| `streetName` | text (nullable) | Street name of the developer's address. |  |
| `latitude` | decimal (nullable) | Latitude of the developer's address in decimal degrees. |  |
| `longitude` | decimal (nullable) | Longitude of the developer's address in decimal degrees. |  |
| `state` | text (nullable) | Two-letter US state of the developer's address. |  |

### CommunityProject

Found at: `newHomesInfo.communityProject`

| Field | Type | Description | Values |
|---|---|---|---|
| `listingId` | integer | Id of the project's listing as Homes.com search uses it. |  |
| `name` | text (nullable) | Name of the project. |  |
| `propertyId` | integer | Id of the project's property. |  |
| `url` | text (nullable) | Website of the project. |  |
| `builderInfo` | BuilderInfo object (nullable) | The builder of the project. |  |

### BuilderInfo

Found at: `newHomesInfo.communityProject.builderInfo`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the builder. |  |
| `description` | text (nullable) | Description of the builder, as free text. |  |
| `logoUrl` | text (nullable) | Link to the builder's logo. Replace the /112/ segment of the path to get another size. |  |
| `name` | text (nullable) | Name of the builder. |  |
| `phone` | text (nullable) | Phone number of the builder. |  |
| `websiteUrl` | text (nullable) | Website of the builder. |  |

### FloorPlan

Found at: `newHomesInfo.floorPlan`

| Field | Type | Description | Values |
|---|---|---|---|
| `name` | text (nullable) | Name of the floor plan. |  |
| `url` | text (nullable) | Link to the floor plan on the builder's website. |  |

### MoveInReady

Found at: `newHomesInfo.moveInReady`

| Field | Type | Description | Values |
|---|---|---|---|
| `floorPlanName` | text (nullable) | Name of the floor plan the move-in ready home is built from. |  |
| `mlsFloorPlanListingId` | integer (nullable) | Id of the MLS listing of that floor plan. |  |

### MlsOffice

Found at: `offices[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the MLS office; matches agents.mlsOfficeId. |  |
| `brokerageID` | integer (nullable) | Id of the brokerage brand. Filled on few listings. |  |
| `city` | text (nullable) | City of the office. |  |
| `countryCode` | text | Three-letter country code of the office. |  |
| `email` | text (nullable) | Email address of the office. |  |
| `fax` | text (nullable) | Fax number of the office. |  |
| `fullStreetAddress` | text (nullable) | Street address of the office. |  |
| `isActive` | true/false (nullable) | Whether the MLS office record is active. |  |
| `latitude` | decimal (nullable) | Latitude of the office in decimal degrees. Filled on few listings. |  |
| `longitude` | decimal (nullable) | Longitude of the office in decimal degrees. Filled on few listings. |  |
| `name` | text (nullable) | Name of the office. |  |
| `phoneNumber` | text (nullable) | Phone number of the office. |  |
| `role` | integer (nullable) | Numeric code for the office's role on the listing, such as listing office; the codes are not decoded in this kit. |  |
| `status` | integer (nullable) | Numeric status code of the office; the codes are not decoded in this kit. |  |
| `state` | text (nullable) | State of the office, as an abbreviation or full name. |  |
| `website` | text (nullable) | Website of the office. Filled on few listings. |  |
| `zip` | text (nullable) | ZIP code of the office. |  |

### Source

Found at: `source`

| Field | Type | Description | Values |
|---|---|---|---|
| `sourceType` | integer (SourceType) | Kind of data the listing comes from, such as MLS or new homes. | 0 = None, 1 = Mls, 2 = Multifamily, 3 = Land, 4 = NewHomes |

### ListingHistory

Found at: `history[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the history event. |  |
| `date` | date-time (nullable) | Date of the event, as an ISO 8601 date-time. |  |
| `currentPrice` | decimal (nullable) | Asking price in US dollars at the time of the event (monthly rent for a rental). Null on the sold event of Texas for-sale listings, because Texas does not disclose sale prices. |  |
| `modificationTimestamp` | date-time (nullable) | When the event was recorded, as an ISO 8601 date-time. |  |
| `newValue` | decimal (nullable) | Value after the change, as a number; for status changes it is a status code. |  |
| `newValueString` | text (nullable) | Value after the change, as text. |  |
| `oldValue` | decimal (nullable) | Value before the change, as a number; for status changes it is a status code. |  |
| `oldValueString` | text (nullable) | Value before the change, as text. |  |
| `status` | integer (ListingUpdateStatus) (nullable) | Extra flags on the event, such as being a secondary event or a return to market. Bit flags: a value can combine several codes. | 0 = None, 1 = IsSecondaryEvent, 2 = RelatedToNewListing, 4 = IsReturnToMarketEvent |
| `updateType` | integer (ListingUpdateType) (nullable) | What kind of change the event records, such as newly active, price change, under contract, sold or removed. | 1 = NewlyActive, 2 = PriceChange, 4 = NewlyUnderContract, 8 = NewlySold, 16 = OffMarket, 32 = NewlyComingSoon, 64 = Removed, 128 = ListDateChange |

### DisplayPrice

Found at: `displayPrice`

| Field | Type | Description | Values |
|---|---|---|---|
| `residentialPropertyId` | integer (nullable) | Id of the residential property that contains the home; matches property.address.id. |  |
| `latitude` | decimal (nullable) | Latitude of the home in decimal degrees. |  |
| `longitude` | decimal (nullable) | Longitude of the home in decimal degrees. |  |
| `values` | list of AssetValue objects (nullable) | List of price values for the home, such as the recent sale or an automated estimate. Has no estimate entries where the MLS forbids showing an estimate. |  |
| `isNonDisclosureState` | true/false (nullable) | Whether the home is in a non-disclosure state such as Texas, where sale prices are not public. |  |
| `latestAVM` | AVM object (nullable) | The latest automated value estimate (AVM) of the home with its low and high range. Null where the MLS forbids showing an estimate. |  |

### AssetValue

Found at: `displayPrice.values[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `value` | decimal (nullable) | The value in US dollars. |  |
| `valueType` | integer (AssetValueType) (nullable) | What the value is, such as an automated estimate or a recent sale price. Bit flags: a value can combine several codes. | 0 = None, 1 = AVM, 2 = Last3Months, 4 = Last12Months, 8 = Last24Months, 16 = Last5Years |
| `listingId` | integer (nullable) | Id of the MLS listing the value comes from, when it is a recent sale. |  |

### AVM

Found at: `displayPrice.latestAVM`

| Field | Type | Description | Values |
|---|---|---|---|
| `year` | integer (nullable) | Year of the estimate. Filled on few listings. |  |
| `month` | integer (nullable) | Month of the estimate, 1 to 12. Filled on few listings. |  |
| `high` | decimal (nullable) | High end of the estimate range, in US dollars. |  |
| `low` | decimal (nullable) | Low end of the estimate range, in US dollars. |  |
| `current` | decimal (nullable) | The estimated value in US dollars. |  |

### CostarFeatureValues

Found at: `costarFeatureValues`

| Field | Type | Description | Values |
|---|---|---|---|
| `coolingType` | integer (CostarFeatureCoolingType) | Kind of cooling detected, such as central air. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Central, 2 = Geothermal |
| `hasBasement` | true/false | Whether a basement was detected. |  |
| `hasFireplace` | true/false | Whether a fireplace was detected. |  |
| `hasGarage` | true/false | Whether a garage was detected. |  |
| `hasHardwoodFloors` | true/false | Whether hardwood floors were detected. |  |
| `hasInLawSuite` | true/false | Whether an in-law suite was detected. |  |
| `heatingType` | integer (CostarFeatureHeatingType) | Kind of heating detected, such as forced air. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Central, 2 = ForcedAir, 4 = Radiant, 8 = Geothermal |
| `poolType` | integer (CostarFeaturePoolType) | Kind of pool detected, such as private or community. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = Private, 2 = Community |
| `viewType` | integer (CostarFeatureViewType) | Kind of view detected, such as city or water. Bit flags: a value can combine several codes. | 0 = Unknown, 1 = MountainHills, 2 = Water, 4 = City, 8 = Woods, 16 = Other |

### Mls

Found at: `mls`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the MLS that supplied the listing. |  |

## Allowed values

### ForRentStatus

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | ForRent |
| 2 | ComingSoon |
| 4 | RentalAgreement |
| 5 | Rented |
| 6 | RecentlyOffMarket |
| 7 | Inactive |
| 8 | OffMarket |
| 9 | Upsell |
| 10 | SubscriptionHold |
| 11 | AwaitingVerification |
| 12 | UserDeleted |
| 13 | Pending |
| 14 | Terminate |

### MonetaryUnit

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | UnitedStatesDollar |
| 2 | CanadianDollar |
| 3 | PoundSterling |
| 4 | Euro |
| 5 | AustralianDollar |
| 6 | BrazilianReal |
| 7 | SwissFranc |
| 8 | JapaneseYen |
| 9 | SingaporeDollar |
| 10 | HongKongDollar |
| 11 | ChineseYuan |
| 12 | UnitedArabEmiratesDirham |
| 13 | AfghanistanAfghani |
| 14 | AlbanianLek |
| 15 | ArmenianDram |
| 16 | NetherlandsAntilleanGuilder |
| 17 | AngolanKwanza |
| 18 | ArgentinaPeso |
| 19 | ArubanGuilder |
| 20 | AzerbaijanNewManat |
| 21 | BosnianMark |
| 22 | BarbadosDollar |
| 23 | BangladeshTaka |
| 24 | BulgarianLev |
| 25 | BurundiFranc |
| 26 | BermudianDollars |
| 27 | BruneiDollars |
| 28 | BolivianBoliviano |
| 29 | BahamianDollar |
| 30 | Bitcoin |
| 31 | BotswanianPula |
| 32 | BelarusianRuble |
| 33 | BelizeDollar |
| 34 | CongoleseFranc |
| 35 | ChileanPeso |
| 36 | ColombianPeso |
| 37 | CostaRicanColon |
| 38 | CubanPeso |
| 39 | CapeVerdeEscudo |
| 40 | CzechKoruna |
| 41 | DjiboutiFranc |
| 42 | DanishKrone |
| 43 | DominicanPeso |
| 44 | AlgerianDinar |
| 45 | EgyptianPound |
| 46 | EthiopianBirr |
| 47 | FijiDollars |
| 48 | GeorgianLari |
| 49 | GhanaianNewCedi |
| 50 | GambianDalasi |
| 51 | GuineanFranc |
| 52 | GuatemalanQuetzal |
| 53 | GuyanaDollar |
| 54 | HondurasLempira |
| 55 | CroatianKuna |
| 56 | HaitianGourde |
| 57 | HungarianForint |
| 58 | IndonesianRupiah |
| 59 | IsraeliShekel |
| 60 | IndianRupee |
| 61 | IraqiDinar |
| 62 | IranianRial |
| 63 | IcelandKrona |
| 64 | JamaicanDollar |
| 65 | JordanDinar |
| 66 | KenyanShilling |
| 67 | KyrgyzstaniSom |
| 68 | CambodiaRiel |
| 69 | ComorosFranc |
| 70 | SouthKoreanWon |
| 71 | KuwaitiDinar |
| 72 | CaymanIslandDollar |
| 73 | KazakhstaniTenge |
| 74 | LaoKip |
| 75 | LebanesePound |
| 76 | SriLankanRupee |
| 77 | LiberianDollar |
| 78 | LesothoLoti |
| 79 | LibyanDinar |
| 80 | MoroccanDirham |
| 81 | MoldovanLeu |
| 82 | MalagasyAriary |
| 83 | MyanmarKyat |
| 84 | MacauPataca |
| 85 | MauritanianQuguiya |
| 86 | MauritiusRupee |
| 87 | MaldivesRufiyaa |
| 88 | MalawiKwacha |
| 89 | MexicanPeso |
| 90 | MalaysianRinggit |
| 91 | MozambiqueNewMetical |
| 92 | NamibianDollar |
| 93 | NigerianNaira |
| 94 | NicaraguanCordobaOro |
| 95 | NorwegianKrone |
| 96 | NepalRupee |
| 97 | NewZealandDollar |
| 98 | OmaniRial |
| 99 | PanameanBalboa |
| 100 | PeruvianNuevoSol |
| 101 | PapuaNewGuineaKina |
| 102 | PhilippinePeso |
| 103 | PakistaniRupee |
| 104 | PolishZloty |
| 105 | ParaguayanGuarani |
| 106 | QatarRiyal |
| 107 | NewRomanianLeu |
| 108 | SerbianDinar |
| 109 | RussianRuble |
| 110 | RwandanFranc |
| 111 | SaudiRiyal |
| 112 | SolomonIslandsDollar |
| 113 | SeychellesRupee |
| 114 | SudanesePound |
| 115 | SwedishKrona |
| 116 | SierraLeoneLeone |
| 117 | SomaliShilling |
| 118 | SurinameDollar |
| 119 | SaoTomeanDobra |
| 120 | ElSalvadorColon |
| 121 | SwazilandLilangeni |
| 122 | ThailandBaht |
| 123 | TajikistanSomoni |
| 124 | TurkmenNewManat |
| 125 | TunisianDinar |
| 126 | TonganPaanga |
| 127 | TurkishLira |
| 128 | TrinidadianDollar |
| 129 | TaiwanDollar |
| 130 | TanzanianShilling |
| 131 | UkrainianHryvnia |
| 132 | UgandanShilling |
| 133 | UruguayPeso |
| 134 | UzbekistaniSom |
| 135 | VenezuelanBolivarSoberano |
| 136 | VietnameseDong |
| 137 | CentralAfricanFranc |
| 138 | EastCaribbeanDollar |
| 139 | WestAfricanFranc |
| 140 | FrenchPacificIslandsFranc |
| 141 | YemenRial |
| 142 | SouthAfricanRand |
| 143 | ZambianKwacha |
| 144 | BahrainiDinar |
| 145 | EritreanNakfa |
| 146 | FalklandIslandsPound |
| 147 | GibraltarPound |
| 148 | NorthKoreanWon |
| 149 | MongolianTughrik |
| 150 | SaintHelenaPound |
| 151 | SyrianPound |
| 152 | VanuatuVatu |
| 153 | ZimbabweanDollar |
| 154 | SamoanTala |
| 155 | BhutaneseNgultrum |
| 156 | MacedonianDenar |

### ListingSpecialFeatures

| Value | Meaning |
|---|---|
| 0 | None |
| 1 | OpenHouse |
| 2 | NewHome |
| 4 | ShortSaleOrForeclosure |
| 8 | ShortSale |
| 16 | Forclosure |
| 32 | ComingSoon |
| 64 | Auction |
| 128 | Contingent |
| 256 | BrokerOpen |
| 512 | Luxury |
| 1024 | RealEstateOwned |
| 2048 | PriceReduction |
| 4096 | VirtualTour |
| 268435456 | Resale |
| 536870912 | DoNotGeocodeOrChangeAddress |
| 1073741824 | DoNotUpdate |

### ArchitecturalStyleType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | ArtDeco |
| 2 | CapeCod |
| 4 | Colonial |
| 8 | Contemporary |
| 16 | Cottage |
| 32 | Craftsman |
| 64 | Duplex |
| 128 | Farmhouse |
| 256 | Federal |
| 512 | French |
| 1024 | Green |
| 2048 | Log |
| 4096 | Ranch |
| 8192 | Spanish |
| 16384 | SplitLevel |
| 32768 | Traditional |
| 65536 | Tudor |
| 131072 | Victorian |
| 262144 | Other |
| 524288 | Prewar |

### ViewType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Beach |
| 2 | Ocean |
| 4 | Lake |
| 8 | River |
| 16 | Bay |
| 32 | Mountain |
| 64 | Hills |
| 128 | Valleys |
| 256 | Woods |
| 512 | City |
| 1024 | Other |
| 2048 | WaterOther |

### EnterpriseEntityType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | State |
| 2 | County |
| 3 | Region |
| 4 | Market |
| 5 | Submarket |
| 6 | Cbsa |
| 7 | Country |
| 8 | PprMetro |
| 9 | City |
| 10 | UsPostalCode |
| 11 | UkPostalCodeArea |
| 12 | UkPostalCodeDistrict |
| 13 | UkPostalCodeSector |
| 14 | UkRegion |
| 15 | Subdivision |
| 16 | PostalCode |
| 17 | Neighborhood |
| 18 | ForwardSortation |
| 19 | Metro |
| 20 | College |
| 21 | SchoolAttendanceZone |
| 22 | SchoolDistrict |
| 23 | Cluster |
| 24 | UsCensus |
| 25 | UniversityArea |
| 26 | AssetClassMarket |
| 27 | NeighborhoodObsolete |
| 28 | School |
| 29 | NaturalFeature |
| 30 | CommunityFootPrint |
| 31 | EnterpriseSchoolDistrict |

### NaturalFeatureType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Beach |
| 2 | Ocean |
| 3 | Lake |
| 4 | River |
| 5 | Bay |
| 6 | Island |
| 7 | Mountain |
| 8 | Valley |
| 9 | Peninsula |
| 10 | Forest |
| 11 | MetroArea |
| 12 | Coast |
| 13 | Region |
| 14 | Park |
| 15 | Trail |

### ListingPropertyType

| Value | Meaning |
|---|---|
| 0 | None |
| 1 | Detached |
| 2 | Townhouse |
| 4 | Condo |
| 8 | Other |
| 16 | MultiFamily |
| 32 | LotsLands |
| 64 | MobileManufactured |
| 128 | Commercial |
| 256 | Coop |
| 512 | Duplex |
| 1024 | Triplex |
| 2048 | Quadruplex |

### MediaType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Aerial |
| 2 | Financial |
| 3 | PrimaryPhoto |
| 4 | BuildingPhoto |
| 5 | VirtualTour |
| 6 | Lobby |
| 7 | Other |
| 8 | MarketingBrochureFlyer |
| 9 | PlatMap |
| 10 | FloorPlan |
| 11 | SitePlan |
| 12 | TypicalFloorPlan |
| 13 | Slate |
| 14 | PrimaryContactPhoto |
| 15 | Logo |
| 16 | Map |
| 17 | SixteenSquarePng |
| 18 | TwentyFourSquarePng |
| 19 | TenantPhoto |
| 20 | LeaseDocument |
| 21 | PublicFiling |
| 22 | Deed |
| 23 | TransferTaxDeclaration |
| 24 | PropertyRecordCard |
| 25 | AssignmentOfRentsAndLeases |
| 26 | Loan |
| 27 | Article |
| 28 | PressRelease |
| 29 | SecFiling |
| 30 | CompanyReport |
| 31 | MediaSource |
| 32 | DirectoryPhoto |
| 33 | InteriorPhoto |
| 34 | GoadMap |
| 35 | CommunityBrochure |
| 36 | PlacardLogo |
| 37 | PropertyLogo |
| 38 | ConstructionPhoto |
| 39 | ReinforcingAdvertisement |
| 40 | ProVideoApartments (also Video) |
| 41 | CityPhoto |
| 42 | NeighborhoodPhoto |
| 43 | Matterport3DScan (also ThreeDimensionalScan) |
| 44 | ProVideoApartmentFinder |
| 45 | ConfidentialityAgreement |
| 46 | ProVideoApartamentos |
| 47 | CommercialListingVideo |
| 48 | MarketingLogo |
| 49 | ProVideoLoopNet |
| 50 | State |
| 51 | County |
| 52 | MilitaryBase |
| 53 | CollegeUniversity |
| 54 | ArticleVideo |
| 55 | AerialVideo |
| 56 | ThermalVideo |
| 57 | UavVideo |
| 58 | ProVideoForRent |
| 59 | PlacardPrimaryPhoto |
| 60 | ShortUavVideo |
| 61 | PlacardLogoVector |
| 62 | PlaneView |
| 63 | ProfileCoverDesktopResidential (also ProfileCoverDesktop, CoverPhoto) |
| 64 | PlacardHighlightPhoto |
| 65 | PlacardHighlightVideo |
| 66 | AmenityPhoto |
| 67 | AmenityVideo |
| 68 | ProfileCoverMobileResidential (also ProfileCoverMobile) |
| 69 | ProfileCoverDesktopCommercial |
| 70 | ProfileCoverMobileCommercial |
| 71 | LandRegistry |
| 72 | CollegeLogo |
| 73 | TenantExternalPhoto |
| 74 | TenantInternalPhoto |
| 75 | PylonPhoto |
| 76 | StockPhoto |
| 77 | CoverPagePhoto |
| 78 | SpaceManagerPhoto |
| 79 | ResidentialListingVideo |
| 80 | OfferingMemorandum |
| 81 | BrandExteriorPhoto |
| 82 | BrandInteriorPhoto |
| 83 | NeighborhoodVideo |
| 84 | NeighborhoodVideoClip |
| 85 | ParkVideo |
| 86 | ParkVideoClip |
| 87 | SchoolVideo |
| 88 | SchoolVideoClip |
| 89 | CondoBuildingVideo |
| 90 | CondoBuildingVideoClip |
| 91 | VideoProjectFile |
| 92 | AudioFile |
| 93 | ProductionScript |
| 94 | ParkPhoto |
| 95 | SchoolPhoto |
| 96 | CaseDocument |
| 97 | ViewFromUnit |
| 98 | AgentVideo |
| 99 | AgentVideoClip |
| 100 | StockVideo |
| 101 | RetailBrandRequirement |
| 102 | NeighborhoodEventPhoto |
| 103 | CityVideo |
| 104 | CityVideoClip |
| 105 | TransportationLogo |
| 106 | TextMessagePhoto |
| 107 | AgencyFees |
| 108 | MarketingHeroImage |
| 109 | AreaGuidePhoto |
| 110 | AreaGuideVideoClip |
| 111 | AreaGuideVideo |
| 112 | FloorPlanElevation |
| 113 | CommunityCollectionPhoto |
| 114 | FieldLeadSignPhoto |
| 115 | CommunityPhoto |
| 116 | SpecificationSheet |
| 117 | CommunityBoundary |
| 118 | CommunityCollectionVideo |
| 119 | FloorPlanVideo |
| 120 | GOADMarketingParticulars |
| 121 | CommunityCollectionVideoShortHorizontal |
| 122 | CommunityCollectionVideoShortVertical |
| 123 | CommunityCollectionVideoShortSquare |
| 124 | SquareLogo |
| 125 | CommunityCollectionVideoClip |
| 126 | FloorPlanVideoClip |
| 127 | MatterportExterior |
| 128 | GaussianFlyoverRaw |
| 129 | CommunityVideo |
| 130 | CommunityVideoClip |
| 131 | MatterportCommunity |
| 132 | ExteriorPhoto |
| 133 | MatterportCommunityThumbnailVideo |
| 137 | MatterportAerialPlusInteriorXray |
| 138 | MatterportAerialExteriorOnly |
| 100001 | StreetView |
| 100002 | StaticMap |
| 100003 | ParcelMap |

### ThreeDimensionalScanType

| Value | Meaning |
|---|---|
| 36 | MatterPort |
| 51 | PanoskinViewer |
| 85 | AtlasBayVR |
| 86 | Peek |
| 87 | Helix |
| 128 | CloudPano |
| 131 | Gryd |
| 135 | Kuula |
| 136 | TheView |
| 137 | ThreeDPlans |
| 147 | Asteroom |
| 148 | AsteroomMLS |
| 149 | Vpix360 |
| 150 | Roundme |
| 151 | My360Virtual |
| 152 | Eyespy360Vr360 (also Vr360Tour) |
| 153 | LivetourIstaging |
| 154 | Realtview |
| 155 | Hommati |
| 156 | Panoskin |
| 157 | P2pvr |
| 168 | IT49 |
| 200 | Realvision |
| 210 | homevisit |
| 220 | iGuide |
| 230 | RealTourVision |
| 240 | Ricoh360 |
| 250 | BdxInteractive |
| 260 | Giraffe360 |
| 270 | VrTourHosts |
| 280 | InsideMaps |
| 290 | Modsy |
| 300 | NodalView |
| 400 | AltitudeHomes |
| 500 | PropertyPanorama |

### ExternalReferenceType4

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | LoopNetAssociateId |
| 2 | DisplayBoardFlag |
| 3 | LoopNetSalesLead |
| 4 | LoopNetMasterProperty |
| 5 | LoopNetAttachment |
| 6 | InfogroupIdNumber |
| 7 | MarketLocationIdNumber |
| 8 | ListHub |
| 9 | RentalHomesPlus |
| 10 | InboundPropertyPlatform |
| 11 | Equity |
| 12 | Vaultware |
| 13 | Yardi |
| 14 | MarylandUpdates |
| 15 | VenterraUpdates |
| 16 | BozzutoUpdates |
| 17 | AspenSquareUpdates |
| 18 | CrossfireUpdates |
| 19 | CollierUpdates |
| 20 | Udr |
| 21 | Aimco |
| 22 | Ellipse |
| 23 | Apartments247Updates |
| 24 | PropertySolutions |
| 25 | ILoveLeasing |
| 26 | OnSite |
| 27 | RelatedUpdates |
| 28 | MaacUpdates |
| 29 | PropertyLinkOnline |
| 30 | RentSentinel |
| 31 | ThreeSixtyFiveConnectUpdates |
| 32 | VaultwareUpdates |
| 33 | InboundPropertyPlatformAttachment |
| 34 | ListHubAttachment |
| 35 | RentalHomesPlusAttachment |
| 36 | MatterportScan |
| 37 | GreatSchools |
| 38 | WaypointListingKey |
| 39 | WaypointAttachmentKey |
| 40 | ApartmentFinderAttachment |
| 41 | VaultwareId |
| 42 | Vidly |
| 43 | WestSideRentalsListingKey |
| 44 | WestsideRentalsAttachmentKey |
| 45 | DeprecatedLoopNetAssociateId |
| 46 | DunAndBradstreetDunsNumber |
| 47 | InsideView |
| 48 | CoStarDataExtractor |
| 49 | CollegeDMP |
| 50 | ListingManagerTenant |
| 51 | LCP360 |
| 52 | Factual |
| 53 | KCL |
| 54 | Vimeo |
| 55 | YouTube |
| 56 | StrCensusId |
| 57 | StrPipelineHotelId |
| 58 | StrMainHeadquarters |
| 59 | StrDivisionalHeadquarters |
| 60 | CoStarAttachmentHandlerDocument |
| 61 | Creditsafe |
| 62 | TenXProperty |
| 63 | TenXListing |
| 64 | IntexLoan |
| 65 | StrOwner |
| 66 | StrOperator |
| 67 | StrAssetManager |
| 68 | StrMembership |
| 69 | FederalEmergencyManagementAgency |
| 70 | AmericanHotelAndLodgingAssociationPropertyId |
| 71 | StrCustomerLocation |
| 72 | IntexTenant |
| 73 | Starlink |
| 74 | Marsha |
| 75 | Hilton |
| 76 | HiltonAlpha |
| 77 | Hyatt |
| 78 | InExtenso |
| 79 | PeopleSoft |
| 80 | Bookingdotcom |
| 81 | Barcelo |
| 82 | GHLink |
| 83 | EmporisBuilding |
| 84 | DoordaUKTenant |
| 85 | AtlasBayVirtualReality |
| 86 | PeekdotUS |
| 87 | Helix |
| 88 | HmLandRegistry |
| 89 | ComunidadDeMadrid |
| 90 | TenX_MA_ID |
| 91 | Preqin |
| 92 | OraclePartyId |
| 93 | OracleCustomerAccountId |
| 94 | OracleLocationId |
| 95 | OraclePartySiteId |
| 96 | OracleCustomerAccountSiteId |
| 97 | OracleBillToSiteUseId |
| 98 | OracleDunningSiteUseId |
| 99 | OraclePersonPartyId |
| 100 | OracleRelationshipId |
| 101 | OracleEmailContact |
| 102 | OracleLandlinePhoneContact |
| 103 | OracleMobilePhoneContact |
| 104 | StrProduct |
| 105 | StrPosSohId |
| 106 | StrPosSosId |
| 107 | StrCustomerContractId |
| 108 | StrCustomerContractsId |
| 109 | OracleInvoiceId |
| 110 | TenXOpportunity |
| 111 | StrPeopleId |
| 112 | GreystarPropertyCode |
| 113 | StrOpportunityAttachmentId |
| 114 | StrOpportunity |
| 115 | CustomerSelfServicePortal |
| 116 | StrQuote |
| 117 | AdpWorkMarketId |
| 118 | Catastro |
| 119 | StrWorkflowProcessName |
| 120 | StrWorkflowInstanceId |
| 121 | BdTopo |
| 122 | HomesnapAgentId |
| 123 | InstituteOfMuseumAndLibraryServices |
| 124 | StrUsername |
| 125 | HomeSnapMlsOffice |
| 126 | HomeSnapMlsUserAgent |
| 127 | Sirene |
| 128 | CloudPano |
| 129 | ThomasDaily |
| 130 | ADV |
| 131 | Gryd |
| 132 | BureauxLocaux |
| 133 | BusinessImmo |
| 134 | Realnyc |
| 135 | Kuula |
| 136 | TheView |
| 137 | ThreeDPlansdotcom |
| 146 | VoaIreland |
| 147 | Belbex |
| 148 | NicheId |
| 149 | LivCor |
| 150 | Explore |
| 151 | Realla |
| 152 | MediaConvertJobId |
| 153 | SignedUri |
| 154 | BIProduct |
| 155 | BIContract |
| 156 | ItalianPropertyMappingId |
| 157 | BISalesforceCompany |
| 158 | BISalesforceContact |
| 159 | SIRET |
| 160 | EnterpriseThirdPartyListingInstance |
| 161 | Dataforsyningen_Denmark |
| 162 | Geonorge_Norway |
| 163 | Inspire_Finland |
| 164 | Morningstar |
| 165 | InsideMaps |
| 166 | HomeSnapContract |
| 167 | HomeSnapProduct |
| 168 | IT49 |
| 169 | ShowMyProperty |
| 170 | RealTourVision |
| 171 | Giraffe360 |
| 172 | CreditsafeWorldwide |
| 173 | BureauxLocauxHubspotCompany |
| 174 | BureauxLocauxHubspotContact |
| 175 | SeekNow |
| 176 | KadasterNetherlands |
| 177 | UPRN |
| 178 | IhgFacId |
| 179 | ScimUserID |
| 180 | VideoHandlerKey |
| 181 | LARSTransactionID |
| 182 | OnTheMarket |
| 183 | NewsWebForms |
| 184 | BuilderIdentifier |
| 185 | LEED |
| 186 | Majic |
| 187 | SplatHandlerKey |
| 188 | RawSplatHandlerKey |
| 189 | BureauxLocauxProduct |
| 190 | BureauxLocauxDeal |
| 191 | BureauxLocauxLineItem |
| 192 | MatterportMedia |
| 193 | OracleCreditID |
| 194 | CompaniesHouseRegNoUK |
| 195 | OracleTransactionID |
| 196 | HighRadiusUsername |
| 197 | FoursquareV2 |
| 198 | ValuationOfficeAgency |
| 199 | DomainSFCompany |
| 200 | DomainSFContact |
| 201 | DomainCompany |
| 202 | DomainContact |
| 203 | Kato |
| 204 | AgencyPilot |
| 205 | LogiPro |
| 206 | DomainSVPProperty |
| 207 | CommercialAgentId |
| 208 | DemandesDeValeursFoncieres |
| 209 | RSSDID |
| 210 | NCUACharterID |
| 211 | GNAFAddressDetailPID |
| 212 | CadastrePolygonPID |
| 213 | CommercialListingDirectFeed |
| 214 | RealVision |
| 215 | Asteroom |
| 216 | AsteroomMls |
| 217 | VPiX360 |
| 218 | Roundme |
| 219 | VR360Tour |
| 220 | LiveTourIStaging |
| 221 | RealTView |
| 222 | Hommati |
| 223 | Panoskin |
| 224 | P2PVR |
| 225 | HomeVisit |
| 226 | IGuide |
| 227 | Ricoh360 |
| 228 | VRTourHosts |
| 229 | Modsy |
| 230 | NodalView |
| 231 | AltitudeHomes |
| 232 | My360Virtual |
| 233 | EyeSpy360 |
| 234 | MatterportStreamingKey |

### SceneClassificationType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Balcony |
| 2 | Beach |
| 3 | BicycleStorage |
| 4 | BoatDock |
| 5 | Clubhouse |
| 6 | CommunityCabanas |
| 7 | CommunityStorageSpace |
| 8 | Courtyard |
| 9 | DogPark |
| 10 | ElectricVehicleChargingStation |
| 12 | FitnessCenter |
| 13 | Gated |
| 14 | LaundryRoom |
| 15 | Lobby |
| 16 | Marina |
| 17 | OutdoorKitchen |
| 18 | OutdoorTennisCourts |
| 19 | SwimmingPool |
| 20 | Restaurant |
| 21 | RooftopDeck |
| 22 | Sauna |
| 23 | Spa |
| 24 | HomeTheater |
| 25 | Yoga |
| 26 | MountainHillsView |
| 27 | OceanBayView |
| 28 | WaterViews |
| 29 | CityView |
| 30 | GolfCourseView |
| 31 | Interior |
| 32 | Exterior |
| 33 | IndoorPool |
| 34 | CommunityElevator |
| 35 | CondoGarage |
| 36 | LaundryFacilities |
| 37 | HighRiseCondos |
| 38 | AssignedParking |
| 39 | MidRiseCondos |
| 40 | Garage |
| 41 | Doorman |
| 42 | PrivateElevator |
| 43 | CoveredParking |
| 44 | Waterfront |
| 45 | PuttingGreen |
| 46 | BikePath |
| 47 | Picnic |
| 48 | Concierge |
| 49 | OpenFloorplan |
| 50 | SecurityService |
| 51 | CommunityBarbecueGrill |
| 52 | Park |
| 53 | GuestParking |
| 54 | LaundryHookup |
| 55 | LowRiseCondos |
| 56 | RanchStyleHouse |
| 57 | FarmhouseArchitecture |
| 58 | Kitchen |
| 59 | Bathroom |
| 61 | WalkInCloset |
| 62 | Bedroom |
| 63 | DiningRoom |
| 64 | LivingRoom |
| 65 | Backyard |
| 66 | WineCellar |
| 67 | Library |
| 68 | OutdoorPlatform |
| 69 | Foyer |
| 70 | Basement |
| 71 | mock |
| 72 | Floorplan |
| 73 | BonusRoom |
| 74 | FamilyRoom |
| 75 | Closet |
| 76 | GameRoom |
| 77 | Hallway |
| 78 | HomeGym |
| 79 | HomeOffice |
| 80 | Mudroom |
| 81 | Pantry |
| 82 | Patio |
| 83 | PowderRoom |
| 84 | Porch |
| 85 | UtilityRoom |
| 86 | Driveway |
| 87 | Breezeway |
| 88 | Carport |
| 89 | SittingRoom |
| 90 | ReadingNook |
| 91 | WalkInPantry |
| 92 | StainlessSteelAppliances |
| 93 | DoubleOven |
| 94 | BrickExterior |
| 95 | StoneExterior |
| 96 | MetalRoof |
| 97 | ShingleRoof |
| 98 | TerraCottaRoof |
| 99 | WaterHeater |
| 100 | TanklessWaterHeater |
| 101 | SolarPanels |
| 102 | OneCarGarage |
| 103 | TwoCarGarage |
| 104 | ThreeCarGarage |
| 105 | ScreenedInPorch |
| 106 | BacklitMirrors |
| 107 | BuiltInVanity |
| 108 | TiledShower |
| 109 | BathtubwithShower |
| 110 | PrivateWaterCloset |
| 111 | SeatinShower |
| 112 | EatinKitchen |
| 113 | Dishwasher |
| 114 | RangeHood |
| 115 | Chandelier |
| 116 | WineBar |
| 117 | TileFloor |
| 118 | TrayCeiling |
| 119 | CeilingFan |
| 120 | PanelMolding |
| 121 | LaundryRoomSink |
| 122 | BeamedCeiling |
| 123 | Stairs |
| 124 | CofferedCeiling |
| 125 | FlushMountFixture |
| 126 | Carpet |
| 127 | Landscaped |
| 128 | Pergola |
| 129 | Fenced |
| 130 | OutdoorLiving |
| 131 | Frontviewoftheproperty |
| 132 | Rearviewoftheproperty |
| 133 | Sideviewoftheproperty |
| 134 | NotSure |
| 135 | InUnitLaundry |
| 136 | MediaroomorHometheatre |
| 137 | Attic |
| 138 | KitchenIsland |
| 139 | QuartzCountertops |
| 140 | BoschAppliances |
| 141 | Fireplace |
| 142 | CrownMolding |
| 143 | GasRange |
| 144 | ConvectionOven |
| 145 | CounterDepthRefrigerator |
| 146 | MultiHeadShower |
| 147 | MarbleCountertops |
| 148 | AccessibleElevator |
| 149 | PlantationShutters |
| 150 | BreakfastNook |
| 151 | FarmhouseSink |
| 152 | RecessedLighting |
| 153 | SubzeroRefrigerator |
| 154 | VaultedCeiling |
| 155 | CathedralCeiling |
| 156 | SteamShower |
| 157 | EVcharging |
| 158 | SoakingTub |
| 159 | FreestandingTub |
| 160 | ButlersPantry |
| 161 | WolfAppliances |
| 162 | Vesselsink |
| 163 | Stackedwasheranddryer |
| 164 | Vikingappliances |
| 165 | Gasoven |
| 166 | Potfillerfaucet |
| 167 | Stonecountertops |
| 168 | WalkInShower |
| 169 | GourmetKitchen |
| 170 | CateringKitchen |
| 171 | Updatedkitchen |
| 172 | Doublevanities |
| 173 | Pendantlighting |
| 174 | Granitecounters |
| 175 | Electroluxappliances |
| 176 | Columnrefrigerator |
| 177 | Panelrefrigerator |
| 178 | Designercloset |
| 179 | TiledBacksplash |
| 180 | Hardwoodfloor |
| 181 | WineRefridgerator |
| 182 | SlateRoof |
| 183 | Microwave |
| 184 | OutdoorLighting |
| 185 | ButcherBlockCountertops |
| 186 | ConcreteCountertops |
| 187 | TileCountertops |
| 188 | StainlessSteelCountertops |
| 189 | VesselSink |
| 191 | InductionCooktop |
| 192 | ElectricCooktop |
| 193 | DowndraftCooktop |
| 194 | WarmingDrawer |
| 195 | BuiltInMicrowave |
| 196 | TrashCompactor |
| 197 | UnderCabinetLighting |
| 198 | BayWindow |
| 199 | SlidingGlassDoors |
| 200 | FrenchDoors |
| 201 | BuiltInBookshelves |
| 202 | FormalLivingRoom |
| 203 | Bidet |
| 204 | RainShowerHead |
| 205 | PedestalSink |
| 206 | MedicineCabinet |
| 207 | LinenCloset |
| 208 | ExhaustFan |
| 209 | SmokeDetector |
| 210 | FireSprinkler |
| 211 | MatureLandscaping |
| 212 | NoLandscaping |
| 213 | WoodFence |
| 214 | ChainLinkFence |
| 215 | WaterFeature |
| 216 | GalleyKitchen |
| 217 | GraniteCountertops |
| 218 | BrownCarpet |
| 219 | GreyCarpet |
| 220 | BlueCarpet |
| 221 | WhiteCarpet |
| 222 | MultiColorCarpet |
| 223 | BanquetteSeating |
| 224 | ElectricalOutlet |
| 225 | LightSwitch |
| 226 | MicrowaveDrawer |
| 227 | UndercounterRefrigerator |
| 228 | FreezerDrawer |
| 229 | RefrigeratorDrawer |
| 230 | ChestFreezer |
| 231 | DoubleSink |
| 232 | TouchlessFaucet |
| 233 | GlassFrontCabinets |
| 234 | OpenShelving |
| 235 | WallMountedTV |
| 236 | WallSconces |
| 237 | LargeWindows |
| 238 | Mirror |
| 239 | FloatingShelves |
| 240 | CozyLivingRoom |
| 241 | WallMountedReadingLight |
| 242 | FullLengthMirror |
| 243 | ClosetDoors |
| 244 | Toilet |
| 245 | WallMountedToilet |
| 246 | BidetAttachment |
| 247 | ShowerGlassEnclosure |
| 248 | ShowerRod |
| 249 | ShowerNicheorRecessedshelf |
| 250 | HandheldShowerHead |
| 251 | UnderMountSink |
| 252 | ConsoleSink |
| 253 | FloatingVanity |
| 254 | MirrorCabinet |
| 255 | LEDMirror |
| 256 | TowelRack |
| 257 | TowelHooks |
| 258 | ToiletPaperHolder |
| 259 | BathroomShelves |
| 260 | LinenCabinet |
| 261 | PonyWall |
| 262 | WiFiRouter |
| 263 | NewLandscaping |
| 264 | FlowerBeds |
| 265 | TrexDecking |
| 266 | WoodDecking |
| 267 | CompositeDecking |
| 268 | WhiteFence |
| 269 | Hardscaping |
| 270 | OpenConceptKitchen |
