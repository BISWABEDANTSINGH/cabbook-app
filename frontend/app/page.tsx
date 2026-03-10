// src/app/page.tsx
import Link from 'next/link';
import { Show } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
          Get there <span className="text-blue-600">faster.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Experience seamless, reliable, and affordable rides at your fingertips. Join thousands of daily commuters moving smarter.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* FIXED: Using Show for signed-out state */}
          <Show when="signed-out">
            <Link 
              href="/sign-up" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Start Riding Now
            </Link>
          </Show>

          {/* FIXED: Using Show for signed-in state */}
          <Show when="signed-in">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Go to Dashboard
            </Link>
          </Show>

          <Link 
            href="#learn-more" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-full shadow border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}