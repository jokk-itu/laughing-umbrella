using System;
using System.Threading.Tasks;
using MassTransit;

namespace Receive.Observers
{
    public class ReceiveObserver : IReceiveObserver
    {
        public async Task PreReceive(ReceiveContext context)
        {
            throw new NotImplementedException();
        }

        public async Task PostReceive(ReceiveContext context)
        {
            throw new NotImplementedException();
        }

        public async Task PostConsume<T>(ConsumeContext<T> context, TimeSpan duration, string consumerType) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task ConsumeFault<T>(ConsumeContext<T> context, TimeSpan duration, string consumerType, Exception exception) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task ReceiveFault(ReceiveContext context, Exception exception)
        {
            throw new NotImplementedException();
        }
    }
}