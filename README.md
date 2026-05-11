# Hold - Mindful Website Blocking

A modern Chrome extension designed to promote mindfulness and productivity by helping you take control of your browsing habits. Hold is the successor to [Time Out Page Blocker](https://github.com/alexwmw/time-out-page-blocker), completely rewritten with modern web technologies.

## Features

- Block distracting websites on a customisable schedule
- Set time limits for specific sites
- Pause blocking temporarily when needed
- Beautiful, intuitive user interface
- Detailed usage analytics and insights
- Quick access popup for managing blocked sites
- Persistent storage of your settings across browser sessions

## Installation

### For Users

1. Download the latest release from the Chrome Web Store (coming soon)
2. Click "Add to Chrome" to install the extension
3. Click the Hold icon in your toolbar to get started

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/alexwmw/site-blocker.git
   cd site-blocker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked" and select the `dist` folder

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser

### Available Commands

- `npm run dev` - Start development server with hot module reloading
- `npm run build` - Build the extension for production
- `npm run build:watch` - Build and watch for file changes
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type-check TypeScript without emitting
- `npm run test` - Run tests with Vitest

### Project Structure

```
site-blocker/
├── src/
│   ├── entries/          # Entry points for different parts of the extension
│   │   ├── background/   # Service worker for background tasks
│   │   ├── popup/        # Popup UI
│   │   ├── options/      # Options page
│   │   └── block-page/   # Blocking page UI
│   └── ...
├── public/               # Static assets
├── block-page.html       # Block page template
├── popup.html            # Popup template
├── options.html          # Options page template
├── manifest.json         # Extension manifest (Chrome MV3)
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── eslint.config.js      # ESLint configuration
```

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite with CRX plugin for Chrome extension building
- **Styling**: CSS with component-scoped styles
- **Icons**: Lucide React
- **Animations**: Lottie React
- **Fonts**: Figtree, Fredoka (via Fontsource)
- **Validation**: Zod for schema validation
- **Testing**: Vitest with Testing Library
- **Code Quality**: ESLint, Prettier
- **SVG Support**: SVGR for inline SVG components

## Chrome Permissions

Hold requests the following permissions:

- **storage** - To save your blocked sites and settings
- **tabs** - To monitor and intercept navigation to blocked sites
- **contextMenus** - To provide right-click options for blocking sites
- **alarms** - To manage time-based blocking schedules

## Building for Production

To create a production build:

```bash
npm run build
```

This generates an optimised `dist` folder ready for uploading to the Chrome Web Store.

## Acknowledgements

Hold was developed with assistance from Codex (OpenAI).

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
