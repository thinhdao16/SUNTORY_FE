export interface LoginRequest {
    email: string;
    password: string;
    deviceId: string | null;
    firebaseToken?: string;
}

export interface GetInfoRequest {
    deviceId: string;
}

export interface LoginRequestWithDeviceId {
    token?: string;
    ipAddress?: string;
    providerId?: string;
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
        friendNumber: number;
        country: {
            id: number;
            code: string;
            name: string;
        };
        currentMeasurement: any[];
    };
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    returnUrl?: string;
    deviceId: string
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
export interface LogoutPayload {
    deviceId: string;
}

export interface UpdateAccountInformationV3Payload {
    firstName: string | null;
    lastName: string | null;
    gender: number | null;
    yearOfBirth: number | null;
    countryId: number | null;
    languageId: number | null;
}

export interface UpdateHealthConditionV2Payload {
    weight: number | null;
    weightUnitId: number | null;
    allergies: any[] | null;
    lifestyleId: number | null;
    healthConditions: any[] | null;
    height: number | null;
    heightUnitId: number | null;
}

export interface OtherUserProfileResponse {
    id: number;
    firstname: string;
    lastname: string;
    code: string;
    avatarLink: string;
    friendNumber: number;
    country: {
        code: string;
    };
    isFriend: boolean;
    isRequestSender :boolean;
    isRequestReceiver :boolean;
}