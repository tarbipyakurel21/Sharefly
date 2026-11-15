# Location Occupancy

A location occupancy is a tenancy record: it states that a company occupies space in a property for a period of time. It is the basis of CoStar's tenant research, covering per-building tenant rosters, tenant movement and lease economics. A linked lease deal and the occupied spaces carry the rent and size details.

## What this entity is

A location occupancy is the tenancy record. It states that a company (a tenant, modeled as a location) occupies space in a property for a period (`fromDate` to `toDate`). It answers the question "which companies are in this building".

The tenant is identified by `tenantLocationId` only. Join it to `id` in company-detail for the tenant's name, industry, employee count and company profile.

- **Occupancy is not availability or listing.** This is who actually occupies space (leased and occupied), as opposed to space that is marketed as available on a commercial listing.
- **Move-in drives absorption.** `moveInDate` (physical occupancy) is the date that moves the absorption metric, not the lease sign date.
- **It carries the lease economics.** A linked lease deal plus the occupied spaces make it possible to compute effective rent: the contract rent adjusted for concessions and escalations.

## Lifecycle

- **Tenant assignment.** An occupancy can start with an unknown tenant. A known tenant is then assigned once, can be changed, or removed. Assigning a tenant clears the occupancy's own industry value.
- **Dates.** The occupancy window must satisfy `fromDate` before `toDate`. A renewal starts a new window from the sign date and defaults the move-in date to it.
- **Move-out.** When a tenant moves out, the occupancy is closed: `toDate` is set to the day before the move-out date and an expiration reason is recorded. If that would leave a window of one day or less, the record is deleted instead. A move-out can be undone, which reopens the occupancy (`toDate` empty) and resets the reason to Unknown.
- **Spaces.** An occupancy always has at least one occupied space.
- **Effective rent is derived.** It can only be calculated when the occupied area, lease term, rate, escalations and concessions are available. Default sign and move-in dates can be derived from each other using a factor based on space size and type.

## Using this data

- **Keys.** The key is `id`. `propertyId` joins to the commercial property record and `tenantLocationId` joins to `id` in company-detail. A null `tenantLocationId` is an unknown tenant.
- **Current versus historical.** A null `toDate` means the tenant is still in place. Historical, current and recent status are derived from `fromDate` and `toDate`, and total occupied area is the sum of `spaces[].squareFeetOccupied`.
- **Occupancy is not availability.** Do not mix it with commercial listing availability, and do not use it in a vacancy numerator.
- **Move-in versus sign date.** Absorption uses `moveInDate`, not the lease sign date.
- **Industry.** `industryType` on the occupancy is authoritative only for unknown-tenant rows. Once a company is linked, the industry should come from `profile.industryType` in company-detail.
- **Rent normalization.** Before aggregating lease economics, normalize to dollars per square foot per year, and never mix rent flavors: asking, contract (actual) and effective rents are different measures. Check `monetaryUnit` and `serviceType` before comparing.
- **Lease type.** In leasing-activity rollups, Direct means relet plus new space, and Sublet means sublet plus assignment space; owners leasing their own buildings are excluded.
- **Lease deals are often missing.** 32,312 of the 74,093 occupancies have no `leaseDeal`. Lease deal contacts and notes are included where they exist. Contact phone numbers are fake, the same fake for the same real number in every dataset.
- **Tenant names.** Tenant names are in company-detail, not on this record. 57,225 of the 74,093 occupancies have a `tenantLocationId` that joins to it.
- **What is in this dataset.** Every occupancy recorded on the 3,339 properties in `commercial-properties.csv`, current and historical.

## Joining to other models

Join on integer ids, never on names.

