import { createElement, useState } from 'react';
import { getCategoryPhoto } from '../../config/categoryPhotos';
import { getProductCategoryIcon } from '../../utils/productCategoryIcons';
import { cn } from '../../lib/utils';

// Photo for a product category, keyed on the server's canonical slug. A slug
// with no photo - or a photo that fails to load - falls back to the category
// icon, so a category added on the server never breaks the layout.
// `decorative` (default) leaves alt empty because the adjacent card title
// already names the category.
function CategoryImage({ slug, className, iconClassName, decorative = true, eager = false }) {
    const [failed, setFailed] = useState(false);
    const photo = getCategoryPhoto(slug);

    return (
        <div className={cn('flex items-center justify-center overflow-hidden bg-ds-muted', className)}>
            {photo && !failed ? (
                <img
                    src={photo.src}
                    alt={decorative ? '' : photo.alt}
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => setFailed(true)}
                    className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                />
            ) : createElement(getProductCategoryIcon(slug), {
                'aria-hidden': true,
                className: cn('size-12 text-ds-primary', iconClassName),
                strokeWidth: 1.25,
            })}
        </div>
    );
}

export default CategoryImage;
