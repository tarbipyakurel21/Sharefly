# Apartment Listing

An apartment listing record is one apartment community's rental listing, as marketed on Apartments.com: the asking rents and the number of units available, for the community as a whole and for each of its floor plans, with the management company and the community's main photo. There is one record per community, and every record is an active listing.

## What this record is

A community is one apartment property rented out unit by unit: the `propertyType` 11 (Multifamily) properties of commercial-property, which carry a `propertyApartment` block. Its Apartments.com listing advertises the floor plans that have units to rent, each with a rent range. The record is that listing's summary: `minRent` and `maxRent` across the community, `numUnitsAvailable`, and `apartmentModels[]` with one entry per floor plan, holding its unit count, units available, size, bedrooms, bathrooms and rent range.

The kit holds the 1,747 communities whose listing was active on 2026-11-12: 980 in Houston and 767 in Los Angeles, of the 2,765 apartment communities in commercial-property. They have 365,203 units, of which 40,037 are available.

## Using this data

- **Rent is monthly, in dollars.** `minRent` and `maxRent` on the record are the lowest and highest asking rents across the community's floor plans, and each floor plan has its own. The median community `minRent` is $1,210 where one is given. `rentPricingType` 2 (PerBed) marks 319 floor plans in student housing priced by the bed; compare those by the bed, not the unit.
- **0 means no rent was given.** 571 communities and 4,364 floor plans have a `minRent` of 0, and 506 floor plans have none. Leave them out before averaging.
- **Availability.** `numUnitsAvailable` is the number of units that can be rented now, the sum of the floor plans' `numUnitsAvailable`. 70 communities report 0 and 11 report nothing; 679 floor plans report nothing.
- **Units.** `totalNumUnits` is the community's unit count and `totalActiveUnits` the units across the floor plans listed. They match on 1,597 communities; where they differ, the listing does not cover every unit.
- **Floor plans join to the property.** `apartmentModels[].id` is `propertyApartment.models[].id` on the property record for 23,755 of the 23,806 floor plans, where the plan's amenities, attachments and unit list are. The property record has the unit mix of every community; this record adds rents and availability for the listed ones.
- **Who runs the community.** `propertyManagementCompanyName` names the manager; Greystar Real Estate Partners manages 157 of the communities. `propertyManagementCompanyId` joins to company-detail `id` for 1,072 communities.
- **Studios and baths.** `numBeds` 0 is a studio (2,374 floor plans). `numBaths` has half and quarter baths as decimals.
- **Currency.** `monetaryUnit` is 1 (US dollars) on 1,665 communities and 0 (Unknown) on 82, and 0 on 532 floor plans. Every community is in Texas or California, so treat 0 as US dollars.
- **Photo.** `primaryPhoto.attachmentUri` links to the community's main photo at size 112; replace the `/112/` segment with 113 or 116 for another size.

## What is in this dataset

- **Which listings:** the active Apartments.com listing of every community in `commercial-properties.csv` that had one on 2026-11-12, one record per community. A community without an active listing has no record; its unit mix is on the property record.
- **Floor plans:** 23,806, between 1 and 155 per community, median 9. 18,936 carry a rent.
- **Who the community is for:** `lifestyleType` is 1 (All) on 1,680 communities, 2 (Senior) on 29, 3 (Student) on 20 and 5 (Corporate) on 14.
- **Address:** `address` is the property's primary address, with latitude and longitude, and `address.id` equals the property's `primaryAddress.id`.
- **Contacts:** the management company's name and ids. The record has no personal names, phone numbers or email addresses.

## Joining to other models

Join on integer ids, never on names.

- `propertyId` joins to `commercial-property` `id`, and is unique in the file: one listing per community.
- `apartmentModels[].id` joins to `propertyApartment.models[].id` on the property record (23,755 of 23,806 floor plans), which carries the plan's amenities, attachments and units.
- `propertyManagementCompanyId` joins to `company-detail` `id` for 1,072 of the 1,747 communities, and `propertyManagementCompanyHqLocationId` for 116.
- `address.id` equals the property's `primaryAddress.id`.
- `primaryPhoto.attachmentMasterId` matches an `attachments[].attachmentMasterId` on the property record for 1,061 communities.

## Fields

Each record is one JSON object. Field names are camelCase. Enum fields are stored as integers; the Values column (or the Allowed values section) gives the meaning of each code. "Nullable" means the value can be null, and a missing value is also null.

