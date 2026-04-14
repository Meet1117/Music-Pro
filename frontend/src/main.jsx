import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(24, 24, 24, 0.95)',
              color: '#f4f0ff',
              border: '1px solid rgba(29, 185, 84, 0.2)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            },
            success: {
              iconTheme: { primary: '#1db954', secondary: '#f4f0ff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f4f0ff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
