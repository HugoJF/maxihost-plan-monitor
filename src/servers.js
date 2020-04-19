import mutator from './mutator';
import {intersect, difference, objectDiff} from "./utils";

let servers = [];

export function register(newServers) {
    let newIds = newServers.map(server => server.id);
    let currentIds = Object.values(servers).map(server => server.id);

    let addedIds = difference(newIds, currentIds);
    let removedIds = difference(currentIds, newIds);
    let existingIds = intersect(newIds, currentIds);

    let added = computeAdded(newServers, addedIds);
    let removed = computeRemoved(servers, removedIds);
    let modified = computeModified(servers, newServers, existingIds);

    servers = newServers;

    return {added, removed, modified};
}

function computeAdded(servers, added) {
    return servers.reduce((acc, server) => {
        if (added.includes(server.id)) {
            acc[server.id] = server;
        }
        return acc;
    }, {});
}

function computeRemoved(servers, removed) {
    return servers.reduce((acc, server) => {
        if (removed.includes(server.id)) {
            acc[server.id] = server;
        }
        return acc;
    }, {});
}

function computeModified(current, added, ids) {
    return ids.reduce((acc, id) => {
        let c = current.find(i => i.id === id);
        let a = added.find(i => i.id === id);

        acc[id] = objectDiff(a, c);
        return acc;
    }, {});
}

function saveToFile() {

}

function loadFromFile() {

}