import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import BlockPageApp from './BlockPageApp';
import './block-page.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlockPageApp />
  </StrictMode>,
);
