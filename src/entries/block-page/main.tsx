import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '../shared/theme.css';
import './block-page.css';
import BlockPageApp from './BlockPageApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlockPageApp />
  </StrictMode>,
);
