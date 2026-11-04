import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/App';
import ReplayScreen from '@views/ReplayView/ReplayScreen';

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <Suspense fallback={<ReplayScreen />}>
         <App />
      </Suspense>
   </StrictMode>,
);
