# Context: Current State of OpenTCGS

## Current Work Focus
The project is in early development with a basic foundation established. Currently implementing the inventory management system with mock data to demonstrate the UI and functionality. The first-time setup wizard is partially implemented, allowing for initial admin user creation. Testing framework has been added using Vitest with both browser and Node.js testing capabilities.

## Recent Changes
- Implemented basic inventory page with mock data showing card conditions and pricing
- Created first-time setup wizard with multi-step form
- Added theme switching functionality (light/dark/auto modes)
- Set up basic routing structure for main application pages
- Implemented authentication system using Better Auth
- Added Vitest testing framework with browser and Node.js support
- Created example tests for components, database, and utilities
- Updated memory bank with testing framework documentation

## Next Steps
- Complete the database schema for inventory, sales, and customer data
- Implement barcode scanning functionality
- Create sales processing interface
- Develop customer management system
- Build analytics dashboard
- Expand test coverage for all components and features

## Current Status
- **Authentication**: ✅ Implemented with Better Auth
- **Database**: 🔄 Partial (auth schema only, missing business logic schema)
- **UI Framework**: ✅ Lit with Web Awesome components
- **Routing**: ✅ Basic Koa.js server with page routing
- **GraphQL**: ✅ Basic setup with code generation
- **Inventory UI**: ✅ Mock implementation
- **Sales UI**: ❌ Not implemented
- **Analytics UI**: ❌ Not implemented
- **Barcode Scanning**: ❌ Not implemented
- **Login UI**: ❌ Not implemented
- **User Settings UI**: ❌ Not implemented
- **Admin UI - Users**: ❌ Not implemented
- **Admin UI - Settings**: ❌ Not implemented
- **Testing Framework**: ✅ Vitest with browser and Node.js support