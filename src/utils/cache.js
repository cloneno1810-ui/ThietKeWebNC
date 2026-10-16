// Bounded, process-local cache. Rejected loads are never cached. Generation checks
// prevent an in-flight read from restoring stale data after a successful write.
class Cache {
  constructor({ ttl = 30000, max = 100, now = Date.now } = {}) {
    this.ttl = ttl; this.max = max; this.now = now;
    this.entries = new Map(); this.generation = 0;
  }
  clear() { this.generation++; this.entries.clear(); }
  async get(key, load) {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.now()) return hit.promise;
    this.entries.delete(key);
    while (this.entries.size >= this.max) this.entries.delete(this.entries.keys().next().value);
    const generation = this.generation;
    const entry = { expires: this.now() + this.ttl };
    entry.promise = Promise.resolve().then(load).then(value => {
      if (generation === this.generation && this.entries.get(key) === entry) entry.expires = this.now() + this.ttl;
      return value;
    }).catch(error => { if (this.entries.get(key) === entry) this.entries.delete(key); throw error; });
    this.entries.set(key, entry);
    return entry.promise;
  }
}
const reports = new Cache();
function invalidateForQuery(text, rowCount) {
  if (rowCount > 0 && /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:bookings|rooms|room_types)\b/i.test(text)) reports.clear();
}
module.exports = { Cache, reports, invalidateForQuery };