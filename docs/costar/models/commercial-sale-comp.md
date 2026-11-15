# Commercial Sale Comp

A commercial sale comp is a completed sale of commercial real estate, recorded as a comparable. It captures the price and also the story behind the deal: why it sold, who bought, and how it was marketed. Investment-sales brokers, appraisers and owners use sale comps to value property.

## What this entity is

A commercial sale comp is a completed commercial sale transaction used as a comparable. It records the deal's price and its context (why sold, why bought, buyer intent), not just a number. The data is produced by CoStar's comps research and is the main evidence base for valuation. Rankings of top brokerages or agents by deals or volume are not stored; they come from aggregating comps over the broker roles.

- **Sale type decides which fields matter.** Investment sales (bought for income) and owner/user sales (bought to operate) surface different relevant fields.
- **What sold is not always one building.** A sale can cover a building only, building plus land, an adjacent lot, or a portfolio with a price allocated to each property.
- **Price carries a confidence level.** `soldForPrice` may be undisclosed or estimated, portfolio prices may be allocated, and a cap rate may be actual or pro forma. Always qualify a price with its status.
- **Comp grain matters.** A comp store mixes completed comps, per-property entities and active for-sale rows. Filter to the true comp grain before counting.

## Lifecycle

- **Price and financing must agree.** If a down payment exists, the financing type is Yes. A down payment cannot exceed the sold price, and financing cannot be Yes when the down payment equals the sold price.
- **Dates.** `soldDate` is the date the most recent deed was recorded. The on-market and off-market dates describe the earlier marketing period.
- **Parties.** Buyers, sellers and brokers are listed in `contacts[]` by `contactRole`, with the company location and, for some, the person's name and phone.
- **Partial interests.** A partial-interest sale is capped at 99 percent, and it cannot be lower than the buyers' combined ownership.
- **Land value sales.** A comp that carries a proposed land use must be flagged as a land-value sale.
- **Below-market reasons.** Some reasons (refinance, correction deed, trust deed and similar) mark a record as not usable as a comp.
- **Assessments are roll-ups.** Total assessed value and total market value are sums of the assessments on the comp's transfer documents.

## Using this data

- **Price confidence.** Carry `salePriceStatus` with `soldForPrice` every time. Never present a price as exact without its status. Flag portfolio allocated prices, pro forma cap rates, undisclosed or estimated prices, and below-market reasons.
- **Grain.** A comp can have several `entities` (one per property), and can link to active for-sale or auction listings through `forSaleIds` and `auctionForSaleIds`. Check `assetType` and filter to the true comp grain before counting or aggregating. More than one entry in `entities` means a multi-property or portfolio sale where prices may be allocated; `numberOfEntities` is 0 on most comps, so do not use it for this.
- **Cap rate and yield.** In the US and Canada the cap rate fields hold cap rates. In the UK and France the same fields hold yield, which includes acquisition costs. `capitalizationRateActual` uses in-place income; `capitalizationRateProForma` uses projected income and should be flagged as a projection.
- **Currency.** Check `monetaryUnit` before comparing or summing amounts across comps.
- **Derived values.** Assessment roll-ups and the no-buyer-broker and no-listing-broker flags are derived rather than entered.
- **Joins.** `entities[].propertyId` joins to the commercial property record. `forSaleIds` and `auctionForSaleIds` are for-sale offering ids: they match `forSaleSummary.id` and `auctionForSaleSummary.id` in the listing file when the offering's listing is in the kit (438 of 1,131 and 47 of 96). `entities[].documentId` joins to `transferDocuments[].id` on the same comp. Use IDs, not names, for people and companies.
- **What is in this dataset.** The 6,120 sales that include one of the 3,339 properties in `commercial-properties.csv`, with their contacts, verification sources and sale write-up notes (`noteType` 25 and 37). Phone numbers and email addresses, in `contacts[]` and in notes, are fake, the same fake for the same real value in every dataset.

## Joining to other models

Join on integer ids, never on names.

