import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '@/assets/global.css';
import '@/assets/page.css';
import '@/assets/theme.css';

import OptionsApp from '@/entries/options/OptionsApp';

window.history.replaceState(null, '', '?tabId=starter-sites');


ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
