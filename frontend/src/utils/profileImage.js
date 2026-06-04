import { API_URL } from '../config';

export const DEFAULT_AVATAR =
    'https://img.icons8.com/color/96/user-male-circle--v1.png';

/** Normalize stored image_url; returns null when missing or invalid. */
export function getProfileImageUrl(url) {
    if (url == null) return null;
    const trimmed = String(url).trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
    return trimmed;
}

/** Same-origin proxy URL — LinkedIn CDN blocks <img> on external sites (map markers). */
export function getAvatarProxyUrl(studentId, imageUrl) {
    if (!studentId || !getProfileImageUrl(imageUrl)) return null;
    return `${API_URL}/students/${studentId}/avatar`;
}

/** Best URL for displaying a profile photo in the UI. */
export function resolveAvatarSrc(studentId, imageUrl) {
    return getAvatarProxyUrl(studentId, imageUrl) || DEFAULT_AVATAR;
}

/** Escape URL for safe use inside HTML attribute strings (Leaflet divIcon). */
export function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
