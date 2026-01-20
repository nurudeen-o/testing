# REST API Design for Civic Facilities Data

## Why I structured it this way

**URLs** like `GET /v1/facilities` (collection) and `GET /v1/facilities/:id` follow the most common pattern of REST. Frontend Devs and API Partners know this structure right off the bat without any documentation. The data in the response is structured in such a way that the key names are obvious, and Frontend Devs know what the values should be.

**Filtering via query parameters** `?region=...&category=...&q=...` keeps the design flexible. Future filters like `status=open`, `lga=...`, or `radius=...` without changing the route structure in the future.


**Minimal dependencies** using the pure `http` module reduces boilerplate and keeps the microservice small. In production, a framework like Express can be added, but the original data flow remains the same.

## How I would handle versioning and breaking changes

I'd stick with URI versioning (`/v1`, `/v2`) and follow the below guidelines:

**Non-breaking changes that stay in v1:**
- Adding new optional fields like `contacts` or `hours`
- Adding new endpoints such as `/v1/regions`

**Breaking changes that require a new major version:**
- Renaming or removing fields 
- Changing the data types

**Practical production handling:**
- Publish a changelog and migration guide when releasing `/v2`
- Optionally add `Deprecation` HTTP headers when a version is scheduled to be phased out

## What I would clarify with engineers before building it in production

### Data
- How often does the data update? Real-time, daily, weekly batches?
- Do facilities ever get removed, renamed, or merged? We'd need stable IDs and a "closed" status field.

### Schema details
- How is "region" defined? State level, LGA, ward? Also ask if a facility can belong to multiple regions.
- Is the category a fixed list or admin-managed? Can one facility have multiple categories?
- Mandatory fields. Should we enforce name, geo, and address as required?

### Search and map requirements
- Do we need queries like nearby radius searches for the frontend map?

### Partner access and governance
- Will this be open to public or would partners need API keys with quotas?
- What rate limiting protection do we need?

### Privacy and safety
- Which contact fields can be made public?
- Are there sensitive facilities that need redacted or approximate geolocation data?

## How this supports transparency and reuse in civic tech
In production, I'd add fields that are particularly valuable for building trust:
- `last_updated` timestamp
- `source` field with agency name and dataset reference
- `status` field indicating open, closed, or temporarily unavailable

If the government wants to maximize reuse and transparency:
- Publish an OpenAPI specification so developers can generate clients automatically
- Add a clear data license so people know exactly what they're allowed to do with the data

## Example endpoints
```
GET /v1/facilities?limit=10&offset=0
GET /v1/facilities?region=ikeja&limit=5&offset=5
GET /v1/facilities/:id
GET /v1/facilities?category=health&q=clinic
```