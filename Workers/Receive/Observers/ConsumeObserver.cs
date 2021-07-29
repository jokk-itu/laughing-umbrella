using System;
using System.Threading.Tasks;
using MassTransit;

namespace Receive.Observers
{
    public class ConsumeObserver : IConsumeObserver
    {
        public async Task PreConsume<T>(ConsumeContext<T> context) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task PostConsume<T>(ConsumeContext<T> context) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task ConsumeFault<T>(ConsumeContext<T> context, Exception exception) where T : class
        {
            throw new NotImplementedException();
        }
    }
}