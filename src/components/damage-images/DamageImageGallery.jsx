import { FaSyncAlt } from 'react-icons/fa';
import DamageImageCard from './DamageImageCard';

const DamageImageGallery = ({ images, isLoading, isError, canDelete, deletingImageId, onDelete, onRequestRefresh }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading photos">
                {[0, 1, 2].map((key) => (
                    <div key={key} className="aspect-square rounded-box bg-base-200 animate-pulse" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-sm opacity-70 flex items-center gap-2">
                <span>Photos could not be loaded.</span>
                <button type="button" onClick={onRequestRefresh} className="btn btn-ghost btn-xs">
                    <FaSyncAlt aria-hidden="true" /> Retry
                </button>
            </div>
        );
    }

    if (!images || images.length === 0) {
        return <p className="text-sm opacity-70">No damage photos have been added yet.</p>;
    }

    return (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image, index) => (
                <DamageImageCard
                    key={image.imageId}
                    image={image}
                    index={index}
                    canDelete={canDelete}
                    isDeleting={deletingImageId === image.imageId}
                    onDelete={onDelete}
                    onRequestRefresh={onRequestRefresh}
                />
            ))}
        </ul>
    );
};

export default DamageImageGallery;
