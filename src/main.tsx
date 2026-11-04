import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';
import GameProvider from '@context/GameProvider';
import { game, shifts } from '@data/currentGame';

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <GameProvider game={game} shifts={shifts}>
         <App />
      </GameProvider>
   </StrictMode>,
);
