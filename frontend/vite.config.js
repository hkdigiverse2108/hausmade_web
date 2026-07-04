import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../',
  server: {
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

