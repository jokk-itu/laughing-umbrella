using System;
using System.Threading.Tasks;
using MassTransit;
using MessageContracts;

namespace Receive
{
    public class AccountConsumer : IConsumer<IAccountUpdate>
    {
        public async Task Consume(ConsumeContext<IAccountUpdate> context)
        {
            await Task.Run(() => Console.WriteLine($"Received the following id: {context.Message.AccountId}, CorrelationId: {context.CorrelationId}"));
        }
    }
}