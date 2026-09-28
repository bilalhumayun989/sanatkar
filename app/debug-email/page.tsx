'use client';

import { useState } from 'react';
import { createClient } from '@/lib/auth/supabase/client';

export default function DebugEmailPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const supabase = createClient();
      
      // Test signup with a simple email
      const { data, error } = await supabase.auth.signUp({
        email: email || 'test@example.com',
        password: 'testpassword123',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setResult(`❌ Error: ${error.message}`);
      } else {
        setResult(`✅ Success! User created: ${data.user?.id}
Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}
Session: ${data.session ? 'Created' : 'Not created'}

If email confirmation is required, check your email (including spam folder).`);
      }
    } catch (err: any) {
      setResult(`❌ Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Email Verification Debug</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Test Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Signup & Email'}
          </button>
          
          {result && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
          
          <div className="bg-yellow-900/50 p-4 rounded-lg border border-yellow-500">
            <h3 className="font-medium text-yellow-400 mb-2">⚠️ Troubleshooting Steps:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Check Supabase Dashboard → Authentication → Settings</li>
              <li>Ensure "Enable email confirmations" is ON</li>
              <li>Verify Site URL is set correctly</li>
              <li>Check email templates are configured</li>
              <li>Look in spam folder for verification emails</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}