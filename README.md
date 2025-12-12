# Godamwale PackMaster 3D

Advanced 3D Space Optimization Calculator for warehouse and logistics operations.

![PackMaster 3D](https://via.placeholder.com/800x400/0a0e14/22c55e?text=Godamwale+PackMaster+3D)

## Features

- 🏗️ **Multiple Storage Types**: Pallets, drums, containers, custom dimensions
- 📦 **Flexible Box Configuration**: Add multiple box types with rotation rules
- 🔄 **Two Packing Modes**: 
  - Individual: See how many of each box fits separately
  - Mixed: Combine multiple boxes in one container
- 🎮 **Interactive 3D Visualization**: Rotate, zoom, pan with realistic rendering
- 📊 **Detailed Results**: Efficiency metrics, layer counts, wasted space
- 💾 **Export Options**: Save configurations, export results

## Tech Stack

- **React 19** - UI framework
- **React Three Fiber** - 3D rendering (Three.js for React)
- **Drei** - Useful R3F helpers
- **Zustand** - State management
- **Vite** - Build tool

---

## 🚀 Deployment Guide

### Option 1: Deploy to Netlify (Recommended)

#### Method A: Via Netlify UI (Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/godamwale-packmaster.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and select your repository
   - Build settings are auto-detected from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Done!** Your site will be live at `https://random-name.netlify.app`
   - You can customize the domain in Site settings

#### Method B: Via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   # For a draft deploy (preview URL)
   netlify deploy

   # For production deploy
   netlify deploy --prod
   ```

#### Method C: Drag & Drop

1. Build the project locally:
   ```bash
   npm install
   npm run build
   ```

2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)

3. Drag the `dist` folder onto the page

4. Your site is live!

---

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. Follow the prompts - it auto-detects Vite config

---

### Option 3: Deploy to GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install -D gh-pages
   ```

2. **Add to package.json**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "homepage": "https://YOUR_USERNAME.github.io/godamwale-packmaster"
   }
   ```

3. **Update vite.config.js**
   ```js
   export default defineConfig({
     base: '/godamwale-packmaster/',
     plugins: [react()]
   })
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
godamwale-packmaster/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Main app component
│   ├── index.css         # Global styles
│   ├── store.js          # Zustand state management
│   └── components/
│       ├── Scene3D.jsx   # Three.js 3D visualization
│       ├── Sidebar.jsx   # Configuration panel
│       └── ResultsPanel.jsx  # Results overlay
```

---

## Customization

### Change Colors
Edit CSS variables in `src/index.css`:
```css
:root {
  --accent-1: #22c55e;  /* Primary green */
  --accent-2: #06b6d4;  /* Secondary cyan */
  --bg-base: #05070a;   /* Background */
}
```

### Add Storage Presets
Edit `PRESETS` in `src/components/Sidebar.jsx`

### Modify 3D Materials
Edit `Box` component in `src/components/Scene3D.jsx`

---

## License

MIT License - Powered by Godamwale

---

## Support

For issues or feature requests, please open a GitHub issue.
