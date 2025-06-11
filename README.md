# Interdisciplinary Visualization
![Image 5-25-25 at 12 03 PM](https://github.com/user-attachments/assets/18c71080-6290-4747-a569-6aaae877bc7f)

Deployed here: [link to our project!](https://amazingcs188interdisvizgroupproject.vercel.app/) 
This is a Next.js project built with TypeScript and Tailwind CSS.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v10 or higher)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

To set up your environment variables:

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and add your API key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [npm](https://www.npmjs.com/) - Package manager
