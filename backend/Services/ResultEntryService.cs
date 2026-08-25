using ResultEntryApi.Models;
using ResultEntryApi.Repositories;

namespace ResultEntryApi.Services
{
    public class ResultEntryService
        : IResultEntryService
    {
        private readonly IResultEntryRepository _repository;


        public ResultEntryService(
            IResultEntryRepository repository
        )
        {
            _repository = repository;
        }


        // =====================================================
        // GET REGISTRATION BY LAB
        // =====================================================

        public async Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo,
                string labCode
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    registrationNo
                )
            )
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    labCode
                )
            )
            {
                throw new ArgumentException(
                    "Lab Code is required."
                );
            }


            return await _repository
                .GetByRegistrationAsync(
                    registrationNo.Trim(),
                    labCode.Trim()
                );
        }


        // =====================================================
        // UPDATE
        // =====================================================

        public async Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request
            )
        {
            if (
                request == null
            )
            {
                throw new ArgumentNullException(
                    nameof(request)
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    request.RegistrationNo
                )
            )
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    request.UserId
                )
            )
            {
                throw new ArgumentException(
                    "User ID is required for saving changes."
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    request.LabCode
                )
            )
            {
                throw new ArgumentException(
                    "Lab Code is required."
                );
            }


            if (
                request.Rows == null ||
                request.Rows.Count == 0
            )
            {
                throw new ArgumentException(
                    "No rows provided for update."
                );
            }


            request.RegistrationNo =
                request.RegistrationNo.Trim();


            request.UserId =
                request.UserId.Trim();


            request.LabCode =
                request.LabCode.Trim();


            foreach (
                var row in request.Rows
            )
            {
                if (
                    string.IsNullOrWhiteSpace(
                        row.TestCode
                    )
                )
                {
                    throw new ArgumentException(
                        "Test Code is required for every row."
                    );
                }


                row.TestCode =
                    row.TestCode.Trim();


                /*
                 * NABL:
                 *
                 * Y => Y
                 *
                 * everything else =>
                 * N
                 */
                row.NABL =
                    string.Equals(
                        row.NABL?.Trim(),
                        "Y",
                        StringComparison
                            .OrdinalIgnoreCase
                    )
                        ? "Y"
                        : "N";
            }


            return await _repository
                .UpdateResultsAsync(
                    request
                );
        }


        // =====================================================
        // M CODE -> METHOD
        // =====================================================

        public async Task<string?>
            GetMethodNameByCodeAsync(
                string methodCode
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    methodCode
                )
            )
            {
                throw new ArgumentException(
                    "Method Code is required."
                );
            }


            return await _repository
                .GetMethodNameByCodeAsync(
                    methodCode.Trim()
                );
        }


        // =====================================================
        // METHOD SEARCH
        // =====================================================

        public async Task<List<MethodLookupDto>>
            SearchMethodsAsync(
                string searchText
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    searchText
                )
            )
            {
                return new List<
                    MethodLookupDto
                >();
            }


            return await _repository
                .SearchMethodsAsync(
                    searchText.Trim()
                );
        }


        // =====================================================
        // SPECIFICATION SEARCH
        // =====================================================

        public async Task<List<SpecificationLookupDto>>
            SearchSpecificationsAsync(
                string searchText
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    searchText
                )
            )
            {
                return new List<
                    SpecificationLookupDto
                >();
            }


            return await _repository
                .SearchSpecificationsAsync(
                    searchText.Trim()
                );
        }
    }
}