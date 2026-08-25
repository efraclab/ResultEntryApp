using ResultEntryApi.Models;

namespace ResultEntryApi.Repositories
{
    public interface IResultEntryRepository
    {
        Task<List<ResultEntryDto>> GetByRegistrationAsync(
            string registrationNo
        );

        Task<bool> UpdateResultsAsync(
            UpdateResultRequest request
        );

        Task<string?> GetMethodNameByCodeAsync(
            string methodCode
        );

        Task<List<MethodLookupDto>>
            SearchMethodsAsync(
                string searchText
            );
    }
}