using System;
using System.Threading.Tasks;
using MassTransit;
using MassTransit.Courier;
using MessageContracts;

namespace Receive.Consumers
{
    public class AccountConsumer : IConsumer<IAccountUpdate>
    {
        public async Task Consume(ConsumeContext<IAccountUpdate> context)
        {
            await Task.Run(() => Console.WriteLine(
                $"Received the following id: {context.Message.AccountId}, CorrelationId: {context.CorrelationId}"));

            var builder = new RoutingSlipBuilder(NewId.NextGuid());
            builder.AddActivity("Activity", new Uri("exchange:account-service"), new
            {
                Uri = new Uri("http://google.com")
            });
            var routingSlip = builder.Build();
            await context.Execute(routingSlip);
        }
    }
}