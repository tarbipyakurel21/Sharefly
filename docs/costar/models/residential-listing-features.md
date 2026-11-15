# Residential Listing Features

A residential listing features record is the feature text of one residential listing: the highlights, the feature sentences grouped by section, every feature with its value and source, and summary totals. It is the "details" part of the Homes.com listing page, as text you can read, search and count. Each record joins to one record in residential-listings on `id`.

## What this record is

Homes.com describes a home's features through CoStar's residential feature catalog. The catalog has about 4,800 features, each with an id, a display name and a place in a category tree. A listing carries the ids of the features it has, and Homes.com turns them into display sentences.

- **`sections` is what a visitor reads.** Each line is one display sentence, such as `3 Carport Spaces` or `$4,047 Total Annual Tax in 2023`, or the name of a feature that has no sentence, such as `Corner Lot`. Lines are grouped under headings such as Kitchen, Parking and Schools.
- **Homes.com shows about six highlights.** `highlights` holds them all, so take the first few for a short list.
- **`features` is the structured form.** Use it to filter and count: every listing with a pool, the share of homes with a gas cooktop, the median annual tax. `id` is stable across listings, so group by `id` rather than by `name`.
- **`highlights` are the standouts.** They are the short list Homes.com shows at the top of the listing page.
- **`derivedValues` are totals** such as total bedrooms, bathrooms, parking spaces and monthly HOA fees, worked out from the features.
- **The same facts can appear in residential-listings** in coded form: `resoValues`, `costarFeatureValues` and `specialFeatures` there are bit flags and enum codes. This dataset gives them as text.

## Using this data

- **Join on `id`** to residential-listings to get the price, status, address and media of the same listing.
- **Search `sections` for text questions.** For example, find listings whose Pool section has `Saltwater Pool`, or whose Views section has `City Lights`.
- **Use `features` for counts.** A feature with no `boolValue`, `doubleValue` or `stringValues` is simply present. Check `boolValue` on yes/no features, because `false` means the home does not have it.
- **Know where a feature came from.** `source` is `Mls` for 99.5% of feature uses. The other 572, on 430 listings, are `MachineLearning`: features a CoStar model read from the remarks or photos, such as `Soaking Tub` or `Vaulted Ceiling`. Leave them out when you want MLS facts only.
- **Amounts are in US dollars.** Fee amounts are in `doubleValue`, and `frequency` says how often they are paid. `derivedValues.totalMonthlyAssociationFees` puts HOA fees on a monthly basis.
- **Rentals carry rental terms.** For a rental, the Listing and Financial Details section holds lines such as security deposit, lease term and date available.
- **Formats.** Numbers in `sections[].lines` carry thousands separators and money carries `$`, such as `$4,047 Total Annual Tax in 2023`. Dates are month/day/year, such as `Available 8/12/26`. Sections, lines, features and highlights are in Homes.com display order.
- **`features` and `sections` do not match one to one.** A few features have no line in `sections`: utility connections such as `Public Sewer` and `Water Connected`, `No Common Walls`, and the combined bedrooms-and-bathrooms sentence. A line that repeats within a section appears once.

## What is in this dataset

- **Which listings:** 1,899 of the 2,120 listings in residential-listings, 1,760 for sale and 139 for rent, 1,619 in Texas and 280 in California.
- **Not covered:** the 221 listings from MLS 2099 (128 listings in California) and MLS 800000 (81 in Texas and 12 in California) have no record. MLS 800000 is CoStar's placeholder listings for scheduling a photo shoot.
- **Size:** a median of 59 features, 46 lines and 18 highlights per listing. 1,009 distinct features appear.
- **Fake contact details:** HOA, association and builder phone numbers are fake, in area code 555 with the original formatting, the same fake for the same real number as in the other datasets.

## Joining to other models

Join on integer ids, never on names.

- `id` joins to `residential-listings` `id` and to `ListingId` in `residential-listings.csv`. It is unique in the file.
- `features[].id` is the same feature on every listing, so group and count by it rather than by `features[].name`.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### ResidentialListingFeatures (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the MLS listing, the same as `id` in residential-listings. Each record in this file is the feature text of one listing. |  |
| `highlights` | list of ResidentialListingFeatureHighlight objects | The listing's highlights in display order: the short list of standout features Homes.com shows at the top of the listing page. |  |
| `sections` | list of ResidentialListingFeatureSection objects | The listing's details as display lines, grouped by category and subcategory in display order. This is the details section of the Homes.com listing page: every feature sentence, plus every feature with no sentence under its own name. |  |
| `features` | list of ResidentialListingFeature objects | Every feature on the listing, one entry per feature, in display order. A feature with no value is simply present. |  |
| `derivedValues` | ResidentialListingDerivedValues object | Totals and summary values worked out from the features. |  |

