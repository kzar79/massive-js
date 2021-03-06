var assert = require("assert");
var helpers = require("./helpers");
var _ = require("underscore")._;
var db;

describe('Queryables', function () {
  before(function(done) {
    helpers.resetDb(function(err,res) {
      db = res;
      done();
    });
  });

  describe('Simple table queries without args', function () {
    it('returns all records on find with no args', function (done) {
      db.products.find(function(err,res){
        assert.equal(res.length, 4);
        done();
      });
    });
    it('returns first record with findOne no args', function (done) {
      db.products.findOne(function(err,res){
        assert.equal(res.id, 1);
        done();
      });
    });
  });

  describe('Simple table queries by primary key', function () {
    it('finds by a numeric key and returns a result object', function (done) {
      db.products.find(1, function(err, res) {
        assert.equal(res.id, 1);
        done();
      });
    });

    it('findOnes by a numeric key and returns a result object', function (done) {
      db.products.findOne(1, function(err, res) {
        assert.equal(res.id, 1);
        done();
      });
    });

    it('finds by a string/uuid key and returns a result object', function (done) {
      db.orders.findOne(function (err, order) {
        assert.notStrictEqual(order, undefined);
        db.orders.find(order.id, function(err, res) {
          assert.equal(res.id, order.id);
          done();
        });
      });
    });

    it('findOnes by a string/uuid key and returns a result object', function (done) {
      db.orders.findOne(function (err, order) {
        assert.notStrictEqual(order, undefined);
        db.orders.findOne(order.id, function(err, res) {
          assert.equal(res.id, order.id);
          done();
        });
      });
    });
  });

  describe('Simple queries with AND and OR', function () {
    it('returns Product 1 OR Product 2', function (done) {
      db.products.where("id=$1 OR id=$2", [1,2],function(err,res){
        assert.equal(res.length, 2);
        done();
      });
    });
    it('returns Product 1 AND Product 2', function (done) {
      db.products.where("id=$1 AND price=$2", [1,12.00],function(err,res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns Product 1 with params as not array', function (done) {
      db.products.where("id=$1", 1,function(err,res){
        assert.equal(res.length, 1);
        done();
      });
    });
  });

  describe('Simple queries with count', function () {
    it('returns 2 for OR id 1 or 2', function (done) {
      db.products.count("id=$1 OR id=$2", [1,2], function(err,res){
        assert.equal(res,2);
        done();
      });
    });
    it('returns 1 for id 1', function (done) {
      db.products.count("id=$1", [1], function(err,res){
        assert.equal(res, 1);
        done();
      });
    });
  });

  describe('More abstracted queries using findArgs in count', function () {
    it('returns 2 for OR id 1 or 2', function (done) {
      db.products.count({id: [1, 2]}, function(err,res){
        assert.equal(res,2);
        done();
      });
    });
    it('returns 1 for id 1', function (done) {
      db.products.count({id: 1}, function(err,res){
        assert.equal(res, 1);
        done();
      });
    });
    it('returns 4 for everything', function (done) {
      db.products.count({}, function(err,res){
        assert.equal(res, 4);
        done();
      });
    });
  });

  describe('Simple comparative queries', function () {
    it('returns product with id greater than 2', function (done) {
      db.products.find({"id > " : 2}, function(err,res){
        assert.equal(res[0].id, 3);
        done();
      });
    });
    it('returns product with id less than 2', function (done) {
      db.products.find({"id < " : 2}, function(err,res){
        assert.equal(res[0].id, 1);
        done();
      });
    });
    it('returns products IN 1 and 2', function (done) {
      db.products.find({id : [1,2]}, function(err,res){
        assert.equal(res[0].id, 1);
        done();
      });
    });
    it('returns product NOT IN 1 and 2', function (done) {
      db.products.find({"id <>" : [1,2]}, function(err,res){
        assert.equal(res[0].id, 3);
        done();
      });
    });
    it('returns products by finding a null field', function (done) {
      db.products.find({"tags": null}, function(err,res){
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 1);
        done();
      });
    });
    it('returns products by finding a non-null field', function (done) {
      db.products.find({"id != ": null}, function(err,res){
        assert.equal(res.length, 4);
        assert.equal(res[0].id, 1);
        done();
      });
    });
    it('returns products with a compound query including a null field', function (done) {
      db.products.find({"id": 1, "tags": null, price: 12.00}, function(err,res){
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 1);
        done();
      });
    });
  });

  describe('JSON queries', function () {
    it('finds a product matching the desired spec field in JSON', function (done) {
      db.products.findOne({'specs->>weight': 30}, function(err, product) {
        assert.equal(product.id, 3);
        assert.equal(product.specs.weight, 30);
        done();
      });
    });
    it('finds a product matching the desired spec index in JSON', function (done) {
      db.products.findOne({'specs->>4': 'array'}, function(err, product) {
        assert.equal(product.id, 4);
        assert.equal(product.specs[4], 'array');
        done();
      });
    });
    it('finds a product matching the desired spec path in JSON', function (done) {
      db.products.findOne({'specs#>>{dimensions,length}': 15}, function(err, product) {
        assert.equal(product.id, 2);
        assert.equal(product.specs.dimensions.length, 15);
        done();
      });
    });
    it('finds a product with a spec matching an IN list', function (done) {
      db.products.findOne({'specs->>weight': [30, 35]}, function(err, product) {
        assert.equal(product.id, 3);
        assert.equal(product.specs.weight, 30);
        done();
      });
    });
    it('mixes JSON and non-JSON predicates', function (done) {
      db.products.findOne({price: 35.00, 'specs->>weight': 30}, function(err, product) {
        assert.equal(product.id, 3);
        assert.equal(product.specs.weight, 30);
        done();
      });
    });
  });

  describe('Array operations', function () {
    it('filters by array fields containing a value', function (done) {
      db.products.find({'tags @>': ['tag2']}, function (err, res) {
        assert.equal(res.length, 2);
        assert.equal(res[0].id, 2);
        assert.equal(res[1].id, 3);
        done();
      });
    });

    it('filters by array fields contained in a value', function (done) {
      db.products.find({'tags <@': ['tag2', 'tag3', 'tag4']}, function (err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 3);
        done();
      });
    });

    it('filters by array fields overlapping a value', function (done) {
      db.products.find({'tags &&': ['tag3', 'tag4', 'tag5']}, function (err, res) {
        assert.equal(res.length, 2);
        assert.equal(res[0].id, 3);
        assert.equal(res[1].id, 4);
        done();
      });
    });

    it('allows falling back to a postgres-formatted array literal', function (done) {
      db.products.find({'tags @>': '{tag2}'}, function (err, res) {
        assert.equal(res.length, 2);
        assert.equal(res[0].id, 2);
        assert.equal(res[1].id, 3);
        done();
      });
    });

    it('handles apostrophes in array values', function (done) {
      db.products.find({'tags @>': ['tag\'quote']}, function (err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 4);
        done();
      });
    });

    it('handles commas in array values', function (done) {
      db.products.find({'tags @>': ['tag,comma']}, function (err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 4);
        done();
      });
    });

    it('handles braces in array values', function (done) {
      db.products.find({'tags @>': ['tag{brace}']}, function (err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 4);
        done();
      });
    });
  });

  describe('Limiting and Offsetting results', function () {
    it('returns 1 result with limit of 1', function (done) {
      db.products.find(null,{limit : 1}, function(err,res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns second result with limit of 1, offset of 1', function (done) {
      db.products.find({},{limit : 1, offset: 1}, function(err,res){
        assert.equal(res[0].id, 2);
        done();
      });
    });
    it('returns id and name if sending in columns', function (done) {
      db.products.find({},{columns :["id","name"]}, function(err,res){
        var keys = _.keys(res[0]);
        assert.equal(keys.length,2);
        done();
      });
    });
  });

  describe('Ordering results', function () {
    it('returns ascending order of products by price', function (done) {
      db.products.find({}, {order : "price"}, function(err,res){
        assert.equal(res.length, 4);
        assert.equal(res[0].id, 1);
        assert.equal(res[2].id, 3);
        done();
      });
    });
    it('returns descending order of products', function (done) {
      db.products.find({},{order : "id desc"}, function(err,res){
        assert.equal(res.length, 4);
        assert.equal(res[0].id, 4);
        assert.equal(res[2].id, 2);
        done();
      });
    });
  });

  describe('Casing issues', function () {
    it('returns users because we delimit OK', function (done) {
      db.Users.find({}, function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns the first user because we delimit OK', function (done) {
      db.Users.findOne(function(err,res){
        assert.equal(res.Id, 1);
        done();
      });
    });
    it('returns a subset of columns, when we delimit in the calling code', function (done) {
      db.Users.find({},{columns: ['"Id"','"Email"']}, function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns a single column, when we delimit in the calling code', function (done) {
      db.Users.find({},{columns: '"Email"'}, function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns users with a simple order by', function (done) {
      db.Users.find({}, {order: '"Email"'}, function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('returns users with a compound order by', function (done) {
      db.Users.find({}, {order: '"Email" asc, "Id" desc'}, function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
    it('counts all funny cased users', function (done) {
      db.Users.count(null, null, function(err, res){
        assert.equal(res, 1);
        done();
      });
    });
    it('counts funny cased users when we use a where and delimit the condition', function (done) {
      db.Users.count('"Email"=$1', ["test@test.com"], function(err, res){
        assert.equal(res, 1);
        done();
      });
    });
    it('returns users when we use a simple where', function (done) {
      db.Users.where('"Email"=$1', ["test@test.com"], function(err, res){
        assert.equal(res.length, 1);
        done();
      });
    });
  });

  describe('Full Text search', function () {
    it('returns 4 products for term "product"', function (done) {
      db.products.search({columns : ["name"], term: "Product"},function(err,res){
        assert.equal(res.length, 4);
        done();
      });
    });
    it('returns 1 products for term "3"', function (done) {
      db.products.search({columns : ["name"], term: "3"},function(err,res){
        assert.equal(res.length,1);
        done();
      });
    });
    it('returns 1 Users for term "test"', function (done) {
      db.Users.search({columns : ["Name"], term: "test"},function(err,res){
        assert.equal(res.length,1);
        done();
      });
    });
    it('returns 4 products for term "description" using multiple columns', function (done) {
      db.products.search({columns : ["Name", "description"], term: "description"},function(err,res){
        assert.equal(res.length,4);
        done();
      });
    });
    it('returns 0 products for term "none" using multiple columns', function (done) {
      db.products.search({columns : ["Name", "description"], term: "none"},function(err,res){
        assert.equal(res.length,0);
        done();
      });
    });
  });

  describe('View queries', function () {
    it('returns all records on find with no args', function (done) {
      db.popular_products.find(function(err,res) {
        assert.equal(res.length, 3);
        done();
      });
    });
    it('returns first record with findOne no args', function (done) {
      db.popular_products.findOne(function(err,res) {
        assert.equal(res.id, 1);
        done();
      });
    });
    it('handles multiple predicates', function (done) {
      db.popular_products.where("price=$1 OR price=$2", [12.00, 24.00],function(err,res) {
        assert.equal(res.length, 2);
        done();
      });
    });
    it('counts rows with where-style args', function (done) {
      db.popular_products.count("price=$1 OR price=$2", [12.00, 24.00],function(err,res) {
        assert.equal(res, 2);
        done();
      });
    });
    it('counts rows with find-style args', function (done) {
      db.popular_products.count({price: [12.00, 24.00]}, function(err, res) {
        assert.equal(res, 2);
        done();
      });
    });
    it('makes comparisons', function (done) {
      db.popular_products.find({"price > " : 30.00}, function(err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 4);
        done();
      });
    });
    it('applies offsets and limits', function (done) {
      db.popular_products.find({},{limit : 1, offset: 1}, function(err, res) {
        assert.equal(res.length, 1);
        assert.equal(res[0].id, 2);
        done();
      });
    });
    it('restricts columns', function (done) {
      db.popular_products.find({}, {columns :["id","price"]}, function(err, res) {
        var keys = _.keys(res[0]);
        assert.equal(keys.length,2);
        done();
      });
    });
    it('applies sorting', function (done) {
      db.popular_products.find({},{order : "id desc"}, function(err, res) {
        assert.equal(res.length, 3);
        assert.equal(res[0].id, 4);
        assert.equal(res[1].id, 2);
        assert.equal(res[2].id, 1);
        done();
      });
    });
  });

  describe('Streaming Results', function () {
    it('returns a readable stream', function (done) {
      db.products.find({}, {stream: true}, function(err, stream) {
        assert.ok(err === null);

        var result = [];

        stream.on('readable', function() {
          var res = stream.read();

          if (res) {
            result.push(res);
          }
        });

        stream.on('end', function () {
          assert.equal(4, result.length);
          done();
        });
      });
    });
  });
});
