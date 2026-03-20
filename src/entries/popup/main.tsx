import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/global.css';

import '../shared/theme.css';

import PopupApp from './PopupApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
