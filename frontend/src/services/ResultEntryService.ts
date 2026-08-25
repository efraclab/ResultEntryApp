import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5096/api";

export interface ResultEntry {
    registrationNo: string;
    testCode: string;
    methodCode: string;
    method: string;
    unit: string;
    instrument: string;
    loq: string;
    result: string;
    nabl: string;
    spec: string;
    refMethod: string;
    hodReview: string;
}

export interface UpdateResultRow {
    testCode: string;
    methodCode: string;
    method: string;
    unit: string;
    instrument: string;
    loq: string;
    result: string;
    nabl: string;
    spec: string;
    refMethod: string;
}

interface GetResultsResponse {
    success: boolean;
    registrationNo: string;
    totalRows: number;
    data: ResultEntry[];
}

interface UpdateResultsResponse {
    success: boolean;
    message: string;
}

interface MethodLookupResponse {
    success: boolean;
    methodCode: string;
    method: string;
}

export interface MethodSuggestion {
    code: string;
    method: string;
}

interface MethodSearchResponse {
    success: boolean;
    data: MethodSuggestion[];
}


export const getResultsByRegistration = async (
    registrationNo: string
): Promise<ResultEntry[]> => {
    const response =
        await axios.get<GetResultsResponse>(
            `${API_BASE_URL}/result-entry`,
            {
                params: {
                    registrationNo,
                },
            }
        );

    return response.data.data;
};

export const updateResults = async (
    registrationNo: string,
    userId: string,
    rows: UpdateResultRow[]
): Promise<UpdateResultsResponse> => {
    const response =
        await axios.put<UpdateResultsResponse>(
            `${API_BASE_URL}/result-entry`,
            {
                registrationNo,
                userId,
                rows,
            }
        );

    return response.data;
};

export const getMethodByCode = async (
    methodCode: string
): Promise<string> => {
    const response =
        await axios.get<MethodLookupResponse>(
            `${API_BASE_URL}/result-entry/method`,
            {
                params: {
                    methodCode,
                },
            }
        );

    return response.data.method;
};

export const searchMethods = async (
    search: string
): Promise<MethodSuggestion[]> => {

    const response =
        await axios.get<MethodSearchResponse>(
            `${API_BASE_URL}/result-entry/methods/search`,
            {
                params: {
                    search,
                },
            }
        );

    return response.data.data;
};