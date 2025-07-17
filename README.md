# SplitExpense

A modern web application to help groups split expenses, track balances, and settle up easily. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features
- User authentication (Supabase Auth)
- Create and manage groups
- Add and track expenses
- View balances and settlements
- Responsive, modern UI

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS
- **Backend/DB:** Supabase (Auth, Database)
- **State Management:** React Context
- **Linting:** ESLint

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Supabase project (see below)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/SplitExpense.git
   cd SplitExpense
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Set up Supabase:**
   - Create a project at [Supabase](https://supabase.com/)
   - Copy your Supabase URL and anon/public key
   - Create a `.env` file in the root directory and add:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Run migrations in the `supabase/migrations` folder if needed

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:5173` (default Vite port).

## Project Structure
```
SplitExpense/
  src/
    components/    # React components
    contexts/      # React context providers
    lib/           # Supabase client setup
    index.css      # Global styles
    App.tsx        # Main app component
    main.tsx       # Entry point
  supabase/
    migrations/    # SQL migration scripts
  ...
```

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Lint code

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
[MIT](LICENSE) 