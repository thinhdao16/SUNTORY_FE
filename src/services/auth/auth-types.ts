export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    data: {
        id: number;
        firstname: string;
        lastname: string;
        name: string;
        email: string;
        phone: string;
        gender: number;
        dateOfBirth: string | null;
        avatar: string;
        avatarLink: string;
        organizationId: number;
        organizationRole: number;
        token: string;
        refreshToken: string;
        userType: number;
        height: number;
        weight: number;
        bloodPressure: string;
        bloodType: string;
        healthDocuments: any;
        allergies: any;
        healthConditions: any;
        currentMedications: any;
        organizations: any[];
    };
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    returnUrl?: string;
}

export interface RegisterResponse {
    data: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
        token: string;
        refreshToken: string;
    };
}

export interface UpdatePasswordOtpPayload {
    otp: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export interface ChangePasswordPayload {
    currentPassword: string;
    password: string;
    confirmPassword: string;
}