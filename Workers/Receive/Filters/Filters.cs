using System;
using System.Threading.Tasks;
using GreenPipes;
using MassTransit;

namespace Receive.Filters
{
    public class ConsumeFilter : IFilter<ConsumeContext>
    {
        public async Task Send(ConsumeContext context, IPipe<ConsumeContext> next)
        {
            Console.WriteLine($"ConsumeFilter with: {context.CorrelationId}");
            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
            context.CreateScope("consumeFilter_scope");
        }
    }
    
    
    public class ConsumeFilterWithConsumer<TContext> : IFilter<ConsumerConsumeContext<TContext>> where TContext : class
    {
        public async Task Send(ConsumerConsumeContext<TContext> context, IPipe<ConsumerConsumeContext<TContext>> next)
        {
            Console.WriteLine($"ConsumeFilterWithConsumer with: {context.CorrelationId}");
            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
            context.CreateScope("consumeFilterWithConsumer_scope");
        }
    }
    
    public class ConsumeFilterWithConsumerAndMessage<TContext, TMessage> : IFilter<ConsumerConsumeContext<TContext, TMessage>> 
        where TContext : class
        where TMessage : class
    {
        public async Task Send(ConsumerConsumeContext<TContext, TMessage> context, IPipe<ConsumerConsumeContext<TContext, TMessage>> next)
        {
            Console.WriteLine($"ConsumeFilterWithConsumerAndMessage with: {context.CorrelationId}, {System.Text.Json.JsonSerializer.Serialize(context.Message)}");
            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
            context.CreateScope("consumeFilterWithConsumer_scope");
        }
    }
}