// @flow
import axios from 'axios';

class AxiosWrapper {
  axiosInstance: any;
  token: ?string;

  constructor(serverBaseUrl: string, axiosOptions?: any) {
    this.axiosInstance = axios.create(Object.assign({}, {
      // Server base url
      baseURL: serverBaseUrl,
    }, axiosOptions));
    // Force authentication on start
    this.deauthenticate();
  }

  request(path: string, config?: any): Promise<*> {
    return this.axiosInstance.request(path, config);
  }

  get(path: string, config?: any): Promise<*> {
    return this.axiosInstance.get(path, config);
  }

  post(path: string, data?: any, config?: any): Promise<*> {
    return this.axiosInstance.post(path, data, config);
  }

  authenticate(token: string) {
    this.token = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
  }

  deauthenticate() {
    this.token = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}

const url = process.env.REACT_APP_API_URL || '/';

const server = new AxiosWrapper(url);

export default server;