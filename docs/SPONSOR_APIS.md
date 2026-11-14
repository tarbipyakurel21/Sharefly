# Sponsor API and resource registry

All links below are official starting points. “Unverified” means the event-specific offer or requirement was not confirmed; it is not a claim that the service is free.

| Resource | Official portal/docs | Auth and env | State / fallback |
|---|---|---|---|
| Gemini API | [ai.google.dev](https://ai.google.dev/gemini-api/docs) | API key; `GEMINI_API_KEY` | Planned; mock provider and deterministic fixtures |
| Amazon Bedrock | [AWS Bedrock docs](https://docs.aws.amazon.com/bedrock/) | AWS IAM; AWS env vars | Conditional; local model/mock |
| LangChain Deepagents | [LangChain docs](https://docs.langchain.com/) | Provider-specific | Unverified event integration; ordinary LangChain fallback |
| Photon 2.0 | Event sponsor portal/access required | Sponsor credentials; `PHOTON_API_KEY` | Unverified; mock messaging adapter |
| Grok Bot / SpaceXSI | [xAI docs](https://docs.x.ai/) | xAI account/API as applicable | Workflow evidence; do not claim product eligibility without event confirmation |
| ChatOverflow coding agent | Sponsor access required | Unverified | Not an API assumption; record demo evidence if approved |
| MongoDB Atlas | [Atlas docs](https://www.mongodb.com/docs/atlas/) | Connection URI; `MONGODB_URI` | Atlas free tier and $50 student credit are advertised on Devpost; verify current redemption |
| Tiger Data / Tiger Cloud | [Tiger Data docs](https://docs.tigerdata.com/) | PostgreSQL URL; `TIGERDATA_DATABASE_URL` | Planned; local PostgreSQL fallback |
| Vultr | [Vultr API docs](https://www.vultr.com/api/) | API key; `VULTR_API_KEY` | Conditional; local/container deployment fallback. Credits advertised, amount unverified |
| Solana | [Solana docs](https://solana.com/docs) | RPC URL/wallet; `SOLANA_RPC_URL` | Conditional; local validator/mock ledger |
| Capital One Nessie | [Nessie](http://api.nessieisreal.com/) | API key; `NESSIE_API_KEY` | Requires account/key; use fixture data when unavailable |
| CoStar, Matterport, Vexcel | Sponsor portals; access not verified | Sponsor-issued or restricted datasets | Not public API assumptions; ask organizers |
| NIST CFReDS | [NIST CFReDS](https://cfreds.nist.gov/) | No API assumed | Public dataset resource, not an API; verify licensing/use |
| GoDaddy Registry | [Registry](https://registry.godaddy/) | Registration account | Domain offer/process requires event confirmation |
| DEV | [DEV API/docs](https://developers.forem.com/api) | Account/token if API used | Publishing is not necessarily API integration; verify event article rules |

## Credential and testing policy

Never put credentials in Markdown or Git. Acquire keys only from the linked official portal, store them in local `.env`, redact logs, and test through a provider interface plus a mock adapter. Every adapter needs timeout, retry/rate-limit handling, input validation, and a graceful fallback. Exact credits, promo codes, rate limits, SDK repositories, and sponsor-issued credentials remain unverified until official event instructions are supplied.

