# Tenants and Occupancy

What a tenancy record describes, how occupancy differs from vacancy and availability, and how the companies behind the tenancies are described. The fields are on [models/location-occupancy.md](../models/location-occupancy.md) and [models/company-detail.md](../models/company-detail.md).

## Tenant and occupancy

A tenant is a company that occupies space in a building. An occupancy record ties a tenant to a place: which building, which floor or suite, how much space, and (when known) the lease dates and rent. One company can occupy space in many buildings, so a company is not the same as a building and a tenant is not the same as a lease.

In this kit:

- **One location-occupancy record is one tenancy** in one of the kit's properties (`propertyId`), for a period from `fromDate` to `toDate`. 74,093 records, of which 11,179 have no `toDate` and are current.
- **The space** is in `spaces[]`: the floor (`propertyFloorId`), the area occupied (`squareFeetOccupied`, filled on 64,118 of 77,250 spaces) and, for retail, the position in the center (`spacePosition`: Inline, EndCap, Corner, FoodCourt).
- **The kind of tenancy** is `leaseType`: Direct (42,912), Sublease (1,509), Owned (234, an owner in its own building), Coworking (92), MonthToMonth (74) and Unknown (29,272).
- **The lease** is `leaseDeal` when one is recorded (41,781 records). See [listings and leasing](listings-and-leasing.md#lease-comps).
- **The tenant** is `tenantLocationId`, which joins to one company-detail record. 57,225 occupancies name a tenant; a null `tenantLocationId` means the space is known to be occupied by an unidentified tenant.
- **Why a tenancy ended** is `expirationReason` on past tenancies, such as MovingOutNewAddressUnknown (44,366), ClosedLocationOrBankrupt (5,125), MoveIntoAnotherProperty (3,129), Renewal (2,331) and MovingIntoSameBuilding (1,948).

## Occupancy is not vacancy, and not availability

- Occupancy answers who is physically in the space.
- Vacancy answers how much space is empty.
- Availability answers how much space is marketed.
- A space can be leased but vacant: it has a tenant and a lease obligation but nobody has moved in. It still counts as vacant for the vacancy rate. 83 current tenancies have a move-in date still to come.

## Lease expirations and rollover

Lease expiration and remaining term drive many tenant questions: which tenants have leases ending soon, which may expand or downsize, and how much income in a building is at risk when leases roll. Remaining term for one lease = (expiration date - today) / 365.25 years. For a set of leases, weight the average remaining term by rent or area (WALT) or report a simple average and say which.

In this kit `leaseDeal.expirationDate` is filled on 15,547 lease deals, but on only 1,219 of the current tenancies, so expiration analysis covers a small share of the tenants in place. Say how many tenancies your answer covers.

## Retail tenancy

Retail tenants have a position in the center (end cap, in-line, outparcel, anchor). An anchor tenant draws traffic and gives smaller tenants a co-tenancy benefit. The tenant mix (co-tenancy) matters for value.

## Companies and their locations

A company-detail record is one location of a company: an office, store or site. One company can have many locations, and each tenancy points at the location that occupies the space.

- **Name.** `name` is the location's name and `profile.companyName` the company's. 3,172 company names have more than one location in this kit; the largest are apartment managers such as Greystar Real Estate Partners (257 locations).
- **What the location is.** `officeType`: SingleLocation (19,790), CorporateOffice (4,828), MainHeadquarters (4,375), OnSitePropertyManagement (2,952), RetailStoreOrBranch (1,553), DivisionalHeadquarters (295), Unknown (15,638) and others.
- **Whether it is still in business.** `businessStatus`: Active (40,818), OutOfBusiness (7,637), ShellCompany (427), MoveOrMerge (57) and others. Filter to Active for questions about current companies.
- **What it does.** `profile.industryType` (filled on 41,629 locations) and `profile.businessType`. Use these rather than the occupancy's own `industryType`, which is Unknown on nearly every record.
- **How big it is.** `numEmployees` (30,796 locations).

When ranking or counting tenants, say whether the count is of locations or of companies, and check the business status.

## Typical tenant questions

- Who occupies this building now, and how much space does each tenant take?
- Which tenants have leases expiring in the next 24 months in this submarket?
- Where else does this company have locations in Houston or Los Angeles?
- Which tenants are future move-ins?
- What industry is a tenant in?
- Which tenants left a building, and why?
