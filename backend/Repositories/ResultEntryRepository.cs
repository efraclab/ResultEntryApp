using System.Data;
using Microsoft.Data.SqlClient;
using ResultEntryApi.Models;

namespace ResultEntryApi.Repositories
{
    public class ResultEntryRepository : IResultEntryRepository
    {
        private readonly string _connectionString;

        public ResultEntryRepository(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new Exception(
                    "DefaultConnection connection string not found."
                );
        }

        public async Task<List<ResultEntryDto>> GetByRegistrationAsync(
            string registrationNo
        )
        {
            var results = new List<ResultEntryDto>();

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
                    TRN2OUT,
                    TRN2DATA,
                    TRN2AnlstTestDt
                FROM TRN205
                WHERE TRN2REFNO = @RegistrationNo
                ORDER BY TRN2HEADER;
            ";

            await using var connection =
                new SqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var command =
                new SqlCommand(sql, connection);

            command.Parameters.Add(
                "@RegistrationNo",
                SqlDbType.VarChar
            ).Value = registrationNo;

            await using var reader =
                await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                results.Add(new ResultEntryDto
                {
                    RegistrationNo =
                        reader["TRN2REFNO"] == DBNull.Value
                            ? null
                            : reader["TRN2REFNO"].ToString(),

                    TestCode =
                        reader["TRN2HEADER"] == DBNull.Value
                            ? null
                            : reader["TRN2HEADER"].ToString(),

                    MethodCode =
                        reader["TRN2_METHDO_DTL"] == DBNull.Value
                            ? null
                            : reader["TRN2_METHDO_DTL"].ToString(),

                    Method =
                        reader["TRN2METHOD"] == DBNull.Value
                            ? null
                            : reader["TRN2METHOD"].ToString(),

                    Unit =
                        reader["TRN2OUTSTR"] == DBNull.Value
                            ? null
                            : reader["TRN2OUTSTR"].ToString(),

                    Instrument =
                        reader["TRN2INSTNO"] == DBNull.Value
                            ? null
                            : reader["TRN2INSTNO"].ToString(),

                    LOQ =
                        reader["TRN2LOQ"] == DBNull.Value
                            ? null
                            : reader["TRN2LOQ"].ToString(),

                    Result =
                        reader["TRN2INPUT"] == DBNull.Value
                            ? null
                            : reader["TRN2INPUT"].ToString(),

                    NABL =
                        reader["TRN2NABLYN"] == DBNull.Value
                            ? null
                            : reader["TRN2NABLYN"].ToString(),

                    Spec =
                        reader["TRN2HEADSPEC"] == DBNull.Value
                            ? null
                            : reader["TRN2HEADSPEC"].ToString(),

                    RefMethod =
                        reader["TRN2REFMETHOD"] == DBNull.Value
                            ? null
                            : reader["TRN2REFMETHOD"].ToString(),

                    Out =
                        reader["TRN2OUT"] == DBNull.Value
                            ? null
                            : reader["TRN2OUT"].ToString(),

                    Data =
                        reader["TRN2DATA"] == DBNull.Value
                            ? null
                            : reader["TRN2DATA"].ToString(),

                    AnalystTestDate =
                        reader["TRN2AnlstTestDt"] == DBNull.Value
                            ? null
                            : Convert.ToDateTime(
                                reader["TRN2AnlstTestDt"]
                            )
                });
            }

            return results;
        }

        public async Task<bool> UpdateResultsAsync(
            UpdateResultRequest request
        )
        {
            await using var connection =
                new SqlConnection(_connectionString);

            await connection.OpenAsync();

            await using var transaction =
                await connection.BeginTransactionAsync();

            try
            {
                const string sql = @"
                    UPDATE TRN205
                    SET
                        TRN2LOQ = @LOQ,
                        TRN2INSTNO = @Instrument,
                        TRN2INPUT = @Result,

                        TRN2OUT = '1',
                        TRN2DATA = 'Y',

                        TRN2HEADSPEC = @Spec,
                        TRN2REFMETHOD = @RefMethod,

                        TRN2AnlstTestDt = GETDATE(),

                        TRN2NABLYN = @NABL,
                        TRN2OUTSTR = @Unit,
                        TRN2METHOD = @Method,
                        TRN2_METHDO_DTL = @MethodCode

                    WHERE TRN2REFNO = @RegistrationNo
                    AND TRN2HEADER = @TestCode;
                ";

                foreach (var row in request.Rows)
                {
                    await using var command =
                        new SqlCommand(
                            sql,
                            connection,
                            (SqlTransaction)transaction
                        );

                    AddNullableStringParameter(
                        command,
                        "@LOQ",
                        row.LOQ
                    );

                    AddNullableStringParameter(
                        command,
                        "@Instrument",
                        row.Instrument
                    );

                    AddNullableStringParameter(
                        command,
                        "@Result",
                        row.Result
                    );

                    AddNullableStringParameter(
                        command,
                        "@Spec",
                        row.Spec
                    );

                    AddNullableStringParameter(
                        command,
                        "@RefMethod",
                        row.RefMethod
                    );

                    AddNullableStringParameter(
                        command,
                        "@NABL",
                        row.NABL
                    );

                    AddNullableStringParameter(
                        command,
                        "@Unit",
                        row.Unit
                    );

                    AddNullableStringParameter(
                        command,
                        "@Method",
                        row.Method
                    );

                    AddNullableStringParameter(
                        command,
                        "@MethodCode",
                        row.MethodCode
                    );

                    command.Parameters.Add(
                        "@RegistrationNo",
                        SqlDbType.VarChar
                    ).Value = request.RegistrationNo;

                    command.Parameters.Add(
                        "@TestCode",
                        SqlDbType.VarChar
                    ).Value = row.TestCode;

                    var affectedRows =
                        await command.ExecuteNonQueryAsync();

                    if (affectedRows == 0)
                    {
                        throw new Exception(
                            $"No row found for Registration No: {request.RegistrationNo}, Test Code: {row.TestCode}"
                        );
                    }
                }

                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static void AddNullableStringParameter(
            SqlCommand command,
            string parameterName,
            string? value
        )
        {
            var parameter =
                command.Parameters.Add(
                    parameterName,
                    SqlDbType.VarChar
                );

            parameter.Value =
                string.IsNullOrWhiteSpace(value)
                    ? DBNull.Value
                    : value.Trim();
        }
    }
}