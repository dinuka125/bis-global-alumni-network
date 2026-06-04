import React, { useEffect, useState } from 'react';
import {
    DEFAULT_AVATAR,
    getAvatarProxyUrl,
    getProfileImageUrl,
    resolveAvatarSrc,
} from '../utils/profileImage';

/**
 * Profile photo: backend proxy first (LinkedIn), then direct URL, then placeholder.
 */
export default function ProfileAvatar({ src, studentId, alt, className, ...props }) {
    const resolved = resolveAvatarSrc(studentId, src);
    const [imgSrc, setImgSrc] = useState(resolved);
    const [triedDirect, setTriedDirect] = useState(false);

    useEffect(() => {
        setImgSrc(resolveAvatarSrc(studentId, src));
        setTriedDirect(false);
    }, [src, studentId]);

    const handleError = () => {
        const direct = getProfileImageUrl(src);
        const proxy = getAvatarProxyUrl(studentId, src);
        if (!triedDirect && direct && proxy && imgSrc.includes('/avatar')) {
            setTriedDirect(true);
            setImgSrc(direct);
            return;
        }
        if (imgSrc !== DEFAULT_AVATAR) {
            setImgSrc(DEFAULT_AVATAR);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleError}
            {...props}
        />
    );
}
