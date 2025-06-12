# 🚀 Deployment Guide for EduManage School Management System

## Step 1: Push to GitHub

### Option A: Using GitHub CLI (Recommended)
If you have GitHub CLI installed:
```bash
gh auth login
git remote add origin https://github.com/raindragon14/school-management.git
git add .
git commit -m "Initial commit: School Management System with modern landing page"
git branch -M main
git push -u origin main
```

### Option B: Using Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with repo permissions
3. Use the token as your password when pushing:
```bash
git remote add origin https://github.com/raindragon14/school-management.git
git add .
git commit -m "Initial commit: School Management System with modern landing page"
git branch -M main
git push -u origin main
# When prompted for username: enter your GitHub username
# When prompted for password: enter your personal access token
```

### Option C: Using SSH (If you have SSH keys set up)
```bash
git remote add origin git@github.com:raindragon14/school-management.git
git add .
git commit -m "Initial commit: School Management System with modern landing page"
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `raindragon14/school-management` repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
6. Click "Deploy"

### Option B: Vercel CLI
```bash
# Install Vercel CLI (already done)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Environment Variables for Vercel

Make sure to add these environment variables in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://pdbdjirtizvzeasobkfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkYmRqaXJ0aXp2emVhc29ia2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDM1MzIsImV4cCI6MjA2NTMxOTUzMn0.-bTPuVVZiX-Xwa2FwhKxx5NZLCC3zfBGXujnVqd5Bno
```

## System Requirements

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **GitHub Account**: For repository hosting
- **Vercel Account**: For deployment
- **Supabase Account**: For database and authentication

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/raindragon14/school-management.git
cd school-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Dependencies

#### Main Dependencies
- **Next.js 15.3.3** - React framework for production
- **React 19.0.0** - UI library
- **Supabase** - Backend as a Service
  - `@supabase/supabase-js` - JavaScript client
  - `@supabase/ssr` - Server-side rendering support
  - `@supabase/auth-helpers-nextjs` - Authentication helpers
  - `@supabase/auth-ui-react` - Pre-built auth components

#### Development Dependencies
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## What's Included

Your school management system includes:

✅ **Modern Landing Page** - Professional homepage with feature highlights
✅ **Supabase Integration** - Database and authentication setup
✅ **Student Management** - Add and manage student records
✅ **Class Management** - Organize classes and schedules  
✅ **Financial Management** - Handle tuition and payments
✅ **Responsive Design** - Works on all devices
✅ **Dashboard** - Central management interface
✅ **Authentication** - Login and user management

## Next Steps After Deployment

1. **Set up Supabase tables** for students, classes, and finances
2. **Configure authentication** in Supabase
3. **Add real data** to test the system
4. **Customize branding** and colors as needed
5. **Add more features** as your school needs grow

## Support

If you encounter any issues:
1. Check the Vercel deployment logs
2. Ensure environment variables are set correctly
3. Verify Supabase configuration
4. Test locally first with `npm run dev`

---

Your EduManage School Management System is ready to go live! 🎓
