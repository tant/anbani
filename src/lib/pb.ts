import PocketBase from 'pocketbase';

/** Same origin: PocketBase serves the app in production, Vite proxies /api in dev. */
export const pb = new PocketBase('/');
