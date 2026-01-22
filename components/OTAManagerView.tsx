import React, { useState } from 'react';
import { Button } from './Button';
import { MOCK_FIRMWARE } from '../services/mockData';

export const OTAManagerView: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
        setIsUploading(false);
        alert("Simulated upload complete. New firmware would appear in list.");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload New Firmware</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload compiled binaries (.bin) for ESP32. Ensure checksum verification is enabled.
        </p>
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4 flex text-sm text-gray-600 dark:text-gray-400">
             <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500">
               <span>Upload a file</span>
               <input id="file-upload" name="file-upload" type="file" className="sr-only" />
             </label>
             <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">BIN up to 4MB</p>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} isLoading={isUploading}>Upload Firmware</Button>
        </div>
      </div>

      {/* Version History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Firmware Library</h3>
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700">
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {MOCK_FIRMWARE.map((fw) => (
              <li key={fw.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-750">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <p className="text-sm font-bold text-brand-600 truncate mr-3">v{fw.version}</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        fw.status === 'STABLE' ? 'bg-green-100 text-green-800' :
                        fw.status === 'BETA' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fw.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{fw.description}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-400 font-mono space-x-4">
                       <span>Size: {fw.size}</span>
                       <span className="truncate max-w-xs">SHA: {fw.checksum}</span>
                       <span>Released: {fw.releaseDate}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-3">
                    <Button variant="secondary" className="text-xs">Download</Button>
                    {fw.status !== 'DEPRECATED' && (
                        <Button className="text-xs">Rollout</Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
