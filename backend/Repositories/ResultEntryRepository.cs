using System.Data;
using Microsoft.Data.SqlClient;
using ResultEntryApi.Models;

namespace ResultEntryApi.Repositories
{
    public class ResultEntryRepository
        : IResultEntryRepository
    {
        private readonly string
            _connectionString;


        public ResultEntryRepository(
            IConfiguration configuration
        )
        {
            _connectionString =
                configuration
                    .GetConnectionString(
                        "DefaultConnection"
                    )
                ?? throw new Exception(
                    "DefaultConnection connection string not found."
                );
        }


        // =====================================================
        // GET BY REGISTRATION + LAB
        // =====================================================

        public async Task<
            List<ResultEntryDto>
        >
            GetByRegistrationAsync(
                string registrationNo,
                string labCode
            )
        {
            var results =
                new List<ResultEntryDto>();


            const string sql = @"
                SELECT
                    TRN2REFNO,
                    TRN2HEADER,
                    TRN2_METHDO_DTL,
                    TRN2METHOD,
                    TRN2OUTSTR,
                    TRN2INSTNO,
                    TRN2LOQ,
                    TRN2INPUT,
                    TRN2NABLYN,
                    TRN2HEADSPEC,
                    TRN2REFMETHOD,
                    TRN2HODREVIEW,
                    TRN2OUT,
                    TRN2DATA,
                    TRN2AnlstTestDt
                FROM TRN205
                WHERE TRN2REFNO =
                    @RegistrationNo

                  AND TRN2DEPARTCD =
                    @LabCode

                ORDER BY TRN2HEADER;
            ";


            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection
                .OpenAsync();


            await using var command =
                new SqlCommand(
                    sql,
                    connection
                );


            command.Parameters.Add(
                "@RegistrationNo",
                SqlDbType.VarChar
            ).Value =
                registrationNo.Trim();


            command.Parameters.Add(
                "@LabCode",
                SqlDbType.VarChar
            ).Value =
                labCode.Trim();


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                results.Add(
                    new ResultEntryDto
                    {
                        RegistrationNo =
                            GetDisplayValue(
                                reader[
                                    "TRN2REFNO"
                                ]
                            ),


                        TestCode =
                            GetDisplayValue(
                                reader[
                                    "TRN2HEADER"
                                ]
                            ),


                        MethodCode =
                            GetDisplayValue(
                                reader[
                                    "TRN2_METHDO_DTL"
                                ]
                            ),


                        Method =
                            GetDisplayValue(
                                reader[
                                    "TRN2METHOD"
                                ]
                            ),


                        Unit =
                            GetDisplayValue(
                                reader[
                                    "TRN2OUTSTR"
                                ]
                            ),


                        Instrument =
                            GetDisplayValue(
                                reader[
                                    "TRN2INSTNO"
                                ]
                            ),


                        LOQ =
                            GetDisplayValue(
                                reader[
                                    "TRN2LOQ"
                                ]
                            ),


                        /*
                         * Result HTML is
                         * preserved.
                         */
                        Result =
                            GetDisplayValue(
                                reader[
                                    "TRN2INPUT"
                                ]
                            ),


                        /*
                         * Only Y stays Y.
                         *
                         * Everything else becomes N.
                         */
                        NABL =
                            NormalizeNabl(
                                reader[
                                    "TRN2NABLYN"
                                ]
                            ),


                        Spec =
                            GetDisplayValue(
                                reader[
                                    "TRN2HEADSPEC"
                                ]
                            ),


                        RefMethod =
                            GetDisplayValue(
                                reader[
                                    "TRN2REFMETHOD"
                                ]
                            ),


                        HodReview =
                            GetDisplayValue(
                                reader[
                                    "TRN2HODREVIEW"
                                ]
                            ),


                        /*
                         * Backend-only values.
                         */
                        Out =
                            GetDisplayValue(
                                reader[
                                    "TRN2OUT"
                                ]
                            ),


                        Data =
                            GetDisplayValue(
                                reader[
                                    "TRN2DATA"
                                ]
                            ),


                        AnalystTestDate =
                            reader[
                                "TRN2AnlstTestDt"
                            ] == DBNull.Value

                                ? null

                                : Convert.ToDateTime(
                                    reader[
                                        "TRN2AnlstTestDt"
                                    ]
                                )
                    }
                );
            }


            return results;
        }


        // =====================================================
        // UPDATE
        // =====================================================

