import api from '../api';

interface LoginCredentials {
  email: string;
  password: string;
  userType: 'user' | 'recruiter';
}

interface RegisterData extends LoginCredentials {
  name: string;
  profileLink: string;
  country: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyWebsite: string;
  phoneNumber: string;
  description: string;
  userType: 'user' | 'recruiter';
}

interface forgotPassDAta {
  email: string;
}

interface matchCodeData {
  code: number
  email: string
}
interface changePassData {
  code: number
  email: string,
  password: string,
  confirmPassword: string
}

interface verifyEmailData {
  token: string,
  email: string,
}
interface sendVerificationEmailData {
  email: string
}

export const authService = {
  async login(credentials: LoginCredentials) {
    try {
      const response = await api.post("/api/auth/login", {
        email: credentials.email,
        password: credentials.password,
        userType: credentials.userType
      });


      return response.data;
    } catch (error: any) {
      // return error.response.data;
      throw error.response?.data || error.message;
    }
  },

  async register(data: RegisterData) {

    try {
      const response = await api.post("/api/auth/register", data);
      
      return response.data;

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.setItem('userType', data.userType);
      }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendResetCode(data: forgotPassDAta) {
    try {
      const response = await api.post("/api/auth/sendResetCode", {
        email: data.email,
      });

      return response.data;
    } catch (error: any) {
      console.log(error)
      throw error.response?.data || error.message;
    }
  },

  async verifyEmail(data: verifyEmailData) {
    try {

      const response = await api.post('/api/auth/verifyEmail', {
        email: data.email,
        token: data.token
      })

      if (response.status === 200) {
        return response.data;
      }


    } catch (error:any) {
      console.log(error)
      throw error.response?.data || error.message;
    }
  },

  async sendVerificationEmail(data: sendVerificationEmailData) {
    try {

      const response = await api.post('/api/auth/sendVerifyLink', { email: data.email })

      if (response.status === 200) {
        return response.data
      }

      throw response

    } catch (error: any) {
      console.log(error)
      throw error.response?.data || error.message;
    }
  }
  ,

  async matchCode(data: matchCodeData) {
    try {
      const response = await api.post("/api/auth/matchCode", {
        email: data.email,
        code: data.code
      });

      return response;
    } catch (error: any) {


      throw error.response?.data || error.message;


    }
  },
  async changePass(data: changePassData) {
    try {
      const response = await api.post("/api/auth/resetPass", {
        email: data.email,
        code: data.code,
        password: data.password,
        confirmPassword: data.confirmPassword
      });

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  }
}; 