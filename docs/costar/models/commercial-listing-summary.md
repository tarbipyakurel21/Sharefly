# Commercial Listing Summary

A commercial listing summary is one record per marketing listing: space offered for lease, or a property, condo, portfolio or land offered for sale or at auction. It rolls the listing's spaces, units and lots up into the figures a search card shows, such as total available area, the asking rent range and the asking price range, and it names the property being marketed.

## What this record is

A commercial listing is what a broker publishes to market space or a property. One listing can cover a single suite, every available space in a building, the spaces across a business park or shopping center, a whole building for sale, a set of condo units, or a portfolio. The summary is the read view of that listing: a flat header with the listing's type, status, dates and property, plus one block for whichever kind of offering it is.

- **Listing type decides which block is filled.** `listingType` says what is being marketed. Lease types (direct space, sublease, lease assignment, coworking, land for lease, building-park and shopping-center space) fill `forLeaseSummary`. Sale types (property, land, condo, portfolio for sale) fill `forSaleSummary`. Auction types fill `auctionForSaleSummary`. The other blocks are null. Apartment, hotel and residential listing types have only the top-level fields.
- **Available is not vacant.** `totalAvailableSquareFeet` is space being marketed. Space can be available while still occupied (the tenant has not left yet), and vacant space may not be listed.
- **Asking is not achieved.** Asking rents and asking prices are what the broker is asking. Leases and sales often close at a different figure, after concessions or negotiation.
- **Rollups and detail can disagree.** The listing-level for-lease figures are stored rollups. The `spaces` list is the full detail and includes spaces that have since gone off market or are pending a lease.

## Using this data

- **Filter on listing type first.** Compare lease listings with lease listings and sale listings with sale listings. Within leasing, a sublease (`listingType` 19) is usually priced below direct space.
- **Normalize rents before comparing.** Convert each space's `rateLow` and `rateHigh` to a yearly rate with its `rateBasis` (1 Monthly, 2 Yearly), or the listing's `forLeaseSummary.askingRateLow` and `askingRateHigh` with `forLeaseSummary.askingRateBasis`, and check `askingRateMeasurementType`: most rates are per square foot, land rates can be per acre. Check `serviceType` too, because a gross rent includes operating expenses that a triple-net rent does not.
- **A rate of 0 means no rate was recorded.** Spaces often show "call for rate". Exclude zeros before averaging, and say how many listings had no rate.
- **Weight averages by area.** An average asking rent across spaces should be weighted by each space's square feet, not a simple mean of the rates.
- **Filter spaces before summing.** Drop spaces with a `dateOffMarket`, and decide whether lease-pending spaces (`isLeasePending`) should count as available.
- **Cap rate and NOI on sale listings are the seller's figures.** `forSaleSummary.capitalizationRate` and `netOperatingIncome` are as marketed, often pro forma, and many listings leave them empty.
- **Currency.** Amounts are in `monetaryUnit`. It is 1 (US dollars) on 1,019 listings and 0 (Unknown) on 3. Each space and condo unit has its own `monetaryUnit`; the for-sale and auction blocks have none, so use the listing's.
- **Sale outcome.** `listingStatus` has no "sold" or "leased" value. For sale listings, `forSaleSummary.saleStatus` carries outcomes such as Sold, Withdrawn and Leased.
- **Address.** `address` is the address the listing markets, and can differ from the property's `primaryAddress`. Its `countyId` and `crossStreetDescription` are always null; the addresses on spaces, properties and condo units carry them.
- **Defaults.** Enum fields are 0 (Unknown) rather than null when nothing is recorded, and lists are empty rather than null. Auction lots never carry an asking price.

## What is in this dataset

- **Which listings:** the Active and OffMarket listings on the 3,339 properties in `commercial-properties.csv`, the properties on CoStar's Matterport list in Houston (`researchMarketId` 14) and Los Angeles (20). Join `propertyId` to the commercial property record for the market and submarket.
- **Status:** Active (741) or OffMarket (281). An OffMarket listing has been taken off the market but not ended; use `listingStatus` 1 to pick listings on the market now. 629 of the properties have a listing.
- **No hidden addresses.** A broker can ask for a listing's address to be hidden on public sites. None of these listings has one.
- **Photos.** Attachments are still images and Matterport scans only. `attachmentUri` on each published attachment (in `attachments`, `forLeaseSummary.spaces[].floorPlan` and `forLeaseSummary.properties[].primaryPhoto`) links to the image on CoStar's CDN, for 22,816 of the 22,817 attachments. Image links are at size 112 (up to 1,880 by 900 pixels). Replace the `/112/` segment with another size id for another size, such as 113 (1,400×720) or 116 (2,048×2,048).
- **Contacts and notes.** Brokers and other contacts are included with their names, as are notes, photos, floor plans, and commission and transaction values. Email addresses and phone numbers, in contact fields and in notes and captions, are fake, the same fake for the same real value in every dataset.
- **Not filled:** `primarySubmarketName` is always empty in this record. Use `primarySubmarketId`.

## Joining to other models

Join on integer ids, never on names.

