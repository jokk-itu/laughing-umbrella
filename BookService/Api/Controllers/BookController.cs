using System;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.CreateBook;
using Contracts.GetBook;
using Contracts.GetBooks;
using Database.Entities;
using MediatorRequests.CreateBook;
using MediatorRequests.GetBook;
using MediatorRequests.GetBooks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;

namespace Api.Controllers
{
    [ApiController]
    [Route("book")]
    public class BookController : ControllerBase
    {
        private readonly ILogger<BookController> _logger;
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public BookController(ILogger<BookController> logger, IMediator mediator, IMapper mapper)
        {
            _logger = logger;
            _mediator = mediator;
            _mapper = mapper;
        }

        [HttpGet]
        [Route("{id}")]
        [ProducesResponseType(typeof(GetBookResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> Get(string id)
        {
            var book = await _mediator.Send(new GetBookQuery(id));

            if (book is null)
                return NotFound();
            
            return Ok(book);
        }
        
        [HttpGet]
        [ProducesResponseType(typeof(GetBooksResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> Get()
        {
            var books = await _mediator.Send(new GetBooksQuery());
            var response = new GetBooksResponse(books);
            return Ok(response);
        }
        
        [HttpPost]
        [ProducesResponseType(typeof(CreateBookResponse), (int) HttpStatusCode.Created)]
        [ProducesResponseType((int) HttpStatusCode.Conflict)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Post([FromBody] CreateBookRequest request)
        {
            var command = _mapper.Map<CreateBookCommand>(request);
            var book = await _mediator.Send(command);
            var response = _mapper.Map<CreateBookResponse>(book);
            return Created(new Uri($"http://localhost:5004/book/{response.Id}"), response);
        }
    }
}
