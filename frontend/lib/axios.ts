import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://90.194.170.67:25560/api',
  withCredentials: true,
});

export default axiosInstance;

