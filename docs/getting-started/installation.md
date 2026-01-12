# Installation

This guide covers how to install and run BytePad on your system.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/user/bytepad.git
cd bytepad
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Desktop Application (Electron)

BytePad also runs as a standalone desktop application with additional features like system tray, global shortcuts, and auto-start.

### Development Mode

```bash
npm run dev:electron
```

### Build Executable

**Windows:**
```bash
npm run package:win
```
Output: `dist-electron/bytepad-{version}-win-x64.exe`

**macOS:**
```bash
npm run package:mac
```
Output: `dist-electron/bytepad-{version}-mac.dmg`

**Linux:**
```bash
npm run package:linux
```
Output: `dist-electron/bytepad-{version}-linux.AppImage`

## PWA Installation

BytePad is a Progressive Web App and can be installed from the browser:

1. Open BytePad in Chrome, Edge, or another PWA-compatible browser
2. Click the install icon in the address bar
3. Click "Install" in the prompt

## Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

See [Configuration](./configuration.md) for available options.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, you can change it:

```bash
npm run dev -- --port 3000
```

### Build Errors

Clear the build cache and reinstall dependencies:

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Electron Issues

Make sure you have the correct version of Node.js installed. Electron requires specific Node.js versions.

## Next Steps

- [Configuration Guide](./configuration.md) - Set up your preferences
- [First Steps](./first-steps.md) - Learn the basics
- [Features Overview](../features/) - Explore all features
