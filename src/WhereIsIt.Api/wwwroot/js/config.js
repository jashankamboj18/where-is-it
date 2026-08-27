// ============================================================
// config.js — App Constants & Multi-Environment API Configuration
// ============================================================

// Detect environment: Localhost dev server vs Live Cloud API vs Capacitor Native Android
const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5030';
const isNativeApp = window.location.protocol === 'file:' || 
                    window.location.protocol === 'capacitor:' || 
                    window.location.hostname === 'localhost' && window.location.port !== '5030';

// Live production API endpoint on Render
const CLOUD_API_URL = 'https://where-is-it.onrender.com/api';

const API_BASE = isLocalDev 
    ? 'http://localhost:5030/api' 
    : (isNativeApp ? CLOUD_API_URL : (window.location.origin + '/api'));

const APP_NAME = 'WHERE IS IT — Finder AI';
const APP_VERSION = '2.1.0';
