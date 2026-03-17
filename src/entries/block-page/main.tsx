import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '../shared/theme.css';
import BlockPageApp from './BlockPageApp';
import styles from './BlockPageApp.module.css';

document.body.classList.add(styles.body);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlockPageApp />
  </StrictMode>,
);
