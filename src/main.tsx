import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';
import { game, shifts } from '@data/currentGame';
import GameProvider from '@context/GameProvider';

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <GameProvider game={game} shifts={shifts}>
         <App />
      </GameProvider>
   </StrictMode>,
);
