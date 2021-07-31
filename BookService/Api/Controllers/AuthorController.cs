using System;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Contracts;
using MediatorRequests.CreateAuthor;
using MediatorRequests.GetAuthor;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;

namespace Api.Controllers
{
    [ApiController]
    [Route("author")]
    public class AuthorController : ControllerBase
    {
        private readonly ILogger<AuthorController> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public AuthorController(ILogger<AuthorController> logger, IMapper mapper, IMediator mediator)
        {
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
        }

        [HttpGet]
        [Route("{id}")]
        [ProducesResponseType(typeof(GetAuthorResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> Get(string id)
        {
            var author = await _mediator.Send(new GetAuthorQuery(id));

            if (author is null)
                return NotFound();

            var response = _mapper.Map<GetAuthorResponse>(author);
            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType(typeof(CreateAuthorResponse), (int) HttpStatusCode.Created)]
        public async Task<IActionResult> Post([FromBody] CreateAuthorRequest request)
        {
            var command = _mapper.Map<CreateAuthorCommand>(request);
            var author = await _mediator.Send(command);
            var response = _mapper.Map<CreateAuthorResponse>(author);
            return Created(new Uri($"http://localhost:5004/author/{response.Id}"), response);
        }
    }
}