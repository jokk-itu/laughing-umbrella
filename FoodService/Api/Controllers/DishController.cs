using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FoodService.Contracts.Dish.Requests;
using FoodService.Contracts.Dish.Responses;
using MediatorRequests.CreateDish;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("dish")]
    public class DishController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public DishController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> PostDishAsync([FromBody] PostDishRequest request, CancellationToken cancellationToken = default)
        {
            var command = _mapper.Map<CreateDishCommand>(request);
            var dish = await _mediator.Send(command, cancellationToken);
            var response = _mapper.Map<PostDishResponse>(dish);
            return Created(new Uri($"http://localhost:5002/dish/{response.Id}"), response);
        }
    }
}