import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UIProvider } from '@yamada-ui/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </StrictMode>,
)
