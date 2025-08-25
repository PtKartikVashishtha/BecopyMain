'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      console.log("isAuthenticated", isAuthenticated);
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      router.push('/admin/dashboard');
    } catch (error) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Registration</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                password: e.target.value
              }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Secret Key</label>
            <input
              type="password"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={formData.secretKey}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                secretKey: e.target.value
              }))}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 text-white rounded ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className="text-center mt-4">
            <Link
              href="/admin/login"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 