- `propertyId` joins to `commercial-property` `id`.
- `tenantLocationId` joins to `company-detail` `id`, the tenant's name, industry and profile. A null `tenantLocationId` is an unknown tenant. Records with the same `tenantLocationId` are the same company location across buildings.
- `addressId` usually equals the tenant's `company-detail` `address.id`.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### LocationOccupancy (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `addressId` | integer (nullable) | Foreign key to the specific address/suite the tenant occupies within the property, for multi-address properties. |  |
| `expirationReason` | integer (LocationOccupancyExpirationReason) | Reason the occupancy ended (e.g. lease expiration, relocation), explaining tenant move-out and informing rollover analysis. | see `LocationOccupancyExpirationReason` in Allowed values |
| `fromDate` | date-time | Start date of the occupancy period; when the tenant's occupancy of the space begins, used for tenancy timelines and absorption. |  |
| `id` | integer | Unique identifier of the tenant-occupancy record, representing one company's occupancy of space in a property over a date range. |  |
| `industryType` | integer (IndustryType) | Industry/business classification of the occupying tenant; for unknown tenants it captures the business type when the company is not yet identified. | see `IndustryType` in Allowed values |
| `leaseDeal` | LeaseDeal object (nullable) | The associated lease-deal record carrying the negotiated lease terms (rent, dates, escalations, concessions) for this occupancy when a lease comp exists. |  |
| `leaseType` | integer (LeaseType) | Lease arrangement governing the occupancy (direct lease, sublease, owner-occupied). For leasing-activity rollups Direct = relet + new space and Sublet = sublet + assignment space; owner leases of their own buildings are excluded. | 0 = Unknown, 1 = Direct, 2 = Sublease, 3 = MonthToMonth, 4 = Owned, 5 = Assignment, 6 = Coworking |
| `moveInDate` | date-time (nullable) | Date the tenant physically moved into the space (occupancy event). Drives net/gross absorption — absorption is counted from move-in events on occupied space, not the lease sign date. |  |
| `propertyId` | integer | Foreign key to the property in which the tenant occupies space; anchors the occupancy to the building. |  |
| `spaces` | list of SpaceOccupied objects (nullable) | Collection of occupied-space records detailing the specific spaces/suites and square footage the tenant occupies within the property. |  |
| `tenantLocationId` | integer (nullable) | Foreign key to the Location (company node) that is the tenant occupying the space; null for an unknown/unidentified tenant. |  |
| `toDate` | date-time (nullable) | End date of the occupancy period; null while the tenant is still in place. Distinguishes current versus historical occupancies and rollover timing. |  |

### LeaseDeal

Found at: `leaseDeal`

