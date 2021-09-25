using GreenPipes;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Receive.Filters;

namespace Receive.Definitions
{
    public class ConsumeDefinition : ConsumerDefinition<IConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator, IConsumerConfigurator<IConsumer> consumerConfigurator)
        {
            endpointConfigurator.UseFilter(new ConsumeFilter());
            
            consumerConfigurator.UseFilter(new ConsumeFilterWithConsumer<IConsumer>());
            
            consumerConfigurator.ConsumerMessage<object>(m => m.UseFilter(new ConsumeFilterWithConsumerAndMessage<IConsumer, object>()));
        }
    }
}