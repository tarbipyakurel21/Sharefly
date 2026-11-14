# Commercial Property

A CommercialProperty record describes one building or property: where it is, what kind of property it is, how big it is, how it was built and renovated, and the attributes that are specific to its type (office, retail, industrial, flex, hotel, apartment, single residence, land). The key `id` is the PropertyId, the identifier that commercial listing, location occupancy and commercial sale comp records point to when they refer to a property.

## What this record is

A property is the physical asset that everything else in CoStar's commercial data hangs off. Space for lease, tenants and sold comps are all described in relation to a property; the property itself carries the facts about the building. CoStar builds this inventory by census, researching every property in a market rather than a sample, so counts over the data (for example offices in a city) are meaningful at scale. Each value is as of the last research touch, not real time.

- **Property type decides which block applies.** `propertyType` is the primary asset class (Office, Industrial, GeneralRetail, Flex, Hospitality, Multifamily, Land, Healthcare, MixedUse, Specialty, SportsAndEntertainment, Residential, Homes, plus Unknown values). The matching subtype block carries the attributes that only make sense for that type: `propertyOffice` for Office, `propertyRetail` for GeneralRetail, `propertyIndustrial` for Industrial, `propertyFlex` for Flex, `propertyHospitality` for Hospitality, `propertyApartment` for Multifamily, `propertySportsAndEntertainment` for SportsAndEntertainment, `propertyResidence` for Residential and Homes, and `land` for Land. A block is null when the property is of another type.
- **Subtype refines the type.** `propertySubtype` names the specific use, for example Industrial_Warehouse, GeneralRetail_Bank or MultiFamily_Apartments. Most values are prefixed with the type they belong to, but the prefix does not always match `propertyType`, so check both fields.
- **Two quality grades, not one.** `buildingClass` (A, B, C) is a market-relative and subjective grade, so a Class A building in one market is not equivalent to Class A in another. `buildingRating` is the CoStar Building Rating, a national 1 to 5 star grade against peers of the same property type (formerly called the Star Rating). Keep them separate.
- **RBA versus GBA.** `grossBuildingAreaSquareFeet` (GBA) measures the whole building to the outside of the exterior walls. `rentableBuildingAreaSquareFeet` (RBA) is the area available to tenants, so it excludes elevator shafts, stairs and other vertical penetrations, and it must not exceed GBA. RBA is the basis for leasing and vacancy; retail reports gross leasable area (GLA) in `propertyRetail.grossLeasableAreaSquareFeet` instead.
- **Lifecycle matters.** `constructionStatus` tells you whether a building stands today. Proposed, under-construction, under-renovation and demolished buildings are normally left out of inventory, vacancy and absorption counts, so filter on Existing when you want standing stock.
- **Groups and condos.** A property can belong to a property group (a shopping center, business park or campus) through `propertyGroupId`, and `isCondo` marks condominium ownership.

## Using this data

- **Filter to the right property type first.** Pick `propertyType` before reading any subtype block, and expect the other subtype blocks to be null. A null block means the property is of another type, or that no detail was recorded; it does not mean zero. For an Industrial property, `propertyOffice` and `propertyHospitality` are null by design. Healthcare, MixedUse, Specialty and Unknown properties have no subtype block. An Office, Retail, Industrial, Flex or Multifamily block can be present with mostly null values when no detail was recorded. `propertyResidence` and `propertyPropertyResidence` hold the same content.
- **RBA versus GBA.** Use `rentableBuildingAreaSquareFeet` for leasing and vacancy work and `grossBuildingAreaSquareFeet` when you need the whole envelope, for example for floor area ratio (GBA divided by lot size). Do not mix them in one ratio. Retail properties report gross leasable area in `propertyRetail.grossLeasableAreaSquareFeet`, so check which area field is filled before computing per-square-foot values. Several subtype blocks repeat the rentable area as `rentableBuildingAreaSquareFeet`.
- **Lot size needs its unit.** `lotSize` is only meaningful together with `lotSizeMeasurementType` (acres, square feet or square meters). Convert before comparing lots.
- **Multiple addresses.** `addresses[]` holds every address of the property, and `primaryAddress` is the one to use for the city, county, state and coordinates of a building. If you count properties by joining on `addresses[]`, a multi-address property is counted once per address. Latitude and longitude can be empty when an address was not geocoded.
- **Geography by id.** Group and join on `cityId`, `countyId`, `stateId`, `researchMarketId` and `submarketIds`, never on names. `primarySubmarketId` is the submarket CoStar assigns to the property for its own type; `submarketIds` on an address lists submarkets across property types, so do not treat it as a single value.
- **Condos and property groups.** `isCondo` marks condominium ownership, so a condo building can be one property here while its units are sold separately; sale comps then refer to units rather than to the building. `propertyGroupId` ties several properties to one shopping center, business park or campus; the group's name and member list are not in this record, but you can count how many properties share a `propertyGroupId`.
- **Class versus rating.** `buildingClass` and `buildingRating` answer different questions. Class is a local, relative grade; rating is a national grade by property type. `buildingClass` also has an F value whose definition is not documented here.
- **Yes/no flags.** `hasSprinklers`, `hasLoadingDocks`, `hasCranes` and the other `has…` flags are true for Yes, false for No and null when nothing is known. Null means unknown, not no.
- **Standing inventory.** Keep `constructionStatus` equal to Existing for counts of standing buildings, vacancy denominators and rent statistics. A building that was demolished or redeveloped may still have a record.
- **Dates of construction.** Years come from `constructionEvents[]`, where `year` can be approximate and `month` is often empty. A property can have several events (completion, renovation begun, renovation finished) and several `renovations[]` entries.
- **Currency.** Amounts in `parking[]` and `renovations[]` carry no currency field in this record. Hotel room rates and apartment parking and pet fees name their currency in `monetaryUnit`.
- **Contacts and media.** Contacts, notes, photos and Matterport attachments are included. Email addresses and phone numbers (for example on hotels and apartment communities, and in descriptions) are fake, the same fake for the same real value in every dataset.
- **Joining to listings.** A commercial listing summary's `propertyId` equals this record's `id`. Building-park and shopping-center lease listings also list each property they cover in `forLeaseSummary.properties[].id`, and each space for lease carries its own `propertyId`.
- **Photos.** `attachments` lists the property's published still images and Matterport scans: 140,677 on 3,337 properties, mostly building and interior photos, with aerials, floor plans, plat maps, site plans and 12,280 Matterport scans. `attachmentUri` on each published attachment, there and in `primaryPhoto`, links to the image on CoStar's CDN. Image links are at size 112 (up to 1,880 by 900 pixels). Replace the `/112/` segment with another size id for another size: 102 (984×658), 104 (180×140), 110 (984×588), 111 (1,240×844), 113 (1,400×720), 114 (1,024×1,024) or 116 (2,048×2,048). Apartment floor-plan and unit attachments in `propertyApartment` mostly have no link: 3,060 of 52,160 floor-plan attachments and 481 of 23,665 unit attachments carry an `attachmentUri`.
- **3D tours.** Matterport scans are in `attachments`, and apartment floor-plan and unit tours are in `propertyApartment.models[].attachments` and `.units[].attachments`. An attachment is a Matterport model when `videoExternalReferenceType` is 36 (MatterportScan) or 234 (MatterportStreamingKey), and `videoKey` is then its Matterport model id. Every other attachment is a still image, with `videoExternalReferenceType` 0, or 60 for a plan image made from a document. The model ids match the `MatterportModelId` rows of `commercial-properties.csv` for the same `PropertyId`.
- **Properties in this dataset.** The 3,339 properties on CoStar's Matterport list: 1,758 in the Houston research market (`researchMarketId` 14) and 1,581 in Los Angeles (20). `commercial-properties.csv` lists them with their Matterport model ids.

## Joining to other models

Join on integer ids, never on names.

