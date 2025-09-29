export interface DietStyleResponse {
    data: {
        id: number;
        name: string;
        description: string;
    }[];
}

export interface MenuAnalyzingResponse {
    data: {
        id: number;
        fileInfoId: number;
        status: number;
        createDate: string;
        totalFood: number;
        key: string;
    };
}

export interface FoodItem {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    fiber?: number;
    description?: string;
    status?: number;
    createDate?: string;

}

export interface Paged<T> {
    pageNumber: number;
    pageSize: number;
    firstPage: number;
    lastPage: number;
    totalPages: number;
    totalRecords: number;
    nextPage: boolean;
    previousPage: boolean;
    data: T;
}

export interface Response<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface FoodModel {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    currency: string;
    calories?: number;
    carbohydrates?: number;
    fat?: number;
    sugar?: number;
    fiber?: number;
    protein?: number;
    originalName?: string;
    advice?: string;
    description?: string;
    status?: number;
    createDate?: string;
    foodComponents?: {
        name: string;
    }[];
}

export interface ListFoodQuery {
    menuId: number;
    pageIndex?: number;
    pageSize?: number;
}

export interface MenuFoodListResponse extends Paged<FoodModel[]> { }