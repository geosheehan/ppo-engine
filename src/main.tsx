import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { game, shifts } from '@data/currentGame.ts'
import { GameProvider } from '@context/GameContext.tsx'

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <GameProvider game={game} shifts={shifts}>
         <App />
      </GameProvider>
   </StrictMode>,
)
