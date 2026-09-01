import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Static file serving + SPA fallback: only needed when running as a
// traditional standalone server (local dev, Railway, Render, etc).
// On Vercel the platform serves client/dist directly, so api/index.js
// exports the bare app from app.js without this.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Dieciochómetro API escuchando en http://localhost:${PORT}`);
});
