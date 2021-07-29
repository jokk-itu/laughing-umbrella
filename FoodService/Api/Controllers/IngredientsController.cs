using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Ingredient.Request;
using Contracts.Ingredient.Responses;
using MediatorRequests.Requests.CreateIngredient;
using MediatorRequests.Requests.GetIngredient;
using MediatorRequests.Requests.GetIngredients;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Controllers
{
    [ApiController]
    [Route("ingredients")]
    public class IngredientsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public IngredientsController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }

        [HttpGet]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        public async Task<IActionResult> ReadIngredients()
        {
            var ingredients = await _mediator.Send(new GetIngredientsQuery());
            var response = _mapper.Map<ICollection<GetIngredientResponse>>(ingredients);
            return Ok(response);
        }

        [HttpGet]
        [Route("{id:int}")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        public async Task<IActionResult> ReadIngredient([FromRoute] int id)
        {
            var ingredient = await _mediator.Send(new GetIngredientQuery(id));
            var response = _mapper.Map<GetIngredientResponse>(ingredient);
            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType((int) HttpStatusCode.Created)]
        public async Task<IActionResult> CreateIngredient([FromBody] CreateIngredientRequest request)
        {
            var ingredient = await _mediator.Send(_mapper.Map<CreateIngredientCommand>(request));
            var response = _mapper.Map<CreateIngredientResponse>(ingredient);
            return Created(new Uri($"http://localhost:5002/ingredients/{response.Id}"), response);
        }
    }
}