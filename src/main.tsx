async function bootstrap() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim()
  if (siteKey) {
    const { recaptchaService } = await import('./services/recaptchaService')
    await recaptchaService.loadScript()
  }

  const React = await import('react')
  const ReactDOM = await import('react-dom/client')
  const { Provider } = await import('react-redux')
  const { BrowserRouter } = await import('react-router-dom')
  const { ThemeProvider } = await import('@mui/material/styles')
  const CssBaseline = (await import('@mui/material/CssBaseline')).default
  const { default: App } = await import('./App.tsx')
  const { store } = await import('./store/index.ts')
  const { theme } = await import('./theme/index.ts')
  const { initializeAuth, verifyAdminSession } = await import('./store/slices/authSlice')
  const { apiService } = await import('./services/apiService')
  await import('./index.css')

  const initResult = await store.dispatch(initializeAuth())
  if (initializeAuth.fulfilled.match(initResult) && initResult.payload.isAuthenticated && initResult.payload.token) {
    await apiService.setToken(initResult.payload.token, true)
    await store.dispatch(verifyAdminSession())
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </React.StrictMode>,
  )
}

bootstrap().catch((error) => {
  console.error('Failed to start admin dashboard:', error)
})
