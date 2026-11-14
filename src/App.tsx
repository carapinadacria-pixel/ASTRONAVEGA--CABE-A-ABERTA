/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Game } from './components/Game';
import { useGameStore } from './store';

export default function App() {
  useEffect(() => {
    void useGameStore.getState().loadExoplanets();
  }, []);

  return <Game />;
}
