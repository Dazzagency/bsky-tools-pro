import React, { useState, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';
const { ipcRenderer } = window.require('electron');

function App() {
  // ... (previous state declarations)

  useEffect(() => {
    // Load saved credentials on startup
    const loadCredentials = async () => {
      const savedCredentials = await ipcRenderer.invoke('get-credentials');
      if (savedCredentials) {
        setUsername(savedCredentials.username);
        setPassword(savedCredentials.password);
      }
    };
    loadCredentials();
  }, []);

  const startScraping = async () => {
    if (!username || !password || !targetUser) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Save credentials securely
    await ipcRenderer.invoke('save-credentials', { username, password });

    setIsRunning(true);
    setError(null);
    // ... (rest of the startScraping function)
  };

  // ... (rest of the component)

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 right-0 p-2 text-xs text-gray-500">
        Version {window.require('electron').remote.app.getVersion()}
      </div>
      {/* ... (rest of the JSX) */}
    </div>
  );
}

export default App;