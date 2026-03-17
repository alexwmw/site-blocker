import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '../shared/theme.css';
import OptionsApp from './OptionsApp';
import './options.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
