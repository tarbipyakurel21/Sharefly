# CoStar real estate data kit

This kit holds CoStar data for the homes and commercial buildings on CoStar's Matterport 3D capture list in Houston and Los Angeles. It has eight datasets: commercial properties, the commercial listings, tenancies and sales on those properties, the tenant companies, the rental listings of the apartment communities, residential listings for homes, and the feature text of those residential listings. Read this page first, then the model page for the dataset you are working with.

## What is in the kit

| Path | What it is |
|---|---|
| `index.md` | This page: the datasets, how they connect, and where to read more |
| `commercial-properties.csv` | The starter list of commercial properties: PropertyId, MatterportModelId, Address, City, State |
| `residential-listings.csv` | The starter list of home listings: ListingId, ResidentialListingId, MatterportModelId, Address, City, State |
| `data/` | The data, one JSON Lines file per dataset (`data/<dataset>.jsonl`): one record per line |
| `tools/expand_records.py` | Writes the records out as one pretty-printed JSON file each, for browsing (see "Reading the data") |
| `models/` | One page per dataset: what a record is, how to use it, and every field with its meaning and allowed values |
| `concepts/` | Real estate background: terms, formulas, property types, apartments, leasing, tenants, sale comps, residential sales, geography, valuation, hotels and land, data quality |
| `schemas/openapi.yaml` | OpenAPI 3.0 definitions of all eight record types, including every nested object and enum |
| `schemas/<dataset>.schema.json` | The same definitions as JSON Schema (draft 2020-12), one file per dataset. Every record in `data/` validates against its schema |
| `schemas/enums.json` | Every integer enum as a lookup from value to name |

## The starter files

The two CSV files list every property and home in the kit with its Matterport 3D models. There is one row per key and
model, so a property scanned several times has several rows. `MatterportModelId` is the Matterport model id of the
scan.

- `commercial-properties.csv`: 13,147 rows for 3,339 properties. 51 properties have no model and have one row with an
  empty `MatterportModelId`.
- `residential-listings.csv`: 2,224 rows for 2,120 MLS listings of 1,867 homes. One listing (231305778) has no model
  and has one row with an empty `MatterportModelId`.
  `ResidentialListingId` groups the listings of one sale or rental of a home, so a home listed in more than one MLS has several listing ids.
- `Address`, `City` and `State` are built from the property's `primaryAddress` or the listing's `property.address`
  in `data/`. The residential address includes the unit number, and is empty for 4 listings whose street address is
  hidden from the public.
- Join `PropertyId` to `id` in `data/commercial-property.jsonl`, and `ListingId` to `id` in
  `data/residential-listings.jsonl`.
