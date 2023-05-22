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
export const createDomainCall = async (token, data) => {
    try {
        const response = await axios.post(
            `${url}domain`,
            data,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Create content for a domain
export const createContentCall = async (token, domainName, data) => {
    try {
        const response = await axios.post(
            `${url}content/${domainName}`,
            data,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Get all domains
export const getDomainsCall = async (token) => {
    try {
        const response = await axios.get(`${url}domain/list`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Get domain by name
export const getDomainCall = async (token, domainName) => {
    try {
        const response = await axios.get(`${url}domain/${domainName}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
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
  