| Field | Type | Description | Values |
|---|---|---|---|
| `askingRate` | LeaseRate object (nullable) | Lessor's quoted asking rent for the space as a low/high per-SF range with rate basis; the asking rent flavor, distinct from contract and effective. |  |
| `askingRatePerMonth` | decimal (nullable) | Asking rent expressed as a per-month total; mutually exclusive with the per-year and per-SF forms, set when an asking amount is entered. |  |
| `askingRatePerYear` | decimal (nullable) | Asking rent expressed as a per-year total; mutually exclusive with the per-month and per-SF forms, set when an asking amount is entered. |  |
| `breakDates` | list of LeaseBreakDate objects (nullable) | Collection of UK lease break dates at which the tenant may terminate early; rollover-risk inputs. State exposed separately via breakDatesState. |  |
| `breakDatesState` | integer (RecordStateType) | For the UK break-dates collection (early-exit points) on the lease. | 0 = Unknown, 1 = Yes, 2 = No |
| `businessRatesPerYear` | decimal (nullable) | Annual UK business rates (occupier property tax levied by the local authority) payable on the leased premises; a tenant occupancy cost shown on the Lease Comps financial terms as $/SF/Year. |  |
| `commencementDate` | date-time (nullable) | Date the lease term begins; anchors term, free-rent and escalation schedules and is derived from sign or move-in date for renewals. |  |
| `concessions` | list of LeaseDealConcession objects (nullable) | Collection of landlord concession records (TI allowances, free rent, other inducements) granted to the tenant that lower effective rent. |  |
| `contacts` | list of LeaseDealContact objects (nullable) | Collection of contacts on the deal (landlord/leasing-company and tenant representatives). |  |
| `effectiveRate` | decimal (nullable) | User-entered effective rent per SF: NPV of net lease payments less TIA and other concessions, amortized over the term. The effective-rent flavor (never mix with asking or contract); can be negative when concessions exceed base rent. |  |
| `effectiveRateBasis` | integer (RateBasis) | Time basis (monthly/yearly) of the user-entered effective rate, needed to normalize effective rent to a common basis. | 0 = Unknown, 1 = Monthly, 2 = Yearly |
| `effectiveRateCalculatedBasis` | integer (RateBasis) | Time basis of the system-calculated effective rate, populated from the effective-rent calculation result rather than user entry. | 0 = Unknown, 1 = Monthly, 2 = Yearly |
| `effectiveRatePerMonth` | decimal (nullable) | User-entered effective rent expressed as a per-month total, the per-month form of the concession-and-escalation-adjusted effective rent. |  |
| `effectiveRatePerYear` | decimal (nullable) | User-entered effective rent expressed as a per-year total, the per-year form of the concession-and-escalation-adjusted effective rent. |  |
| `expansionOptionComment` | text (nullable) | Free-text comment describing the expansion-option terms. |  |
| `expansionOptionDate` | date-time (nullable) | Date the tenant may exercise the expansion option. |  |
| `expansionOptionSquareFeet` | decimal (nullable) | Square footage covered by the tenant's expansion option. |  |
| `expansionOptionState` | integer (RecordStateType) | Whether the tenant holds an option to expand into additional space. | 0 = Unknown, 1 = Yes, 2 = No |
| `expirationDate` | date-time (nullable) | Date the lease term ends, derived from commencement date plus lease term (or earliest off-market sublet space). |  |
| `freeMonths` | decimal (nullable) | Number of free-rent (abated) months granted as a concession; an inducement that lowers effective rent. Displayed as 'XX Months at Start/End' or 'XX Months Total, Varying'. In the UK methodology free months are taken net of the 3-month fit-out period. |  |
| `freeRentMethodType` | integer (FreeRentMethodType) (nullable) | Method of applying free rent (e.g. months at start versus a detailed schedule), set automatically from free months and the schedule. | 0 = MonthsAtStart, 1 = MonthsSpreadOverTerm |
| `freeRentSchedule` | list of LeaseDealFreeRentSchedule objects (nullable) | Collection of free-rent schedule entries detailing which lease months carry free or discounted rent; a concession schedule feeding effective-rent calculation. |  |
| `grossAggregateValue` | decimal (nullable) | Total gross value of the lease deal over its term before concessions; an aggregate deal-value figure used to size the transaction. |  |
| `id` | integer | Unique identifier of the lease deal (lease comp) record; the negotiated terms of an executed or pending lease. |  |
| `isLeaseTermMonthToMonth` | true/false | Whether the lease runs month-to-month rather than for a fixed term, indicating an open-ended tenancy. |  |
| `leaseDealSourceType` | integer (LeaseDealSourceType) | Code indicating the source/origin classification of the lease deal data (where the deal information came from). | see `LeaseDealSourceType` in Allowed values |
| `leaseDealType` | integer (LeaseDealType) | Type of lease deal (e.g. new lease, renewal); renewal drives different commencement-date derivation than new/relet deals. | 0 = Unknown, 1 = NewLease, 2 = Renewal |
| `leaseTerm` | integer (nullable) | Length of the lease in leaseTermType units; the duration of the lease obligation, used to derive expiration and validate schedules. |  |
| `leaseTerminationOptionDate` | date-time (nullable) | Date the tenant may exercise an early lease-termination option. |  |
| `leaseTerminationOptionPenalty` | text (nullable) | Free-text description of the penalty owed for exercising the early-termination option. |  |
| `leaseTerminationOptionState` | integer (RecordStateType) | Whether the tenant holds an early-termination (break) option. | 0 = Unknown, 1 = Yes, 2 = No |
| `leaseTermType` | integer (LeaseTermType) | Unit in which the lease term is expressed (days, months, years); combined with leaseTerm to compute term length in months. | 0 = Unknown, 1 = Years, 2 = Months, 3 = Days, 4 = ToBeDetermined, 5 = Negotiable, 6 = ThreeOrSixOrNine, 7 = ShortTerm |
| `marketEffectiveRate` | decimal (nullable) | System-calculated market effective rent per SF from the effective-rent engine — base/contract rent net of concessions, TIA and free rent, spread over the term. The modeled market-based effective-rent flavor. |  |
| `marketEffectiveRatePerMonth` | decimal (nullable) | System-calculated market effective rent expressed per month, derived from the effective-rent calculation result. |  |
| `marketEffectiveRatePerYear` | decimal (nullable) | System-calculated market effective rent expressed per year, derived from the effective-rent calculation result. |  |
| `monetaryUnit` | integer (MonetaryUnit) | Currency unit for all monetary amounts on the deal; normalize to a common currency before aggregating rents or values across deals. | see `MonetaryUnit` in Allowed values |
| `netAggregateValue` | decimal (nullable) | Total net value of the lease deal over its term (net of concessions); an aggregate deal-value figure used to size the transaction. |  |
| `noLandlordRepresentative` | true/false | Whether the deal explicitly has no landlord/leasing representative; when true, no landlord rep contacts may be supplied. |  |
| `noRateEscalation` | true/false | Whether the lease explicitly has no rent escalations; when true, no escalation schedule may be supplied. |  |
| `noTenantRepresentative` | true/false | Whether the deal explicitly has no tenant representative; when true, no tenant rep contacts may be supplied. |  |
| `notes` | list of Note objects (nullable) | Collection of internal research notes/annotations attached to the lease deal record. |  |
| `numRenewalOption` | integer (nullable) | Number of renewal options the tenant holds. |  |
| `numRenewalOptionComment` | text (nullable) | Free-text comment describing the renewal-option terms. |  |
| `percentageRent` | decimal (nullable) | Percentage-rent rate: additional retail rent computed as a percentage of tenant sales above a breakpoint. Displayed as a % on the Lease Comps financial terms. |  |
| `percentageRentBreakpoint` | decimal (nullable) | Sales breakpoint above which percentage rent applies; the retail-lease threshold triggering overage rent. |  |
| `propertyTaxAmount` | decimal (nullable) | Property-tax amount allocated to the leased space as a tenant occupancy cost, shown on the Lease Comps financial terms ($/SF/Year). |  |
| `propertyTaxAmountPerYear` | decimal (nullable) | Annualized property-tax amount for the leased space; per-year form of the tenant's property-tax occupancy cost. |  |
| `proposalEffectiveRate` | decimal (nullable) | System-calculated proposal effective rent per square foot from the effective-rent engine, reflecting the proposal-scenario effective rent. |  |
| `proposalEffectiveRatePerMonth` | decimal (nullable) | System-calculated proposal effective rent expressed per month, derived from the effective-rent calculation result. |  |
| `proposalEffectiveRatePerYear` | decimal (nullable) | System-calculated proposal effective rent expressed per year, derived from the effective-rent calculation result. |  |
| `purchaseOptionComment` | text (nullable) | Free-text comment describing the purchase-option terms. |  |
| `purchaseOptionDate` | date-time (nullable) | Date the tenant may exercise the purchase option. |  |
| `purchaseOptionPrice` | integer (nullable) | Price at which the tenant may buy the property under a purchase option, when the lease has one. |  |
| `purchaseOptionState` | integer (RecordStateType) | Whether the tenant holds an option to purchase the property. | 0 = Unknown, 1 = Yes, 2 = No |
| `rateActual` | decimal (nullable) | Actual contract rent rate per square foot negotiated in the lease; the contract rent flavor, distinct from asking and effective. |  |
| `rateActualIncreaseMethodType` | integer (RateActualIncreaseMethodType) | Method by which the actual rate increases over the term (escalation method), describing how contract rent steps up. | 0 = StepIncreases, 1 = ConsumerPriceIndexIncreases, 2 = ConsumerPriceIndexAndStepIncreases |
| `rateActualPerMonth` | decimal (nullable) | Actual contract rent expressed as a total per-month amount; mutually exclusive with per-year and per-SF forms, derived when rate is entered. |  |
| `rateActualPerYear` | decimal (nullable) | Actual contract rent expressed as a total per-year amount; mutually exclusive with the per-month and per-SF forms, derived when rate is entered. |  |
| `rateAmountType` | integer (RateAmountType) | Code indicating how the actual rate is expressed (per square foot, per month, per year, per seat), governing which rateActual* field carries the value. | 0 = AmountPerSquareFoot, 1 = AmountPerMonth, 2 = AmountPerYear, 3 = AmountPerSquareMeter, 4 = AmountPerSeatPerMonth, 5 = AmountPerSeatPerYear, 6 = AmountPerKilowatt |
| `rateBasis` | integer (RateBasis) | Time basis (monthly/yearly) of the actual rate, needed to normalize the contract rent to a common $/SF/yr basis. | 0 = Unknown, 1 = Monthly, 2 = Yearly |
| `rateEscalations` | list of LeaseDealRateEscalation objects (nullable) | Collection of contractual rent-escalation steps (bump-ups) over the term; each entry can carry the rate after escalation used in effective-rent math. |  |
| `renewalOptionDate` | date-time (nullable) | Date by which or on which the renewal option may be exercised. |  |
| `renewalOptionState` | integer (RecordStateType) | Whether a renewal option exists on the lease. | 0 = Unknown, 1 = Yes, 2 = No |
| `renewalOptionTermInMonths` | integer (nullable) | Length in months of the lease extension granted by exercising the renewal option. |  |
| `rentPlus` | decimal (nullable) | Additional rent-plus amount layered on base rent (e.g. TMI = taxes, maintenance, insurance pass-throughs); a supplemental occupancy charge shown alongside CAM/additional rent on the Lease Comps financial terms. |  |
| `reviewDates` | list of LeaseReviewDate objects (nullable) | Collection of UK rent-review dates at which the contract rent is reset; paired with reviewPatternYears and reviewDatesState. |  |
| `reviewDatesState` | integer (RecordStateType) | For the UK rent-review-dates collection on the lease. | 0 = Unknown, 1 = Yes, 2 = No |
| `reviewPatternYears` | integer (nullable) | UK rent-review cadence in years (interval between contractual rent reviews). |  |
| `rightOfFirstOfferComment` | text (nullable) | Free-text comment describing the right-of-first-offer terms. |  |
| `rightOfFirstOfferState` | integer (RecordStateType) | Whether the tenant holds a right of first offer on additional/adjacent space. | 0 = Unknown, 1 = Yes, 2 = No |
| `rightOfFirstRefusalComment` | text (nullable) | Free-text comment describing the right-of-first-refusal terms. |  |
| `rightOfFirstRefusalSquareFeet` | decimal (nullable) | Square footage covered by the tenant's right of first refusal on additional space. |  |
| `rightOfFirstRefusalState` | integer (RecordStateType) | Whether the tenant holds a right of first refusal on additional/adjacent space. | 0 = Unknown, 1 = Yes, 2 = No |
| `serviceChargeAmount` | decimal (nullable) | Service-charge amount (UK common-area maintenance / building service charge) payable under the lease — an occupancy cost beyond base rent. |  |
| `serviceChargeAmountPerYear` | decimal (nullable) | Annualized service-charge amount for the leased space; per-year form of the building service charge. |  |
| `serviceChargeState` | integer (RecordStateType) | For the service-charge (UK CAM-equivalent) figures, indicating whether a service charge is in place, available, or none. | 0 = Unknown, 1 = Yes, 2 = No |
| `serviceType` | integer (ServiceType) | Rent service type governing who pays operating expenses — e.g. Triple Net (NNN), Full Service, Modified Gross, Industrial Gross, Single/Double Net; UK FRI/IRI/IRO. Resolved from ref.servicetype; required to compare rents on a like basis. | see `ServiceType` in Allowed values |
| `signagePayerType` | integer (SignagePayerType) | Code identifying who pays for signage under the lease (landlord vs tenant). | 0 = Unknown, 1 = Landlord, 2 = Tenant |
| `signageState` | integer (RecordStateType) | Whether the lease grants signage rights to the tenant. | 0 = Unknown, 1 = Yes, 2 = No |
| `signDate` | date-time (nullable) | Date the lease was signed by both parties; one of the three key lease dates (sign/commencement/move-in). |  |
| `sourceTypes` | list of integers (LeaseDealSourceType) (nullable) | Collection of source-type classifications contributing to the deal record, capturing the multiple origins of the deal data. | see `LeaseDealSourceType` in Allowed values |
| `spaceType` | integer (SpaceType) | Space provenance of the deal (New, Relet, Sublet); drives expiration-date derivation. In leasing-activity terms Direct = relet + new and Sublet = sublet + assignment; product 'Direct' corresponds to Relet. | 0 = Unknown, 1 = Relet, 2 = New, 3 = Sublet, 4 = Assignment |
| `spaceUse` | integer (SpaceUse) | Primary use of the leased space (office, retail, industrial, etc.); gates use-specific fields such as Zone A rent for retail. | 0 = Unknown, 1 = Office, 2 = OfficeMedical, 3 = OfficeRetail, 4 = Medical, 5 = Retail, 6 = Flex, 7 = Industrial |
| `spreadOverTermType` | integer (SpreadOverTermType) | Code controlling how concessions or rent are spread/amortized over the lease term when computing effective rent. | 0 = EnterByMonth, 1 = EnterByDate |
| `tenantImprovementAllowancePerSquareFeet` | decimal (nullable) | Tenant-improvement (TI) allowance per SF the landlord grants for fit-out. A key concession deducted in effective-rent math (NER = base rent less TIA over the term), so a large TIA can push effective rent below base rent. |  |
| `zoneARent` | decimal (nullable) | Zone A rent: UK retail rental valuation method pricing the most valuable front-of-shop zone per square foot; only valid when the space use is Retail. |  |

