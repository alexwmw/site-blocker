import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '../shared/theme.css';
import './options.css';
import OptionsApp from './OptionsApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
