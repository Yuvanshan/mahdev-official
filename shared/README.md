# Shared application modules

`shared/` contains framework-independent modules used by both the browser and server:

- `domain/` holds reusable business rules such as identity and phone normalization.
- `config/` holds public company data used by both the site and server-generated documents.
- `types/` holds contracts shared by frontend and backend code.

Keep React, browser SDK, HTTP framework, database-provider, and secret-dependent code out of this directory. The frontend source paths re-export these modules where existing application imports need a stable path.