### LeaseRate

Found at: `leaseDeal.askingRate`

| Field | Type | Description | Values |
|---|---|---|---|
| `rateLow` | decimal (nullable) | Low end of the asking rent range. |  |
| `rateHigh` | decimal (nullable) | High end of the asking rent range; equal to rateLow when a single rate was quoted. |  |
| `rateBasis` | integer (RateBasis) | Period the asking rent is quoted for (monthly or yearly). | 0 = Unknown, 1 = Monthly, 2 = Yearly |

### LeaseBreakDate

Found at: `leaseDeal.breakDates[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `breakDate` | date-time (nullable) | Date on which the lease may be broken/early-terminated under this option; key to rollover risk and income-durability analysis. |  |
| `id` | integer | Unique identifier of a lease break/termination-option record within a lease deal. |  |
| `leaseBreakType` | integer (LeaseBreakType) | Code classifying the break-option type (e.g. tenant break, landlord break, mutual), describing who may early-terminate the lease and under what option. | 0 = Unknown, 1 = Landlord, 2 = Tenant, 3 = Mutual |
| `noticePeriodMonths` | integer (nullable) | Number of months of advance notice required to exercise the break option before the break date. |  |
| `terminationPenalty` | text (nullable) | Free-text description of the penalty or fee payable to exercise the early-termination/break option. |  |

### LeaseDealConcession

Found at: `leaseDeal.concessions[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `concessionAmount` | decimal (nullable) | Monetary value of the landlord concession (inducement) granted to the tenant; reduces effective rent in lease-economics calculations. |  |
| `concessionAmountType` | integer (LandlordConcessionAmountType) | Unit/basis of the landlord concession amount (e.g. per square foot, total, per month), needed to normalize the inducement's value. | 0 = YearlyAmount, 1 = MonthlyAmount, 2 = AmountPeriodic, 3 = YearlyRatePerRentableArea, 4 = YearlyRatePerRentableAreaPeriodic, 5 = MonthlyRatePerRentableArea, 6 = MonthlyRatePerRentableAreaPeriodic, 10 = AmountAtStart, 11 = RatePerRentableArea |
| `concessionDescription` | text (nullable) | Free-text description of the landlord concession (e.g. moving allowance, fit-out contribution) beyond standard TI and free rent. |  |
| `id` | integer | Unique identifier of a landlord-concession record within a lease deal. |  |

### LeaseDealContact

Found at: `leaseDeal.contacts[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `contactId` | integer (nullable) | Id of the person in CoStar contact data. |  |
| `contactPhoneNumber` | text (nullable) | Phone number for the lease-deal contact (e.g. broker or party to the deal); personal contact data. |  |
| `contactPhoneNumberExt` | text (nullable) | Phone extension the contact prefers for discussing the stated space. A non-NULL value overrides the contact's usual phone number; added to accommodate the existing phone-extension naming convention. |  |
| `contactRole` | integer (ContactRole2) | Role of the person or company on this record, such as listing broker, buyer or seller. | see `ContactRole2` in Allowed values |
| `locationId` | integer (nullable) | The contact's location - the main work location of the contact. |  |
| `preferredPhoneType` | integer (PhoneType) | Code identifying the contact's preferred phone-number type, such as Contact Phone, Mobile, Fax, Other, or Override. | 0 = Unknown, 1 = Phone, 2 = Mobile, 3 = Fax, 4 = Other, 5 = Override |

### LeaseDealFreeRentSchedule

Found at: `leaseDeal.freeRentSchedule[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `calendarMonth` | integer (nullable) | Calendar month (1-12, where 1=January through 12=December) in which the free rent applies. |  |
| `calendarYear` | integer (nullable) | The calendar year in which the free-rent term applies. |  |
| `freeRentPercent` | decimal (nullable) | Percentage of rent that is free (abated) during the scheduled term. |  |
| `id` | integer | Primary key enforcing uniqueness of a free-rent schedule entry within a lease deal's concession terms. |  |
| `intervalMonthCount` | decimal (nullable) | Number of months over which this free-rent entry recurs/spreads, describing how the abatement is distributed across the term. |  |
| `leaseMonth` | integer (nullable) | The month, counted from when the lease actually began, to which this free-rent term applies. |  |

### Note

Found at: `leaseDeal.notes[]`, `entities[].notes[]`, `notes[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `noteType` | integer (NoteType) | A pre-defined categorization of note text, typically referred to as 'Notes' in CRM Enterprise. | see `NoteType` in Allowed values |
| `value` | text (nullable) | The body (free-text content) of the note. |  |

### LeaseDealRateEscalation

Found at: `leaseDeal.rateEscalations[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `cpiAnnualMaxPercent` | decimal (nullable) | Cap on the annual CPI-driven rent increase (collar maximum), limiting the bump regardless of how high CPI runs. |  |
| `cpiAnnualMinPercent` | decimal (nullable) | Floor on the annual CPI-driven rent increase (collar minimum), guaranteeing a minimum bump regardless of how low CPI runs. |  |
| `escalationAmount` | decimal (nullable) | Fixed dollar amount of the rate escalation. Nullable, because when an EscalationPct is specified the escalationAmount may not necessarily apply. |  |
| `escalationPercent` | decimal (nullable) | Percentage of the rate escalation. Nullable, because when an escalationAmount is specified the EscalationPct may not necessarily apply. |  |
| `fromLeaseDate` | date-time (nullable) | Calendar date on which this escalation step begins, an alternative to fromLeaseMonth for anchoring the bump to an absolute date. |  |
| `fromLeaseMonth` | integer (nullable) | Start of the negotiated term during which the rate escalation applies. A unique constraint on LeaseDealID, RateEscalationTypeID, fromLeaseMonth, and toLeaseMonth prevents multiple rows for the same term on a given lease deal and escalation type. |  |
| `id` | integer | Surrogate primary key of the rate-escalation record, added to simplify updating and deleting records. |  |
| `intervalMonthCount` | integer (nullable) | Number of months between recurring applications of this escalation when it repeats, e.g. an annual bump is a 12-month interval. |  |
| `isRepeatToEnd` | true/false | Whether this escalation step repeats on its interval through the end of the lease term rather than applying just once. |  |
| `pctOfMarketRate` | decimal (nullable) | Percentage of prevailing market rent to which rent is reset at this escalation, used for market-rate (fair-market-value) review escalations. |  |
| `percentOfCpiInputRate` | decimal (nullable) | Percentage of the Consumer Price Index movement applied as the rent increase for a CPI-indexed escalation, e.g. 80 percent of CPI. |  |
| `rateActualAfterEscalation` | decimal (nullable) | Resulting actual contract rent rate after this escalation has been applied; the stepped-up rent figure feeding effective-rent calculations. |  |
| `rateEscalationAmountType` | integer (RateEscalationAmountType) | Unit/basis for the escalation amount (e.g. per square foot, per month, total), needed to normalize the bump into a comparable rent figure. | 0 = None, 1 = StepRatePerAreaOrAmount, 2 = StepPercent, 3 = ConsumerPriceIndex, 4 = ToMarket |
| `rateEscalationType` | integer (RateEscalationType) | Code describing if and how the contract rent steps up over the term (escalation method) — e.g. fixed periodic bumps, CPI-indexed, or market-rate reviews. Displayed as a single escalation % with pattern, or 'Varying' for multiple steps. | 0 = Unknown, 1 = MonetaryIncrease, 2 = ConsumerPriceIndex, 3 = FixedPercentIncrease, 4 = Negotiable, 12 = ToMarket, 13 = EachCalendarYear, 14 = MidLeaseTerm, 15 = SpecificDate, 16 = IntervalAfterLeaseStart, 17 = IntervalStartingOnSpecDate |
| `toLeaseMonth` | integer (nullable) | End of the negotiated term during which the rate escalation applies. A unique constraint on LeaseDealID, RateEscalationTypeID, fromLeaseMonth, and toLeaseMonth prevents multiple rows for the same term on a given lease deal and escalation type. |  |

### LeaseReviewDate

Found at: `leaseDeal.reviewDates[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Unique identifier of a lease review-date record within a lease deal. |  |
| `leaseReviewType` | integer (LeaseReviewType) | Code classifying the type of scheduled lease review (e.g. rent review / market-rent review), describing the contractual review event. | 0 = Unknown, 1 = OpenMarket, 2 = Index |
| `reviewDate` | date-time | Date of a scheduled lease (rent) review at which contract rent may be reset to market; common in UK leases. Surfaced on the Lease Comps financial terms as a rent-review pattern plus date(s). |  |

### SpaceOccupied

Found at: `spaces[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `buildOut` | integer (BuildOut) | Value describing the build-out type of the occupied space (the nature of the tenant improvements present). | see `BuildOut` in Allowed values |
| `buildOutConditionType` | integer (BuildOutConditionType) | Condition of the space's build-out/fit-out (e.g. shell, second-generation, fully built), indicating readiness for occupancy. | 0 = Unknown, 1 = PartiallyDemolished, 2 = NeedsRenovation, 3 = Average, 4 = Excellent, 5 = Trophy, 6 = Renovated |
| `buildOutStatus` | integer (BuildOutStatus) | Status of the space build-out (e.g. existing, planned, under construction), describing where the fit-out stands. | 0 = Unknown, 1 = RawSpace, 2 = ShellSpace, 3 = PartialBuildOut, 4 = FullBuildOut, 5 = SpecSuite |
| `id` | integer | Unique identifier of the occupied-space record representing space taken off-market and physically occupied under a lease. |  |
| `loadBay` | SpaceOccupiedLoadBay object (nullable) | Loading-bay attributes of the occupied industrial space (dock/load configuration); a key industrial logistics attribute of the space. |  |
| `monthsOnMarket` | integer (nullable) | Number of months the space was marketed before being taken off-market and occupied; derived from on-market and off-market dates. |  |
| `propertyFloorId` | integer | A number uniquely identifying a floor on any property; foreign key locating the occupied space on its floor within the building. |  |
| `spaceLayout` | integer (SpaceLayout) | Code describing the physical layout/configuration of the occupied space (e.g. open plan, divided offices). | 0 = Unknown, 1 = OpenPlan, 2 = MostlyOpenPlan, 3 = PrivateOffices |
| `spacePosition` | integer (SpacePosition) | Retail space position (End Cap, In-line, Outparcel/Pad, Anchor, In-Store) describing where the occupied space sits within a center. | 0 = Unknown, 1 = FoodCourt, 2 = Inline, 3 = EndCap, 4 = Outparcel, 5 = Corner |
| `squareFeetOccupied` | decimal (nullable) | Rentable square footage physically occupied in this space; the area driver for occupancy and net/gross absorption measurement. Restricted and suppressed space-for-lease is excluded from aggregate SF. |  |
| `squareFeetOffice` | decimal (nullable) | Office portion of the occupied space in square feet. Relevant to industrial/flex office content. |  |
| `squareFeetUsable` | decimal (nullable) | Usable (tenant-exclusive) square footage of the occupied space, excluding shared common area; distinct from rentable area. |  |
| `suite` | text (nullable) | Suite (or unit) number of the occupied space. NULL when the tenant cannot be identified; otherwise derived from the tenant's address. Its data size should match the corresponding field in SpaceForLease, SpaceOccupied, and CondoUnit. |  |

### SpaceOccupiedLoadBay

Found at: `spaces[].loadBay`

| Field | Type | Description | Values |
|---|---|---|---|
| `driveInBayState` | integer (RecordStateType) | Indicating the presence/availability status of drive-in bays (grade-level doors) for the occupied industrial/flex space. | 0 = Unknown, 1 = Yes, 2 = No |
| `loadingDockState` | integer (RecordStateType) | Indicating the presence/availability status of loading docks for the occupied industrial space; a core logistics loading attribute. | 0 = Unknown, 1 = Yes, 2 = No |
| `numDriveInBays` | integer (nullable) | Count of drive-in bays (grade-level doors a vehicle drives directly through) serving the occupied space; a key loading-access attribute. |  |
| `numExternalLoadingDocks` | integer (nullable) | Count of exterior loading docks serving the occupied space; a key industrial/distribution logistics attribute. |  |
| `numInternalLoadingDocks` | integer (nullable) | Count of interior loading docks serving the occupied space. |  |

## Allowed values

### LocationOccupancyExpirationReason

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | MoveIntoAnotherProperty |
| 2 | UnableToConfirm |
| 3 | MovingIntoHomeOffice |
| 4 | ClosedLocationOrBankrupt |
| 5 | NoLongerInCustomerMarket |
| 6 | MovingIntoExecutiveSuite |
| 7 | Renewal |
| 8 | ShedSpace |
| 9 | SubletSpace |
| 10 | MovingOutNewAddressUnknown |
| 11 | Coversion |
| 12 | MovingIntoSameBuilding |
| 13 | MovingOutShellCompany |
| 14 | OccupancySplit |

### IndustryType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | Accountants |
| 2 | Transportation (also TransportationAndWarehousing) |
| 3 | EngineersOrArchitects |
| 4 | RealEstate |
| 5 | Manufacturing |
| 6 | RetailersOrWholesalers (also Retailer) |
| 7 | FinancialInstitutions (also FinanceAndInsurance) |
| 8 | ComputersOrDataProcessing |
| 9 | PublicAdministration (also Government) |
| 10 | AgriculturalOrMiningOrUtilities (also Construction) |
| 11 | Information (also Communications) |
| 12 | ProfessionalScientificAndTechnicalServices (also BusinessServices) |
| 13 | PersonalServices (also Services) |
| 14 | Insurance |
| 15 | HealthCareAndSocialAssistance (also Medical) |
| 16 | LawFirms |
| 17 | AccommodationAndFoodServices |
| 18 | AdministrativeAndSupportServices |
| 19 | AgricultureForestryFishingAndHunting |
| 20 | ArtsEntertainmentAndRecreation |
| 21 | EducationalServices |
| 22 | ManagementOfCompaniesAndEnterprises |
| 23 | MiningQuarryingAndOilAndGasExtraction |
| 24 | RentalAndLeasingServices |
| 25 | Utilities |
| 26 | WasteManagementAndRemediationServices |
| 27 | Wholesaler |

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

### LeaseDealSourceType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | PublicRecord_Foia |
| 2 | PublicRecord_SecFiling |
| 3 | PublicRecord_CmbsFiling |
| 6 | Media_NewsOutlets |
| 7 | ThirdParty_LandlordRep |
| 8 | Direct_Landlord |
| 9 | ThirdParty_TenantRep |
| 12 | Direct_Tenant |
| 14 | Direct_PressRelease |
| 15 | PublicRecord_CountyFiling |
| 16 | PublicRecord_Other |
| 17 | ThirdParty_Appraiser |
| 18 | ThirdParty_PressRelease |
| 19 | ThirdParty_PropertyManager |
| 20 | ThirdParty_Other |
| 21 | Direct_PowerBrokerSubmission |
| 26 | PublicRecord_HMLandRegistry |
| 27 | ThirdParty_Explore |

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

### BuildOut

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | StandardOffice |
| 2 | FinancialServices |
| 3 | ProfessionalServices |
| 4 | LawFirm |
| 5 | CallCenter |
| 7 | GovernmentFacility |
| 8 | LiveWork |
| 9 | StandardIndustrial |
| 10 | StorageAndDistribution |
| 11 | SelfStorage |
| 12 | Warehouse |
| 13 | StandardRetail |
| 14 | RestaurantsAndCafes |
| 15 | FastFood |
| 16 | Bank |
| 17 | ConvenienceStore |
| 18 | BarOrNightclub (also DrinkingEstablishment) |
| 19 | StandardFlex |
| 21 | StandardMedical |
| 22 | Dental |
| 23 | PhysicalTherapy |
| 24 | ResearchAndDevelopment |
| 25 | Healthcare |
| 26 | Specialty |
| 28 | ReligiousFacility |
| 29 | MovieTheater |
| 30 | PopupTemporary |
| 31 | PoliceFireStation |
| 32 | PostOffice |
| 33 | CarDealership |
| 34 | QuickService |
