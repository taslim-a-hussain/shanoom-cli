import axios from "axios";

const url = "http://localhost:3000/domain";


// Create a domain
export const createDomainCall = async (token, data) => {
    try {
        const response = await axios.post(
            `${url}`,
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
        const response = await axios.get(`${url}/list`, {
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
        const response = await axios.get(`${url}/${domainName}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Update domain
export const updateDomainCall = async (token, domainName, data) => {
    try {
        const response = await axios.patch(
            `${url}/${domainName}`,
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


// Delete domain by name
export const deleteDomainCall = async (token, domainName) => {
    try {
        const response = await axios.delete(
            `${url}/${domainName}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Delete all domains
export const deleteDomainsCall = async (token) => {
    try {
        const response = await axios.delete(
            `${url}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};
