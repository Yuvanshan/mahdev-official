# Shared application modules

`shared/` contains framework-independent domain contracts and public site metadata used by both the browser and server:

- `domain/` holds reusable business rules such as identity, phone, and image-alt normalization.
- `config/` holds public company/division information, SEO rules, and site-origin routing.
- `data/` holds public division-specific SEO content used by both runtime pages and server rendering.
- `types/` holds contracts shared by frontend and backend code.

Keep React, browser SDK, HTTP framework, database-provider, and secret-dependent code out of this directory. The frontend source paths re-export these modules where existing application imports need a stable path.
