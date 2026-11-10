import '@/App.css';
import { BrowserRouter } from 'react-router';
import AppRoutes from '@router/AppRoutes';
import SelectedGameProvider from '@context/SelectedGameProvider';

function App() {
   return (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
         <SelectedGameProvider>
            <AppRoutes />
         </SelectedGameProvider>
      </BrowserRouter>
   );
}

export default App;
