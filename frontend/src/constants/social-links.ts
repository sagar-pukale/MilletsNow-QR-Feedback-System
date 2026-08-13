export const socialLinks = {
  instagram: import.meta.env.VITE_INSTAGRAM_URL ?? 'https://instagram.com',
  facebook: import.meta.env.VITE_FACEBOOK_URL ?? 'https://facebook.com',
  youtube: import.meta.env.VITE_YOUTUBE_URL ?? 'https://youtube.com',
  whatsapp: import.meta.env.VITE_WHATSAPP_URL ?? 'https://wa.me',
} as const
