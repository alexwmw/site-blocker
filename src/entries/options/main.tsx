import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/global.css';
import '@/assets/page.css';
import '@/assets/theme.css';

import OptionsApp from './OptionsApp';
import styles from './OptionsApp.module.css';

document.body.classList.add(styles.body);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
