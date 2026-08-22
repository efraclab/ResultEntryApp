using ResultEntryApi.Models;

namespace ResultEntryApi.Services
{
    public interface IResultEntryService
    {
        Task<List<ResultEntryDto>> GetByRegistrationAsync(
            string registrationNo
        );

        Task<bool> UpdateResultsAsync(
            UpdateResultRequest request
        );
    }
}