- `entities[].propertyId` joins to `commercial-property` `id`. A portfolio sale has several entities, and some can be properties outside the kit.
- `apartments[].propertyId` also holds PropertyIds, for apartment properties in the sale.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### CommercialSaleComp (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `apartments` | list of CommercialSaleCompApartment objects (nullable) | Collection of multifamily unit-mix/rent rows attached to the comp, supporting per-unit pricing metrics for apartment sales. |  |
| `askingPriceHigh` | integer (nullable) | Upper end of the sale price range requested by the seller; most pertinent to portfolio sales. |  |
| `askingPriceLow` | integer (nullable) | Lower end of the sale price range requested by the seller; most pertinent to portfolio sales. |  |
| `assessment` | Assessment object (nullable) | Assessed value (improved/land/total) from the tax authority for the comp, typically aggregated across transfer documents; supports valuation context. |  |
| `auctionForSaleIds` | list of integers (nullable) | Identifiers of auction for-sale listings associated with this comp, linking the sale to auction-sourced listings (e.g. Ten-X). Join on integer IDs. |  |
| `belowMarketSaleReasons` | list of integers (BelowMarketSaleReason) (nullable) | Reasons the sale priced below market (e.g. correction deed, refinance, trust deed, related-party). These disqualify the comp from contact sync and affect comparability — exclude/flag accordingly. | see `BelowMarketSaleReason` in Allowed values |
| `buildingParkType` | integer (BuildingParkType) | Type of building park for a portfolio sale; values include Business Park, Office Park, and Industrial Park. | 0 = Unknown, 1 = BusinessPark, 2 = IndustrialPark, 3 = OfficePark, 4 = ShoppingCenter, 5 = DualBrandedHotel |
| `capitalizationRateActual` | decimal (nullable) | Cap rate from actual in-place NOI over price (R = NOI / Value); lower cap = lower risk/higher price. In US/Canada CoStar captures Cap Rate; in the UK/France the same field carries Yield, which is inclusive of acquisition costs. |  |
| `capitalizationRateProForma` | decimal (nullable) | Cap rate based on projected/pro-forma NOI rather than actual in-place income (R = NOI / Value); flag as a projection when reported. In UK/France this field carries Yield rather than Cap Rate. |  |
| `contacts` | list of CommercialSaleCompContact objects (nullable) | Parties tied to the comp (buyers, sellers, brokers, preparers) with their roles; True vs Recorded distinguishes real parties from deed-name parties. Contacts sync only for a valid comp with a qualifying Buyer/Seller and no disqualifying below-market reason. |  |
| `dateOffMarket` | date-time (nullable) | The date the for-sale item (Property, Land, or CondoUnit) was taken off the market, via sale or owner withdrawal. |  |
| `dateOnMarket` | date-time (nullable) | The date the for-sale item (Property, Land, or CondoUnit) went on the market. |  |
| `downPayment` | integer (nullable) | Amount of money presented up front in a completed sale. |  |
| `entities` | list of CommercialSaleCompEntity objects (nullable) | Per-property/asset breakdown of what sold in the transaction; each entity carries allocated price and property-type-specific attributes. Filter to true-comp grain before aggregating. |  |
| `escrowLengthInDays` | integer (nullable) | Number of days elapsing between the date the property goes under contract (in escrow) and the date it settles (close of escrow). |  |
| `forSaleIds` | list of integers (nullable) | Identifiers of the for-sale listing records associated with this comp, linking the completed sale back to its marketing listings. Join on integer IDs. |  |
| `grossIncomeMultiplier` | decimal (nullable) | (GIM) Ratio of sale price to gross scheduled income plus other income at sale (or projected first-year GSI); a price-to-income valuation multiplier. |  |
| `grossRentMultiplier` | decimal (nullable) | (GRM) Multifamily valuation statistic: sale price relative to the property's gross monthly rent, used to gauge a reasonable price against the income generated. |  |
| `id` | integer | Unique identifier of the sale comp record; the join/anchor key for a completed sale used as a comparable transaction. |  |
| `isLandValueSale` | true/false | Flag indicating the property(ies) sold for the value of the land. |  |
| `isNoBuyerBroker` | true/false | Explicitly indicates that no buyer broker was involved with the sale. |  |
| `isNoListingBroker` | true/false | Explicitly indicates that no listing broker was involved with the sale. |  |
| `marketAssessment` | MarketAssessment object (nullable) | Market (full-value) assessment figures (improvement/land/total) from the assessor, distinct from assessed value; valuation context for the comp. |  |
| `monetaryUnit` | integer (MonetaryUnit) | Currency/monetary unit of the comp amounts. | see `MonetaryUnit` in Allowed values |
| `notes` | list of Note objects (nullable) | Collection of free-text research notes attached to the comp, often capturing the deal story/motivation behind the sale. |  |
| `numberOfEntities` | integer (nullable) | Count of properties/assets (entities) included in the sale transaction; >1 indicates a multi-property or portfolio sale where prices may be allocated. |  |
| `partialInterestSalePercent` | decimal (nullable) | For a partial-interest sale, the percentage of the property that was sold; does not apply to all sales. |  |
| `portfolioName` | text (nullable) | For a portfolio sale, the name of the portfolio. |  |
| `portfolioType` | integer (PortfolioType) | Code classifying whether/how this sale is part of a multi-property portfolio transaction. | 0 = Individual, 1 = MultipleProperty, 2 = BulkPortfolio, 3 = PartOfMultipleProperty, 4 = PartOfBulkPortfolio, 5 = MultipleCondo |
| `pricePerRoom` | integer (nullable) | Sale price per room; applies only to hotel/hospitality properties. |  |
| `pricePerUnit` | integer (nullable) | Sale price per unit; applicable only to multi-family property and residential land. |  |
| `proposedLandUse` | integer (ProposedLandUse) | Intended/best use of the land for a land-value sale (e.g. zoning/development intent); only meaningful when isLandValueSale is true. | see `ProposedLandUse` in Allowed values |
| `saleConditions` | list of integers (SaleCondition) (nullable) | Collection of conditions affecting the sale price/comparability (distressed, lease-up, business-value-included, etc.); surface when comparing comps. | see `SaleCondition` in Allowed values |
| `saleFinancingType` | integer (SaleFinancingType) | Indicates whether or not the sale involved financing. | 0 = Unknown, 1 = Yes, 2 = No |
| `saleMethod` | integer (SaleMethod) | Method by which the sale was transacted (e.g. standard sale, auction); defaults to standard sale. | 0 = Unknown, 1 = StandardSale, 2 = Auction, 3 = ExpressionOfInterest, 4 = Tender |
| `salePriceStatus` | integer (SalePriceStatus) | How the sale price was established: 3 Confirmed by a party to the sale; 5 FullValue, calculated from the transfer tax and not confirmed; 7 Unconfirmed, a regional form of FullValue; 2 Approximate, reported by the buyer or in a news article; 1 Affidavit or 4 Declaration, taken from the document recorded with the deed; 6 Mini, only one of price and size is public; 0 Unknown when no status is recorded. Carry it with soldForPrice. | 0 = Unknown, 1 = Affidavit, 2 = Approximate, 3 = Confirmed, 4 = Declaration, 5 = FullValue, 6 = Mini, 7 = Unconfirmed, 8 = Allocated |
| `saleType` | integer (SaleType) | Nature of the sale (e.g. Investment vs Owner/User). A core comparability dimension: investment sales (bought for income) vs owner/user sales surface different relevant fields and should be screened together when comparing comps. | 0 = Unknown, 1 = Investment, 2 = OwnerUser, 3 = InvestmentOrOwnerUser |
| `soldDate` | date-time | The date the property sold under the current sale; technically, the date the most recent deed on the property was recorded. |  |
| `soldForPrice` | integer (nullable) | Price for which the Property, Land, or CondoUnit sold. Disclosure/trust level varies (full amount stated on document, computed from transfer/excise tax, or non-disclosure), so always carry salePriceStatus. |  |
| `source` | integer (CompSourceType) | Source of the comp transaction. | see `CompSourceType` in Allowed values |
| `tenure` | integer (Tenure) | Tenure of the sale. | 0 = Unknown, 1 = Freehold, 2 = LongLeasehold, 3 = FreeholdLongLeasehold |
| `transferDocuments` | list of TransferDocument objects (nullable) | Collection of recorded transfer/deed documents underlying the sale, carrying recording details, taxes, and assessments. |  |
| `verificationFields` | list of CommercialSaleCompVerificationField objects (nullable) | Collection of per-field verification records indicating which comp fields were verified, by whom, and from which source. |  |
| `verificationSources` | list of integers (VerificationSource) (nullable) | Collection of sources used to verify the comp (e.g. broker, public record); supports field-level verification provenance. | 0 = Unknown, 1 = OtherNoCall, 2 = DocInspection, 3 = PressRelease, 4 = SecCmbs, 5 = SalesReportForm, 6 = ListingBroker, 7 = BuyerBroker, 8 = BuyerOrRep, 9 = SellerOrRep, 10 = OtherCall |

