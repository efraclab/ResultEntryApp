using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace ResultEntryApi.Services
{
    public class AdminAuthService
    {
        private const string Username =
            "admin";


        private const string Password =
            "admin0090";


        private readonly
            ConcurrentDictionary<
                string,
                DateTime
            >
            _sessions =
                new();


        private static readonly
            TimeSpan SessionLifetime =
                TimeSpan.FromHours(8);


        public bool Login(
            string username,
            string password
        )
        {
            return
                string.Equals(
                    username?.Trim(),
                    Username,
                    StringComparison
                        .OrdinalIgnoreCase
                )
                &&
                string.Equals(
                    password,
                    Password,
                    StringComparison.Ordinal
                );
        }


        public string CreateToken()
        {
            var token =
                Convert.ToHexString(
                    RandomNumberGenerator
                        .GetBytes(32)
                );


            _sessions[token] =
                DateTime.UtcNow
                    .Add(
                        SessionLifetime
                    );


            return token;
        }


        public bool IsValidToken(
            string? token
        )
        {
            if (
                string.IsNullOrWhiteSpace(
                    token
                )
            )
            {
                return false;
            }


            if (
                !_sessions.TryGetValue(
                    token,
                    out var expiry
                )
            )
            {
                return false;
            }


            if (
                expiry <=
                DateTime.UtcNow
            )
            {
                _sessions.TryRemove(
                    token,
                    out _
                );

                return false;
            }


            return true;
        }
        public void Logout(string? token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return;
            }

            _sessions.TryRemove(token, out _);
        }
    }
}