# Geography and Markets

How places are described in commercial real estate data: administrative geography, market and submarket areas, and the rules for grouping and joining by place.

## The markets in this dataset

The data covers two CoStar research markets. Each property's market is `primaryAddress.researchMarketId`.

| Market | `researchMarketId` | Code | Properties | Submarkets used | Not included |
|---|---|---|---|---|---|
| Houston | 14 | HOU | 1,758 | 197 | |
| Los Angeles | 20 | LAX | 1,581 | 114 | Orange County (26) and the Inland Empire (16) are separate markets and are not in the data |

Every property in the kit is inside the city of Houston or the city of Los Angeles, although both markets reach well beyond the city limits. Results describe those two cities, not their whole markets.

## Where places are in the data

- **Commercial properties** carry `primaryAddress` with the street address, `city` and `cityId`, `countyId`, `stateId`, `postcode`, `latitude` and `longitude`, the market (`researchMarketId`) and the submarkets (`submarketIds[]`). `primarySubmarketId` is the property's main submarket and is always one of its `submarketIds`.
- **Listings** carry `primarySubmarketId`. Tenancies and sales do not carry their own geography: join them to the property.
- **Residential listings** carry `property.address` with the street address, `city`, `state`, `zip`, `latitude` and `longitude`, and `areas[]`, the named areas the home is in (its county, neighborhood, ZIP and metro area, among others). They have no market or submarket ids.
- **Submarket names are not in the kit.** It has submarket ids only, so label a submarket by its id or by the places inside it.
- To compare homes with commercial buildings, place both by latitude and longitude, or by ZIP code.

## Two geography systems

1. **Administrative geography**: country, state, county, city, ZIP code, and metropolitan area (CBSA).
2. **Market geography**: market and submarket. These are research areas drawn to describe competition between buildings.

Neighborhood and subdivision are used mostly for homes.

## Markets and submarkets are not administrative areas

A market is a contiguous area where buildings of one property type compete for the same tenants. Markets do not overlap, and together they cover a region. Markets divide into submarkets.

- A market can cross state, county and city lines. The Houston market covers the counties around the city; the Washington DC market includes parts of Maryland and Virginia.
- Do not equate "market" with a city, a metro area or an MSA, and do not derive a submarket from a ZIP code.
- Markets and submarkets are drawn per property type, so one building can belong to a different submarket for office than for industrial. Pair a market or submarket filter with the property type.

## Choosing the right grain

| Phrase | Grain |
| --- | --- |
| "in Texas", "in California" | State |
| "in Los Angeles" | Ambiguous: the city, the county or the CoStar market. Every property here is in the city; say which you mean |
| "in Houston" | The city or the market. The market reaches into surrounding counties |
| "by city", "top cities" | City (only two in this kit) |
| "county" | County |
| "metro", "MSA" | CBSA or metro area |
| "market", "submarket", or a named submarket | Market geography |
| "neighborhood" | A named area in a residential listing's `areas[]` |

If a place name could be a city, a county, a market or a submarket, say which one you used.

## Join and group by identifiers, not names

City, county and submarket names repeat across states (there are many Springfields), and spelling and capitalization vary: the kit has "Houston" and "houston", "Los Angeles" and "LOS ANGELES". Group and join on identifiers (`cityId`, `countyId`, `primarySubmarketId`), not name strings.

A good pattern for "top X in a place":

1. Resolve the place to an identifier at the right grain.
2. Filter records by that identifier.
3. Aggregate the ranking measure (count of deals, total sale volume, total area).
4. Sort in descending order.
5. Verify totals with a separate count.

## Central business district

The central business district (CBD), the downtown core, versus suburban areas is a common split within a metro, most of all for office buildings.
