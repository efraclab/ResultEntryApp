using Microsoft.AspNetCore.Mvc;
using ResultEntryApi.Services;

namespace ResultEntryApi.Controllers
{
    public class AdminLoginRequest
    {
        public string Username
        {
            get;
            set;
        } = string.Empty;


        public string Password
        {
            get;
            set;
        } = string.Empty;
    }


    [ApiController]
    [Route("api/admin-auth")]
    public class AdminAuthController
        : ControllerBase
    {
        private readonly
            AdminAuthService
                _authService;


        public AdminAuthController(
            AdminAuthService authService
        )
        {
            _authService =
                authService;
        }


        [HttpPost("login")]
        public IActionResult Login(
            [FromBody]
            AdminLoginRequest request
        )
        {
            if (
                !_authService.Login(
                    request.Username,
                    request.Password
                )
            )
            {
                return Unauthorized(
                    new
                    {
                        success = false,

                        message =
                            "Invalid username or password."
                    }
                );
            }


            var token =
                _authService
                    .CreateToken();


            return Ok(
                new
                {
                    success = true,

                    token,

                    username =
                        "admin"
                }
            );
        }


        [HttpGet("validate")]
        public IActionResult Validate()
        {
            var token =
                GetToken();


            if (
                !_authService
                    .IsValidToken(
                        token
                    )
            )
            {
                return Unauthorized(
                    new
                    {
                        success = false,

                        valid = false
                    }
                );
            }


            return Ok(
                new
                {
                    success = true,

                    valid = true
                }
            );
        }


        private string? GetToken()
        {
            var value =
                Request.Headers
                    .Authorization
                    .ToString();


            const string prefix =
                "Bearer ";


            if (
                !value.StartsWith(
                    prefix,
                    StringComparison
                        .OrdinalIgnoreCase
                )
            )
            {
                return null;
            }


            return value[
                prefix.Length..
            ].Trim();
        }
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var token = GetToken();

            if (!string.IsNullOrWhiteSpace(token))
            {
                _authService.Logout(token);
            }

            return Ok(
                new
                {
                    success = true,
                    message = "Logged out successfully."
                }
            );
        }
    }
}