        public async Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request
            )
        {
            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection
                .OpenAsync();


            await using var transaction =
                await connection
                    .BeginTransactionAsync();


            try
            {
                const string sql = @"
                    UPDATE TRN205

                    SET
                        TRN2LOQ =
                            @LOQ,

                        TRN2INSTNO =
                            @Instrument,

                        TRN2INPUT =
                            @Result,

                        TRN2OUT =
                            '1',

                        TRN2DATA =
                            'Y',

                        TRN2HEADSPEC =
                            @Spec,

                        TRN2REFMETHOD =
                            @RefMethod,

                        TRN2AnlstTestDt =
                            GETDATE(),

                        /*
                         * Append audit history.
                         *
                         * Previous values are NOT removed.
                         */
                        ADDR_REMK =
                            CASE

                                WHEN ADDR_REMK IS NULL
                                     OR LTRIM(
                                            RTRIM(
                                                ADDR_REMK
                                            )
                                        ) = ''

                                THEN
                                    @UserId
                                    + ' | '
                                    + CONVERT(
                                        VARCHAR(19),
                                        GETDATE(),
                                        120
                                    )

                                ELSE
                                    ADDR_REMK
                                    + ' ; '
                                    + @UserId
                                    + ' | '
                                    + CONVERT(
                                        VARCHAR(19),
                                        GETDATE(),
                                        120
                                    )

                            END,

                        TRN2NABLYN =
                            @NABL,

                        TRN2OUTSTR =
                            @Unit,

                        TRN2METHOD =
                            @Method,

                        TRN2_METHDO_DTL =
                            @MethodCode


                    WHERE TRN2REFNO =
                        @RegistrationNo

                      AND TRN2HEADER =
                        @TestCode

                      AND TRN2DEPARTCD =
                        @LabCode

                      AND ISNULL(
                            TRN2HODREVIEW,
                            'N'
                          ) <> 'Y';
                ";


                foreach (
                    var row in request.Rows
                )
                {
                    await using var command =
                        new SqlCommand(
                            sql,
                            connection,
                            (SqlTransaction)
                                transaction
                        );


                    // =========================================
                    // VALUES
                    // =========================================

                    AddStringParameter(
                        command,
                        "@LOQ",
                        NormalizeValue(
                            row.LOQ
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Instrument",
                        NormalizeValue(
                            row.Instrument
                        )
                    );


                    /*
                     * Preserve Result HTML.
                     */
                    AddStringParameter(
                        command,
                        "@Result",
                        NormalizeValue(
                            row.Result,
                            trimValue: false
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Spec",
                        NormalizeValue(
                            row.Spec
                        )
                    );


                    AddStringParameter(
                        command,
                        "@RefMethod",
                        NormalizeValue(
                            row.RefMethod
                        )
                    );


                    AddStringParameter(
                        command,
                        "@NABL",
                        NormalizeNabl(
                            row.NABL
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Unit",
                        NormalizeValue(
                            row.Unit
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Method",
                        NormalizeValue(
                            row.Method
                        )
                    );


                    AddStringParameter(
                        command,
                        "@MethodCode",
                        NormalizeValue(
                            row.MethodCode
                        )
                    );


                    // =========================================
                    // WHERE / AUDIT PARAMETERS
                    // =========================================

                    command.Parameters.Add(
                        "@RegistrationNo",
                        SqlDbType.VarChar
                    ).Value =
                        request
                            .RegistrationNo
                            .Trim();


                    command.Parameters.Add(
                        "@TestCode",
                        SqlDbType.VarChar
                    ).Value =
                        row
                            .TestCode
                            .Trim();


                    command.Parameters.Add(
                        "@LabCode",
                        SqlDbType.VarChar
                    ).Value =
                        request
                            .LabCode
                            .Trim();


                    command.Parameters.Add(
                        "@UserId",
                        SqlDbType.VarChar
                    ).Value =
                        request
                            .UserId
                            .Trim();


                    var affectedRows =
                        await command
                            .ExecuteNonQueryAsync();


                    if (
                        affectedRows == 0
                    )
                    {
                        throw new Exception(
                            $"Unable to update Test Code {row.TestCode}. " +
                            "The row may belong to another lab or HOD review may already be completed."
                        );
                    }
                }


                await transaction
                    .CommitAsync();


                return true;
            }
            catch
            {
                await transaction
                    .RollbackAsync();


                throw;
            }
        }


        // =====================================================
        // DISPLAY VALUE
        // =====================================================

        private static string
            GetDisplayValue(
                object value
            )
        {
            if (
                value == DBNull.Value
            )
            {
                return "-";
            }


            var text =
                value.ToString();


            if (
                string.IsNullOrWhiteSpace(
                    text
                )
            )
            {
                return "-";
            }


            return text;
        }


        // =====================================================
        // NORMALIZE SAVE VALUE
        // =====================================================

        private static string
            NormalizeValue(
                string? value,
                bool trimValue = true
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    value
                )
            )
            {
                return "-";
            }


            if (trimValue)
            {
                return value.Trim();
            }


            /*
             * Result HTML stays exactly
             * as received.
             */
            return value;
        }


        // =====================================================
        // NABL
        // =====================================================

        private static string
            NormalizeNabl(
                object value
            )
        {
            if (
                value == DBNull.Value
            )
            {
                return "N";
            }


            return NormalizeNabl(
                value.ToString()
            );
        }


        private static string
            NormalizeNabl(
                string? value
            )
        {
            return string.Equals(
                value?.Trim(),
                "Y",
                StringComparison
                    .OrdinalIgnoreCase
            )
                ? "Y"
                : "N";
        }


        // =====================================================
        // ADD SQL STRING PARAMETER
        // =====================================================

        private static void
            AddStringParameter(
                SqlCommand command,
                string parameterName,
                string value
            )
        {
            var parameter =
                command.Parameters.Add(
                    parameterName,
                    SqlDbType.VarChar
                );


            parameter.Value =
                value;
        }


        // =====================================================
        // M CODE -> METHOD
        // =====================================================

        public async Task<string?>
            GetMethodNameByCodeAsync(
                string methodCode
            )
        {
            const string sql = @"
                SELECT TOP 1
                    CODEDESC

                FROM OCODEMST

                WHERE CODETYPE = 'ME'

                  AND LTRIM(
                        RTRIM(
                            CODECD
                        )
                      ) = @MethodCode;
            ";


            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection
                .OpenAsync();


            await using var command =
                new SqlCommand(
                    sql,
                    connection
                );


            command.Parameters.Add(
                "@MethodCode",
                SqlDbType.VarChar
            ).Value =
                methodCode.Trim();


            var result =
                await command
                    .ExecuteScalarAsync();


            if (
                result == null ||
                result == DBNull.Value
            )
            {
                return null;
            }


            return result
                .ToString()
                ?.Trim();
        }


        // =====================================================
        // SEARCH METHODS
        // =====================================================

        public async Task<
            List<MethodLookupDto>
        >
            SearchMethodsAsync(
                string searchText
            )
        {
            const string sql = @"
                SELECT TOP 5
                    CODECD,
                    CODEDESC

                FROM OCODEMST

                WHERE CODETYPE = 'ME'

                  AND CODEDESC IS NOT NULL

                  AND LTRIM(
                        RTRIM(
                            CODEDESC
                        )
                      ) <> ''

                  AND CODEDESC LIKE
                        @SearchText

                ORDER BY CODEDESC;
            ";


            var results =
                new List<
                    MethodLookupDto
                >();


            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection
                .OpenAsync();


            await using var command =
                new SqlCommand(
                    sql,
                    connection
                );


            command.Parameters.Add(
                "@SearchText",
                SqlDbType.VarChar
            ).Value =
                $"%{searchText.Trim()}%";


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                results.Add(
                    new MethodLookupDto
                    {
                        Code =
                            reader[
                                "CODECD"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? "",


                        Method =
                            reader[
                                "CODEDESC"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? ""
                    }
                );
            }


            return results;
        }


        // =====================================================
        // SEARCH SPECIFICATIONS
        // =====================================================

        public async Task<
            List<SpecificationLookupDto>
        >
            SearchSpecificationsAsync(
                string searchText
            )
        {
            const string sql = @"
                SELECT DISTINCT TOP 5
                    SpecName

                FROM SpecificationMst

                WHERE SpecName IS NOT NULL

                  AND LTRIM(
                        RTRIM(
                            SpecName
                        )
                      ) <> ''

                  AND SpecName LIKE
                        @SearchText

                ORDER BY SpecName;
            ";


            var results =
                new List<
                    SpecificationLookupDto
                >();


            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection
                .OpenAsync();


            await using var command =
                new SqlCommand(
                    sql,
                    connection
                );


            command.Parameters.Add(
                "@SearchText",
                SqlDbType.VarChar
            ).Value =
                $"%{searchText.Trim()}%";


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                results.Add(
                    new SpecificationLookupDto
                    {
                        SpecName =
                            reader[
                                "SpecName"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? ""
                    }
                );
            }


            return results;
        }
    }
}