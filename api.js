import axios from "axios";

export const pacsApi = axios.create({
    baseURL: 'https://pacs.hospitalagape.com.br',
    headers: {
        Authorization: process.env.PACS_TOKEN
    }
})