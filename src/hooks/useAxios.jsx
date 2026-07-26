import axios from 'axios';
import React from 'react';
import { API_BASE_URL } from '../config/api';


const axiosInstance = axios.create({
    baseURL: API_BASE_URL
})

const useAxios = () => {
    return axiosInstance;
};

export default useAxios;
