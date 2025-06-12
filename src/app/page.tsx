import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">EduManage</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Modern School</span>
            <span className="block text-indigo-600">Management System</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your educational institution with our comprehensive management platform. 
            Handle students, classes, finances, and more with ease.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Student Management */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Student Management</h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Manage student records, enrollment, and academic progress with our intuitive interface.
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/students"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Manage Students →
                  </Link>
                </div>
              </div>
            </div>

            {/* Class Management */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Class Management</h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Organize classes, schedules, and track attendance efficiently.
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/classes"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Manage Classes →
                  </Link>
                </div>
              </div>
            </div>

            {/* Financial Management */}
            <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Financial Management</h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Handle tuition fees, payments, and financial reporting seamlessly.
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/finances"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Manage Finances →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">System Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">500+</div>
              <div className="text-sm text-gray-500 mt-1">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">25+</div>
              <div className="text-sm text-gray-500 mt-1">Classes Running</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">95%</div>
              <div className="text-sm text-gray-500 mt-1">Payment Collection</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">EduManage</h3>
            <p className="mt-2 text-sm text-gray-500">
              Modern school management made simple and efficient.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                Dashboard
              </Link>
              <Link href="/dashboard/students" className="text-gray-400 hover:text-gray-500">
                Students
              </Link>
              <Link href="/dashboard/classes" className="text-gray-400 hover:text-gray-500">
                Classes
              </Link>
              <Link href="/dashboard/finances" className="text-gray-400 hover:text-gray-500">
                Finances
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
