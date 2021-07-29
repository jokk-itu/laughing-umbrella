namespace Contracts.Responses
{
    public record CreatePersonResponse(long Id, string Name, long GenderId, float Height);
}