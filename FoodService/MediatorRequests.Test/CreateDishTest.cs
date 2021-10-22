using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatorRequests.CreateDish;
using Moq;
using Neo4j.Driver;
using Xunit;

namespace MediatorRequests.Test
{
    public class CreateDishTest
    {
        private readonly Mock<IMapper> _fakeMapper;

        private readonly Mock<IDriver> _fakeDriver;

        private readonly Mock<IAsyncSession> _fakeSession;

        private readonly Mock<IAsyncTransaction> _fakeTransaction;
        
        private readonly Mock<IResultCursor> _fakeResultCursor;

        private readonly Mock<IRecord> _fakeRecord;
        
        public CreateDishTest()
        {
            //Instantiate mocks
            _fakeDriver = new Mock<IDriver>();
            _fakeSession = new Mock<IAsyncSession>();
            _fakeMapper = new Mock<IMapper>();
            _fakeTransaction = new Mock<IAsyncTransaction>();
            _fakeResultCursor = new Mock<IResultCursor>();
            _fakeRecord = new Mock<IRecord>();
            
            //Setup mocks
            _fakeDriver.Setup(d => d.AsyncSession())
                .Returns(_fakeSession.Object)
                .Verifiable();
        }

        [Trait("Category", "Unit")]
        [Fact]
        public async Task Handle_GivenValid_ExpectDish()
        {
            //Arrange
            const string name = "Test";
            const int price = 1;
            var command = new CreateDishCommand
            {
                Name = name,
                Price = price
            };
            var expected = new Dish
            {
                Name = name,
                Price = price
            };
            _fakeMapper.Setup(m => m.Map<Dish>(_fakeRecord.Object))
                .Returns(expected)
                .Verifiable();
            
            _fakeResultCursor.Setup(r => r.PeekAsync())
                .ReturnsAsync(_fakeRecord.Object)
                .Verifiable();
            
            _fakeTransaction.Setup(t => t.RunAsync(
                    It.IsAny<string>(), It.IsAny<object>()))
                .ReturnsAsync(_fakeResultCursor.Object)
                .Verifiable();
            _fakeTransaction.Setup(t => t.CommitAsync())
                .Verifiable();
            
            _fakeSession.Setup(s =>
                    s.WriteTransactionAsync(It.IsAny<Func<IAsyncTransaction, Task<Dish>>>()))
                .Returns((Func<IAsyncTransaction, Task<Dish>> func) => func(_fakeTransaction.Object))
                .Verifiable();
            
            //Act
            var handler = new CreateDishHandler(_fakeDriver.Object, _fakeMapper.Object);
            var actual = await handler.Handle(command, CancellationToken.None);

            //Assert
            _fakeDriver.Verify();
            _fakeSession.Verify();
            _fakeTransaction.Verify();
            _fakeResultCursor.Verify();
            _fakeMapper.Verify();
            Assert.Equal(expected, actual);
        }
    }
}