### ApartmentListing (the record)

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the listing: one apartment community's rental listing. It is unique in the file, and so is `propertyId`. |  |
| `propertyId` | integer (nullable) | Id of the community, the `id` of its commercial-property record. |  |
| `buildingName` | text (nullable) | Marketing name of the community, such as `City Lights on Fig`. Empty on 59 records. |  |
| `address` | ApartmentListingAddress object (nullable) | Street address of the community: the property's primary address, with latitude and longitude. |  |
| `yearBuilt` | integer (nullable) | Year the community was built. |  |
| `totalNumUnits` | integer (nullable) | Number of units in the community. |  |
| `totalActiveUnits` | integer (nullable) | Number of units across the floor plans in `apartmentModels`; the sum of their `numUnits`. It equals `totalNumUnits` on 1,597 records. |  |
| `numUnitsAvailable` | integer (nullable) | Number of units that can be rented now, the sum of the floor plans' `numUnitsAvailable`. Null on 11 records and 0 on 70. |  |
| `minRent` | integer (nullable) | Lowest asking rent across the community's floor plans, in dollars per month. 0 means no rent was given (571 records). |  |
| `maxRent` | integer (nullable) | Highest asking rent across the community's floor plans, in dollars per month. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency of the rents: 1 (US dollars) on 1,665 records and 0 (Unknown) on 82. Every community is in Texas or California. | see `MonetaryUnit` in Allowed values |
| `minSquareFeet` | integer (nullable) | Size of the smallest unit across the floor plans, in square feet. |  |
| `maxSquareFeet` | integer (nullable) | Size of the largest unit across the floor plans, in square feet. |  |
| `lifestyleType` | integer (ApartmentLifestyleType) (nullable) | Who the community is for: 1 (All) the general market, 2 Senior, 3 Student, 5 Corporate. 0 on 4 records. | 0 = Unknown, 1 = All, 2 = Senior, 3 = Student, 4 = Military, 5 = Corporate, 6 = Vacation |
| `primarySubmarketId` | integer (nullable) | Id of the community's CoStar submarket, as `primarySubmarketId` on the property record. The kit has ids only. |  |
| `propertyManagementCompanyId` | integer (nullable) | Id of the company location that manages the community. It joins to company-detail `id` on 1,072 records. |  |
| `propertyManagementCompanyName` | text (nullable) | Name of the management company, such as `Greystar Real Estate Partners`. |  |
| `propertyManagementCompanyHqLocationId` | integer (nullable) | Id of the management company's headquarters location. It joins to company-detail `id` on 116 records. |  |
| `primaryPhoto` | ApartmentListingPhoto object (nullable) | The community's main photo. |  |
| `apartmentModels` | list of ApartmentListingFloorPlan objects | The community's floor plans, one entry each, with units, availability, size and asking rent. |  |

### ApartmentListingAddress

Found at: `address`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the address; equals `primaryAddress.id` on the property record. |  |
| `streetNumber` | text (nullable) | Street number, as text. |  |
| `streetNumberEndRange` | text (nullable) | Last street number when the address covers a range. |  |
| `streetDirection` | text (nullable) | Direction before the street name, such as `S` or `NW`. |  |
| `streetName` | text (nullable) | Street name without its type. |  |
| `streetType` | text (nullable) | Street type, such as `St`, `Ave` or `Blvd`. |  |
| `streetSuffix` | text (nullable) | Direction after the street name, such as `SW`. |  |
| `buildingNumber` | text (nullable) | Building number or name within a complex. |  |
| `crossStreetDescription` | text (nullable) | Nearest cross street, as text. |  |
| `city` | text (nullable) | City. |  |
| `countyId` | integer (nullable) | CoStar id of the county. |  |
| `state` | text (nullable) | Two-letter state code: `TX` or `CA`. |  |
| `postCode` | text (nullable) | ZIP code, five or nine digits without a hyphen. |  |
| `countryCode` | text (nullable) | Three-letter country code, `USA` on every record. |  |
| `latitude` | decimal (nullable) | Latitude of the address, in decimal degrees. |  |
| `longitude` | decimal (nullable) | Longitude of the address, in decimal degrees. |  |

### ApartmentListingPhoto

Found at: `primaryPhoto`

| Field | Type | Description | Values |
|---|---|---|---|
| `attachmentMasterId` | integer | Id of the photo. The same id is in the property record's `attachments` on 1,061 records. |  |
| `attachmentType` | integer (AttachmentType) | Kind of photo: 4 (BuildingPhoto) on 1,432 records, 33 (InteriorPhoto) on 304 and 6 (Lobby) on 11. | see `AttachmentType` in Allowed values |
| `attachmentTypeExtension` | integer (AttachmentTypeExtension) | File type: 6 (Jpg) or 9 (Png). | see `AttachmentTypeExtension` in Allowed values |
| `caption` | text (nullable) | Caption of the photo, on 1,277 records. |  |
| `attachmentUri` | text (nullable) | Link to the photo on CoStar's CDN at image size 112 (up to 1,880 by 900 pixels). Replace the `/112/` segment with 113 (1,400×720) or 116 (2,048×2,048) for another size. |  |

### ApartmentListingFloorPlan

Found at: `apartmentModels[]`

| Field | Type | Description | Values |
|---|---|---|---|
| `id` | integer | Id of the floor plan; equals `propertyApartment.models[].id` on the property record, which carries the plan's amenities, attachments and units. |  |
| `name` | text (nullable) | Name of the floor plan, such as `1x1` or `The Madison`. Empty on 277 plans. |  |
| `numUnits` | integer | Number of units with this floor plan. |  |
| `numUnitsAvailable` | integer (nullable) | Number of those units that can be rented now. Null on 679 plans. |  |
| `numBeds` | integer (nullable) | Bedrooms; 0 is a studio. |  |
| `numBaths` | decimal (nullable) | Bathrooms, with half and quarter baths as decimals, such as 1.5 or 2.25. |  |
| `maxOccupants` | integer (nullable) | Most occupants allowed in a unit, where given (1,520 plans). |  |
| `minSquareFeet` | integer (nullable) | Size of the smallest unit with this floor plan, in square feet. |  |
| `maxSquareFeet` | integer (nullable) | Size of the largest unit with this floor plan, in square feet. |  |
| `minRent` | integer (nullable) | Lowest asking rent for this floor plan, in dollars per month on the basis `rentPricingType` gives. 0 means no rent was given (4,364 plans); null on 506. |  |
| `maxRent` | integer (nullable) | Highest asking rent for this floor plan, in dollars per month. |  |
| `monetaryUnit` | integer (MonetaryUnit) (nullable) | Currency of the plan's rents: 1 (US dollars) or 0 (Unknown, 532 plans). | see `MonetaryUnit` in Allowed values |
| `rentPricingType` | integer (RentPricingType) (nullable) | Basis of the rent: 1 (PerUnit) on 23,467 plans, 2 (PerBed, student housing rented by the bed) on 319, 3 (PerBedroom) on 20. | 0 = Unknown, 1 = PerUnit, 2 = PerBed, 3 = PerBedroom |

## Allowed values

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
