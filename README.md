# Resume Customizer Pro

A simplified resume management application with authentication and file upload capabilities.

## Features

- Resume upload and basic validation
- Secure authentication (JWT with mock mode)
- Clean, modern UI with Next.js and Tailwind CSS
- Simple file management

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Migrate
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create `.env.local` for JWT configuration.

### Running the App

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
npm start
```

## Folder Structure

- `src/app/` - Next.js app directory (pages, API routes)
- `src/lib/` - Utilities and helpers
- `src/components/` - UI components
- `uploads/` - File storage directory

## API Endpoints

- `POST /api/auth/login` - User login (mock mode)
- `POST /api/auth/register` - User registration (mock mode)
- `POST /api/resumes/upload` - Resume upload with validation

## License

MIT
