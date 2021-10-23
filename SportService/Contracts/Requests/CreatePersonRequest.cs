using System.ComponentModel.DataAnnotations;

namespace Contracts.Requests
{
    public record CreatePersonRequest(
        [Required] string Name,
        [Required] long GenderId,
        [Required] float Height);
}