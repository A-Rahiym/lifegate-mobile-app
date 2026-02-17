import { LoginPayload, LoginResponse } from 'types/auth-types';

// pretend "database"
const USERS_DB = [
  {
    id: '1',
    name: 'Test User',
    email: 'admin@lifegate.com',
    password: '123456',
  },
];

export const AuthService = {
  // ---------------- LOGIN ----------------
  async login(payload: LoginPayload): Promise<LoginResponse> {
    console.log('Sending login request to server...');

    await new Promise(res => setTimeout(res, 1200));

    const user = USERS_DB.find(
      u => u.email === payload.email && u.password === payload.password
    );

    if (user) {
      console.log('✅ Login successful (server validated credentials)');

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } else {
      console.log('Login failed: Invalid email or password');
      return { success: false, message: 'Invalid email or password' };
    }
  },

  // ---------------- REGISTER ----------------
  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    console.log('Sending registration request to server...');

    await new Promise(res => setTimeout(res, 1500));

    // check if email already exists
    const existingUser = USERS_DB.find(u => u.email === payload.email);
    if (existingUser) {
      console.log('Registration failed: Email already in use');
      return { success: false, message: 'Email already in use' };
    }

    // create new user
    const newUser = {
      id: (USERS_DB.length + 1).toString(), // simple auto-increment id
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };

    USERS_DB.push(newUser);

    console.log('Registration successful');

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  },
};
