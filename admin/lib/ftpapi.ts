import axios from 'axios';

const ftpapi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  // baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});


export default ftpapi; 