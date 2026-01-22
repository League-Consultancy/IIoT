import React, { useState } from 'react';
import { Button } from './Button';
import { MOCK_USERS } from '../services/mockData';
import { UserRole } from '../types';

export const AdminSettingsView: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');

  const handleTestConnection = () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    setTimeout(() => {
        setIsTesting(false);
        setConnectionStatus('connected');
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tenant Settings */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-slate-700">
         <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Tenant Configuration</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage global settings for this organization.</p>
         </div>
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization Name</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" defaultValue="Tesla Gigafactory" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Support Contact</label>
               <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" defaultValue="it-support@tesla.com" />
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Retention Policy</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <option>Standard (1 year)</option>
                  <option selected>Enterprise (5 years)</option>
                  <option>Unlimited (Cold Storage)</option>
               </select>
               <p className="mt-2 text-xs text-gray-500">
                  Changing retention policy may affect storage costs. 
                  <span className="text-brand-600 ml-1 cursor-pointer">View pricing</span>
               </p>
            </div>
            <div className="md:col-span-2 flex justify-end">
               <Button>Save Changes</Button>
            </div>
         </div>
      </div>

      {/* Database Connection Settings */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-slate-700">
         <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Database Connection</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure connection to the MongoDB Timeseries Cluster.</p>
         </div>
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Connection String (URI)</label>
               <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400">
                     mongodb+srv://
                  </span>
                  <input type="password" value="cluster0.p8xhr.mongodb.net/iiot_prod?retryWrites=true&w=majority" readOnly className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm border-gray-300 bg-gray-50 text-gray-500 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400 cursor-not-allowed" />
               </div>
               <p className="mt-2 text-xs text-gray-500">Managed by Infrastructure Team. Contact DevOps to rotate credentials.</p>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Pool Size</label>
               <input type="number" defaultValue={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Write Concern</label>
               <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <option>Majority</option>
                  <option>1</option>
                  <option>0</option>
               </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
               <div className="flex items-center">
                  <span className={`h-2.5 w-2.5 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                     {connectionStatus === 'connected' ? 'Operational' : connectionStatus === 'testing' ? 'Verifying...' : 'Disconnected'}
                  </span>
               </div>
               <div className="flex space-x-3">
                  <Button variant="secondary" onClick={handleTestConnection} isLoading={isTesting}>Test Connectivity</Button>
               </div>
            </div>
         </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-gray-200 dark:border-slate-700">
         <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">User Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Control access permissions and roles.</p>
            </div>
            <Button variant="secondary">Invite User</Button>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
               <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Access Scope</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                     <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                  </tr>
               </thead>
               <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {MOCK_USERS.map(user => (
                     <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                user.role === UserRole.PROGRAMMER ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           {user.factoryIds.join(', ')}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <a href="#" className="text-brand-600 hover:text-brand-900">Edit</a>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};