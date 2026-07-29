import { useMemo } from 'react';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Link } from 'react-router';
import { FaSnowflake, FaTv, FaMobileAlt, FaLaptop, FaTools } from 'react-icons/fa';
import { GiWashingMachine } from 'react-icons/gi';
import { MdKitchen, MdMicrowave } from 'react-icons/md';
import SectionHeader from '../../../components/public/SectionHeader';

const categories = [
    { label: 'AC Repair', icon: FaSnowflake },
    { label: 'Refrigerator Repair', icon: MdKitchen },
    { label: 'Washing Machine Repair', icon: GiWashingMachine },
    { label: 'TV / Electronics Repair', icon: FaTv },
    { label: 'Mobile Phone Repair', icon: FaMobileAlt },
    { label: 'Laptop / Computer Repair', icon: FaLaptop },
    { label: 'Microwave Repair', icon: MdMicrowave },
    { label: 'Other Repairs', icon: FaTools },
];

const ServiceCategories = () => {
    const prefersReducedMotion = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    );

    return (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader
                eyebrow="What We Repair"
                title="Popular Service Categories"
                description="Browse the most requested repair categories on Sarabo."
            />
            <Swiper
                className="mt-12"
                rewind
                slidesPerView={2}
                spaceBetween={20}
                breakpoints={{
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 5 },
                }}
                grabCursor={true}
                modules={[Autoplay]}
                autoplay={prefersReducedMotion ? false : {
                    delay: 4000,
                    pauseOnMouseEnter: true,
                    disableOnInteraction: false,
                }}
            >
                {
                    categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <SwiperSlide key={index}>
                                <Link
                                    to="/dashboard/create-request"
                                    className="focus-ring flex flex-col items-center gap-2 rounded-xl bg-base-200 p-6 transition-colors hover:bg-base-300"
                                >
                                    <Icon className="text-4xl text-primary" aria-hidden="true" />
                                    <span className="text-center text-sm font-medium">{category.label}</span>
                                </Link>
                            </SwiperSlide>
                        );
                    })
                }
            </Swiper>
        </section>
    );
};

export default ServiceCategories;
