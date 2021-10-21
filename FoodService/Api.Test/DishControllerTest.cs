using System.Threading;
using System.Threading.Tasks;
using Api.Controllers;
using AutoMapper;
using Database.Entities.Nodes;
using FoodService.Contracts.Dish.Requests;
using FoodService.Contracts.Dish.Responses;
using MediatorRequests.CreateDish;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Api.Test
{
    public class DishControllerTest
    {
        private readonly Mock<IMediator> _fakeMediator;
        private readonly Mock<IMapper> _fakeMapper;

        public DishControllerTest()
        {
            _fakeMediator = new Mock<IMediator>();
            _fakeMapper = new Mock<IMapper>();
        }

        [Trait("Category", "Integration")]
        [Fact]
        public async Task PostDishAsync_GivenValid_ExpectCreated()
        {
            //Arrange
            const string name = "Test";
            const int price = 1;
            var givenRequest = new PostDishRequest()
            {
                Name = name,
                Price = price
            };
            var expectedResponse = new PostDishResponse()
            {
                Name = name,
                Price = price
            };
            var expectedDish = new Dish()
            {
                Name = name,
                Price = price
            };
            _fakeMediator.Setup(m => m.Send(It.IsAny<CreateDishCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedDish)
                .Verifiable();
            _fakeMapper.Setup(m => m.Map<PostDishResponse>(It.IsAny<Dish>()))
                .Returns(expectedResponse)
                .Verifiable();
            
            //Act
            var controller = new DishController(_fakeMediator.Object, _fakeMapper.Object);
            var response = await controller.PostDishAsync(givenRequest);
            var actualResponse = response as CreatedResult;
            
            //Assert
            _fakeMediator.Verify();
            _fakeMapper.Verify();
            Assert.NotNull(actualResponse);
            Assert.IsType<CreatedResult>(actualResponse);
            Assert.Equal(expectedResponse, actualResponse.Value);
        }
        
    }
}