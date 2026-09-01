export const PHOTO_POOL = [
    { type: 'flag' },
    { type: 'image', url: '/photos/gato-huaso.webp' },
    { type: 'image', url: '/photos/esfera-tricolor.jpg' },
    { type: 'image', url: '/photos/cueca.jpeg' },
];

export function pickRandomPhoto() {
    return PHOTO_POOL[Math.floor(Math.random() * PHOTO_POOL.length)];
}
