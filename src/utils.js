import flatten from 'flat';

export function difference(a, b) {
    return a.filter(i => !b.includes(i));
}

export function intersect(a, b) {
    return a.filter(i => b.includes(i));
}

export function objectDiff(a, b) {
    // Flattens the object since it will be easier to display data this way
    a = flatten(a);
    b = flatten(b);

    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);

    // Calculate differences
    let addedKeys = difference(aKeys, bKeys);
    let removedKeys = difference(bKeys, aKeys);
    let existingKeys = intersect(aKeys, bKeys);

    // Rebuild object with only added pairs
    let added = addedKeys.reduce((acc, k) => {
        acc[k] = a[k];
        return acc;
    }, {});

    // Rebuild object with only removed pairs
    let removed = removedKeys.reduce((acc, k) => {
        acc[k] = b[k];
        return acc;
    }, {});

    // Rebuild object with only modified pairs (pairs that kept the same are ignored)
    let modified = existingKeys.reduce((acc, k) => {
        let ak = a[k];
        let bk = b[k];
        let objs = typeof ak === 'object' && typeof bk === 'object';

        if (
            !objs && ak !== bk ||
            objs && JSON.stringify(ak) !== JSON.stringify(bk)
        ) {
            acc[k] = {
                from: bk,
                to: ak,
            }
        }

        return acc;
    }, {});

    return {
        added, removed, modified,
    }
}

console.log(objectDiff({
    cost: 100,
    specs: {
        ram: 2
    },
}, {
    cost: 50,
    specs: {
        cpu: 'e5',
    },
}));