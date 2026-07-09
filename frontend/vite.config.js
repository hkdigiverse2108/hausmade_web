import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '../'),
  server: {
    strictPort: true,
    watch: {
      ignored: [
        '**/backend/**',
        '**/*.json',
        '**/users.json',
        '**/orders.json',
        '**/otps.json',
        '**/products.json',
        '**/coupons.json',
        '**/settings.json',
        '**/reviews.json'
      ]
    }
  }
})

