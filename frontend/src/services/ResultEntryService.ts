import axios from "axios";


/* =========================================================
   API BASE URL

   Local fallback:
   http://localhost:5096/api

   Remote .env example:
   VITE_API_URL=http://192.168.2.220:5085/api
========================================================= */

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5096/api";


/* =========================================================
   RESULT ENTRY
========================================================= */

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

    /*
     * TRN2HODREVIEW
     *
     * Y = reviewed / editing locked
     * anything else = editable
     */
    hodReview: string;
}


/* =========================================================
   UPDATE RESULT ROW
========================================================= */

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


/* =========================================================
   GET RESULT RESPONSE
========================================================= */

interface GetResultsResponse {
    success: boolean;

    registrationNo: string;

    totalRows: number;

    data: ResultEntry[];
}


/* =========================================================
   UPDATE RESULT RESPONSE
========================================================= */

export interface UpdateResultsResponse {
    success: boolean;

    message: string;
}


/* =========================================================
   METHOD LOOKUP RESPONSE

   Used for:
   M Code -> Method
========================================================= */

interface MethodLookupResponse {
    success: boolean;

    methodCode: string;

    method: string;
}


/* =========================================================
   METHOD SEARCH

   Used for:
   Method -> M Code
========================================================= */

export interface MethodSuggestion {
    code: string;

    method: string;
}


interface MethodSearchResponse {
    success: boolean;

    data: MethodSuggestion[];
}


/* =========================================================
   SPECIFICATION SEARCH
========================================================= */

export interface SpecificationSuggestion {
    specName: string;
}


interface SpecificationSearchResponse {
    success: boolean;

    data: SpecificationSuggestion[];
}


/* =========================================================
   GET RESULTS BY REGISTRATION
========================================================= */

export const getResultsByRegistration = async (
    registrationNo: string,
    labCode: string
): Promise<ResultEntry[]> => {

    const response =
        await axios.get<GetResultsResponse>(
            `${API_BASE_URL}/result-entry`,
            {
                params: {
                    registrationNo,
                    labCode,
                },
            }
        );

    return response.data.data;
};


/* =========================================================
   UPDATE RESULTS
========================================================= */

export const updateResults = async (
    registrationNo: string,
    userId: string,
    labCode: string,
    rows: UpdateResultRow[]
): Promise<UpdateResultsResponse> => {

    const response =
        await axios.put<UpdateResultsResponse>(
            `${API_BASE_URL}/result-entry`,
            {
                registrationNo,
                userId,
                labCode,
                rows,
            }
        );

    return response.data;
};


/* =========================================================
   M CODE -> METHOD

   Backend:
   GET /api/result-entry/method?methodCode=7471

   Example return:
   QA.16.4.7
========================================================= */

export const getMethodByCode = async (
    methodCode: string
): Promise<string> => {

    const cleanedMethodCode =
        methodCode.trim();


    if (!cleanedMethodCode) {
        return "";
    }


    const response =
        await axios.get<MethodLookupResponse>(
            `${API_BASE_URL}/result-entry/method`,
            {
                params: {
                    methodCode:
                        cleanedMethodCode,
                },
            }
        );


    return response.data.method;
};


/* =========================================================
   SEARCH METHODS

   Backend:
   GET /api/result-entry/methods/search?search=qa

   Returns:
   [
       {
           code: "7471",
           method: "QA.16.4.7"
       }
   ]
========================================================= */

export const searchMethods = async (
    search: string
): Promise<MethodSuggestion[]> => {

    const cleanedSearch =
        search.trim();


    if (!cleanedSearch) {
        return [];
    }


    const response =
        await axios.get<MethodSearchResponse>(
            `${API_BASE_URL}/result-entry/methods/search`,
            {
                params: {
                    search:
                        cleanedSearch,
                },
            }
        );


    return response.data.data ?? [];
};


/* =========================================================
   SEARCH SPECIFICATIONS

   Source table:
   SpecificationMst

   Search column:
   SpecName

   Backend:
   GET
   /api/result-entry/specifications/search?search=absent
========================================================= */

export const searchSpecifications = async (
    search: string
): Promise<SpecificationSuggestion[]> => {

    const cleanedSearch =
        search.trim();


    if (!cleanedSearch) {
        return [];
    }


    const response =
        await axios.get<SpecificationSearchResponse>(
            `${API_BASE_URL}/result-entry/specifications/search`,
            {
                params: {
                    search:
                        cleanedSearch,
                },
            }
        );


    return response.data.data ?? [];
};