### CommercialSaleCompApartment

Found at: `apartments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `apartmentDataSource` | integer (ApartmentDataSourceType) | Source of the apartment unit data (e.g. multifamily research vs marketplace feed), indicating provenance. | 0 = Unknown, 1 = AutomatedDataCollection, 2 = Feed, 3 = CommunityCaller, 4 = CoStarResearch, 5 = UserEntry |
| `avgUnitSizeSqFt` | integer (nullable) | Average rentable area in square feet for this unit type; size context for rent and price comparisons. |  |
| `maxEffectiveRent` | integer (nullable) | Upper bound of effective monthly rent (asking adjusted for concessions) for this unit type; keep the effective flavor separate from asking rent when aggregating. |  |
| `maxMonthlyRent` | integer (nullable) | Upper bound of asking monthly rent for this unit type; asking-flavor rent, normalize before aggregating. |  |
| `maxOccupants` | integer (nullable) | Maximum permitted occupants for this unit type. |  |
| `minEffectiveRent` | integer (nullable) | Lower bound of effective monthly rent (asking adjusted for concessions) for this unit type; keep the effective flavor distinct from asking rent before comparing. |  |
| `minMonthlyRent` | integer (nullable) | Lower bound of asking monthly rent for this unit type; normalize to $/SF/yr and keep the asking flavor distinct before comparing. |  |
| `monthlyDiscount` | integer (nullable) | Monthly rent discount/concession amount applied to this unit type, bridging asking and effective rent. |  |
| `numBaths` | decimal (nullable) | Bathroom count for this unit type, fractional to allow half-baths; multifamily unit-mix attribute. |  |
| `numBeds` | integer | Bedroom count of this unit type within the multifamily comp; primary unit-mix attribute. |  |
| `numOccupantsVacant` | integer (nullable) | Vacant occupancy capacity for this unit type (occupant slots unfilled); a multifamily occupancy detail. |  |
| `numUnits` | integer | Number of units of this type in the property; drives the multifamily unit count and per-unit pricing. |  |
| `numUnitsAvailable` | decimal (nullable) | Count of units of this type marketed as available; available is distinct from vacant and includes occupied/future-available units. |  |
| `numUnitsVacant` | decimal (nullable) | Count of vacant (physically empty) units of this type at the property; vacancy is physical regardless of lease obligation. |  |
| `propertyId` | integer | Foreign key to the property the apartment data belongs to; join on integer ID. |  |
| `totalConcessionValue` | integer (nullable) | Total monetary value of concessions offered on this unit type; reduces effective rent below asking. |  |

### Assessment

Found at: `assessment`, `transferDocuments[].assessments[].assessment`

| Field | Type | Description | Values |
|---|---|---|---|
| `improvedValue` | integer (nullable) | Assessed value of the buildings and other improvements, excluding land. |  |
| `landValue` | integer (nullable) | Assessed value of the land alone. |  |
| `totalValue` | integer (nullable) | Total assessed value (land plus improvements). |  |
| `improvedRatio` | decimal (nullable) | Share of the total assessed value attributed to improvements, as a fraction from 0 to 1. |  |

### CommercialSaleCompContact

Found at: `contacts[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `contactFirstName` | text (nullable) | First name of the party as captured on the comp; free-text name used when the contact is not resolved to a Contact ID. |  |
| `contactId` | integer (nullable) | Id of the person in CoStar contact data. |  |
| `contactLastName` | text (nullable) | Last name of the party as captured on the comp; free-text name fallback alongside the contact ID. |  |
| `contactPhone` | text (nullable) | Phone number for the contact party to the sale; personal contact detail captured by research. |  |
| `contactRole` | integer (ContactRole2) | Role of the person or company on this record, such as listing broker, buyer or seller. | see `ContactRole2` in Allowed values |
| `funds` | list of integers (nullable) | Collection of investment fund references tied to this party, linking the buyer/seller to the funds behind the transaction. Join on integer IDs. |  |
| `locationId` | integer (nullable) | The contact's location - the main work location of the contact. |  |
| `locationName` | text (nullable) | Name of the company/location for the party as captured on the comp; free-text fallback when not resolved to a Location ID. Join on IDs, not names. |  |
| `locationPhone` | text (nullable) | Phone number of the company/location party to the sale; contact detail captured by research. |  |
| `percentOwned` | integer (nullable) | Ownership percentage held by this buyer/seller party; summed across parties cannot exceed 100 and is bounded by the partial-interest sale percent. |  |

### CommercialSaleCompEntity

Found at: `entities[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `allocatedPrice` | integer (nullable) | Estimated price attributed to this individual asset within a multi-property/portfolio sale when the actual per-property price is unknown; a confidence-flagged modeled value (carry allocatedPriceStatus). |  |
| `allocatedPriceStatus` | integer (SalePriceStatus) | How allocatedPrice was established. 8 Allocated means it is an estimated share of the portfolio price; the other values have the meanings given for salePriceStatus. | 0 = Unknown, 1 = Affidavit, 2 = Approximate, 3 = Confirmed, 4 = Declaration, 5 = FullValue, 6 = Mini, 7 = Unconfirmed, 8 = Allocated |
| `assetType` | integer (AssetType) | Type of the asset/entity in the sale (e.g. property, document); determines the grain and which fields apply. Filter on this before counting true comps. | 0 = Unknown, 1 = Property, 2 = Condo, 3 = RumorProperty |
| `averageRentalRate` | decimal (nullable) | Average rental rate for the asset at sale; income input for investment-sale valuation. Normalize flavor/type before comparing. |  |
| `buildingFullName` | text (nullable) | Full name of the building/asset; hospitality-specific identifier used for hotel comps. |  |
| `capitalizationRateActual` | decimal (nullable) | Actual (in-place NOI) cap rate for this individual asset (R = NOI / Value); core per-asset valuation metric. In UK/France this field carries Yield (inclusive of acquisition costs) rather than Cap Rate. |  |
| `capitalizationRateProForma` | decimal (nullable) | Pro forma (projected-NOI) cap rate for this individual asset; flag as a projection when reported. |  |
| `documentId` | integer (nullable) | Foreign key to the transfer document associated with this entity, linking the asset to its recorded deed. |  |
| `entityId` | integer | Id of the sold asset this entry describes; read it with assetType (a property, a condo unit or a rumored property). |  |
| `hotelClass` | integer (HotelClass) | Hotel class/tier of the asset (hospitality-specific); a benchmarking attribute for hotel sale comps, aligned to STR-style hospitality classification used in hospitality KPI calculations. | 0 = Unknown, 1 = Luxury, 2 = UpperUpscale, 3 = Upscale, 4 = UpperMidscale, 5 = Midscale, 6 = Economy |
| `hotelOperationType` | integer (HotelOperationType) | Hotel operating arrangement (e.g. franchise, managed, independent); hospitality-specific attribute affecting value. | 0 = Unknown, 1 = ChainManagement, 2 = Franchise, 3 = Independent |
| `id` | integer | Unique identifier of this per-asset comp-entity row within the sale comp. |  |
| `notes` | list of Note objects (nullable) | Collection of free-text research notes attached to this comp-entity, often capturing per-asset deal context. |  |
| `numberOfUnits` | integer (nullable) | Unit count for the asset; multifamily/land attribute supporting price-per-unit metrics. |  |
| `percentLeased` | decimal (nullable) | Share of the asset under lease at the time of sale; the occupancy/leasing profile is a key comp comparability dimension for income durability (leased differs from physically occupied). |  |
| `propertyId` | integer (nullable) | PropertyID added to enable searches by property/address without joining to Property or CondoUnit+Property by sale entity type, dramatically improving comp retrieval speed. |  |
| `totalSquarefeet` | decimal (nullable) | Total square footage of the asset; size denominator for price/SF and multifamily/land sizing. |  |

### Note

Found at: `leaseDeal.notes[]`, `entities[].notes[]`, `notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `noteType` | integer (NoteType) | A pre-defined categorization of note text, typically referred to as 'Notes' in CRM Enterprise. | see `NoteType` in Allowed values |
| `value` | text (nullable) | The body (free-text content) of the note. |  |

### MarketAssessment

Found at: `marketAssessment`, `transferDocuments[].assessments[].marketAssessment`

| Field | Type | Description | Values |
|---|---|---|---|
| `marketImprovementValue` | integer (nullable) | Assessor's market value of the buildings and other improvements. |  |
| `marketLandValue` | integer (nullable) | Assessor's market value of the land. |  |
| `marketTotalValue` | integer (nullable) | Assessor's total market value (land plus improvements). |  |
| `marketImprovementPercent` | decimal (nullable) | Share of the assessor's total market value attributed to improvements. |  |

### TransferDocument

Found at: `transferDocuments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `assessments` | list of TransferDocumentAssessment objects (nullable) | Collection of per-document assessment records (assessed/market improvement, land, and total values) rolled up to support comp valuation. |  |
| `cityTax` | decimal (nullable) | City-level transfer tax paid on the conveyance; additional tax-stamp basis that can corroborate price. |  |
| `countyId` | integer | County whose recorder/assessor holds the document; scopes the document number, which is only unique within a county. Join to county geography on the ID. |  |
| `dateFiled` | date-time (nullable) | Date the transfer document was recorded/filed with the county; recording date for the deed. |  |
| `documentNumber` | text (nullable) | Normalized recording/document number identifying the deed in the county recorder's records, used to tie the sale to public records. |  |
| `documentNumberRaw` | text (nullable) | Original unnormalized document number as recorded by the source, preserved alongside the cleaned documentNumber. |  |
| `exciseNumber` | text (nullable) | Excise/recording reference number associated with the transfer tax payment on the document. |  |
| `id` | integer | Unique identifier of the transfer (deed) document record underlying the sale comp. |  |
| `isNonDisclosure` | true/false | Whether the sale falls in a non-disclosure jurisdiction where price is not publicly recorded, explaining undisclosed/estimated prices. |  |
| `isPrimaryDocument` | true/false | Whether this is the primary deed for the sale comp (vs supporting/secondary documents), used to pick the authoritative conveyance. |  |
| `legalDescription` | text (nullable) | Legal description of the land parcel conveyed by the deed, defining exactly what real property transferred. |  |
| `noDocumentAvailable` | true/false | Flag indicating no recorded transfer document is available for the sale, so deed-derived details cannot be sourced. |  |
| `taxStampType` | integer (TaxStampType) | Type of documentary tax stamp on the deed, indicating the basis/jurisdiction of the transfer tax. | 0 = Unknown, 1 = Exempt, 2 = Blank, 3 = Partial, 4 = Full, 5 = Zero |
| `transferTax` | decimal (nullable) | Transfer (county/state) tax paid on the recorded conveyance; can be used to infer or corroborate undisclosed sale price. |  |

### TransferDocumentAssessment

Found at: `transferDocuments[].assessments[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `assessment` | Assessment object (nullable) | Value-typed assessed-valuation breakdown from the assessor (improved value, land value, total value, and derived improved-to-total ratio); the tax-roll basis of value for the parcel. |  |
| `assessmentSourceType` | integer (AssessmentSourceType) | Code identifying the origin of the assessment data (e.g. which assessor/tax source supplied the valuation), used to gauge provenance and reliability of the figures. | 0 = Unknown, 1 = CountyWebsite, 2 = FirstAmerican, 3 = Other |
| `assessmentYear` | integer (nullable) | Tax assessment year the assessed valuation figures apply to, anchoring the assessor's improved/land/total values to a specific assessment roll period. |  |
| `id` | integer | Unique identifier for the transfer-document assessment record, which captures the assessor/tax valuation tied to a property's deed transfer within a commercial sale comp. |  |
| `isPartialAPNSale` | true/false | Flag indicating the sale transaction covered only part of the assessor's parcel (APN) rather than the whole parcel, a comparability caveat when relating the assessment to the sale price. |  |
| `marketAssessment` | MarketAssessment object (nullable) | Value-typed market-valuation breakdown (market improvement, land, total value, and derived improvement percent) representing the assessor's estimated market value as distinct from the assessed/taxable value. |  |
| `parcelNumber` | text (nullable) | County assessor's parcel number (APN) for the land parcel covered by this transfer document, tying the assessment to public tax/ownership records; APNs are unique only within a county. |  |
| `propertyTax` | decimal (nullable) | Annual property tax amount levied on the parcel per the assessor record; a financial datum used in income/expense analysis of the comp and in comparability adjustments. |  |
| `propertyTaxYear` | integer (nullable) | Tax year the propertyTax amount applies to, anchoring the levied tax figure to a specific billing period. |  |

### CommercialSaleCompVerificationField

Found at: `verificationFields[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `verificationField` | integer (VerificationField) | Code identifying which specific sale-comp field this verification record pertains to, enabling field-level tracking of what data has been verified and from which source in the comp research workflow. | 0 = Unknown, 1 = Price, 2 = RBA, 3 = BuyersCap, 4 = SellersCap, 5 = GBA, 6 = GLA, 7 = LandArea |
| `verificationSource` | integer (VerificationSource) | Code identifying the source through which a field of the commercial sale comp was verified (e.g. broker, buyer, seller, public record), recording how the deal datum was confirmed in the field-level verification workflow. | 0 = Unknown, 1 = OtherNoCall, 2 = DocInspection, 3 = PressRelease, 4 = SecCmbs, 5 = SalesReportForm, 6 = ListingBroker, 7 = BuyerBroker, 8 = BuyerOrRep, 9 = SellerOrRep, 10 = OtherCall |

## Allowed values

### BelowMarketSaleReason

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | AssignmentOfBeneficialInterestDeed |
| 2 | AffidavitOfDeath |
| 4 | AssignmentOfLease |
| 7 | BusinessSaleZeroReallocation |
| 8 | ChangeInTitleVesting |
| 9 | ContractInstallmentSale |
| 10 | CorrectionDeed |
| 11 | DatedSalePrice |
| 12 | DeedInLieuOfForeclosure |
| 13 | DevelopmentAuthoritySale |
| 15 | EasementRightOfWay |
| 16 | GiftDeed |
| 17 | InterrelatedParties |
| 21 | MortgageReleaseOfMortgage |
| 25 | PackageSaleRandomAllocation |
| 27 | PartnershipDissolution |
| 28 | QuitclaimDeed |
| 29 | Rerecording |
| 30 | RedevelopmentAgencySale |
| 31 | Refinance |
| 32 | RelatedPrincipals |
| 33 | ReleaseOfCosigner |
| 35 | RightOfWay |
| 39 | TrustDeed |
| 40 | TrustTransfer |
| 41 | TrusteesDeed |
| 42 | UnknownReason |
| 43 | Foreclosure |
| 44 | EminentDomain |

### ContactRole2

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
| 104 | DataCenterOperator |
| 1000 | SubletContact |
| 1001 | PreviousTrueOwner |
| 1002 | PreviousRecordedOwner |
| 1003 | ExecutiveLeadershipPrincipal (also Executive) |
| 1004 | LeaseCompsAdministrator |
| 1005 | FeedContact |

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

### SaleCondition

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | DistressSale |
| 2 | TenThreeOneExchange |
| 3 | SaleLeaseback |
| 4 | GroundLeaseLeasehold |
| 5 | GroundLeaseLeasedFee |
| 6 | InvestmentTripleNet |
| 7 | DirectExchange |
| 8 | Assemblage |
| 9 | AuctionSale |
| 11 | BuildToSuit |
| 12 | BulkPortfolioSale |
| 13 | BusinessValueIncluded |
| 14 | CondoConversion |
| 15 | DeedRestriction |
| 16 | EstateProbateSale |
| 17 | HistoricalSite |
| 18 | LeaseOption |
| 19 | BuildingContaminationIssue |
| 20 | DeferredMaintenance |
| 21 | DoubleEscrow |
| 22 | ExerciseOfOption |
| 23 | ExcessLand |
| 24 | Expansion |
| 25 | HighVacancyProperty |
| 26 | LandContract |
| 27 | PartialInterestTransfer |
| 28 | PurchaseByTenant |
| 29 | RedevelopmentProject |
| 30 | RollingOptionTakedown |
| 31 | SoilContaminationIssue |
| 32 | BuildingInShellCondition |
| 33 | RealEstateOwnedSale |
| 34 | ShortSale |
| 35 | ThreatOfCondemnation |
| 36 | CourtAppointedSale |
| 37 | Recapitalization |
| 38 | DebtAssumption |
| 39 | NotePurchase |
| 40 | BankruptcySale |
| 41 | ZeroCashFlowInvestment |
| 42 | LowIncomeHousingTaxCredit |
| 43 | EntityBuyMembershipInterests |
| 44 | CondoDeconversion |
| 45 | FurnitureFixturesAndEquipmentIncluded |
| 46 | HotelBrandChange |
| 47 | LongTermEncumbrances |
| 48 | ConversionProject |
| 49 | BuildingInLeaseUp |
| 50 | NonOperatingHotel |
| 51 | VEFA |
| 52 | ForwardFunding |
| 53 | ForwardCommitment |

### CompSourceType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | ForSaleOffMarket |
| 3 | PressRelease |
| 4 | SecFilings |
| 5 | NewsStories |
| 6 | CountyWebsites |
| 7 | Ace |
| 8 | Fares |
| 9 | Accudata |
| 10 | SkldDeeds |
| 11 | SkldWarrantyDeeds |
| 12 | DupageAssessor |
| 13 | KingAssessor |
| 14 | Foxdata |
| 15 | Crain |
| 16 | WarrenGroup |
| 17 | RecordInformationServices |
| 18 | PowerBrokerSubmission |
| 19 | Teranet |
| 21 | ListingManager |
| 22 | BritishColumbiaAssessment |
| 23 | CoreLogic |
| 24 | HmLandRegistry |
| 25 | EquifaxQuebec |
| 26 | Mpac |
| 27 | LightBox |
| 28 | Tenx |
| 29 | Preqin |
| 30 | FirstAmerican |
| 31 | BlackKnight |
| 32 | Explore |
| 33 | RegistersOfScotland |
| 34 | DemandesDeValeursFoncieres |
| 35 | NSWValuerGeneral |
