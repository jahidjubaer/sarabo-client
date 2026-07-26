import React from 'react';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Link } from 'react-router';
import { FaSnowflake, FaTv, FaMobileAlt, FaLaptop, FaTools } from 'react-icons/fa';
import { GiWashingMachine } from 'react-icons/gi';
import { MdKitchen, MdMicrowave } from 'react-icons/md';

const categories = [
    { label: 'AC', icon: FaSnowflake },
    { label: 'Refrigerator', icon: MdKitchen },
    { label: 'Washing Machine', icon: GiWashingMachine },
    { label: 'TV / Electronics', icon: FaTv },
    { label: 'Mobile Phone', icon: FaMobileAlt },
    { label: 'Laptop / Computer', icon: FaLaptop },
    { label: 'Microwave', icon: MdMicrowave },
    { label: 'Other', icon: FaTools },
];

const ServiceCategories = () => {
    return (
        <div className="my-16">
            <h3 className="text-2xl font-semibold text-center mb-8">Popular Service Categories</h3>
            <Swiper
                loop={true}
                slidesPerView={2}
                spaceBetween={20}
                breakpoints={{
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 5 },
                }}
                grabCursor={true}
                modules={[Autoplay]}
                autoplay={{
                    delay: 1500,
                    disableOnInteraction: false,
                }}
            >
                {
                    categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <SwiperSlide key={index}>
                                <Link to="/dashboard/create-request" className="flex flex-col items-center gap-2 p-6 rounded-xl bg-base-200 hover:bg-base-300 transition">
                                    <Icon className="text-4xl text-primary" />
                                    <span className="text-sm font-medium text-center">{category.label}</span>
                                </Link>
                            </SwiperSlide>
                        );
                    })
                }
            </Swiper>
        </div>
    );
};

export default ServiceCategories;
