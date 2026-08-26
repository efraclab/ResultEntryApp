using Microsoft.AspNetCore.Mvc;
using ResultEntryApi.Models;
using ResultEntryApi.Services;

namespace ResultEntryApi.Controllers
{
    [ApiController]
    [Route("api/result-entry")]
    public class ResultEntryController
        : ControllerBase
    {
        private readonly
            IResultEntryService
                _service;


        private readonly
            AdminAuthService
                _adminAuth;


        public ResultEntryController(
            IResultEntryService service,
            AdminAuthService adminAuth
        )
        {
            _service =
                service;

            _adminAuth =
                adminAuth;
        }


        [HttpGet]
        public async Task<IActionResult>
            GetByRegistration(
                [FromQuery]
                string registrationNo,

                [FromQuery]
                string? labCode = null
            )
        {
            try
            {
                var isAdmin =
                    IsAdmin();


                List<ResultEntryDto>
                    results;


                if (isAdmin)
                {
                    results =
                        await _service
                            .GetByRegistrationForAdminAsync(
                                registrationNo
                            );
                }
                else
                {
                    if (
                        string.IsNullOrWhiteSpace(
                            labCode
                        )
                    )
                    {
                        return Unauthorized(
                            new
                            {
                                success = false,

                                message =
                                    "Lab Code is required."
                            }
                        );
                    }


                    results =
                        await _service
                            .GetByRegistrationAsync(
                                registrationNo,
                                labCode
                            );
                }


                if (
                    results.Count == 0
                )
                {
                    return NotFound(
                        new
                        {
                            success = false,

                            message =
                                "No records found."
                        }
                    );
                }


                return Ok(
                    new
                    {
                        success = true,

                        registrationNo,

                        totalRows =
                            results.Count,

                        data =
                            results
                    }
                );
            }
            catch (
                ArgumentException ex
            )
            {
                return BadRequest(
                    new
                    {
                        success = false,

                        message =
                            ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,

                        message =
                            "Unable to load registration.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        [HttpPut]
        public async Task<IActionResult>
            UpdateResults(
                [FromBody]
                UpdateResultRequest request
            )
        {
            try
            {
                await _service
                    .UpdateResultsAsync(
                        request,
                        IsAdmin()
                    );


                return Ok(
                    new
                    {
                        success = true,

                        message =
                            "Results updated successfully."
                    }
                );
            }
            catch (
                ArgumentException ex
            )
            {
                return BadRequest(
                    new
                    {
                        success = false,

                        message =
                            ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,

                        message =
                            "Unable to update results.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        [HttpGet("method")]
        public async Task<IActionResult>
            GetMethod(
                [FromQuery]
                string methodCode
            )
        {
            var method =
                await _service
                    .GetMethodNameByCodeAsync(
                        methodCode
                    );


            if (
                string.IsNullOrWhiteSpace(
                    method
                )
            )
            {
                return NotFound(
                    new
                    {
                        success = false,

                        message =
                            "No method found for this M Code."
                    }
                );
            }


            return Ok(
                new
                {
                    success = true,

                    methodCode,

                    method
                }
            );
        }


        [HttpGet("methods/search")]
        public async Task<IActionResult>
            SearchMethods(
                [FromQuery]
                string search
            )
        {
            return Ok(
                new
                {
                    success = true,

                    data =
                        await _service
                            .SearchMethodsAsync(
                                search
                            )
                }
            );
        }


        [HttpGet(
            "specifications/search"
        )]
        public async Task<IActionResult>
            SearchSpecifications(
                [FromQuery]
                string search
            )
        {
            return Ok(
                new
                {
                    success = true,

                    data =
                        await _service
                            .SearchSpecificationsAsync(
                                search
                            )
                }
            );
        }


        private bool IsAdmin()
        {
            var auth =
                Request.Headers
                    .Authorization
                    .ToString();


            const string prefix =
                "Bearer ";


            if (
                !auth.StartsWith(
                    prefix,
                    StringComparison
                        .OrdinalIgnoreCase
                )
            )
            {
                return false;
            }


            var token =
                auth[
                    prefix.Length..
                ]
                .Trim();


            return _adminAuth
                .IsValidToken(
                    token
                );
        }
    }
}