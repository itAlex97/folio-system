import { useEffect, useState } from 'react';
import { apiFetch } from './api/client';

function App() {
  const [status, setStatus] = useState('loading...');

  useEffect(() => {
    apiFetch('/health/').then((data) => {
      setStatus(data.status);
    });
  }, []);

  return (
    <div>
      <h1>Engineering Document Registry</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
