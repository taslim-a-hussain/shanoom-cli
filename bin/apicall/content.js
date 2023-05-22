import axios from "axios";

const url = "http://localhost:3000/content";


// Create content for a domain
export const createContentCall = async (token, domainName, data) => {
    try {
        const response = await axios.post(
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
