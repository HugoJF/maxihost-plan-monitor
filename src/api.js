import axios from 'axios';
import _ from 'lodash';

const config = {
    headers: {
        Authorization: process.env.MAXIHOST_API_KEY,
    }
};

export async function servers() {
    let total = [];
    let url = 'https://api.maxihost.com/plans';

    // Paginate the entire /plans API
    while (url) {
        console.log('Requestig...');
        let request = await axios.get(url, config);

        if (request.status !== 200) {
            console.error(`GET request to ${url} returned status ${request.status}[${request.statusText}]`);
            process.exit(request.status);
        }

        let servers = _.get(request, 'data.servers');

        if (!servers) {
            console.log(`API request ${url} did not provide 'data.servers'`, servers);
        }

        total = [...total, ...servers];

        url = _.get(request, 'data.links.next');
    }

    return total;
}
