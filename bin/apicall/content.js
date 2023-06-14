import axios from "axios";

const url = "http://localhost:3000/content";


// Create content for a domain
export const createContentCall = async (token, domainName, data) => {
    try {
        const response = await axios.post(
            `${url}/${domainName}`,
            data,
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Get content for a domain (By domain name and content name)
export const getContentCall = async (token, domainName, contentName) => {
    try {
        const response = await axios.get(
            `${url}/${domainName}/${contentName}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || error.message);
    }
};


// Content Manager for a domain 
// export const contentManagerCall = async (token, domainName) => {
//     try {
//         const response = await axios.patch(
//             `${url}/${domainName}`,
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );
//         return response.data;
//     } catch (error) {
//         throw new Error(error.response.data.message || error.message);
//     }
// };
