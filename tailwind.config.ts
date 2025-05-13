import type { Config } from 'tailwindcss'
import { heroui } from '@heroui/react'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce-subtle': 'bounce-subtle 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dash': 'dash 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'merge-pulse': 'merge-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'particle-trace': 'particle-trace 0.8s ease-out forwards',
        'appear': 'appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'disappear': 'disappear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'explosion': 'explosion 0.8s ease-out forwards',
        'radiate': 'radiate 1s ease-out forwards',
        'sparkle': 'sparkle 1.5s ease-out infinite',
        'unwrap': 'unwrap 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'dash': {
          '0%': { 'stroke-dashoffset': '0' },
          '100%': { 'stroke-dashoffset': '1000' },
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0px) scale(1)',
            boxShadow: '0 5px 15px 0px rgba(0, 0, 0, 0.1)'
          },
          '50%': { 
            transform: 'translateY(-10px) scale(1.01)',
            boxShadow: '0 25px 15px 0px rgba(0, 0, 0, 0.05)'
          },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(79, 70, 229, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.9)' },
        },
        'merge-pulse': {
          '0%, 100%': { 
            opacity: '0.3',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.7',
            transform: 'scale(1.05)'
          },
        },
        'particle-trace': {
          '0%': { 
            transform: 'scale(0) translate(0px, 0px)',
            opacity: '0' 
          },
          '50%': { 
            opacity: '1' 
          },
          '100%': { 
            transform: 'scale(1) translate(var(--particle-x, 30px), var(--particle-y, -20px))',
            opacity: '0' 
          },
        },
        'appear': {
          '0%': { 
            transform: 'scale(0.5)',
            opacity: '0' 
          },
          '70%': { 
            transform: 'scale(1.05)',
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1' 
          },
        },
        'disappear': {
          '0%': { 
            transform: 'scale(1)',
            opacity: '1' 
          },
          '100%': { 
            transform: 'scale(0)',
            opacity: '0' 
          },
        },
        'shimmer': {
          '0%': { 
            backgroundPosition: '-500px 0'
          },
          '100%': { 
            backgroundPosition: '500px 0'
          },
        },
        'explosion': {
          '0%': { 
            transform: 'scale(0.2)',
            opacity: '0'
          },
          '40%': { 
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(3)',
            opacity: '0'
          },
        },
        'radiate': {
          '0%': { 
            transform: 'scale(1)',
            opacity: '0.7'
          },
          '100%': { 
            transform: 'scale(2.5)',
            opacity: '0'
          },
        },
        'sparkle': {
          '0%': { 
            transform: 'scale(0) rotate(0deg)',
            opacity: '0' 
          },
          '50%': { 
            transform: 'scale(1.2) rotate(90deg)',
            opacity: '1',
            boxShadow: '0 0 20px 5px rgba(255, 255, 255, 0.7)'
          },
          '100%': { 
            transform: 'scale(0) rotate(180deg)',
            opacity: '0' 
          },
        },
        'unwrap': {
          '0%': { 
            transform: 'scale(0) rotate(-10deg)',
            opacity: '0' 
          },
          '60%': { 
            transform: 'scale(1.1) rotate(5deg)',
          },
          '80%': { 
            transform: 'scale(0.95) rotate(-2deg)',
          },
          '100%': { 
            transform: 'scale(1) rotate(0deg)',
            opacity: '1' 
          },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui()],
} satisfies Config
