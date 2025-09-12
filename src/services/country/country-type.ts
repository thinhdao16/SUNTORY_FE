export interface Country {
    id: number;
    code: string;
    name: string;
}

export interface CountryResponse {
    data: Country[];
}