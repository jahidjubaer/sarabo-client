import React from 'react';
import Banner from '../Banner/Banner';
import ServiceCategories from '../ServiceCategories/ServiceCategories';
import Reviews from '../Reviews/Reviews';

const reviewsPromise = fetch('/reviews.json').then(res => res.json());

const Home = () => {
    return (
        <div>
            <Banner></Banner>
            <ServiceCategories></ServiceCategories>
            <Reviews reviewsPromise={reviewsPromise}></Reviews>
        </div>
    );
};

export default Home;
