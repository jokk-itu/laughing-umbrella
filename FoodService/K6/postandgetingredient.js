import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 1000,
      maxDuration: '30s',
      gracefulStop: '5s'
    },
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0  }
      ]
    }
  }
}

export default function () {
  const payload = JSON.stringify({name: 'test', weight: 1});
  const params = { headers: {'Content-Type': 'application/json'}};
  http.post('http://localhost:5002/ingredient', payload, params);
  http.get('http://localhost:5002/ingredient');
  sleep(1);
}