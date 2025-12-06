import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split core React dependencies
            if (id.includes('react')) return 'react';
            if (id.includes('react-dom')) return 'react';
            if (id.includes('react-router')) return 'react-router';
            
            // Split Supabase
            if (id.includes('@supabase')) return 'supabase';
            
            // Split UI and Utility libraries (Heavy)
            if (id.includes('lucide')) return 'lucide';
            if (id.includes('pptxgenjs')) return 'pptx';
            if (id.includes('jszip')) return 'zip';
            
            // Default vendor chunk for everything else
            return 'vendor';
          }
        }
      }
    }
  }
});