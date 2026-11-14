# Company Detail

A company detail record describes one company location: one office, store or site of a company. It holds the location's name, address, phone number, number of employees, and the company profile: business type, industry, website and description. The tenants in location-occupancy are company locations, so this dataset says who each tenant is.

## What this entity is

CoStar records tenants as company locations, not as whole companies. A company with offices in three buildings has three company locations, each with its own `id`, address and employee count. `profile.companyName` names the company the location belongs to, so locations of the same company share it.

The kit holds the 49,575 company locations that occupy space in the kit's commercial properties, now or in the past.

## Joining from location-occupancy

`tenantLocationId` on a location occupancy is the `id` of a company detail record.

- 57,225 of the 74,093 occupancies have a `tenantLocationId` that joins to a company detail record.
- 16,867 occupancies have no `tenantLocationId`. Their tenant is unknown, and the occupancy's own `industryType` is the only thing known about it.
- A company location can have several occupancies: 5,046 have more than one, and 564 occupy space in more than one of the kit's properties.
- For 44,215 occupancies, the company location's `address.id` equals the occupancy's `addressId`: the location's address is the building it occupies.

To list the current tenants of a building, take its occupancies with a null `toDate`, then join each `tenantLocationId` to `id` here for the name, industry and employee count.

## Using this data

- **Name.** `name` is the name of this location. `profile.companyName` is the company's name; group by it to count a company's locations.
- **Industry.** Use `profile.industryType` for a known tenant. The occupancy's `industryType` is only meaningful for unknown tenants.
- **Business status.** `businessStatus` 2 (OutOfBusiness) marks 7,637 locations that have closed. Their past tenancies are still in location-occupancy.
- **Office type.** `officeType` says what the location is to its company: 5 (SingleLocation) on 19,790 records, 0 (Unknown) on 15,638, then branches and headquarters.
- **Business type.** `profile.businessType` describes the company as a real estate player (Brokerage, Lender, Retailer). It is 0 (Unknown) for most companies that are only tenants; use `profile.industryType` to describe what they do.
- **Missing values.** 1,332 records have no `address`, 278 no `profile`, and 18,306 no `numEmployees`.

## Joining to other models

Join on integer ids, never on names.

- `id` is the company location id. It joins to `location-occupancy` `tenantLocationId`, and is unique in the file.
- One company location can have several occupancies, in one or several properties. Join from the occupancy to this record, not the other way.
- `address.id` usually equals the occupancy's `addressId`, and matches an address id in `commercial-property` (`primaryAddress.id` or `addresses[].id`).
- `profile.companyName` groups the locations of one company.
- `id` joins to `apartment-listing` `propertyManagementCompanyId` (1,072 communities) and `propertyManagementCompanyHqLocationId` (116).

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### CompanyDetail (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the company location, the `tenantLocationId` of location-occupancy. Each record is one office or site of a company. |  |
| `address` | LocationDetailAddress object (nullable) | Street address of the company location. For most locations this is the address of the building it occupies. |  |
| `aliases` | list of text values | Other names the company location is known by, such as a former or legal name. |  |
| `businessStatus` | integer (LocationBusinessStatus) | Whether the company location is still in business. Out-of-business locations are included; their past tenancies are in location-occupancy. | 0 = Unknown, 1 = Active, 2 = OutOfBusiness, 3 = ShellCompany, 4 = MoveOrMerge, 5 = IndividualOwner, 6 = Undetermined, 7 = PendingDelete, 8 = ActivePaperCompany |
| `locationPhone` | text (nullable) | Main phone number of the company location. The number is fake: area code 555, the same fake for the same real number in every dataset. |  |
| `locationPhoneCountryCode` | text (nullable) | Three-letter country code of `locationPhone`. |  |
| `numEmployees` | integer (nullable) | Number of employees at this location, as researched by CoStar. |  |
| `profile` | LocationDetailProfile object (nullable) | The company profile shown for this location: its type, industry, website and description. |  |
| `mailingAddress` | LocationDetailAddress object (nullable) | Postal address of the company location, when it differs from or adds to `address`, such as a PO box. |  |
| `name` | text (nullable) | Name of the company location, such as `The Hileman Company LLC`. |  |
| `officeType` | integer (OfficeType) | What this location is to its company, such as main headquarters, branch or single location. | 0 = Unknown, 1 = MainHeadquarters, 2 = DivisionalHeadquarters, 3 = CorporateOffice, 4 = Franchise, 5 = SingleLocation, 6 = RetailStoreOrBranch, 7 = Industrial, 8 = OnSitePropertyManagement, 9 = NoPhysicalLocation |
| `suite` | text (nullable) | Suite or unit at the address, as entered. Values can carry trailing spaces. |  |
| `brandProfiles` | list of LocationBrandProfile objects | Brands the location operates under, on the few locations that have one. |  |
| `latitude` | decimal (nullable) | A map position for the location itself, on 164 records. It is usually within about 100 meters of `address.latitude` and `address.longitude`; prefer those. |  |
| `longitude` | decimal (nullable) | Longitude of the location's own map position, on 164 records. Prefer `address.longitude`. |  |

