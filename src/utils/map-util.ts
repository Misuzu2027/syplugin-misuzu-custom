export function areMapsEqual<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
    if (map1 == map2) {
        return true;
    }
    if (!map1 && map2) {
        return false;
    }
    if (map1 && !map2) {
        return false;
    }
    // 1. 比较两个 Map 的大小
    if (map1.size !== map2.size) {
        return false;
    }

    // 2. 逐项比较键值对
    for (let [key, value] of map1) {
        if (!map2.has(key) || map2.get(key) !== value) {
            return false;
        }
    }

    return true;
}
