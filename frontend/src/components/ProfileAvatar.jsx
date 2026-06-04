import React, { useEffect, useState } from 'react';
import { DEFAULT_AVATAR, getProfileImageUrl } from '../utils/profileImage';

/**
 * Profile photo with fallback when URL is missing or the host blocks hotlinking.
 */
export default function ProfileAvatar({ src, alt, className, ...props }) {
    const resolved = getProfileImageUrl(src) || DEFAULT_AVATAR;
    const [imgSrc, setImgSrc] = useState(resolved);

    useEffect(() => {
        setImgSrc(getProfileImageUrl(src) || DEFAULT_AVATAR);
    }, [src]);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => {
                if (imgSrc !== DEFAULT_AVATAR) {
                    setImgSrc(DEFAULT_AVATAR);
                }
            }}
            {...props}
        />
    );
}
