'use client';

import { useState, useEffect } from 'react';

export default function FixRolesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const loadUsersNeedingUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-seller-roles');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.usersNeedingUpdate);
        setResult(`Found ${data.count} users who should be sellers but are currently regular`);
      } else {
        setResult(`Error: ${data.message}`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixAllRoles = async () => {
    if (users.length === 0) {
      setResult('No users to update');
      return;
    }

    setLoading(true);
    try {
      const userIds = users.map((user: any) => user.id);
      
      const response = await fetch('/api/admin/fix-seller-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ Success! Updated ${data.updatedUsers.length} users to seller role`);
        setUsers([]); // Clear the list since they're fixed
      } else {
        setResult(`❌ Error: ${data.message}`);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersNeedingUpdate();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Fix Seller Roles</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Users Needing Role Fix:</h2>
            
            {loading && <p className="text-blue-400">Loading...</p>}
            
            {result && (
              <div className="bg-gray-700 p-3 rounded mb-4">
                <p>{result}</p>
              </div>
            )}
            
            {users.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left p-2">Username</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Current Role</th>
                        <th className="text-left p-2">Full Name</th>
                        <th className="text-left p-2">CNIC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: any) => (
                        <tr key={user.id} className="border-b border-gray-700">
                          <td className="p-2">{user.username}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">
                            <span className="bg-red-600 px-2 py-1 rounded text-xs">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-2">{user.full_name}</td>
                          <td className="p-2">{user.cnic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button
                  onClick={fixAllRoles}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Fixing...' : `Fix All ${users.length} Users → Seller Role`}
                </button>
              </div>
            )}
            
            {users.length === 0 && !loading && (
              <p className="text-green-400">✅ All users have correct roles!</p>
            )}
          </div>
          
          <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-500">
            <h3 className="font-medium text-blue-400 mb-2">ℹ️ What this does:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Finds users who have full_name and CNIC (professional sellers)</li>
              <li>But currently have 'regular' role instead of 'seller'</li>
              <li>Updates their role to 'seller' in the database</li>
              <li>This fixes the role assignment issue</li>
            </ul>
          </div>
          
          <button
            onClick={loadUsersNeedingUpdate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
          >
            🔄 Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}