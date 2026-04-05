# OpenTCGS (Open Trading Card Game Store)

A comprehensive, open-source web application for managing independent trading card game stores. OpenTCGS provides inventory management, point-of-sale, order tracking, customer tools, and store analytics -- all built with modern web technologies.

## Why OpenTCGS?

Existing TCG store management software is expensive and often lacking in features. OpenTCGS aims to be an affordable, feature-rich alternative that independent store owners can self-host and customize to fit their business needs.

### Problems It Solves

- **Inventory tracking** -- Managing individual cards across multiple conditions, quantities, and cost bases
- **Sales processing** -- Streamlined point-of-sale with barcode scanning support
- **Customer retention** -- Tools for building loyalty programs and tracking buying patterns
- **Store analytics** -- Data-driven insights to optimize business operations
- **Cost** -- Free and open-source alternative to commercial TCG management tools

## Features

### Implemented

- **Dashboard** -- Overview of key metrics, sales data, and best sellers
- **Inventory Management** -- Full CRUD with condition-based pricing, stock lot tracking (FIFO), bulk operations, pagination, and filtering (singles vs. sealed)
- **Shopping Cart** -- Cart drawer with quantity controls, customer name entry, and order submission; supports guest checkout via anonymous authentication
- **Order System** -- Order creation with automatic inventory decrement, paginated order history with expandable line-item details
- **Card Browsing** -- Browse and search the card catalog with product type filtering
- **Card Details** -- Individual card pages with add-to-cart functionality
- **Authentication** -- Email/password login, anonymous guest users, and role-based access control (admin, employee)
- **Settings**
  - **General** -- Store name, address, EIN, automatic sales tax rate lookup
  - **Backup & Restore** -- Google Drive, Dropbox, and OneDrive OAuth integration
  - **Integrations** -- Stripe and Shopify with encrypted API key storage (AES-256-GCM)
  - **User Accounts** -- List, create, edit roles, activate/deactivate users
- **Server-Side Rendering** -- Lit SSR with client-side hydration for fast initial loads

### Planned

- Barcode scanning
- Analytics dashboard
- Customer management & loyalty programs
- Autoprice engine
- Login UI improvements
- Checkout & payment processing (Stripe)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up your development environment, coding standards, and the pull request process.

## License

This project is not yet licensed. A license will be added in a future release.