- The same model ids appear in the data as `videoKey` on Matterport attachments and media (see "How the datasets
  connect"). Join on the key and the model id together. Every model id in the CSVs appears in the key's records: the
  property's record or one of its listings, or the listing's `media`.
- How to connect to the Matterport models is provided in a separate zip file.

## The datasets

| Dataset | File | Records | One record is | Key | Model page |
|---|---|---|---|---|---|
| Commercial property | `data/commercial-property.jsonl` | 3,339 | One building or property: location, market and submarket, type, size, construction, and type-specific attributes (office, retail, industrial, flex, hotel, apartments, land) | `id` (the PropertyId) | [models/commercial-property.md](models/commercial-property.md) |
| Commercial listing summary | `data/commercial-listing-summary.jsonl` | 1,022 | One marketing listing on one of the properties: space for lease, or a property, condo, portfolio or land for sale | `id` (the listing id) | [models/commercial-listing-summary.md](models/commercial-listing-summary.md) |
| Location occupancy | `data/location-occupancy.jsonl` | 74,093 | One tenancy: a company occupying space in one of the properties for a period, with its lease deal when one is recorded | `id` | [models/location-occupancy.md](models/location-occupancy.md) |
| Company detail | `data/company-detail.jsonl` | 49,575 | One tenant company location: one office or site of a company that occupies or occupied space in one of the properties, with its name, address, employee count, industry and company profile | `id` (the `tenantLocationId` of location-occupancy) | [models/company-detail.md](models/company-detail.md) |
| Commercial sale comp | `data/commercial-sale-comp.jsonl` | 6,120 | One completed sale that includes one of the properties | `id` | [models/commercial-sale-comp.md](models/commercial-sale-comp.md) |
| Apartment listing | `data/apartment-listing.jsonl` | 1,747 | One apartment community's active rental listing, as marketed on Apartments.com: asking rents and units available for the community and for each floor plan, with the management company and the main photo | `id`; one record per `propertyId` | [models/apartment-listing.md](models/apartment-listing.md) |
| Residential listings | `data/residential-listings.jsonl` | 2,120 | One MLS listing of a home for sale or rent, as the Homes.com listing page sees it: current, sold in the last year, or off market | `id` (the MLS listing id) | [models/residential-listings.md](models/residential-listings.md) |
| Residential listing features | `data/residential-listing-features.jsonl` | 1,899 | The feature text of one residential listing: its highlights, its feature sentences grouped by section (Kitchen, Parking, Schools and so on), every feature with its value and source, and totals such as bedrooms and HOA fees | `id` (the MLS listing id) | [models/residential-listing-features.md](models/residential-listing-features.md) |

## How the datasets connect

| From | Field | To |
|---|---|---|
| Commercial listing | `propertyId` | Commercial property `id` |
| Commercial listing (building-park and shopping-center lease listings) | `forLeaseSummary.properties[].id` | Commercial property `id` |
| Commercial listing space | `forLeaseSummary.spaces[].propertyId` | Commercial property `id` |
| Commercial listing | `propertyGroupId` | Commercial property `propertyGroupId` |
| Location occupancy | `propertyId` | Commercial property `id` |
| Location occupancy | `tenantLocationId` | Company detail `id` (57,225 of 74,093 occupancies; a null `tenantLocationId` is an unknown tenant) |
| Commercial sale comp | `entities[].propertyId` | Commercial property `id` |
| Apartment listing | `propertyId` | Commercial property `id` (one listing per community; 1,747 of the 2,765 apartment communities) |
| Apartment listing | `apartmentModels[].id` | Commercial property `propertyApartment.models[].id` (23,755 of 23,806 floor plans) |
| Apartment listing | `propertyManagementCompanyId` | Company detail `id` (1,072 of 1,747 listings) |
| Residential listing features | `id` | Residential listing `id` (one to one; 221 listings have no features record) |
| Commercial property Matterport attachment | `id` with `attachments[].videoKey`, `propertyApartment.models[].attachments[].videoKey` or `propertyApartment.models[].units[].attachments[].videoKey` | `commercial-properties.csv` `PropertyId` and `MatterportModelId` |
| Commercial listing Matterport attachment | `propertyId` with `attachments[].videoKey` | `commercial-properties.csv` `PropertyId` and `MatterportModelId` |
| Residential listing Matterport media | `id` with `media[].videoKey` | `residential-listings.csv` `ListingId` and `MatterportModelId` |

An attachment or media item is a Matterport model when its `videoExternalReferenceType` (or, on residential media,
`externalReferenceType`) is 36 (MatterportScan) or 234 (MatterportStreamingKey). Commercial attachments are only
Matterport scans and still images. On residential media, other values name other tour and video hosts.

Commercial geography lives on the property: `primaryAddress` (with latitude and longitude), `primaryAddress.researchMarketId`
and `primarySubmarketId`. Join a listing, tenancy or sale to its property to place it in a market or submarket.
Residential listings carry their own `property.address`, with latitude and longitude. Compare homes and commercial
buildings by location.

## Scope

- **Commercial properties:** the 3,339 properties on CoStar's Matterport list: 1,758 in the Houston research market (14)
  and 1,581 in Los Angeles (20). `commercial-properties.csv` lists them with their Matterport models.
- **Commercial listings:** the Active (741) and OffMarket (281) listings on those properties; 629 of the properties have
  one. None of them has a hidden (suppressed) address.
- **Location occupancies:** every tenancy recorded on those properties.
- **Company details:** the 49,575 company locations named as tenants by those occupancies, current or past.
- **Commercial sale comps:** the 6,120 sales that include one of those properties. A portfolio sale can include
  properties outside the list.
- **Apartment listings:** the active Apartments.com listing of 1,747 of the 2,765 apartment communities (980 in Houston,
  767 in Los Angeles), with asking rents and units available by floor plan, the management company and a link to the
  main photo.
- **Residential listings:** the 2,120 MLS listings on CoStar's Matterport list in Houston and Los Angeles, for 1,867
  homes. `residential-listings.csv` lists them with their Matterport models. 793 are current (Active or Contract),
  1,321 sold or were rented between 2025-11-10 and 2026-11-09, and 6 are inactive or removed. 228 of them are not
  shown to the public on Homes.com; `permissionLevels.homes` tells them apart.
- **Residential listing features:** the feature text of 1,899 of those listings. The 221 listings from MLS 2099 (listings
  Homes.com shows to no one) and MLS 800000 (CoStar's photo-shoot placeholders) have none.
- **Commercial records carry their contacts**, including the names of brokers, agents and other contacts. Property and
  listing attachments are still images and Matterport scans; sale comps and lease deals carry no attachments.
- **Photos open from the data.** Every published attachment on a commercial property or listing that has a file
  location, and the main photo of every apartment listing, carries `attachmentUri`, a link to the image on CoStar's CDN, at size 112 (up to 1,880 by 900 pixels). Replace the `/112/` segment with another size id, such as 113 (1,400×720) or 116 (2,048×2,048),
  for another size.
- **Residential listings are what a visitor to Homes.com sees.** Sold homes in Texas, a non-disclosure state, carry
  their asking prices and no sale price, as on Homes.com. Agent names and every Matterport tour are included.
- **Email addresses and phone numbers are fake** in every dataset, in contact fields and in free text such as notes
  and agent bios. Emails read `contact-<code>@example.com`, and phone numbers use area code 555 and keep their
  original formatting. The same real value always gets the same fake one across every dataset, so you can still
  count, group and join by them.

## Reading the data

- Each file in `data/` is one dataset in JSON Lines format: one JSON record per line, in the shape the schemas
  describe. Load a file with `pandas.read_json(path, lines=True)`, DuckDB's `read_json_auto`, `jq -c`, or a loop
  that runs `json.loads` on each line. Records keep their nested objects and lists, so `pandas.json_normalize` is
  useful for flattening.
- **To browse records one at a time,** run `python3 tools/expand_records.py` from the kit folder. It needs Python 3
  and nothing else, and writes each record to `records/<dataset>/<id>.json`, pretty-printed (location occupancies
  go in one subfolder per `propertyId`, as `records/location-occupancy/<propertyId>/<id>.json`). Name datasets to
  write only those, such as `python3 tools/expand_records.py residential-listings`. All eight datasets make about
  140,000 files and 1 GB, and take a few minutes.
- Field names are camelCase, and records keep their nested objects and lists.
- **Enums are stored as integers.** Decode them with `schemas/enums.json` or the tables on each model page.
  `0` is usually `Unknown` or `None`. The only exception is geometry `type` (for example `"LineString"`), which is stored
  as text, as in GeoJSON. Agent roles on residential listings are bit flags that add up, such as 9 = 1 + 8.
- A missing or `null` field means the value is not known or does not apply. Type-specific blocks, such as a
  property's `propertyOffice` or a listing's `forSaleSummary`, are null when they do not apply.
- Commercial areas are in square feet unless a field says otherwise. Residential lot size is in acres
  (`property.lotSizeAcresMin`).
  Money is in US dollars, except where a record's `monetaryUnit` says otherwise. Three Houston records name
  Canadian dollars (2), and 3 commercial listings and 82 apartment listings have 0 (Unknown).
  Residential rentals and apartment listings give monthly rent.

## Where to start

- New to commercial real estate? Read [concepts/glossary.md](concepts/glossary.md), then
  [concepts/metrics-and-formulas.md](concepts/metrics-and-formulas.md).
- Working with commercial properties? Most of them are apartment communities: 2,765 of 3,339. Read
  [concepts/apartments.md](concepts/apartments.md), and split by `propertyType` before totaling anything. For asking
  rents and units available by floor plan, join [models/apartment-listing.md](models/apartment-listing.md) on `propertyId`.
- Working with homes? Read [concepts/residential-listings-and-sales.md](concepts/residential-listings-and-sales.md),
  then the "Using this data" section of [models/residential-listings.md](models/residential-listings.md). Split
  sales from rentals and current from sold before comparing prices. For a home's features as text (appliances,
  parking, pool, schools, HOA fees), join [models/residential-listing-features.md](models/residential-listing-features.md)
  on `id`.
- Working with asking rents? Read the "Using this data" section of the commercial listing page first. Rents must be
  put on the same basis ($/SF/year, same service type) before they are compared, and a rate of 0 means no rate was given.

| Concept page | Covers |
|---|---|
| [glossary.md](concepts/glossary.md) | The terms that come up most often |
| [metrics-and-formulas.md](concepts/metrics-and-formulas.md) | Rent normalization, weighted averages, area ratios, vacancy and absorption, NOI and cap rate, with worked examples |
| [property-types-and-building-measurement.md](concepts/property-types-and-building-measurement.md) | Property types and subtypes, building class and rating, lifecycle status, GBA vs RBA |
| [apartments.md](concepts/apartments.md) | Apartment communities: floor plans, unit mix, building style, rent type and affordability, vacancy, asking rents, and where apartments appear in the other datasets |
| [listings-and-leasing.md](concepts/listings-and-leasing.md) | Listing types, how space is marketed, service types, lease terms |
| [tenants-and-occupancy.md](concepts/tenants-and-occupancy.md) | Tenancy records, occupancy vs vacancy and availability, lease expirations, and the companies behind the tenancies |
| [sale-comps-and-pricing.md](concepts/sale-comps-and-pricing.md) | Sale comps, portfolio sales, sale price and its status, choosing comparable sales, buyers and sellers |
| [residential-listings-and-sales.md](concepts/residential-listings-and-sales.md) | MLS listings, the life of a home listing, price and market measures, comps, agents, home types |
| [geography-and-markets.md](concepts/geography-and-markets.md) | The two markets in this dataset, where places are in the data, and markets and submarkets vs cities, counties and ZIP codes |
| [valuation-and-income.md](concepts/valuation-and-income.md) | The income approach, cap rates and returns, for reading asking prices and marketed NOI |
| [hotels-and-land.md](concepts/hotels-and-land.md) | Hotels (rooms, ADR, chain scale) and land |
| [data-quality-and-confidence.md](concepts/data-quality-and-confidence.md) | How to qualify answers built on estimated, missing or inconsistent values |
