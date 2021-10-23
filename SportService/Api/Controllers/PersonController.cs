using System;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Requests;
using Database;
using Mediator.CreatePerson;
using Mediator.ReadPerson;
using Mediator.ReadPersons;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Authorize(Policy = "default")]
    [ApiController]
    [Route("person")]
    public class PersonController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public PersonController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }
        
        [AllowAnonymous]
        [HttpGet]
        [Route("{id:long}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetPerson([FromRoute] long id)
        {
            var (status, person) = await _mediator.Send(new ReadPersonQuery(id));
            
            if (status == DatabaseStatusCode.NotFound)
                return NotFound();
            
            return Ok(person);
        }

        [AllowAnonymous]
        [HttpPost]
        [ProducesResponseType((int) HttpStatusCode.Created)]
        [ProducesResponseType((int) HttpStatusCode.Conflict)]
        public async Task<IActionResult> PostPerson([FromBody] CreatePersonRequest request)
        {
            var command = _mapper.Map<CreatePersonCommand>(request);
            var (status, person) = await _mediator.Send(command);
            if (status == DatabaseStatusCode.Conflict)
                return Conflict();
            
            return Created(
                $"{HttpContext.Request.Scheme}{HttpContext.Request.Host}/person/{person.Id}",
                person);
        }
        
        [HttpGet]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetPersons()
        {
            var (_, persons) = await _mediator.Send(new ReadPersonsQuery());
            return Ok(persons);
        }
    }
}