### LocationDetailAddress

Found at: `address`, `mailingAddress`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the address. On most occupancies it equals the occupancy's `addressId`, and it matches an address id in commercial-property. |  |
| `buildingName` | text (nullable) | Name of the building, such as `Century Plaza Towers North`. |  |
| `buildingNumber` | text (nullable) | Building number or name within a complex, such as `2` or `Phoenix`. |  |
| `city` | text (nullable) | City name as entered, so capitalization varies (`Houston`, `houston`). |  |
| `cityId` | integer (nullable) | CoStar id of the city. |  |
| `countryCode` | text (nullable) | Three-letter country code, such as `USA`. |  |
| `countyId` | integer (nullable) | CoStar id of the county. |  |
| `crossStreetDescription` | text (nullable) | Nearest cross street or a short location note, such as `SWC FM 1960 W. & Falling Creek Dr.`. Usually empty. |  |
| `latitude` | decimal (nullable) | Latitude of the address. |  |
| `longitude` | decimal (nullable) | Longitude of the address. |  |
| `postcode` | text (nullable) | Postal code. In the US this is the ZIP code. |  |
| `zip` | text (nullable) | ZIP code, filled on older addresses. Prefer `postcode`. |  |
| `postalBox` | text (nullable) | PO box number, on the few addresses that have one. |  |
| `state` | text (nullable) | Two-letter state code, such as `TX` or `CA`. |  |
| `stateId` | integer (nullable) | CoStar id of the state. |  |
| `streetDirection` | text (nullable) | Direction before the street name, such as `N` or `W`. |  |
| `streetName` | text (nullable) | Street name without number, direction or type, such as `Wilshire`. |  |
| `streetNumber` | text (nullable) | Street number, such as `1100`. |  |
| `streetNumberEndRange` | text (nullable) | Last street number when the address covers a range, such as `1120` for 1100–1120. |  |
| `streetSuffix` | text (nullable) | Direction after the street name, such as `E`. |  |
| `streetType` | text (nullable) | Street type, such as `Blvd`, `St` or `Dr`. |  |

### LocationDetailProfile

Found at: `profile`

| Field | Type | Description | Values |
|---|---|---|---|
| `businessType` | integer (BusinessType) | What kind of business the company is, from a real estate point of view, such as Brokerage, Lender or Retailer. `0` (Unknown) for most companies that are only tenants. | see `BusinessType` in Allowed values |
| `businessSubtype` | integer (BusinessSubtype) | A finer split of `businessType`, such as Brokerage_TenantRep. The name starts with its business type. | see `BusinessSubtype` in Allowed values |
| `industryType` | integer (IndustryType) | Industry of the company. Use this, not the occupancy's `industryType`, once a tenant is known. | see `IndustryType` in Allowed values |
| `websiteUrl` | text (nullable) | Company website. A few links to business directories carry a fake phone number in the address, so they do not work. |  |
| `locationBio` | text (nullable) | Description of the company, in English. Email addresses and phone numbers in it are fake. |  |
| `companyName` | text (nullable) | Name of the company the location belongs to, such as `Prudential` for the location named `Prudential Financial`. Several locations share it. |  |
| `companyNameLocal` | text (nullable) | The company name in a local spelling, on the few records that have one. |  |

### LocationBrandProfile

