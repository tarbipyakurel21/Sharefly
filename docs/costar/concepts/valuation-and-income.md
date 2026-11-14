# Valuation and Income

How investors value commercial property: the income approach, the comparable-sales approach, and the measures used to read asking prices and marketed income. Formulas are on [metrics-and-formulas.md](metrics-and-formulas.md#4-income-value-and-returns).

## Approaches to value

1. **Income approach**: value is the income divided by a rate of return. For a stabilized property, value = NOI / cap rate. Longer analyses discount a series of future cash flows at a discount rate: at 10%, $100 received in a year is worth 100 / 1.10 = $90.91 today.
2. **Sales comparison approach**: value comes from the prices of comparable sales, adjusted for differences in location, size, quality, age, occupancy, income and conditions of sale. See [sale comps and pricing](sale-comps-and-pricing.md).
3. **Cost approach**: the replacement cost of the building less depreciation, plus land value. It is used most for new or special-purpose property.

## The income statement

Working down the statement:

1. Potential rent if fully leased (gross potential rent) or base rent.
2. Add expense reimbursements, percentage rent, parking and other income.
3. Subtract vacancy and collection loss: effective gross income (EGI).
4. Subtract operating expenses: net operating income (NOI).
5. Subtract leasing commissions, tenant improvements and capital expenditure: net cash flow (NCF).

Operating expense ratio = operating expenses / EGI.

## Investor lens for income property

To judge whether a property is a good investment, assemble its tenants, contract rents, lease expiration schedule, other income, operating expenses and taxes; derive EGI, NOI and cap rate; then look at the rollover schedule for how durable the income is. Whether the sale is an investment or an owner/user sale changes which facts matter.

Net-lease properties with a creditworthy tenant, a long remaining term (ten years or more) and few landlord responsibilities command lower cap rates. Multi-tenant properties usually do not qualify as pure net-lease investments.

## Return measures

- **Cap rate**: NOI / price, the first-year income return on an all-cash purchase.
- **Income return**: NOI divided by value, the cash yield.
- **Appreciation return**: change in value over time.
- **Total return**: income return plus appreciation return.
- **Gross income multiplier (GIM)**: price / gross income, a rough screen that ignores expenses.

## In this dataset

- **Asking price, NOI and cap rate** of for-sale listings are in `forSaleSummary`: `askingPriceLow` and `askingPriceHigh` (66 listings), `netOperatingIncome` (31) and `capitalizationRate` (32). Where all three are given, the cap rate equals NOI divided by the asking price.
- **Sale prices and cap rates at sale** are on commercial-sale-comp: `soldForPrice` (3,216 comps), `capitalizationRateActual` (1,736), `capitalizationRateProForma` (248) and `grossIncomeMultiplier` (695).
- **Cap rates are percentages**: 6.54 means 6.54%. The median actual cap rate at sale is 6.4% for sales that include an apartment community, 7.0% for retail, 8.1% for office and 8.2% for industrial.
- **A listing's cap rate is the seller's figure**, usually on marketed (often pro forma) income. A comp's actual cap rate uses in-place income at sale. Do not mix the two in one average.
- The kit has no operating statements, loans or debt terms. Income questions are answered from the marketed NOI, cap rates and prices above.
