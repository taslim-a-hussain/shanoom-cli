import axios from "axios";

const url = "http://localhost:3000/user/";

export const loginCall = async (pass) => {
    try {
        const response = await axios.post(`${url}login`, pass);
        return response.data;
    } catch (error) {
        throw new Error('Invalid username or password');
    }
};


export const logoutCall = async (token) => {
    try {
      const response = await axios.post(
        `${url}logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