Found at: `brandProfiles[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `corporateBrandId` | integer | CoStar id of the brand. |  |
| `locationName` | text (nullable) | Name of the location under that brand. |  |
| `locationPhone` | text (nullable) | Phone number of the location under that brand. The number is fake, as in `locationPhone`. |  |
| `locationPhoneCountryCode` | text (nullable) | Three-letter country code of `brandProfiles.locationPhone`. |  |

## Allowed values

### BusinessType

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | CorporateRealEstateOwners |
| 2 | ResidentialDevelopers |
| 3 | EducationOrUniversity |
| 4 | Government |
| 5 | InstitutionalInvestorEquity (also InstitutionalInvestment) |
| 6 | Internal |
| 7 | InvestmentOrOwnershipOrCommercialDevelopers |
| 8 | Lender |
| 9 | PropertyManagement |
| 10 | PublicRelations |
| 11 | TaxAppeal |
| 12 | TradeGroupsOrNonprofitAssociations |
| 13 | VendorOrServices |
| 14 | AppraisalOrValuation |
| 15 | Brokerage |
| 16 | AreaAssociations |
| 17 | Telecommunications |
| 18 | Architect |
| 19 | ConsultantsRealEstate |
| 20 | MortgageBrokersOrFinance |
| 21 | Media |
| 22 | Retailer |
| 23 | BrokerageResidential |
| 24 | BrokerageResimercial |
| 25 | ConstructionCompanies |
| 26 | ExecutiveSuites |
| 27 | Hotels |
| 28 | ProfessionalServices |
| 29 | Utilities |
| 30 | TitleCompany |
| 31 | Operator |
| 32 | Academia |
| 33 | Destination |
| 34 | Bank |
| 35 | CreditUnion |
| 36 | InstitutionalInvestorFixedIncomeOrCredit |

### BusinessSubtype

| Value | Meaning |
|---|---|
| 0 | Unknown |
| 1 | CorporateRealEstateOwners_Fortune500 |
| 2 | Government_Federal |
| 3 | Government_Local |
| 4 | Government_State |
| 5 | Government_TaxAssessor |
| 6 | InstitutionalInvestment_1031ExchangeOrTenantInCommon |
| 7 | InstitutionalInvestment_CmbsOrMortgageBank |
| 8 | InstitutionalInvestment_ConsultantOrAdvisory |
| 9 | InstitutionalInvestment_InvestmentBank |
| 10 | InstitutionalInvestment_PensionFundOrInsuranceCompany |
| 11 | InstitutionalInvestment_PrivateEquityOrRealEstateFund |
| 12 | InstitutionalInvestment_RatingAgency |
| 13 | InstitutionalInvestment_Reit |
| 14 | InstitutionalInvestment_ReitAnalyst |
| 15 | VendorOrServices_Architect |
| 16 | VendorOrServices_GeneralContractor |
| 17 | VendorOrServices_Insurance |
| 18 | VendorOrServices_Landscaping |
| 19 | VendorOrServices_Maintenance |
| 20 | VendorOrServices_Moving |
| 21 | VendorOrServices_OfficeFurniture |
| 22 | VendorOrServices_Security |
| 23 | VendorOrServices_Telecom |
| 24 | VendorOrServices_Utility |
| 25 | Brokerage_Industrial |
| 26 | Brokerage_Office |
| 27 | Brokerage_Residential |
| 28 | Brokerage_Retail |
| 29 | AreaAssociations_EconomicDevelopment |
| 30 | Retailer_Fortune500 |
| 31 | InvestmentOrOwnershipOrCommercialDevelopers_Office |
| 32 | InvestmentOrOwnershipOrCommercialDevelopers_Industrial |
| 33 | InvestmentOrOwnershipOrCommercialDevelopers_Retail |
| 34 | InvestmentOrOwnershipOrCommercialDevelopers_Multifamily |
| 35 | Brokerage_Multifamily |
| 36 | Brokerage_FullServiceBroker |
| 37 | Brokerage_InvestmentSales |
| 38 | Brokerage_LandlordRep |
| 39 | Brokerage_RetailBrokerage |
| 40 | Brokerage_TenantRep |
| 41 | InstitutionalInvestment_HedgeFund |
| 42 | InstitutionalInvestment_InsuranceCompany |
| 43 | InstitutionalInvestment_MoneyInvestmentManagement |
| 44 | InstitutionalInvestment_OtherInstitutionalInvestor |
| 45 | InstitutionalInvestment_PensionEndowmentFund |
| 46 | InstitutionalInvestment_PrivateEquityFund |
| 47 | InstitutionalInvestment_SovereignWealthFund |
| 48 | InvestmentOrOwnershipOrCommercialDevelopers_CommercialDeveloper |
| 49 | InvestmentOrOwnershipOrCommercialDevelopers_OwnerOperator |
| 50 | InvestmentOrOwnershipOrCommercialDevelopers_REIT |
| 51 | InvestmentOrOwnershipOrCommercialDevelopers_HomeBuilder |
| 52 | PropertyManagement_CommercialPM |
| 53 | PropertyManagement_MultifamilyPM |
| 54 | PropertyManagement_ResidentialPM |
| 55 | AreaAssociations_Education |
| 56 | AreaAssociations_NonProfit |
| 57 | AreaAssociations_Other |
| 58 | AreaAssociations_TradeGroup |
| 59 | VendorOrServices_Other |
| 60 | VendorOrServices_ParkingGarage |
| 61 | VendorOrServices_Roofing |
| 62 | CorporateRealEstateOwners_NationalCorporateUser |
| 63 | CorporateRealEstateOwners_RegionalLocalCorporateUser |
| 64 | Government_EDOs_and_DMOs (also Government_Economic) |
| 65 | Lender_CommercialLender |
| 66 | Lender_NonCommercialLenders |
| 67 | ProfessionalServices_Architect |
| 68 | ProfessionalServices_AccountingFirms |
| 69 | ProfessionalServices_Lawyers |
| 70 | ProfessionalServices_MediaPR |
| 71 | ProfessionalServices_MortgageBrokers |
| 72 | ProfessionalServices_OtherProfessionalServices |
| 73 | Retailer_OtherRetail |
| 74 | CorporateRealEstateOwners_OtherCorpUser |
| 75 | TaxAppeal_TaxAppeal |
| 76 | AppraisalOrValuation_AppraisalValuation |
| 77 | ConsultantsRealEstate_Consultants |
| 78 | BrokerageResidential_BrokerageResidential |
| 79 | BrokerageResimercial_BrokerageResimercial |
| 80 | ConstructionCompanies_ConstructionCompanies |
| 81 | ExecutiveSuites_ExecutiveSuites |
| 82 | Hotels_Hotels |
| 83 | Utilities_Utilities |
| 84 | TitleCompany_TitleCompany |
| 85 | Hotels_HotelMembershipCompany |
| 86 | Hotels_Chain |
| 87 | Hotels_ManagementCompany |
| 88 | Hotels_OwnerOrOperator |
| 89 | Hotels_AssetManagementCompany |
| 90 | InvestmentOrOwnershipOrCommercialDevelopers_Hospitality |
| 91 | Bank_CommercialBank |
| 92 | Bank_CooperativeBank |
| 93 | Bank_IndustrialBank |
| 94 | Bank_HoldingCompanyOnly |
| 95 | Bank_InsuranceBrokerOrAgentAndOrInsuranceCompany |
| 96 | Bank_SecuritiesBrokerAndOrDealer |
| 97 | Bank_OtherNonDepositoryInstitution |
| 98 | InstitutionalInvestorFixedIncomeOrCredit_1031ExchangeTenantInommon |
| 99 | InstitutionalInvestorFixedIncomeOrCredit_CMBSMortgageBank |
| 100 | InstitutionalInvestorFixedIncomeOrCredit_ConsultantOrAdvisory |
| 101 | InstitutionalInvestorFixedIncomeOrCredit_InvestmentBank |
| 102 | InstitutionalInvestorFixedIncomeOrCredit_PensionFundOrInsuranceCompany |
| 103 | InstitutionalInvestorFixedIncomeOrCredit_PrivateEquityOrRealEstateFund |
| 104 | InstitutionalInvestorFixedIncomeOrCredit_RatingAgency |
| 105 | InstitutionalInvestorFixedIncomeOrCredit_REIT |
| 106 | InstitutionalInvestorFixedIncomeOrCredit_REITAnalyst |
| 107 | InstitutionalInvestorFixedIncomeOrCredit_HedgeFund |
| 108 | InstitutionalInvestorFixedIncomeOrCredit_InsuranceCompany |
| 109 | InstitutionalInvestorFixedIncomeOrCredit_MoneyOrInvestmentManagement |
| 110 | InstitutionalInvestorFixedIncomeOrCredit_OtherInstitutionalInvestor |
| 111 | InstitutionalInvestorFixedIncomeOrCredit_PensionOrEndowmentFund |
| 112 | InstitutionalInvestorFixedIncomeOrCredit_PrivateEquityFund |
| 113 | InstitutionalInvestorFixedIncomeOrCredit_SovereignWealthFund |

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
