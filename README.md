# Prompter PWA

A Progressive Web Application for creating, managing, and organizing AI prompts. Built with React 19, TypeScript, and Tailwind CSS 4.

## Features

- Create and manage AI prompts with a rich markdown editor
- Live preview of markdown content
- Dark/light theme support
- Local storage for data persistence
- PWA capabilities for offline use
- Responsive design for all devices

## Tech Stack

- **Frontend Framework**: React 19
- **UI Framework**: Tailwind CSS 4
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Editor**: Monaco Editor (for markdown editing)
- **PWA Support**: Workbox
- **Icons**: Lucide React

## Development

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd prompter-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Docker Support

Build and run using Docker:

```bash
# Build Docker image
docker build -t prompter-pwa .

# Run container
docker run -p 8080:80 prompter-pwa
```

## PWA Features

- Offline support
- Installable on desktop and mobile
- Automatic updates
- Responsive design

## Project Structure

- `/src` - Application source code
  - `/components` - React components
    - `/editor` - Monaco editor configuration and components
    - `/views` - Main application views
  - `/assets` - Static assets and themes
- `/public` - Static files and PWA assets

## License

MIT
