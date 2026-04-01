const fs = require('fs');
const initSqlJs = require('sql.js');

let SQL_PROMISE = initSqlJs();

class Database {
  constructor(filepath, mode, callback) {
    this.filepath = filepath ? filepath.replace('file:', '') : './ledger.db';
    this.db = null;
    this.queue = [];
    
    SQL_PROMISE.then(SQL => {
      try {
        if(fs.existsSync(this.filepath)) {
          this.db = new SQL.Database(fs.readFileSync(this.filepath));
        } else {
          this.db = new SQL.Database();
        }
      } catch (err) {
        console.error('Failed to init mock db:', err);
        this.db = new SQL.Database();
      }
      
      this.queue.forEach(q => q());
      this.queue = [];
      if(typeof callback === 'function') callback();
    });
  }

  _save() {
    if(this.db && this.filepath) {
       fs.writeFileSync(this.filepath, Buffer.from(this.db.export()));
    }
  }

  _ready(cb) {
    if(this.db) cb(); else this.queue.push(cb);
  }

  serialize(cb) { this._ready(cb); }

  run(query, params, cb) {
    if(typeof params === 'function') { cb = params; params = []; }
    if(!params) params = [];
    this._ready(() => {
       try {
         this.db.run(query, params);
         if (query.trim().toUpperCase().startsWith("INSERT") || query.trim().toUpperCase().startsWith("UPDATE") || query.trim().toUpperCase().startsWith("DELETE") || query.trim().toUpperCase().startsWith("CREATE")) {
             this._save();
         }
         if(cb) cb(null);
       } catch(e) { 
         if(cb) cb(e); else console.error("RUN ERR:", e, query, params);
       }
    });
    return this;
  }

  get(query, params, cb) {
    if(typeof params === 'function') { cb = params; params = []; }
    if(!params) params = [];
    this._ready(() => {
       try {
         const stmt = this.db.prepare(query);
         stmt.bind(params);
         if(stmt.step()) {
            const res = stmt.getAsObject();
            stmt.free();
            if(cb) cb(null, res);
         } else {
            stmt.free();
            if(cb) cb(null, undefined);
         }
       } catch(e) { 
         if(cb) cb(e); else console.error("GET ERR:", e, query, params);
       }
    });
    return this;
  }

  all(query, params, cb) {
    if(typeof params === 'function') { cb = params; params = []; }
    if(!params) params = [];
    this._ready(() => {
       try {
         const stmt = this.db.prepare(query);
         stmt.bind(params);
         const res = [];
         while(stmt.step()) res.push(stmt.getAsObject());
         stmt.free();
         if(cb) cb(null, res);
       } catch(e) { 
         if(cb) cb(e); else console.error("ALL ERR:", e, query, params); 
       }
    });
    return this;
  }
}

module.exports = { Database, verbose: () => module.exports };
