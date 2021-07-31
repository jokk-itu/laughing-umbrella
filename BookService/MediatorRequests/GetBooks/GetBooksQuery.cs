using System.Collections.Generic;
using Database.Entities;
using MediatR;

namespace MediatorRequests.GetBooks
{
    public record GetBooksQuery : IRequest<ICollection<Book>>;
}