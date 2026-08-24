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
    rows: UpdateResultRow[]
): Promise<UpdateResultsResponse> => {
    const response =
        await axios.put<UpdateResultsResponse>(
            `${API_BASE_URL}/result-entry`,
            {
                registrationNo,
                rows,
            }
        );

    return response.data;
};