### ResidentialListingFeatureHighlight

Found at: `highlights[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `text` | text | The highlight as Homes.com shows it, such as `RV Access or Parking` or `0.49 Acre Lot`. |  |
| `kind` | text | What the highlight is about: `feature` (a feature of the home or community), `lot` (lot size), `hoa` (`No HOA`) or `nearby` (a short walk to a park). |  |

### ResidentialListingFeatureSection

Found at: `sections[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `category` | text (nullable) | The top-level group: `Inside This Home` or `Community Details`. |  |
| `subcategory` | text (nullable) | The group within the category, such as `Kitchen`, `Parking`, `Schools` or `Listing and Financial Details`. |  |
| `lines` | list of text values | The display lines of the group, such as `Gas Cooktop`, `3 Carport Spaces`, `4 Bedrooms \| 2 Main Level Bedrooms` or `$4,047 Total Annual Tax in 2023`. A line appears once per group. |  |

### ResidentialListingFeature

Found at: `features[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the feature in CoStar's residential feature catalog. The same id means the same feature on every listing. |  |
| `name` | text | The feature's display name, such as `Dishwasher` or `Annual Tax Amount`. |  |
| `category` | text (nullable) | The top-level group of the feature: `Inside This Home` or `Community Details`. |  |
| `subcategory1` | text (nullable) | The group within the category, the same groups as `sections.subcategory`. |  |
| `subcategory2` | text (nullable) | A finer group within `subcategory1`. Some names are internal labels, such as `Hidden Utilities`. |  |
| `source` | text | Where the feature came from: `Mls` (the listing's MLS data), `MachineLearning` (read from the listing's remarks or photos by a CoStar model), `Research` or `ComputerVision`. |  |
| `inSentence` | true/false | Whether a feature sentence shows the feature. A feature with no sentence appears in `sections` under its own name, unless Homes.com hides it, as it does utility connections. |  |
| `boolValue` | true/false (nullable) | The feature's yes or no value, on yes/no features only. |  |
| `doubleValue` | decimal (nullable) | The feature's number, such as a tax amount, a fee, a count or an area, on numeric features only. |  |
| `stringValues` | list of text values (nullable) | The feature's text values, such as a school name, a subdivision name or the items an HOA fee covers. |  |
| `frequency` | text (nullable) | How often an amount is paid, on fee features only: `Monthly`, `Quarterly`, `Semiannually` or `Annually`. |  |

### ResidentialListingDerivedValues

Found at: `derivedValues`

| Field | Type | Description | Values |
|---|---|---|---|
| `totalMonthlyAssociationFees` | decimal (nullable) | Total HOA and association fees per month, in US dollars. |  |
| `totalParkingSpaces` | decimal (nullable) | Total parking spaces of every kind. |  |
| `totalBathrooms` | decimal (nullable) | Total bathrooms, with a half bathroom counted as 0.5. |  |
| `lotSizeInAcres` | decimal (nullable) | Lot size in acres, rounded to two decimals. |  |
| `homeSquareFeet` | decimal (nullable) | Living area in square feet. |  |
| `propertyType` | text (nullable) | The home type, such as `House`, `Condominium` or `Townhouse`. |  |
| `numberOfStories` | decimal (nullable) | Number of stories. |  |
| `yearBuilt` | decimal (nullable) | Year the home was built. |  |
| `totalBedrooms` | decimal (nullable) | Total bedrooms. |  |
| `totalGarageSpaces` | decimal (nullable) | Total garage spaces. |  |
| `totalParkingGarageSpaces` | decimal (nullable) | Spaces in a shared parking garage. |  |
| `totalPrivateGarageSpaces` | decimal (nullable) | Spaces in the home's own garage. |  |
| `totalCarportParkingSpaces` | decimal (nullable) | Carport spaces. |  |
| `totalOpenParkingSpaces` | decimal (nullable) | Open, uncovered parking spaces. |  |
| `newConstruction` | true/false (nullable) | True when the home is new construction. |  |
| `squareFeetMin` | decimal (nullable) | Smallest living area in square feet, the same as `homeSquareFeet` for a single home. |  |
| `squareFeetMax` | decimal (nullable) | Largest living area in square feet, the same as `homeSquareFeet` for a single home. |  |
| `availabilityDate` | text (nullable) | Date a rental becomes available, as `YYYY-MM-DD`. |  |
| `lotSizeInAcresRaw` | decimal (nullable) | Lot size in acres, unrounded. |  |
| `buildingStyle` | text (nullable) | The building's style, such as `midRise` or `highRise`. |  |
| `totalMonthlyLandFees` | decimal (nullable) | Total land lease fees per month, in US dollars. |  |

## Allowed values

Every enum in this model is listed inline in the Values column.
