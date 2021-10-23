using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Responses;
using Mediator.ReadGenders;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Authorize(Policy = "default")]
    [ApiController]
    [Route("gender")]
    public class GenderController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public GenderController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetGenders()
        {
            var (_, genders) = await _mediator.Send(new ReadGendersQuery());
            var response = _mapper.Map<ICollection<ReadGenderResponse>>(genders);
            return Ok(response);
        }
    }
}