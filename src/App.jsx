import React, { useState, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [autoFollow, setAutoFollow] = useState(false);
  const [scrapedUsers, setScrapedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [followDelay, setFollowDelay] = useState(1000);
  const [scrapeOptions, setScrapeOptions] = useState({
    followers: true,
    following: false,
    both: false
  });
  const [stats, setStats] = useState({
    totalScraped: 0,
    displayed: 0,
    saved: 0,
    followed: 0,
    errors: 0
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const startScraping = async () => {
    if (!username || !password || !targetUser) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsRunning(true);
    setError(null);
    setSuccessMessage('');
    setStats({
      totalScraped: 0,
      displayed: 0,
      saved: 0,
      followed: 0,
      errors: 0
    });

    try {
      const agent = new BskyAgent({
        service: 'https://bsky.social'
      });
      
      await agent.login({
        identifier: username,
        password
      });

      setSuccessMessage('Connexion réussie! Démarrage du scraping...');

      let cursor = null;
      let count = 0;
      let allUsers = [];
      let followCount = 0;
      
      do {
        try {
          const response = scrapeOptions.followers ?
            await agent.getFollowers({ actor: targetUser, limit: 100, cursor }) :
            await agent.getFollows({ actor: targetUser, limit: 100, cursor });

          const users = response.data.followers || response.data.follows;
          if (users) {
            allUsers = [...allUsers, ...users];
            count += users.length;
            setStats(prev => ({
              ...prev,
              totalScraped: count,
              displayed: count
            }));

            if (autoFollow) {
              for (const user of users) {
                try {
                  await agent.follow(user.did);
                  followCount++;
                  setStats(prev => ({
                    ...prev,
                    followed: followCount
                  }));
                  await new Promise(r => setTimeout(r, followDelay));
                } catch (followError) {
                  console.error('Erreur lors du follow:', followError);
                  setStats(prev => ({
                    ...prev,
                    errors: prev.errors + 1
                  }));
                }
              }
            }
          }

          cursor = response.data.cursor;
          await new Promise(r => setTimeout(r, 500));

        } catch (error) {
          setStats(prev => ({
            ...prev,
            errors: prev.errors + 1
          }));
          console.error('Erreur pendant le scraping:', error);
        }

      } while (cursor && count < 50000);

      setScrapedUsers(allUsers);
      setSuccessMessage('Scraping terminé avec succès!');

    } catch (error) {
      setError('Erreur: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const saveScrapedData = () => {
    try {
      const dataToSave = scrapedUsers.map(user => ({
        username: user.handle,
        displayName: user.displayName,
        did: user.did,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        description: user.description
      }));

      const dataStr = JSON.stringify(dataToSave, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scraped_${targetUser}_${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStats(prev => ({
        ...prev,
        saved: scrapedUsers.length
      }));
      setSuccessMessage('Données sauvegardées avec succès!');
    } catch (error) {
      setError('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const openTelegram = () => {
    window.open('https://t.me/Dazzagency', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-500">DazzTools</h1>
            <div className="text-sm text-orange-300">PRO</div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-gray-400 text-sm">
              {new Date().toLocaleDateString()}
            </div>
            <button
              onClick={openTelegram}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <span>Support</span>
              <span className="text-xs">(@Dazzagency)</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4 shadow-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500 text-white p-4 rounded-lg mb-4 shadow-lg">
            {successMessage}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <input
            type="text"
            placeholder="Your username (user.bsky.social)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full mb-4 p-3 bg-gray-700 rounded text-white shadow-inner focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <input
            type="password"
            placeholder="APP Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-4 p-3 bg-gray-700 rounded text-white shadow-inner focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <input
            type="text"
            placeholder="Target username"
            value={targetUser}
            onChange={e => setTargetUser(e.target.value)}
            className="w-full mb-4 p-3 bg-gray-700 rounded text-white shadow-inner focus:ring-2 focus:ring-orange-500 outline-none"
          />

          <div className="flex flex-wrap gap-6 mb-6">
            <label className="flex items-center space-x-2 text-white hover:text-orange-500 cursor-pointer">
              <input
                type="checkbox"
                checked={scrapeOptions.followers}
                onChange={e => setScrapeOptions({
                  followers: e.target.checked,
                  following: false,
                  both: false
                })}
                className="form-checkbox h-5 w-5 text-orange-500 rounded"
              />
              <span>Abonnés</span>
            </label>
            
            <label className="flex items-center space-x-2 text-white hover:text-orange-500 cursor-pointer">
              <input
                type="checkbox"
                checked={scrapeOptions.following}
                onChange={e => setScrapeOptions({
                  followers: false,
                  following: e.target.checked,
                  both: false
                })}
                className="form-checkbox h-5 w-5 text-orange-500 rounded"
              />
              <span>Abonnements</span>
            </label>

            <label className="flex items-center space-x-2 text-white hover:text-orange-500 cursor-pointer">
              <input
                type="checkbox"
                checked={scrapeOptions.both}
                onChange={e => setScrapeOptions({
                  followers: true,
                  following: true,
                  both: e.target.checked
                })}
                className="form-checkbox h-5 w-5 text-orange-500 rounded"
              />
              <span>Les deux</span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Délai entre chaque follow (ms)</label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={followDelay}
              onChange={e => setFollowDelay(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-white text-sm mt-1">{followDelay}ms</div>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={startScraping}
              disabled={isRunning}
              className={`flex-1 p-3 rounded text-white font-semibold transition-all duration-200 ${
                isRunning ? 'bg-gray-600 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {isRunning ? 'Scraping en cours...' : 'Start Scraping'}
            </button>

            <button
              onClick={saveScrapedData}
              disabled={isRunning || scrapedUsers.length === 0}
              className={`px-6 py-3 rounded text-white font-semibold transition-all duration-200 ${
                isRunning || scrapedUsers.length === 0 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              Sauvegarder
            </button>

            <button
              onClick={() => setAutoFollow(!autoFollow)}
              disabled={isRunning}
              className={`px-6 py-3 rounded text-white font-semibold transition-all duration-200 ${
                isRunning 
                  ? 'bg-gray-600 cursor-not-allowed'
                  : autoFollow 
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {autoFollow ? 'Auto Follow ON' : 'Auto Follow OFF'}
            </button>
          </div>

          {stats.totalScraped > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-white">
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform">
                <div className="text-sm text-gray-400">Total Scrapé</div>
                <div className="text-2xl font-bold text-orange-500">{stats.totalScraped}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform">
                <div className="text-sm text-gray-400">Affichés</div>
                <div className="text-2xl font-bold text-blue-500">{stats.displayed}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform">
                <div className="text-sm text-gray-400">Sauvegardés</div>
                <div className="text-2xl font-bold text-green-500">{stats.saved}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform">
                <div className="text-sm text-gray-400">Suivis</div>
                <div className="text-2xl font-bold text-purple-500">{stats.followed}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 shadow-lg transform hover:scale-105 transition-transform">
                <div className="text-sm text-gray-400">Erreurs</div>
                <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;