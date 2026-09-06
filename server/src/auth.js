import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function issueSession(res, userId) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: MAX_AGE_MS,
    });
}

export function clearSession(res) {
    res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req, res, next) {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ error: 'Sesión inválida' });
    }
}
