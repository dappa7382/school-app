# 🎓 EduManage - School Management System

A modern, comprehensive school management system built with Next.js 15, React 19, and Supabase. Features student management, class scheduling, financial tracking, and a beautiful responsive interface.

## ✨ Features

- 🏠 **Modern Landing Page** - Professional homepage with feature highlights
- 👥 **Student Management** - Add, edit, and manage student records
- 📚 **Class Management** - Organize classes and schedules
- 💰 **Financial Management** - Handle tuition and payments
- 🔐 **Authentication** - Secure login and user management
- 📱 **Responsive Design** - Works perfectly on all devices
- 🚀 **Real-time Updates** - Powered by Supabase

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4.x
- **Backend**: Supabase (Database + Auth)
- **Deployment**: Vercel
- **Development**: ESLint, PostCSS

## 📋 Requirements

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control

### Accounts Needed
- **GitHub Account**: For repository hosting
- **Vercel Account**: For deployment  
- **Supabase Account**: For database and authentication

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/raindragon14/school-management.git
cd school-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get these from your Supabase project dashboard
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📦 Dependencies

### Production Dependencies
```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-ui-react": "^0.4.7", 
  "@supabase/auth-ui-shared": "^0.1.8",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.50.0",
  "next": "15.3.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### Development Dependencies
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19", 
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.3.3",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
