using Database.Entities;
using MediatR;

namespace MediatorRequests.CreateAuthor
{
    public record CreateAuthorCommand : IRequest<Author>
    {
        public string Name { get; init; }

        public CreateAuthorCommand()
        {
            
        }
    }
}