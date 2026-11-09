import { asset } from '@/lib/url';
import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

/**
 * FMDQ wordmark. The source PNG is navy on a transparent background, so in
 * dark mode it sits on a small white chip to stay legible.
 */
export default function AppLogoIcon({ className, alt = 'FMDQ', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={asset('images/fm_logo.png')}
            alt={alt}
            className={cn('w-auto object-contain dark:rounded-md dark:bg-white dark:p-1', className)}
            {...props}
        />
    );
}
