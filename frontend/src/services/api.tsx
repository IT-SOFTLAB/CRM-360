import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;