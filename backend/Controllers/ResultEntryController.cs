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
        private readonly IResultEntryService _service;


        public ResultEntryController(
            IResultEntryService service
        )
        {
            _service = service;
        }


        // =====================================================
        // GET REGISTRATION
        // =====================================================

        [HttpGet]
        public async Task<IActionResult>
            GetByRegistration(
                [FromQuery]
                string registrationNo,

                [FromQuery]
                string labCode
            )
        {
            try
            {
                var results =
                    await _service
                        .GetByRegistrationAsync(
                            registrationNo,
                            labCode
                        );


                if (
                    results == null ||
                    results.Count == 0
                )
                {
                    return NotFound(
                        new
                        {
                            success = false,

                            message =
                                "No records found for this registration number and lab."
                        }
                    );
                }


                return Ok(
                    new
                    {
                        success = true,

                        registrationNo,

                        labCode,

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


        // =====================================================
        // UPDATE
        // =====================================================

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
                        request
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
                            "An error occurred while updating result data.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        // =====================================================
        // M CODE -> METHOD
        // =====================================================

        [HttpGet("method")]
        public async Task<IActionResult>
            GetMethodByCode(
                [FromQuery]
                string methodCode
            )
        {
            try
            {
                var methodName =
                    await _service
                        .GetMethodNameByCodeAsync(
                            methodCode
                        );


                if (
                    string.IsNullOrWhiteSpace(
                        methodName
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

                        method =
                            methodName
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
                            "Unable to fetch method.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        // =====================================================
        // SEARCH METHODS
        // =====================================================

        [HttpGet("methods/search")]
        public async Task<IActionResult>
            SearchMethods(
                [FromQuery]
                string search
            )
        {
            try
            {
                var methods =
                    await _service
                        .SearchMethodsAsync(
                            search
                        );


                return Ok(
                    new
                    {
                        success = true,

                        data =
                            methods
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
                            "Unable to search methods.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        // =====================================================
        // SEARCH SPECIFICATIONS
        // =====================================================

        [HttpGet(
            "specifications/search"
        )]
        public async Task<IActionResult>
            SearchSpecifications(
                [FromQuery]
                string search
            )
        {
            try
            {
                var specifications =
                    await _service
                        .SearchSpecificationsAsync(
                            search
                        );


                return Ok(
                    new
                    {
                        success = true,

                        data =
                            specifications
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
                            "Unable to search specifications.",

                        error =
                            ex.Message
                    }
                );
            }
        }
    }
}