- `propertyId` joins to `commercial-property` `id`.
- For multi-property for-lease listings, `forLeaseSummary.properties[].id` and `forLeaseSummary.spaces[].propertyId` join to `commercial-property` `id`.
- `propertyGroupId` matches `commercial-property` `propertyGroupId`.
- `propertyId` with the `videoKey` of a Matterport attachment in `attachments` joins to `PropertyId` and `MatterportModelId` in `commercial-properties.csv`. Matterport attachments are those with `videoExternalReferenceType` 36 or 234.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### CommercialListingSummary (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of the commercial marketing listing record; the primary key tying together the listing's lease/sale terms, attachments, and entities. |  |
| `listingType` | integer (ListingType) | Code listing type that fixes the marketing arrangement: a Sale variant (Property/Land/Portfolio/Consolidated-Condo For Sale, IDs 9/12/13/15), a Direct/Sublet/Coworking Lease variant (IDs 14/16/17/18/19/20/21), an Auction variant (IDs 22-26), or Disconnected (27/28). Constrains allowed statuses and concurrency rules. | see `ListingType` in Allowed values |
| `listingStatus` | integer (ListingStatus) | Lifecycle status of the listing (Draft, Active, Pending, OffMarket, Terminate, Confidential, etc.) governing publication and transition rules; private statuses (Introduction/Confidential) are restricted to private for-sale/portfolio types. | see `ListingStatus` in Allowed values |
| `listingStatusUpdatedDate` | date-time (nullable) | Timestamp of the last status change on the listing, set automatically when status transitions; tracks market-state recency. |  |
| `createdDate` | date-time (nullable) | Date the listing record was created. |  |
| `brokerageCompanyName` | text (nullable) | Firm name used at this location. Should always be populated, even when identical to the company name. Null when none. |  |
| `certifiedFreshDate` | date-time (nullable) | Date the listing was last certified fresh/accurate; supports the periodic re-check cycle so consumers know how current it is. |  |
| `commissionValue` | decimal (nullable) | Brokerage commission offered on the deal; internal compensation/economics of the listing not part of the marketed price. |  |
| `commissionSplitPercent` | decimal (nullable) | Percentage of the commission shared with a cooperating broker (e.g. the buyer/tenant-rep side); internal compensation term. |  |
| `transactionValue` | decimal (nullable) | Monetary value of the underlying transaction; an internal financial figure, qualify confidence/flavor when comparing to comps. |  |
| `listingExpirationInMonths` | integer (nullable) | Date the listing/marketing agreement with the broker expires, bounding how long the property may be actively marketed under this mandate. Whole months from the day the record is built to the month the listing agreement expires, so it changes over time and is negative once expired; null when no expiration date is recorded. |  |
| `propertyId` | integer (nullable) | Identifier of the single subject property the listing markets; the property is the anchor of all CRE data. |  |
| `propertyGroupId` | integer (nullable) | Identifier of the property group/portfolio when the listing markets multiple properties as a set rather than a single asset. For lease listings only: the property group id from the listing summary, or 0 when there is none. Null for every other listing type. |  |
| `propertyType` | integer (PropertyType) | Primary CRE property-type classification of the subject (Office, Industrial, Retail, Multifamily, etc.); see the commercial listing data structure for the propertyType/SubType ID taxonomy. Drives the relevant attribute set and filtering. | see `PropertyType` in Allowed values |
| `buildingName` | text (nullable) | Marketing name of the building the listed space sits in, shown in listing displays. |  |
| `buildingSizeSquareFeet` | decimal (nullable) | Total size of the building in square feet (RBA/GBA scale) — RBA is rentable area; GBA is the whole-building gross measure before deducting vertical penetration. Gives the whole-asset footprint behind the listed space. |  |
| `buildingClass` | integer (BuildingClass) | Building Class A/B/C — a market-relative, subjective quality grade (A above-average, B average, C below-average); not comparable across markets and distinct from the CoStar Building Rating. Required and validated against Rating via the Class<->Rating matrix. | 0 = Unknown, 1 = A, 2 = B, 3 = C, 4 = F |
| `buildingConditionRating` | integer (BuildingConditionRating) | Code rating of the building's physical condition/quality. | 0 = Unknown, 1 = Poor, 2 = NeedsImprovement, 3 = Adequate, 4 = Good, 5 = Excellent |
| `buildingPark` | text (nullable) | Name of the business park or development the building belongs to. |  |
| `buildingRating` | integer (BuildingRating) | CoStar Building Rating (formerly Star Rating), a 1-5 national peer-property-type quality grade (5 best-in-class, 1 well-below-average); comparable across markets and distinct from Building Class. Validated against Class via the Class<->Rating matrix. | 0 = Unknown, 1 = OneStar, 2 = TwoStar, 3 = ThreeStar, 4 = FourStar, 5 = FiveStar |
| `constructionCompleteYear` | integer (nullable) | Collection of construction milestone events for the property (e.g. built, renovated), capturing its development lifecycle. Year of the first construction event of type ConstructionComplete on the property; null when there is none. |  |
| `renovationCompleteYear` | integer (nullable) | Collection of construction milestone events for the property (e.g. built, renovated), capturing its development lifecycle. Year of the first construction event of type RenovationFinished on the property; null when there is none. |  |
| `coStarBuildingType` | integer (CoStarBuildingType) | CoStar internal building-type classification of the property. | 0 = Unknown, 1 = Yes, 2 = No, 3 = Unresearched, 4 = Assessment, 6 = CompsReview, 7 = DataSeed1, 8 = DataSeed2, 9 = PendingDelete |
| `primarySubmarketId` | integer (nullable) | Identifier of the CoStar submarket the property falls in; submarkets are building-type-specific competitive areas, not admin geography. Join on the ID. |  |
| `primarySubmarketName` | text (nullable) | Not populated in this dataset; expect null. |  |
| `address` | CommercialListingSummaryAddress object (nullable) | Foreign key to the address record for the listed property/space; join on the integer ID. The address record whose id is stored on the listing summary; null when there is none. It is the full address, with no part hidden. |  |
| `listingFeedStatusUpdatedDate` | date-time (nullable) | Timestamp the listing's feed status last changed, indicating freshness of the syndication state. |  |
| `isFeedConsolidated` | true/false (nullable) | Only for feed listings: true when more than one third-party listing shares the feed instance id (found through the listing's BureauxLocaux or Realla external reference), false when exactly one; null for non-feed listings. |  |
| `sourceDocumentCount` | integer (nullable) | Only for feed listings: the number of third-party listings sharing the feed instance id; null for non-feed listings. |  |
| `notes` | list of CommercialListingSummaryCommercialListingNotes objects (nullable) | Collection of internal notes attached to the commercial listing record, holding research or annotation commentary. The listing's own notes, each mapped to a header, type and text. |  |
| `auctionForSaleSummary` | CommercialListingSummaryAuctionForSaleSummary object (nullable) | Identifier of the auction for-sale offering record tied to this listing on the auction platform. Only present for auction listing types (property, land, condo, loan or portfolio for auction); null for every other listing type. |  |
| `attachments` | list of CommercialListingSummaryAttachmentReference objects | Collection of media attachment references (photos, brochures, floor plans) marketed with the commercial listing. Listing-level media that qualify as listing attachments. When the listing has none, the primary media of its property is used instead (not for portfolio, shopping-center or building-park listings, which fall back to their properties or property group). |  |
| `listingContacts` | list of CommercialListingSummaryContact objects | Collection of contact references (agents, owners, managers) tied to the listing; drives claimed-listing edit permissions and displayed contact info. Every contact reference on the listing, each filled in from the Contact and Location models. |  |
| `forLeaseSummary` | CommercialListingSummaryForLease object (nullable) | Only present for for-lease listing types (direct space, sublease, lease assignment, coworking, land lease, shopping-center, building-park or disconnected space lease) and when a listing summary record exists; null otherwise. |  |
| `forSaleSummary` | CommercialListingSummaryForSale object (nullable) | Only present for for-sale listing types (property, land, condo, consolidated condo, portfolio, residential property, disconnected sale or disconnected condo for sale); null for every other listing type. |  |
| `propertyContacts` | list of CommercialListingSummaryPropertyContact objects | The property's contact records that have no end date, each filled in from the Contact and Location models. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency of the listing's monetary figures (prices, rents, NOI); normalize currency before aggregating money across listings. | see `MonetaryUnit` in Allowed values |

### CommercialListingSummaryAddress

Found at: `address`, `forLeaseSummary.spaces[].marketingAddress`, `forLeaseSummary.properties[].address`, `forSaleSummary.units[].address`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique integer identifier of the address record; the stable key other entities join to when referencing this location. |  |
| `streetNumber` | text (nullable) | Street (house) number portion of the street address, e.g. the 1200 in 1200 Main St. |  |
| `streetNumberEndRange` | text (nullable) | Upper bound of the street-number range when the property spans multiple addresses, e.g. the 1210 in a 1200-1210 frontage. |  |
| `streetDirection` | text (nullable) | Directional prefix or component of the street name such as N, SW, or East. |  |
| `streetName` | text (nullable) | Name of the street the property fronts, e.g. Main in 1200 Main St. |  |
| `streetType` | text (nullable) | Street thoroughfare type designation such as St, Ave, Blvd, or Rd. |  |
| `streetSuffix` | text (nullable) | Trailing directional suffix of the street address, e.g. the NW in 1200 Main St NW. |  |
| `buildingNumber` | text (nullable) | Building number identifying a specific structure within a multi-building site or campus at the address. Building number with surrounding spaces trimmed; blank becomes null. |  |
| `buildingName` | text (nullable) | Marketing name of the building the listed space sits in, shown in listing displays. Taken from the listing's building name (trimmed, blank becomes null), not from the address record; only filled when the address exists. |  |
| `crossStreetDescription` | text (nullable) | Free-text description of the nearest cross streets or intersection, used to locate or market the property by its corner or block. Not populated in this dataset; expect null. |  |
| `postalBox` | text (nullable) | Post-office box designation for the address when mail is delivered to a PO box rather than the street location. |  |
| `city` | text (nullable) | City name text of the address; an admin-geography label. Join to GeoEntities_City on cityId, never on this name string, since city names recur globally. |  |
| `countyId` | integer (nullable) | Integer identifying the county, the largest geographical subdivision of most US states. The District of Columbia and Ontario are current exceptions. Not populated in this dataset; expect null. |  |
| `state` | text (nullable) | State or province text of the address; an admin-geography label. Resolve via stateId rather than this string for joins. |  |
| `postcode` | text (nullable) | Postal code of the address (international term for ZIP); part of admin geography. Postal code with surrounding spaces trimmed. |  |
| `countryCode` | text (nullable) | Country code of the address; top-level admin-geography scope. Resolves to GeoEntities_Country and disambiguates globally recurring city/state names. |  |
| `latitude` | decimal (nullable) | Geocoded latitude coordinate of the address used for mapping and spatial analysis; nullable when geocoding is unresolved. |  |
| `longitude` | decimal (nullable) | Geocoded longitude coordinate of the address used for mapping and spatial analysis; nullable when geocoding is unresolved. |  |

### CommercialListingSummaryCommercialListingNotes

Found at: `notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachments` | list of CommercialListingNotesAttachmentReference objects (nullable) | Attachments referenced by the note. |  |
| `header` | text (nullable) | Display heading/title for the listing note shown above its content. |  |
| `noteType` | integer (NoteType) | Kind of note. | see `NoteType` in Allowed values |
| `originTag` | OriginTag object (nullable) | Not populated in this dataset; expect null. |  |
| `value` | text (nullable) | Text of the note. |  |

### CommercialListingNotesAttachmentReference

Found at: `notes[].attachments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Identifies a file describing a given entity. The file can be any format, including document, spreadsheet, JPEG, GIF, Bitmap, etc. |  |
| `attachmentSource` | integer (AttachmentSource) | The source where the attachment originated, such as Email, Fax, Field Researcher, Scan, or Standard Mail. | see `AttachmentSource` in Allowed values |
| `attachmentType` | integer (AttachmentType3) | Logical representation of the attachment. Values include: Aerial Photo, Argus Financial, Building Photo, Contract, Floor Plan, Investment Package, Image, iPIX Virtual Tour, Lobby, Locational Map, Logo, Outlook Contact Card, Photograph, Plat Map, Presentation, Spreadsheet. | see `AttachmentType3` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension2) | The file extension/type of the attachment (e.g., DOC, PDF, JPG, GIF, TIF, XLS, etc.). | see `AttachmentTypeExtension2` in Allowed values |
| `caption` | text (nullable) | Short description about the attachment. |  |
| `checkSum` | text (nullable) | Content checksum of the attachment binary used for integrity/dedup (read-only from master). |  |
| `cloudFolder` | text (nullable) | Cloud storage folder/path where the attachment binary resides (read-only from master). |  |
| `dimensions` | AttachmentDimensions object (nullable) | Pixel/size dimensions of the media asset (read-only from master). Image size container copied from the attachment's dimensions. |  |
| `isMarketingPublished` | true/false | Whether the attachment is published specifically for marketing surfaces (read-only from master). Not populated in this dataset; expect null. |  |
| `isPublished` | true/false | Indicates whether clients are allowed to view the attachment. |  |
| `originatedByContactId` | integer (nullable) | Identifier of the person (contact) who created the attachment record. |  |
| `originationDate` | date-time (nullable) | When the attachment was created. |  |
| `originTag` | OriginTag object (nullable) | Not populated in this dataset; expect null. |  |
| `videoExternalReferenceType` | integer (ExternalReferenceType3) | External-reference type indicating the video hosting provider/source for the videoKey. | see `ExternalReferenceType3` in Allowed values |
| `videoKey` | text (nullable) | External key/identifier of the associated video asset, when the attachment is a video. |  |

### AttachmentDimensions

Found at: `notes[].attachments[].dimensions`, `attachments[].dimensions`, `forLeaseSummary.spaces[].floorPlan.dimensions`, `forLeaseSummary.properties[].primaryPhoto.dimensions`

| Field | Type | Description | Values |
|---|---|---|---|
| `width` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Width taken from the attachment's dimensions. |  |
| `height` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Height taken from the attachment's dimensions. |  |

### OriginTag

Found at: `notes[].attachments[].originTag`, `notes[].originTag`, `forLeaseSummary.lands[].notes[].originTag`

| Field | Type | Description | Values |
|---|---|---|---|
| `cultureCode` | text (nullable) | Not populated in this dataset; expect null. |  |
| `versionNumber` | integer (nullable) | Not populated in this dataset; expect null. |  |
| `preferredCulture` | text (nullable) | Not populated in this dataset; expect null. |  |

### CommercialListingSummaryAuctionForSaleSummary

Found at: `auctionForSaleSummary`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Identifier of the auction for-sale offering record tied to this listing on the auction platform. |  |
| `assetManager` | CommercialListingSummaryAuctionForSaleContact object (nullable) | Collection of contact references (brokers, sellers, auction roles) associated with this auction. The first contact on the auction record whose role is assetManager; null when there is none. |  |
| `forSaleId` | integer (nullable) | Identifier of the for-sale offering associated with this listing when it is marketed for sale; a listing may be for lease and/or for sale. |  |
| `auctionStartDate` | date-time (nullable) | Date/time the auction for this offering opens for bidding. |  |
| `auctionEndDate` | date-time (nullable) | Date/time the auction for this offering closes to bidding. |  |
| `currentReserve` | integer (nullable) | Current reserve price on an auction offering, the minimum the seller will accept; an internal auction financial threshold. |  |
| `startingBid` | integer (nullable) | Opening bid amount for the auction offering, the floor at which bidding begins. |  |
| `saleStatus` | integer (SaleStatus) | Status of the sale side of the listing (e.g. available, under contract, sold); the marketing/transaction state of the for-sale offering. | 0 = Unknown, 1 = Active, 2 = Escrow, 3 = Pending, 4 = UnderContract, 5 = Sold, 6 = Withdrawn, 7 = Leased, 12 = Rubbish, 13 = Occupied, 14 = Cancelled, 15 = NotSold |
| `saleType` | integer (SaleType) | Sale type (Investment vs Owner/User), which drives which fields matter to the buyer (income/leases vs allowed use/operating cost) and how % Leased is computed for a for-sale-only listing. | 0 = Unknown, 1 = Investment, 2 = OwnerUser, 3 = InvestmentOrOwnerUser |
| `assetCount` | integer (nullable) | Number of properties included in the offering; greater than one for portfolio or multi-property sale listings. |  |
| `portfolioName` | text (nullable) | Marketing name of the portfolio when multiple properties are offered together as a named bundle. |  |
| `portfolioType` | integer (PortfolioType) (nullable) | Code classifying the portfolio nature of a multi-property offering; drives whether per-property prices are allocated estimates. | 0 = Individual, 1 = MultipleProperty, 2 = BulkPortfolio, 3 = PartOfMultipleProperty, 4 = PartOfBulkPortfolio, 5 = MultipleCondo |
| `condoUnitId` | integer (nullable) | Identifier of the specific condo unit being offered when the listing is a condo-unit for-sale offering. |  |
| `unitNumber` | text (nullable) | Unit/suite number label of the specific space or condo unit being marketed within the building. |  |
| `unitSquareFeet` | decimal (nullable) | Rentable area of the specific unit/space being listed in square feet; use RBA for lease economics. |  |
| `propertyFloorId` | integer (nullable) | Identifier of the building floor the listed space occupies, tying availability to a specific level. |  |
| `totalAvailableSquareFeet` | decimal (nullable) | Total square footage marketed as available across the listing — space being marketed for lease/sale regardless of whether it is vacant, occupied, sublet, or available at a future date. Distinct from vacant SF; do not feed into a vacancy numerator. |  |
| `lots` | list of CommercialListingSummaryAuctionForSaleLot objects (nullable) | Collection of auction lots (individual sale parcels/units) making up the auction. Lots listed on the auction record; empty when there is no auction record. |  |

### CommercialListingSummaryAuctionForSaleContact

Found at: `auctionForSaleSummary.assetManager`

| Field | Type | Description | Values |
|---|---|---|---|
| `contactEmail` | text (nullable) | Direct email address of the individual contact for the auctioned for-sale property. |  |
| `contactFullName` | text (nullable) | Full name of the individual contact (e.g. listing agent or seller representative) for the auctioned for-sale property. |  |
| `contactId` | integer (nullable) | Id of the person in CoStar contact data. |  |
| `contactPhone` | text (nullable) | Direct phone number of the individual contact for the auctioned for-sale property. |  |
| `contactPhoneCountryCode` | text (nullable) | International dialing country code for the individual contact's phone number. |  |
| `contactRole` | integer (ContactRole) | Role of the person or company on this record, such as listing broker, buyer or seller. | see `ContactRole` in Allowed values |
| `locationEmail` | text (nullable) | Email address of the company/location for the auction for-sale contact; a business contact detail for the represented firm. |  |
| `locationId` | integer (nullable) | Id of the office location (company branch) in CoStar contact data. |  |
| `locationName` | text (nullable) | Display name of the company/location associated with this auction for-sale contact (e.g. the brokerage or seller firm representing the auctioned property). |  |
| `locationPhone` | text (nullable) | Phone number of the company/location for the auction for-sale contact; a business contact detail for the represented firm. |  |
| `locationPhoneCountryCode` | text (nullable) | International dialing country code for the company/location phone number. |  |

### CommercialListingSummaryAuctionForSaleLot

Found at: `auctionForSaleSummary.lots[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier for the auction for-sale lot record. |  |
| `lotNumber` | text (nullable) | Lot number labeling this auction lot within the auction sale. |  |
| `lotDescription` | text (nullable) | Free-text description of the auction lot and what is being sold. |  |
| `lotSize` | decimal (nullable) | Measurement-valued size of the auction lot (area with unit of measure). Numeric value of the lot's size measurement; null when the lot has no size. |  |
| `lotSizeMeasurementType` | integer (MeasurementUnit2) (nullable) | Measurement-valued size of the auction lot (area with unit of measure). Unit of the lot's size measurement; null when the lot has no size. | 0 = Unknown, 1 = SquareFeet, 2 = Acres, 3 = SquareMeters |
| `askingPrice` | integer (nullable) | Not populated in this dataset; expect null. |  |
| `parcelNumbers` | list of text values | List of parcel references (county assessor APNs) identifying the legal land parcels comprising the auction lot. Parcel numbers recorded on the lot, with empty entries dropped. |  |

### CommercialListingSummaryAttachmentReference

Found at: `attachments[]`, `forLeaseSummary.spaces[].floorPlan`, `forLeaseSummary.properties[].primaryPhoto`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Identifies a file describing a given entity. The file can be any format, including document, spreadsheet, JPEG, GIF, Bitmap, etc. |  |
| `attachmentType` | integer (AttachmentType3) | Logical representation of the attachment. Values include: Aerial Photo, Argus Financial, Building Photo, Contract, Floor Plan, Investment Package, Image, iPIX Virtual Tour, Lobby, Locational Map, Logo, Outlook Contact Card, Photograph, Plat Map, Presentation, Spreadsheet. | see `AttachmentType3` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension2) | The file extension/type of the attachment (e.g., DOC, PDF, JPG, GIF, TIF, XLS, etc.). | see `AttachmentTypeExtension2` in Allowed values |
| `caption` | text (nullable) | Short description about the attachment. |  |
| `attachmentUri` | text (nullable) | Link to the attachment's file on CoStar's CDN, set on published attachments only. Image links are at size 112 (up to 1,880 by 900 pixels); replace the /112/ segment with another size id to get another size. |  |
| `dimensions` | AttachmentDimensions object (nullable) | Pixel/size dimensions of the media asset (read-only from master). Image size container copied from the attachment's dimensions. |  |
| `originationDate` | date-time (nullable) | When the attachment was created. |  |
| `videoExternalReferenceType` | integer (ExternalReferenceType3) | External-reference type indicating the video hosting provider/source for the videoKey. | see `ExternalReferenceType3` in Allowed values |
| `videoKey` | text (nullable) | External key/identifier of the associated video asset, when the attachment is a video. |  |

### CommercialListingSummaryContact

Found at: `listingContacts[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer (nullable) | Id of the contact record on the listing. |  |
| `locationId` | integer (nullable) | Id of the office location (company branch) in CoStar contact data. |  |
| `firstName` | text (nullable) | Contact's given (first) name; core personal identity field for a CRE individual such as a broker or agent. |  |
| `lastName` | text (nullable) | Contact's family (last) name; core personal identity field. |  |
| `locationName` | text (nullable) | Firm name used at this location. Should always be populated, even when identical to the company name. |  |
| `emailAddress` | text (nullable) | Contact's primary email address; a key communication and lead-delivery channel for brokers and agents. |  |
| `phoneNumber` | text (nullable) | Contact's primary office/business phone number, a main channel for reaching a broker or agent. |  |
| `phoneNumberCountryCode` | text (nullable) | ISO/country dialing code for the primary phone number, supporting international formatting. |  |
| `phoneExt` | text (nullable) | Telephone extension dialed after the primary phone number to reach the contact directly. |  |
| `contactRole` | integer (ContactRole) | Role of the person or company on this record, such as listing broker, buyer or seller. | see `ContactRole` in Allowed values |
| `displayInProduct` | true/false (nullable) | Whether this contact should be publicly displayed in the marketed listing/product surface, vs kept internal-only. |  |

### CommercialListingSummaryForLease

Found at: `forLeaseSummary`

| Field | Type | Description | Values |
|---|---|---|---|
| `serviceType` | integer (ServiceType) | Code classifying the listing's transaction service (e.g. for lease vs for sale arrangement) used to route and filter the offering. | see `ServiceType` in Allowed values |
| `spaceCount` | integer (nullable) | Number of distinct lease spaces marketed under the listing; indicates how much availability the listing aggregates. |  |
| `assetCount` | integer | Number of properties included in the offering; greater than one for portfolio or multi-property sale listings. |  |
| `minDivisibleSquareFeet` | decimal (nullable) | Smallest contiguous area a tenant can lease from the listing in square feet; the minimum bite size a larger space can be subdivided into for marketing to smaller tenants. |  |
| `maxContiguousSquareFeet` | decimal (nullable) | Largest single combinable block of space available in square feet — the true contiguous (contiguous-in-building) max, the sum of contiguous spaces, rather than a naive sum of all unconnected spaces. |  |
| `totalAvailableSquareFeet` | decimal (nullable) | Total square footage marketed as available across the listing — space being marketed for lease/sale regardless of whether it is vacant, occupied, sublet, or available at a future date. Distinct from vacant SF; do not feed into a vacancy numerator. |  |
| `askingRateLow` | decimal (nullable) | Lowest asking (face) lease rate quoted across the listing's spaces, in the listing's rate basis; an asking-flavor rent, not contract or effective, and not comparable across service types without grossing-up/normalizing. |  |
| `askingRateHigh` | decimal (nullable) | Highest asking (face) lease rate quoted across the listing's spaces, in the listing's rate basis; an asking flavor — normalize service type (NNN vs gross) and per-SF/yr before comparing rents. |  |
| `askingRateBasis` | integer (RateBasis) | Rent service type/basis governing the asking rate (e.g. NNN/triple-net, FSG/full-service-gross, modified gross) — who pays which operating expenses. Rates are not comparable across bases without normalizing (e.g. grossing a net rate up to full-service). | 0 = Unknown, 1 = Monthly, 2 = Yearly |
| `askingRateMeasurementType` | integer (MeasurementUnit2) | Size basis the asking rate is measured against (e.g. per SF per year vs per month), needed to interpret and normalize the rate. Per-acre rates are reported as Acres and per-square-foot rates as squareFeet; any other basis is Unknown. | 0 = Unknown, 1 = SquareFeet, 2 = Acres, 3 = SquareMeters |
| `vacancyLoss` | decimal (nullable) | Vacancy/collection-loss allowance deducted in the income waterfall (gross potential/base rent + reimbursements + other income, less this loss = Effective Gross Income); an underwriting input reflecting expected uncollected rent. |  |
| `spaces` | list of CommercialListingSummaryForLeaseSpaceForLease objects | One entry per space. All spaces are listed, including off-market and lease-pending ones. For non-exclusive (open) mandates the entries are the listing's own marketing copies of the spaces; otherwise they are the inventory spaces. Sorted by floor order, then suite name, then id. |  |
| `properties` | list of CommercialListingSummaryForLeaseProperty objects | Properties of the listing's property group, only fetched for building-park and shopping-center lease listings, so empty for all other lease types. The group's primary property comes first, then non-land properties by building size (largest first), then land by id. |  |
| `lands` | list of CommercialListingSummaryForLeaseLandForLease objects | Land-for-lease records attached to the listing, only for for-lease listing types. |  |
| `minDateOnMarket` | date-time (nullable) | The date a ForSale item (Property, Land, or CondoUnit) goes on the market. Anchors marketing duration and on-market status. Earliest on-market date across the listing's for-sale records if it has any, otherwise across its for-lease spaces, otherwise across its land-for-lease records; null when none has a date. Uses inventory records, including off-market ones. |  |

### CommercialListingSummaryForLeaseSpaceForLease

Found at: `forLeaseSummary.spaces[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Primary key of the space-for-lease record (a marketed unit of commercial space). These entities are processed together in the product refresh. |  |
| `propertyFloorId` | integer (nullable) | Identifier of the floor (on any property) that this space occupies; uniquely identifies a property floor. The space's property floor id; for non-exclusive (open) mandates it is taken from the underlying inventory space rather than the marketing copy. |  |
| `propertyId` | integer (nullable) | Foreign key to the parent commercial property the space belongs to; the property anchors all CRE data. The space's property id; for non-exclusive (open) mandates it is taken from the underlying inventory space rather than the marketing copy. |  |
| `floorName` | integer (FloorName) | Name of the floor from the property floor record. Spaces with no floor id (disconnected listings) use the floor name on the space itself, and so does a space whose floor record is an Unknown floor but whose own floor name is known. | see `FloorName` in Allowed values |
| `isFullFloor` | true/false (nullable) | Whether the space includes the entire floor (needed because buildings may have non-uniform floor sizes). 0=No, 1=Yes, NULL=Unknown. |  |
| `suite` | text (nullable) | Suite/unit address number of the space; allows numeric (e.g. 124, 2, 546) or alphanumeric (A1, 1-A, 23-B1) values. The data size for Suite/unitNumber should match across SpaceForLease, SpaceOccupied, and CondoUnit. |  |
| `availableOnDate` | date-time (nullable) | Date when the space can be occupied by a new tenant. Mutually exclusive with the availability-in-days value; if the availability identifier is NULL, this date cannot be NULL. |  |
| `availabilityType` | integer (AvailabilityType) | Number of days' notice the current tenant must be given before a replacement tenant's lease start date for the same space. Mutually exclusive with SpaceAvailableOnDate; if SpaceAvailableOnDate is not NULL, this must be NULL. | 0 = Unknown, 1 = ThirtyDays, 2 = SixtyDays, 3 = NinetyDays, 4 = OneHundredTwentyDays, 5 = ToBeDetermined, 6 = Arranged, 7 = Negotiable |
| `serviceType` | integer (ServiceType) | Service/lease type governing which operating expenses are included in the rent (Triple Net, Full Service, Modified Gross, Single/Double Net, Plus Electric, FRI, etc.); allowed values vary by space type and country. Drives whether rents are comparable across spaces. | see `ServiceType` in Allowed values |
| `spaceUse` | integer (SpaceUse) | How the space will be used (Office, Office/Medical, Office/Retail, Medical, Retail, Flex, Industrial); gates which space-detail fields apply. | 0 = Unknown, 1 = Office, 2 = OfficeMedical, 3 = OfficeRetail, 4 = Medical, 5 = Retail, 6 = Flex, 7 = Industrial |
| `spaceType` | integer (SpaceType) | Type of space available: Relet (direct), New, Sublet, or Assignment. Direct leasing activity = relet + new; Sublet activity = sublet + assignment. | 0 = Unknown, 1 = Relet, 2 = New, 3 = Sublet, 4 = Assignment |
| `isExecutiveSuite` | true/false (nullable) | Whether the available space is an executive suite. Executive suites are rented by a company that may sublet to other parties; due to high turnover, CoStar does not track that subletting and tracks only the primary company renting the space. |  |
| `squareFeetMin` | decimal (nullable) | Smallest amount of square footage the owner will lease. |  |
| `squareFeetMax` | decimal (nullable) | Square footage the owner/listing agent advertises for the space. The advertised figure may differ from actual square footage, since it can be rounded to the nearest 10, 100, 1000 sf, etc. |  |
| `squareFeetMaxContiguous` | decimal (nullable) | List of space IDs that combine to form this contiguous block; the combinable block, not a sum of all building spaces. Sum of the maximum square feet of the spaces in the same contiguous block that have no off-market date, counting every such space in the block (lease-pending included, and including spaces outside this listing). Without a block key it is the space's own maximum square feet, or 0 when that is missing. Off-market spaces in a block are not counted; 0 if the block is not found. |  |
| `rateLow` | decimal | May blend component rates (e.g. warehouse + office). Distinct from contract or effective/net rent and not comparable across service types. Low end of the space's asking rate; 0 (not null) when no rate is recorded. |  |
| `rateHigh` | decimal | May blend component rates (e.g. warehouse + office). Distinct from contract or effective/net rent and not comparable across service types. High end of the space's asking rate; 0 (not null) when no rate is recorded. |  |
| `rateBasis` | integer (RateBasis) | May blend component rates (e.g. warehouse + office). Distinct from contract or effective/net rent and not comparable across service types. Period of the asking rate (Monthly or Yearly); Unknown when no rate is recorded. | 0 = Unknown, 1 = Monthly, 2 = Yearly |
| `monetaryUnit` | integer (MonetaryUnit) | Currency (monetary unit) of the space's rate and expense amounts; normalize before aggregating rents across spaces/markets. | see `MonetaryUnit` in Allowed values |
| `askingRateHasValue` | true/false (nullable) | May blend component rates (e.g. warehouse + office). Distinct from contract or effective/net rent and not comparable across service types. Whether an asking rate was recorded at all. |  |
| `floorPlan` | CommercialListingSummaryAttachmentReference object (nullable) | Collection of media attachment references (photos, floor plans) for the space listing. Most recent attachment of type floor plan on the space. |  |
| `marketingAddress` | CommercialListingSummaryAddress object (nullable) | Foreign key to the marketing address for the space; the model embeds a full marketingAddress object rather than an id. Address record for the space's marketing address id; null when there is none. For non-exclusive (open) mandates it is the marketing copy's address. |  |
| `isLeasePending` | true/false (nullable) | Indicates whether a lease is pending, is not pending, or does not exist. True only when the space's lease-pending state is Yes; false for No, Unknown or missing, never null. |  |
| `leasePendingDate` | date-time (nullable) | Date the space was involved in leasing negotiations. |  |
| `dateOnMarket` | date-time (nullable) | Date the space was listed for lease (anchors time-on-market). A tenant may still occupy the space when listed, e.g. when an owner pressures the current tenant to renew or expects them to vacate. If the true availability date is unknown, the researcher may enter the current or an estimated date; the field cannot be NULL. |  |
| `dateOffMarket` | date-time (nullable) | Date the space was taken off the market; the last day on the market is exclusive of this value (the space was not on the market on the entered date). Set when a space is renovated, withheld, or used to pressure an existing tenant to renew. Caution: removing a space can drastically affect the SpaceAvailableGroup. NULL while the space is still on the market. |  |
| `leaseTermHigh` | integer (nullable) | Maximum amount of time (in months) the space can be leased. If non-NULL, leaseTermType must be non-NULL (Days, Months, or Years) and leaseTermLow must be non-NULL and <= leaseTermHigh. Mutually exclusive with leaseTermThru and the month-to-month flag. |  |
| `leaseTermLow` | integer (nullable) | Minimum amount of time (in months) the space can be leased. If non-NULL, leaseTermType must be non-NULL (Days, Months, or Years) and leaseTermHigh must be non-NULL and >= leaseTermLow. Mutually exclusive with leaseTermThru and the month-to-month flag. |  |
| `leaseTermThru` | date-time (nullable) | Date the space's lease must end. Displayed as MM/YYYY but stored with the day set to the first of the month (chosen for consistency, since month-end varies). If non-NULL, mutually exclusive with leaseTermType, leaseTermLow, leaseTermHigh, and the month-to-month flag. |  |
| `leaseTermType` | integer (LeaseTermType) | Measurable time unit for leaseTermLow/leaseTermHigh, or a state when units cannot be quantified. Values: Years, Months, Days, To Be Determined, Negotiable. | 0 = Unknown, 1 = Years, 2 = Months, 3 = Days, 4 = ToBeDetermined, 5 = Negotiable, 6 = ThreeOrSixOrNine, 7 = ShortTerm |
| `loadBay` | CommercialListingSummaryForLeaseLoadBay object (nullable) | Loading-bay detail object for the space (dock/drive-in loading characteristics); a core industrial logistics attribute set. Loading details of the space; always present, with Unknown states and null counts when the space has none. |  |
| `commonAreaMaintenanceAmount` | decimal (nullable) | Common Area Maintenance (CAM) expense amount charged in addition to base rent; a pass-through operating cost (with taxes and insurance) the tenant bears under net leases. Surface alongside service type when comparing effective rents. |  |
| `commonAreaMaintenanceAmountPerYear` | decimal (nullable) | Annualized Common Area Maintenance charge for the space. |  |
| `commonAreaMaintenanceState` | integer (RecordStateType) | Indicates whether common area maintenance exists, does not exist, or is unknown for the space. | 0 = Unknown, 1 = Yes, 2 = No |
| `propertyTaxAmount` | decimal (nullable) | Property-tax amount attributed to the space. |  |
| `propertyTaxAmountPerYear` | decimal (nullable) | Annualized property-tax amount attributed to the space. |  |
| `propertyTaxState` | integer (RecordStateType) | For property-tax applicability on the space. | 0 = Unknown, 1 = Yes, 2 = No |
| `rentPlus` | decimal (nullable) | Additional rent add-on amount on top of base rent (e.g. taxes/maintenance/insurance, TMI), increasing the tenant's effective cost. |  |
| `notes` | list of CommercialListingSummaryNotes objects (nullable) | Collection of internal/research notes attached to the space record. Notes on the space. |  |
| `isInventoryOffMarket` | true/false (nullable) | Date the space was taken off the market; the last day on the market is exclusive of this value (the space was not on the market on the entered date). Set when a space is renovated, withheld, or used to pressure an existing tenant to renew. Caution: removing a space can drastically affect the SpaceAvailableGroup. NULL while the space is still on the market. Only for non-exclusive (open) mandates: true when the underlying inventory space has an off-market date, false when it has none; null if the inventory space cannot be found. Always null for other mandates. |  |

### CommercialListingSummaryForLeaseLoadBay

Found at: `forLeaseSummary.spaces[].loadBay`

| Field | Type | Description | Values |
|---|---|---|---|
| `driveInBayState` | integer (RecordStateType) | Indicating presence/availability of drive-in bays (grade-level doors) for the space. | 0 = Unknown, 1 = Yes, 2 = No |
| `loadingDockState` | integer (RecordStateType) | Indicating presence/availability of loading docks for the leasable space; a key industrial logistics attribute. | 0 = Unknown, 1 = Yes, 2 = No |
| `numDriveInBays` | integer (nullable) | Count of drive-in bays (grade-level doors vehicles enter directly) serving the leasable space; a key industrial/flex access attribute. |  |
| `numExternalLoadingDocks` | integer (nullable) | Count of exterior loading docks serving the leasable space; core industrial loading capacity. |  |
| `numInternalLoadingDocks` | integer (nullable) | Count of interior loading docks serving the leasable space. |  |

### CommercialListingSummaryNotes

Found at: `forLeaseSummary.spaces[].notes[]`, `forLeaseSummary.properties[].notes[]`, `forSaleSummary.units[].notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `noteType` | integer (NoteType) | A pre-defined categorization of note text, typically referred to as 'Notes' in CRM Enterprise. | see `NoteType` in Allowed values |
| `value` | text (nullable) | The body (free-text content) of the note. |  |

### CommercialListingSummaryForLeaseProperty

Found at: `forLeaseSummary.properties[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of the commercial property; the asset is the anchor of all CRE data, and this is the join key for everything attached to it. Also the translation key. |  |
| `propertyType` | integer (PropertyType) | Primary CRE asset class (Office, Industrial, Flex, Retail, Multifamily, Hospitality, Land, etc.); drives the type-specific attribute set and the analytic property-type slices used for vacancy/rent/absorption aggregation. | see `PropertyType` in Allowed values |
| `constructionStatus` | integer (ConstructionStatus) | Lifecycle status of the building (Proposed, Under Construction, Under Renovation, Existing, Abandoned, Demolished); non-existing statuses are excluded from existing inventory, vacancy, and absorption until actual delivery/move-in. | 0 = Unknown, 1 = Existing, 2 = Demolished, 3 = Proposed, 4 = UnderConstruction, 5 = UnderRenovation, 6 = Converted, 8 = Deferred, 9 = Abandoned, 10 = FinalPlanning, 11 = UnderRedevelopment, 12 = Redeveloped |
| `address` | CommercialListingSummaryAddress object (nullable) | Identifier of the property's primary address record; join on the integer ID to resolve geography. The property's primary address record; null when it has none. |  |
| `buildingName` | text (nullable) | Proper name of the building used in marketing and identification. |  |
| `buildingSizeSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Rentable building area in square feet, or gross building area in square feet when rentable area is missing. |  |
| `primaryPhoto` | CommercialListingSummaryAttachmentReference object (nullable) | Collection of media attachment references (photos, floor plans, documents) for the property used on marketing surfaces. The property's default property image. |  |
| `maxContiguousSquareFeet` | decimal (nullable) | Square footage the owner/listing agent advertises for the space. The advertised figure may differ from actual square footage, since it can be rounded to the nearest 10, 100, 1000 sf, etc. Largest contiguous square feet among this property's spaces in the listing (see the space-level value); null when the property has no spaces. |  |
| `totalAvailableSquareFeet` | decimal (nullable) | Square footage the owner/listing agent advertises for the space. The advertised figure may differ from actual square footage, since it can be rounded to the nearest 10, 100, 1000 sf, etc. Sum of the maximum square feet of this property's spaces. Spaces in a contiguous block count only if they are not off-market, but a stand-alone space with no block key counts even when it is off-market; 0 when the property has no spaces. |  |
| `notes` | list of CommercialListingSummaryNotes objects (nullable) | Collection of internal notes/annotations attached to the property record; translatable, may hold research commentary. Notes on the property. |  |

### CommercialListingSummaryForLeaseLandForLease

Found at: `forLeaseSummary.lands[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Identifier for an instance in which a piece of land was offered on the open market for lease. |  |
| `propertyId` | integer | Foreign key to the parent land property being offered for lease. |  |
| `isOutparcelPad` | true/false | Indicates whether the land is an outparcel pad. 1 = True, 0 = False; defaults to 0. |  |
| `leaseTermLow` | decimal (nullable) | Minimum amount of time the land can be leased. If set, leaseTermType must give the unit (Days, Months, or Years) and leaseTermHigh must be set and greater than or equal to this value. Mutually exclusive of leaseTermThru and the month-to-month flag. |  |
| `leaseTermHigh` | decimal (nullable) | Maximum amount of time the land can be leased. If set, leaseTermType must give the unit (Days, Months, or Years) and leaseTermLow must be set and less than or equal to this value. Mutually exclusive of leaseTermThru and the month-to-month flag. |  |
| `leaseTermType` | integer (LeaseTermType) | Represents the unit of time in which the land can be leased (e.g. Days, Months, Years), qualifying leaseTermLow and leaseTermHigh. | 0 = Unknown, 1 = Years, 2 = Months, 3 = Days, 4 = ToBeDetermined, 5 = Negotiable, 6 = ThreeOrSixOrNine, 7 = ShortTerm |
| `notes` | list of CommercialListingSummaryNotes2 objects (nullable) | Collection of internal notes attached to the land-for-lease record. Notes on the land-for-lease record. |  |

### CommercialListingSummaryNotes2

Found at: `forLeaseSummary.lands[].notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `noteType` | integer (NoteType) | A pre-defined categorization of note text, typically referred to as 'Notes' in CRM Enterprise. | see `NoteType` in Allowed values |
| `originTag` | OriginTag object (nullable) | Language and version tag copied from the note. |  |
| `value` | text (nullable) | The body (free-text content) of the note. |  |

### CommercialListingSummaryForSale

Found at: `forSaleSummary`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer (nullable) | Identifier of the for-sale offering associated with this listing when it is marketed for sale; a listing may be for lease and/or for sale. |  |
| `assetCount` | integer (nullable) | Number of properties included in the offering; greater than one for portfolio or multi-property sale listings. |  |
| `saleStatus` | integer (SaleStatus) | Status of the sale side of the listing (e.g. available, under contract, sold); the marketing/transaction state of the for-sale offering. | 0 = Unknown, 1 = Active, 2 = Escrow, 3 = Pending, 4 = UnderContract, 5 = Sold, 6 = Withdrawn, 7 = Leased, 12 = Rubbish, 13 = Occupied, 14 = Cancelled, 15 = NotSold |
| `askingPriceHigh` | integer (nullable) | Highest asking sale price for the for-sale listing; asking flavor, qualify against actual sale comps. |  |
| `askingPriceLow` | integer (nullable) | Lowest asking sale price for the for-sale listing; an asking figure, not a sold/transacted price, so flag confidence when comparing to comps. |  |
| `capitalizationRate` | decimal (nullable) | Cap rate for the for-sale offering: Net Operating Income divided by the property's price/value; lower implies higher price relative to income. In UK/France this same field is labelled 'Yield' (yield divides by price plus acquisition costs). Flag whether actual or proforma. |  |
| `netOperatingIncome` | decimal (nullable) | Net Operating Income of the property: Effective Gross Income (income less vacancy/collection loss) minus total operating expenses; the core income input for cap-rate valuation. Flag actual vs proforma/underwritten. |  |
| `condoUnitId` | integer (nullable) | Identifier of the specific condo unit being offered when the listing is a condo-unit for-sale offering. |  |
| `unitNumber` | text (nullable) | Unit/suite number label of the specific space or condo unit being marketed within the building. |  |
| `unitSquareFeet` | decimal (nullable) | Rentable area of the specific unit/space being listed in square feet; use RBA for lease economics. |  |
| `propertyFloorId` | integer (nullable) | Identifier of the building floor the listed space occupies, tying availability to a specific level. |  |
| `spaceUse` | integer (SpaceUse) | Allowed/intended use of the listed space, refining what business or function the space supports. | 0 = Unknown, 1 = Office, 2 = OfficeMedical, 3 = OfficeRetail, 4 = Medical, 5 = Retail, 6 = Flex, 7 = Industrial |
| `propertyResidentialId` | integer (nullable) | Identifier of the residential property record when the listed asset is a residential (e.g. resimercial/multifamily) property. |  |
| `propertyResidentialType` | integer (PropertyResidentialType) (nullable) | Residential-property classification of the subject when residential, distinguishing the residential asset subtype. Residential property type from the listing summary; null when it is Unknown. | 0 = Unknown, 1 = ApartmentCommunity, 2 = ApartmentUnitForRent, 3 = SingleFamilyHome, 4 = RoomForRent, 5 = Townhome, 6 = CondoUnitForRent, 7 = DuplexTriplexQuadplex, 8 = MobileHome |
| `totalAvailableSquareFeet` | decimal (nullable) | Total square footage marketed as available across the listing — space being marketed for lease/sale regardless of whether it is vacant, occupied, sublet, or available at a future date. Distinct from vacant SF; do not feed into a vacancy numerator. |  |
| `saleType` | integer (SaleType) | Sale type (Investment vs Owner/User), which drives which fields matter to the buyer (income/leases vs allowed use/operating cost) and how % Leased is computed for a for-sale-only listing. | 0 = Unknown, 1 = Investment, 2 = OwnerUser, 3 = InvestmentOrOwnerUser |
| `availableOnDate` | date-time (nullable) | Date the space becomes available for occupancy; may be future-dated, since available space includes future-available. |  |
| `availabilityType` | integer (AvailabilityType) | Space provenance of the offered space: Direct includes relet and new space, Sublet includes sublet and assignment space (product 'Direct' maps to Relet). Drives leasing-activity and direct-vs-sublet rent rollups. | 0 = Unknown, 1 = ThirtyDays, 2 = SixtyDays, 3 = NinetyDays, 4 = OneHundredTwentyDays, 5 = ToBeDetermined, 6 = Arranged, 7 = Negotiable |
| `squareFeetNewOwnerCanOccupy` | decimal (nullable) | Square footage a new owner could occupy themselves; relevant to owner/user sales weighing self-occupancy versus leased income. |  |
| `lots` | list of CommercialListingSummaryForSaleLot objects | Collection of land/parcel lots included in the offering; lot asking prices drive the derived askingPriceLow/High and define what land is being sold. Lots only for Land For Sale listings (empty for every other type). For non-exclusive (open) mandates they come from the listing's marketing for-sale records, otherwise from the inventory for-sale records. Sorted by lot id. |  |
| `units` | list of CommercialListingSummaryForSaleCondoUnit objects | Condo units only for Consolidated Condo For Sale and Disconnected Condo For Sale listings (empty for every other type, including single Condo For Sale). One entry per condo unit on the listing's for-sale records; units whose record cannot be found are dropped. Sorted by condo unit id. |  |
| `portfolioType` | integer (PortfolioType) | Code classifying the portfolio nature of a multi-property offering; drives whether per-property prices are allocated estimates. | 0 = Individual, 1 = MultipleProperty, 2 = BulkPortfolio, 3 = PartOfMultipleProperty, 4 = PartOfBulkPortfolio, 5 = MultipleCondo |
| `portfolioName` | text (nullable) | Marketing name of the portfolio when multiple properties are offered together as a named bundle. |  |
| `minDateOnMarket` | date-time (nullable) | The date a ForSale item (Property, Land, or CondoUnit) goes on the market. Anchors marketing duration and on-market status. Earliest on-market date across the listing's for-sale records; null when none has a date. |  |
| `isInventoryOffMarket` | true/false (nullable) | The date a ForSale item (Property, Land, or CondoUnit) is taken off the market, either through a sale or owner withdrawal. Presence flips the listing to an off-market status. Only set for non-exclusive (open) Land For Sale and Property For Sale listings: true when the first inventory for-sale record has an off-market date, otherwise null (never false). |  |

### CommercialListingSummaryForSaleLot

Found at: `forSaleSummary.lots[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of the for-sale lot record (a parcel of land or subdivision lot offered for sale); also serves as the translation key for the lot's translatable fields. |  |
| `lotNumber` | text (nullable) | The lot's identifying number/label within a subdivision or development, used to reference the specific parcel being offered for sale. Lot number with surrounding spaces trimmed. |  |
| `lotDescription` | text (nullable) | Free-text marketing description of the for-sale lot and its features; translatable. |  |
| `lotSize` | decimal (nullable) | Measurement of the lot's size (e.g. acreage or square footage); a primary land attribute driving value and permitted use. Numeric value of the lot's size measurement; null when the lot has no size. |  |
| `lotSizeMeasurementType` | integer (MeasurementUnit2) (nullable) | Measurement of the lot's size (e.g. acreage or square footage); a primary land attribute driving value and permitted use. Unit of the lot's size measurement; null when the lot has no size. | 0 = Unknown, 1 = SquareFeet, 2 = Acres, 3 = SquareMeters |
| `askingPrice` | integer (nullable) | The asking sale price for the lot; the lessor/seller's quoted price for the land parcel. |  |
| `parcelNumbers` | list of text values | Collection of parcel references (county + assessor's parcel number) identifying the legal land parcels comprising this for-sale lot, tying it to public tax/ownership records. Parcel numbers recorded on the lot, with empty entries dropped. |  |

### CommercialListingSummaryForSaleCondoUnit

Found at: `forSaleSummary.units[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `condoUnitId` | integer | Id of the condo unit offered for sale. |  |
| `unitNumber` | text (nullable) | The condo unit number. Data size should match Suite/unitNumber across SpaceForLease, SpaceOccupied, and CondoUnit. |  |
| `unitSquareFeet` | decimal (nullable) | Size of the condo unit in square feet. For CRE area measures, RBA (rentable building area) is the leasing/revenue basis; square-feet values are integers in product. May be derived from the per-floor breakdown when Floors is populated. |  |
| `spaceUse` | integer (SpaceUse) | Code classifying the unit's space use (office, retail, industrial, etc.); space-use gates which detail fields apply and drives analytic property-type slicing. | 0 = Unknown, 1 = Office, 2 = OfficeMedical, 3 = OfficeRetail, 4 = Medical, 5 = Retail, 6 = Flex, 7 = Industrial |
| `floorName` | integer (FloorName) | Same floor-name rule as for lease spaces: the property floor record's name, or the unit's own floor name when it has no floor id or its floor record is an Unknown floor. | see `FloorName` in Allowed values |
| `forSaleId` | integer (nullable) | Artificial primary key of the for-sale offering record, generated via IDENTITY. Identifies the sale terms under a commercial listing. Id of the for-sale record used to price the unit: the marketing for-sale record for non-exclusive (open) mandates, otherwise the inventory record; null if not found. |  |
| `askingPriceLow` | integer (nullable) | Lower range of the sale price requested by the seller; most pertinent to portfolio sales. (Model-managed; in CRE usage maintained from lot-level prices when present.) Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `askingPriceHigh` | integer (nullable) | Upper range of the sale price requested by the seller; most pertinent to portfolio sales. (Model-managed; in CRE usage derived from lot asking prices when lots are priced.) Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `capitalizationRate` | decimal (nullable) | Capitalization rate — net operating income divided by current market value, expressed as a percent; a measure of risk and yield where lower cap rates signal lower risk/higher value. In UK/France this field carries Yield (NOI inclusive of acquisition costs) under a relabeled display. Nullable; not all properties have one, especially Land. Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `netOperatingIncome` | decimal (nullable) | Net Operating Income (Effective Gross Income minus operating expenses and taxes) attributed to the property; the income basis for the cap rate (NOI / value) and a core investment-sale underwriting input. Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `saleStatus` | integer (SaleStatus) | Market status of the offering (Active, Escrow, Pending, UnderContract, Sold); on-market statuses are mutually exclusive with an off-market date. Sale status from the for-sale record chosen to price the unit; Unknown when no record is found. | 0 = Unknown, 1 = Active, 2 = Escrow, 3 = Pending, 4 = UnderContract, 5 = Sold, 6 = Withdrawn, 7 = Leased, 12 = Rubbish, 13 = Occupied, 14 = Cancelled, 15 = NotSold |
| `address` | CommercialListingSummaryAddress object (nullable) | If NULL, the condo's address is the PRIMARY address of the associated property. The unit's own address record; null when it has none. |  |
| `isInventoryOffMarket` | true/false (nullable) | The date a ForSale item (Property, Land, or CondoUnit) is taken off the market, either through a sale or owner withdrawal. Presence flips the listing to an off-market status. True when the inventory for-sale record has an off-market date, false when it has none; null if the inventory record cannot be found. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Identifier of the currency for the offering's monetary values; must be normalized (per the platform's currency-conversion rules) before aggregating prices across offerings. Currency of the for-sale record chosen to price the unit. | see `MonetaryUnit` in Allowed values |
| `brokerOpinionOfValueLow` | integer (nullable) | Lower bound of the broker's opinion of value (BOV) for the property — an estimated (not transacted) valuation distinct from cap-rate-derived value. Model-managed, internal setter. Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `brokerOpinionOfValueHigh` | integer (nullable) | Upper bound of the broker's opinion of value (BOV) for the property — an estimated (not transacted) valuation. Model-managed, internal setter. Taken from the for-sale record chosen to price the unit (marketing record for non-exclusive mandates, otherwise inventory); null when no record is found. |  |
| `notes` | list of CommercialListingSummaryNotes objects (nullable) | Collection of internal notes/annotations attached to the condo unit record. Notes on the condo unit. |  |
| `floors` | list of CommercialListingSummaryForSaleCondoUnitFloor objects (nullable) | Collection of per-floor breakdown records for the condo unit when it spans multiple floors; each carries its own square footage and space use. Floors the condo unit spans, one entry each. |  |

### CommercialListingSummaryForSaleCondoUnitFloor

Found at: `forSaleSummary.units[].floors[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `propertyFloorId` | integer (nullable) | Identifier of the property floor this condo unit occupies; joins to the floor record. |  |
| `unitSquareFeet` | decimal (nullable) | Floor area of the condo unit on this floor in square feet. |  |
| `spaceUse` | integer (SpaceUse) | Code classifying how the unit's space on this floor is used (e.g. office, retail, residential). | 0 = Unknown, 1 = Office, 2 = OfficeMedical, 3 = OfficeRetail, 4 = Medical, 5 = Retail, 6 = Flex, 7 = Industrial |
| `floorName` | integer (FloorName) | A number representing a standardized floor name. | see `FloorName` in Allowed values |

### CommercialListingSummaryPropertyContact

Found at: `propertyContacts[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Artificial primary key for the property-contact record, generated via IDENTITY. |  |
| `contactId` | integer (nullable) | Id of the person in CoStar contact data. |  |
| `locationId` | integer (nullable) | Id of the office location (company branch) in CoStar contact data. |  |
| `firstName` | text (nullable) | Contact's given (first) name; core personal identity field for a CRE individual such as a broker or agent. |  |
| `lastName` | text (nullable) | Contact's family (last) name; core personal identity field. |  |
| `locationName` | text (nullable) | Firm name used at this location. Should always be populated, even when identical to the company name. |  |
| `emailAddress` | text (nullable) | Contact's primary email address; a key communication and lead-delivery channel for brokers and agents. |  |
| `phoneNumber` | text (nullable) | Contact's primary office/business phone number, a main channel for reaching a broker or agent. |  |
| `phoneNumberCountryCode` | text (nullable) | ISO/country dialing code for the primary phone number, supporting international formatting. |  |
| `phoneExt` | text (nullable) | Telephone extension dialed after the primary phone number to reach the contact directly. |  |
| `contactRole` | integer (ContactRole) | Role of the person or company on this record, such as listing broker, buyer or seller. | see `ContactRole` in Allowed values |

## Allowed values

### ListingType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | ApartmentCommunity |
| 2 | ApartmentUnitForRent |
| 3 | SingleFamilyHome |
| 4 | RoomForRent (also ResidentialCommunity) |
| 5 | Townhome |
| 6 | ApartmentCondo |
| 7 | ResidentialCondo |
| 8 | Hotel |
| 9 | PropertyForSale |
| 10 | ResidentialPropertyForSale |
| 11 | CondoForSale |
| 12 | LandForSale |
| 13 | CommercialPortfolioForSale |
| 14 | PropertyDirectSpaceForLease |
| 15 | ConsolidatedCondoForSaleListing |
| 16 | BuildingParkDirectSpaceLease |
| 17 | ShoppingCenterDirectSpaceForLease |
| 18 | LandDirectForLease |
| 19 | CommercialSublease |
| 20 | CommercialLeaseAssignment |
| 21 | PropertyCoworking |
| 22 | PropertyForAuction |
| 23 | LandForAuction |
| 24 | CondoForAuction |
| 25 | LoanForAuction |
| 26 | CommercialPortfolioForAuction |
| 27 | DisconnectedForSale |
| 28 | DisconnectedSpaceForLease |
| 29 | DisconnectedCondoForSale |
| 50 | ProductionCollection |
| 51 | MultifamilyCollection |
| 52 | CustomHomeCollection |
| 53 | BuilderFloorPlan |
| 54 | CustomHomeLotForSale |
| 55 | ReadyMoveInPropertyForSale |
| 56 | ReadyMoveInApartmentForSale |

### ListingStatus

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Active |
| 2 | Pending |
| 3 | OffMarket |
| 4 | Terminate |
| 5 | SubscriptionHold |
| 6 | Unpublished |
| 7 | AwaitingVerification |
| 8 | UserDeleted |
| 9 | Upsell |
| 10 | Confidential |
| 11 | Introduction |
| 12 | Migrated |
| 13 | Draft |

### PropertyType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Hospitality |
| 2 | Industrial |
| 3 | Land |
| 5 | Office |
| 6 | GeneralRetail |
| 7 | Flex |
| 8 | SportsAndEntertainment |
| 9 | MixedUse |
| 10 | Specialty |
| 11 | Multifamily |
| 13 | Healthcare |
| 14 | PropertyTypeUnknown |
| 15 | Residential |
| 16 | Homes |

### AttachmentSource

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Conversion |
| 2 | FieldResearch |
| 3 | Broker |
| 4 | Owner |
| 5 | PropertyManager |
| 6 | Other |
| 7 | DataTree |
| 8 | PublicRecord |
| 9 | LoopNet |
| 10 | ApartmentsFieldResearch |
| 11 | ApartmentsFeed |
| 12 | RentalHomesPlus |
| 13 | InboundPropertyPlatform |
| 14 | ListHub |
| 15 | ApartmentsUser |
| 16 | Matterport |
| 17 | Waypoint |
| 18 | ApartmentFinderUser |
| 19 | ExtendedStayAmerica |
| 20 | UserEntered |
| 21 | LoopNetFeed |
| 22 | WestsideRentals |
| 23 | ForRent |
| 24 | Emporis |
| 25 | CaseManagement |
| 26 | Foursquare |
| 27 | Demandbase |
| 28 | BuilderFeed |

### AttachmentType3

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
| 40 | Video (also ProVideoApartments) |
| 41 | CityPhoto |
| 42 | NeighborhoodPhoto |
| 43 | Matterport3DScan |
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
| 63 | ProfileCoverDesktopResidential (also CoverPhoto, ProfileCoverDesktop) |
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
| 89 | PropertyGuideVideo (also CondoBuildingVideo) |
| 90 | CondoBuildingVideoClip (also PropertyGuideVideoClip) |
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
| 113 | CommunityProjectImage (also CommunityProjectPhoto, CommunityCollectionPhoto) |
| 114 | FieldLeadSignPhoto |
| 115 | CommunityImage (also CommunityPhoto) |
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
| 127 | GaussianFlyover (also MatterportExterior) |
| 128 | GaussianFlyoverRaw |
| 129 | CommunityVideo |
| 130 | CommunityVideoClip |
| 131 | MatterportCommunity |
| 132 | ExteriorPhoto |

### AttachmentTypeExtension2

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Bmp |
| 2 | Csv |
| 3 | Doc |
| 4 | Gif |
| 5 | Htm |
| 6 | Jpg |
| 7 | Msg |
| 8 | Pdf |
| 9 | Png |
| 10 | Rtf |
| 11 | Tif |
| 12 | Txt |
| 13 | Xls |
| 15 | Ppt |
| 16 | Arg |
| 17 | Ipx |
| 18 | Mov |
| 19 | Bak |
| 20 | Bat |
| 21 | Cal |
| 22 | Cri |
| 23 | Dat |
| 24 | Dbf |
| 25 | Dbt |
| 26 | Eps |
| 27 | Eqy |
| 28 | Err |
| 29 | Exe |
| 30 | Fxp |
| 31 | Htt |
| 32 | Iax |
| 33 | Idx |
| 34 | Ind |
| 35 | Isx |
| 36 | Jbf |
| 37 | Ldb |
| 38 | Lnk |
| 39 | Log |
| 40 | Map |
| 41 | Mdb |
| 42 | Mid |
| 43 | Mif |
| 44 | Ntx |
| 45 | Psd |
| 46 | Sav |
| 47 | Tab |
| 48 | Td4 |
| 49 | Tdo |
| 50 | Wor |
| 51 | Docx |
| 52 | Svg |
| 53 | Mp4 |
| 54 | Mp3 |
| 55 | Wav |
| 56 | Xlsx |
| 57 | Pptx |
| 58 | Prprod |
| 59 | Prproj |
| 60 | Aep |
| 61 | Xlsm |
| 62 | Eml |
| 63 | FCPT |
| 64 | DRP |
| 65 | Xml |
| 66 | Aif |
| 67 | Fcpxmld |
| 68 | Kml |
| 69 | Heic |
| 70 | Heif |
| 71 | Zip |
| 72 | Splat |
| 73 | Ply |

### ExternalReferenceType3

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

### NoteType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | PropertyInternal |
| 2 | PropertyExternal |
| 3 | SaleExternal |
| 4 | CommissionNote |
| 5 | TenantExternal |
| 6 | TenantInternal |
| 7 | TenantTransactionInternal |
| 8 | SpaceNote |
| 9 | SpaceVacantInternal |
| 10 | SupplementalExternal |
| 14 | LocationInternal |
| 15 | LocationExternal |
| 16 | LocationBilling |
| 25 | CompExternal |
| 26 | CompInternal |
| 27 | CompSeller |
| 28 | CompBuyer |
| 29 | CompManager |
| 30 | PropertyGroupExternal |
| 31 | PropertyGroupInternal |
| 32 | LeaseDealInternal |
| 33 | LeaseDealExternal |
| 34 | LandLease |
| 35 | LandLeaseCommission |
| 36 | CompEntityInternal |
| 37 | CompEntityExternal |
| 38 | PropertyLoan |
| 39 | PropertyResidentialExternal |
| 40 | ListingExternal |
| 41 | AptsSalesForceNote |
| 42 | WhyYouLoveUs |
| 43 | CheckInCheckOutPolicy |
| 44 | PaymentPolicy |
| 45 | AdvancedPaymentPolicy |
| 46 | CancellationPolicy |
| 47 | ListingLocationDescription |
| 48 | ContactExternal |
| 49 | ContactInternal |
| 50 | ListingExternalGenerated |
| 51 | DrivingDirections |
| 52 | StudentHousingDescription |
| 53 | RenterQualification |
| 54 | MarketingStakeholderOne |
| 55 | MarketingStakeholderTwo |
| 56 | SpaceManager |
| 57 | ApartmentUnitMarketing |
| 58 | CmbsLoanCommentary |
| 59 | CmbsLoanModification |
| 60 | CmbsLoanDelinquency |
| 61 | CmbsLoanRealEstateOwned |
| 62 | CmbsLoanWatchlist |
| 63 | AuctionDashboardComments |
| 64 | AuctionReportInternal |
| 66 | NeighborhoodInternal |
| 67 | ParkInternal |
| 68 | SchoolInternal |
| 69 | RetailBrandInternal |
| 70 | RetailBrandExternal |
| 71 | AuctionMarketingInternal |
| 72 | RetailBrandRequirement |
| 73 | ConstructionProjectInternal |
| 74 | FundInternal |
| 75 | CommunityProjectExternal |
| 76 | WhyLiveHere |

### ContactRole

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Developer (also DeveloperConstruction) |
| 2 | Architect |
| 3 | RecordedOwner |
| 4 | PropertyManager |
| 6 | PrimaryLeasingCompany |
| 7 | TrueOwner |
| 8 | SignAgent |
| 9 | AssetManager |
| 10 | BuyerBroker |
| 11 | ListingBroker |
| 15 | TenantRep |
| 17 | DecisionMakerLeasing (also DecisionMaker) |
| 18 | DecisionInfluencer (also DecisionInfluencerLeasing) |
| 20 | LeasingCompany |
| 26 | Principal |
| 27 | SurveyContact |
| 28 | CenterMailContact |
| 29 | CenterManager |
| 30 | AssistantAssociateCenterManager |
| 31 | MarketingDirectorManager |
| 32 | SpecialtyLeasingManager |
| 33 | BuildingSuperintendent |
| 34 | SecuritySupervisor |
| 35 | AdvertisingManager |
| 36 | SpecialEventsManager |
| 37 | PromotionDirectorManager |
| 38 | Other |
| 39 | RecordedSeller |
| 40 | TrueSeller |
| 41 | Attorney |
| 42 | RecordedBuyer |
| 43 | TrueBuyer |
| 44 | BuyerContact |
| 45 | SellerContact |
| 46 | ListingAgent |
| 47 | LeasingAgent |
| 48 | TenantContact |
| 49 | Preparer |
| 50 | ListingAdministrator |
| 51 | SurveillanceOperator |
| 52 | OwnerListingContact (also OwnerLeasingContact) |
| 53 | WSRListingAdministrator |
| 54 | SocialAdminSetupContact |
| 55 | OwnerListingAdministrator |
| 56 | OwnerPermissionAdministrator |
| 57 | ListingPermissionAdministrator |
| 58 | HotelMembershipCompany |
| 59 | AcquisitionsDispositions |
| 60 | Development |
| 61 | AssetorPortfolioManagement |
| 62 | Leasing |
| 63 | Finance |
| 64 | InvestorRelations |
| 65 | Marketing |
| 66 | Research |
| 67 | HumanResourcesAndLegalAndInformationTechnologyAndOperations |
| 68 | DecisionMakerAcquisitions |
| 69 | DecisionInfluencerAcquisitions |
| 70 | DecisionMakerProductPurchase |
| 71 | DecisionInfluencerProductPurchase |
| 72 | Servicer |
| 73 | Borrower |
| 74 | SpecialServicer |
| 75 | Originator |
| 76 | Sponsor |
| 77 | HotelOperator |
| 78 | Auctioneer |
| 79 | AuctionContact (also AuctionManager) |
| 80 | GeneralContractor |
| 81 | TitleCompany |
| 82 | EscrowCompany |
| 83 | AuctionAssetManager |
| 84 | ReportVendor |
| 85 | FundManager |
| 86 | LawFirm |
| 87 | Auditor |
| 88 | FundPlacementAgent |
| 89 | FundAdministrator |
| 90 | Investor |
| 91 | MediaSchedulingContact |
| 92 | BrokerInStateLicensee |
| 93 | TerritoryManager |
| 94 | Freeholder |
| 95 | ListingLeadRecipient |
| 96 | SiteListingAdministrator |
| 97 | BrandedProperty |
| 98 | SalesAgent |
| 99 | BuilderAdmin |
| 100 | SiteListingAdministratorCommunities |
| 101 | CompanyListingAdministratorCommunities |
| 102 | ListingPermissionAdministratorCommunities |
| 103 | MortgageBroker |
| 1000 | SubletContact |
| 1001 | PreviousTrueOwner |
| 1002 | PreviousRecordedOwner |
| 1003 | ExecutiveLeadershipPrincipal (also Executive) |
| 1004 | LeaseCompsAdministrator |
| 1005 | FeedContact |

### ServiceType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | PlusCleaning |
| 2 | PlusElectricAndCleaning |
| 4 | PlusElectric |
| 5 | UtilitiesAndChar (also PlusUtilitiesAndCleaning) |
| 6 | PlusUtilities (also PlusAllUtilities) |
| 7 | FullService (also FullServiceGross) |
| 8 | IndustrialGross |
| 9 | ModifiedGross |
| 10 | Net (also SingleNet) |
| 11 | Negotiable |
| 12 | DoubleNet |
| 13 | TripleNet |
| 14 | ToBeDetermined |
| 15 | TenantElectric (also PlusTenantElectric) |
| 16 | FullyRepairingAndInsuring |
| 17 | InternalRepairingOnly |
| 18 | InternalRepairingAndInsuring |
| 19 | FullServiceGrossNoPass |
| 20 | ChargesAndTaxesExcluded |
| 21 | PlusTaxes (also ChargesIncludedTaxesExcluded) |
| 22 | ChargesAndTaxesIncluded |
| 23 | PlusCharges (also ChargesExcludedTaxesIncluded) |

### FloorName

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | UnknownFloor |
| 2 | MechanicalLevelThree |
| 3 | MechanicalLevelTwo |
| 4 | MechanicalLevelOne |
| 5 | ParkingLevelTen |
| 6 | ParkingLevelNine |
| 7 | ParkingLevelEight |
| 8 | ParkingLevelSeven |
| 9 | ParkingLevelSix |
| 10 | ParkingLevelFive |
| 11 | ParkingLevelFour |
| 12 | ParkingLevelThree |
| 13 | ParkingLevelTwo |
| 14 | ParkingLevelOne |
| 15 | Terrace |
| 16 | Subway |
| 17 | Metro |
| 18 | LowerLevel |
| 19 | Concourse |
| 20 | Basement |
| 21 | Plaza |
| 22 | Lobby |
| 23 | Ground |
| 24 | FirstFloor |
| 25 | SecondFloor |
| 26 | Mezzanine |
| 27 | ThirdFloor |
| 28 | FourthFloor |
| 29 | FifthFloor |
| 30 | SixthFloor |
| 31 | SeventhFloor |
| 32 | EighthFloor |
| 33 | NinthFloor |
| 34 | TenthFloor |
| 35 | EleventhFloor |
| 36 | TwelfthFloor |
| 37 | ThirteenthFloor |
| 38 | FourteenthFloor |
| 39 | FifteenthFloor |
| 40 | SixteenthFloor |
| 41 | SeventeenthFloor |
| 42 | EighteenthFloor |
| 43 | NineteenthFloor |
| 44 | TwentiethFloor |
| 45 | TwentyFirstFloor |
| 46 | TwentySecondFloor |
| 47 | TwentyThirdFloor |
| 48 | TwentyFourthFloor |
| 49 | TwentyFifthFloor |
| 50 | TwentySixthFloor |
| 51 | TwentySeventhFloor |
| 52 | TwentyEighthFloor |
| 53 | TwentyNinthFloor |
| 54 | ThirtiethFloor |
| 55 | ThirtyFirstFloor |
| 56 | ThirtySecondFloor |
| 57 | ThirtyThirdFloor |
| 58 | ThirtyFourthFloor |
| 59 | ThirtyFifthFloor |
| 60 | ThirtySixthFloor |
| 61 | ThirtySeventhFloor |
| 62 | ThirtyEighthFloor |
| 63 | ThirtyNinthFloor |
| 64 | FortiethFloor |
| 65 | FortyFirstFloor |
| 66 | FortySecondFloor |
| 67 | FortyThirdFloor |
| 68 | FortyFourthFloor |
| 69 | FortyFifthFloor |
| 70 | FortySixthFloor |
| 71 | FortySeventhFloor |
| 72 | FortyEighthFloor |
| 73 | FortyNinthFloor |
| 74 | FiftiethFloor |
| 75 | FiftyFirstFloor |
| 76 | FiftySecondFloor |
| 77 | FiftyThirdFloor |
| 78 | FiftyFourthFloor |
| 79 | FiftyFifthFloor |
| 80 | FiftySixthFloor |
| 81 | FiftySeventhFloor |
| 82 | FiftyEighthFloor |
| 83 | FiftyNinthFloor |
| 84 | SixtiethFloor |
| 85 | SixtyFirstFloor |
| 86 | SixtySecondFloor |
| 87 | SixtyThirdFloor |
| 88 | SixtyFourthFloor |
| 89 | SixtyFifthFloor |
| 90 | SixtySixthFloor |
| 91 | SixtySeventhFloor |
| 92 | SixtyEighthFloor |
| 93 | SixtyNinthFloor |
| 94 | SeventiethFloor |
| 95 | SeventyFirstFloor |
| 96 | SeventySecondFloor |
| 97 | SeventyThirdFloor |
| 98 | SeventyFourthFloor |
| 99 | SeventyFifthFloor |
| 100 | SeventySixthFloor |
| 101 | SeventySeventhFloor |
| 102 | SeventyEighthFloor |
| 103 | SeventyNinthFloor |
| 104 | EightiethFloor |
| 105 | EightyFirstFloor |
| 106 | EightySecondFloor |
| 107 | EightyThirdFloor |
| 108 | EightyFourthFloor |
| 109 | EightyFifthFloor |
| 110 | EightySixthFloor |
| 111 | EightySeventhFloor |
| 112 | EightyEighthFloor |
| 113 | EightyNinthFloor |
| 114 | NinetiethFloor |
| 115 | NinetyFirstFloor |
| 116 | NinetySecondFloor |
| 117 | NinetyThirdFloor |
| 118 | NinetyFourthFloor |
| 119 | NinetyFifthFloor |
| 120 | NinetySixthFloor |
| 121 | NinetySeventhFloor |
| 122 | NinetyEighthFloor |
| 123 | NinetyNinthFloor |
| 124 | OneHundredthFloor |
| 125 | OneHundredFirstFloor |
| 126 | OneHundredSecondFloor |
| 127 | OneHundredThirdFloor |
| 128 | OneHundredFourthFloor |
| 129 | OneHundredFifthFloor |
| 130 | OneHundredSixthFloor |
| 131 | OneHundredSeventhFloor |
| 132 | OneHundredEighthFloor |
| 133 | OneHundredNinthFloor |
| 134 | OneHundredTenthFloor |
| 135 | OneHundredEleventhFloor |
| 136 | OneHundredTwelfthFloor |
| 137 | OneHundredThirteenthFloor |
| 138 | OneHundredFourteenthFloor |
| 139 | OneHundredFifteenthFloor |
| 140 | OneHundredSixteenthFloor |
| 141 | OneHundredSeventeenthFloor |
| 142 | OneHundredEighteenthFloor |
| 143 | OneHundredNineteenthFloor |
| 144 | OneHundredTwentiethFloor |
| 145 | OneHundredTwentyFirstFloor |
| 146 | OneHundredTwentySecondFloor |
| 147 | OneHundredTwentyThirdFloor |
| 148 | OneHundredTwentyFourthFloor |
| 149 | OneHundredTwentyFifthFloor |
| 150 | Penthouse |
| 151 | PrincipalFloor |
| 152 | GroundGarden |

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
