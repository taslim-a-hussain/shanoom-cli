import axios from "axios";

const url = "http://localhost:3000/";


// Login
export const loginCall = async (pass) => {
    try {
        const response = await axios.post(`${url}user/login`, pass);
        return response.data;
    } catch (error) {
        throw new Error('Invalid username or password');
    }
};


// Get user (info)
export const getUserCall = async (token) => {
    try {
        const response = await axios.get(`${url}user`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.message);
    }
};


// Create a domain
export const createDomainCall = async (token, domain) => {

    try {
        const response = await axios.post(
            `${url}domain`,
            domain,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        return response.data;
    } catch (error) {

        throw new Error(error.message);
    }
};


// Logout
export const logoutCall = async (token) => {
    try {
      const response = await axios.post(
        `${url}user/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
};
  