- `id` is the PropertyId.
- `commercial-listing-summary`: `propertyId` equals this `id` for the listing's main property; `forLeaseSummary.properties[].id`, `forLeaseSummary.spaces[].propertyId` and `forLeaseSummary.lands[].propertyId` also hold PropertyIds.
- `propertyGroupId` matches `commercial-listing-summary` `propertyGroupId` for listings that market a whole property group.
- `id` with the `videoKey` of a Matterport attachment in `attachments`, `propertyApartment.models[].attachments` or `propertyApartment.models[].units[].attachments` joins to `PropertyId` and `MatterportModelId` in `commercial-properties.csv`. Matterport attachments are those with `videoExternalReferenceType` 36 or 234.
- `id` joins to `apartment-listing` `propertyId` for the 1,747 apartment communities with an active rental listing, and `propertyApartment.models[].id` to its `apartmentModels[].id`.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### CommercialProperty (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of the commercial property; the asset is the anchor of all CRE data, and this is the join key for everything attached to it. Also the translation key. |  |
| `addresses` | list of CommercialPropertyAddress objects | Collection of address-record identifiers associated with the property (multi-address sites); join on integer IDs to resolve geography. |  |
| `primaryAddress` | CommercialPropertyAddress object (nullable) | Identifier of the property's primary address record; join on the integer ID to resolve geography. The address whose id is the property's primary address id; null when the property has none. |  |
| `propertyType` | integer (PropertyType) | Primary CRE asset class (Office, Industrial, Flex, Retail, Multifamily, Hospitality, Land, etc.); drives the type-specific attribute set and the analytic property-type slices used for vacancy/rent/absorption aggregation. | see `PropertyType` in Allowed values |
| `propertySubtype` | integer (PropertySubtype) | Finer classification of the property within its propertyType, refining the asset's specific use category. | see `PropertySubtype` in Allowed values |
| `isCondo` | true/false (nullable) | Whether the property is held under condominium ownership rather than a single fee-simple title. |  |
| `buildingClass` | integer (BuildingClass) | Building Class A/B/C — a market-relative, subjective quality grade (A above-average, B average, C below-average); not comparable across markets and distinct from the CoStar Building Rating. Required and validated against Rating via the Class<->Rating matrix. | 0 = Unknown, 1 = A, 2 = B, 3 = C, 4 = F |
| `buildingRating` | integer (BuildingRating) | CoStar Building Rating (formerly Star Rating), a 1-5 national peer-property-type quality grade (5 best-in-class, 1 well-below-average); comparable across markets and distinct from Building Class. Validated against Class via the Class<->Rating matrix. | 0 = Unknown, 1 = OneStar, 2 = TwoStar, 3 = ThreeStar, 4 = FourStar, 5 = FiveStar |
| `buildingRatingType` | integer (BuildingRatingType) | Code indicating the rating scheme/basis behind buildingRating (e.g. which star-rating system applies). | 0 = Unknown, 1 = Approved |
| `propertyGroupId` | integer (nullable) | Unique identifier for the property-group record (a collection of related properties such as a campus or shopping center). Id of the first property group that contains this property; null when it is in none. |  |
| `constructionStatus` | integer (ConstructionStatus) | Lifecycle status of the building (Proposed, Under Construction, Under Renovation, Existing, Abandoned, Demolished); non-existing statuses are excluded from existing inventory, vacancy, and absorption until actual delivery/move-in. | 0 = Unknown, 1 = Existing, 2 = Demolished, 3 = Proposed, 4 = UnderConstruction, 5 = UnderRenovation, 6 = Converted, 8 = Deferred, 9 = Abandoned, 10 = FinalPlanning, 11 = UnderRedevelopment, 12 = Redeveloped |
| `coStarBuildingType` | integer (CoStarBuildingType) | CoStar internal building-type classification of the property. | 0 = Unknown, 1 = Yes, 2 = No, 3 = Unresearched, 4 = Assessment, 6 = CompsReview, 7 = DataSeed1, 8 = DataSeed2, 9 = PendingDelete |
| `buildingName` | text (nullable) | Proper name of the building used in marketing and identification. |  |
| `buildingPark` | text (nullable) | Display name of the property group (e.g. center or campus name); translatable. Name of the property's group when it has one, otherwise the property's own building park value. |  |
| `propertyWebsiteUrl` | text (nullable) | External marketing website URL for the property. |  |
| `grossBuildingAreaSquareFeet` | decimal (nullable) | Gross Building Area (GBA): the whole building measured to the outside of exterior walls, including shafts (elevators/stairs) and common areas. Basis for construction/zoning/tax and the FAR numerator (FAR = GBA / Lot Size); distinct from RBA. Square-foot value of the source measurement. |  |
| `grossTypicalFloorSquareFeet` | decimal (nullable) | Size of the building's most common floor; a representative per-floor metric, not a sum of all floor areas. Square-foot value of the source measurement. |  |
| `rentableBuildingAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the source measurement. |  |
| `numStoriesAboveGrade` | integer (nullable) | Number of building stories above ground level; an office/high-rise vertical-scale attribute. |  |
| `constructionEvents` | list of CommercialPropertyConstructionEvent objects | Collection of construction milestone events for the property (e.g. built, renovated), capturing its development lifecycle. |  |
| `buildingHeightInFeet` | decimal (nullable) | Overall height of the building in feet. |  |
| `buildingConstructionMaterial` | integer (BuildingConstructionMaterialType) | Primary construction material / structural system of the building (e.g. steel, reinforced concrete, masonry, wood frame); describes the predominant structural system, populated from broker/marketing material. | 0 = Unknown, 1 = Masonry, 2 = Metal, 3 = ReinforcedConcrete, 4 = Steel, 5 = WoodFrame, 6 = Brownstone, 7 = Limestone |
| `sprinklerType` | integer (SprinklerType) | Type of fire sprinkler system installed (e.g. wet, dry, ESFR); ESFR sprinklers matter for industrial/warehouse use. | 0 = Unknown, 1 = Wet, 2 = Dry, 3 = Esfr |
| `hasSprinklers` | true/false (nullable) | For the presence/availability of a fire sprinkler system; a key industrial/life-safety attribute. True if the sprinkler state is Yes, false if No, otherwise null. |  |
| `lotLengthInFeet` | decimal (nullable) | Length/depth of the land parcel in feet; a land/site dimension attribute. |  |
| `lotWidthInFeet` | decimal (nullable) | Width of the land parcel the property sits on, in feet; a land/site dimension attribute. |  |
| `lotSize` | decimal (nullable) | Total size of the land parcel as a unit-bearing measurement (e.g. acres or square feet); a core land/site attribute. Kept in acres when the source unit is acres; otherwise expressed in square feet (square meters multiplied by 10.7639 and rounded to a whole number); null when no lot size exists. |  |
| `lotSizeMeasurementType` | integer (MeasurementUnit) | Total size of the land parcel as a unit-bearing measurement (e.g. acres or square feet); a core land/site attribute. Unit of lot size after conversion: Acres stays Acres, SquareMeters becomes squareFeet, other units are kept, and Unknown when no lot size exists. | 0 = Unknown, 1 = SquareFeet, 2 = Acres, 3 = SquareMeters, 20 = Watt, 21 = Kilowatt, 22 = Megawatt |
| `zoningDescription` | text (nullable) | Short zoning code/classification governing permitted use of the property; a core land/use attribute. |  |
| `zoningLongDescription` | text (nullable) | Extended free-text description of the property's zoning and permitted uses; translatable. |  |
| `parcelNumbers` | list of text values | Collection of county assessor parcel references (APNs scoped by county) tying the property to public tax/ownership records. List of the parcel number values from the property's parcel references. |  |
| `parcelReferences` | list of CommercialPropertyParcelReference objects | Collection of county assessor parcel references (APNs scoped by county) tying the property to public tax/ownership records. Parcel number and county pairs copied from the property's parcel numbers. |  |
| `parking` | list of CommercialPropertyParking objects | Collection of parking detail records for the property describing spaces, types, and configuration. |  |
| `parkingRatio` | decimal (nullable) | Parking spaces per 1,000 SF of RBA/GLA; use the ratio rather than raw counts to compare parking provision across differently sized properties. |  |
| `primarySubmarketId` | integer (nullable) | Identifier of the property's primary CoStar submarket (a building-type-specific competitive area, not admin geography); join on the integer ID. |  |
| `primaryPhoto` | CommercialPropertyAttachmentReference object (nullable) | Collection of media attachment references (photos, floor plans, documents) for the property used on marketing surfaces. The property's attachment of type primaryPhoto, or the first published attachment when there is no primary photo; null when neither exists. |  |
| `attachments` | list of PropertyAttachment objects | Collection of media attachment references (photos, floor plans, documents) for the property used on marketing surfaces. The property's published attachments: photos, floor plans, aerials, plat maps, site plans and Matterport 3D scans. Each Matterport videoKey is a MatterportModelId in commercial-properties.csv. |  |
| `amenities` | list of integers | Collection of amenity catalog identifiers attached to the property describing its features; amenities are a key marketing/quality attribute. List of amenity ids from the property record. |  |
| `renovations` | list of CommercialPropertyRenovation objects | Collection of renovation records for the property, capturing improvement history relevant to condition and lifecycle. |  |
| `aliases` | list of text values | Collection of alternative names/aliases the property is known by, supporting search and matching. |  |
| `propertyOffice` | CommercialPropertyOffice object (nullable) | Only set when propertyType is Office; otherwise null. Filled even if the property has no office record, in which case its values are null. |  |
| `propertyRetail` | CommercialPropertyRetail object (nullable) | Only set when propertyType is GeneralRetail; otherwise null. Filled even if the property has no retail record, in which case most values are null. |  |
| `propertyIndustrial` | CommercialPropertyIndustrial object (nullable) | Only set when propertyType is Industrial; otherwise null. |  |
| `propertyFlex` | CommercialPropertyFlex object (nullable) | Only set when propertyType is Flex; otherwise null. |  |
| `propertyHospitality` | CommercialPropertyHospitality object (nullable) | Only set when propertyType is Hospitality and a hotel record exists; otherwise null. |  |
| `propertyApartment` | CommercialPropertyApartment object (nullable) | Only set when propertyType is Multifamily; otherwise null. |  |
| `propertySportsAndEntertainment` | CommercialPropertySportsAndEntertainment object (nullable) | Only set when propertyType is SportsAndEntertainment; otherwise null. Has no subtype source record, only the base property. |  |
| `propertyResidence` | CommercialPropertyResidence object (nullable) | Only set when propertyType is Residential or Homes and a residence record exists; otherwise null. |  |
| `propertyGroupSubtype` | integer (PropertyGroupSubtype) | Finer subtype of the group, valid only for its parent PropertyGroupType. For shopping centers this aligns with the controlled Shopping Center Type taxonomy (Neighborhood/Community/Power/Lifestyle/Strip Center, Regional/Super Regional Mall, Outlet Center, etc.). Subtype of the first property group that contains this property; Unknown when it is in none. | see `PropertyGroupSubtype` in Allowed values |
| `notes` | list of CommercialPropertyNotes objects | Collection of internal notes/annotations attached to the property record; translatable, may hold research commentary. |  |
| `land` | CommercialPropertyLand object (nullable) | Only set when propertyType is Land and a land record exists; otherwise null. |  |
| `contacts` | list of CommercialPropertyContact objects | Contacts linked to the property, keeping only contacts with no end date (current contacts). |  |
| `environmental` | CommercialPropertyEnvironmental object (nullable) | Environmental record for the property; not fetched for Land properties, so null for them. |  |
| `floors` | list of CommercialPropertyPropertyFloor objects | Floors of the building, one entry per floor, with no filter for removed floors. |  |
| `propertyPropertyResidence` | CommercialPropertyPropertyResidence object (nullable) | Only set when propertyType is Residential or Homes and a residence record exists; otherwise null. Identical duplicate of propertyResidence kept for downstream consumers that have not yet switched. |  |

### CommercialPropertyAddress

Found at: `addresses[]`, `primaryAddress`, `propertyApartment.models[].units[].address`, `propertyApartment.units[].address`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique integer identifier of the address record; the stable key other entities join to when referencing this location. |  |
| `buildingNumber` | text (nullable) | Building number identifying a specific structure within a multi-building site or campus at the address. |  |
| `buildingName` | text (nullable) | Proper name of the building at the address, e.g. a named office tower or community, used in marketing and identification. |  |
| `city` | text (nullable) | City name text of the address; an admin-geography label. Join to GeoEntities_City on cityId, never on this name string, since city names recur globally. |  |
| `cityId` | integer (nullable) | Identifier of the city containing the address; the integer key to join to GeoEntities_City instead of the City name string. |  |
| `countyId` | integer (nullable) | Integer identifying the county, the largest geographical subdivision of most US states. The District of Columbia and Ontario are current exceptions. |  |
| `countyName` | text (nullable) | Not populated in this dataset; expect null. |  |
| `countryCode` | text (nullable) | Country code of the address; top-level admin-geography scope. Resolves to GeoEntities_Country and disambiguates globally recurring city/state names. |  |
| `crossStreetDescription` | text (nullable) | Free-text description of the nearest cross streets or intersection, used to locate or market the property by its corner or block. |  |
| `latitude` | decimal (nullable) | Geocoded latitude coordinate of the address used for mapping and spatial analysis; nullable when geocoding is unresolved. |  |
| `longitude` | decimal (nullable) | Geocoded longitude coordinate of the address used for mapping and spatial analysis; nullable when geocoding is unresolved. |  |
| `postalBox` | text (nullable) | Post-office box designation for the address when mail is delivered to a PO box rather than the street location. |  |
| `postcode` | text (nullable) | Postal code of the address (international term for ZIP); part of admin geography. |  |
| `researchMarketId` | integer (nullable) | Identifier to the ResearchMarket. Replaces the legacy 3-digit market code that generally corresponded to a major city (e.g. 'ATL' for Atlanta). |  |
| `state` | text (nullable) | State or province text of the address; an admin-geography label. Resolve via stateId rather than this string for joins. |  |
| `stateId` | integer (nullable) | Identifier of the state/province containing the address; the integer key for state-grain joins rather than the State name string. |  |
| `streetDirection` | text (nullable) | Directional prefix or component of the street name such as N, SW, or East. |  |
| `streetName` | text (nullable) | Name of the street the property fronts, e.g. Main in 1200 Main St. |  |
| `streetNumber` | text (nullable) | Street (house) number portion of the street address, e.g. the 1200 in 1200 Main St. |  |
| `streetNumberEndRange` | text (nullable) | Upper bound of the street-number range when the property spans multiple addresses, e.g. the 1210 in a 1200-1210 frontage. |  |
| `streetType` | text (nullable) | Street thoroughfare type designation such as St, Ave, Blvd, or Rd. |  |
| `streetSuffix` | text (nullable) | Trailing directional suffix of the street address, e.g. the NW in 1200 Main St NW. |  |
| `submarketIds` | list of integers | Identifiers of the CoStar Submarkets this address belongs to; join to GeoEntities_Submarket on these IDs. Submarkets are building-type-specific and a point can sit in different submarkets per property type. |  |

### CommercialPropertyConstructionEvent

Found at: `constructionEvents[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `eventType` | integer (ConstructionEventType) | Identifies the type of construction lifecycle event for the property (e.g. yearBuilt, renovated, expanded); the artificial primary key of the construction event. | see `ConstructionEventType` in Allowed values |
| `year` | integer | Year in which the construction event occurred (e.g. year built or renovated). |  |
| `month` | integer (nullable) | Month in which the construction event occurred, when known. |  |

### CommercialPropertyParcelReference

Found at: `parcelReferences[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `countyId` | integer | Identifier of the county whose assessor maintains the parcel, scoping the parcel number; joins to GeoEntities_County. Parcel numbers are only unique within a county. |  |
| `parcelNumber` | text (nullable) | County assessor's parcel number (APN) identifying the legal land parcel a property sits on, used to tie the property to public tax/ownership records. |  |

### CommercialPropertyParking

Found at: `parking[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `parkingType` | integer (ParkingType) | Identifies the type of parking provided at the property. | 0 = Unknown, 1 = Surface, 2 = SurfaceTandem, 3 = Covered, 4 = CoveredTandem, 5 = IndustrialTrailer, 6 = OneCarGarage, 7 = TwoCarGarage, 8 = Reserved, 9 = AttachedGarage |
| `totalSpaces` | integer (nullable) | Total spaces for vehicles (cars or trailers) of this parking type; drives the parking ratio (spaces per 1,000 SF). |  |
| `monthlyParkingFee` | decimal (nullable) | Monthly parking fee charged for a vehicle (car or trailer); parking is an other-income source affecting EGI. |  |

### CommercialPropertyAttachmentReference

Found at: `primaryPhoto`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Identifies a file describing a given entity. The file can be any format, including document, spreadsheet, JPEG, GIF, Bitmap, etc. |  |
| `attachmentType` | integer (AttachmentType) | Logical representation of the attachment. Values include: Aerial Photo, Argus Financial, Building Photo, Contract, Floor Plan, Investment Package, Image, iPIX Virtual Tour, Lobby, Locational Map, Logo, Outlook Contact Card, Photograph, Plat Map, Presentation, Spreadsheet. | see `AttachmentType` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension) | The file extension/type of the attachment (e.g., DOC, PDF, JPG, GIF, TIF, XLS, etc.). | see `AttachmentTypeExtension` in Allowed values |
| `caption` | text (nullable) | Short description about the attachment. |  |
| `attachmentUri` | text (nullable) | Link to the attachment's file on CoStar's CDN, set on published attachments only. Image links are at size 112 (up to 1,880 by 900 pixels); replace the /112/ segment with another size id to get another size. |  |
| `dimensions` | CommercialPropertyDimensions object (nullable) | Pixel/size dimensions of the media asset (read-only from master). Image size container copied from the attachment's dimensions. |  |
| `originationDate` | date-time (nullable) | When the attachment was created. |  |
| `videoKey` | text (nullable) | External key/identifier of the associated video asset, when the attachment is a video. |  |
| `videoExternalReferenceType` | integer (ExternalReferenceType) | External-reference type indicating the video hosting provider/source for the videoKey. | see `ExternalReferenceType` in Allowed values |

### CommercialPropertyDimensions

Found at: `primaryPhoto.dimensions`, `propertyApartment.models[].units[].attachments[].dimensions`, `propertyApartment.models[].attachments[].dimensions`, `propertyApartment.units[].attachments[].dimensions`

| Field | Type | Description | Values |
|---|---|---|---|
| `width` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Width taken from the attachment's dimensions. |  |
| `height` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Height taken from the attachment's dimensions. |  |

### PropertyAttachment

Found at: `attachments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Identifies a file describing a given entity. The file can be any format, including document, spreadsheet, JPEG, GIF, Bitmap, etc. |  |
| `attachmentType` | integer (AttachmentType2) | Logical representation of the attachment. Values include: Aerial Photo, Argus Financial, Building Photo, Contract, Floor Plan, Investment Package, Image, iPIX Virtual Tour, Lobby, Locational Map, Logo, Outlook Contact Card, Photograph, Plat Map, Presentation, Spreadsheet. | see `AttachmentType2` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension) | The file extension/type of the attachment (e.g., DOC, PDF, JPG, GIF, TIF, XLS, etc.). | see `AttachmentTypeExtension` in Allowed values |
| `caption` | text (nullable) | Short description about the attachment. |  |
| `attachmentUri` | text (nullable) | Link to the attachment's file on CoStar's CDN, set on published attachments only. Image links are at size 112 (up to 1,880 by 900 pixels); replace the /112/ segment with another size id to get another size. |  |
| `dimensions` | Dimensions object (nullable) | Pixel/size dimensions of the media asset (read-only from master). Image size container copied from the attachment's dimensions. |  |
| `originationDate` | date-time (nullable) | When the attachment was created. |  |
| `videoExternalReferenceType` | integer (ExternalReferenceType2) | External-reference type indicating the video hosting provider/source for the videoKey. | see `ExternalReferenceType2` in Allowed values |
| `videoKey` | text (nullable) | External key/identifier of the associated video asset, when the attachment is a video. |  |

### Dimensions

Found at: `attachments[].dimensions`

| Field | Type | Description | Values |
|---|---|---|---|
| `width` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Width taken from the attachment's dimensions. |  |
| `height` | integer (nullable) | Pixel/size dimensions of the media asset (read-only from master). Height taken from the attachment's dimensions. |  |

### CommercialPropertyRenovation

Found at: `renovations[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `renovationExtent` | integer (RenovationExtent) | Code indicating the scope/extent of the renovation (cosmetic, gut, full redevelopment). | 0 = Unknown, 1 = Full, 2 = Partial, 3 = Redevelopment |
| `startDate` | date-time (nullable) | Date the renovation work began. |  |
| `endDate` | date-time | Date the renovation was completed; renovated/year-renovated affects effective age and value. |  |
| `renovationPrice` | integer (nullable) | Cost spent on the renovation/redevelopment. |  |
| `renovationImprovementTypes` | list of integers (RenovationImprovementType) | Collection of improvement types describing what the renovation upgraded (roof, HVAC, facade, etc.). | 0 = Unknown, 1 = Bathrooms, 2 = BuildingAmenities, 3 = CommonTenantSpace, 4 = Elevators, 5 = Façade, 6 = HVAC_Mechaical, 7 = Lobby, 8 = Roof, 9 = Site, 10 = Structural |

### CommercialPropertyOffice

Found at: `propertyOffice`

| Field | Type | Description | Values |
|---|---|---|---|
| `rentableBuildingAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the property's rentable building area, taken from the base property record. |  |
| `coreFactor` | decimal (nullable) | Upper bound of the office building's core (loss) factor — the share of rentable area (RBA) that is shared common space (lobbies, corridors) rather than usable tenant space. Surfaced as the 'Core Factor' building stat. coreFactor = (RBA - Usable) / RBA; orientation unverified. High end of the core-factor range, or the low end when no high end is recorded. |  |
| `coreFactorHighRange` | decimal (nullable) | Upper bound of the office building's core (loss) factor — the share of rentable area (RBA) that is shared common space (lobbies, corridors) rather than usable tenant space. Surfaced as the 'Core Factor' building stat. coreFactor = (RBA - Usable) / RBA; orientation unverified. |  |
| `coreFactorLowRange` | decimal (nullable) | Lower bound of the office building's core (loss) factor — the share of rentable area (RBA) that is shared common space (lobbies, corridors) rather than usable tenant space. Surfaced as the 'Core Factor' building stat. coreFactor = (RBA - Usable) / RBA; orientation unverified. |  |
| `isOwnerOccupied` | true/false (nullable) | Whether the property is occupied by its owner (owner/user) versus leased to third-party tenants; relevant to sale type (owner/user vs investment). |  |
| `tenancyType` | integer (TenancyType) | Whether the building is single-tenant or multi-tenant occupancy, affecting leasing and valuation characteristics. | 0 = Unknown, 1 = Single, 2 = Multi |
| `structural` | CommercialPropertyStructural object (nullable) | Built from the structural record (columns, ceiling and floor, elevators); null when the property has no structural record. |  |

### CommercialPropertyStructural

Found at: `propertyOffice.structural`, `propertyRetail.structural`, `propertyIndustrial.structural`, `propertyFlex.structural`

| Field | Type | Description | Values |
|---|---|---|---|
| `columnDepthFeet` | decimal (nullable) | Upper end of the range of spacing between rows of columns, in feet. Maximum column depth, or the minimum when no maximum is recorded. |  |
| `columnWidthFeet` | decimal (nullable) | Upper end of the range of spacing between columns, in feet. Maximum column width, or the minimum when no maximum is recorded. |  |
| `maxColumnDepthFeet` | decimal (nullable) | Upper end of the range of spacing between rows of columns, in feet. |  |
| `minColumnDepthFeet` | decimal (nullable) | Lower end of the range of spacing between rows of columns, in feet. |  |
| `maxColumnWidthFeet` | decimal (nullable) | Upper end of the range of spacing between columns, in feet. |  |
| `minColumnWidthFeet` | decimal (nullable) | Lower end of the range of spacing between columns, in feet. |  |
| `minFloorThicknessInches` | decimal (nullable) | Floor thickness in inches, representing the lower end of a range of values. |  |
| `maxFloorThicknessInches` | decimal (nullable) | Floor thickness in inches, representing the upper end of a range of values. |  |
| `ceilingHeightFeet` | decimal (nullable) | Maximum ceiling height in inches (remainder after whole feet), the upper end of a range; primarily Retail and Industrial). Whole feet of the maximum ceiling height (minimum if no maximum), converted from inches; null when that is under 12 inches. |  |
| `ceilingHeightInches` | decimal (nullable) | Maximum ceiling height in inches (remainder after whole feet), the upper end of a range; primarily Retail and Industrial). Leftover inches after removing whole feet from the maximum ceiling height (minimum if no maximum); null when the height is an exact number of feet. |  |
| `hasBuildingColumns` | true/false (nullable) | One of three knowledge states for building columns on the property: 0 = nothing known about building columns; 1 = the property has building columns (details may exist in PropertyBuildingColumn); 2 = the property does not have building columns. True if the building-column state is Yes, false if No, otherwise null. |  |
| `floorThicknessInches` | decimal (nullable) | Floor thickness in inches, representing the upper end of a range of values. Maximum floor thickness, or the minimum when no maximum is recorded. |  |
| `floorLoadPoundsPerSquareFoot` | integer (nullable) | Floor load capacity in pounds per square foot (upper end of a range). Maximum floor load, or the minimum when no maximum is recorded. |  |
| `slabToSlabHeightFeet` | decimal (nullable) | Distance in whole feet between the slabs of adjoining floors (Office only). |  |
| `elevators` | list of CommercialPropertyElevator objects | Collection of elevator records describing the property's vertical-transportation equipment by type and count. |  |

### CommercialPropertyElevator

Found at: `propertyOffice.structural.elevators[]`, `propertyRetail.structural.elevators[]`, `propertyIndustrial.structural.elevators[]`, `propertyFlex.structural.elevators[]` and 1 more

| Field | Type | Description | Values |
|---|---|---|---|
| `elevatorType` | integer (ElevatorType) | The type of elevator at the property (passenger, freight, or escalator). | 0 = Unknown, 1 = Passenger, 2 = Freight, 3 = Escalator, 4 = Parking |
| `numElevators` | integer (nullable) | Number of elevators of this type at the property (when known; n/a when elevatorState is unknown or does-not-exist). |  |
| `elevatorState` | integer (RecordStateType) | State of what is known about this elevator type at the property: 0 = unknown, 1 = exists, 2 = does not exist. Only states 1 and 2 should persist. | 0 = Unknown, 1 = Yes, 2 = No |

### CommercialPropertyRetail

Found at: `propertyRetail`

| Field | Type | Description | Values |
|---|---|---|---|
| `grossLeasableAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the property's rentable building area, taken from the base property record. |  |
| `maxBuildingDepthFeet` | decimal (nullable) | Maximum allowed value is 500 feet. |  |
| `minBuildingDepthFeet` | decimal (nullable) | Maximum allowed value is 500 feet. |  |
| `tenancyType` | integer (TenancyType) | Whether the building is single-tenant or multi-tenant occupancy, affecting leasing and valuation characteristics. | 0 = Unknown, 1 = Single, 2 = Multi |
| `frontage` | list of CommercialPropertyFrontage objects | Collection of the retail property's frontage records (road-facing edges); street, footage, traffic count, and curb cuts. |  |
| `numExternalLoadingDocks` | integer (nullable) | Number of loading docks that are external to the property structure. |  |
| `numInternalLoadingDocks` | integer (nullable) | Number of loading docks located within the structure of the property. |  |
| `structural` | CommercialPropertyStructural object (nullable) | Built from the structural record (columns, ceiling and floor, elevators); null when the property has no structural record. |  |

### CommercialPropertyFrontage

Found at: `propertyRetail.frontage[]`, `land.frontage[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `streetName` | text (nullable) | Name of the street on which the property fronts. |  |
| `frontageInFeet` | decimal (nullable) | Linear feet of frontage along this street; greater frontage means more retail visibility and access. Displayed as a distance per the user/property unit-of-measurement preference (feet vs meters). |  |
| `numCurbCuts` | integer (nullable) | Number of cut-outs in the curb along this frontage of the property. |  |
| `isPrimaryFrontage` | true/false | Indicates whether this frontage is on the side of the property with the main entrance. Primary frontage should be displayed in products ahead of non-primary frontage. |  |
| `footprint` | CommercialPropertyFrontageFootprint object (nullable) | Geospatial line geometry (LineString) tracing the frontage along the street. Container for the frontage line shape and its computed length. |  |

### CommercialPropertyFrontageFootprint

Found at: `propertyRetail.frontage[].footprint`, `land.frontage[].footprint`

| Field | Type | Description | Values |
|---|---|---|---|
| `shape` | LineString object (nullable) | Geospatial line geometry (LineString) tracing the frontage along the street. The frontage line geometry copied unchanged. |  |
| `distanceFeet` | integer (nullable) | Geospatial line geometry (LineString) tracing the frontage along the street. Length of the frontage line in feet, summing great-circle distances between consecutive points, rounded to a whole number. |  |

### LineString

Found at: `propertyRetail.frontage[].footprint.shape`, `land.frontage[].footprint.shape`

| Field | Type | Description | Values |
|---|---|---|---|
| `type` | integer (GeoObjectType) | Geometry type; LineString for a frontage. | stored as text: Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection, Feature, FeatureCollection |
| `coordinates` | list of [longitude, latitude] pairs | Points along the frontage line, in order. |  |
| `boundingBox` | list of decimals (nullable) | Bounding box of the frontage line, as minimum and maximum longitude and latitude. |  |

### CommercialPropertyIndustrial

Found at: `propertyIndustrial`

| Field | Type | Description | Values |
|---|---|---|---|
| `rentableBuildingAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the property's rentable building area, taken from the base property record. |  |
| `isOwnerOccupied` | true/false (nullable) | Whether the property is occupied by its owner (owner/user) versus leased to third-party tenants; relevant to sale type (owner/user vs investment). |  |
| `tenancyType` | integer (TenancyType) | Whether the building is single-tenant or multi-tenant occupancy, affecting leasing and valuation characteristics. | 0 = Unknown, 1 = Single, 2 = Multi |
| `driveInBays` | CommercialPropertyDriveInBay object (nullable) | Drive-in bay profile for the industrial property (count and door clear width/height for grade-level access). |  |
| `railAccess` | list of CommercialPropertyRailAccess objects (nullable) | Collection of rail-access records (rail carrier and rail-spot counts) describing the industrial property's rail service. Rail access entries from the subtype record, dropping empty entries. |  |
| `truckWells` | CommercialPropertyTruckWell object (nullable) | Truck-well profile for the industrial property (count, trucks per well, truck-court depth) for loading logistics. |  |
| `cranes` | CommercialPropertyCrane object (nullable) | Crane profile for the industrial property (count, hook height, lift capacity); a heavy-handling attribute. |  |
| `electric` | CommercialPropertyElectric object (nullable) | Electrical/power profile for the industrial property (amps, volts, phases), describing heavy-power capability. Electrical details from the subtype record; always present for Flex and Industrial, with null fields when the record has none. |  |
| `utilities` | list of CommercialPropertyUtility objects | Collection of utility records (water, gas, sewer, electric and their availability state) for the industrial property. Utilities from the subtype record, keeping only those whose state is Yes. |  |
| `numExternalLoadingDocks` | integer (nullable) | The number of loading docks that are external to the property. |  |
| `numInternalLoadingDocks` | integer (nullable) | The number of loading docks that are within the structure of the property. |  |
| `numExternalLevelers` | integer (nullable) | The number of levelers (a kind of loading dock) that are external to the property. |  |
| `numInternalLevelers` | integer (nullable) | The number of levelers (a kind of loading dock) that are within the structure of the property. |  |
| `maxBuildingDepthFeet` | decimal (nullable) | The upper range of the number of feet of the building below ground. Maximum value of 500 feet. |  |
| `minBuildingDepthFeet` | decimal (nullable) | The lower range of the number of feet of the building below ground. Maximum value of 500 feet. |  |
| `hasCrossDocks` | true/false (nullable) | Tri-state indicator of whether any of the property's loading docks are cross docks: 0 = nothing is known about whether any docks are cross docks; 1 = some or all loading docks are cross docks; 2 = none of the loading docks are cross docks. True if the cross-dock state is Yes, false if No, otherwise null. |  |
| `hasCranes` | true/false (nullable) | Tri-state indicator of crane information for the property: 0 = nothing is known about cranes; 1 = the property has cranes (details may exist in PropertyCrane); 2 = the property does not have cranes. True if the crane state is Yes, false if No, otherwise null. |  |
| `hasLoadingDocks` | true/false (nullable) | Tri-state indicator of loading-dock information for the property: 0 = nothing is known about loading docks; 1 = the property has loading docks (details may exist in PropertyLoadingDock); 2 = the property does not have loading docks. True if the loading-dock state is Yes, false if No, otherwise null. |  |
| `hasLevelers` | true/false (nullable) | Tri-state indicator of whether any of the property's loading docks are levelers: 0 = nothing is known about whether any docks are levelers; 1 = some or all loading docks are levelers; 2 = none of the loading docks are levelers. True if the leveler state is Yes, false if No, otherwise null. |  |
| `hasDriveInBays` | true/false (nullable) | Tri-state indicator of drive-in-bay information for the property: 0 = nothing is known about drive-in bays; 1 = the property has drive-in bays (details may exist in PropertyDriveInBay); 2 = the property does not have drive-in bays. True if the drive-in-bay state is Yes, false if No, otherwise null. |  |
| `structural` | CommercialPropertyStructural object (nullable) | Built from the structural record (columns, ceiling and floor, elevators); null when the property has no structural record. |  |

### CommercialPropertyDriveInBay

Found at: `propertyIndustrial.driveInBays`, `propertyFlex.driveInBays`

| Field | Type | Description | Values |
|---|---|---|---|
| `numDriveInBays` | decimal (nullable) | The number of drive-in bays on the property. |  |
| `numFeetWide` | decimal (nullable) | The width of a drive-in bay, in feet (to the nearest whole foot). |  |
| `numFeetHigh` | decimal (nullable) | The height of a drive-in bay, in feet (to the nearest whole foot). |  |

### CommercialPropertyRailAccess

Found at: `propertyIndustrial.railAccess[]`, `propertyFlex.railAccess[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `railCompanyId` | integer | Identifies the company supplying rail access to the property. |  |
| `description` | text (nullable) | Text description of miscellaneous information about the rail access on the property. |  |
| `numExternalRailSpots` | integer (nullable) | The number of rail access points on the property that are outside rather than within a structure. |  |
| `numInternalRailSpots` | integer (nullable) | The number of rail access points inside the structure on the property. |  |

### CommercialPropertyTruckWell

Found at: `propertyIndustrial.truckWells`, `propertyFlex.truckWells`

| Field | Type | Description | Values |
|---|---|---|---|
| `total` | integer (nullable) | The number of truck wells at the property. |  |
| `numTrucksPerWell` | integer (nullable) | The number of trucks that can fit in a truck well. |  |
| `truckCourtLengthInFeet` | decimal (nullable) | The length of the truck court, in feet. |  |

### CommercialPropertyCrane

Found at: `propertyIndustrial.cranes`, `propertyFlex.cranes`

| Field | Type | Description | Values |
|---|---|---|---|
| `numCranes` | integer (nullable) | Number of cranes available on the property. |  |
| `craneHookHeightFeet` | decimal (nullable) | The height of the crane's hook, in feet. |  |
| `minCraneWeightTons` | decimal (nullable) | The load capacity of the crane in tons (lower range). |  |
| `maxCraneWeightTons` | decimal (nullable) | The load capacity of the crane in tons (upper range). |  |

### CommercialPropertyElectric

Found at: `propertyIndustrial.electric`, `propertyFlex.electric`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasHeavyPower` | true/false (nullable) | Tri-state indicator of whether the property has heavy electric power (amperage of at least 800, i.e. ampsHigh >= 800): 0 = unknown, 1 = has heavy power, 2 = known not to. Heavy power is a defining industrial-building attribute; amp/volt detail lives on the Electric child. True if the heavy-power state is Yes, false if No, otherwise null. |  |
| `ampsLow` | integer (nullable) | The strength of electric current supplied to the property, in amperes. Can express the low end of a range; usually used for properties with "heavy power". |  |
| `ampsHigh` | integer (nullable) | The strength of electric current supplied to the property, in amperes. Can express the high end of a range; usually used for properties with "heavy power". |  |
| `voltsLow` | integer (nullable) | The potential of electric current supplied to the property, in volts. Can express the low end of a range; usually used for properties with "heavy power". |  |
| `voltsHigh` | integer (nullable) | The potential of electric current supplied to the property, in volts. Can express the high end of a range; usually used for properties with "heavy power". |  |
| `numWiresCarryingElectric` | integer (nullable) | How many wires are used to carry the electric power. For example, if a ground wire is present the measurement would be 3; if there is a separate incoming wire for large currents it would be 4. |  |
| `numElectricCurrentPhases` | integer (nullable) | Number of phases, referring to the synchronicity between current flowing on different wires. Three-phase power, used extensively in industrial machinery, has 3 "hot" wires 120 degrees out of phase with each other. |  |
| `description` | text (nullable) | Captures any miscellaneous descriptive information about the electric service at the property. |  |

### CommercialPropertyUtility

Found at: `propertyIndustrial.utilities[]`, `propertyFlex.utilities[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `utilityType` | integer (UtilityType) | Primary utility category available at the property (e.g. water, gas, sewer, electric). | 0 = Unknown, 1 = Lighting, 3 = Gas, 4 = Water, 5 = Sewer, 6 = Heating |
| `utilitySubType` | integer (UtilitySubType) (nullable) | Finer classification of the utility (e.g. service type or provider arrangement). | see `UtilitySubType` in Allowed values |

### CommercialPropertyFlex

Found at: `propertyFlex`

| Field | Type | Description | Values |
|---|---|---|---|
| `rentableBuildingAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the property's rentable building area, taken from the base property record. |  |
| `isOwnerOccupied` | true/false (nullable) | Whether the property is occupied by its owner (owner/user) versus leased to third-party tenants; relevant to sale type (owner/user vs investment). |  |
| `coreFactor` | decimal (nullable) | Maximum Core Factor: the common area expressed as a percentage of net rentable area (RBA) — space shared by all tenants (lobbies, rest rooms, corridors), excluding stairwells/elevators. coreFactor = (RBA − Usable) / RBA. High end of the core-factor range, or the low end when no high end is recorded. |  |
| `tenancyType` | integer (TenancyType) | Whether the building is single-tenant or multi-tenant occupancy, affecting leasing and valuation characteristics. | 0 = Unknown, 1 = Single, 2 = Multi |
| `driveInBays` | CommercialPropertyDriveInBay object (nullable) | Drive-in bay profile for the flex property (count and door clear width/height for grade-level vehicle access). |  |
| `railAccess` | list of CommercialPropertyRailAccess objects (nullable) | Collection of rail-access records (rail carrier and rail-spot counts) describing the flex property's rail service. Rail access entries from the subtype record, dropping empty entries. |  |
| `truckWells` | CommercialPropertyTruckWell object (nullable) | Truck-well profile for the flex property (count, trucks per well, truck-court depth) for loading logistics. |  |
| `cranes` | CommercialPropertyCrane object (nullable) | Crane profile for the flex property (count, hook height, lift capacity); an industrial heavy-handling attribute. |  |
| `electric` | CommercialPropertyElectric object (nullable) | Electrical/power profile for the flex property (amps, volts, phases), describing heavy-power capability. Electrical details from the subtype record; always present for Flex and Industrial, with null fields when the record has none. |  |
| `utilities` | list of CommercialPropertyUtility objects | Collection of utility records (water, gas, sewer, electric and their availability state) for the flex property. Utilities from the subtype record, keeping only those whose state is Yes. |  |
| `numExternalLoadingDocks` | integer (nullable) | The number of loading docks that are external to the property. |  |
| `numInternalLoadingDocks` | integer (nullable) | The number of loading docks that are within the structure of the property. |  |
| `numExternalLevelers` | integer (nullable) | The number of levelers (a kind of loading dock) that are external to the property. |  |
| `numInternalLevelers` | integer (nullable) | The number of levelers (a kind of loading dock) that are within the structure of the property. |  |
| `maxBuildingDepthFeet` | decimal (nullable) | Upper range of the number of feet of the building below ground. Maximum value of 500 feet. |  |
| `minBuildingDepthFeet` | decimal (nullable) | Lower range of the number of feet of the building below ground. Maximum value of 500 feet. |  |
| `hasLoadingDocks` | true/false (nullable) | Three-state indicator of loading docks on the property: 0 = nothing known, 1 = property has loading docks (details may exist in PropertyLoadingDock), 2 = property does not have loading docks. True if the loading-dock state is Yes, false if No, otherwise null. |  |
| `hasLevelers` | true/false (nullable) | Tri-state indicator of whether any of the property's loading docks are levelers: 0 = nothing is known about whether any docks are levelers; 1 = some or all loading docks are levelers; 2 = none of the loading docks are levelers. True if the leveler state is Yes, false if No, otherwise null. |  |
| `hasDriveInBays` | true/false (nullable) | Three-state indicator of drive-in bays on the property: 0 = nothing known, 1 = property has drive-in bays (details may exist in PropertyDriveInBay), 2 = property does not have drive-in bays. True if the drive-in-bay state is Yes, false if No, otherwise null. |  |
| `structural` | CommercialPropertyStructural object (nullable) | Built from the structural record (columns, ceiling and floor, elevators); null when the property has no structural record. |  |

### CommercialPropertyHospitality

Found at: `propertyHospitality`

| Field | Type | Description | Values |
|---|---|---|---|
| `buildingFullName` | text (nullable) | Full name of the hotel building/property as marketed. |  |
| `averageOccupancyPercent` | decimal (nullable) | Average share of available rooms occupied (Demand Rooms / Supply Rooms); a primary hospitality performance KPI alongside ADR and RevPAR, derived from STR-style research. |  |
| `averageDailyPricePerRoom` | decimal (nullable) | Average Daily Rate (ADR) = total room revenue / total occupied (demand) rooms; the core hospitality benchmark of room pricing per night. |  |
| `averageUnitSizeSquareFeet` | integer (nullable) | Average guest-room size in square feet, indicating room product quality and class. |  |
| `revenuePerAvailableRoom` | decimal (nullable) | RevPAR = total room revenue / available (supply) rooms (equivalently ADR × Occupancy); the headline hospitality performance metric. |  |
| `furnitureFixtureEquipmentValue` | integer (nullable) | Estimated value of furniture, fixtures and equipment (FF&E) at the hotel — the movable, non-real-estate component of going-concern hotel value (and soft goods such as linens); relevant when separating real property from business value in hotel sale comparability. |  |
| `hotelBrandId` | integer (nullable) | Identifier of the hotel's flag/brand (e.g. Marriott, Hilton brand); a key hospitality firmographic attribute. |  |
| `hotelBrandName` | text (nullable) | Name of the hotel brand/flag (e.g. a chain or banner). Name of the hotel brand referenced by the hotel record; null when no brand is found. |  |
| `corridorType` | integer (CorridorType) (nullable) | Code describing the hotel's corridor configuration (interior vs exterior room access), a product-class attribute. | 0 = Unknown, 1 = Interior, 2 = Exterior |
| `hotelRating` | integer (HotelRating) (nullable) | Quality rating of the hotel (e.g. star/diamond grade) indicating service and amenity level. | 0 = Unknown, 1 = OneStar, 2 = TwoStar, 3 = ThreeStar, 4 = FourStar, 5 = FiveStar |
| `hotelRatingYear` | integer (nullable) | Year the hotel rating was assigned, anchoring the rating to a point in time. |  |
| `numUnits` | integer (nullable) | Number of guest rooms (keys) in the hotel; the core hospitality size attribute driving capacity and per-room metrics. |  |
| `numResidences` | integer (nullable) | Number of branded-residence units associated with the hotel (condo-hotel or residential component). |  |
| `emailAddress` | text (nullable) | Contact email address for the hotel. |  |
| `phoneNumber` | text (nullable) | Contact phone number for the hotel. |  |
| `phoneNumberCountryCode` | text (nullable) | Country dialing code for the hotel phone number. |  |
| `numMeetingRooms` | integer (nullable) | Count of meeting/event rooms at the hotel; an attribute for conference and group-business positioning. |  |
| `totalMeetingSpaceSquareFeet` | decimal (nullable) | Total square footage of meeting/event space, indicating group and convention capacity. |  |
| `largestMeetingSpaceSquareFeet` | decimal (nullable) | Square footage of the single largest meeting/ballroom space; determines the maximum event size the hotel can host. |  |
| `numSeats` | integer (nullable) | Seating capacity (e.g. of banquet/meeting or food-and-beverage space) at the hotel. |  |
| `hotelTier` | integer (HotelTier) (nullable) | Tier within the hotel class hierarchy, a finer segmentation of market positioning. | 0 = Unknown, 1 = LowerTier, 2 = MiddleTier, 3 = UpperTier |
| `hotelOperationType` | integer (HotelOperationType) (nullable) | Code describing how the hotel is operated (e.g. franchised, managed, independent), distinguishing operator arrangements. | 0 = Unknown, 1 = ChainManagement, 2 = Franchise, 3 = Independent |
| `hotelLocationType` | integer (HotelLocationType) (nullable) | Code classifying the hotel's location setting (e.g. airport, suburban, urban, resort), a demand-driver attribute. | 0 = Unknown, 1 = Urban, 2 = Suburban, 3 = Airport, 4 = Interstate, 5 = Resort, 6 = SmallMetroTown |
| `hotelPriceRating` | integer (HotelPriceRating) (nullable) | Price-tier rating of the hotel, summarizing its relative price point. | 0 = Unknown, 1 = Luxury, 2 = Upscale, 3 = Midprice, 4 = Economy, 5 = Budget |
| `numSwimmingPools` | integer (nullable) | Count of indoor pools, a guest amenity attribute. Indoor pool count when it is recorded, otherwise the outdoor pool count (the two are not added together); null only when both are missing. |  |
| `numGolfHoles` | integer (nullable) | Number of golf holes available at or with the hotel, a resort amenity attribute. |  |
| `initialOpeningDate` | date-time (nullable) | Not populated in this dataset; expect null. |  |
| `operatingStatus` | integer (HotelOperatingStatus) | Lifecycle/operating status of the hotel (e.g. open, proposed, under construction, closed); affects inventory inclusion. | 0 = Unknown, 1 = Open, 2 = TemporarilyClosed, 3 = PermanentlyClosed |
| `hotelClass` | integer (HotelClass) | Hospitality class/segment (e.g. luxury, upscale, midscale, economy) classifying the hotel's market positioning. | 0 = Unknown, 1 = Luxury, 2 = UpperUpscale, 3 = Upscale, 4 = UpperMidscale, 5 = Midscale, 6 = Economy |
| `rooms` | list of CommercialPropertyHospitalityRoom objects | Collection of room-type records describing the hotel's room product mix. Hotel room types copied from the hotel record. |  |
| `seasonalClosureMonths` | list of integers | List of month numbers during which the hotel is seasonally closed, relevant for resort/seasonal operations. Month numbers converted to whole numbers; an empty list when none are recorded. |  |
| `isHotelEquivalentSupply` | true/false (nullable) | Flag indicating the property is counted as hotel-equivalent lodging supply (e.g. serviced/extended-stay) for market supply analysis. |  |

### CommercialPropertyHospitalityRoom

Found at: `propertyHospitality.rooms[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `roomType` | integer (RoomType) | Classification of the hotel room product (e.g. standard, suite); the unit of the hotel's room-mix breakdown. | 0 = Unknown, 2 = SingleKing, 4 = DoubleQueen, 5 = Suite, 6 = GuestRoom |
| `numRooms` | integer (nullable) | Number of rooms of this type in the hotel's inventory. |  |
| `averageRoomSquareFeet` | integer (nullable) | Average floor area of a room of this type in square feet. |  |
| `averageDailyRate` | integer (nullable) | Average daily rate (ADR) charged for this room type; a core hospitality revenue metric. |  |
| `dailyRateLow` | integer (nullable) | Lower bound of the daily rate range for this room type. |  |
| `dailyRateHigh` | integer (nullable) | Upper bound of the daily rate range for this room type. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency/monetary unit in which the room rates are expressed. | see `MonetaryUnit` in Allowed values |

### CommercialPropertyApartment

Found at: `propertyApartment`

| Field | Type | Description | Values |
|---|---|---|---|
| `apartmentStyleType` | integer (ApartmentStyleType) | Architectural/building style of the apartment community (e.g. garden, mid-rise, high-rise). Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = Garden, 2 = MidRise, 3 = HighRise, 4 = LowRise, 5 = SingleFamilyHome, 6 = Townhome |
| `apartmentLifestyleType` | integer (ApartmentLifestyleType) | Code representing the demographic classification that a multi-family property caters to. Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = All, 2 = Senior, 3 = Student, 4 = Military, 5 = Corporate, 6 = Vacation |
| `apartmentOwnershipType` | integer (ApartmentOwnershipType) | Code representing the kind of ownership of a multi-family property's building with respect to the units themselves. Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = Condo, 2 = Cooperative |
| `apartmentRentType` | integer (ApartmentRentType) | Code for the rent classification of the multifamily property (e.g. market-rate vs Affordable, discounted to meet affordability standards); CoStar tracks distinct rent series and aggregates rents SF-weighted across types. Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = Market, 2 = Affordable, 3 = MarketAffordable |
| `affordableRentSubtype` | integer (AffordableRentSubtype) | Code representing a sub-classification of affordable rent types; must be selected when the property's rent type is classified as 'Affordable'. Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = RentRestricted, 2 = RentSubsidized, 3 = RentControlled, 4 = RentStabilized, 5 = AffordableUnits |
| `affordableUnits` | integer (nullable) | Number of units offered at 'Affordable' rents. Only applies when the property's apartmentRentType is set to 'Affordable'. |  |
| `numBuildings` | integer (nullable) | Number of buildings in the apartment property. Duplicative column added (per D. Zucker) in anticipation of retiring PropertyApartmentBuilding; originated from PropertyApartmentBuilding.NumBldgs but made nullable. |  |
| `totalNumUnits` | integer (nullable) | Collection of active apartment floor-plan model records defining the community's unit mix (bed/bath layouts, counts, rents). Count of units listed across all of the property's apartment models; units listed directly on the property are not counted. |  |
| `totalNumMobileHomeHookups` | integer (nullable) | Not populated in this dataset; expect null. |  |
| `unitsPerAcre` | integer (nullable) | Residential density expressed as dwelling units per acre; a multifamily site-density / entitlement attribute analogous to land zoning density. |  |
| `vacancyPercent` | integer (nullable) | Percentage of units currently vacant at the community; a marketed property-level multifamily vacancy figure from apartment research, distinct from computed market vacancy. For student lifestyle, beds = units x bedrooms. |  |
| `apartmentMeteringType` | integer (ApartmentMeteringType) | Code representing how utilities (water/electric) are metered for the apartment property. Source value, or Unknown when no apartment record exists. | 0 = Unknown, 1 = MasterMetered, 2 = IndividuallyMetered |
| `isWalkup` | true/false (nullable) | Indicates whether the building is a walkup or has elevator access. |  |
| `affiliatedCollegeId` | integer (nullable) | Identifier of the college/university the community is affiliated with, for student-housing communities; join on integer ID. |  |
| `siteEmailAddress` | text (nullable) | Contact email address for the apartment community's leasing office. |  |
| `sitePhoneNumber` | text (nullable) | Contact phone number for the apartment community's leasing office. |  |
| `sitePhoneCountryCode` | text (nullable) | Country dialing code accompanying the leasing-office phone number. |  |
| `sitePhoneExtension` | text (nullable) | Phone extension for reaching the leasing office at the contact phone number. |  |
| `residentialProfile` | CommercialPropertyResidentialProfile object (nullable) | Identifier of the associated residential profile that holds shared rental/community profile data. Residential profile (parking, pets, schools, colleges) looked up by the apartment record's profile id. |  |
| `elevators` | list of CommercialPropertyElevator objects | Collection of elevator records describing the property's vertical-transportation equipment by type and count. Elevators taken from the property's structural record rather than the apartment record. |  |
| `models` | list of CommercialPropertyApartmentModel objects | Collection of active apartment floor-plan model records defining the community's unit mix (bed/bath layouts, counts, rents). |  |
| `units` | list of CommercialPropertyApartmentUnit2 objects | Collection of individual apartment unit records at the community (beds, baths, square feet, rent), the granular multifamily unit-mix detail. |  |

### CommercialPropertyResidentialProfile

Found at: `propertyApartment.residentialProfile`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasNoParkingAvailable` | true/false (nullable) | Whether the community has no parking available at all. |  |
| `hasVisitorParkingAvailable` | true/false (nullable) | Whether visitor parking is available at the community; a multifamily parking amenity attribute. Treated as false when the source value is missing. |  |
| `isPetNegotiable` | true/false (nullable) | Whether the property's pet policy is negotiable rather than fixed. |  |
| `hasNoPetsAllowed` | true/false (nullable) | Whether the community prohibits pets entirely. |  |
| `parkingPolicies` | list of CommercialPropertyResidentialParkingPolicy objects | Collection of the community's residential parking policies (by parking type, fees, space counts). |  |
| `petPolicies` | list of CommercialPropertyResidentialPetPolicy objects | Collection of the community's residential pet policies (by pet type, fees, restrictions). |  |
| `schools` | list of CommercialPropertyResidentialSchool objects | Collection of nearby K-12 schools associated with the community, a residential location-desirability attribute. |  |
| `colleges` | list of CommercialPropertyResidentialCollege objects | Collection of nearby colleges/universities associated with the community, relevant to the renter demand base. |  |

### CommercialPropertyResidentialParkingPolicy

Found at: `propertyApartment.residentialProfile.parkingPolicies[]`, `propertyApartment.models[].residentialProfile.parkingPolicies[]`, `propertyApartment.models[].units[].residentialProfile.parkingPolicies[]`, `propertyApartment.units[].residentialProfile.parkingPolicies[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `parkingType` | integer (ResidentialParkingType) | Code parking arrangement the policy governs (surface, covered/garage, etc.); also the translation key for translatable strings. | see `ResidentialParkingType` in Allowed values |
| `hasAssignedSpacesAvailable` | true/false (nullable) | Whether assigned (reserved) parking spaces are available under this policy. |  |
| `minSpaceFee` | integer (nullable) | Lower bound of the fee for a general (unassigned) parking space, in the record's monetaryUnit. |  |
| `maxSpaceFee` | integer (nullable) | Upper bound of the fee for a general (unassigned) parking space, in the record's monetaryUnit. |  |
| `numSpaces` | integer (nullable) | Number of parking spaces available under this policy at the community. |  |
| `comments` | text (nullable) | Translatable free-text comments providing additional context about the parking policy. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency unit for the parking policy's fee amounts; normalize before aggregating across properties. | see `MonetaryUnit` in Allowed values |

### CommercialPropertyResidentialPetPolicy

Found at: `propertyApartment.residentialProfile.petPolicies[]`, `propertyApartment.models[].residentialProfile.petPolicies[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `petType` | integer (PetType) | Type of pet the policy governs (dog, cat, etc.); also the translation key for the policy's translatable strings. | 0 = Unknown, 1 = Bird, 2 = Cat, 3 = Dog, 4 = Fish, 5 = Reptile, 6 = Other |
| `description` | text (nullable) | Translatable description of the pet policy as shown to prospective residents. |  |
| `numPets` | integer (nullable) | Maximum number of pets of this type permitted under the policy. |  |
| `weight` | integer (nullable) | Pet weight limit governed by WeightThresholdType (e.g. max allowed weight) for this pet type. |  |
| `deposit` | integer (nullable) | Pet deposit amount required under the policy, in the record's monetaryUnit. |  |
| `rent` | integer (nullable) | Recurring pet rent charged under the policy, in the record's monetaryUnit. |  |
| `minFee` | integer (nullable) | Lower bound of the pet fee charged under the policy, in the record's monetaryUnit. |  |
| `maxFee` | integer (nullable) | Upper bound of the pet fee charged under the policy, in the record's monetaryUnit. |  |
| `comments` | text (nullable) | Translatable free-text comments providing additional context about the pet policy. |  |
| `restrictions` | text (nullable) | Translatable free-text restrictions on pets (e.g. breed or size limits) under the policy. |  |
| `isDeclawed` | true/false (nullable) | Whether the policy requires the pet (e.g. cat) to be declawed. |  |
| `isPetInterviewRequired` | true/false (nullable) | Whether the property requires a pet interview/screening as a condition of the policy. |  |
| `isSpayedNeutered` | true/false (nullable) | Whether the policy requires the pet to be spayed or neutered. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency unit for the pet policy's monetary amounts; normalize before aggregating across properties. | see `MonetaryUnit` in Allowed values |

### CommercialPropertyResidentialSchool

Found at: `propertyApartment.residentialProfile.schools[]`, `propertyApartment.models[].residentialProfile.schools[]`, `propertyApartment.models[].units[].residentialProfile.schools[]`, `propertyApartment.units[].residentialProfile.schools[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `schoolName` | text (nullable) | Name of a school associated with the residential property, used in marketing to convey school-district/education appeal of the location. |  |
| `schoolType` | integer (SchoolType) | Type of school (e.g. elementary, middle, high, public/private), classifying the education option near the residential property. | 0 = Unknown, 1 = Public, 2 = Private, 3 = Charter |
| `assignmentType` | integer (SchoolAssignmentType) (nullable) | Code indicating how the school relates to the property (e.g. assigned/zoned vs nearby), clarifying whether residents are districted to attend it. | 0 = Unknown, 1 = AttendanceZone, 2 = Nearby, 3 = Manual, 4 = PointInPolygon |
| `gradeLevel` | integer (SchoolGradeLevel) (nullable) | Grade-level range served by the school (e.g. K-5, 6-8, 9-12), describing the education stage relevant to residents. | 0 = Unknown, 1 = Elementary, 2 = Middle, 3 = High |
| `distanceMile` | decimal | Distance in miles from the residential property to the school, a proximity/convenience attribute for prospective residents with children. |  |
| `isMarketingPublished` | true/false (nullable) | Whether this school association is published to consumer marketing surfaces and should be surfaced in listings. |  |

### CommercialPropertyResidentialCollege

Found at: `propertyApartment.residentialProfile.colleges[]`, `propertyApartment.models[].residentialProfile.colleges[]`, `propertyApartment.models[].units[].residentialProfile.colleges[]`, `propertyApartment.units[].residentialProfile.colleges[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `ipedid` | integer (nullable) | IPEDS institution identifier for the college (the federal Integrated Postsecondary Education Data System unit ID), used to cross-link to authoritative higher-education records. The output uses a lower-case ipedid key. |  |
| `collegeName` | text (nullable) | Name of a college/university associated with the residential property, used in marketing to convey nearby higher-education appeal of the location. |  |
| `campusName` | text (nullable) | Name of the specific campus of the college, distinguishing among multiple campuses of the same institution near the property. |  |
| `assignmentType` | integer (CollegeAssignmentType) | Code indicating how the college relates to the property (e.g. nearby/associated), clarifying the nature of the proximity relationship. | 0 = Unknown, 1 = OnCampus, 2 = OffCampus, 3 = Preferred |
| `feetToCampusBoundary` | decimal (nullable) | Distance in feet from the residential property to the college's campus boundary, a proximity attribute valued by student-housing and rental marketing. |  |

### CommercialPropertyApartmentModel

Found at: `propertyApartment.models[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of the apartment model (floor-plan/unit-type) record. |  |
| `numBeds` | integer | Number of bedrooms in the floor-plan model; a primary multifamily unit-mix attribute. For student housing, beds (= units x bedrooms) and bedrooms are tracked distinctly. |  |
| `maxOccupants` | integer (nullable) | Maximum number of occupants permitted in units of this model. |  |
| `numUnits` | integer (nullable) | Count of physical units in the community that share this floor-plan model; contributes to the unit mix and total unit count. |  |
| `modelName` | text (nullable) | Display name of the floor-plan model used in multifamily marketing. |  |
| `modelDescription` | text (nullable) | Free-text marketing description of the floor-plan model and its features. |  |
| `numBaths` | decimal (nullable) | A key unit-mix attribute. |  |
| `numFloors` | integer (nullable) | Number of levels the model's unit spans (e.g. townhome-style two-story unit), not the building height. |  |
| `minSquareFeet` | integer (nullable) | Lower bound of the model's rentable area in square feet. |  |
| `maxSquareFeet` | integer (nullable) | Upper bound of the model's rentable area in square feet. |  |
| `isSquareFeetApproximate` | true/false (nullable) | Flag indicating the model's square footage is approximate rather than exact, a confidence qualifier on the size. |  |
| `nonstandardApartmentRoomType` | integer (NonstandardApartmentRoomType) (nullable) | For non-standard room configurations (studio, loft) outside the standard bedroom count. | see `NonstandardApartmentRoomType` in Allowed values |
| `isShortTermLeaseAvailable` | true/false (nullable) | Whether short-term leasing is offered for units of this model. |  |
| `minLeaseTermsMonths` | integer (nullable) | Minimum lease term offered for units of this model, in months. |  |
| `maxLeaseTermsMonths` | integer (nullable) | Maximum lease term offered for units of this model, in months. |  |
| `residentialProfile` | CommercialPropertyResidentialProfile2 object (nullable) | Foreign key to the parent residential property/community profile this model belongs to. Residential profile looked up by this record's profile id. |  |
| `availabilityUrl` | text (nullable) | External link to the model's live availability or application page. Text converted to a web address; null when absent. |  |
| `units` | list of CommercialPropertyApartmentUnit objects | Collection of individual apartment-unit records that instantiate this floor-plan model. |  |
| `amenities` | list of CommercialPropertyAmenityReference objects | Collection of amenity references describing features offered with this model. |  |
| `attachments` | list of CommercialPropertyAttachmentReference2 objects | Collection of apartment-property media attachment references (photos, floor plans) for this model. |  |

### CommercialPropertyResidentialProfile2

Found at: `propertyApartment.models[].residentialProfile`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasNoParkingAvailable` | true/false (nullable) | Whether the community has no parking available at all. |  |
| `isPetNegotiable` | true/false (nullable) | Whether the property's pet policy is negotiable rather than fixed. |  |
| `hasNoPetsAllowed` | true/false (nullable) | Whether the community prohibits pets entirely. |  |
| `parkingPolicies` | list of CommercialPropertyResidentialParkingPolicy objects | Collection of the community's residential parking policies (by parking type, fees, space counts). |  |
| `petPolicies` | list of CommercialPropertyResidentialPetPolicy objects | Collection of the community's residential pet policies (by pet type, fees, restrictions). |  |
| `schools` | list of CommercialPropertyResidentialSchool objects | Collection of nearby K-12 schools associated with the community, a residential location-desirability attribute. |  |
| `colleges` | list of CommercialPropertyResidentialCollege objects | Collection of nearby colleges/universities associated with the community, relevant to the renter demand base. |  |

### CommercialPropertyApartmentUnit

Found at: `propertyApartment.models[].units[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier for the apartment unit record. |  |
| `numBeds` | integer | Number of bedrooms in the unit; a primary multifamily unit-mix attribute used to classify and price rental inventory. For student housing, total beds = units x bedrooms. |  |
| `numBaths` | decimal (nullable) | Total number of bathrooms in the unit, expressed as a fraction to allow half-baths; a key multifamily unit-mix attribute. |  |
| `numFloors` | integer (nullable) | Number of floors/levels the individual unit spans (e.g. for a townhome or loft), not the building height. |  |
| `minSquareFeet` | integer (nullable) | Lower bound of the unit's rentable area in square feet; ranges accommodate variation across like floor plans. |  |
| `maxSquareFeet` | integer (nullable) | Upper bound of the unit's rentable area in square feet. |  |
| `unitNumber` | text (nullable) | Identifier label of the specific unit within the building (e.g. apartment/suite number). |  |
| `unitName` | text (nullable) | Display name of the unit or floor-plan model used in marketing. |  |
| `unitDescription` | text (nullable) | Free-text marketing description of the unit and its features. |  |
| `floorNumber` | text (nullable) | Floor on which the unit is located, stored as free text to allow labels like ground, basement, or PH. |  |
| `buildingName` | text (nullable) | Name of the building containing the unit within a multi-building community. |  |
| `isShortTermLeaseAvailable` | true/false (nullable) | Whether short-term (e.g. month-to-month or under a year) leasing is offered for the unit. |  |
| `minLeaseTermsMonths` | integer (nullable) | Minimum lease term offered for the unit in months. |  |
| `maxLeaseTermsMonths` | integer (nullable) | Maximum lease term offered for the unit in months. |  |
| `nonstandardApartmentRoomType` | integer (NonstandardApartmentRoomType) (nullable) | Classification for non-standard room configurations (e.g. studio, loft) that fall outside the standard bedroom count. | see `NonstandardApartmentRoomType` in Allowed values |
| `residentialProfile` | CommercialPropertyResidentialProfile3 object (nullable) | Foreign key to the parent residential property/community profile the unit belongs to. Residential profile looked up by this record's profile id. |  |
| `availabilityUrl` | text (nullable) | External link to the unit's live availability or application page. Text converted to a web address; null when absent. |  |
| `address` | CommercialPropertyAddress object (nullable) | Foreign key to the address record for the unit's location; join on the integer ID. Address looked up by the unit's address id; null when the unit has no address id. |  |
| `amenities` | list of CommercialPropertyAmenityReference objects | Collection of amenity references describing features offered with the unit. |  |
| `attachments` | list of CommercialPropertyAttachmentReference2 objects | Collection of media attachment references (photos, etc.) for the apartment unit. |  |

### CommercialPropertyResidentialProfile3

Found at: `propertyApartment.models[].units[].residentialProfile`

| Field | Type | Description | Values |
|---|---|---|---|
| `hasNoPetsAllowed` | true/false (nullable) | Whether the community prohibits pets entirely. |  |
| `parkingPolicies` | list of CommercialPropertyResidentialParkingPolicy objects | Collection of the community's residential parking policies (by parking type, fees, space counts). |  |
| `petPolicies` | list of CommercialPropertyResidentialPetPolicy2 objects | Collection of the community's residential pet policies (by pet type, fees, restrictions). |  |
| `schools` | list of CommercialPropertyResidentialSchool objects | Collection of nearby K-12 schools associated with the community, a residential location-desirability attribute. |  |
| `colleges` | list of CommercialPropertyResidentialCollege objects | Collection of nearby colleges/universities associated with the community, relevant to the renter demand base. |  |

### CommercialPropertyResidentialPetPolicy2

Found at: `propertyApartment.models[].units[].residentialProfile.petPolicies[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `petType` | integer (PetType) | Type of pet the policy governs (dog, cat, etc.); also the translation key for the policy's translatable strings. | 0 = Unknown, 1 = Bird, 2 = Cat, 3 = Dog, 4 = Fish, 5 = Reptile, 6 = Other |
| `description` | text (nullable) | Translatable description of the pet policy as shown to prospective residents. |  |
| `rent` | integer (nullable) | Recurring pet rent charged under the policy, in the record's monetaryUnit. |  |
| `minFee` | integer (nullable) | Lower bound of the pet fee charged under the policy, in the record's monetaryUnit. |  |
| `maxFee` | integer (nullable) | Upper bound of the pet fee charged under the policy, in the record's monetaryUnit. |  |
| `comments` | text (nullable) | Translatable free-text comments providing additional context about the pet policy. |  |
| `restrictions` | text (nullable) | Translatable free-text restrictions on pets (e.g. breed or size limits) under the policy. |  |
| `isDeclawed` | true/false (nullable) | Whether the policy requires the pet (e.g. cat) to be declawed. |  |
| `isPetInterviewRequired` | true/false (nullable) | Whether the property requires a pet interview/screening as a condition of the policy. |  |
| `isSpayedNeutered` | true/false (nullable) | Whether the policy requires the pet to be spayed or neutered. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency unit for the pet policy's monetary amounts; normalize before aggregating across properties. | see `MonetaryUnit` in Allowed values |

### CommercialPropertyAmenityReference

Found at: `propertyApartment.models[].units[].amenities[]`, `propertyApartment.models[].amenities[]`, `propertyApartment.units[].amenities[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `amenityId` | integer | Identifier of the referenced amenity from the amenity catalog. |  |

### CommercialPropertyAttachmentReference2

Found at: `propertyApartment.models[].units[].attachments[]`, `propertyApartment.models[].attachments[]`, `propertyApartment.units[].attachments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Identifies a file describing a given entity. The file can be any format, including document, spreadsheet, JPEG, GIF, Bitmap, etc. |  |
| `attachmentType` | integer (AttachmentType) | Logical representation of the attachment. Values include: Aerial Photo, Argus Financial, Building Photo, Contract, Floor Plan, Investment Package, Image, iPIX Virtual Tour, Lobby, Locational Map, Logo, Outlook Contact Card, Photograph, Plat Map, Presentation, Spreadsheet. | see `AttachmentType` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension) | The file extension/type of the attachment (e.g., DOC, PDF, JPG, GIF, TIF, XLS, etc.). | see `AttachmentTypeExtension` in Allowed values |
| `caption` | text (nullable) | Short description about the attachment. |  |
| `checksum` | text (nullable) | Content checksum of the attachment binary used for integrity/dedup (read-only from master). Not populated in this dataset; expect null. |  |
| `cloudFolder` | text (nullable) | Cloud storage folder/path where the attachment binary resides (read-only from master). Not populated in this dataset; expect null. |  |
| `attachmentUri` | text (nullable) | Link to the attachment's file on CoStar's CDN, set on published attachments only. Image links are at size 112 (up to 1,880 by 900 pixels); replace the /112/ segment with another size id to get another size. |  |
| `dimensions` | CommercialPropertyDimensions object (nullable) | Pixel/size dimensions of the media asset (read-only from master). Not populated in this dataset; expect null. |  |
| `originationDate` | date-time (nullable) | When the attachment was created. |  |
| `videoKey` | text (nullable) | External key/identifier of the associated video asset, when the attachment is a video. |  |
| `videoExternalReferenceType` | integer (ExternalReferenceType) | External-reference type indicating the video hosting provider/source for the videoKey. | see `ExternalReferenceType` in Allowed values |

### CommercialPropertyApartmentUnit2

Found at: `propertyApartment.units[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier for the apartment unit record. |  |
| `numBeds` | integer | Number of bedrooms in the unit; a primary multifamily unit-mix attribute used to classify and price rental inventory. For student housing, total beds = units x bedrooms. |  |
| `numBaths` | decimal (nullable) | Total number of bathrooms in the unit, expressed as a fraction to allow half-baths; a key multifamily unit-mix attribute. |  |
| `numFloors` | integer (nullable) | Number of floors/levels the individual unit spans (e.g. for a townhome or loft), not the building height. |  |
| `minSquareFeet` | integer (nullable) | Lower bound of the unit's rentable area in square feet; ranges accommodate variation across like floor plans. |  |
| `maxSquareFeet` | integer (nullable) | Upper bound of the unit's rentable area in square feet. |  |
| `unitNumber` | text (nullable) | Identifier label of the specific unit within the building (e.g. apartment/suite number). |  |
| `unitName` | text (nullable) | Display name of the unit or floor-plan model used in marketing. |  |
| `unitDescription` | text (nullable) | Free-text marketing description of the unit and its features. |  |
| `floorNumber` | text (nullable) | Floor on which the unit is located, stored as free text to allow labels like ground, basement, or PH. |  |
| `buildingName` | text (nullable) | Name of the building containing the unit within a multi-building community. |  |
| `isShortTermLeaseAvailable` | true/false (nullable) | Whether short-term (e.g. month-to-month or under a year) leasing is offered for the unit. |  |
| `minLeaseTermsMonths` | integer (nullable) | Minimum lease term offered for the unit in months. |  |
| `maxLeaseTermsMonths` | integer (nullable) | Maximum lease term offered for the unit in months. |  |
| `nonstandardApartmentRoomType` | integer (NonstandardApartmentRoomType) (nullable) | Classification for non-standard room configurations (e.g. studio, loft) that fall outside the standard bedroom count. | see `NonstandardApartmentRoomType` in Allowed values |
| `residentialProfile` | CommercialPropertyResidentialProfile4 object (nullable) | Foreign key to the parent residential property/community profile the unit belongs to. Residential profile looked up by this record's profile id. |  |
| `availabilityUrl` | text (nullable) | External link to the unit's live availability or application page. Text converted to a web address; null when absent. |  |
| `address` | CommercialPropertyAddress object (nullable) | Foreign key to the address record for the unit's location; join on the integer ID. Address looked up by the unit's address id; null when the unit has no address id. |  |
| `amenities` | list of CommercialPropertyAmenityReference objects | Collection of amenity references describing features offered with the unit. |  |
| `attachments` | list of CommercialPropertyAttachmentReference2 objects | Collection of media attachment references (photos, etc.) for the apartment unit. |  |

### CommercialPropertyResidentialProfile4

Found at: `propertyApartment.units[].residentialProfile`

| Field | Type | Description | Values |
|---|---|---|---|
| `parkingPolicies` | list of CommercialPropertyResidentialParkingPolicy objects | Collection of the community's residential parking policies (by parking type, fees, space counts). |  |
| `petPolicies` | list of CommercialPropertyResidentialPetPolicy3 objects | Collection of the community's residential pet policies (by pet type, fees, restrictions). |  |
| `schools` | list of CommercialPropertyResidentialSchool objects | Collection of nearby K-12 schools associated with the community, a residential location-desirability attribute. |  |
| `colleges` | list of CommercialPropertyResidentialCollege objects | Collection of nearby colleges/universities associated with the community, relevant to the renter demand base. |  |

### CommercialPropertyResidentialPetPolicy3

Found at: `propertyApartment.units[].residentialProfile.petPolicies[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `petType` | integer (PetType) | Type of pet the policy governs (dog, cat, etc.); also the translation key for the policy's translatable strings. | 0 = Unknown, 1 = Bird, 2 = Cat, 3 = Dog, 4 = Fish, 5 = Reptile, 6 = Other |
| `description` | text (nullable) | Translatable description of the pet policy as shown to prospective residents. |  |
| `comments` | text (nullable) | Translatable free-text comments providing additional context about the pet policy. |  |
| `restrictions` | text (nullable) | Translatable free-text restrictions on pets (e.g. breed or size limits) under the policy. |  |
| `isDeclawed` | true/false (nullable) | Whether the policy requires the pet (e.g. cat) to be declawed. |  |
| `isPetInterviewRequired` | true/false (nullable) | Whether the property requires a pet interview/screening as a condition of the policy. |  |
| `isSpayedNeutered` | true/false (nullable) | Whether the policy requires the pet to be spayed or neutered. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency unit for the pet policy's monetary amounts; normalize before aggregating across properties. | see `MonetaryUnit` in Allowed values |

### CommercialPropertySportsAndEntertainment

Found at: `propertySportsAndEntertainment`

| Field | Type | Description | Values |
|---|---|---|---|
| `rentableBuildingAreaSquareFeet` | decimal (nullable) | Rentable Building Area (RBA): area inside the walls excluding vertical shafts but including common areas — the leasing/revenue/investing basis and the vacancy denominator. RBA used for all uses except retail (which uses GLA); must be <= GBA. Square-foot value of the property's rentable building area, taken from the base property record. |  |

### CommercialPropertyResidence

Found at: `propertyResidence`

| Field | Type | Description | Values |
|---|---|---|---|
| `numBeds` | integer (nullable) | Number of bedrooms in the residence; a primary residential attribute. |  |
| `numBaths` | decimal (nullable) | Total number of bathrooms in the residence, fractional to allow half-baths. |  |
| `numFullBaths` | integer (nullable) | Count of full bathrooms (with shower or tub) in the residence. |  |
| `numHalfBaths` | integer (nullable) | Count of half bathrooms (toilet and sink only) in the residence. |  |
| `numGarageSpaces` | integer (nullable) | Number of garage parking spaces at the residence. |  |
| `numGarageSpacesPrecise` | decimal (nullable) | Redundant with numGarageSpaces and intended to be retired. |  |
| `ceilingHeightMainInFeet` | decimal (nullable) | Ceiling height of the main living level in feet; a desirability attribute. |  |
| `ceilingHeightUpperInFeet` | decimal (nullable) | Ceiling height of the upper level in feet for multi-level residences. |  |
| `isModelHome` | true/false (nullable) | Whether the residence is a builder's model/show home used to market a community rather than an occupied home. |  |
| `floorPlanId` | integer (nullable) | Foreign key to the shared floor-plan record defining this residence's layout. |  |
| `propertyId` | integer | Identifier of the residential property (single home or for-sale residence) this attribute set describes. |  |
| `residentialProfileId` | integer (nullable) | Foreign key to the parent residential/community profile the residence belongs to. |  |
| `unitNumber` | text (nullable) | Unit/building number label for the residence. |  |
| `garageEntryType` | integer (GarageEntryType) | Garage access/entry style for the residence (e.g. attached, detached, alley/front load). | 0 = Unknown, 1 = Front, 2 = Side, 3 = Rear |
| `homeParkingType` | integer (HomeParkingType) | Code parking arrangement available at the residence (garage, surface, covered). | 0 = Unknown, 10 = GarageAttached, 11 = GarageDetached, 20 = Carport |
| `builderExternalIdentifier` | text (nullable) | External builder/source-feed identifier for cross-referencing the residence to a builder's system. |  |

### CommercialPropertyNotes

Found at: `notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `noteType` | integer (NoteType) | A pre-defined categorization of note text, typically referred to as 'Notes' in CRM Enterprise. | see `NoteType` in Allowed values |
| `value` | text (nullable) | The body (free-text content) of the note. |  |
| `endYear` | integer (nullable) | Not populated in this dataset; expect null. |  |

### CommercialPropertyLand

Found at: `land`

| Field | Type | Description | Values |
|---|---|---|---|
| `landType` | integer (LandType) | Identifies the type of land (Commercial, Industrial, or Residential); landType supplies the property's secondary-type values for Land and underpins land-use classification. | 0 = Unknown, 1 = Residential, 2 = Commercial, 3 = Industrial, 4 = Agricultural |
| `areaMeasurementType` | integer (MeasurementUnit) | Structured land-size value (acreage/area with unit); the core size attribute for land valuation, per-acre metrics, and the Floor Area Ratio (FAR = GBA / Lot Size) denominator. Square-feet values are integers; other units allow up to two decimals. Unit of the gross land area; Unknown when no land size is recorded. | 0 = Unknown, 1 = SquareFeet, 2 = Acres, 3 = SquareMeters, 20 = Watt, 21 = Kilowatt, 22 = Megawatt |
| `grossArea` | decimal (nullable) | Structured land-size value (acreage/area with unit); the core size attribute for land valuation, per-acre metrics, and the Floor Area Ratio (FAR = GBA / Lot Size) denominator. Square-feet values are integers; other units allow up to two decimals. Gross land area value in its original unit with no unit conversion. |  |
| `netArea` | decimal (nullable) | Structured land-size value (acreage/area with unit); the core size attribute for land valuation, per-acre metrics, and the Floor Area Ratio (FAR = GBA / Lot Size) denominator. Square-feet values are integers; other units allow up to two decimals. Net land area value in its original unit with no unit conversion; its unit is not reported separately. |  |
| `improvementsDescription` | text (nullable) | Description of any improvements made to the land. Examples: rough graded, paved, curbs and sidewalks. |  |
| `topographyType` | integer (TopographyType) | Code describing the land's topography (e.g. level, sloping, rolling); topography affects developability, site-work cost, and buildable area. | 0 = Unknown, 1 = Level, 2 = Rolling, 3 = Sloping, 4 = Steep |
| `onSiteImprovementType` | integer (OnSiteImprovementType) | On-site improvements are refinements inside the lot boundaries that add to the land's development potential. | 0 = Unknown, 1 = AsphaltPavedLot, 2 = FinishGrade, 3 = FinishedLot, 4 = PreviouslyDevelopedLot, 5 = RawLand, 6 = RoughGraded |
| `zoningDescription` | text (nullable) | Description of the lot density the land is zoned for, commonly stated in units per acre (sometimes per square foot); a key entitlement/developability attribute for valuation. |  |
| `landName` | text (nullable) | The name of the land. |  |
| `maxDwellingUnitsAllowed` | integer (nullable) | The maximum number of dwelling units that can be built overall on this unit of land. |  |
| `currentUsageDescription` | text (nullable) | Describes how the land is currently being used. |  |
| `lengthInFeet` | decimal (nullable) | The length of the land, in feet. |  |
| `widthInFeet` | decimal (nullable) | The width of the land, in feet. |  |
| `isLotIrregular` | true/false (nullable) | Flag indicating whether the land is irregularly shaped. |  |
| `numberOfLots` | integer (nullable) | The number of lots on the unit of land. |  |
| `offSiteState` | integer (RecordStateType) (nullable) | Represents one of three states of off-site information for the land: 0 = nothing is known about off-site attributes; 1 = 'All To Site' (all off-site amenities are set up to service the land); 2 = 'All Needed' (no off-site amenities are set up to service the land). | 0 = Unknown, 1 = Yes, 2 = No |
| `proposedUses` | list of integers (ProposedLandUse) | Proposed/best-use designation for the parcel, guiding development potential and valuation; aligns with the hierarchical land-use code taxonomy used to classify primary land use. List of the proposed land-use values from each proposed-use entry. | see `ProposedLandUse` in Allowed values |
| `developmentApprovals` | list of integers (DevelopmentApprovalType) | Type of development approval/entitlement the land has obtained (e.g. zoning, permit, plat), indicating its shovel-readiness. Each row records one approval type held for the parcel. List of the approval types from each development-approval entry. | 0 = Unknown, 1 = Maps, 2 = Engineering, 3 = ApprovedPlan |
| `offSiteUtilityType` | integer (OffSiteUtilityType) | Represents one of three states of off-site information for the land: 0 = nothing is known about off-site attributes; 1 = 'All To Site' (all off-site amenities are set up to service the land); 2 = 'All Needed' (no off-site amenities are set up to service the land). Summarises off-site utilities: Unknown if the state is Unknown or unset; if Yes, AllToSite when every known improvement type is listed and Custom otherwise; if No, NoneToSite when none are listed and Custom otherwise. | 0 = Unknown, 1 = AllToSite, 2 = NoneToSite, 3 = Custom |
| `utilities` | list of CommercialPropertyLandOffSiteImprovement objects | Collection of off-site improvement records (utilities/roads reaching the site) describing development readiness. Off-site improvements from the land record. |  |
| `frontage` | list of CommercialPropertyFrontage objects | Collection of frontage records describing the land's road frontage; frontage and visibility are key land/retail-site attributes. |  |
| `offSiteImprovementExceptions` | list of CommercialPropertyLandOffSiteImprovementException objects | Collection of exceptions to off-site improvements (improvements not present/available to the site). |  |

### CommercialPropertyLandOffSiteImprovement

Found at: `land.utilities[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `offSiteImprovementType` | integer (OffSiteImprovementType) | Type of off-site improvement available to the land (e.g. roads, water, sewer, electric brought to site). | 0 = Unknown, 1 = Sewer, 2 = Water, 3 = Electricity, 4 = Gas, 5 = Streets, 6 = CurbGutterSidewalk, 7 = Cable, 8 = Telephone, 9 = Irrigation |
| `offSiteImprovementDescription` | text (nullable) | Free-text description of the off-site improvement and its status for the land parcel. |  |

### CommercialPropertyLandOffSiteImprovementException

Found at: `land.offSiteImprovementExceptions[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `offSiteImprovementType` | integer (OffSiteImprovementType) | Off-site improvement type explicitly noted as absent/excepted for the land (e.g. no sewer brought to site). Each row flags one off-site improvement that does not apply to the parcel. | 0 = Unknown, 1 = Sewer, 2 = Water, 3 = Electricity, 4 = Gas, 5 = Streets, 6 = CurbGutterSidewalk, 7 = Cable, 8 = Telephone, 9 = Irrigation |

### CommercialPropertyContact

Found at: `contacts[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `compOwners` | list of CommercialCompOwner objects | Collection of comparable-sale ownership references (comp and comp-contact IDs) linking this property contact to ownership records in sale comps; ownership/financial linkage. |  |
| `contactId` | integer (nullable) | Identifier of the contact (agent) for the space. The contact may not be known, but in that case the brokerage company must be known. |  |
| `contactPhoneNumber` | text (nullable) | Phone number of the contact. Particularly applicable to on-site contacts such as a property manager or building engineer. |  |
| `contactPhoneNumberCountryCode` | text (nullable) | Country dialing code for the property contact's phone number. |  |
| `contactPhoneNumberExt` | text (nullable) | Phone number extension for the contact. |  |
| `contactRole` | integer (ContactRole) | Role of the contact on the space; artificial primary key generated via IDENTITY. | see `ContactRole` in Allowed values |
| `endDate` | date-time (nullable) | Date the contact becomes obsolete/finished for the property. |  |
| `id` | integer | Artificial primary key for the property-contact record, generated via IDENTITY. |  |
| `locationId` | integer (nullable) | The brokerage company represented by the specified agent. When the agent/contact is unknown, the brokerage company alone suffices. The brokerage company may differ from the company that actually employs the agent. |  |
| `percentOwned` | integer (nullable) | Ownership percentage attributed to this contact for the property; only owner roles (TrueOwner/RecordedOwner) carry it, and combined ownership cannot exceed 100% per role. Prefer the true owner for ownership questions. |  |
| `preferredPhoneType` | integer (PhoneType) | Identifier for the preferred phone-number type, such as Contact Phone, Mobile, Fax, Other, or Override. | 0 = Unknown, 1 = Phone, 2 = Mobile, 3 = Fax, 4 = Other, 5 = Override |
| `startDate` | date-time (nullable) | Date the contact becomes valid/current for the property. Some contacts, such as a building's architect, will have no start or end date. |  |

### CommercialCompOwner

Found at: `contacts[].compOwners[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `compId` | integer | Identifier of the comp (sale/lease comparable) this ownership record belongs to; join on integer ID. Treated as 0 when the source value is missing. |  |

### CommercialPropertyEnvironmental

Found at: `environmental`

| Field | Type | Description | Values |
|---|---|---|---|
| `leedCertifications` | list of CommercialPropertyLeed objects | Collection of the property's LEED certification records (green-building certifications by level and period). |  |

### CommercialPropertyLeed

Found at: `environmental.leedCertifications[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `beginMonth` | integer | Month the LEED certification's validity period begins. |  |
| `beginYear` | integer | Year the LEED certification's validity period begins. |  |
| `endMonth` | integer | Month the LEED certification's validity period ends. |  |
| `endYear` | integer | Year the LEED certification's validity period ends. |  |
| `propertyLeedType` | integer (PropertyLeedType) | LEED certification level awarded (Certified, Silver, Gold, Platinum); LEED is the top-priority green scheme and the most recent certification is displayed as '[level] certified since [Month Year]'. | 0 = Unknown, 1 = LeedCertified, 2 = LeedCertifiedGold, 3 = LeedCertifiedPlatinum, 4 = LeedCertifiedSilver, 5 = LeedPreCertified, 6 = LeedRegistered |

### CommercialPropertyPropertyFloor

Found at: `floors[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `propertyFloorId` | integer | Number uniquely identifying a floor on any property. |  |
| `floorName` | integer (FloorName) | Name of the floor (for example Ground, Mezzanine or a floor number). | see `FloorName` in Allowed values |
| `floorSize` | CommercialPropertyPropertyFloorFloorSize object (nullable) | Gross floor area (GBA for the floor): total area including mezzanine and basements, measured from the exterior surfaces of the building's outside walls (whole building, including shafts/elevators). Unknown floors are Null and substitute the typical floor size when drawing the stack. Gross floor size of the floor; null when the floor has none. |  |

### CommercialPropertyPropertyFloorFloorSize

Found at: `floors[].floorSize`

| Field | Type | Description | Values |
|---|---|---|---|
| `squareFeet` | decimal (nullable) | Gross floor area (GBA for the floor): total area including mezzanine and basements, measured from the exterior surfaces of the building's outside walls (whole building, including shafts/elevators). Unknown floors are Null and substitute the typical floor size when drawing the stack. Square-foot value of the floor's gross floor size. |  |
| `source` | integer (DataSourceType) | Gross floor area (GBA for the floor): total area including mezzanine and basements, measured from the exterior surfaces of the building's outside walls (whole building, including shafts/elevators). Unknown floors are Null and substitute the typical floor size when drawing the stack. Source of the floor's gross floor size measurement. | see `DataSourceType` in Allowed values |

### CommercialPropertyPropertyResidence

Found at: `propertyPropertyResidence`

| Field | Type | Description | Values |
|---|---|---|---|
| `numBeds` | integer (nullable) | Number of bedrooms in the residence; a primary residential attribute. |  |
| `numBaths` | decimal (nullable) | Total number of bathrooms in the residence, fractional to allow half-baths. |  |
| `numFullBaths` | integer (nullable) | Count of full bathrooms (with shower or tub) in the residence. |  |
| `numHalfBaths` | integer (nullable) | Count of half bathrooms (toilet and sink only) in the residence. |  |
| `numGarageSpaces` | integer (nullable) | Number of garage parking spaces at the residence. |  |
| `numGarageSpacesPrecise` | decimal (nullable) | Redundant with numGarageSpaces and intended to be retired. |  |
| `ceilingHeightMainInFeet` | decimal (nullable) | Ceiling height of the main living level in feet; a desirability attribute. |  |
| `ceilingHeightUpperInFeet` | decimal (nullable) | Ceiling height of the upper level in feet for multi-level residences. |  |
| `isModelHome` | true/false (nullable) | Whether the residence is a builder's model/show home used to market a community rather than an occupied home. |  |
| `floorPlanId` | integer (nullable) | Foreign key to the shared floor-plan record defining this residence's layout. |  |
| `propertyId` | integer | Identifier of the residential property (single home or for-sale residence) this attribute set describes. |  |
| `residentialProfileId` | integer (nullable) | Foreign key to the parent residential/community profile the residence belongs to. |  |
| `unitNumber` | text (nullable) | Unit/building number label for the residence. |  |
| `garageEntryType` | integer (GarageEntryType) | Garage access/entry style for the residence (e.g. attached, detached, alley/front load). | 0 = Unknown, 1 = Front, 2 = Side, 3 = Rear |
| `homeParkingType` | integer (HomeParkingType) | Code parking arrangement available at the residence (garage, surface, covered). | 0 = Unknown, 10 = GarageAttached, 11 = GarageDetached, 20 = Carport |
| `builderExternalIdentifier` | text (nullable) | External builder/source-feed identifier for cross-referencing the residence to a builder's system. |  |

## Allowed values

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

### PropertySubtype

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Flex_LightManufacturing |
| 2 | Flex_RAndD |
| 3 | Flex_Showroom |
| 4 | GeneralRetail_AutoDealership |
| 5 | GeneralRetail_AutoRepair |
| 6 | GeneralRetail_Bank |
| 7 | GeneralRetail_Bar (also GeneralRetail_BarOrNightclub) |
| 8 | Specialty_CarWash |
| 9 | GeneralRetail_ConvenienceStore |
| 10 | GeneralRetail_DayCareCenter |
| 11 | GeneralRetail_DrugStore |
| 12 | GeneralRetail_FastFood |
| 13 | GeneralRetail_FuneralHome |
| 14 | GeneralRetail_Freestanding |
| 15 | GeneralRetail_GardenCenter |
| 16 | Specialty_ParkingGarage |
| 17 | Specialty_ParkingLot |
| 18 | GeneralRetail_Restaurant |
| 19 | GeneralRetail_ServiceStation |
| 20 | GeneralRetail_Storefront |
| 21 | GeneralRetail_StorefrontRetailOrOffice |
| 22 | GeneralRetail_StorefrontRetailOrResidential |
| 23 | GeneralRetail_Supermarket |
| 24 | GeneralRetail_TruckStop |
| 25 | GeneralRetail_VeterinarianOrKennel |
| 26 | HealthCare_AssistedLiving |
| 27 | HealthCare_CongregateSeniorHousing |
| 28 | HealthCare_ContinuingCareRetirementCommunity |
| 29 | HealthCare_Hospital |
| 30 | HealthCare_RehabilitationCenter |
| 31 | HealthCare_SkilledNursingFacility |
| 32 | Hospitality_Hotel |
| 35 | Specialty_Airport |
| 36 | Specialty_AirplaneHangar |
| 37 | Specialty_AutoSalvageFacility |
| 38 | Specialty_CementOrGravelPlant |
| 39 | Specialty_ChemicalOrOilRefinery |
| 40 | Industrial_TelecomFacility (also Industrial_TelecomHotelOrDataHosting) |
| 41 | Industrial_Distribution |
| 42 | Industrial_FoodProcessing |
| 43 | Specialty_Landfill |
| 44 | Industrial_Manufacturing |
| 45 | Specialty_RailroadYard |
| 46 | Industrial_RefrigerationOrColdStorage |
| 47 | Specialty_SelfStorage |
| 48 | Specialty_Shipyard |
| 49 | Industrial_Showroom |
| 50 | Industrial_TruckTerminal |
| 51 | Specialty_UtilitySubStation |
| 52 | Industrial_Warehouse |
| 53 | Specialty_WaterTreatmentFacility |
| 57 | MixedUse |
| 58 | MultiFamily_Apartments |
| 62 | MultiFamily_ManufacturedHousingOrMobileHomePark |
| 63 | Office_LoftOrCreativeSpace |
| 64 | Office_Medical |
| 72 | Specialty_CemeteryOrMausoleum |
| 73 | Specialty_CorrectionalFacility |
| 74 | Specialty_LodgeOrMeetingHall |
| 75 | Specialty_Marina |
| 76 | Specialty_MovieOrRadioOrTVStudio |
| 77 | Specialty_PoliceOrFireStation |
| 78 | Specialty_PostOffice |
| 79 | Specialty_PublicLibrary |
| 80 | Specialty_RadioOrTVTransmissionFacilities |
| 81 | Specialty_ReligiousFacility |
| 82 | Specialty_Schools |
| 83 | Specialty_TrailerOrCamperPark |
| 84 | Specialty_WineryOrVineyard |
| 85 | SportsAndEntertainment_AmusementPark |
| 86 | SportsAndEntertainment_BaseballField |
| 87 | GeneralRetail_BowlingAlley |
| 88 | SportsAndEntertainment_Casino |
| 89 | SportsAndEntertainment_GolfCourseOrDrivingRange |
| 90 | GeneralRetail_HealthClub |
| 91 | SportsAndEntertainment_HorseStables |
| 92 | GeneralRetail_MovieTheatre |
| 93 | SportsAndEntertainment_RaceTrack |
| 94 | SportsAndEntertainment_SkatingRink |
| 95 | SportsAndEntertainment_SwimmingPool |
| 96 | SportsAndEntertainment_TheaterOrConcertHall |
| 97 | Industrial_Service |
| 98 | Office_TelecomHotelOrDataHosting |
| 99 | Flex_TelecomHotelOrDataHosting |
| 104 | Flex_LightDistribution |
| 105 | Specialty_WaterRetentionFacility |
| 106 | Specialty_SororityOrFraternityHouse |
| 108 | Specialty_Shelter |
| 109 | Specialty_RecyclingCenter |
| 110 | Office_OfficeOrResidential |
| 112 | Office_OfficeLiveOrWorkUnit |
| 113 | Specialty_Lumberyard |
| 114 | Office_IndustrialLiveOrWorkUnit |
| 115 | Specialty_DriveinMovie |
| 116 | GeneralRetail_DepartmentStore |
| 117 | Specialty_ContractorStorageYard |
| 118 | Office_BusinessPark |
| 119 | Office_CallCenter |
| 120 | Office_D1 |
| 121 | Office_D2 |
| 122 | Office_ServicedOffices |
| 123 | Flex_Bank |
| 124 | Flex_BusinessPark |
| 125 | Flex_Cafe |
| 126 | Flex_FoodCourt |
| 127 | Flex_MixedRetail |
| 128 | Flex_OutletCenter |
| 129 | Flex_PublicHouse |
| 130 | Flex_RetailOutofTown |
| 131 | Flex_SuperRegional |
| 132 | Flex_TradeCounterOrPark |
| 133 | SportsAndEntertainment_AllLeisure |
| 134 | SportsAndEntertainment_FitnessCenter |
| 135 | SportsAndEntertainment_NightClub |
| 136 | Specialty_Conference |
| 137 | Specialty_OfficeandIndustrial |
| 139 | Industrial_LightIndustrial |
| 142 | HealthCare_IndependentLiving |
| 143 | MultiFamily_Dormitory |
| 144 | Specialty_ResidentialIncome |
| 145 | Office_OfficeBuilding |
| 146 | GeneralRetail_RetailBuilding |
| 147 | GeneralRetail_QuickService |
| 148 | Hospitality_ServicedApartment |
| 149 | Hospitality_Hostel |
| 150 | Hospitality_BedandBreakfast |
| 151 | Residential_SingleFamily |
| 152 | Residential_Townhome |
| 153 | Residential_Duplex |
| 154 | Residential_Triplex |
| 155 | Residential_Quadplex |
| 156 | DataCenter |

### ConstructionEventType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | GroundBreaking |
| 2 | ConstructionComplete |
| 3 | RenovationBegun |
| 4 | RenovationFinished |
| 5 | CommonAreaRenovated |
| 6 | Demolished |
| 7 | Converted |
| 10 | FinalPlanningBegun |
| 12 | Abandoned |
| 13 | Deferred |
| 14 | Proposed |
| 15 | RedevelopmentBegun |
| 16 | RedevelopmentComplete |
| 17 | Redeveloped |

### AttachmentType

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
| 63 | ProfileCoverDesktop (also CoverPhoto, ProfileCoverDesktopResidential) |
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
| 90 | PropertyGuideVideoClip (also CondoBuildingVideoClip) |
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
| 113 | CommunityCollectionPhoto (also CommunityProjectImage, CommunityProjectPhoto) |
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
| 133 | MatterportCommunityThumbnailVideo |
| 134 | CommonAreaPhoto |
| 135 | RawPhoto |

### AttachmentTypeExtension

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
| 74 | Cr2 |
| 75 | Cr3 |
| 76 | Nef |
| 77 | Arw |
| 78 | Dng |

### ExternalReferenceType

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

### AttachmentType2

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
| 68 | ProfileCoverMobile (also ProfileCoverMobileResidential) |
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
| 90 | PropertyGuideVideoClip (also CondoBuildingVideoClip) |
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
| 113 | CommunityProjectPhoto (also CommunityProjectImage, CommunityCollectionPhoto) |
| 114 | FieldLeadSignPhoto |
| 115 | CommunityPhoto (also CommunityImage) |
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
| 133 | MatterportCommunityThumbnailVideo |
| 134 | CommonAreaPhoto |
| 135 | RawPhoto |
| 136 | StatementOfInformation |
| 137 | MatterportAerialPlusInteriorXray |
| 138 | MatterportAerialExteriorOnly |

### ExternalReferenceType2

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
| 235 | AvidBuilderReviews |
| 236 | NabersRatingPremiseId |
| 237 | CommercialListingFeedAUS |
| 238 | CommercialListingFeedWebCrawl |
| 239 | CommercialListingDeconsolidationPropertyID |

### UtilitySubType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | CityWater |
| 2 | CountyWater |
| 3 | WellWater |
| 4 | NaturalGas |
| 5 | PropaneGas |
| 6 | ElectricHeating |
| 7 | GasHeating |
| 8 | OilFiredHeating |
| 9 | OilSteamHeating |
| 10 | FluorescentLighting |
| 11 | IncandescentLighting |
| 18 | CitySewer |
| 19 | CountySewer |
| 20 | SepticFieldSewer |
| 21 | MetalHalideLighting |
| 22 | SodiumLighting |
| 23 | MercuryLighting |
| 24 | VaporLighting |
| 25 | HalogenLighting |
| 26 | HalideLighting |
| 27 | LEDLighting |

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

### ResidentialParkingType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | SurfaceLot |
| 3 | CoveredLot |
| 4 | Street |
| 5 | Garage |
| 7 | Other |
| 8 | Carport |
| 9 | CompactCar |
| 10 | ElectricVehicleParking |
| 11 | GarageAttached |
| 12 | GarageDetached |
| 13 | Handicap |
| 14 | Motorcycle |
| 15 | Oversized |
| 16 | Parking |
| 17 | Tandem |
| 18 | Valet |
| 19 | GuestParking |

### NonstandardApartmentRoomType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Den |
| 2 | Study |
| 3 | Other |
| 4 | Bachelor |
| 5 | Efficiency |
| 6 | Junior |
| 7 | Loft |
| 8 | Office |
| 9 | Retail |
| 10 | Single |
| 11 | Studio |
| 12 | Townhouse |
| 13 | AlcoveStudio |
| 14 | Convertible |
| 15 | Penthouse |
| 16 | Condos |

### PropertyGroupSubtype

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | AirportRetail |
| 2 | CommunityCenter |
| 3 | LifestyleCenter |
| 4 | NeighborhoodCenter |
| 5 | OutletCenter |
| 6 | PowerCenter |
| 7 | RegionalMall |
| 8 | ThemeFestivalCenter |
| 9 | StripCenter |
| 10 | SuperRegionalMall |
| 11 | RegionalPrime |
| 12 | MajorUrbanCentre |
| 13 | UrbanCentre |
| 14 | District |
| 15 | SolusUnit |
| 16 | ShoppingPark |
| 17 | RetailPark |
| 18 | LeisurePark |
| 19 | OfficePark |
| 20 | IndustrialPark |

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

### ProposedLandUse

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Commercial |
| 2 | Industrial |
| 3 | Retail |
| 4 | Office |
| 5 | MixedUse |
| 6 | Multifamily |
| 7 | Hospitality |
| 8 | AirplaneHangar |
| 9 | Airport |
| 10 | ApartmentUnits |
| 11 | ApartmentUnitsCondo |
| 12 | ApartmentUnitsDorms |
| 13 | ApartmentUnitsSenior |
| 14 | ApartmentUnitsSubsidized |
| 15 | AutoDealership |
| 16 | AutoRepair |
| 17 | AutoSalvageFacility |
| 18 | Bank |
| 19 | Bar |
| 20 | BaseballField |
| 21 | BowlingAlley |
| 22 | Carwash |
| 23 | Casino |
| 24 | CementGravelPlant |
| 25 | CemeteryMausoleum |
| 26 | ChemicalOilRefinery |
| 27 | CommunityCenter |
| 28 | ContractorStorageYard |
| 29 | ConvenienceStore |
| 30 | CorrectionalFacility |
| 31 | DaycareCenter |
| 32 | DepartmentStore |
| 33 | Distribution |
| 34 | Drugstore |
| 35 | FastFood |
| 36 | FoodProcessing |
| 37 | FuneralHome |
| 38 | GardenCenter |
| 39 | GeneralFreestanding |
| 40 | GolfCourseDrivingRange |
| 41 | Healthcare |
| 42 | HealthClub |
| 43 | HoldForDevelopment |
| 44 | HoldForInvestment |
| 45 | HorseStables |
| 46 | Hospital |
| 47 | Hotel |
| 48 | IndustrialLiveWorkUnit |
| 49 | IndustrialPark |
| 50 | Landfill |
| 51 | LodgeMeetingHall |
| 52 | LoftCreativeSpace |
| 53 | Lumberyard |
| 54 | ManuftrdHmsMoblHmPrk |
| 55 | Marina |
| 56 | MasterPlannedCommunity |
| 57 | Medical |
| 58 | Motel |
| 59 | MovieTheater |
| 60 | MovieRadioTVStudio |
| 61 | NeighborhoodCenter |
| 62 | OfficePark |
| 63 | OpenSpace |
| 64 | OutletCenter |
| 65 | ParkingGarage |
| 66 | ParkingLot |
| 67 | PlannedUnitDevelopment |
| 68 | PoliceFireStation |
| 69 | PostOffice |
| 70 | PowerCenter |
| 71 | PublicLibrary |
| 72 | PublicPark |
| 73 | PublicSwimmingPool |
| 74 | RAndD |
| 75 | RaceTrack |
| 76 | RadioTVTransmnFacility |
| 77 | RailroadYard |
| 78 | RecyclingCenter |
| 79 | RefrigerationColdStor |
| 80 | RegionalMall |
| 81 | RehabilitationCenter |
| 82 | ReligiousFacility |
| 83 | Restaurant |
| 84 | RetailWarehouse |
| 85 | Schools |
| 86 | SelfStorage |
| 87 | ServiceStation |
| 88 | Shelter |
| 89 | Shipyard |
| 90 | SingleFamilyDevelopment |
| 91 | SkatingRink |
| 92 | SpcltyFestvlEntertnmnt |
| 93 | Storefront |
| 94 | StorefrontRetailOffice |
| 95 | StorefrntRetailResidntl |
| 96 | StripCenter |
| 97 | Supermarket |
| 98 | TheaterConcertHall |
| 99 | TrailerCamperPark |
| 100 | TruckStop |
| 101 | TruckTerminal |
| 102 | UnknownProposedLandUse |
| 103 | UtilitySubStation |
| 104 | VeterinarianKennel |
| 105 | Warehouse |
| 106 | WaterRetentionFacility |
| 107 | WaterTreatmentFacility |
| 108 | WineryVineyard |
| 109 | AmusementPark |
| 110 | Agricultural |
| 111 | Agribusiness |
| 112 | PastureRanch |
| 113 | Timberland |
| 114 | SingleFamilyResidence |
| 115 | DataCenters |

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

### DataSourceType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | TaxRecord |
| 2 | BuildingContact |
| 3 | TenantUpdateCall |
| 4 | FieldResearcher |
| 5 | System |
| 6 | Broker |
| 7 | Buyer |
| 8 | CoStarMarketEstimate |
| 9 | BomaGuidelines |
| 10 | Infogroup (also DataAxle) |
| 11 | CoStarResearch |
| 12 | ResearchUpdate |
| 13 | NcoaUpdate |
| 14 | AcsUpdate |
| 15 | CrmResearch |
| 16 | Nrb |
| 17 | Adc |
| 18 | AerialImage |
| 19 | Focus |
| 20 | UnitedKingdomMigration |
| 21 | CommunityCaller |
| 22 | UserEntry |
| 23 | ListingFeed |
| 24 | GoSell |
| 25 | DunAndBradstreet |
| 26 | HmLandRegistry |
| 27 | Factual (also Foursquare, FoursquareV1) |
| 28 | Creditsafe |
| 29 | Intex |
| 30 | Emporis |
| 31 | HospitalityFeed |
| 32 | Doorda |
| 33 | TenX |
| 34 | ComunidadDeMadrid |
| 35 | GreatSchools |
| 36 | InstituteOfMuseumAndLibraryServices |
| 37 | MorningStar |
| 38 | Sirene |
| 39 | Badger |
| 40 | Niche |
| 41 | CreditSafeWorldwide |
| 42 | Precisely |
| 43 | LocationsWithoutOccupancy |
| 44 | FoursquareV2 |
