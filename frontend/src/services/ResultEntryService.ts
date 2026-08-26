import axios from "axios";


const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5096/api";


/* =========================================================
   RESULT ENTRY
========================================================= */

export interface ResultEntry {
    registrationNo: string;

    testCode: string;

    parameterName: string;

    /*
     * TRN2DEPARTCD
     *
     * Hidden from normal table.
     */
    labCode: string;

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


/* =========================================================
   UPDATE ROW
========================================================= */

export interface UpdateResultRow {
    testCode: string;

    labCode: string;

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
   RESPONSE TYPES
========================================================= */

interface GetResultsResponse {
    success: boolean;

    registrationNo: string;

    totalRows: number;

    data: ResultEntry[];
}


export interface UpdateResultsResponse {
    success: boolean;

    message: string;
}


/* =========================================================
   METHOD
========================================================= */

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


/* =========================================================
   SPECIFICATION
========================================================= */

export interface SpecificationSuggestion {
    specName: string;
}


interface SpecificationSearchResponse {
    success: boolean;

    data: SpecificationSuggestion[];
}


/* =========================================================
   ADMIN
========================================================= */

export interface AdminLoginResponse {
    success: boolean;

    token: string;

    username: string;
}


interface AdminValidateResponse {
    success: boolean;

    valid: boolean;
}


const createAuthHeaders = (
    adminToken?: string
) => {

    if (!adminToken) {
        return {};
    }


    return {
        Authorization:
            `Bearer ${adminToken}`,
    };
};


/* =========================================================
   ADMIN LOGIN
========================================================= */

export const adminLogin = async (
    username: string,
    password: string
): Promise<AdminLoginResponse> => {

    const response =
        await axios.post<
            AdminLoginResponse
        >(
            `${API_BASE_URL}/admin-auth/login`,
            {
                username,
                password,
            }
        );


    return response.data;
};


/* =========================================================
   VALIDATE ADMIN
========================================================= */

export const validateAdminSession =
    async (
        token: string
    ): Promise<boolean> => {

        if (!token) {
            return false;
        }


        try {

            const response =
                await axios.get<
                    AdminValidateResponse
                >(
                    `${API_BASE_URL}/admin-auth/validate`,
                    {
                        headers:
                            createAuthHeaders(
                                token
                            ),
                    }
                );


            return (
                response.data.success &&
                response.data.valid
            );

        }
        catch {

            return false;
        }
    };


/* =========================================================
   GET REGISTRATION
========================================================= */

export const getResultsByRegistration =
    async (
        registrationNo: string,
        labCode?: string,
        adminToken?: string
    ): Promise<ResultEntry[]> => {

        const params:
            Record<string, string> =
        {
            registrationNo:
                registrationNo.trim(),
        };


        if (labCode?.trim()) {

            params.labCode =
                labCode.trim();
        }


        const response =
            await axios.get<
                GetResultsResponse
            >(
                `${API_BASE_URL}/result-entry`,
                {
                    params,

                    headers:
                        createAuthHeaders(
                            adminToken
                        ),
                }
            );


        return response.data.data ?? [];
    };


/* =========================================================
   UPDATE RESULTS
========================================================= */

export const updateResults =
    async (
        registrationNo: string,
        userId: string,
        labCode: string,
        rows: UpdateResultRow[],
        adminToken?: string
    ): Promise<UpdateResultsResponse> => {

        const response =
            await axios.put<
                UpdateResultsResponse
            >(
                `${API_BASE_URL}/result-entry`,
                {
                    registrationNo,
                    userId,
                    labCode,
                    rows,
                },
                {
                    headers:
                        createAuthHeaders(
                            adminToken
                        ),
                }
            );


        return response.data;
    };


/* =========================================================
   M CODE -> METHOD
========================================================= */

export const getMethodByCode =
    async (
        methodCode: string
    ): Promise<string> => {

        const cleaned =
            methodCode.trim();


        if (
            !cleaned ||
            cleaned === "-"
        ) {
            return "-";
        }


        const response =
            await axios.get<
                MethodLookupResponse
            >(
                `${API_BASE_URL}/result-entry/method`,
                {
                    params: {
                        methodCode:
                            cleaned,
                    },
                }
            );


        return response.data.method;
    };


/* =========================================================
   METHOD SEARCH
========================================================= */

export const searchMethods =
    async (
        search: string
    ): Promise<MethodSuggestion[]> => {

        const cleaned =
            search.trim();


        if (
            !cleaned ||
            cleaned === "-"
        ) {
            return [];
        }


        const response =
            await axios.get<
                MethodSearchResponse
            >(
                `${API_BASE_URL}/result-entry/methods/search`,
                {
                    params: {
                        search:
                            cleaned,
                    },
                }
            );


        return response.data.data ?? [];
    };


/* =========================================================
   SPEC SEARCH
========================================================= */

export const searchSpecifications =
    async (
        search: string
    ): Promise<
        SpecificationSuggestion[]
    > => {

        const cleaned =
            search.trim();


        if (
            !cleaned ||
            cleaned === "-"
        ) {
            return [];
        }


        const response =
            await axios.get<
                SpecificationSearchResponse
            >(
                `${API_BASE_URL}/result-entry/specifications/search`,
                {
                    params: {
                        search:
                            cleaned,
                    },
                }
            );


        return response.data.data ?? [];
    };

    export const adminLogout = async (
    token: string
): Promise<void> => {

    if (!token) {
        return;
    }

    await axios.post(
        `${API_BASE_URL}/admin-auth/logout`,
        {},
        {
            headers: createAuthHeaders(token),
        }
    );
};