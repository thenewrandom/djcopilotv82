/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import RemoteRecordInterface from './components/RemoteRecordInterface';
import { useState, useEffect } from 'react';

export default function App() {
  const [roomCode] = useState<string | null>(() => {
    // 1. Primary: Use hash routing to bypass proxy/Vercel URL mangling
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      return hash.substring(1); // Remove the '#'
    }
    
    // 2. Fallback: Query params
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) return room;
    
    // 3. Fallback: Path routing
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      return path.split('/join/')[1];
    }
    return null;
  });

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center font-sans">
      <RemoteRecordInterface initialRoomCode={roomCode} isGuest={!!roomCode} />
    </div>
  );
}
