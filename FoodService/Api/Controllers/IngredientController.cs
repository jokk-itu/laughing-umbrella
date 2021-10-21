using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Ingredient.Responses;
using Database;
using FoodService.Contracts.Ingredient.Requests;
using MediatorRequests.CreateIngredient;
using MediatorRequests.GetIngredient;
using MediatorRequests.GetIngredients;
using MediatorRequests.UpdateIngredient;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("ingredient")]
    public class IngredientController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public IngredientController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetIngredientsAsync()
        {
            var ingredients = await _mediator.Send(new GetIngredientsQuery());
            
            if (ingredients is null)
                return NotFound();
            
            var response = _mapper.Map<ICollection<GetIngredientResponse>>(ingredients);
            return Ok(response);
        }

        [HttpGet]
        [Route("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetIngredientAsync([FromRoute] int id)
        {
            var ingredient = await _mediator.Send(new GetIngredientQuery(id));

            if (ingredient is null)
                return NotFound();
            
            var response = _mapper.Map<GetIngredientResponse>(ingredient);
            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> PostIngredientAsync([FromBody] PostIngredientRequest request)
        {
            var ingredient = await _mediator.Send(_mapper.Map<CreateIngredientCommand>(request));
            var response = _mapper.Map<PostIngredientResponse>(ingredient);
            return Created(new Uri($"http://localhost:5002/ingredients/{response.Id}"), response);
        }

        [HttpPut]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PutIngredientAsync([FromBody] PutIngredientRequest request)
        {
            var command = _mapper.Map<UpdateIngredientCommand>(request);
            var result = await _mediator.Send(command);
            return result switch {
                StatusResult.Success => NoContent(),
                StatusResult.NotFound => NotFound(),
                StatusResult.Conflict => throw new Exception(),
                _ => throw new Exception()
            };
        }
    }
}