# Klutch.gg

A skill-based competitive wagering platform focused on Call of Duty (Warzone and Multiplayer) players. Klutch.gg enables players to wager on their own performance through custom challenges, not on third-party match outcomes.

## Features

### MVP Features
- User registration and login system (email + password)
- User profiles with editable COD stats:
  - K/D Ratio (self-entered)
  - Win %
  - Bio
- Wallet system with Stripe integration
  - Deposit, escrow, and withdrawal flow
- Challenge System:
  - Challenge types:
    - Kill Race
    - Over/Under
    - Survival (Longest Alive)
  - Stake funds into escrow when creating challenges
  - Invite friends or public challenges
  - Manual result submission with screenshot upload
  - Opponent confirmation or dispute system
- Club System:
  - Create private or public clubs
  - Club-exclusive challenges
  - Basic leaderboards inside clubs
- Admin Dispute Resolution Dashboard

## Recent Updates & Enhancements

### Profile System Improvements
- Enhanced user profiles with:
  - Display name and bio customization
  - Detailed gaming statistics:
    - Kills, Deaths, K/D Ratio
    - Wins, Total Games, Win Rate
  - Real-time stat calculations
  - Improved profile editing interface
  - Enhanced privacy controls

### Technical Improvements
- Implemented NextAuth.js for secure authentication
- Added Zod validation for form inputs
- Enhanced error handling and user feedback
- Improved loading states and UI responsiveness
- Mobile-friendly navigation updates

## Tech Stack

- Next.js 14 (frontend + API routes)
- React
- Node.js
- PostgreSQL
- Auth.js (NextAuth) for authentication
- Stripe for wallet, escrow, deposits, withdrawals
- Tailwind CSS for UI styling
- Prisma as ORM
- TypeScript
- React Hot Toast for notifications
- Zod for validation

## Project Structure

```
/klutch-gg
|-- /app
|   |-- /api
|   |   |-- /auth
|   |   |-- /register
|   |-- /components
|   |-- /lib
|   |-- /pages
|-- /prisma
|   |-- schema.prisma
|-- /public
|-- .env
|-- next.config.js
|-- package.json
|-- README.md
```

## Getting Started

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```
Update the following variables in `.env.local`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/klutch_gg"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
# Create the database
createdb klutch_gg

# Push the schema
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio for database management

## Recent Development Sprints

### Sprint 6.0 - Profile System Enhancement
- Implemented gaming stats tracking
- Added profile editing capabilities
- Improved error handling and validation

### Sprint 6.1 - Stats Calculation
- Added K/D ratio calculation
- Implemented win rate tracking
- Enhanced stats display UI

### Sprint 6.2 - Profile Hotfix
- Fixed profile editing form
- Improved stats validation
- Added games played tracking
- Enhanced error notifications

### Sprint 6.3 - Dispute System & Wallet Integration
- Implemented admin dispute resolution dashboard
- Added transaction logging system for wallet events
- Enhanced challenge creation with automatic stake deduction
- Added winner payout system with transaction tracking
- Improved error handling and validation for wallet operations
- Added transaction history tracking for all wallet events

## Key Business Rules

- Klutch.gg is for skill-based wagering, not gambling
- All wagers are on personal performance in COD challenges
- No gambling on pro matches or external teams
- Result validation is manual through screenshot upload and player confirmation

## User Stories

- As a player, I can register, log in, and manage my profile
- As a player, I can deposit money into my wallet
- As a player, I can create and accept challenges
- As a player, I can view opponent stats before accepting a challenge
- As a player, I can submit results with a screenshot
- As a player, I can confirm or dispute challenge results
- As an admin, I can resolve disputes and trigger payouts
- As a player, I can create or join clubs and challenge club members

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Development Roadmap

Klutch.gg Development Sprint Map & Roadmap

✅ Completed Sprints

Sprint 1 - Project Setup & Auth
- Next.js, Prisma, PostgreSQL setup
- Auth system (Register, Login, Session Management)
- Protected Routes with Auth Middleware
- Basic Navigation Components
- Environment Configuration

Sprint 2 - Challenge System v1
- Prisma Challenge Model & Migrations
- Challenge API Endpoint (Create)
- Challenge Create Page + Form
- Challenge List Page with dummy data
- Client-Side Auth Context
- Challenge API Endpoint (Join)
- Challenge Page loads real data from database

Sprint 3 - Wallet System (v1)
- User Balance field added to DB
- Stripe Integration (Test Mode)
- Wallet Deposit Page (create deposit session)
- Stripe Webhooks (update balance on successful checkout)
- Display Balance in Navigation Bar
- Deposit Flow working with Stripe Test Checkout

Sprint 4 - Challenge Management System
- View Challenge Details (card or modal)
- Edit Challenge Stake, Opponent
- Delete Challenge option
- Redirects & Flows improvement
- UX Improvements for empty states and errors

Sprint 5 - Clubs (Teams) Module
- Clubs Model & API Endpoints
- Create Club
- Manage Club Members
- Club Profile Pages
- Join/Leave Club Flow
- Display Club Challenges

Sprint 6.0 - Profile System Enhancement
- Profile Page with Customization
- Gaming Stats Input and Validation
- User Bio & Display Info
- Editable Profile Details
- View Opponent's Stats in Challenges
- Enhanced Error Handling

Sprint 6.1 - Stats Calculation System
- Automated K/D Ratio Calculation
- Win Rate Tracking Implementation
- Total Games Played Counter
- Stats Display UI Enhancement
- Real-time Stats Updates

Sprint 6.2 - Profile System Hotfix
- Improved Profile Edit Form
- Individual Stats Field Validation
- Games Played Tracking Fix
- Enhanced Error Notifications
- Better Form Submission Handling
- Fixed 404 Profile Issues

🔄 Current Sprint

Sprint 7 - Challenge System v2 (In Progress)
- Dispute System (Basic)
- Mark Winner Flow
- Update Challenge Status (Complete, Disputed)
- Finalized Challenge History
- Admin Tools (basic)

Sprint 8 - Wallet System v2 (In Progress)
- Challenge Entry Stake Deduction
- Prize Distribution to Winner
- Transaction History in Wallet
  - Transaction history table with type, amount, date, and linked challenge
  - Transaction types: Deposit, Entry Fee, Winnings
  - Sortable and filterable transaction list
- Withdrawal Request Flow
- Balance Validation Before Challenge Join

📌 Upcoming Sprints

Sprint 9 - Real-time & UX Improvements
- WebSocket Setup for Live Updates
- Real-time Challenge Status Updates
- Live Club Feeds (Optional)
- UX Polish & Animations
- Final Linting & Code Cleanup

Sprint 10 - MVP Prep & Finalization
- MVP Testing
- Bug Fixes
- Improved Error Handling
- MVP User Onboarding Flow
- Documentation

✅ Notes

MVP will likely be considered ready between Sprint 8 and Sprint 9.

Stretch Goals (Post-MVP) may include:
- Player Stats API Integration
- Social Feed / Activity Timeline
- Tournament Formats
- Spectator Mode
- Escrow Payout Disputes (Advanced)

This roadmap is subject to evolve based on testing, feedback, and legal guidance.

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- The open-source community for various tools and libraries used in this project 