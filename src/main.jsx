import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router/dom";
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify';
import { router } from './routes/router.jsx';
import AuthProvider from './contexts/AuthContext/AuthProvider.jsx';
import ThemeProvider from './theme/ThemeProvider.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* One reduced-motion switch for every Motion animation in the app. */}
      <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          {/* Single application-root toast host - the only ToastContainer in
              the app. All non-blocking feedback flows through src/lib/notify.js.
              It always runs toastify's "light" theme; styles/base.css maps that
              theme's variables onto the design tokens, so it follows dark mode. */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>,
)
