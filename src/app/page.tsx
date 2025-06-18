import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">EduManage</h1>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            <span className="block">Modern School</span>
            <span className="block text-gray-900">Management System</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Streamline your educational institution with our comprehensive school
            management platform.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="px-6 py-3 text-base text-white bg-gray-900 hover:bg-gray-800 rounded-md shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2025 EduManage. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}